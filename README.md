# 🚀 CareerCompass AI
### *Your AI-Powered Career Strategist & Copilot*

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Google_Gemini-3_Pro-4285F4?style=for-the-badge&logo=google-gemini&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**CareerCompass AI** is a sophisticated career strategy platform designed to bridge the gap between academic artifacts and professional readiness. By leveraging the **Gemini 3 Pro** and **2.5 Flash** models, the application provides a "brutal" and realistic assessment of a candidate's profile against high-tier industry standards.

---

## ✨ Key Features

### 🔍 Deep Profile Analysis
*   **Resume Auditing**: Intelligent extraction and rating of resume segments (Green/Yellow/Red).
*   **GitHub Integration**: Deep analysis of project complexity, README quality, and tech stack from live repository links.
*   **Market Grounding**: Real-time market demand checks via Google Search integration to provide realistic hiring outlooks.

### 📈 90-Day Growth Roadmap
*   **Skill Gap Visualization**: Interactive charts showing the delta between current competencies and target role requirements.
*   **Execution Timeline**: A week-by-week action plan covering Foundation, Building, and Launch phases.
*   **Employability Projection**: Predictive modeling of your "Recruiter Visibility Score" over 90 days.

### 🎙️ AI Interview Coach
*   **Voice-Enabled Interaction**: High-fidelity Text-to-Speech (TTS) for interviewer questions.
*   **Real-time Transcription**: Speak your answers and watch as the AI transcribes and analyzes your speech patterns.
*   **Behavioral Evaluation**: Detailed feedback on structure, technical correctness, and confidence.

### 🎨 Portfolio Designer
*   **Single-File HTML Generation**: One-click generation of a fully responsive, Tailwind-powered portfolio website.
*   **Style Control**: Customize colors, layout vibes, and animation levels to match your personal brand.

---

## 🛠️ Technical Stack

-   **Frontend**: React 19 (ES6 Modules)
-   **Styling**: Tailwind CSS with custom Glassmorphism & Premium UI components
-   **AI Engine**: 
    -   `gemini-3-pro-preview` (Reasoning & Analysis)
    -   `gemini-2.5-flash` (Speed & Auxiliary Tasks)
    -   `gemini-2.5-flash-preview-tts` (Native Audio)
-   **Visualization**: Recharts (Radar, Area, and Bar Charts)
-   **Icons**: Lucide React
-   **APIs**: GitHub REST API for repository fetching

---

## 🚀 Getting Started

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/career-compass-ai.git
    ```

2.  **Environment Setup**
    The application requires a valid **Google Gemini API Key**. Ensure it is provided via your execution environment or `process.env.API_KEY`.

3.  **Local Execution**
    Open `index.html` in a modern browser supporting ES6 modules or serve using a local development server (e.g., Live Server, Vite, or NPX Serve).

---

## 🛡️ Privacy & Security
*   **Data Handling**: All files (Resumes/Images) are processed as base64 inline data directly to the Gemini API.
*   **Temporary Sessions**: CareerCompass AI does not utilize a persistent backend database; your data exists only within the state of your current browser session.

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ for the next generation of engineers and creators.*