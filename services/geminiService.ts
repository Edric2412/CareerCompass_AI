import { AnalysisResult, PortfolioPreferences, CandidateProfileForPortfolio } from "../types";

// Removed hardcoded API_KEY and GoogleGenAI import
// Backend URL - in production this should be an env variable
const BACKEND_URL = 'http://localhost:8000';

export const analyzeProfile = async (
  resume: File,
  jdText: string,
  githubLinks: string
): Promise<AnalysisResult> => {

  const formData = new FormData();
  formData.append('resume', resume);
  if (jdText) formData.append('jd_text', jdText);
  if (githubLinks) formData.append('github_links', githubLinks);

  try {
    const response = await fetch(`${BACKEND_URL}/analyze-profile`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result as AnalysisResult;

  } catch (error) {
    console.error("Profile Analysis Failed:", error);
    throw error;
  }
};

// ---------------------------------------------------------
// Portfolio Generator
// ---------------------------------------------------------

export const generatePortfolioHtml = async (
  analysisResult: AnalysisResult,
  preferences: PortfolioPreferences
): Promise<string> => {
  try {
    const response = await fetch(`${BACKEND_URL}/portfolio/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        analysis_result: analysisResult,
        preferences: preferences,
      }),
    });

    if (!response.ok) throw new Error("Portfolio Generation Failed");
    const data = await response.json();
    return data.html_content;
  } catch (error) {
    console.error("Portfolio Error:", error);
    return "<h1>Error Generating Portfolio</h1><p>Please try again later.</p>";
  }
};

// ---------------------------------------------------------
// Interview Coach
// ---------------------------------------------------------

// Helper to keep topics client-side or simple dynamic
export const generateInterviewTopics = async (role: string): Promise<string[]> => {
  // For now, keep hardcoded or simple logic. 
  // If we want backend to generate topics, we can add a specific endpoint.
  // The user didn't strictly request a topics endpoint.
  return ["Behavioral", "Technical", "System Design", "Cultural Fit"];
};

export const generateInterviewQuestion = async (role: string, topic: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/interview/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, topic })
    });
    if (!response.ok) throw new Error("Question Gen Failed");
    return await response.json();
  } catch (error) {
    console.error("Question Error:", error);
    return {
      question_id: "error",
      question_text: "Could not generate question. Backend unreachable?",
      expected_keywords: [],
      hints: []
    };
  }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append("text", text);
    const response = await fetch(`${BACKEND_URL}/interview/speech`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.audio_base64; // null if not supported
  } catch (e) {
    return null;
  }
};

// Helper: Base64 to Blob
const base64ToBlob = (base64: string, mimeType: string) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const blob = base64ToBlob(base64Audio, mimeType);
    const formData = new FormData();
    formData.append("audio", blob, "recording.webm"); // filename needed

    const response = await fetch(`${BACKEND_URL}/interview/transcribe`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("Transcribe Failed");
    const data = await response.json();
    return data.transcript;
  } catch (error) {
    console.error("Transcribe Error:", error);
    return "Error transcribing audio.";
  }
};

export const evaluateInterviewAnswer = async (questionData: any, transcript: string) => {
  try {
    const response = await fetch(`${BACKEND_URL}/interview/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question_text: questionData.question_text || questionData, // handle if just string passed
        transcript: transcript
      })
    });
    if (!response.ok) throw new Error("Eval Failed");
    return await response.json();
  } catch (error) {
    console.error("Eval Error:", error);
    return null;
  }
};
