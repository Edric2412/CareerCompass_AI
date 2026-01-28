
import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { AnalysisResult, GithubProject, ResumeHighlightsResult, PortfolioPreferences, CandidateProfileForPortfolio, InterviewQuestion, InterviewEvaluationResult } from "../types";

const API_KEY = 'AIzaSyBjrspf5XSMi8s1fZMazsFHDeALxvRimig';

// ---------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------

// Helper to wait for a specified duration
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Wrapper for API calls to handle 429 Rate Limits with Exponential Backoff
const generateContentWithRetry = async (ai: GoogleGenAI, params: any, retries = 3, initialDelay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await ai.models.generateContent(params);
      return result;
    } catch (error: any) {
      // Check for Rate Limit (429) or Quota related errors
      // The error object from the SDK might wrap the actual response
      const message = error.message || JSON.stringify(error);
      const isQuotaError = error.status === 429 || 
                           error.code === 429 || 
                           message.includes('429') || 
                           message.includes('quota') || 
                           message.includes('RESOURCE_EXHAUSTED');
      
      if (isQuotaError && i < retries - 1) {
        const waitTime = initialDelay * Math.pow(2, i); // 2s, 4s, 8s...
        console.warn(`Gemini API Quota Hit (429). Retrying in ${waitTime}ms...`);
        await wait(waitTime);
        continue;
      }
      
      // If it's not a quota error, or we ran out of retries, throw it
      throw error;
    }
  }
  throw new Error("Max retries exceeded for Gemini API");
};

// Convert File to base64 for Gemini API
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

// Clean JSON string from Markdown code blocks
const cleanJson = (text: string): string => {
  if (!text) return "";
  return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
};

const cleanHtml = (text: string): string => {
    if (!text) return "";
    return text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
}

// ---------------------------------------------------------
// Schemas
// ---------------------------------------------------------

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

// Specific schema for the isolated GitHub analysis step
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

// Main Analysis Schema - GENERIC & DYNAMIC
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
                properties: { category: { type: Type.STRING }, score: { type: Type.NUMBER } },
                required: ["category", "score"]
            }
        },
        match_breakdown: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { role: { type: Type.STRING }, match_percentage: { type: Type.NUMBER } },
                required: ["role", "match_percentage"]
            }
        }
      },
      required: ["overall_match", "categories", "match_breakdown"]
    },
    market_analysis: {
      type: Type.OBJECT,
      properties: {
        role_demand: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
        candidate_percentile: { type: Type.NUMBER, description: "Candidate's standing (0-100) relative to other applicants in the current market." }
      },
      required: ["role_demand", "candidate_percentile"]
    },
    skill_distribution: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { category: { type: Type.STRING }, share_percent: { type: Type.NUMBER } },
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
                properties: { skill_name: { type: Type.STRING }, count: { type: Type.NUMBER } },
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
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT, 
                properties: { category: { type: Type.STRING }, hours: { type: Type.NUMBER } },
                required: ["category", "hours"]
            } 
        },
        phase_2: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT, 
                properties: { category: { type: Type.STRING }, hours: { type: Type.NUMBER } },
                required: ["category", "hours"]
            } 
        },
        phase_3: { 
            type: Type.ARRAY, 
            items: { 
                type: Type.OBJECT, 
                properties: { category: { type: Type.STRING }, hours: { type: Type.NUMBER } },
                required: ["category", "hours"]
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
                category: { type: Type.STRING } 
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
        candidate_name: { type: Type.STRING },
        candidate_headline: { type: Type.STRING },
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
    portfolio_template: { type: Type.STRING },
    interview_topics: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING }
    }
  },
  required: ["overall_scores", "market_analysis", "skill_distribution", "gap_skills", "competency_matrix", "jd_breakdown", "roadmap_effort", "roadmap_details", "roadmap_timeline", "employability_profile", "text_summaries", "assets", "portfolio_template", "interview_topics"]
};

const INTERVIEW_EVALUATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    question_id: { type: Type.STRING },
    question_text: { type: Type.STRING },
    final_transcript: { type: Type.STRING },
    overall_score: { type: Type.NUMBER },
    subscores: {
      type: Type.OBJECT,
      properties: {
        structure: { type: Type.NUMBER },
        technical_correctness: { type: Type.NUMBER },
        depth: { type: Type.NUMBER },
        clarity: { type: Type.NUMBER },
        examples_and_evidence: { type: Type.NUMBER },
        conciseness: { type: Type.NUMBER }
      },
      required: ["structure", "technical_correctness", "depth", "clarity", "examples_and_evidence", "conciseness"]
    },
    metrics: {
      type: Type.OBJECT,
      properties: {
        fluency_wpm: { type: Type.NUMBER },
        fillers_count: { type: Type.NUMBER },
        confidence_estimate: { type: Type.NUMBER }
      },
      required: ["fluency_wpm", "fillers_count", "confidence_estimate"]
    },
    timestamps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          start: { type: Type.NUMBER },
          end: { type: Type.NUMBER },
          text: { type: Type.STRING },
          issue: { type: Type.STRING }
        },
        required: ["start", "end", "text"]
      }
    },
    what_went_well: { type: Type.ARRAY, items: { type: Type.STRING } },
    what_to_improve: { type: Type.ARRAY, items: { type: Type.STRING } },
    better_answer: { type: Type.STRING },
    advice_action_items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['practice', 'reading', 'project', 'microtask'] },
          title: { type: Type.STRING },
          detail: { type: Type.STRING }
        },
        required: ["type", "title", "detail"]
      }
    }
  },
  required: ["overall_score", "subscores", "metrics", "what_went_well", "what_to_improve", "better_answer", "advice_action_items"]
};

const INTERVIEW_QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    question_id: { type: Type.STRING },
    question_text: { type: Type.STRING },
    expected_keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
    hints: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["question_id", "question_text", "expected_keywords", "hints"]
}

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
        const metaRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        if (!metaRes.ok) return null;
        const meta = await metaRes.json();

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

        const contentsRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
        let filesBundle = "";
        
        if (contentsRes.ok) {
            const contents = await contentsRes.json();
            const interestingFiles = [
                'README.md', 'package.json', 'requirements.txt', 'pyproject.toml', 
                'main.py', 'app.py', 'server.js', 'index.js', 'App.tsx', 'index.html', 'go.mod', 'Cargo.toml'
            ];
            
            const foundFiles = contents.filter((item: any) => 
                item.type === 'file' && interestingFiles.includes(item.name)
            );
            
            foundFiles.sort((a: any, b: any) => {
                 const aScore = a.name.startsWith('README') ? 0 : a.name.includes('json') || a.name.includes('txt') ? 1 : 2;
                 const bScore = b.name.startsWith('README') ? 0 : b.name.includes('json') || b.name.includes('txt') ? 1 : 2;
                 return aScore - bScore;
            });

            const targetFiles = foundFiles.slice(0, 4);

            for (const file of targetFiles) {
                const content = await fetchGithubFileContent(owner, repo, file.path);
                if (content) {
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

    const targetRepos = reposToAnalyze.slice(0, 3);
    
    const validRepoData = [];
    for (const r of targetRepos) {
        const data = await fetchGithubRepoData(r.owner, r.repo);
        if (data) validRepoData.push(data);
    }

    if (validRepoData.length === 0) return [];

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const results: GithubProject[] = [];

    for (const repoData of validRepoData) {
        const prompt = `
        You are CareerCompass AI – an expert GitHub repository analyst.
        Analyze the repo: ${repoData.repo_name}
        Files: ${repoData.files_bundle}
        
        Return STRICT JSON matching the GITHUB_DEEP_ANALYSIS_SCHEMA.
        `;

        try {
            // Using Retry Wrapper
            // Switched to gemini-2.5-flash for speed and higher quota limits
            const response = await generateContentWithRetry(ai, {
                model: 'gemini-2.5-flash',
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
                results.push({
                    name: raw.project_name,
                    summary: `${raw.project_type}: ${raw.short_description}`, 
                    tech_stack: raw.tech_stack,
                    complexity_rating: raw.complexity_rating,
                    resume_bullets: raw.recommended_resume_bullets,
                    improvement_suggestions: raw.improvement_suggestions
                });
            }
            
            // Add a delay between repo analyses to respect RPM limits
            await wait(2000);

        } catch (e) {
            console.error(`Github analysis failed`, e);
        }
    }
    return results;
};

// ---------------------------------------------------------
// Resume Highlights Analysis
// ---------------------------------------------------------
export const analyzeResumeHighlights = async (resumeFile: File): Promise<ResumeHighlightsResult | null> => {
  if (!resumeFile) return null;

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const resumePart = await fileToGenerativePart(resumeFile);

  const prompt = `
    Analyze resume. Return JSON matching RESUME_HIGHLIGHTS_SCHEMA.
    Identify segments, rate them (green/yellow/red), and provide actionable feedback.
  `;

  try {
    // Switched to gemini-2.5-flash for speed and quota
    const response = await generateContentWithRetry(ai, {
      model: 'gemini-2.5-flash',
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
    console.warn("Resume Highlights Failed", e);
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
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // SEQUENTIAL EXECUTION to prevent 429 Quota errors
  
  // 1. Analyze GitHub Repos (if any)
  let githubProjects: GithubProject[] = [];
  try {
      githubProjects = await analyzeGithubReposWithAPI(githubLinks);
  } catch (e) {
      console.warn("GitHub analysis error (non-fatal):", e);
  }
  
  // 2. Analyze Resume Highlights
  let resumeHighlights: ResumeHighlightsResult | null = null;
  try {
      // Delay before starting next major task
      if (githubProjects.length > 0) await wait(1500);
      resumeHighlights = await analyzeResumeHighlights(resume);
  } catch (e) {
      console.warn("Resume highlights error (non-fatal):", e);
  }
  
  const githubSummaryText = githubProjects.length > 0 
      ? githubProjects.map(p => `REPO: ${p.name}\nSUMMARY: ${p.summary}`).join('\n\n')
      : "No valid GitHub repositories found or analyzed.";

  const parts: any[] = [];
  if (resume) {
    parts.push(await fileToGenerativePart(resume));
  }

  // --- STRICT PERSONA PROMPT ---
  const mainPrompt = `
    You are CareerCompass AI, acting as a **Strict, Top-Tier Hiring Manager (FAANG Standard)**.
    Your goal is to provide a brutal, realistic assessment. Do not sugarcoat gaps.
    If projects are generic (e.g., "To-Do List", "Weather App"), rate them low and call them out.
    
    Task: Analyze the provided RESUME and GITHUB PROJECTS (if any).
    
    INPUTS:
    - Target JD Text: ${jdText || "UNSPECIFIED - Auto-detect best fit role from Resume"}
    - GitHub Summary: ${githubSummaryText}
    
    INSTRUCTIONS:
    0. **EXTRACTION**: Extract the candidate's Name and current professional Headline from the resume. Populate 'text_summaries.candidate_name' and 'text_summaries.candidate_headline'.

    1. **ROLE DETECTION & MARKET CHECK (CRITICAL)**: 
       - If 'Target JD Text' is UNSPECIFIED, determine the candidate's absolute strongest career path.
       - Use this **INFERRED ROLE** as the strict anchor for all analysis.
       - **Use Google Search** to find the CURRENT market demand (2024-2025 data).
       - **REALITY CHECK**: Explicitly check for layoffs, hiring freezes, or saturation in this field (e.g., Tech is saturating).
       - DO NOT default to 'High'. Use 'Medium' for stable markets and 'Low' for saturated ones.
       - Set 'market_analysis.role_demand' accordingly.
       - Estimate the 'market_analysis.candidate_percentile' (0-100) strictly based on their current skills vs. top market talent. 

    2. **Dynamic Competency Scoring**: 
       - Generate 6 competency categories relevant *only* to the Inferred Role. Be harsh on 'Expert' ratings.
    
    3. **Skill Gap Analysis**:
       - Identify what is missing for the *Inferred Role*.
    
    4. **Roadmap**:
       - Create a 90-day plan. 
       - **roadmap_effort**: Do NOT use fixed keys. Generate dynamic categories suitable for the role.
    
    5. **Assets**:
       - Write a Cover Letter and LinkedIn Summary tailored to the Inferred Role.
    
    6. **Portfolio Website**:
       - Generate a single-file HTML portfolio template.
       
    7. **Interview Preparation**:
       - Generate 5 BROAD, FOUNDATIONAL interview topic categories (strings).
       - Examples: "System Design", "Behavioral", "Data Structures", "Core Java", "Machine Learning Concepts".
       - DO NOT be too specific like "React Hooks useEffect" or "Java 8 Streams". Keep it high-level.
    
    8. **Strict Output**:
       - Follow the JSON schema exactly.
  `;
  
  parts.push({ text: mainPrompt });

  // 3. Main Analysis (with retry)
  // Ensure we wait a bit before the big request
  await wait(2000);

  const mainResponse = await generateContentWithRetry(ai, {
    model: 'gemini-3-pro-preview',
    contents: { parts: parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA,
      tools: [{ googleSearch: {} }] 
    },
  }, 4, 3000); // More retries for the main call

  const text = mainResponse.text;
  if (!text) throw new Error("No response from AI");
  
  const cleanedText = cleanJson(text);
  const mainResult = JSON.parse(cleanedText) as AnalysisResult;

  if (githubProjects.length > 0) mainResult.github_projects = githubProjects;
  if (resumeHighlights) mainResult.resume_highlights = resumeHighlights;

  return mainResult;
};

// ---------------------------------------------------------
// Portfolio Generator
// ---------------------------------------------------------

export const generatePortfolioHtml = async (
    analysisResult: AnalysisResult,
    preferences: PortfolioPreferences
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Map AnalysisResult to CandidateProfileForPortfolio
    const candidateProfile: CandidateProfileForPortfolio = {
        name: analysisResult.text_summaries.candidate_name || "Candidate",
        headline: analysisResult.text_summaries.candidate_headline || analysisResult.jd_breakdown.role_title,
        short_summary: analysisResult.text_summaries.profile_summary,
        key_skills: analysisResult.competency_matrix.map(area => ({
            category: area.area,
            skills: area.skills.map(s => s.name)
        })).slice(0, 4), // Limit to top 4 categories
        projects: analysisResult.github_projects.map(p => ({
            name: p.name,
            summary: p.summary,
            tech_stack: p.tech_stack,
            highlight_bullets: p.resume_bullets
        })).concat(
            analysisResult.github_projects.length === 0 ? [{
                name: "Key Project",
                summary: "A significant professional achievement demonstrating core competencies.",
                tech_stack: analysisResult.jd_breakdown.must_have_skills.slice(0, 3),
                highlight_bullets: ["Led successful initiative", "Improved efficiency by 20%"]
            }] : []
        ),
        links: {
            email: preferences.contact_email || "email@example.com",
            github: "https://github.com",
            linkedin: "https://linkedin.com",
            portfolio: "#"
        },
        raw_analysis_context: {
             // Pass specific parts of analysis that might contain publication/research info
             resume_highlights: analysisResult.resume_highlights?.segments,
             strengths: analysisResult.text_summaries.strengths,
             competencies: analysisResult.competency_matrix,
             full_summary: analysisResult.text_summaries.profile_summary
        }
    };

    const promptText = `
    You are the Portfolio Designer module of an app called CareerCompass AI.

    Context:
    The main app has ALREADY analyzed the user’s resume, GitHub, and target role.
    You are NOT responsible for scoring or gap analysis. Your ONLY job in this call is:

    → Given:
        1) a structured candidate_profile object
        2) a portfolio_preferences object selected by the user
    generate a SINGLE-FILE HTML portfolio website that matches the user’s style choices.

    The HTML will be shown inside the Portfolio tab and downloadable as portfolio.html.

    ======================================================
    INPUTS YOU RECEIVE
    ======================================================

    You will receive two JSON objects embedded in this prompt:

    1) candidate_profile:
    - name: string
    - headline: string
    - short_summary: string
    - key_skills: array of { category: string, skills: string[] }
    - projects: array of { name, summary, tech_stack, highlight_bullets }
    - links: { email, github, linkedin, portfolio }
    - raw_analysis_context: (Contains extra data like resume highlights. Use this to find Publications, Grants, or Awards if they exist)

    2) portfolio_preferences:
    - color_theme, mode, corners, layout_style, etc.
    - contact_email: string (User provided)
    - contact_phone: string (User provided)
    - custom_links: array of { id, label, url } (User provided dynamic links like Medium, Dribbble)

    You MUST use these two objects as the single source of truth for content and styling decisions.

    ======================================================
    DESIGN & LAYOUT REQUIREMENTS
    ======================================================

    Overall:
    - Build a modern, responsive portfolio page using Tailwind CSS (CDN).
    - Match the visual style to portfolio_preferences (colors, corners, fonts).
    
    **CRITICAL: NAVIGATION & LINKS**
    1. **Internal Navigation**: Do NOT use href="#id" because it breaks in sandboxed iframes (refused to connect).
       INSTEAD, output this exact script at the end of the body to handle smooth scrolling safely:
       <script>
         document.querySelectorAll('a[href^="#"]').forEach(anchor => {
             anchor.addEventListener('click', function (e) {
                 e.preventDefault();
                 const targetId = this.getAttribute('href').substring(1);
                 const target = document.getElementById(targetId);
                 if (target) target.scrollIntoView({ behavior: 'smooth' });
             });
         });
       </script>
       Use <a href="#about" ...> structure but rely on the script above for action.
    2. **External Links**: MUST use target="_blank" rel="noopener noreferrer".

    Content Strategy (Personalization):
    1. **Core Sections**: Hero, About, Skills, Projects, Contact.
    2. **Dynamic Sections**:
       - Scan 'raw_analysis_context' and 'projects'.
       - If you detect **Research Papers**, **Publications**, **Patents**, or **Grants**, YOU MUST CREATE A DEDICATED SECTION called "Research & Publications" (or similar).
       - If you detect **Awards**, **Certifications**, or **Honors**, create a section for them.
       - Do not limit yourself to just "Projects". Personalize the section titles based on the content (e.g. "Case Studies" for marketing/business).
    
    3. **Contact Section**:
       - Display "Email Me" button if 'contact_email' is present (mailto:).
       - Display "Call Me" button if 'contact_phone' is present (tel:).
       - Iterate through 'custom_links':
         - Create a button for each link.
         - Label it with 'link.label'.
         - Use 'link.url' as href (target="_blank").

    ======================================================
    APPLYING portfolio_preferences
    ======================================================
    
    (Use the standard mapping for color_theme, mode, corners, layout_style as defined previously).
    
    **Color Mapping**:
    - emerald → emerald-400/500
    - indigo → indigo-400/500
    - violet → violet-400/500
    - amber → amber-400/500
    - rose → rose-400/500
    
    **Dark Mode**:
    - If mode="dark", use bg-slate-950 text-slate-100. Cards bg-slate-900.
    
    **Section Order**:
    - Respect 'section_order' but intelligently insert dynamic sections (like Publications) where they fit best (usually after Skills or Projects).

    ======================================================
    OUTPUT FORMAT
    ======================================================

    You MUST return:
    - A complete, valid HTML document ONLY.
    - No JSON, no markdown, no explanations.
    - <script src="https://cdn.tailwindcss.com"></script> included.
    - Self-contained.

    ======================================================
    EMBEDDED INPUTS
    ======================================================

    Here is the candidate_profile JSON:
    ${JSON.stringify(candidateProfile, null, 2)}

    Here is the portfolio_preferences JSON:
    ${JSON.stringify(preferences, null, 2)}
    `;

    try {
        const response = await generateContentWithRetry(ai, {
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: promptText }] },
        });
        return cleanHtml(response.text || "");
    } catch (e) {
        console.error("Failed to generate portfolio", e);
        return "<!-- Error generating portfolio -->";
    }
};

// ---------------------------------------------------------
// Interview Simulator Functions
// ---------------------------------------------------------

// Helper for interview topics schema
const INTERVIEW_TOPICS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    topics: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["topics"]
};

export const generateInterviewTopics = async (role: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `
    Generate 5 BROAD, HIGH-LEVEL interview topic categories for a ${role} position.
    Examples: "System Design", "Behavioral", "Data Structures", "Market Trends", "Core Concepts".
    Avoid specific niche libraries.
    Return STRICT JSON matching schema: { topics: string[] }
  `;

  try {
      const response = await generateContentWithRetry(ai, {
          model: 'gemini-3-pro-preview',
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: INTERVIEW_TOPICS_SCHEMA
          }
      });
      const clean = cleanJson(response.text || "{}");
      const data = JSON.parse(clean);
      return data.topics || [];
  } catch (e) {
      console.error("Failed to generate fresh topics", e);
      return [];
  }
}

export const generateInterviewQuestion = async (role: string, topic: string): Promise<InterviewQuestion> => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const prompt = `
      Generate one single tough but fair interview question for a ${role} position regarding ${topic}. 
      Include 3-5 expected keywords and 1-2 hints for the interviewer.
      Return STRICT JSON matching the INTERVIEW_QUESTION_SCHEMA.
    `;
    
    const response = await generateContentWithRetry(ai, {
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: INTERVIEW_QUESTION_SCHEMA
        }
    });
    
    const clean = cleanJson(response.text || "{}");
    return JSON.parse(clean);
}

export const generateSpeech = async (text: string): Promise<string | null> => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
        const response = await generateContentWithRetry(ai, {
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
            }
        });

        // Extract audio base64
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return audioData || null;
    } catch (e) {
        console.error("TTS Generation failed", e);
        return null;
    }
}

export const transcribeAudio = async (audioBase64: string, mimeType: string = 'audio/webm'): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    try {
        const response = await generateContentWithRetry(ai, {
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: mimeType, data: audioBase64 } },
                    { text: "Transcribe this interview answer accurately. Return only the transcript text." }
                ]
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Transcription failed", e);
        return "";
    }
}

export const evaluateInterviewAnswer = async (question: InterviewQuestion, transcript: string): Promise<InterviewEvaluationResult> => {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `
        You are an expert Interview Coach. Evaluate this candidate's answer.
        
        Question: "${question.question_text}"
        Context/Keywords: ${question.expected_keywords.join(', ')}
        
        Candidate Transcript: "${transcript}"
        
        Task: Score the answer strictly on a 0-100 scale. Provide detailed feedback.
        Return STRICT JSON matching the INTERVIEW_EVALUATION_SCHEMA.
    `;
    
    const response = await generateContentWithRetry(ai, {
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            responseSchema: INTERVIEW_EVALUATION_SCHEMA
        }
    });
    
    const cleanedText = cleanJson(response.text || "{}");
    return JSON.parse(cleanedText);
}
