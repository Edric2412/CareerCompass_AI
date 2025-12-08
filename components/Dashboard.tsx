import React, { useState } from 'react';
import { AnalysisResult } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { CheckCircle, XCircle, Copy, Terminal, MessageSquare, Briefcase, Award, Globe, Code, FileText, ArrowRight, Sun, Moon, TrendingUp, Calendar, AlertTriangle, Lightbulb, Github } from 'lucide-react';
import { InterviewCoach } from './InterviewCoach';
import { BackgroundParticles } from './BackgroundParticles';

interface DashboardProps {
  data: AnalysisResult;
  onReset: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onReset, isDarkMode = false, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'highlights' | 'roadmap' | 'assets' | 'interview' | 'portfolio'>('overview');
  const [showPortfolioCode, setShowPortfolioCode] = useState(false);

  // --- Shared Card Classes for Consistency ---
  const cardClass = "bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-3xl shadow-lg border border-slate-200/50 dark:border-white/10 transition-all duration-300";
  const innerCardClass = "bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl";

  // Safety check for data existence
  if (!data || !data.overall_scores) {
      return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            <BackgroundParticles isDarkMode={isDarkMode} />
            <div className={`relative z-10 p-8 text-center ${cardClass} max-w-md mx-4`}>
                <p className="text-red-600 dark:text-red-400 font-body mb-4 font-semibold">Error: Analysis data is missing or malformed.</p>
                <button onClick={onReset} className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-sm font-bold hover:opacity-90 transition-opacity">Try Again</button>
            </div>
        </div>
      );
  }

  // Prepare Dynamic Radar Chart Data
  const radarData = data.overall_scores.categories.map(c => ({
      subject: c.category,
      A: c.score,
      fullMark: 100
  }));

  // Colors for Indigo Theme Gradient
  const INDIGO_GRADIENT = [
      '#312e81', // indigo-900
      '#4338ca', // indigo-700
      '#4f46e5', // indigo-600
      '#6366f1', // indigo-500
      '#818cf8', // indigo-400
      '#a5b4fc', // indigo-300
      '#c7d2fe'  // indigo-200
  ];
  
  // Dynamic Chart Colors based on Theme
  const chartTextColor = isDarkMode ? '#cbd5e1' : '#475569'; 
  const chartGridColor = isDarkMode ? '#334155' : '#cbd5e1'; 
  const chartTooltipBg = isDarkMode ? '#0f172a' : '#ffffff'; 

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const renderOverview = () => {
    const matchBreakdown = data.overall_scores?.match_breakdown || [];
    const hasMultipleMatches = matchBreakdown.length > 1;

    return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hero Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`col-span-1 ${cardClass} p-8 flex flex-col items-center justify-center text-center`}>
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2 font-display uppercase tracking-wider text-xs">Overall Match</h3>
            
            {hasMultipleMatches ? (
                <div className="w-full space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar my-4">
                    {matchBreakdown.map((m, idx) => (
                        <div key={idx} className={`${innerCardClass} p-3`}>
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]" title={m.role}>{m.role}</span>
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{m.match_percentage}%</span>
                             </div>
                             <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-500" style={{width: `${m.match_percentage}%`}}></div>
                             </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="relative w-40 h-40 flex items-center justify-center my-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-200 dark:text-white/5" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className="text-indigo-600 dark:text-indigo-400 drop-shadow-md" strokeDasharray={`${data.overall_scores?.overall_match || 0}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                        <span className="text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">{data.overall_scores?.overall_match || 0}%</span>
                        <span className="text-[10px] uppercase text-slate-400 font-bold mt-1">Match Score</span>
                    </div>
                </div>
            )}
            
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-body">{data.text_summaries?.profile_summary || "No summary available."}</p>
        </div>

        <div className={`col-span-1 md:col-span-2 ${cardClass} p-8`}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center">
                <div className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></div>
                Competency Radar
            </h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke={chartGridColor} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: chartTextColor, fontSize: 11, fontWeight: 600, fontFamily: "'Google Sans Flex', sans-serif" }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                        <Radar name="You" dataKey="A" stroke="#6366f1" strokeWidth={3} fill="#6366f1" fillOpacity={0.4} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', backgroundColor: chartTooltipBg, boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)' }} labelStyle={{color: chartTextColor, fontWeight: 'bold'}} itemStyle={{color: isDarkMode ? '#e2e8f0' : '#1e293b'}}/>
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-indigo-50/40 dark:bg-indigo-900/10 backdrop-blur-xl p-8 rounded-3xl border border-indigo-100/50 dark:border-indigo-500/20 shadow-lg transition-colors">
              <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-4 flex items-center font-display text-lg"><CheckCircle className="w-5 h-5 mr-3 text-indigo-600 dark:text-indigo-400"/> Key Strengths</h4>
              <ul className="space-y-3">
                  {(data.text_summaries?.strengths || []).map((s, i) => (
                      <li key={i} className="flex items-start text-sm text-indigo-900 dark:text-indigo-200 font-body leading-relaxed">
                          <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
                          {s}
                      </li>
                  ))}
              </ul>
          </div>
          <div className="bg-orange-50/40 dark:bg-orange-900/10 backdrop-blur-xl p-8 rounded-3xl border border-orange-100/50 dark:border-orange-500/20 shadow-lg transition-colors">
              <h4 className="font-bold text-orange-900 dark:text-orange-200 mb-4 flex items-center font-display text-lg"><XCircle className="w-5 h-5 mr-3 text-orange-600 dark:text-orange-400"/> Areas for Improvement</h4>
              <ul className="space-y-3">
                  {(data.text_summaries?.weaknesses || []).map((w, i) => (
                      <li key={i} className="flex items-start text-sm text-orange-900 dark:text-orange-200 font-body leading-relaxed">
                          <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></span>
                          {w}
                      </li>
                  ))}
              </ul>
          </div>
      </div>
    </div>
    );
  };

  const renderSkills = () => {
    const gapSkills = data.gap_skills || [];
    const competencyMatrix = data.competency_matrix || [];
    
    // Process Skill Distribution
    const rawSkillDist = data.skill_distribution || [];
    const sortedSkillDist = [...rawSkillDist].sort((a, b) => b.share_percent - a.share_percent);
    
    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 2.1;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
      
        return (
          <text 
            x={x} 
            y={y} 
            fill={chartTextColor} 
            textAnchor={x > cx ? 'start' : 'end'} 
            dominantBaseline="central" 
            fontSize={11}
            fontWeight={600}
            fontFamily="'Google Sans Flex', sans-serif"
          >
            {`${name} (${(percent * 100).toFixed(0)}%)`}
          </text>
        );
    };

    const getLevelBadgeColor = (level: string) => {
        switch(level.toLowerCase()) {
            case 'expert': return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 border-indigo-200 dark:border-indigo-700';
            case 'advanced': return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700';
            case 'intermediate': return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700';
            case 'beginner': return 'bg-slate-100 dark:bg-slate-800/40 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
            default: return 'bg-slate-100 dark:bg-slate-800/40 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
        }
    };

    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${cardClass} p-8`}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center">
                    <div className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></div>
                    Skill Gaps Analysis
                </h3>
                <div className="h-72">
                    {gapSkills.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gapSkills as any[]} layout="vertical" margin={{ left: 40, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="skill" type="category" width={100} tick={{fontSize: 11, fill: chartTextColor, fontWeight: 500, fontFamily: "'Google Sans Flex', sans-serif"}} />
                                <Tooltip cursor={{fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '8px', backgroundColor: chartTooltipBg, border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: isDarkMode ? '#fff' : '#000' }} />
                                <Bar dataKey="current_level" name="Current" stackId="a" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="required_level" name="Target" stackId="a" fill={isDarkMode ? '#334155' : '#e2e8f0'} radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm font-body">No skill gap data available</div>
                    )}
                </div>
            </div>

            <div className={`${cardClass} p-8`}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center">
                    <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
                    Experience Distribution
                </h3>
                <div className="h-72">
                    {sortedSkillDist.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sortedSkillDist as any[]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="share_percent"
                                    nameKey="category"
                                    stroke="none"
                                    label={renderCustomizedLabel}
                                >
                                    {sortedSkillDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={INDIGO_GRADIENT[index % INDIGO_GRADIENT.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: chartTooltipBg, border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }} itemStyle={{color: chartTextColor}} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm font-body">No distribution data</div>
                    )}
                </div>
            </div>
        </div>

        {/* Detailed Competency Matrix */}
        <div className={`${cardClass} p-8`}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center">
                 <div className="w-2 h-6 bg-emerald-500 rounded-full mr-3"></div>
                 Detailed Competency Matrix
            </h3>
            
            {competencyMatrix && competencyMatrix.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {competencyMatrix.map((area, idx) => (
                        <div key={idx} className={`${innerCardClass} p-5 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300 hover:shadow-md`}>
                            <h4 className="text-xs font-extrabold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-200 dark:border-white/10 pb-3 mb-4 font-display">
                                {area.area}
                            </h4>
                            
                            {area.skills && area.skills.length > 0 ? (
                                <div className="space-y-3">
                                    {area.skills.map((skill, sIdx) => (
                                        <div key={sIdx} className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-sm relative group">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm font-display">{skill.name}</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${getLevelBadgeColor(skill.level)}`}>
                                                    {skill.level}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 group-hover:line-clamp-none transition-all duration-300 font-body leading-relaxed mt-1">
                                                {skill.evidence_comment}
                                            </p>
                                            
                                            {/* Evidence Icons */}
                                            <div className="absolute -top-1.5 -right-1.5 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {skill.evidence_source.includes('github') && (
                                                    <span className="bg-slate-900 text-white p-1 rounded-full shadow-md" title="Verified in GitHub">
                                                        <Github size={8} />
                                                    </span>
                                                )}
                                                {skill.evidence_source.includes('resume') && (
                                                    <span className="bg-indigo-600 text-white p-1 rounded-full shadow-md" title="Found in Resume">
                                                        <FileText size={8} />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic py-2 font-body">No specific skills identified.</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 text-slate-500 dark:text-slate-400 font-body">
                    No competency data available.
                </div>
            )}
        </div>
        
        {/* GitHub Projects */}
        <div className="space-y-4">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center font-display px-2"><Terminal className="w-5 h-5 mr-3 text-slate-700 dark:text-slate-300"/> GitHub Project Analysis</h3>
             {data.github_projects && data.github_projects.length > 0 ? (
                 data.github_projects.map((proj, idx) => (
                     <div key={idx} className={`${cardClass} p-8 hover:border-indigo-300 dark:hover:border-indigo-500/50`}>
                         <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-2">
                            <h4 className="font-bold text-xl text-slate-900 dark:text-white font-display">{proj.name || "Untitled Project"}</h4>
                            <span className="bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs px-3 py-1.5 rounded-full whitespace-nowrap border border-indigo-100/50 dark:border-indigo-500/30 font-bold uppercase tracking-wide">Complexity: {proj.complexity_rating || 0}/5</span>
                         </div>
                         <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed font-body max-w-4xl">{proj.summary || "No summary available."}</p>
                         
                         <div className="flex flex-wrap gap-2 mb-8">
                             {(proj.tech_stack || []).map(tech => (
                                 <span key={tech} className="bg-slate-100/80 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-md border border-slate-200 dark:border-white/10 font-semibold">{tech}</span>
                             ))}
                         </div>

                         <div className="grid md:grid-cols-2 gap-6">
                             <div className="bg-emerald-50/40 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100/60 dark:border-emerald-500/20">
                                 <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 mb-3 flex items-center font-display uppercase tracking-wider"><Briefcase className="w-3 h-3 mr-2"/> Recommended Resume Bullets</p>
                                 <ul className="list-none space-y-3">
                                     {(proj.resume_bullets && proj.resume_bullets.length > 0) ? 
                                         proj.resume_bullets.map((b,i) => (
                                             <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start font-body leading-relaxed"><ArrowRight className="w-3 h-3 mr-2 text-emerald-500 mt-0.5 flex-shrink-0"/>{b}</li>
                                         )) : 
                                         <li className="text-xs text-slate-400 italic font-body">No specific bullets generated.</li>
                                     }
                                 </ul>
                             </div>
                             <div className="bg-blue-50/40 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100/60 dark:border-blue-500/20">
                                 <p className="text-xs font-extrabold text-blue-800 dark:text-blue-400 mb-3 flex items-center font-display uppercase tracking-wider"><Code className="w-3 h-3 mr-2"/> Improvement Suggestions</p>
                                 <ul className="list-none space-y-3">
                                     {(proj.improvement_suggestions && proj.improvement_suggestions.length > 0) ? 
                                         proj.improvement_suggestions.map((s,i) => (
                                             <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start font-body leading-relaxed"><ArrowRight className="w-3 h-3 mr-2 text-blue-500 mt-0.5 flex-shrink-0"/>{s}</li>
                                         )) : 
                                         <li className="text-xs text-slate-400 italic font-body">No suggestions generated.</li>
                                     }
                                 </ul>
                             </div>
                         </div>
                     </div>
                 ))
             ) : (
                 <div className={`${cardClass} p-12 text-center border-dashed border-slate-300 dark:border-slate-700`}>
                     <p className="font-body text-slate-500 dark:text-slate-400">No GitHub projects were analyzed. Ensure you provided valid links or that your resume contains project details.</p>
                 </div>
             )}
        </div>
      </div>
    );
  };

  const renderResumeHighlights = () => {
    const highlights = data.resume_highlights;
    if (!highlights) {
       return (
         <div className={`${cardClass} p-12 text-center`}>
            <p className="text-slate-500 dark:text-slate-400 font-body">Resume highlights are unavailable.</p>
         </div>
       );
    }

    return (
      <div className="animate-fadeIn space-y-6">
        <div className={`${cardClass} p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6`}>
           <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display mb-2">AI Resume Review</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl font-body leading-relaxed">{highlights.overall_feedback}</p>
           </div>
           <div className="flex gap-2 flex-wrap">
              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-700 shadow-sm">
                 {highlights.summary_counts.green} Excellent
              </span>
              <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-4 py-1.5 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-700 shadow-sm">
                 {highlights.summary_counts.yellow} Needs Work
              </span>
              <span className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 px-4 py-1.5 rounded-full text-xs font-bold border border-red-200 dark:border-red-700 shadow-sm">
                 {highlights.summary_counts.red} Weak
              </span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-300px)] min-h-[600px]">
           {/* Preview Column */}
           <div className={`${cardClass} overflow-hidden flex flex-col`}>
              <div className="p-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/10 text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 font-display">
                 Annotated Preview
              </div>
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                 {highlights.segments.map((seg) => (
                    <div 
                      key={seg.id} 
                      className={`p-4 rounded-xl border-l-4 text-sm transition-all duration-300 cursor-default font-body shadow-sm
                          ${seg.rating === 'green' ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-400 text-slate-800 dark:text-slate-200' : 
                           seg.rating === 'yellow' ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-400 text-slate-800 dark:text-slate-200' : 
                           'bg-red-50/50 dark:bg-red-900/10 border-red-400 text-slate-800 dark:text-slate-200'}
                      `}
                    >
                       <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold uppercase opacity-70 font-display tracking-wide">{seg.section}</span>
                          {seg.rating === 'green' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                          {seg.rating === 'yellow' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                          {seg.rating === 'red' && <XCircle className="w-4 h-4 text-red-500" />}
                       </div>
                       <p className="leading-relaxed">{seg.original_text}</p>
                    </div>
                 ))}
              </div>
           </div>

           {/* Feedback Column */}
           <div className={`${cardClass} overflow-hidden flex flex-col`}>
              <div className="p-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/10 text-xs font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400 font-display">
                 Detailed Feedback
              </div>
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                 {highlights.segments.map((seg) => (
                    <div key={seg.id} className={`${innerCardClass} p-5 shadow-sm`}>
                        <div className="flex items-start justify-between mb-3">
                           <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${seg.rating === 'green' ? 'bg-emerald-500' : seg.rating === 'yellow' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                              <span className="text-sm font-bold text-slate-900 dark:text-white font-display">{seg.label}</span>
                           </div>
                           <span className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-1 rounded uppercase tracking-wider font-bold">{seg.section}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 font-body leading-relaxed">{seg.comment}</p>
                        
                        {seg.suggested_text && seg.rating !== 'green' && (
                           <div className="bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                              <div className="flex justify-between items-center mb-2">
                                 <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center font-display uppercase tracking-wider"><Lightbulb className="w-3 h-3 mr-1.5"/> Suggestion</span>
                                 <button onClick={() => copyToClipboard(seg.suggested_text!)} className="text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 p-1 hover:bg-indigo-100 dark:hover:bg-white/10 rounded">
                                    <Copy className="w-3 h-3" />
                                 </button>
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono bg-white/50 dark:bg-black/20 p-2 rounded border border-indigo-50 dark:border-white/5">{seg.suggested_text}</p>
                           </div>
                        )}
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderRoadmap = () => {
      const roadmapEffort = data.roadmap_effort;
      const timeline = data.roadmap_timeline || [];
      const employability = data.employability_profile || { current_visibility_score: 10, phase_1_projected_score: 30, phase_2_projected_score: 60, phase_3_projected_score: 90 };

      const probabilityData = [
          { phase: 'Start', score: employability.current_visibility_score, label: 'Current' },
          { phase: 'Month 1', score: employability.phase_1_projected_score, label: 'Phase 1' },
          { phase: 'Month 2', score: employability.phase_2_projected_score, label: 'Phase 2' },
          { phase: 'Month 3', score: employability.phase_3_projected_score, label: 'Phase 3' },
      ];

      return (
        <div className="space-y-6 animate-fadeIn">
            <div className={`${cardClass} p-8`}>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 font-display">Your 90-Day Strategy</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-body">{data.text_summaries?.roadmap_summary || "No summary available."}</p>
            </div>

            {/* Employability Projection Graph */}
            <div className={`${cardClass} p-8`}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center font-display">
                            <TrendingUp className="w-5 h-5 mr-3 text-emerald-500" /> 
                            Projected Recruiter Visibility
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-body ml-8">Probability of passing screening & getting interviews</p>
                    </div>
                    <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-display bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                        {employability.current_visibility_score}% <span className="text-slate-400 text-xl mx-2">→</span> {employability.phase_3_projected_score}%
                    </div>
                </div>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={probabilityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                            <XAxis dataKey="phase" tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 600, fontFamily: "'Google Sans Flex', sans-serif" }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis domain={[0, 100]} tick={{ fill: chartTextColor, fontSize: 12, fontFamily: "'Google Sans Flex', sans-serif" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: chartTooltipBg, border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }} itemStyle={{color: chartTextColor}}/>
                            <Area type="monotone" dataKey="score" stroke="#10b981" fillOpacity={1} fill="url(#colorScore)" strokeWidth={4} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Visual Gantt Chart */}
            <div className={`${cardClass} p-8 overflow-x-auto`}>
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center font-display">
                        <Calendar className="w-5 h-5 mr-3 text-indigo-500" />
                        12-Week Execution Timeline
                    </h3>
                    
                    <div className="flex gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 font-body bg-slate-50 dark:bg-white/5 px-4 py-2 rounded-full border border-slate-200 dark:border-white/10">
                        <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2 shadow-sm"></span> Technical</div>
                        <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 shadow-sm"></span> Project</div>
                        <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 mr-2 shadow-sm"></span> Career</div>
                    </div>
                </div>
                
                <div className="min-w-[800px] relative">
                    {/* Header Row */}
                    <div className="grid grid-cols-12 gap-1 mb-4 text-center relative z-10">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(week => (
                            <div key={week} className="text-xs font-extrabold text-slate-400 uppercase font-display tracking-wide">W{week}</div>
                        ))}
                    </div>

                    <div className="relative pt-4 pb-4">
                        {/* Background Zones */}
                        <div className="absolute inset-0 grid grid-cols-12 h-full rounded-2xl overflow-hidden pointer-events-none">
                            <div className="col-span-4 bg-slate-50/50 dark:bg-white/5 border-r border-slate-200/50 dark:border-white/5"></div>
                            <div className="col-span-4 bg-slate-100/30 dark:bg-white/10 border-r border-slate-200/50 dark:border-white/5"></div>
                            <div className="col-span-4 bg-slate-50/50 dark:bg-white/5"></div>
                        </div>

                        {/* Items */}
                        <div className="relative z-10 p-3 space-y-3">
                            {timeline.length > 0 ? (
                                timeline.map((item, idx) => {
                                    const start = Math.max(1, Math.min(12, item.start_week));
                                    const end = Math.max(start, Math.min(12, item.end_week));
                                    const span = end - start + 1;
                                    
                                    const colorClass = item.category === 'Technical' 
                                        ? 'bg-indigo-500 shadow-indigo-500/20' 
                                        : item.category === 'Project' 
                                            ? 'bg-blue-500 shadow-blue-500/20' 
                                            : 'bg-slate-500 shadow-slate-500/20';

                                    return (
                                        <div key={idx} className="grid grid-cols-12 gap-1 group relative">
                                            <div 
                                                className={`${colorClass} rounded-lg h-9 flex items-center px-4 shadow-md transition-all hover:scale-[1.02] cursor-default text-white text-xs font-bold whitespace-nowrap overflow-hidden relative font-body`}
                                                style={{ gridColumn: `${start} / span ${span}` }}
                                            >
                                                {item.task_name}
                                                
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-slate-900 dark:bg-black text-white text-xs rounded-xl p-4 shadow-2xl border border-slate-700 dark:border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 transform scale-95 group-hover:scale-100 origin-bottom font-body">
                                                   <div className="font-bold mb-1.5 text-white font-display text-sm">{item.task_name}</div>
                                                   <div className="text-slate-400 flex justify-between border-t border-slate-700 pt-2 mt-1">
                                                       <span>{item.category}</span>
                                                       <span className="text-white">Weeks {start}-{end}</span>
                                                   </div>
                                                   <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-black"></div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-slate-400 py-12 relative z-20 font-body">Timeline data generating...</div>
                            )}
                        </div>
                    </div>
                    
                     <div className="grid grid-cols-3 gap-1 mt-6 pt-4 border-t border-slate-200/50 dark:border-white/10">
                         <div className="text-center text-xs font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-display">Phase 1: Foundation</div>
                         <div className="text-center text-xs font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest font-display">Phase 2: Build</div>
                         <div className="text-center text-xs font-extrabold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest font-display">Phase 3: Launch</div>
                     </div>
                </div>
            </div>

            {/* Detailed Phase Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((phase) => {
                    const roadmapDetails = data.roadmap_details;
                    const detailsKey = `phase_${phase}_goals` as keyof typeof roadmapDetails;
                    const goals = roadmapDetails[detailsKey] || [];
                    
                    return (
                        <div key={phase} className={`${cardClass} flex flex-col h-full hover:border-indigo-300 dark:hover:border-indigo-500/50`}>
                            <div className={`p-4 text-white rounded-t-3xl ${phase === 1 ? 'bg-indigo-500' : phase === 2 ? 'bg-indigo-600' : 'bg-indigo-700'}`}>
                                <h4 className="font-bold text-lg font-display">Phase {phase} Goals</h4>
                            </div>
                            <div className="p-6 flex-1">
                                {goals.length > 0 ? (
                                    <ul className="space-y-3">
                                        {goals.map((goal, i) => (
                                            <li key={i} className="flex items-start text-xs text-slate-600 dark:text-slate-300 font-body leading-relaxed">
                                                <span className="text-indigo-500 dark:text-indigo-400 mr-2.5 mt-0.5">•</span> {goal}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-slate-400 italic font-body">No specific goals listed.</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      );
  };

  const renderAssets = () => {
    const assets = data.assets || { resume_bullets_optimized: '', cover_letter: '', linkedin_summary: '', outreach_message: '' };
    
    return (
      <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${cardClass} p-8`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center font-display text-lg"><Briefcase className="w-5 h-5 mr-3"/> Optimized Resume Bullets</h3>
                    <button onClick={() => copyToClipboard(assets.resume_bullets_optimized)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-indigo-600 dark:text-indigo-400 transition-colors"><Copy className="w-5 h-5"/></button>
                  </div>
                  <div className={`${innerCardClass} p-5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono h-72 overflow-y-auto font-body shadow-inner`}>
                      {assets.resume_bullets_optimized || "No bullets generated."}
                  </div>
              </div>

              <div className={`${cardClass} p-8`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center font-display text-lg"><FileText className="w-5 h-5 mr-3"/> Generated Cover Letter</h3>
                    <button onClick={() => copyToClipboard(assets.cover_letter)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-indigo-600 dark:text-indigo-400 transition-colors"><Copy className="w-5 h-5"/></button>
                  </div>
                  <div className={`${innerCardClass} p-5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono h-72 overflow-y-auto font-body shadow-inner`}>
                      {assets.cover_letter || "No cover letter generated."}
                  </div>
              </div>

               <div className={`${cardClass} p-8`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center font-display text-lg"><Award className="w-5 h-5 mr-3"/> LinkedIn Summary</h3>
                    <button onClick={() => copyToClipboard(assets.linkedin_summary)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-indigo-600 dark:text-indigo-400 transition-colors"><Copy className="w-5 h-5"/></button>
                  </div>
                  <div className={`${innerCardClass} p-5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono h-56 overflow-y-auto font-body shadow-inner`}>
                      {assets.linkedin_summary || "No summary generated."}
                  </div>
              </div>

               <div className={`${cardClass} p-8`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center font-display text-lg"><MessageSquare className="w-5 h-5 mr-3"/> Recruiter Outreach</h3>
                    <button onClick={() => copyToClipboard(assets.outreach_message)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-indigo-600 dark:text-indigo-400 transition-colors"><Copy className="w-5 h-5"/></button>
                  </div>
                  <div className={`${innerCardClass} p-5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono h-56 overflow-y-auto font-body shadow-inner`}>
                      {assets.outreach_message || "No outreach message generated."}
                  </div>
              </div>
          </div>
      </div>
    );
  };

  const renderPortfolio = () => (
      <div className="space-y-6 animate-fadeIn">
          <div className={`${cardClass} p-6 flex justify-between items-center`}>
             <div>
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center font-display"><Globe className="w-5 h-5 mr-3 text-indigo-500"/> Generated Portfolio Site</h3>
                 <p className="text-sm text-slate-500 dark:text-slate-400 font-body mt-1">A single-file HTML/Tailwind template ready to deploy.</p>
             </div>
             <div className="flex space-x-3">
                 <button onClick={() => setShowPortfolioCode(!showPortfolioCode)} className="flex items-center px-4 py-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl text-sm font-bold transition-colors text-slate-700 dark:text-slate-300 font-body">
                     <Code className="w-4 h-4 mr-2"/> {showPortfolioCode ? 'Show Preview' : 'Show Code'}
                 </button>
                 <button onClick={() => copyToClipboard(data.portfolio_template)} className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-sm font-bold transition-all shadow-md font-body">
                     <Copy className="w-4 h-4 mr-2"/> Copy HTML
                 </button>
             </div>
          </div>

          <div className={`${cardClass} overflow-hidden h-[800px]`}>
              {data.portfolio_template ? (
                  showPortfolioCode ? (
                    <textarea 
                        readOnly 
                        className="w-full h-full p-6 font-mono text-xs bg-slate-900 text-slate-100 resize-none outline-none leading-relaxed"
                        value={data.portfolio_template}
                    />
                  ) : (
                    <iframe 
                        srcDoc={data.portfolio_template} 
                        className="w-full h-full border-0"
                        title="Portfolio Preview"
                        sandbox="allow-scripts allow-same-origin"
                    />
                  )
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-body">
                      Portfolio template generation failed.
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="min-h-screen relative transition-colors duration-300">
      {/* Fixed Background */}
      <BackgroundParticles isDarkMode={isDarkMode} />

      {/* Top Nav - Matches Glass Aesthetics */}
      <nav className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 sticky top-0 z-50 transition-colors">
          <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-center h-20">
                  <div className="flex items-center">
                    <span className="font-extrabold text-2xl text-slate-900 dark:text-white mr-10 hidden md:block tracking-tight font-display drop-shadow-sm">CareerCompass <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400">AI</span></span>
                    <span className="font-bold text-xl text-slate-900 dark:text-white mr-4 md:hidden font-display">CC AI</span>
                    <div className="hidden md:flex space-x-1">
                      {[
                          {id: 'overview', label: 'Overview'},
                          {id: 'skills', label: 'Skills & Gaps'},
                          {id: 'highlights', label: 'Resume'},
                          {id: 'roadmap', label: 'Roadmap'},
                          {id: 'assets', label: 'Assets'},
                          {id: 'interview', label: 'Interview'},
                          {id: 'portfolio', label: 'Portfolio'}
                      ].map(tab => (
                          <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all font-body ${
                                activeTab === tab.id 
                                ? 'bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-50/50 dark:hover:bg-white/5'
                            }`}
                          >
                              {tab.label}
                          </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                      {/* Theme Toggle */}
                      {toggleTheme && (
                          <button 
                            onClick={toggleTheme}
                            className="p-2.5 rounded-full bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200/50 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors backdrop-blur-sm"
                          >
                            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
                          </button>
                      )}

                      <button onClick={onReset} className="px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity shadow-lg">
                        New Analysis
                      </button>
                  </div>
              </div>
              
              {/* Mobile Nav */}
              <div className="md:hidden flex space-x-4 overflow-x-auto pb-4 pt-2 hide-scrollbar px-2">
                  {[
                      {id: 'overview', label: 'Overview'},
                      {id: 'skills', label: 'Skills'},
                      {id: 'highlights', label: 'Highlights'},
                      {id: 'roadmap', label: 'Roadmap'},
                      {id: 'assets', label: 'Assets'},
                      {id: 'interview', label: 'Interview'},
                      {id: 'portfolio', label: 'Portfolio'}
                  ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`text-sm font-bold whitespace-nowrap px-4 py-1.5 rounded-full border transition-all font-body ${
                            activeTab === tab.id 
                            ? 'bg-indigo-100/80 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                          {tab.label}
                      </button>
                  ))}
              </div>
          </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'skills' && renderSkills()}
          {activeTab === 'highlights' && renderResumeHighlights()}
          {activeTab === 'roadmap' && renderRoadmap()}
          {activeTab === 'assets' && renderAssets()}
          {activeTab === 'interview' && <InterviewCoach role={data.jd_breakdown?.role_title || "Target Role"} />}
          {activeTab === 'portfolio' && renderPortfolio()}
      </main>
    </div>
  );
};