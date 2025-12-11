
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { generateInterviewQuestion, generateSpeech, transcribeAudio, evaluateInterviewAnswer, generateInterviewTopics } from '../services/geminiService';
import { MessageCircle, Send, PlayCircle, Award, RefreshCcw, Mic, Square, Play, Pause, AlertCircle, Loader2 } from 'lucide-react';
import { InterviewEvaluationResult, InterviewQuestion } from '../types';

interface Props {
  role: string;
  customTopics?: string[];
}

type InterviewState = 'setup' | 'loading_question' | 'asking' | 'ready_to_record' | 'recording' | 'processing' | 'results';

// --- PCM Audio Helper Functions ---
function decodeBase64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createAudioBufferFromPCM(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000, // Gemini TTS default
  numChannels: number = 1
): AudioBuffer {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const InterviewCoach: React.FC<Props> = ({ role, customTopics }) => {
  // State
  const [currentState, setCurrentState] = useState<InterviewState>('setup');
  const [topic, setTopic] = useState('');
  const [questionData, setQuestionData] = useState<InterviewQuestion | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null); // Store raw PCM base64
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<InterviewEvaluationResult | null>(null);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [isRefreshingTopics, setIsRefreshingTopics] = useState(false);
  
  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null); // For interim speech-to-text
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const questionSourceRef = useRef<AudioBufferSourceNode | null>(null); // For playing TTS

  // Shared Glass Card Classes
  const cardClass = "bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-3xl shadow-lg border border-slate-200/50 dark:border-white/10 transition-colors duration-300";
  const innerCardClass = "bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 rounded-xl";

  const isDynamic = customTopics && customTopics.length > 0;

  // Initialize topics
  useEffect(() => {
    if (customTopics && customTopics.length > 0) {
        setAvailableTopics(customTopics);
    } else {
        const r = role.toLowerCase();
        let defaults: string[] = [];
        if (r.includes('software') || r.includes('developer') || r.includes('engineer')) defaults = ['Data Structures', 'System Design', 'Behavioral'];
        else if (r.includes('data') || r.includes('analyst')) defaults = ['Statistics', 'Machine Learning', 'SQL'];
        else if (r.includes('product') || r.includes('manager')) defaults = ['Product Sense', 'Strategy', 'Behavioral'];
        else defaults = ['Core Competencies', 'Situational', 'Behavioral', 'Problem Solving', 'Leadership'];
        setAvailableTopics(defaults);
    }
  }, [role, customTopics]);

  // --- Cleanup on Unmount ---
  useEffect(() => {
    return () => {
        if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => {});
        }
    };
  }, []);

  const handleRefreshTopics = async () => {
      setIsRefreshingTopics(true);
      try {
          const newTopics = await generateInterviewTopics(role);
          if (newTopics && newTopics.length > 0) {
              setAvailableTopics(newTopics);
          }
      } catch (e) {
          console.error("Failed to refresh topics", e);
      } finally {
          setIsRefreshingTopics(false);
      }
  };

  // --- 1. Generate Question & TTS ---
  const handleStartSession = async () => {
    if (!topic) return;
    setCurrentState('loading_question');
    setTranscript('');
    setEvaluation(null);
    setInterimTranscript('');
    setAudioBase64(null);

    try {
        const qData = await generateInterviewQuestion(role, topic);
        setQuestionData(qData);

        // Generate TTS
        const generatedAudioBase64 = await generateSpeech(qData.question_text);
        if (generatedAudioBase64) {
            setAudioBase64(generatedAudioBase64);
            // Auto-play with slight delay
            setTimeout(() => playPcmAudio(generatedAudioBase64), 500);
        } else {
            // Fallback to browser TTS if API fails
            const utterance = new SpeechSynthesisUtterance(qData.question_text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            speechSynthesis.speak(utterance);
            setCurrentState('ready_to_record');
        }
    } catch (e) {
        console.error(e);
        setCurrentState('setup'); // Reset on failure
    }
  };

  const playPcmAudio = async (base64Data: string) => {
      if (!base64Data) return;

      // Stop previous playback if any
      if (questionSourceRef.current) {
          try { questionSourceRef.current.stop(); } catch(e) {}
      }

      try {
          // Initialize Context if needed
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          const ctx = audioContextRef.current;
          
          // Resume context if suspended (browser autoplay policy)
          if (ctx.state === 'suspended') {
              await ctx.resume();
          }

          const bytes = decodeBase64ToArrayBuffer(base64Data);
          const buffer = createAudioBufferFromPCM(bytes, ctx);
          
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          
          source.onended = () => {
              setIsPlayingQuestion(false);
              setCurrentState((prev) => prev === 'asking' ? 'ready_to_record' : prev);
          };
          
          questionSourceRef.current = source;
          setIsPlayingQuestion(true);
          setCurrentState('asking');
          source.start(0);

      } catch (e) {
          console.error("PCM Playback failed", e);
          setIsPlayingQuestion(false);
          setCurrentState('ready_to_record');
      }
  };

  // --- 2. Recording & Visualization ---
  const startRecording = async () => {
      try {
          // Ensure we stop any playing question before recording
          if (questionSourceRef.current) {
              try { questionSourceRef.current.stop(); } catch(e) {}
              setIsPlayingQuestion(false);
          }

          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          // Setup MediaRecorder
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (e) => {
              if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          mediaRecorder.start();
          setCurrentState('recording');

          // Setup Visualizer
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          const ctx = audioContextRef.current;
          
          // Resume if suspended
          if (ctx.state === 'suspended') await ctx.resume();

          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512; // Increased resolution
          analyser.smoothingTimeConstant = 0.8; // Smoothness
          const source = ctx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyserRef.current = analyser;
          sourceRef.current = source;
          drawVisualizer();

          // Setup Interim Transcription (Browser API)
          if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
              const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
              const recognition = new SpeechRecognition();
              recognition.continuous = true;
              recognition.interimResults = true;
              recognition.lang = 'en-US';
              
              recognition.onresult = (event: any) => {
                  let interim = '';
                  for (let i = event.resultIndex; i < event.results.length; ++i) {
                      if (event.results[i].isFinal) {
                          // We ignore final here, we rely on Gemini for final
                      } else {
                          interim += event.results[i][0].transcript;
                      }
                  }
                  setInterimTranscript(interim);
              };
              
              recognition.start();
              recognitionRef.current = recognition;
          }

      } catch (e) {
          console.error("Microphone access denied", e);
          alert("Microphone access is required to record your answer.");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && currentState === 'recording') {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.onstop = async () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              
              // Stop tracks
              mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
              if (recognitionRef.current) recognitionRef.current.stop();
              if (animationFrameRef.current !== null) cancelAnimationFrame(animationFrameRef.current);
              
              setCurrentState('processing');
              await processAnswer(audioBlob);
          };
      }
  };

  const drawVisualizer = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      const canvas = canvasRef.current;
      const canvasCtx = canvas.getContext('2d');
      const analyser = analyserRef.current;

      if (!canvasCtx) return;

      const draw = () => {
          animationFrameRef.current = requestAnimationFrame(draw);
          
          // High DPI scaling
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          
          if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
             canvas.width = Math.floor(rect.width * dpr);
             canvas.height = Math.floor(rect.height * dpr);
          }
          
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);

          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

          // Create horizontal gradient (Indigo -> Purple -> Pink)
          const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#6366f1'); // Indigo-500
          gradient.addColorStop(0.5, '#a855f7'); // Purple-500
          gradient.addColorStop(1, '#ec4899'); // Pink-500
          canvasCtx.fillStyle = gradient;

          const barWidth = 6 * dpr; 
          const gap = 4 * dpr; 
          const totalBarWidth = barWidth + gap;
          const maxBars = Math.floor(canvas.width / totalBarWidth);
          
          // Sample mostly from the lower/mid range for voice
          const effectiveDataLength = Math.floor(bufferLength * 0.8);
          const step = Math.floor(effectiveDataLength / maxBars) || 1;
          
          const totalVisualizerWidth = maxBars * totalBarWidth;
          const startX = (canvas.width - totalVisualizerWidth) / 2;

          for (let i = 0; i < maxBars; i++) {
              let value = 0;
              for (let j = 0; j < step; j++) {
                  if ((i * step + j) < bufferLength) {
                      value += dataArray[i * step + j];
                  }
              }
              value = value / step;

              // Mirrored Waveform Logic
              const percent = value / 255;
              // Add non-linear scaling for better sensitivity
              const height = Math.max((percent * percent) * (canvas.height * 0.9), 6 * dpr); 
              
              const x = startX + i * totalBarWidth;
              const y = (canvas.height - height) / 2; // Centered vertically

              canvasCtx.beginPath();
              // Check for roundRect support, fallback to rect
              if (typeof canvasCtx.roundRect === 'function') {
                  canvasCtx.roundRect(x, y, barWidth, height, 50);
              } else {
                  // Fallback for older browsers
                  canvasCtx.rect(x, y, barWidth, height);
              }
              canvasCtx.fill();
          }
      };
      draw();
  };

  // --- 3. Process & Evaluate ---
  const processAnswer = async (audioBlob: Blob) => {
      try {
          // Convert Blob to Base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
              const base64String = reader.result as string;
              const base64Data = base64String.split(',')[1];
              const mimeType = audioBlob.type || 'audio/webm';

              // 1. Transcribe with Gemini
              const finalTranscript = await transcribeAudio(base64Data, mimeType);
              setTranscript(finalTranscript);

              // 2. Evaluate with Gemini
              if (questionData && finalTranscript) {
                  const evalResult = await evaluateInterviewAnswer(questionData, finalTranscript);
                  setEvaluation(evalResult);
                  setCurrentState('results');
              } else {
                  // Fallback if transcription failed
                  setTranscript("Audio unintelligible or empty.");
                  setCurrentState('results'); // Show partial error state?
              }
          };
      } catch (e) {
          console.error("Processing failed", e);
          setCurrentState('ready_to_record');
      }
  };

  // --- Renders ---

  const renderSetup = () => (
    <div className="p-8 space-y-6 animate-fadeIn">
        <div>
            <div className="flex justify-between items-center mb-4">
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 font-display">Select a Topic</label>
                 <button 
                     onClick={handleRefreshTopics}
                     disabled={isRefreshingTopics}
                     className="text-xs flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold hover:underline disabled:opacity-50"
                 >
                     <RefreshCcw size={12} className={isRefreshingTopics ? "animate-spin" : ""} />
                     Refresh Topics
                 </button>
            </div>
            <div className="flex gap-3 flex-wrap">
            {availableTopics.map(t => (
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

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
             <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"/>
             <div className="text-xs text-blue-800 dark:text-blue-200 font-body">
                 <span className="font-bold block mb-1">Privacy Notice</span>
                 Audio is processed temporarily to provide feedback and is not stored beyond this session.
             </div>
        </div>

        <button 
            onClick={handleStartSession}
            disabled={!topic}
            className="w-full mt-4 flex items-center justify-center py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-indigo-500/25 font-display text-lg"
        >
            <PlayCircle className="w-5 h-5 mr-2" /> Start Interview Session
        </button>
    </div>
  );

  const renderActiveSession = () => (
      <div className="p-8 space-y-8 animate-fadeIn">
          {/* Question Card */}
          <div className="bg-indigo-50/60 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 shadow-inner relative">
              <div className="flex justify-between items-start mb-2">
                 <h3 className="text-xs font-extrabold text-indigo-600 dark:text-indigo-300 uppercase tracking-widest font-display">Interview Question</h3>
                 {audioBase64 && (
                     <button 
                        onClick={() => playPcmAudio(audioBase64)}
                        className="text-indigo-500 hover:text-indigo-700 transition-colors"
                        title="Replay Question"
                     >
                        {isPlayingQuestion ? <Loader2 className="w-4 h-4 animate-spin"/> : <PlayCircle className="w-5 h-5"/>}
                     </button>
                 )}
              </div>
              <p className="text-lg md:text-xl text-slate-900 dark:text-white font-medium leading-relaxed font-body">
                  {currentState === 'loading_question' ? (
                      <span className="flex items-center gap-2 text-slate-400"><Loader2 className="w-5 h-5 animate-spin"/> Generative AI is thinking...</span>
                  ) : questionData?.question_text}
              </p>
          </div>
          
          {/* Recorder / Visualizer Area */}
          <div className="flex flex-col items-center justify-center py-8 relative">
              {currentState === 'recording' ? (
                  <div className="relative w-full h-40 flex items-center justify-center bg-slate-50/50 dark:bg-black/20 rounded-3xl mb-6 overflow-hidden border border-slate-200 dark:border-white/10 shadow-inner transition-all duration-300">
                      <canvas ref={canvasRef} className="w-full h-full" />
                      
                      {/* Recording Indicator */}
                      <div className="absolute top-4 right-5 flex items-center gap-2 bg-white/80 dark:bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md border border-red-500/20">
                           <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                           <span className="text-xs font-bold text-red-600 dark:text-red-400 font-mono tracking-widest">REC</span>
                      </div>
                      
                      {/* Live Transcript Overlay */}
                      <div className="absolute bottom-4 left-0 right-0 text-center px-6 pointer-events-none">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 font-display tracking-wide truncate drop-shadow-sm bg-white/40 dark:bg-black/40 backdrop-blur-sm py-1.5 px-4 rounded-full inline-block border border-white/20">
                            {interimTranscript || "Listening..."}
                          </p>
                      </div>
                  </div>
              ) : (
                  <div className="w-full h-40 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl mb-6 text-slate-400 bg-slate-50/20 dark:bg-white/5">
                      <div className="text-center">
                          <p className="text-sm font-bold">Ready to Answer?</p>
                          <p className="text-xs">Click microphone to start recording</p>
                      </div>
                  </div>
              )}

              {/* Controls */}
              {currentState === 'processing' ? (
                   <div className="flex flex-col items-center gap-3">
                       <div className="w-16 h-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                       <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">Analyzing Answer...</p>
                   </div>
              ) : currentState === 'recording' ? (
                   <button 
                       onClick={stopRecording}
                       className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-red-500/40 transition-all flex items-center justify-center scale-110"
                   >
                       <Square className="fill-current w-8 h-8" />
                   </button>
              ) : (
                   <button 
                       onClick={startRecording}
                       disabled={currentState === 'loading_question' || currentState === 'asking'}
                       className="w-20 h-20 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white shadow-lg hover:shadow-indigo-500/40 transition-all flex items-center justify-center group"
                   >
                       <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
                   </button>
              )}
          </div>
      </div>
  );

  const renderResults = () => {
      if (!evaluation) return null;
      
      return (
          <div className="p-8 space-y-8 animate-fadeIn">
               {/* Score Header */}
               <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-white/10 pb-6">
                   <div>
                       <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-display">Evaluation Result</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Question: {questionData?.question_text}</p>
                   </div>
                   <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                    strokeDasharray={251.2} 
                                    strokeDashoffset={251.2 - (251.2 * evaluation.overall_score) / 100}
                                    className={`${evaluation.overall_score >= 80 ? 'text-emerald-500' : evaluation.overall_score >= 60 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000 ease-out`} 
                            />
                        </svg>
                        <span className="absolute text-2xl font-extrabold text-slate-800 dark:text-white">{evaluation.overall_score}</span>
                   </div>
               </div>

               {/* Transcript */}
               <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Transcript</h4>
                   <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{transcript}"</p>
                   <div className="flex gap-4 mt-3 text-xs text-slate-400">
                       <span>Words: {transcript.split(' ').length}</span>
                       <span>Confidence: {Math.round(evaluation.metrics.confidence_estimate * 100)}%</span>
                   </div>
               </div>

               {/* Feedback Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-4">
                       <h4 className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><Award size={16}/> What Went Well</h4>
                       <ul className="space-y-2">
                           {evaluation.what_went_well.map((item, i) => (
                               <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></div>
                                   {item}
                               </li>
                           ))}
                       </ul>
                   </div>
                   <div className="space-y-4">
                       <h4 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2"><AlertCircle size={16}/> Improvements</h4>
                       <ul className="space-y-2">
                           {evaluation.what_to_improve.map((item, i) => (
                               <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0"></div>
                                   {item}
                               </li>
                           ))}
                       </ul>
                   </div>
               </div>

               {/* Better Answer */}
               <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                   <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-3 text-sm uppercase tracking-wide">AI Suggested Answer</h4>
                   <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{evaluation.better_answer}</p>
               </div>

               <button 
                  onClick={() => { setCurrentState('setup'); }}
                  className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-all font-display flex items-center justify-center shadow-lg"
               >
                  <RefreshCcw className="w-5 h-5 mr-2" /> Start New Session
               </button>
          </div>
      );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className={`${cardClass} overflow-hidden min-h-[600px] flex flex-col`}>
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600/90 to-indigo-800/90 dark:from-indigo-900/80 dark:to-indigo-950/80 p-8 text-white backdrop-blur-md flex-shrink-0">
          <h2 className="text-2xl font-bold flex items-center font-display mb-2">
            <MessageCircle className="w-7 h-7 mr-3" />
            AI Interview Simulator
            {isDynamic && (
              <span className="ml-3 px-2 py-0.5 bg-indigo-500/20 text-indigo-200 text-xs rounded-full border border-indigo-500/30 uppercase tracking-wide shadow-sm">
                Tailored
              </span>
            )}
          </h2>
          <p className="opacity-90 text-indigo-100 dark:text-indigo-200 font-body text-sm md:text-base leading-relaxed">
            Practice with real-time voice interaction. Speak your answer, get instant transcription and scoring.
          </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col">
            {currentState === 'setup' && renderSetup()}
            {(currentState === 'loading_question' || currentState === 'asking' || currentState === 'ready_to_record' || currentState === 'recording' || currentState === 'processing') && renderActiveSession()}
            {currentState === 'results' && renderResults()}
        </div>
      </div>
    </div>
  );
};
