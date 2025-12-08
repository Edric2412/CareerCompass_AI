import React, { useState, useMemo } from 'react';
import { generateInterviewQuestion, evaluateInterviewAnswer } from '../services/geminiService';
import { MessageCircle, Send, PlayCircle, Award, RefreshCcw } from 'lucide-react';
import { InterviewEvaluation } from '../types';

interface Props {
  role: string;
}

export const InterviewCoach: React.FC<Props> = ({ role }) => {
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<InterviewEvaluation | null>(null);
  const [loading, setLoading] = useState(false);

  // Shared Glass Card Classes
  const cardClass = "bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-3xl shadow-lg border border-slate-200/50 dark:border-white/10 transition-colors duration-300";
  const innerCardClass = "bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl";

  // --- Dynamic Topic Logic ---
  const topics = useMemo(() => {
    const r = role.toLowerCase();
    
    // Tech / Engineering
    if (r.includes('software') || r.includes('developer') || r.includes('engineer') || r.includes('frontend') || r.includes('backend') || r.includes('full stack')) {
        return ['Data Structures & Algo', 'System Design', 'Technical Frameworks', 'Behavioral', 'Debugging & Optimization'];
    }
    // Data Science / Analytics
    if (r.includes('data') || r.includes('analyst') || r.includes('scientist') || r.includes('machine learning') || r.includes('ai')) {
        return ['Statistics & Probability', 'Machine Learning Concepts', 'SQL & Database', 'Data Visualization', 'Case Study'];
    }
    // Product Management
    if (r.includes('product') || r.includes('manager') || r.includes('owner')) {
        return ['Product Sense', 'Product Strategy', 'Analytics & Metrics', 'Prioritization', 'Behavioral'];
    }
    // Design
    if (r.includes('design') || r.includes('ui') || r.includes('ux') || r.includes('creative')) {
        return ['Design Systems', 'User Research', 'Design Critique', 'Prototyping', 'Portfolio Review'];
    }
    // Marketing
    if (r.includes('marketing') || r.includes('seo') || r.includes('content') || r.includes('social')) {
        return ['Campaign Strategy', 'SEO/SEM', 'Content Strategy', 'Market Research', 'Behavioral'];
    }
    // Sales / Business
    if (r.includes('sales') || r.includes('business') || r.includes('account')) {
        return ['Sales Strategy', 'Negotiation', 'Client Relationships', 'Product Knowledge', 'Behavioral'];
    }
    // HR / Recruiter
    if (r.includes('hr') || r.includes('recruiter') || r.includes('human')) {
        return ['Talent Acquisition', 'Employee Relations', 'Conflict Resolution', 'Company Culture', 'Behavioral'];
    }

    // Default / General
    return ['Core Competencies', 'Situational Judgment', 'Behavioral', 'Problem Solving', 'Leadership'];
  }, [role]);

  const handleStart = async () => {
    if (!topic) return;
    setLoading(true);
    setQuestion('');
    setFeedback(null);
    setAnswer('');
    try {
      const q = await generateInterviewQuestion(role, topic);
      setQuestion(q || "Could not generate question.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer) return;
    setLoading(true);
    try {
      const result = await evaluateInterviewAnswer(question, answer);
      setFeedback(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn pb-12">
      <div className={`${cardClass} overflow-hidden`}>
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600/90 to-indigo-800/90 dark:from-indigo-900/80 dark:to-indigo-950/80 p-8 text-white backdrop-blur-md">
          <h2 className="text-2xl font-bold flex items-center font-display mb-2">
            <MessageCircle className="w-7 h-7 mr-3" />
            AI Interview Coach
          </h2>
          <p className="opacity-90 text-indigo-100 dark:text-indigo-200 font-body text-sm md:text-base leading-relaxed">
            Practice for your <span className="font-semibold text-white">{role}</span> role. Choose a topic, get a tailored question, and receive instant, actionable feedback.
          </p>
        </div>

        <div className="p-8 space-y-8">
          {/* Setup / Topic Selection */}
          {!question && (
            <div className="space-y-6">
              <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 font-display mb-4">Select a Topic to Practice</label>
                 <div className="flex gap-3 flex-wrap">
                    {topics.map(t => (
                        <button 
                            key={t}
                            onClick={() => setTopic(t)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold border transition-all font-body shadow-sm ${
                                topic === t 
                                ? 'bg-indigo-100/80 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-500/50 text-indigo-800 dark:text-indigo-200 transform scale-105' 
                                : 'bg-white/60 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-white/80 dark:hover:bg-white/10'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                 </div>
              </div>

              <button 
                  onClick={handleStart}
                  disabled={!topic || loading}
                  className="w-full mt-4 flex items-center justify-center py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-indigo-500/25 font-display text-lg"
              >
                  {loading ? (
                     <span className="flex items-center"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div> Generating Question...</span>
                  ) : (
                     <><PlayCircle className="w-5 h-5 mr-2" /> Start Interview Session</>
                  )}
              </button>
            </div>
          )}

          {/* Question & Answer Interface */}
          {question && !feedback && (
            <div className="space-y-8 animate-fadeIn">
              <div className="bg-indigo-50/60 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 shadow-inner">
                <h3 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest mb-3 font-display">Interview Question</h3>
                <p className="text-lg md:text-xl text-slate-900 dark:text-white font-medium leading-relaxed font-body">{question}</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 font-display">Your Answer</label>
                <textarea 
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className={`w-full h-48 p-5 ${innerCardClass} text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder-slate-400 font-body text-base resize-none shadow-inner transition-all`}
                    placeholder="Type your detailed answer here. Try to use the STAR method..."
                />
              </div>

              <button 
                  onClick={handleSubmitAnswer}
                  disabled={!answer || loading}
                  className="w-full flex items-center justify-center py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg hover:shadow-indigo-500/25 font-display text-lg"
              >
                  {loading ? (
                      <span className="flex items-center"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div> Evaluating Answer...</span>
                  ) : (
                      <><Send className="w-5 h-5 mr-2" /> Submit Answer</>
                  )}
              </button>
            </div>
          )}

          {/* Feedback Section */}
          {feedback && (
            <div className="space-y-6 animate-fadeIn">
               <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/10 pb-4">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">Evaluation Result</h3>
                  <div className={`px-4 py-1.5 rounded-full text-white font-bold shadow-md font-body text-sm ${
                      feedback.score >= 8 ? 'bg-emerald-500' : feedback.score >= 5 ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                      Score: {feedback.score}/10
                  </div>
               </div>

               <div className={`${innerCardClass} p-6 shadow-sm`}>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-3 font-display text-lg">Feedback</h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-body whitespace-pre-wrap">{feedback.feedback}</p>
               </div>

               <div className="bg-emerald-50/60 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100/60 dark:border-emerald-500/20 shadow-sm">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-400 mb-3 flex items-center font-display text-lg"><Award className="w-5 h-5 mr-2"/> Improved Answer Suggestion</h4>
                  <p className="text-slate-700 dark:text-slate-300 text-sm italic leading-relaxed font-body border-l-4 border-emerald-400/50 pl-4 py-1">"{feedback.better_answer}"</p>
               </div>

               <button 
                  onClick={() => { setQuestion(''); setFeedback(null); setAnswer(''); }}
                  className="w-full py-4 border-2 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all font-display flex items-center justify-center"
               >
                  <RefreshCcw className="w-5 h-5 mr-2" /> Practice Another Question
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};