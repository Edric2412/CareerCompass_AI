
import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  steps: string[];
  currentStep: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ steps, currentStep }) => {
  // Calculate progress percentage for the bar
  const progress = Math.min(((currentStep + 0.5) / steps.length) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md transition-opacity duration-500" />

      {/* Main Glassmorphism Card */}
      <div className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-2xl p-8 overflow-hidden animate-fadeIn transition-colors duration-300">
        
        {/* Decorative Background Blobs */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-400/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative z-10">
          <div className="text-center mb-8">
             <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
             </div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight font-display">Analyzing Profile</h2>
             <p className="text-indigo-600 dark:text-indigo-400 font-medium mt-1 text-sm font-body">Gemini 3 Pro is reasoning...</p>
          </div>

          <div className="space-y-5 relative pl-2">
             {/* Vertical Connector Line */}
             <div className="absolute left-[19px] top-3 bottom-6 w-0.5 bg-slate-200/60 dark:bg-slate-700/60 -z-10" />

             {steps.map((step, idx) => {
                 const isCompleted = idx < currentStep;
                 const isCurrent = idx === currentStep;
                 const isPending = idx > currentStep;
                 
                 return (
                     <div 
                        key={idx} 
                        className={`flex items-center gap-4 transition-all duration-500 ${isCurrent ? 'translate-x-2' : ''} ${isPending ? 'opacity-40' : 'opacity-100'}`}
                     >
                         {/* Status Indicator Circle */}
                         <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors duration-300 shadow-sm
                             ${isCompleted 
                                ? 'border-indigo-500 bg-indigo-500' 
                                : isCurrent 
                                    ? 'border-indigo-500 bg-white dark:bg-slate-800' 
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}
                         `}>
                             {isCompleted ? (
                                 <CheckCircle2 className="w-5 h-5 text-white" />
                             ) : isCurrent ? (
                                 <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping" />
                             ) : (
                                 <div className="w-2.5 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                             )}
                         </div>
                         
                         {/* Text */}
                         <span className={`text-sm font-medium transition-colors font-body ${isCurrent ? 'text-indigo-800 dark:text-indigo-300 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                             {step}
                         </span>
                     </div>
                 )
             })}
          </div>

          {/* Bottom Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mb-2 font-medium font-body">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    style={{ width: `${progress}%` }}
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
