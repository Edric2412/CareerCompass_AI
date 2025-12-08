
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, GithubProject, ResumeHighlightsResult } from "../types";

// Helper to convert File to base64
export const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper to clean JSON string from Markdown code blocks
const cleanJson = (text: string): string => {
  if (!text) return "";
  // Remove ```json ... ``` or just ``` ... ```
  return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
};

const GITHUB_PROJECT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    summary: { type: Type.STRING },
    tech_stack: { type: Type.ARRAY, items: { type: Type.STRING } },
    complexity_rating: { type: Type.NUMBER },
    resume_bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvement_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["name", "summary", "tech_stack", "complexity_rating", "resume_bullets", "improvement_suggestions"]
};

// Schema matching the new specific prompt for GitHub Analysis
const GITHUB_DEEP_ANALYSIS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        project_name: { type: Type.STRING },
        short_description: { type: Type.STRING },
        project_type: { type: Type.STRING },
        tech_stack: { type: Type.ARRAY, items: { type: Type.STRING } },
        complexity_rating: { type: Type.NUMBER },
        recommended_resume_bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
        improvement_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["project_name", "short_description", "project_type", "tech_stack", "complexity_rating", "recommended_resume_bullets", "improvement_suggestions"]
};


const RESUME_HIGHLIGHTS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    overall_feedback: { type: Type.STRING },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          section: { type: Type.STRING },
          original_text: { type: Type.STRING },
          rating: { type: Type.STRING, enum: ['green', 'yellow', 'red'] },
          label: { type: Type.STRING },
          comment: { type: Type.STRING },
          suggested_text: { type: Type.STRING },
        },
        required: ["id", "section", "original_text", "rating", "label", "comment"]
      }
    },
    summary_counts: {
      type: Type.OBJECT,
      properties: {
        green: { type: Type.NUMBER },
        yellow: { type: Type.NUMBER },
        red: { type: Type.NUMBER },
      },
      required: ["green", "yellow", "red"]
    }
  },
  required: ["overall_feedback", "segments", "summary_counts"]
};

const ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    overall_scores: {
      type: Type.OBJECT,
      properties: {
        overall_match: { type: Type.NUMBER },
        categories: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING },
                    score: { type: Type.NUMBER }
                },
                required: ["category", "score"]
            }
        },
        match_breakdown: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING },
                    match_percentage: { type: Type.NUMBER }
                },
                required: ["role", "match_percentage"]
            }
        }
      },
      required: ["overall_match", "categories", "match_breakdown"]
    },
    skill_distribution: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          share_percent: { type: Type.NUMBER },
        },
        required: ["category", "share_percent"]
      }
    },
    gap_skills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING },
          current_level: { type: Type.NUMBER },
          required_level: { type: Type.NUMBER },
          priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
        },
        required: ["skill", "current_level", "required_level", "priority"]
      }
    },
    competency_matrix: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING },
          skills: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                level: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'] },
                evidence_source: { type: Type.STRING, enum: ['resume', 'github', 'resume+github'] },
                evidence_comment: { type: Type.STRING },
              },
              required: ["name", "level", "evidence_source", "evidence_comment"]
            }
          }
        },
        required: ["area", "skills"]
      }
    },
    jd_breakdown: {
      type: Type.OBJECT,
      properties: {
        role_title: { type: Type.STRING },
        must_have_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        nice_to_have_skills: { type: Type.ARRAY, items: { type: Type.STRING } },
        responsibilities: { type: Type.ARRAY, items: { type: Type.STRING } },
        skill_frequency: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT,
                properties: {
                    skill_name: { type: Type.STRING },
                    count: { type: Type.NUMBER }
                },
                required: ["skill_name", "count"]
            } 
        },
        estimated_level: { type: Type.STRING },
        company_archetype: { type: Type.STRING },
      },
      required: ["role_title", "must_have_skills", "skill_frequency"]
    },
    company_fit: {
      type: Type.OBJECT,
      properties: {
        startup: { type: Type.NUMBER },
        mnc: { type: Type.NUMBER },
        saas: { type: Type.NUMBER },
        fintech: { type: Type.NUMBER },
        research_lab: { type: Type.NUMBER },
      }
    },
    roadmap_effort: {
      type: Type.OBJECT,
      properties: {
        phase_1: { 
            type: Type.OBJECT, 
            properties: {
                programming: { type: Type.NUMBER },
                data_analysis: { type: Type.NUMBER },
                ml_ai: { type: Type.NUMBER },
                extras: { type: Type.NUMBER },
                projects: { type: Type.NUMBER },
                interview_prep: { type: Type.NUMBER },
            } 
        },
        phase_2: { 
            type: Type.OBJECT, 
            properties: {
                programming: { type: Type.NUMBER },
                data_analysis: { type: Type.NUMBER },
                ml_ai: { type: Type.NUMBER },
                extras: { type: Type.NUMBER },
                projects: { type: Type.NUMBER },
                interview_prep: { type: Type.NUMBER },
            } 
        },
        phase_3: { 
            type: Type.OBJECT, 
            properties: {
                programming: { type: Type.NUMBER },
                data_analysis: { type: Type.NUMBER },
                ml_ai: { type: Type.NUMBER },
                extras: { type: Type.NUMBER },
                projects: { type: Type.NUMBER },
                interview_prep: { type: Type.NUMBER },
            } 
        },
      },
      required: ["phase_1", "phase_2", "phase_3"]
    },
    roadmap_details: {
        type: Type.OBJECT,
        properties: {
            phase_1_goals: { type: Type.ARRAY, items: { type: Type.STRING }},
            phase_2_goals: { type: Type.ARRAY, items: { type: Type.STRING }},
            phase_3_goals: { type: Type.ARRAY, items: { type: Type.STRING }}
        },
        required: ["phase_1_goals", "phase_2_goals", "phase_3_goals"]
    },
    roadmap_timeline: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                task_name: { type: Type.STRING },
                start_week: { type: Type.NUMBER },
                end_week: { type: Type.NUMBER },
                category: { type: Type.STRING, enum: ['Technical', 'Project', 'Career'] }
            },
            required: ["task_name", "start_week", "end_week", "category"]
        }
    },
    employability_profile: {
        type: Type.OBJECT,
        properties: {
            current_visibility_score: { type: Type.NUMBER },
            phase_1_projected_score: { type: Type.NUMBER },
            phase_2_projected_score: { type: Type.NUMBER },
            phase_3_projected_score: { type: Type.NUMBER }
        },
        required: ["current_visibility_score", "phase_1_projected_score", "phase_2_projected_score", "phase_3_projected_score"]
    },
    text_summaries: {
      type: Type.OBJECT,
      properties: {
        profile_summary: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggested_roles: { type: Type.ARRAY, items: { type: Type.STRING } },
        roadmap_summary: { type: Type.STRING },
      },
      required: ["profile_summary", "strengths", "weaknesses", "roadmap_summary"]
    },
    github_projects: {
      type: Type.ARRAY,
      items: GITHUB_PROJECT_SCHEMA
    },
    assets: {
        type: Type.OBJECT,
        properties: {
            resume_bullets_optimized: { type: Type.STRING },
            cover_letter: { type: Type.STRING },
            linkedin_summary: { type: Type.STRING },
            outreach_message: { type: Type.STRING }
        },
        required: ["resume_bullets_optimized", "cover_letter", "linkedin_summary", "outreach_message"]
    },
    portfolio_template: { type: Type.STRING, description: "A complete, single-file HTML string using Tailwind CSS for a personal portfolio website." }
  },
  required: ["overall_scores", "skill_distribution", "gap_skills", "competency_matrix", "jd_breakdown", "roadmap_effort", "roadmap_details", "roadmap_timeline", "employability_profile", "text_summaries", "assets", "portfolio_template"]
};

// ---------------------------------------------------------
// GitHub REST API Integration
// ---------------------------------------------------------

function parseGithubInput(input: string) {
    const rawLinks = input.split(/[\s,]+/).filter(Boolean);
    const repos: {owner: string, repo: string, url: string}[] = [];

    rawLinks.forEach(link => {
        let clean = link.trim();
        clean = clean.replace(/\/$/, '');
        const match = clean.match(/(?:github\.com\/|^)([a-zA-Z0-9-]{1,39})\/([a-zA-Z0-9-_\.]+)/);
        if (match && match[1] && match[2]) {
            repos.push({
                owner: match[1],
                repo: match[2],
                url: `https://github.com/${match[1]}/${match[2]}`
            });
        }
    });
    
    // Deduplicate
    const unique = new Map();
    repos.forEach(r => unique.set(r.url, r));
    return Array.from(unique.values());
}

async function fetchGithubFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (data.content && data.encoding === 'base64') {
            return atob(data.content);
        }
        return null;
    } catch {
        return null;
    }
}

async function fetchGithubRepoData(owner: string, repo: string) {
    try {
        // 1. Fetch Metadata
        const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!metaRes.ok) return null;
        const meta = await metaRes.json();

        // 2. Fetch Languages
        const langRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`);
        let langSummary = "";
        if (langRes.ok) {
            const langs = await langRes.json();
            const total = Object.values(langs).reduce((a: any, b: any) => a + b, 0) as number;
            langSummary = Object.entries(langs)
                .map(([l, bytes]) => `${l} ${Math.round((bytes as number / total) * 100)}%`)
                .slice(0, 5)
                .join(", ");
        }

        // 3. Fetch Root Contents to find important files
        const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
        let filesBundle = "";
        
        if (contentsRes.ok) {
            const contents = await contentsRes.json();
            // Prioritize files to read
            const interestingFiles = [
                'README.md', 'package.json', 'requirements.txt', 'pyproject.toml', 
                'main.py', 'app.py', 'server.js', 'index.js', 'App.tsx', 'index.html', 'go.mod', 'Cargo.toml'
            ];
            
            // Find matches in root
            const foundFiles = contents.filter((item: any) => 
                item.type === 'file' && interestingFiles.includes(item.name)
            );
            
            // Sort by priority (README first, then configs, then code)
            foundFiles.sort((a: any, b: any) => {
                 const aScore = a.name.startsWith('README') ? 0 : a.name.includes('json') || a.name.includes('txt') ? 1 : 2;
                 const bScore = b.name.startsWith('README') ? 0 : b.name.includes('json') || b.name.includes('txt') ? 1 : 2;
                 return aScore - bScore;
            });

            // Pick top 3-4 files to avoid rate limits
            const targetFiles = foundFiles.slice(0, 4);

            for (const file of targetFiles) {
                const content = await fetchGithubFileContent(owner, repo, file.path);
                if (content) {
                    // Truncate large files
                    const truncated = content.length > 8000 ? content.slice(0, 8000) + "\n...(truncated)..." : content;
                    filesBundle += `FILE: ${file.path}\n${truncated}\n\n`;
                }
            }
        }

        return {
            repo_name: meta.name,
            repo_url: meta.html_url,
            language_summary: langSummary,
            files_bundle: filesBundle
        };

    } catch (e) {
        console.warn(`Failed to fetch github data for ${owner}/${repo}`, e);
        return null;
    }
}

export const analyzeGithubReposWithAPI = async (githubLinks: string): Promise<GithubProject[]> => {
    if (!githubLinks || !githubLinks.trim()) return [];

    const reposToAnalyze = parseGithubInput(githubLinks);
    if (reposToAnalyze.length === 0) return [];

    // Limit to 3 repos to be safe with unauthenticated rate limits (approx 4-5 calls per repo)
    const targetRepos = reposToAnalyze.slice(0, 3);
    
    // Fetch data sequentially to be gentle on API
    const validRepoData = [];
    for (const r of targetRepos) {
        const data = await fetchGithubRepoData(r.owner, r.repo);
        if (data) validRepoData.push(data);
    }

    if (validRepoData.length === 0) return [];

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const results: GithubProject[] = [];

    // Analyze each repo individually to ensure high quality attention
    for (const repoData of validRepoData) {
        const prompt = `
        You are CareerCompass AI – an expert GitHub repository analyst for hiring managers.

        Your goal:
        Given the name of a GitHub repository and a curated bundle of its important files, infer what the project actually is and generate hiring-focused insights, EVEN IF THERE IS NO README.

        ==================================================
        INPUT YOU WILL RECEIVE
        ==================================================

        - repo_name: ${repoData.repo_name}
        - repo_url: ${repoData.repo_url}
        - language_summary: ${repoData.language_summary}
        - files_bundle:
        ${repoData.files_bundle}

        ==================================================
        HOW TO ANALYZE THE REPO
        ==================================================

        1. Understand Project Purpose
           - Read the main scripts and requirements/config files.
           - Infer: What kind of application it is (web app, API, CLI tool, ML project, etc.) and what the core functionality is.

        2. Infer Tech Stack
           - Use the languages in the code and requirements.

        3. Assess Complexity
           - Estimate project complexity on a 1–5 scale.

        4. Handle Missing or Weak READMEs
           - Rely on files_bundle: filenames, code structure, and content.

        ==================================================
        OUTPUT FORMAT (STRICT JSON)
        ==================================================

        Return ONLY JSON in this format:

        {
          "project_name": "<short name or title>",
          "short_description": "<2–3 sentence clear summary>",
          "project_type": "<e.g., 'web application', 'REST API', 'CLI tool'>",
          "tech_stack": ["Python", "Flask", ...],
          "complexity_rating": <integer 1-5>,
          "recommended_resume_bullets": ["<bullet 1>", "<bullet 2>"],
          "improvement_suggestions": ["<suggestion 1>", "<suggestion 2>"]
        }
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: GITHUB_DEEP_ANALYSIS_SCHEMA,
                },
            });
            const text = response.text;
            if (text) {
                const cleanedText = cleanJson(text);
                const raw = JSON.parse(cleanedText);
                
                // Map to existing GithubProject interface
                results.push({
                    name: raw.project_name,
                    summary: `${raw.project_type}: ${raw.short_description}`, // Combine for richer summary in existing UI
                    tech_stack: raw.tech_stack,
                    complexity_rating: raw.complexity_rating,
                    resume_bullets: raw.recommended_resume_bullets,
                    improvement_suggestions: raw.improvement_suggestions
                });
            }
        } catch (e) {
            console.error(`Github analysis failed for ${repoData.repo_name}`, e);
        }
    }

    return results;
};

// ---------------------------------------------------------
// Resume Highlights Analysis
// ---------------------------------------------------------
export const analyzeResumeHighlights = async (resumeFile: File): Promise<ResumeHighlightsResult | null> => {
  if (!resumeFile) return null;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const resumePart = await fileToGenerativePart(resumeFile);

  const prompt = `
    You are an expert Resume Reviewer.
    
    TASK:
    Review the attached resume text/image. Break it down into key segments (sections, bullets, summary lines) and evaluate each one.
    
    OUTPUT:
    Return a strictly structured JSON object containing:
    1. 'overall_feedback': A brief summary of the resume quality.
    2. 'segments': An array of objects, each with:
       - 'id': unique string (e.g., "seg_1")
       - 'section': Section name (e.g., "Experience", "Summary", "Skills")
       - 'original_text': The exact text from the resume.
       - 'rating': "green" (excellent), "yellow" (needs work), or "red" (weak).
       - 'label': Short judgment (e.g., "Strong quantification").
       - 'comment': Brief explanation of the rating.
       - 'suggested_text': An improved version (especially for yellow/red).
    3. 'summary_counts': Count of green, yellow, red segments.
    
    Aim for 15-30 segments to cover the whole resume comprehensively.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: [resumePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: RESUME_HIGHLIGHTS_SCHEMA,
      },
    });
    
    const text = response.text;
    if (!text) return null;
    const cleanedText = cleanJson(text);
    return JSON.parse(cleanedText) as ResumeHighlightsResult;

  } catch (e) {
    console.error("Resume highlights analysis failed", e);
    return null;
  }
};

// ---------------------------------------------------------
// Main Profile Analysis
// ---------------------------------------------------------

export const analyzeProfile = async (
  resume: File,
  jdText: string,
  githubLinks: string
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. Start Parallel tasks (GitHub, Resume Highlights)
  const githubAnalysisPromise = analyzeGithubReposWithAPI(githubLinks);
  const resumeHighlightsPromise = analyzeResumeHighlights(resume);

  // 2. Wait for GitHub analysis to complete FIRST so we can feed it into the main prompt
  // We need the GitHub summaries to generate the Competency Matrix accurately
  let githubProjects: GithubProject[] = [];
  try {
      githubProjects = await githubAnalysisPromise;
  } catch (e) {
      console.warn("GitHub analysis error (non-fatal):", e);
  }
  
  const githubSummaryText = githubProjects.length > 0 
      ? githubProjects.map(p => `REPO: ${p.name}\nSTACK: ${p.tech_stack.join(', ')}\nSUMMARY: ${p.summary}`).join('\n\n')
      : "No valid GitHub repositories found or analyzed.";

  // 3. Prepare Main Analysis Prompt
  const parts: any[] = [];
  if (resume) {
    parts.push(await fileToGenerativePart(resume));
  }

  const mainPrompt = `
    You are CareerCompass AI, an expert technical career assessor.
    
    Task: Analyze the provided RESUME and GITHUB PROJECTS against the target Job Description (JD).
    
    INPUTS:
    - Target JD Text: ${jdText || "General Entry Level Software/Data Role"}
    - GitHub Summary (from separate analysis): 
    ${githubSummaryText}
    
    INSTRUCTIONS:
    1. Score the candidate (0-100) on key dimensions based on the RESUME and JD.
       - **DYNAMIC RADAR**: Generate 6 distinct competency categories for 'overall_scores.categories' that are most relevant to this specific role (e.g. for a Data Scientist: Statistics, Python, SQL, ML, Visualization, Communication). Score each 0-100.
    2. **STRICT ROLE MATCHING**: 
       - Look for job titles EXPLICITLY found in the 'Target JD Text' or user input. 
       - If multiple titles are present (e.g. "Software Engineer" AND "Data Scientist"), provide a match % for each.
       - **CRITICAL**: Do NOT halluncinate or suggest roles that are not in the input text. Only breakdown the matches for the explicit target.
    3. Identify specific skill gaps.
    4. Create a 3-phase (90-day) learning roadmap (Gantt chart 'roadmap_timeline' + 'employability_profile' probability scores).
    5. Draft application assets (Cover letter, etc).
    6. Generate a simple, modern Portfolio Website HTML template.
    
    7. GENERATE COMPETENCY MATRIX:
       Generate a realistic, structured 'competency_matrix' based ONLY on evidence.
       - Categories: "Programming Languages", "Data Engineering & Databases", "Data Analysis & Visualization", "AI & Machine Learning", "Web Development & Frameworks", "Tools & Deployment".
       - Levels: 'Beginner', 'Intermediate', 'Advanced', 'Expert'.
       - Evidence Source: 'resume', 'github', or 'resume+github'.
       - Evidence Comment: 1-2 short phrases explaining WHY.
       - DO NOT hallucinate skills.
  `;
  
  parts.push({ text: mainPrompt });

  // 4. Launch Main Analysis
  const mainAnalysisPromise = ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
      tools: [{ googleSearch: {} }] 
    },
  });

  // 5. Wait for Main Result & Resume Highlights
  const [mainResponse, resumeHighlights] = await Promise.all([
      mainAnalysisPromise, 
      resumeHighlightsPromise
  ]);

  const text = mainResponse.text;
  if (!text) throw new Error("No response from AI");
  
  const cleanedText = cleanJson(text);
  const mainResult = JSON.parse(cleanedText) as AnalysisResult;

  // 6. Merge Data
  if (githubProjects && githubProjects.length > 0) {
      mainResult.github_projects = githubProjects;
  }
  
  if (resumeHighlights) {
      mainResult.resume_highlights = resumeHighlights;
  }

  return mainResult;
};

export const generateInterviewQuestion = async (role: string, topic: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate one single tough but fair technical interview question for a ${role} position regarding ${topic}. Return just the question text.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt
    });
    return response.text;
}

export const evaluateInterviewAnswer = async (question: string, answer: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Question: ${question}
        Candidate Answer: ${answer}
        
        Provide a JSON evaluation:
        {
            "score": number (0-10),
            "feedback": "string",
            "better_answer": "string"
        }
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    const cleanedText = cleanJson(response.text);
    return JSON.parse(cleanedText);
}
