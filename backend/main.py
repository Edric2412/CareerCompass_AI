from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

from .services.gemini_service import (
    analyze_profile_full,
    generate_interview_question, 
    evaluate_interview_answer,
    transcribe_audio,
    generate_speech,
    generate_portfolio
)
from .schemas import (
    AnalysisResult, 
    InterviewQuestionRequest, InterviewQuestionResponse,
    InterviewEvaluationRequest, InterviewEvaluationResponse,
    PortfolioRequest, PortfolioResponse
)

app = FastAPI(title="CareerCompass AI API")

# CORS Setup
origins = [
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:5173",
    "*" # For development convenience
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "CareerCompass AI Backend is Running"}

@app.post("/analyze-profile", response_model=AnalysisResult)
async def analyze_profile_endpoint(
    resume: UploadFile = File(...),
    jd_text: Optional[str] = Form(None),
    github_links: Optional[str] = Form(None)
):
    try:
        # Validate API Key
        if not os.environ.get("GEMINI_API_KEY"):
            raise HTTPException(status_code=500, detail="Server misconfiguration: GEMINI_API_KEY not set.")

        result = await analyze_profile_full(
            resume_file=resume,
            jd_text=jd_text or "",
            github_links=github_links or ""
        )
        return result
    except Exception as e:
        print(f"Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Interview Coach Routes ---

@app.post("/interview/questions", response_model=InterviewQuestionResponse)
async def get_interview_question(req: InterviewQuestionRequest):
    result = await generate_interview_question(req.role, req.topic)
    return result

@app.post("/interview/evaluate", response_model=InterviewEvaluationResponse)
async def evaluate_answer(req: InterviewEvaluationRequest):
    result = await evaluate_interview_answer(req.question_text, req.transcript)
    return result

@app.post("/interview/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    content = await audio.read()
    text = await transcribe_audio(content, audio.content_type)
    return {"transcript": text}

@app.post("/interview/speech")
async def speech(text: str = Form(...)):
    # TTS Placeholder
    audio_base64 = await generate_speech(text)
    return {"audio_base64": audio_base64}


# --- Portfolio Routes ---

@app.post("/portfolio/generate", response_model=PortfolioResponse)
async def create_portfolio(req: PortfolioRequest):
    html = await generate_portfolio(req)
    return {"html_content": html}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
