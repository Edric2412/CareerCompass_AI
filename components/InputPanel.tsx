import React, { useState, useRef } from 'react';
import { Upload, FileText, Link as LinkIcon, Briefcase, ArrowRight, Sparkles, CheckCircle2, Search } from 'lucide-react';
import { UserInputs } from '../types';

interface InputPanelProps {
  inputs: UserInputs;
  setInputs: React.Dispatch<React.SetStateAction<UserInputs>>;
  onAnalyze: () => void;
  isLoading: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ inputs, setInputs, onAnalyze, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setInputs(prev => ({ ...prev, resumeFile: e.target.files![0] }));
    }
  };

  const handleChange = (field: keyof UserInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setInputs(prev => ({ ...prev, resumeFile: e.dataTransfer.files[0] }));
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 md:py-16 animate-fadeIn relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 dark:bg-indigo-500/30 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/30 rounded-full blur-[100px] -z-10 pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      {/* Hero Section */}
      <div className="text-center mb-12 space-y-4 relative z-10">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50/80 dark:bg-white/10 border border-indigo-100 dark:border-white/20 text-indigo-700 dark:text-indigo-200 text-xs font-semibold tracking-wide uppercase mb-2 shadow-sm backdrop-blur-md font-body">
          <Sparkles className="w-3 h-3 mr-1.5 text-indigo-600 dark:text-indigo-400" /> AI-Powered Career Strategist
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display drop-shadow-sm">
          CareerCompass <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-300 dark:to-blue-300">AI</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-body">
          Your AI Career Copilot. Upload your resume and target role to unlock personalized insights.
        </p>
      </div>

      {/* Main Glass Card */}
      <div className="relative z-10 backdrop-blur-2xl bg-white/60 dark:bg-black/40 rounded-3xl shadow-xl dark:shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-slate-200/60 dark:border-white/30 overflow-hidden flex flex-col lg:flex-row transition-all duration-300">
        
        {/* Left Column: Assets */}
        <div className="w-full lg:w-5/12 bg-slate-50/50 dark:bg-black/5 p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-slate-200/60 dark:border-white/20 flex flex-col gap-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center mb-1 font-display">
              <div className="p-2 bg-white dark:bg-white/20 rounded-lg text-indigo-600 dark:text-indigo-100 mr-3 border border-slate-200 dark:border-white/20 shadow-sm">
                <FileText size={20} />
              </div>
              Profile Assets
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-200 ml-11 font-body">Upload your credentials for analysis.</p>
          </div>

          {/* Resume Upload */}
          <div 
            className={`relative group cursor-pointer transition-all duration-300 ease-in-out border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center h-48 backdrop-blur-sm
              ${dragActive 
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/30 scale-[1.02]' 
                : 'border-slate-300 dark:border-white/30 hover:border-indigo-400 dark:hover:border-indigo-300 hover:bg-white/50 dark:hover:bg-white/10'
              }
              ${inputs.resumeFile ? 'bg-indigo-50/30 dark:bg-indigo-500/20 border-indigo-400 dark:border-indigo-400/50' : 'bg-transparent'}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".pdf,.png,.jpg,.jpeg" 
              onChange={handleResumeChange} 
            />
            
            {inputs.resumeFile ? (
              <div className="animate-fadeIn flex flex-col items-center">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-100 rounded-full flex items-center justify-center mb-3 shadow-sm border border-emerald-200 dark:border-emerald-400/50">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-1 max-w-[200px] break-all font-body">
                  {inputs.resumeFile.name}
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-200 mt-1 font-body">Ready for analysis</p>
                <span className="mt-3 text-xs text-indigo-600 dark:text-indigo-200 font-medium hover:underline transition-all font-body">Change File</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-white dark:bg-white/20 text-slate-400 dark:text-slate-200 rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-200 dark:border-white/20 group-hover:text-indigo-500 dark:group-hover:text-indigo-200 group-hover:scale-110 transition-all">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-white transition-colors font-body">
                  Drag & Drop your Resume
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-300 mt-1 font-body">PDF or Image (Max 10MB)</p>
              </>
            )}
          </div>

          {/* GitHub Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-100 flex items-center justify-between font-display">
              Key GitHub Repositories
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-200 font-medium bg-slate-100 dark:bg-white/20 px-2 py-0.5 rounded-full font-body border border-slate-200 dark:border-white/20">Optional</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-4 w-4 text-slate-400 dark:text-slate-300" />
              </div>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-3 bg-white/60 dark:bg-white/10 border border-slate-200 dark:border-white/20 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all shadow-sm font-body backdrop-blur-sm"
                placeholder="Paste links to key repositories..."
                value={inputs.githubLinks}
                onChange={(e) => handleChange('githubLinks', e.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1.5 ml-1 font-body">
              <Search size={12} /> AI reads the README & metadata.
            </p>
          </div>
        </div>

        {/* Right Column: Job & Actions - Updated background to match left column */}
        <div className="w-full lg:w-7/12 p-8 md:p-10 flex flex-col bg-slate-50/50 dark:bg-black/5">
          <div className="mb-6">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center mb-1 font-display">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/30 rounded-lg text-blue-600 dark:text-blue-100 mr-3 border border-blue-100 dark:border-blue-400/30 shadow-sm">
                <Briefcase size={20} />
              </div>
              Target Role
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-300 ml-11 font-body">Describe the position you are aiming for.</p>
          </div>

          <div className="flex-1 flex flex-col gap-2">
             <label className="text-sm font-semibold text-slate-700 dark:text-slate-100 font-display">Job Description / Requirements <span className="text-rose-500 dark:text-rose-400">*</span></label>
             <div className="relative flex-1 group">
               <textarea
                 className="w-full h-full min-h-[240px] p-4 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 border border-slate-200 dark:border-white/20 focus:border-indigo-300 dark:focus:border-white/30 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none shadow-sm font-body backdrop-blur-sm"
                 placeholder="Paste the full job description here. Include responsibilities, required skills, and any other relevant details..."
                 value={inputs.jdText}
                 onChange={(e) => handleChange('jdText', e.target.value)}
               />
               <div className="absolute bottom-4 right-4 text-xs text-slate-500 dark:text-slate-300 bg-white/90 dark:bg-black/50 backdrop-blur-md px-2 py-1 rounded-md border border-slate-200 dark:border-white/10 shadow-sm pointer-events-none font-body">
                 {inputs.jdText.length} chars
               </div>
             </div>
             <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 ml-1 mt-1 font-body">
               <Sparkles size={12} /> The AI uses this to calculate match score.
             </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/20">
            <button
              onClick={onAnalyze}
              disabled={isLoading || !inputs.resumeFile}
              className={`w-full group relative overflow-hidden rounded-xl py-4 font-bold text-white shadow-lg transition-all duration-300 transform font-display border border-transparent
                ${isLoading || !inputs.resumeFile 
                  ? 'bg-slate-300 dark:bg-slate-700/60 text-slate-500 cursor-not-allowed shadow-none' 
                  : 'bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-600/90 dark:to-blue-600/90 hover:from-indigo-500 hover:to-blue-500 hover:scale-[1.01] hover:shadow-indigo-500/40 backdrop-blur-md'}
              `}
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Processing Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze My Profile</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
              {!isLoading && inputs.resumeFile && (
                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0" />
              )}
            </button>
            {!inputs.resumeFile && (
               <p className="text-center text-xs text-slate-400 dark:text-slate-400 mt-3 font-body">Please upload a resume to proceed.</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-12 text-center flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity duration-500">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 font-display">Powered By</p>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold font-body">
           <span className="flex items-center"><Sparkles className="w-4 h-4 mr-1 text-indigo-500 dark:text-indigo-400"/> Google Gemini 3 Pro</span>
        </div>
      </div>
    </div>
  );
};