
import React, { useState, useEffect } from 'react';
import { InputPanel } from './components/InputPanel';
import { Dashboard } from './components/Dashboard';
import { LoadingOverlay } from './components/LoadingOverlay';
import { BackgroundParticles } from './components/BackgroundParticles';
import { UserInputs, ViewState, AnalysisResult } from './types';
import { analyzeProfile } from './services/geminiService';
import { Sun, Moon } from 'lucide-react';

const LOADING_STEPS = [
  "Reading Resume & Documents...",
  "Extracting Career Context...",
  "Fetching GitHub Data...",
  "Reviewing Resume Highlights...",
  "Analyzing Job Description...",
  "Calculating Competency Scores...",
  "Identifying Skill Gaps...",
  "Drafting 90-Day Roadmap...",
  "Generating Application Assets..."
];

const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check system preference on load
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const [inputs, setInputs] = useState<UserInputs>({
    resumeFile: null,
    githubLinks: '',
    jdText: ''
  });

  const handleAnalyze = async () => {
    if (!inputs.resumeFile) return;
    
    setIsLoading(true);
    setLoadingStep(0);
    setError(null);

    // Simulate progress while waiting for API
    const progressInterval = setInterval(() => {
      setLoadingStep(prev => {
        // Keep advancing until the last step, wait there for actual completion
        if (prev < LOADING_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 2000); // Advance every 2 seconds roughly matching expected latency

    try {
      const result = await analyzeProfile(
        inputs.resumeFile,
        inputs.jdText,
        inputs.githubLinks
      );
      
      clearInterval(progressInterval);
      setLoadingStep(LOADING_STEPS.length - 1); // Jump to final step
      
      // Small delay to show completion before switching view
      setTimeout(() => {
        setAnalysisResult(result);
        setViewState('dashboard');
        setIsLoading(false);
      }, 800);

    } catch (err) {
      clearInterval(progressInterval);
      console.error(err);
      setError("Analysis failed. Please try again. Ensure your API key is valid and files are readable.");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setViewState('input');
    setInputs({
      resumeFile: null,
      githubLinks: '',
      jdText: ''
    });
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-300 relative overflow-hidden">
      
      {/* Animated Background Particles */}
      <BackgroundParticles isDarkMode={isDarkMode} />

      {/* Theme Toggle Button (Only visible in Input view, handled by Navbar in Dashboard view) */}
      {viewState === 'input' && (
          <button 
            onClick={toggleTheme}
            className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg hover:scale-105 transition-all group"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400 group-hover:rotate-90 transition-transform" />
            ) : (
                <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform" />
            )}
          </button>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <LoadingOverlay steps={LOADING_STEPS} currentStep={loadingStep} />
      )}

      <div className="relative z-10">
        {viewState === 'input' && (
            <>
            <InputPanel 
                inputs={inputs} 
                setInputs={setInputs} 
                onAnalyze={handleAnalyze} 
                isLoading={isLoading} 
            />
            {error && (
                <div className="max-w-md mx-auto mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-xl text-center animate-pulse border border-red-200 dark:border-red-800 shadow-sm text-sm font-medium mb-8">
                {error}
                </div>
            )}
            </>
        )}

        {viewState === 'dashboard' && analysisResult && (
            <Dashboard 
                data={analysisResult} 
                onReset={handleReset} 
                isDarkMode={isDarkMode} 
                toggleTheme={toggleTheme}
            />
        )}
      </div>
    </div>
  );
};

export default App;
