import os
import time
import base64
import json
import google.generativeai as genai
from fastapi import UploadFile
from typing import List, Optional
import typing_extensions as typing

# Import Schemas
from ..schemas import (
    AnalysisResult, 
    GithubDeepAnalysisResult, 
    ResumeHighlightsResult, 
    GithubProject,
    InterviewQuestionResponse,
    InterviewEvaluationResponse,
    PortfolioRequest,
    PortfolioResponse
)
from .github_service import parse_github_input, fetch_github_repo_data

# Initialize Client
# IMPORTANT: In a real app, use os.environ["GEMINI_API_KEY"]
# For this migration, we will read it from environment variable.
API_KEY = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=API_KEY)

# Helper to read file content
async def read_file_content(file: UploadFile) -> str:
    content = await file.read()
    # Attempt to decode as text if possible, or return raw structure if using 1.5 Pro with PDF
    # For simplicity in this migration, let's assume text-based or rely on GenAI file API if needed.
    # But GenAI File API requires uploading. Sending raw bytes in strict JSON mode is tricky.
    # We will try to decode as utf-8 (assuming text resume) or if PDF, we need the File API.
    # For now, let's assume text extraction happened on frontend? No, frontend sent file.
    # Okay, for PDF support without File API, we need to use the `parts` with valid mime type.
    return content

# Helper to sanitize schema and INLINE references
def get_clean_schema(pydantic_model):
    schema = pydantic_model.model_json_schema()
    defs = schema.pop('$defs', {})

    def resolve_refs(node):
        if isinstance(node, dict):
            # 1. Resolve Ref
            if '$ref' in node:
                ref_key = node['$ref'].split('/')[-1]
                if ref_key in defs:
                    resolved = defs[ref_key].copy()
                    return resolve_refs(resolved)
            
            # 2. Handle anyOf (Flatten Optional)
            if 'anyOf' in node:
                for option in node['anyOf']:
                    # Resolve recursively
                    resolved_option = resolve_refs(option)
                    # If it's not null, use it as the type
                    if resolved_option.get('type') != 'null':
                        return resolved_option
                # Fallback
                return resolve_refs(node['anyOf'][0])

            # 3. Clean unsupported keys
            for key in ['default', 'title', 'additionalProperties']:
                if key in node:
                    del node[key]
            
            # 4. Recurse for all values
            return {k: resolve_refs(v) for k, v in node.items()}
            
        elif isinstance(node, list):
            return [resolve_refs(item) for item in node]
        
        return node

    return resolve_refs(schema)

# Helper for Retry
async def generate_with_retry(model_name: str, contents: list, schema: any, retries=3):
    model = genai.GenerativeModel(model_name)
    
    # Sanitize and INLINE the schema
    clean_schema = get_clean_schema(schema)
    
    # Configuration for structured output
    generation_config = genai.GenerationConfig(
        response_mime_type="application/json",
        response_schema=clean_schema
    )

    for i in range(retries):
        try:
            response = model.generate_content(
                contents,
                generation_config=generation_config
            )
            return json.loads(response.text)
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                time.sleep(2 * (i + 1))
                continue
            print(f"GenAI Error: {e}")
            raise e
    raise Exception("Max retries exceeded")


async def analyze_github_repos(github_links: str) -> List[GithubProject]:
    if not github_links:
        return []
    
    repos = parse_github_input(github_links)
    if not repos:
        return []
        
    target_repos = repos[:3]
    results = []
    
    for r in target_repos:
        data = fetch_github_repo_data(r['owner'], r['repo'])
        if not data:
            continue
            
        prompt = f"""
        You are CareerCompass AI – an expert GitHub repository analyst.
        Analyze the repo: {data['repo_name']}
        Files: {data['files_bundle']}
        
        Return STRICT JSON matching the schema.
        """
        
        try:
            # Using flash suitable for high volume
            raw_result = await generate_with_retry(
                model_name='gemini-3-flash-preview',
                contents=[prompt],
                schema=GithubDeepAnalysisResult
            )
            
            # Convert dict to Pydantic
            parsed_result = GithubDeepAnalysisResult(**raw_result)
            
            results.append(GithubProject(
                name=parsed_result.project_name,
                summary=f"{parsed_result.project_type}: {parsed_result.short_description}",
                tech_stack=parsed_result.tech_stack,
                complexity_rating=parsed_result.complexity_rating,
                resume_bullets=parsed_result.recommended_resume_bullets,
                improvement_suggestions=parsed_result.improvement_suggestions
            ))
            
            time.sleep(1) # Rate limit courtesy
            
        except Exception as e:
            print(f"Error analyzing repo {r['repo']}: {e}")
            
    return results

async def analyze_resume_highlights(file_bytes: bytes, mime_type: str) -> Optional[ResumeHighlightsResult]:
    try:
        # Prepare content part
        file_part = {
            "mime_type": mime_type,
            "data": file_bytes
        }
    
        prompt = """
        Analyze resume. Identify segments, rate them (green/yellow/red), and provide actionable feedback.
        """
        
        raw_result = await generate_with_retry(
            model_name='gemini-3-flash-preview',
            contents=[file_part, prompt],
            schema=ResumeHighlightsResult
        )
        return ResumeHighlightsResult(**raw_result)
    except Exception as e:
        print(f"Resume Highlight Error: {e}")
        return None

async def analyze_profile_full(
    resume_file: UploadFile,
    jd_text: str,
    github_links: str
) -> AnalysisResult:
    
    # Read file once
    resume_bytes = await resume_file.read()
    mime_type = resume_file.content_type or "application/pdf"

    # 1. Analyze GitHub
    github_projects = await analyze_github_repos(github_links)
    
    # 2. Analyze Resume Highlights
    resume_highlights = await analyze_resume_highlights(resume_bytes, mime_type)
    
    # Prepare Summary
    github_summary_text = ""
    if github_projects:
        github_summary_text = "\n\n".join([f"REPO: {p.name}\nSUMMARY: {p.summary}" for p in github_projects])
    else:
        github_summary_text = "No valid GitHub repositories found."

    # 3. Main Analysis
    file_part = {
        "mime_type": mime_type,
        "data": resume_bytes
    }
    
    main_prompt = f"""
    You are CareerCompass AI, acting as a **Strict, Top-Tier Hiring Manager (FAANG Standard)**.
    Your goal is to provide a brutal, realistic assessment.
    
    INPUTS:
    - Target JD Text: {jd_text or "UNSPECIFIED - Auto-detect best fit role from Resume"}
    - GitHub Summary: {github_summary_text}
    
    INSTRUCTIONS:
    1. ROLE DETECTION & MARKET CHECK.
    2. Dynamic Competency Scoring & Skill Gap Analysis.
    3. Roadmap (90-day plan).
    4. Assets (Cover Letter, LinkedIn Summary).
    5. Portfolio Website Template.
    6. Interview Preparation Topics.
    
    Return STRICT JSON matching the AnalysisResult schema.
    """
    
    raw_result = await generate_with_retry(
        model_name='gemini-3-flash-preview',
        contents=[file_part, main_prompt],
        schema=AnalysisResult,
        retries=4
    )
    
    result = AnalysisResult(**raw_result)
    
    # Merge sub-results
    if github_projects:
        result.github_projects = github_projects
    if resume_highlights:
        result.resume_highlights = resume_highlights
        
    return result

# ---------------------------------------------------------
# Interview Coach Functions
# ---------------------------------------------------------

async def generate_interview_question(role: str, topic: str) -> dict:
    prompt = f"""
    Generate a challenging interview question for a {role} candidate.
    Topic: {topic}
    
    Return JSON matching InterviewQuestionResponse with:
    - question_id (unique string)
    - question_text
    - expected_keywords (list of 3-5 technical terms)
    - hints (list of 2 hints)
    """
    
    try:
        raw_result = await generate_with_retry(
            model_name='gemini-3-flash-preview',
            contents=[prompt],
            schema=InterviewQuestionResponse
        )
        return raw_result
    except Exception as e:
        print(f"Interview Question Error: {e}")
        # Fallback stub
        return {
            "question_id": "fallback_1",
            "question_text": "Describe a challenging project you worked on.",
            "expected_keywords": ["project", "challenges", "solutions"],
            "hints": ["Focus on your contribution", "Use STAR method"]
        }

async def evaluate_interview_answer(question_text: str, transcript: str) -> dict:
    prompt = f"""
    Evaluate this interview answer.
    Question: {question_text}
    Candidate Answer (Transcript): {transcript}
    
    Return JSON matching InterviewEvaluationResponse with:
    - overall_score (0-100)
    - metrics:
        - clarity (0-100)
        - technical_accuracy (0-100)
        - confidence_estimate (0.0 to 1.0)
    - what_went_well (list of strings)
    - what_to_improve (list of strings)
    - better_answer (an ideal example answer)
    """
    
    try:
        raw_result = await generate_with_retry(
            model_name='gemini-3-flash-preview',
            contents=[prompt],
            schema=InterviewEvaluationResponse
        )
        return raw_result
    except Exception as e:
        print(f"Evaluation Error: {e}")
        # Return error structure matching schema to prevent UI crash
        return {
            "overall_score": 0,
            "metrics": {
                "clarity": 0, 
                "technical_accuracy": 0, 
                "confidence_estimate": 0.0
            },
            "what_went_well": [],
            "what_to_improve": ["Error processing evaluation."],
            "better_answer": "N/A"
        }

async def transcribe_audio(audio_bytes: bytes, mime_type: str) -> str:
    # Uses Gemini 2.5 Flash (multimodal) directly
    try:
        file_part = {
            "mime_type": mime_type,
            "data": audio_bytes
        }
        
        # We don't need a schema for simple text output
        model = genai.GenerativeModel('gemini-2.5-flash') # Mapping "Gemini 2.5" to latest exp
        response = model.generate_content([
            file_part, 
            "Transcribe this audio exactly. Return ONLY the text."
        ])
        return response.text
    except Exception as e:
        print(f"Transcription Error: {e}")
        return "Error transcribing audio."

async def generate_speech(text: str) -> Optional[str]:
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-tts')
        response = model.generate_content(text)
        
        # Check for audio parts
        if response.parts:
            for part in response.parts:
                if part.inline_data:
                    # Return base64 encoded audio
                    return base64.b64encode(part.inline_data.data).decode('utf-8')
        
        print(f"TTS: No audio data in response for '{text[:20]}...'")
        return None
    except Exception as e:
        print(f"TTS Error: {e}")
        return None 

# ---------------------------------------------------------
# Portfolio Builder Functions
# ---------------------------------------------------------

async def generate_portfolio(req: PortfolioRequest) -> str:
    # Use Pro model for coding
    prompt = f"""
    Generate a Single-Page HTML Portfolio for this candidate.
    
    DESIGN PREFERENCES:
    - Theme Color: {req.preferences.color_theme} (Use tailwind colors like bg-{req.preferences.color_theme}-600)
    - Mode: {req.preferences.mode}
    - Layout: {req.preferences.layout_style} (Classic, Split, or Centered)
    - Vibes: {req.preferences.font_vibe} font style, {req.preferences.corners} corners.
    - Animation: {req.preferences.animation_level}
    - Navbar: {req.preferences.nav_style}
    
    CONTACT INFO:
    - Email: {req.preferences.contact_email}
    - Phone: {req.preferences.contact_phone}
    - Socials: {req.preferences.custom_links}
    
    Candidate Data:
    {req.analysis_result.model_dump_json()}
    
    Requirements:
    - Use TailwindCSS via CDN (script tag).
    - Responsive design.
    - Sections: {req.preferences.section_order}
    - If Mode is Dark, force dark background and light text.
    - Return ONLY the raw HTML string in the `html_content` field.
    """
    
    try:
        raw_result = await generate_with_retry(
            model_name='gemini-3-flash-preview', # Uses Pro
            contents=[prompt],
            schema=PortfolioResponse
        )
        return raw_result['html_content']
    except Exception as e:
        print(f"Portfolio Error: {e}")
        return f"<h1>Error generating portfolio</h1><p>Backend details: {str(e)}</p>"
