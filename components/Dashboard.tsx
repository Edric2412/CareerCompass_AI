
import React, { useState, useMemo } from 'react';
import { AnalysisResult, PortfolioPreferences } from '../types';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie, AreaChart, Area
} from 'recharts';
import { CheckCircle, XCircle, Copy, Terminal, MessageSquare, Briefcase, Award, Globe, Code, FileText, ArrowRight, Sun, Moon, TrendingUp, Calendar, AlertTriangle, Lightbulb, Github, Check, ExternalLink } from 'lucide-react';
import { InterviewCoach } from './InterviewCoach';
import { BackgroundParticles } from './BackgroundParticles';
import { PortfolioBuilder } from './PortfolioBuilder';
import { generatePortfolioHtml } from '../services/geminiService';

interface DashboardProps {
  data: AnalysisResult;
  onReset: () => void;
  isDarkMode?: boolean;
  toggleTheme?: () => void;
}

// Simple Toast Component
const Toast = ({ message, onClose }: { message: string, onClose: () => void }) => (
    <div className="fixed bottom-8 right-8 z-[100] animate-fadeIn">
        <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <div className="bg-emerald-500 rounded-full p-1">
                <Check size={14} className="text-white" />
            </div>
            <div>
                <p className="font-bold text-sm font-display">Success</p>
                <p className="text-xs opacity-90 font-body">{message}</p>
            </div>
            <button onClick={onClose} className="ml-4 opacity-50 hover:opacity-100">
                <XCircle size={18} />
            </button>
        </div>
    </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ data, onReset, isDarkMode = false, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'highlights' | 'roadmap' | 'assets' | 'interview' | 'portfolio'>('overview');
  
  // --- Portfolio State Lifted Up ---
  const [portfolioHtml, setPortfolioHtml] = useState<string>('');
  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [portfolioPreferences, setPortfolioPreferences] = useState<PortfolioPreferences>({
        color_theme: 'indigo',
        mode: 'light',
        corners: 'rounded',
        layout_style: 'classic',
        font_vibe: 'modern',
        shadow_depth: 'soft',
        density: 'comfortable',
        animation_level: 'subtle',
        nav_style: 'top_bar',
        avatar_style: 'emoji',
        section_order: ['About', 'Skills', 'Projects', 'Contact'],
        custom_links: [],
        contact_email: '',
        contact_phone: ''
  });

  const handleGeneratePortfolio = async () => {
        setIsGeneratingPortfolio(true);
        // We do NOT await here to block the UI. We let it run in background.
        generatePortfolioHtml(data, portfolioPreferences).then((html) => {
            setPortfolioHtml(html);
            setIsGeneratingPortfolio(false);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 5000); // Auto dismiss
        }).catch(e => {
            console.error(e);
            setIsGeneratingPortfolio(false);
        });
  };

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

  // --- Dynamic Logic for Roadmap Categories ---
  const uniqueRoadmapCategories = useMemo(() => {
      if (!data.roadmap_timeline) return [];
      return Array.from(new Set(data.roadmap_timeline.map(item => item.category)));
  }, [data.roadmap_timeline]);

  const CATEGORY_PALETTE = [
      { bg: 'bg-indigo-500', shadow: 'shadow-indigo-500/30' },
      { bg: 'bg-emerald-500', shadow: 'shadow-emerald-500/30' },
      { bg: 'bg-amber-500', shadow: 'shadow-amber-500/30' },
      { bg: 'bg-rose-500', shadow: 'shadow-rose-500/30' },
      { bg: 'bg-sky-500', shadow: 'shadow-sky-500/30' },
      { bg: 'bg-violet-500', shadow: 'shadow-violet-500/30' },
      { bg: 'bg-orange-500', shadow: 'shadow-orange-500/30' },
      { bg: 'bg-teal-500', shadow: 'shadow-teal-500/30' },
  ];

  const getCategoryStyles = (category: string) => {
      const index = uniqueRoadmapCategories.indexOf(category);
      const paletteItem = CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
      return paletteItem;
  };


  // Prepare Dynamic Radar Chart Data
  const radarData = data.overall_scores.categories.map(c => ({
      subject: c.category,
      A: c.score,
      fullMark: 100
  }));

  const INDIGO_GRADIENT = [
      '#312e81', '#4338ca', '#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe'
  ];
  
  const chartTextColor = isDarkMode ? '#cbd5e1' : '#475569'; 
  const chartGridColor = isDarkMode ? '#334155' : '#cbd5e1'; 
  const chartTooltipBg = isDarkMode ? '#0f172a' : '#ffffff'; 

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // --- RENDER FUNCTIONS ---

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
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]" title={m.role}>{m.role}</span>
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
            <div className="h-72 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke={chartGridColor} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 600, fontFamily: "'Google Sans Flex', sans-serif", dy: 4 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                        <Radar name="You" dataKey="A" stroke="#6366f1" strokeWidth={3} fill="#6366f1" fillOpacity={0.4} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', backgroundColor: chartTooltipBg, boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.2)' }} labelStyle={{color: chartTextColor, fontWeight: 'bold'}} itemStyle={{color: isDarkMode ? '#e2e8f0' : '#1e293b'}}/>
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* Strengths & Weaknesses (Restored) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${cardClass} p-8`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center">
                  <div className="w-2 h-6 bg-emerald-500 rounded-full mr-3"></div>
                  Key Strengths
              </h3>
              <div className="space-y-3">
                  {data.text_summaries?.strengths?.map((str, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20">
                          <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-body">{str}</p>
                      </div>
                  ))}
              </div>
          </div>

          <div className={`${cardClass} p-8`}>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center">
                  <div className="w-2 h-6 bg-amber-500 rounded-full mr-3"></div>
                  Areas for Improvement
              </h3>
              <div className="space-y-3">
                  {data.text_summaries?.weaknesses?.map((weak, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20">
                          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-body">{weak}</p>
                      </div>
                  ))}
              </div>
          </div>
      </div>

      <div className={`${cardClass} p-8`}>
           <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 font-display uppercase tracking-wider">Suggested Roles</h3>
           <div className="flex flex-wrap gap-2">
               {data.text_summaries?.suggested_roles?.map((role, idx) => (
                   <span key={idx} className="px-4 py-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-bold border border-slate-200 dark:border-white/10 font-body">
                       {role}
                   </span>
               ))}
           </div>
      </div>
    </div>
    );
  };

  const renderSkills = () => {
      const gapSkills = data.gap_skills || [];
      const competencyMatrix = data.competency_matrix || [];
      const rawSkillDist = data.skill_distribution || [];
      const sortedSkillDist = [...rawSkillDist].sort((a, b) => b.share_percent - a.share_percent);
      const RADIAN = Math.PI / 180;
      const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 2.1;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
          <text x={x} y={y} fill={chartTextColor} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={600} fontFamily="'Google Sans Flex', sans-serif">
            {`${name} (${(percent * 100).toFixed(0)}%)`}
          </text>
        );
      };
      
      return (
         <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`${cardClass} p-8`}>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center">
                        <div className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></div>
                        Skill Gaps Analysis
                    </h3>
                    <div className="h-72 w-full min-h-[300px]">
                         <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={gapSkills as any[]} layout="vertical" margin={{ left: 40, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="skill" type="category" width={100} tick={{fontSize: 11, fill: chartTextColor, fontWeight: 500, fontFamily: "'Google Sans Flex', sans-serif"}} />
                                <Tooltip cursor={{fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '8px', backgroundColor: chartTooltipBg, border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: isDarkMode ? '#fff' : '#000' }} />
                                <Bar dataKey="current_level" name="Current" stackId="a" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="required_level" name="Target" stackId="a" fill={isDarkMode ? '#334155' : '#e2e8f0'} radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className={`${cardClass} p-8`}>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center">
                        <div className="w-2 h-6 bg-blue-500 rounded-full mr-3"></div>
                        Experience Distribution
                    </h3>
                    <div className="h-72 w-full min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie data={sortedSkillDist as any[]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="share_percent" nameKey="category" stroke="none" label={renderCustomizedLabel}>
                                    {sortedSkillDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={INDIGO_GRADIENT[index % INDIGO_GRADIENT.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: chartTooltipBg, border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }} itemStyle={{color: chartTextColor}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Competency Matrix (Restored) */}
            <div className={`${cardClass} p-8`}>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center">
                    <div className="w-2 h-6 bg-violet-500 rounded-full mr-3"></div>
                    Competency Matrix
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-white/10">
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-display">Skill Area</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-display">Competency</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-display">Evidence</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-body">
                            {competencyMatrix.map((area, i) => (
                                <React.Fragment key={i}>
                                    {area.skills.map((skill, j) => (
                                        <tr key={`${i}-${j}`} className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0">
                                            {j === 0 && (
                                                <td rowSpan={area.skills.length} className="p-4 align-top font-bold text-slate-800 dark:text-white border-r border-slate-100 dark:border-white/5">
                                                    {area.area}
                                                </td>
                                            )}
                                            <td className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-slate-700 dark:text-slate-300">{skill.name}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide
                                                        ${skill.level === 'Expert' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' :
                                                          skill.level === 'Advanced' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                                                          skill.level === 'Intermediate' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' :
                                                          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}
                                                    `}>
                                                        {skill.level}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-md">
                                                {skill.evidence_comment}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Project Analysis (Restored) */}
            <div className="space-y-4">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display flex items-center">
                    <div className="w-2 h-6 bg-teal-500 rounded-full mr-3"></div>
                    Project Analysis
                </h3>
                {data.github_projects && data.github_projects.length > 0 ? (
                    data.github_projects.map((proj, idx) => (
                        <div key={idx} className={`${cardClass} p-8`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                                <div>
                                    <h4 className="text-xl font-bold text-slate-900 dark:text-white font-display">{proj.name}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-body">{proj.summary}</p>
                                </div>
                                <div className="mt-4 md:mt-0 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wider shadow-sm font-display">
                                    Complexity: {Math.min(Math.round(proj.complexity_rating || 0), 5)}/5
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-6">
                                {proj.tech_stack.map((tech, tIdx) => (
                                    <span key={tIdx} className="px-2 py-1 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-white/10 font-body">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className={`p-5 rounded-xl border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5`}>
                                    <h5 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center font-display">
                                        <Briefcase size={14} className="mr-2"/> RECOMMENDED RESUME BULLETS
                                    </h5>
                                    <ul className="space-y-2">
                                        {proj.resume_bullets.map((bullet, bIdx) => (
                                            <li key={bIdx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 font-body">
                                                <ArrowRight size={12} className="text-emerald-500 mt-0.5 flex-shrink-0"/>
                                                {bullet}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className={`p-5 rounded-xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5`}>
                                    <h5 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-3 flex items-center font-display">
                                        <Code size={14} className="mr-2"/> IMPROVEMENT SUGGESTIONS
                                    </h5>
                                    <ul className="space-y-2">
                                        {proj.improvement_suggestions.map((sug, sIdx) => (
                                            <li key={sIdx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 font-body">
                                                <ArrowRight size={12} className="text-blue-500 mt-0.5 flex-shrink-0"/>
                                                {sug}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={`${cardClass} p-8 text-center text-slate-500 dark:text-slate-400 italic`}>
                        No specific projects were found or analyzed.
                    </div>
                )}
            </div>
         </div>
      );
  };

  const renderHighlights = () => {
      const highlights = data.resume_highlights;
      if (!highlights) return null;

      return (
          <div className="space-y-6 animate-fadeIn">
              <div className={`${cardClass} p-8 mb-6`}>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">Resume Analysis Feedback</h3>
                  <p className="text-slate-600 dark:text-slate-300 font-body leading-relaxed">{highlights.overall_feedback}</p>
                  
                  <div className="flex gap-4 mt-6">
                      <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{highlights.summary_counts.green} Strong</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{highlights.summary_counts.yellow} Needs Tweak</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-red-500"></span>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{highlights.summary_counts.red} Critical</span>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                  {highlights.segments.map((seg) => (
                      <div key={seg.id} className={`${cardClass} p-6 border-l-4 ${
                          seg.rating === 'green' ? 'border-l-emerald-500' : 
                          seg.rating === 'yellow' ? 'border-l-amber-500' : 'border-l-red-500'
                      }`}>
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-display">{seg.section}</span>
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                  seg.rating === 'green' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 
                                  seg.rating === 'yellow' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                                  {seg.label}
                              </span>
                          </div>
                          
                          <div className="mb-4 p-3 bg-slate-50 dark:bg-white/5 rounded-lg font-mono text-xs text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10">
                              "{seg.original_text}"
                          </div>
                          
                          <div className="flex items-start gap-2">
                              <MessageSquare size={16} className="text-indigo-500 mt-0.5 flex-shrink-0"/>
                              <p className="text-sm text-slate-700 dark:text-slate-300 font-body">{seg.comment}</p>
                          </div>
                          
                          {seg.suggested_text && (
                              <div className="mt-4 pl-4 border-l-2 border-indigo-200 dark:border-indigo-500/30">
                                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1 font-display">Suggested Rewrite:</p>
                                  <p className="text-sm text-slate-800 dark:text-slate-200 italic font-body">"{seg.suggested_text}"</p>
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const renderRoadmap = () => {
      if (!data.roadmap_effort) return null;
      
      const visibilityData = [
            { stage: 'Now', score: data.employability_profile.current_visibility_score },
            { stage: 'Phase 1', score: data.employability_profile.phase_1_projected_score },
            { stage: 'Phase 2', score: data.employability_profile.phase_2_projected_score },
            { stage: 'Phase 3', score: data.employability_profile.phase_3_projected_score },
      ];

      return (
          <div className="space-y-6 animate-fadeIn">
              {/* Projected Visibility Chart (Restored) */}
              <div className={`${cardClass} p-8`}>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center">
                    <div className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></div>
                    Projected Recruiter Visibility
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={visibilityData}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                            <XAxis dataKey="stage" tick={{ fill: chartTextColor, fontSize: 12, fontWeight: 600, fontFamily: "'Google Sans Flex', sans-serif" }} />
                            <YAxis domain={[0, 100]} tick={{ fill: chartTextColor, fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: chartTooltipBg, border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0' }} itemStyle={{color: chartTextColor}} />
                            <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                    </ResponsiveContainer>
                  </div>
              </div>

              {/* Timeline Chart */}
              <div className={`${cardClass} p-8`}>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 font-display flex items-center">
                    <div className="w-2 h-6 bg-indigo-500 rounded-full mr-3"></div>
                    90-Day Execution Timeline
                  </h3>
                  <div className="relative pt-8 pb-4">
                      {/* Weeks Axis */}
                      <div className="flex justify-between text-xs text-slate-400 font-bold font-display uppercase tracking-wider mb-2 px-2">
                          <span>Week 1</span>
                          <span>Week 4</span>
                          <span>Week 8</span>
                          <span>Week 12</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-6 relative">
                          <div className="absolute left-0 w-1/3 h-full bg-indigo-400/30 rounded-l-full"></div>
                          <div className="absolute left-1/3 w-1/3 h-full bg-blue-400/30"></div>
                          <div className="absolute right-0 w-1/3 h-full bg-emerald-400/30 rounded-r-full"></div>
                      </div>

                      <div className="space-y-3 relative z-10">
                          {data.roadmap_timeline.map((item, idx) => {
                              const startPct = ((item.start_week - 1) / 12) * 100;
                              const widthPct = ((item.end_week - item.start_week + 1) / 12) * 100;
                              const style = getCategoryStyles(item.category);

                              return (
                                  <div key={idx} className="relative h-10 w-full hover:scale-[1.01] transition-transform group">
                                      <div 
                                          className={`absolute h-8 rounded-lg ${style.bg} ${style.shadow} flex items-center px-3 text-xs font-bold text-white whitespace-nowrap overflow-hidden shadow-md cursor-help`}
                                          style={{ left: `${startPct}%`, width: `${widthPct}%` }}
                                      >
                                          {item.task_name}
                                      </div>
                                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                          W{item.start_week} - W{item.end_week}: {item.category}
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                      
                      {/* Phase Labels */}
                      <div className="flex justify-between mt-8 text-center">
                          <div className="w-1/3 border-t-2 border-indigo-400/30 pt-2">
                              <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-display">PHASE 1: FOUNDATION</p>
                          </div>
                          <div className="w-1/3 border-t-2 border-blue-400/30 pt-2">
                              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 font-display">PHASE 2: APPLICATION</p>
                          </div>
                          <div className="w-1/3 border-t-2 border-emerald-400/30 pt-2">
                              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-display">PHASE 3: POLISH</p>
                          </div>
                      </div>
                  </div>
              </div>
              
              {/* Detailed Goals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                      { title: "Phase 1: Foundation", goals: data.roadmap_details?.phase_1_goals, color: "indigo" },
                      { title: "Phase 2: Build & Apply", goals: data.roadmap_details?.phase_2_goals, color: "blue" },
                      { title: "Phase 3: Launch", goals: data.roadmap_details?.phase_3_goals, color: "emerald" }
                  ].map((phase, pIdx) => (
                      <div key={pIdx} className={`${cardClass} p-6 border-t-4`} style={{borderColor: `var(--color-${phase.color}-500)`}}>
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 font-display">{phase.title}</h4>
                          <ul className="space-y-3">
                              {phase.goals?.map((goal, gIdx) => (
                                  <li key={gIdx} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 font-body">
                                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-${phase.color}-500`}></div>
                                      {goal}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const renderAssets = () => {
      if (!data.assets) return null;
      
      const AssetBlock = ({ title, content, icon: Icon }: { title: string, content: string, icon: any }) => (
          <div className={`${cardClass} p-0 overflow-hidden flex flex-col`}>
              <div className="bg-slate-50/80 dark:bg-white/5 p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-white font-display flex items-center">
                      <Icon size={16} className="mr-2 text-indigo-500"/> {title}
                  </h3>
                  <button onClick={() => copyToClipboard(content)} className="text-slate-400 hover:text-indigo-500 transition-colors">
                      <Copy size={16}/>
                  </button>
              </div>
              <div className="p-6 bg-white/50 dark:bg-transparent">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-body">
                      {content}
                  </pre>
              </div>
          </div>
      );

      return (
          <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AssetBlock title="Optimized Resume Bullets" content={data.assets.resume_bullets_optimized} icon={FileText} />
                  <AssetBlock title="LinkedIn About Section" content={data.assets.linkedin_summary} icon={Globe} />
              </div>
              <AssetBlock title="Cover Letter Draft" content={data.assets.cover_letter} icon={FileText} />
              <AssetBlock title="Recruiter Outreach Message" content={data.assets.outreach_message} icon={MessageSquare} />
          </div>
      );
  };

  return (
    <div className="min-h-screen relative transition-colors duration-300">
      {/* Toast Notification */}
      {showToast && <Toast message="Portfolio Generated Successfully!" onClose={() => setShowToast(false)} />}
      
      {/* Fixed Background */}
      <BackgroundParticles isDarkMode={isDarkMode} />

      {/* Top Nav */}
      <nav className="bg-white/40 dark:bg-black/40 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 sticky top-0 z-50 transition-colors">
          <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-center h-20">
                  <div className="flex items-center">
                    <span className="font-extrabold text-2xl text-slate-900 dark:text-white mr-10 hidden md:block tracking-tight font-display drop-shadow-sm">CareerCompass <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400">AI</span></span>
                    <span className="font-bold text-xl text-slate-900 dark:text-white mr-4 md:hidden font-display">CC AI</span>
                    <div className="hidden md:flex space-x-1">
                      {['overview', 'skills', 'highlights', 'roadmap', 'assets', 'interview', 'portfolio'].map(tab => (
                          <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all font-body ${
                                activeTab === tab 
                                ? 'bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-50/50 dark:hover:bg-white/5'
                            }`}
                          >
                              {tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
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
              
              <div className="md:hidden flex space-x-4 overflow-x-auto pb-4 pt-2 hide-scrollbar px-2">
                  {['overview', 'skills', 'highlights', 'roadmap', 'assets', 'interview', 'portfolio'].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`text-sm font-bold whitespace-nowrap px-4 py-1.5 rounded-full border transition-all font-body ${
                            activeTab === tab 
                            ? 'bg-indigo-100/80 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-200' 
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                  ))}
              </div>
          </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'skills' && renderSkills()}
          {activeTab === 'highlights' && renderHighlights()} 
          {activeTab === 'roadmap' && renderRoadmap()} 
          {activeTab === 'assets' && renderAssets()} 
          {activeTab === 'interview' && (
              <InterviewCoach 
                role={data.jd_breakdown?.role_title || "Target Role"} 
                customTopics={data.interview_topics} // Pass dynamic topics here
              />
          )}
          
          {/* Keep PortfolioBuilder mounted but hidden when not active to preserve state/iframe/generation */}
          <div className={activeTab === 'portfolio' ? 'block' : 'hidden'}>
              <PortfolioBuilder 
                data={data} 
                portfolioHtml={portfolioHtml}
                isGenerating={isGeneratingPortfolio}
                preferences={portfolioPreferences}
                setPreferences={setPortfolioPreferences}
                onGenerate={handleGeneratePortfolio}
              />
          </div>
      </main>
    </div>
  );
};
