# 🚀 CareerCompass AI
### *Your AI-Powered Career Strategist & Copilot*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**CareerCompass AI** is a sophisticated career strategy platform designed to bridge the gap between academic artifacts and professional readiness. By leveraging the **Gemini 3 Flash/Pro** and **2.5 Flash** models through a dedicated Python backend, the application provides a "brutal" and realistic assessment of a candidate's profile against high-tier industry standards.

---

## ✨ Key Features

### 🔍 Deep Profile Analysis
*   **Resume Auditing**: Intelligent extraction and rating of resume segments (Green/Yellow/Red).
*   **GitHub Integration**: Deep analysis of project complexity, README quality, and tech stack from live repository links.
*   **Market Grounding**: Real-time competency scoring with market-aware percentile placement.

### 📈 90-Day Growth Roadmap
*   **Skill Gap Visualization**: Interactive charts showing the delta between current competencies and target role requirements.
*   **Execution Timeline**: A week-by-week action plan covering Foundation, Building, and Launch phases.
*   **Employability Projection**: Predictive modeling of your "Recruiter Visibility Score" over 90 days.

### 🎙️ AI Interview Coach
*   **Voice-Enabled Interaction**: High-fidelity Text-to-Speech (TTS) for interviewer questions.
*   **Real-time Transcription**: Speak your answers and watch as the AI transcribes and analyzes your speech patterns.
*   **Behavioral Evaluation**: Detailed feedback on clarity, technical accuracy, and confidence with structured improvement suggestions.

### 🎨 Portfolio Designer
*   **Single-File HTML Generation**: One-click generation of a fully responsive, Tailwind-powered portfolio website using Gemini 3 Pro.
*   **Advanced Customization**: Control theme colors, layout styles (Classic/Split/Centered), fonts, animations, and navigation patterns.
*   **Contact & Social Links**: Add custom social links and contact information.

---

## 🏗️ Architecture

### Backend (Python + FastAPI)
*   **Framework**: FastAPI with async/await support
*   **AI Integration**: Google Generative AI SDK with schema sanitization for Gemini compatibility
*   **Services**:
    *   `analyze_profile_full`: Comprehensive resume and GitHub analysis
    *   `generate_interview_question`: Dynamic question generation
    *   `evaluate_interview_answer`: Detailed answer evaluation with metrics
    *   `transcribe_audio`: Speech-to-text transcription
    *   `generate_portfolio`: HTML portfolio generation
*   **CORS**: Configured for local development (localhost:3000)

### Frontend (React + TypeScript)
*   **Framework**: React 19 with ES6 modules
*   **Build Tool**: Vite for fast HMR
*   **Styling**: Tailwind CSS with custom Glassmorphism & Premium UI components
*   **State Management**: React hooks (useState, useMemo)
*   **Visualization**: Recharts (Radar, Area, Pie, and Bar Charts)
*   **Icons**: Lucide React

---

## 🛠️ Technical Stack

### Backend
-   **Language**: Python 3.11+
-   **Framework**: FastAPI
-   **AI Models**: 
    *   `gemini-3-flash-preview` (General Analysis & Interviews)
    *   `gemini-3-pro-preview` (Portfolio Generation)
    *   `gemini-2.5-flash` (Audio Transcription)
    *   `gemini-2.5-flash-tts` (Text-to-Speech)
-   **External APIs**: GitHub REST API

### Frontend
-   **Framework**: React 19 + TypeScript
-   **Build**: Vite
-   **Styling**: Tailwind CSS
-   **Charts**: Recharts
-   **Icons**: Lucide React
-   **APIs**: GitHub REST API for repository fetching

---

## 🚀 Getting Started

### Prerequisites
-   Python 3.11+
-   Node.js 18+
-   Google Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/career-compass-ai.git
cd career-compass-ai
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Configure Environment
Create a `.env` file in the `backend` directory:
```env
GEMINI_API_KEY=your_api_key_here
```

#### Start the Backend Server
```bash
# From the project root or backend directory
uvicorn backend.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Install Dependencies
```bash
npm install
```

#### Start the Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## 📁 Project Structure

```
CareerCompass_AI/
├── backend/
│   ├── services/
│   │   ├── gemini_service.py    # AI model integration
│   │   └── github_service.py    # GitHub API integration
│   ├── schemas.py               # Pydantic models
│   ├── main.py                  # FastAPI app & routes
│   ├── requirements.txt         # Python dependencies
│   └── .env                     # Environment variables
├── components/
│   ├── Dashboard.tsx            # Main dashboard UI
│   ├── InterviewCoach.tsx       # Interview practice module
│   └── PortfolioBuilder.tsx     # Portfolio generation UI
├── services/
│   └── geminiService.ts         # Frontend API client
├── index.html
├── main.tsx
└── package.json
```

---

## 🔌 API Endpoints

### Analysis
-   `POST /analyze-profile` - Full profile analysis (resume + GitHub + JD)

### Interview Coach
-   `POST /interview/questions` - Generate interview questions
-   `POST /interview/evaluate` - Evaluate candidate answers
-   `POST /interview/transcribe` - Transcribe audio to text
-   `POST /interview/speech` - Generate speech from text (TTS)

### Portfolio
-   `POST /portfolio/generate` - Generate custom HTML portfolio

---

## 🛡️ Privacy & Security

*   **Data Handling**: All files (Resumes/PDFs) are processed via multipart/form-data and sent directly to the Gemini API.
*   **No Persistent Storage**: The backend is stateless; no user data is stored in databases.
*   **API Key Security**: Gemini API key is stored server-side in environment variables, never exposed to the client.
*   **CORS**: Configured for development; tighten for production deployment.

---

## 🚧 Known Issues & Limitations

*   **Model Availability**: Some preview models (`gemini-3-*`) may not be available to all API keys. Check Google AI Studio for model access.
*   **Rate Limits**: The application includes retry logic, but heavy usage may hit API quotas.
*   **TTS Support**: Text-to-Speech functionality requires `gemini-2.5-flash-tts` model access.

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Built with ❤️ for the next generation of engineers and creators.*
