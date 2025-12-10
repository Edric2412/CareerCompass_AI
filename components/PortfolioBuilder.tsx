
import React, { useState } from 'react';
import { AnalysisResult, PortfolioPreferences, CustomLink } from '../types';
import { Palette, Moon, Sun, Layout, Type, MousePointerClick, Zap, RefreshCcw, Code, Copy, Globe, Info, Maximize2, X, Plus, Trash2, Mail, Phone, Link as LinkIcon } from 'lucide-react';

interface Props {
    data: AnalysisResult;
    portfolioHtml: string;
    isGenerating: boolean;
    preferences: PortfolioPreferences;
    setPreferences: React.Dispatch<React.SetStateAction<PortfolioPreferences>>;
    onGenerate: () => void;
}

export const PortfolioBuilder: React.FC<Props> = ({ 
    data, 
    portfolioHtml, 
    isGenerating, 
    preferences: prefs, 
    setPreferences: setPrefs, 
    onGenerate 
}) => {
    const [showCode, setShowCode] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Helper to update specific pref
    const updatePref = <K extends keyof PortfolioPreferences>(key: K, value: PortfolioPreferences[K]) => {
        setPrefs(prev => ({ ...prev, [key]: value }));
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(portfolioHtml);
        alert("HTML copied to clipboard!");
    };

    // Custom Link Handlers
    const addCustomLink = () => {
        const newLink: CustomLink = { id: Date.now().toString(), label: '', url: '' };
        updatePref('custom_links', [...prefs.custom_links, newLink]);
    };

    const removeCustomLink = (id: string) => {
        updatePref('custom_links', prefs.custom_links.filter(l => l.id !== id));
    };

    const updateCustomLink = (id: string, field: 'label' | 'url', value: string) => {
        const updated = prefs.custom_links.map(l => l.id === id ? { ...l, [field]: value } : l);
        updatePref('custom_links', updated);
    };

    // Tooltip Helper
    const LabelWithTooltip = ({ label, icon: Icon, tooltip }: { label: string, icon?: any, tooltip: string }) => (
        <div className="group relative flex items-center gap-1.5 mb-1.5 w-full">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-display flex items-center gap-1.5">
                {Icon && <Icon size={12}/>} {label}
            </label>
            <div className="relative">
                <Info size={12} className="text-slate-400 cursor-help hover:text-indigo-500 transition-colors"/>
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-48 bg-slate-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 font-body shadow-xl border border-slate-700">
                    {tooltip}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800"></div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn h-[calc(100vh-140px)] min-h-[800px]">
                {/* Sidebar Controls */}
                <div className="w-full lg:w-80 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-3xl shadow-lg border border-slate-200/50 dark:border-white/10 p-6 flex flex-col overflow-y-auto custom-scrollbar flex-shrink-0">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-indigo-500 rounded-lg text-white">
                            <Palette size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display">Portfolio Designer</h3>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Theme & Mode */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-display">Theme & Mode</label>
                            <div className="flex gap-2">
                                {(['indigo', 'emerald', 'violet', 'rose', 'amber'] as const).map(color => (
                                    <button
                                        key={color}
                                        onClick={() => updatePref('color_theme', color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                                            prefs.color_theme === color ? 'border-slate-600 dark:border-white scale-110 shadow-md' : 'border-transparent'
                                        }`}
                                        style={{ backgroundColor: `var(--color-${color}-500)` }}
                                        title={color}
                                    >
                                        <span className={`block w-full h-full rounded-full bg-${color}-500`}></span>
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 bg-slate-100 dark:bg-white/10 p-1 rounded-xl">
                                <button 
                                    onClick={() => updatePref('mode', 'light')}
                                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-bold transition-all ${prefs.mode === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                >
                                    <Sun size={14} className="mr-1.5"/> Light
                                </button>
                                <button 
                                    onClick={() => updatePref('mode', 'dark')}
                                    className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-xs font-bold transition-all ${prefs.mode === 'dark' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                                >
                                    <Moon size={14} className="mr-1.5"/> Dark
                                </button>
                            </div>
                        </div>

                        {/* Contact & Socials (NEW) */}
                        <div className="space-y-3">
                             <LabelWithTooltip label="Contact Details" tooltip="Add your specific contact info to be displayed." icon={Mail} />
                             <div className="space-y-2">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Email (Optional)" 
                                        value={prefs.contact_email || ''} 
                                        onChange={(e) => updatePref('contact_email', e.target.value)}
                                        className="w-full pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                    <input 
                                        type="text" 
                                        placeholder="Phone (Optional)" 
                                        value={prefs.contact_phone || ''} 
                                        onChange={(e) => updatePref('contact_phone', e.target.value)}
                                        className="w-full pl-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    />
                                </div>
                             </div>

                             <LabelWithTooltip label="Custom Links" tooltip="Add links to Medium, Dribbble, Publications, etc." icon={LinkIcon} />
                             <div className="space-y-2">
                                 {prefs.custom_links.map((link) => (
                                     <div key={link.id} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                         <div className="flex-1 space-y-1">
                                             <input 
                                                placeholder="Label (e.g. Medium)" 
                                                value={link.label}
                                                onChange={(e) => updateCustomLink(link.id, 'label', e.target.value)}
                                                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none border-b border-transparent focus:border-indigo-500"
                                             />
                                             <input 
                                                placeholder="https://..." 
                                                value={link.url}
                                                onChange={(e) => updateCustomLink(link.id, 'url', e.target.value)}
                                                className="w-full bg-transparent text-[10px] text-slate-500 focus:outline-none border-b border-transparent focus:border-indigo-500"
                                             />
                                         </div>
                                         <button onClick={() => removeCustomLink(link.id)} className="text-slate-400 hover:text-red-500">
                                             <Trash2 size={14} />
                                         </button>
                                     </div>
                                 ))}
                                 <button 
                                    onClick={addCustomLink}
                                    className="w-full py-1.5 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-500 hover:text-indigo-500 hover:border-indigo-500 flex items-center justify-center gap-1 transition-all"
                                 >
                                    <Plus size={14} /> Add Link
                                 </button>
                             </div>
                        </div>

                        {/* Layout & Structure */}
                        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
                            <LabelWithTooltip 
                                label="Layout" 
                                icon={Layout} 
                                tooltip="Classic: Stacked sections. Split: Side-by-side Hero. Centered: Minimalist single column."
                            />
                            <select 
                                value={prefs.layout_style} 
                                onChange={(e) => updatePref('layout_style', e.target.value as any)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                                <option value="classic">Classic Stacked</option>
                                <option value="split">Split Screen Hero</option>
                                <option value="centered">Minimal Centered</option>
                            </select>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                    <LabelWithTooltip label="Corners" tooltip="Adjust the roundness of buttons and cards." />
                                    <select 
                                        value={prefs.corners} 
                                        onChange={(e) => updatePref('corners', e.target.value as any)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    >
                                        <option value="rounded">Rounded</option>
                                        <option value="semi_rounded">Semi</option>
                                        <option value="sharp">Sharp</option>
                                    </select>
                                </div>
                                <div>
                                    <LabelWithTooltip label="Nav Style" tooltip="Top Bar: Standard header. Pill: Floating menu. Sidebar: Vertical nav." />
                                    <select 
                                        value={prefs.nav_style} 
                                        onChange={(e) => updatePref('nav_style', e.target.value as any)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    >
                                        <option value="top_bar">Top Bar</option>
                                        <option value="pill_nav">Floating Pill</option>
                                        <option value="sidebar">Sidebar</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Vibe */}
                        <div className="space-y-3">
                            <LabelWithTooltip 
                                label="Vibe & Motion" 
                                icon={Zap} 
                                tooltip="Controls font personality and animation intensity."
                            />
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                                    <span className="flex items-center gap-1.5 text-xs"><Type size={12}/> Font Style</span>
                                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                                        {(['modern', 'formal', 'playful'] as const).map(v => (
                                            <button 
                                                key={v}
                                                onClick={() => updatePref('font_vibe', v)}
                                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${prefs.font_vibe === v ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500'}`}
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
                                    <span className="flex items-center gap-1.5 text-xs"><MousePointerClick size={12}/> Animation</span>
                                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                                        {(['none', 'subtle', 'full'] as const).map(l => (
                                            <button 
                                                key={l}
                                                onClick={() => updatePref('animation_level', l)}
                                                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${prefs.animation_level === l ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500'}`}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/10 space-y-3">
                        <button 
                            onClick={onGenerate}
                            disabled={isGenerating}
                            className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25 font-display disabled:opacity-70"
                        >
                            {isGenerating ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div> Designing...</>
                            ) : (
                                <><RefreshCcw size={16} className="mr-2"/> Generate Design</>
                            )}
                        </button>
                        
                        <button 
                            onClick={() => setShowCode(!showCode)}
                            disabled={!portfolioHtml}
                            className="w-full flex items-center justify-center py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-white rounded-xl font-bold transition-all font-body text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Code size={14} className="mr-2"/> {showCode ? 'View Preview' : 'View HTML Code'}
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-3xl shadow-lg border border-slate-200/50 dark:border-white/10 overflow-hidden flex flex-col h-full relative group">
                    <div className="bg-slate-100/50 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/10 p-3 flex justify-between items-center">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
                        </div>
                        <div className="text-xs font-bold text-slate-500 font-display uppercase tracking-wider flex items-center gap-1">
                            {showCode ? <Code size={12}/> : <Globe size={12}/>} 
                            {showCode ? 'Source Code' : 'Live Preview'}
                        </div>
                        <div className="flex gap-2">
                             {portfolioHtml && !showCode && (
                                <button onClick={() => setIsFullScreen(true)} className="text-slate-400 hover:text-indigo-500 transition-colors" title="View Full Screen">
                                    <Maximize2 size={14}/>
                                </button>
                             )}
                            <button onClick={copyToClipboard} disabled={!portfolioHtml} className="text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-30">
                                <Copy size={14}/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 relative bg-white dark:bg-slate-900">
                        {portfolioHtml ? (
                            showCode ? (
                                <textarea 
                                    readOnly 
                                    className="w-full h-full p-6 font-mono text-xs bg-slate-900 text-slate-100 resize-none outline-none leading-relaxed"
                                    value={portfolioHtml}
                                />
                            ) : (
                                <iframe 
                                    srcDoc={portfolioHtml} 
                                    className="w-full h-full border-0"
                                    title="Portfolio Preview"
                                    sandbox="allow-scripts allow-same-origin"
                                />
                            )
                        ) : (
                            <div className="w-full h-full flex items-center justify-center flex-col text-slate-400 gap-4 text-center p-8">
                                <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-2 animate-pulse">
                                    <Palette size={40} className="text-indigo-500 opacity-80"/>
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 font-display">Create Your Custom Portfolio</h3>
                                <p className="font-body text-sm max-w-xs leading-relaxed">
                                    Customize the theme, layout, and style on the left, then click <span className="font-bold text-indigo-500">Generate Design</span> to build your personal website using Gemini 3.
                                </p>
                            </div>
                        )}
                        
                        {isGenerating && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10 transition-all">
                                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center border border-slate-200 dark:border-slate-700">
                                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                                    <p className="text-base font-bold text-slate-800 dark:text-white font-display">Generating HTML...</p>
                                    <p className="text-xs text-slate-500 mt-2">Writing Tailwind classes & structure</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Full Screen Modal */}
            {isFullScreen && portfolioHtml && (
                <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col animate-fadeIn">
                    <div className="bg-slate-900 border-b border-white/10 p-4 flex justify-between items-center">
                        <span className="text-white font-bold font-display flex items-center gap-2">
                            <Globe size={16} className="text-indigo-400"/> Full Screen Preview
                        </span>
                        <button 
                            onClick={() => setIsFullScreen(false)} 
                            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
                        >
                            <X size={20}/>
                        </button>
                    </div>
                    <div className="flex-1 w-full bg-white relative">
                        <iframe 
                            srcDoc={portfolioHtml} 
                            className="w-full h-full border-0"
                            title="Portfolio Full Screen"
                            sandbox="allow-scripts allow-same-origin"
                        />
                    </div>
                </div>
            )}
        </>
    );
};
