import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Loader2, 
  Sparkles, 
  Copy, 
  Check, 
  Send, 
  FileText, 
  Brain, 
  FileUp, 
  Info, 
  ChevronRight, 
  MessageSquare, 
  ThumbsUp, 
  ArrowRight,
  ShieldCheck,
  Search,
  CheckSquare,
  FileCheck2,
  XCircle,
  Menu,
  X,
  History,
  TrendingUp,
  User,
  Settings,
  Sliders,
  ExternalLink,
  Bot
} from 'lucide-react';
import { PRESETS, PresetItem } from './presets';
import { TaskType, CalibrationProfile, ValidationResponse, Risk, Improvement } from './types';
import CalibrationPanel from './components/CalibrationPanel';

interface HistoricScan {
  id: string;
  timestamp: string;
  prompt: string;
  text: string;
  task_type: TaskType;
  response: ValidationResponse;
}

export default function App() {
  // Navigation & UI Layout states
  const [activeTab, setActiveTab] = useState<'audit' | 'brain' | 'presets' | 'history'>('audit');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [splitView, setSplitView] = useState<boolean>(true);

  // Core user input states
  const [prompt, setPrompt] = useState<string>('');
  const [outputToValidate, setOutputToValidate] = useState<string>('');
  const [selectedTaskType, setSelectedTaskType] = useState<'auto' | TaskType>('auto');
  
  // App operational states
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ValidationResponse | null>(null);
  const [copiedTextId, setCopiedTextId] = useState<string | null>(null);

  // Scanned history memory
  const [scanHistory, setScanHistory] = useState<HistoricScan[]>([]);

  // Calibration Memory & Profile
  const [calibrationProfile, setCalibrationProfile] = useState<CalibrationProfile>({
    calibration_level: 'Low',
    accepted_patterns: [
      'Focus heavily on quantitative claims & metrics',
      'Expose buzzword accumulation',
      'Prioritize sourcing and fact viability check'
    ],
    rejected_patterns: [
      'Do not warn about minor formatting issues'
    ],
    feedback_history: []
  });

  // User interactive action logging states
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  // Load profile and dynamic histories from local storage
  useEffect(() => {
    // 1. Profile
    const cachedProfile = localStorage.getItem('ai_validation_calibration');
    if (cachedProfile) {
      try {
        const parsed = JSON.parse(cachedProfile);
        if (parsed.accepted_patterns && parsed.rejected_patterns) {
          setCalibrationProfile(parsed);
        }
      } catch (e) {
        console.error('Failed to parse cached calibration', e);
      }
    }

    // 2. Scan history entries list
    const cachedHistory = localStorage.getItem('ai_validation_scans_history');
    if (cachedHistory) {
      try {
        setScanHistory(JSON.parse(cachedHistory));
      } catch (e) {
        console.error('Failed to load cached scan histories', e);
      }
    }
  }, []);

  // Preset Selection helper
  const handleSelectPreset = (preset: PresetItem) => {
    setPrompt(preset.prompt);
    setOutputToValidate(preset.output);
    if (preset.category === 'Research') setSelectedTaskType('Research');
    else if (preset.category === 'Content') setSelectedTaskType('Content Writing');
    else if (preset.category === 'Resume') setSelectedTaskType('Resume Preparation');
    else setSelectedTaskType('auto');
    setActiveTab('audit');
    setResponse(null);
    setError(null);
  };

  // Run AI Trust validation scan
  const handleValidate = async () => {
    if (!outputToValidate.trim()) {
      setError('Please provide or paste the AI-generated text response you wish to validate.');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);
    setFeedbackSuccess(false);
    setFeedbackComment('');
    setActiveTab('audit');

    const stages = [
      'Deconstructing stated claims and extracting assertions...',
      'Evaluating evidence strength & looking up research gaps...',
      'Analyzing copywriting structure for linguistic tone overrides...',
      'Computing ATS recruitment viability scores...',
      'Generating rigorous human-in-the-loop verification lists...'
    ];

    let currentStage = 0;
    setLoadingStage(stages[currentStage]);
    
    // Cycle progress strings
    const stageInterval = setInterval(() => {
      if (currentStage < stages.length - 1) {
        currentStage++;
        setLoadingStage(stages[currentStage]);
      }
    }, 1500);

    try {
      const apiResponse = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          outputToValidate,
          selectedTaskType,
          calibrationProfile
        })
      });

      if (!apiResponse.ok) {
        const errJson = await apiResponse.json().catch(() => ({}));
        throw new Error(errJson.error || 'The server encountered an error processing the text.');
      }

      const data = await apiResponse.json();
      setResponse(data);

      // Save to localized history database cached list
      const freshHistoricEntry: HistoricScan = {
        id: data.id,
        timestamp: new Date().toISOString(),
        prompt: prompt,
        text: outputToValidate,
        task_type: data.task_type,
        response: data
      };

      const updatedHistory = [freshHistoricEntry, ...scanHistory].slice(0, 50); // limit 50 logs
      setScanHistory(updatedHistory);
      localStorage.setItem('ai_validation_scans_history', JSON.stringify(updatedHistory));

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected server error occurred during text auditing.');
    } finally {
      clearInterval(stageInterval);
      setLoading(false);
    }
  };

  // Switch to a previous scan audit log
  const handleLoadHistoricScan = (scan: HistoricScan) => {
    setPrompt(scan.prompt);
    setOutputToValidate(scan.text);
    setResponse(scan.response);
    setSelectedTaskType(scan.task_type);
    setActiveTab('audit');
    setError(null);
  };

  // Delete specific historic log item
  const handleDeleteHistoricScan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = scanHistory.filter(h => h.id !== id);
    setScanHistory(updated);
    localStorage.setItem('ai_validation_scans_history', JSON.stringify(updated));
    if (response?.id === id) {
      setResponse(null);
    }
  };

  // Clipboard copies
  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextId(id);
    setTimeout(() => setCopiedTextId(null), 2000);
  };

  // Add suggestion to Calibration preferred patterns
  const handleAcceptSuggestion = (suggestion: string) => {
    // Avoid duplicates
    if (calibrationProfile.accepted_patterns.includes(suggestion)) return;
    
    const updated: CalibrationProfile = {
      ...calibrationProfile,
      accepted_patterns: [...calibrationProfile.accepted_patterns, suggestion]
    };
    setCalibrationProfile(updated);
    localStorage.setItem('ai_validation_calibration', JSON.stringify(updated));
  };

  // Submit assessment feedback
  const handleSubmitFeedback = (type: 'correct' | 'false_warning' | 'missed_issue') => {
    if (!response) return;

    const newLog = {
      taskId: response.id,
      taskType: response.task_type,
      feedbackType: type,
      comment: feedbackComment || `Marked validation as ${type === 'correct' ? 'Precise' : type === 'false_warning' ? 'False Warning' : 'Missed Issue'}`
    };

    const updatedProfile: CalibrationProfile = {
      ...calibrationProfile,
      feedback_history: [newLog, ...calibrationProfile.feedback_history]
    };

    setCalibrationProfile(updatedProfile);
    localStorage.setItem('ai_validation_calibration', JSON.stringify(updatedProfile));
    setFeedbackSuccess(true);
    setFeedbackComment('');
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex antialiased hover:transition-all">
      
      {/* 1. LEFT SIDEBAR CONSOLE (ChatGPT Style) */}
      <aside 
        className={`${
          sidebarOpen ? 'w-68' : 'w-0 -translate-x-full md:w-16 md:translate-x-0'
        } transition-all duration-300 border-r border-slate-100 flex flex-col shrink-0 bg-slate-50/70 h-screen sticky top-0 overflow-hidden z-50`}
      >
        {/* Sidebar Header dropdown */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-4.5 h-4.5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="text-left">
                <span className="font-display font-bold text-xs uppercase tracking-wide text-slate-800 flex items-center gap-1">
                  Trust Layer <span className="text-[9px] font-mono font-medium text-indigo-600">v1.1</span>
                </span>
                <p className="text-[10px] text-slate-400 truncate">Verification Engine</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title={sidebarOpen ? "Minimize Sidebar" : "Expand Sidebar"}
          >
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Sidebar Middle Actions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          
          {/* Main Actions group */}
          <div className="space-y-1">
            {/* New audit session block */}
            <button
              onClick={() => {
                setPrompt('');
                setOutputToValidate('');
                setResponse(null);
                setError(null);
                setActiveTab('audit');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 shadow-3xs transition text-left cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-slate-900 shrink-0" />
              {sidebarOpen && <span>New Audit Scan</span>}
            </button>

            {/* Calibration Memory profile item */}
            <button
              onClick={() => setActiveTab('brain')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition text-left cursor-pointer ${
                activeTab === 'brain' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Brain className={`w-4 h-4 shrink-0 ${activeTab === 'brain' ? 'text-indigo-600' : 'text-slate-400'}`} />
              {sidebarOpen && (
                <div className="flex-1 flex justify-between items-center">
                  <span>Calibration Brain</span>
                  <span className="text-[9px] font-mono bg-indigo-100/60 px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider text-indigo-700">Active</span>
                </div>
              )}
            </button>

            {/* Presets and samples */}
            <button
              onClick={() => setActiveTab('presets')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition text-left cursor-pointer ${
                activeTab === 'presets' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              {sidebarOpen && <span>Demo Benchmark Library</span>}
            </button>
          </div>

          {/* Previous Scans History database */}
          <div className="space-y-1.5 pt-2">
            {sidebarOpen && (
              <div className="px-2.5 flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assessment Registry</span>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-200/50 px-1.5 rounded-full">{scanHistory.length} drafts</span>
              </div>
            )}
            
            {scanHistory.length === 0 ? (
              sidebarOpen && (
                <p className="text-[10px] text-slate-400 italic px-2.5 py-2">
                  No records stored yet. Audited claims will log automatically.
                </p>
              )
            ) : (
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {scanHistory.map((scan) => (
                  <div
                    key={scan.id}
                    onClick={() => handleLoadHistoricScan(scan)}
                    className={`group w-full flex items-center justify-between p-2 rounded-lg text-left cursor-pointer transition text-[11px] ${
                      response?.id === scan.id ? 'bg-slate-200/60 text-slate-900 border border-slate-200' : 'text-slate-650 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                      <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {sidebarOpen ? (
                        <div className="truncate pr-1">
                          <p className="font-semibold truncate leading-tight">
                            {scan.prompt || scan.response.confidence_explanation}
                          </p>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(scan.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {scan.task_type}
                          </span>
                        </div>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                      )}
                    </div>
                    {sidebarOpen && (
                      <button
                        onClick={(e) => handleDeleteHistoricScan(scan.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50/50 transition shrink-0"
                        title="Delete record"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Sidebar bottom footer metadata */}
        {sidebarOpen && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3.5">
            {/* User status */}
            <div className="flex items-center gap-2 p-1 text-xs">
              <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-700 shrink-0">
                U
              </div>
              <div className="truncate">
                <p className="font-bold text-slate-800 leading-tight text-[11px] truncate">user@gmail.com</p>
                <p className="text-[9px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  OAuth verified sandbox
                </p>
              </div>
            </div>

            <div className="pt-2 text-[9px] text-slate-400 leading-snug border-t border-slate-200/50 flex flex-col gap-1 font-sans">
              <p>📍 Dev Mode: Port 3000 Ingress</p>
              <p>⏱️ System Clock: UTC 2026</p>
            </div>
          </div>
        )}
      </aside>

      {/* 2. MAIN CENTER CONTAINER (ChatGPT Aesthetic) */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-white">
        
        {/* Top bar header */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-white/90 backdrop-blur-md z-45">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition shrink-0"
              title="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-slate-800">TrustCopilot 1.1</span>
              <span className="text-[10px] border border-slate-200 bg-slate-50 text-slate-500 font-mono px-1.5 rounded">
                Verified Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            {response && (
              <button
                onClick={() => setSplitView(!splitView)}
                className="hidden sm:inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold px-3 py-1.5 rounded-xl border border-slate-250 transition cursor-pointer"
              >
                {splitView ? '📄 Hide Source Block' : '🔀 Show Split Document'}
              </button>
            )}
            <span className="text-[10px] uppercase font-bold px-2 py-1.5 rounded bg-emerald-50 text-emerald-800 font-mono flex items-center gap-1 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sandbox Container
            </span>
          </div>
        </header>

        {/* Dynamic Inner Tab Router Container */}
        <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 md:px-8 max-w-5xl mx-auto w-full flex flex-col justify-between">
          
          {/* TAB 1: Main Analysis Audit Screen */}
          {activeTab === 'audit' && (
            <div className="w-full flex-1 space-y-8 flex flex-col justify-between">

              {!response && !loading ? (
                /* Initial Chat-style Greeting state layout */
                <div className="w-full max-w-3xl mx-auto py-12 flex flex-col items-center justify-center text-center space-y-12">
                  <div className="space-y-4">
                    <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                      <ShieldCheck className="w-7 h-7 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="font-display font-medium text-slate-900 text-3xl tracking-tight">
                        What can I help with?
                      </h2>
                      <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                        Audit, analyze, and criticize AI-generated text output. Uncover hidden hallucinations, verify cited claims, check recruiter ATS compliance, and receive high-impact recommendations.
                      </p>
                    </div>
                  </div>

                  {/* Pill benchmark choices matching ChatGPT */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">Or load an evaluation template to try</span>
                    <div className="flex flex-wrap gap-2.5 justify-center">
                      <button 
                        onClick={() => handleSelectPreset(PRESETS[0])}
                        className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-350 rounded-full text-xs font-semibold cursor-pointer transition flex items-center gap-2 bg-white"
                      >
                        <Search className="w-3.5 h-3.5 text-indigo-500" />
                        📊 Examine Research Adoption Data
                      </button>
                      <button 
                        onClick={() => handleSelectPreset(PRESETS[1])}
                        className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-350 rounded-full text-xs font-semibold cursor-pointer transition flex items-center gap-2 bg-white"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-amber-500" />
                        ✍️ Analyze Empathy Copywriting
                      </button>
                      <button 
                        onClick={() => handleSelectPreset(PRESETS[2])}
                        className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-350 rounded-full text-xs font-semibold cursor-pointer transition flex items-center gap-2 bg-white"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                        📄 Audit Software Engineer Resume
                      </button>
                    </div>
                  </div>

                  {/* Gorgeous Multi-line pill-inspired Input Console box */}
                  <div className="w-full space-y-4 transition-all duration-200">
                    <div className="relative border border-slate-200 bg-white rounded-3xl shadow-xs focus-within:ring-1 focus-within:ring-slate-400 focus-within:border-slate-400 transition-all overflow-hidden p-4">
                      
                      {/* Original Prompt input inline box */}
                      <div className="flex gap-2 border-b border-slate-100 pb-2 mb-3 items-center">
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono shrink-0 border border-indigo-100">Original Prompt</span>
                        <input 
                          type="text" 
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="What prompt or brief was supplied to the AI?"
                          className="w-full text-xs text-slate-700 bg-transparent outline-none border-none placeholder:text-slate-300"
                        />
                      </div>

                      {/* Main raw output text editing textbox */}
                      <textarea
                        value={outputToValidate}
                        onChange={(e) => setOutputToValidate(e.target.value)}
                        placeholder="Paste the AI-generated text response you wish to validate here..."
                        rows={6}
                        className="w-full text-sm font-sans text-slate-850 bg-transparent outline-none border-none resize-none placeholder:text-slate-400 leading-relaxed"
                      />

                      {/* Bottom row: selector and audit execute icon button */}
                      <div className="flex justify-between items-center pt-3.5 mt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Validation Type:</span>
                          <select
                            value={selectedTaskType}
                            onChange={(e) => setSelectedTaskType(e.target.value as any)}
                            className="text-xs bg-slate-50 border border-slate-200 rounded-xl py-1 px-3 text-slate-600 font-semibold font-sans hover:bg-slate-100 outline-none transition cursor-pointer"
                          >
                            <option value="auto">🤖 Auto-Detect (Dynamic Model Audit)</option>
                            <option value="Research">📊 Research & Sourcing Audit</option>
                            <option value="Content Writing">✍️ Copywriting & Messaging Audit</option>
                            <option value="Resume Preparation">📄 CV & Recruitment Readiness Audit</option>
                            <option value="Other">⚙️ Other / General Document Audit</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          {outputToValidate.trim() && (
                            <button
                              onClick={() => setOutputToValidate('')}
                              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 hover:bg-slate-50 rounded"
                            >
                              Clear Text
                            </button>
                          )}
                          <button
                            onClick={handleValidate}
                            disabled={loading || !outputToValidate.trim()}
                            className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full transition shadow-md flex items-center justify-center disabled:opacity-20 disabled:hover:bg-slate-900 cursor-pointer text-xs"
                            title="Analyze AI output text"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              ) : loading ? (
                /* Dynamic visual loading states matching elegant terminal analysis */
                <div className="w-full max-w-2xl mx-auto py-16 text-center space-y-6">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-pulse" />
                    <div className="absolute inset-y-0 left-0 w-16 h-16 border-4 border-t-indigo-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
                  </div>
                  
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-slate-450 block font-mono">Running Security Guard Layers</span>
                    <h3 className="font-display font-bold text-slate-800 text-lg">Performing Deep Validation Scan</h3>
                    <p className="text-xs text-indigo-600 font-mono font-medium animate-pulse">"{loadingStage}"</p>
                  </div>
                </div>
              ) : (
                /* ACTIVE COMPILED ASSESSMENT (Full details report view) */
                <div className="w-full space-y-8 animate-fadeIn">
                  
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT REPORT STREAM VIEW (Pristine typography representation) */}
                    <div className={`${response && splitView ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-8`}>
                      
                      {/* Certification overview Banner card */}
                      <div className="bg-slate-50 rounded-2xl border border-slate-150 p-6 relative overflow-hidden bg-radial-at-t from-slate-100/50 via-transparent to-transparent">
                        <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                          response.confidence_score === 'High' ? 'bg-emerald-500' :
                          response.confidence_score === 'Medium' ? 'bg-amber-400' : 'bg-rose-500'
                        }`} />

                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div>
                            <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                              Trust Evaluation Report
                            </span>
                            <h3 className="font-display font-black text-slate-850 text-xl tracking-tight mt-2 flex items-center gap-1.5">
                              Audit Certification
                              <span className="text-xs font-mono font-medium text-slate-400 bg-white px-2 py-0.5 border border-slate-200 rounded">
                                ID: {response.id}
                              </span>
                            </h3>
                          </div>

                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono ${
                            response.confidence_score === 'High' ? 'bg-emerald-50 text-emerald-800 border border-emerald-250' :
                            response.confidence_score === 'Medium' ? 'bg-amber-55 text-amber-850 border border-amber-250' :
                            'bg-rose-50 text-rose-800 border border-rose-250'
                          }`}>
                            Confidence: {response.confidence_score}
                          </span>
                        </div>

                        {/* Summary overview text */}
                        <div className="mt-5 text-slate-600 leading-relaxed text-xs">
                          <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1 uppercase tracking-wider text-[10px] font-mono">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                            Security Health Assessor Explanation:
                          </p>
                          {response.confidence_explanation}
                        </div>
                      </div>

                      {/* 1. CLASSIFICATION ANALYSIS METRIC */}
                      <div className="p-5 border border-slate-150 bg-white rounded-2xl space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-[11px] uppercase font-mono font-extrabold tracking-wider text-slate-450">
                            1. Task Classification
                          </h4>
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold font-sans bg-slate-100 text-slate-800 border border-slate-200">
                            {response.task_type} Auditing
                          </span>
                        </div>
                        
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
                          <div className="text-left text-xs">
                            <p className="font-semibold text-slate-700">Classification Certainty Map</p>
                            <p className="text-slate-400">Calibration index matching specific category parameters</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden shrink-0">
                              <div className="bg-slate-800 h-full rounded-full" style={{ width: `${response.task_type_confidence}%` }} />
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-800">{response.task_type_confidence}% Match</span>
                          </div>
                        </div>
                      </div>

                      {/* 2 & 3. RISK ASSESSMENT MATRIX */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-rose-500" />
                          <h4 className="text-[11px] uppercase font-mono font-extrabold tracking-wider text-slate-450">
                            2 & 3. Vulnerability Analysis & Risk Matrix
                          </h4>
                        </div>

                        {response.risks.length === 0 ? (
                          <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            No vulnerability or source integrity alerts were generated for this output. Excellent health score.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-3">
                            {response.risks.map((risk, index) => (
                              <div key={index} className="p-4 rounded-xl border border-slate-150 bg-white hover:shadow-3xs transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-mono tracking-wider bg-slate-100 text-slate-500 font-bold px-1.5 py-0.2 rounded border border-slate-200 uppercase">
                                    {risk.category}
                                  </span>
                                  <p className="text-xs text-slate-700 font-sans leading-relaxed">{risk.description}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 font-mono ${
                                  risk.severity === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  risk.severity === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}>
                                  {risk.severity} Severity
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 4. PRACTICAL IMPROVEMENT SUGGESTIONS (Top 5 Priority items) */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[11px] uppercase font-mono font-extrabold tracking-wider text-slate-450 flex items-center gap-1.5">
                            <Sliders className="w-4.5 h-4.5 text-indigo-500" />
                            4. Recommended Adjustments (Limit Top 5 Priorities)
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">Review the top critical edits to make. Apply to calibrate the future scanning criteria.</p>
                        </div>

                        <div className="space-y-3">
                          {response.improvements.slice(0, 5).map((imp, idx) => (
                            <div key={idx} className="p-4 rounded-xl border border-slate-150 hover:border-indigo-200 transition bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                              <div className="space-y-1 max-w-lg text-left">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="text-xs font-bold text-slate-850 hover:text-indigo-900 transition">
                                    {imp.suggestion}
                                  </span>
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                    imp.impact === 'High' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                    imp.impact === 'Medium' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {imp.impact} Impact
                                  </span>
                                </div>
                                <p className="text-xs text-slate-450 pl-7 leading-relaxed">{imp.reason}</p>
                              </div>

                              <button
                                onClick={() => handleAcceptSuggestion(imp.suggestion)}
                                className="text-[10px] font-mono tracking-wide bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 font-extrabold px-2.5 py-1.5 rounded-lg border border-slate-200 transition shrink-0 flex items-center gap-1 cursor-pointer"
                                title="Add priorities rule filters to Calibration brain"
                              >
                                <Brain className="w-3 h-3 text-indigo-500" />
                                Add to Brain
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 5. CATEGORIC VALIDATION SPECIFICS */}
                      <div className="p-5 border border-slate-150 bg-white rounded-2xl space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                          <h4 className="text-[11px] uppercase font-mono font-extrabold tracking-wider text-slate-450">
                            5. Task Specific Audit Breakdown ({response.task_type})
                          </h4>
                          <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase font-bold border border-indigo-100">
                            {response.task_type} Mode
                          </span>
                        </div>

                        {/* Research specific metrics elements */}
                        {response.task_type === 'Research' && response.research_validation && (
                          <div className="space-y-4 text-xs">
                            <div className="bg-indigo-50 hover:bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 text-left">
                              <h5 className="font-extrabold text-indigo-900 mb-1">Evidence Strength Indicator</h5>
                              <p className="text-slate-700 leading-relaxed font-sans">{response.research_validation.evidence_strength}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2 p-4 rounded-xl border border-slate-150 bg-slate-50 text-left">
                                <h5 className="font-bold text-orange-700 uppercase tracking-wider text-[10px] flex items-center gap-1 pt-1 font-mono">
                                  <AlertTriangle className="w-4 h-4" />
                                  Crucial Research Gaps
                                </h5>
                                <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                                  {response.research_validation.research_gaps.map((gap, i) => (
                                    <li key={i} className="leading-relaxed">{gap}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="space-y-2 p-4 rounded-xl border border-slate-150 bg-slate-50 text-left">
                                <h5 className="font-bold text-indigo-800 uppercase tracking-wider text-[10px] flex items-center gap-1 pt-1 font-mono">
                                  <CheckSquare className="w-4 h-4" />
                                  Facts Verification Checklist
                                </h5>
                                <ul className="space-y-1.5 list-decimal pl-4 text-slate-600">
                                  {response.research_validation.verification_checklist.map((item, i) => (
                                    <li key={i} className="leading-relaxed">{item}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Copywriting specificity */}
                        {response.task_type === 'Content Writing' && response.content_validation && (
                          <div className="space-y-4 text-xs text-left">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 text-center flex flex-col justify-center items-center">
                                <span className="text-[9px] uppercase font-bold text-slate-450 tracking-wider">Linguistic Clarity Score</span>
                                <div className="text-3xl font-display font-black text-slate-900 mt-1">
                                  {response.content_validation.clarity_score}/10
                                </div>
                                <div className="w-20 bg-slate-200 h-1 rounded-full overflow-hidden mt-1.5">
                                  <div className="bg-indigo-605 h-full rounded" style={{ width: `${response.content_validation.clarity_score * 10}%` }} />
                                </div>
                              </div>

                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 col-span-2 space-y-1">
                                <span className="text-[9px] uppercase font-bold text-slate-405 block tracking-wider">Audience Alignment Profile</span>
                                <div className="leading-relaxed">
                                  <strong>Tone:</strong> <span className="text-slate-600">{response.content_validation.tone_match}</span>
                                </div>
                                <div className="leading-relaxed mt-1">
                                  <strong>Audience Expected Match:</strong> <span className="text-slate-600">{response.content_validation.audience_alignment}</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 space-y-2">
                              <h5 className="font-extrabold text-indigo-900 uppercase tracking-wider text-[10px] font-mono">
                                Copywriting Adjustments
                              </h5>
                              <ul className="space-y-1.5 list-disc pl-4 text-slate-650">
                                {response.content_validation.content_improvements.map((improvement, index) => (
                                  <li key={index} className="leading-relaxed">{improvement}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        {/* CV optimization layout */}
                        {response.task_type === 'Resume Preparation' && response.resume_validation && (
                          <div className="space-y-4 text-xs text-left">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 text-center flex flex-col justify-center items-center">
                                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Estimated ATS Alignment</span>
                                <div className="text-3xl font-display font-black text-indigo-700 mt-1">
                                  {response.resume_validation.ats_score}%
                                </div>
                                <div className="w-20 bg-slate-200 h-1 rounded-full overflow-hidden mt-1.5">
                                  <div className="bg-indigo-600 h-full" style={{ width: `${response.resume_validation.ats_score}%` }}></div>
                                </div>
                              </div>

                              <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 col-span-2 space-y-1.5">
                                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Qualitative Credibility Weaknesses</span>
                                {response.resume_validation.credibility_flags.length === 0 ? (
                                  <p className="text-emerald-700 italic">No structural credibility gaps flagged.</p>
                                ) : (
                                  <ul className="space-y-1 list-disc pl-4 text-slate-600">
                                    {response.resume_validation.credibility_flags.map((flag, idx) => (
                                      <li key={idx} className="leading-relaxed">{flag}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>

                            <div className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 space-y-2">
                              <h5 className="font-bold text-indigo-900 uppercase tracking-wider text-[10px] font-mono">
                                Recruiter-Ready Corrections
                              </h5>
                              <ul className="space-y-1.5 list-disc pl-4 text-slate-650 font-sans">
                                {response.resume_validation.resume_improvements.map((improvement, index) => (
                                  <li key={index} className="leading-relaxed">{improvement}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 6. REQUIRED HUMAN IN THE LOOP (No Blind Trust Rule) */}
                      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-250 space-y-4">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-amber-700" />
                          <div>
                            <h4 className="font-display font-extrabold text-[#78350f] text-sm">
                              6. Human Review Required Checklist
                            </h4>
                            <p className="text-[11px] text-amber-800">Critical verification procedures as per AI Outputs Safety Validation protocol.</p>
                          </div>
                        </div>

                        <div className="space-y-4 text-xs text-amber-950 text-left">
                          <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-250 flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="font-bold leading-normal text-amber-900 font-sans">
                              Do not make hiring, financial, legal, medical, or business decisions solely based on this AI-generated output.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 p-3.5 bg-white/60 rounded-xl border border-amber-200">
                              <h5 className="font-bold text-[9px] uppercase tracking-wider text-amber-900 flex items-center gap-1 font-mono">
                                <CheckSquare className="w-3.5 h-3.5" /> Must Triple-Check
                              </h5>
                              <ul className="space-y-1.5 list-disc pl-4 text-slate-700 font-sans leading-relaxed">
                                {response.human_review_required.definitely_verify.map((v, i) => (
                                  <li key={i}>{v}</li>
                                ))}
                              </ul>
                            </div>

                            <div className="space-y-2 p-3.5 bg-white/60 rounded-xl border border-amber-200">
                              <h5 className="font-bold text-[9px] uppercase tracking-wider text-rose-800 flex items-center gap-1 font-mono">
                                <ShieldAlert className="w-3.5 h-3.5" /> Postpone Decisions
                              </h5>
                              <ul className="space-y-1.5 list-disc pl-4 text-slate-700 font-sans leading-relaxed">
                                {response.human_review_required.restricted_decisions.map((r, i) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 7. CALIBRATION PROFILE EXCLUSIONS */}
                      {response.calibration_insights && (
                        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 space-y-4 text-left border border-slate-800 shadow-sm">
                          <div className="flex justify-between items-center">
                            <h4 className="text-[10px] uppercase font-mono font-bold tracking-widest text-indigo-300 flex items-center gap-2">
                              <Brain className="w-4 h-4 text-indigo-400" />
                              7. Calibration Insights
                            </h4>
                            <span className="text-[9px] bg-indigo-500/10 text-indigo-300 font-mono font-bold border border-indigo-500/20 px-2 py-0.5 rounded">
                              Calibrated Level: {response.calibration_insights.calibration_level}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-slate-850 rounded-xl space-y-2 border border-slate-800">
                              <h5 className="font-bold font-mono tracking-wider uppercase text-[9px] text-indigo-400">Preferred Rules Enforced</h5>
                              {response.calibration_insights.accepted_patterns_applied.length === 0 ? (
                                <p className="text-slate-500 italic font-sans pr-1">No custom tags activated.</p>
                              ) : (
                                <ul className="space-y-1 list-disc pl-4 text-slate-300 leading-relaxed font-sans">
                                  {response.calibration_insights.accepted_patterns_applied.map((p, idx) => (
                                    <li key={idx}>{p}</li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            <div className="p-3 bg-slate-850 rounded-xl space-y-2 border border-slate-800">
                              <h5 className="font-bold font-mono tracking-wider uppercase text-[9px] text-rose-300">Ignored Warnings Bypassed</h5>
                              {response.calibration_insights.rejected_patterns_avoided.length === 0 ? (
                                <p className="text-slate-500 italic font-sans pr-1">No custom filters bypassed.</p>
                              ) : (
                                <ul className="space-y-1 list-disc pl-4 text-slate-300 leading-relaxed font-sans">
                                  {response.calibration_insights.rejected_patterns_avoided.map((p, idx) => (
                                    <li key={idx} className="line-through text-slate-500">{p}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 text-xs text-indigo-200">
                            <strong>System Confidence Shift Math:</strong> {response.calibration_insights.confidence_adjustment}
                          </div>
                        </div>
                      )}

                      {/* INTERACTIVE PRECISION TIMELINE FEEDBACK */}
                      <div className="bg-indigo-50/30 rounded-2xl p-6 border border-indigo-150 space-y-4 text-left">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-indigo-650" />
                          <div>
                            <h4 className="font-display font-extrabold text-slate-800 text-sm">Calibration Brain Feedback Loop</h4>
                            <p className="text-xs text-slate-400">Rate the correctness of this validation audit to teach the Calibration memory.</p>
                          </div>
                        </div>

                        {!feedbackSuccess ? (
                          <div className="space-y-3">
                            <textarea
                              placeholder="Describe why this report is correct, incomplete, or contains a false validation warning..."
                              value={feedbackComment}
                              onChange={(e) => setFeedbackComment(e.target.value)}
                              rows={2}
                              className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-600 transition text-slate-700"
                            />
                            
                            <div className="flex flex-wrap gap-2 justify-end">
                              <button
                                onClick={() => handleSubmitFeedback('correct')}
                                className="px-3 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer border border-emerald-600"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" /> High Precision Audit
                              </button>
                              <button
                                onClick={() => handleSubmitFeedback('false_warning')}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer border border-amber-600"
                              >
                                False Alarm Warning
                              </button>
                              <button
                                onClick={() => handleSubmitFeedback('missed_issue')}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition cursor-pointer border border-rose-600"
                              >
                                Missed Violation
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/50 text-xs flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <div>
                              <p className="font-bold text-emerald-900">Correction Memory Locked!</p>
                              <p className="text-emerald-700 text-[11px] mt-0.5">The Calibration Brain completed learning from your audit inputs.</p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* RIGHT PREVIEW DOCK (Keep context visible to audit easily!) */}
                    {splitView && (
                      <div className="lg:col-span-5 h-[calc(100vh-140px)] sticky top-24 overflow-y-auto space-y-4 border border-slate-150 rounded-2xl p-5 bg-slate-50/40">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-mono text-[9px] uppercase font-bold tracking-widest text-slate-400 block">Analyzed Input Document</span>
                          <button
                            onClick={() => triggerCopy(outputToValidate, 'source')}
                            className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                          >
                            {copiedTextId === 'source' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            Copy Original
                          </button>
                        </div>
                        
                        {prompt && (
                          <div className="p-3 bg-white rounded-xl border border-slate-200 text-left">
                            <span className="text-[9px] uppercase font-bold text-indigo-600 font-mono block mb-1">Supplied Brief Mode</span>
                            <p className="text-xs text-slate-600 italic font-mono">"{prompt}"</p>
                          </div>
                        )}

                        <div className="p-4 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 text-left relative">
                          <span className="text-[9px] font-mono text-slate-500 tracking-wider block border-b border-slate-800 pb-2 mb-2">Original AI Text Raw Outputs</span>
                          <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono text-slate-300 leading-relaxed font-normal">{outputToValidate}</pre>
                        </div>
                      </div>
                    )}

                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: Dynamic Calibration brain */}
          {activeTab === 'brain' && (
            <div className="w-full max-w-2xl mx-auto space-y-6">
              <div className="text-left border-b border-slate-100 pb-4">
                <h2 className="font-display font-bold text-2xl text-slate-950 flex items-center gap-2">
                  <Brain className="w-6 h-6 text-indigo-600" />
                  Context-Aware System Calibration
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Adjust active system preferences or blacklist unwanted guidelines. The calibration weights are instantly evaluated into subsequent prompt cycles.
                </p>
              </div>

              <div className="h-full">
                <CalibrationPanel 
                  profile={calibrationProfile} 
                  setProfile={setCalibrationProfile} 
                />
              </div>
            </div>
          )}

          {/* TAB 3: Preset Benchmark Library panel */}
          {activeTab === 'presets' && (
            <div className="w-full max-w-4xl mx-auto space-y-8 text-left">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="font-display font-medium text-2xl text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  Audit Benchmark Library
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Load predefined draft configurations targeting different evaluation tasks to test confidence matrices, evidence metrics, and ATS matching algorithms.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PRESETS.map((p, index) => (
                  <div 
                    key={index} 
                    className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 hover:border-slate-350 transition flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-wider ${
                        p.category === 'Research' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        p.category === 'Content' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                        'bg-emerald-50 text-emerald-800 border border-emerald-100'
                      }`}>
                        {p.category} Mode Validation
                      </span>
                      <h4 className="font-display font-bold text-slate-800 text-sm leading-snug">{p.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                        <strong>Brief prompt:</strong> "{p.prompt}"
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectPreset(p)}
                      className="w-full text-center py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      Retrieve Benchmark Audit Draft
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

        <footer className="h-14 border-t border-slate-100 text-center flex items-center justify-center px-4 bg-white text-slate-400 text-xs">
          <p>© 2026 AI Output Trust Layer. Created as a Trust & Verification Copilot for system safety auditing.</p>
        </footer>

      </div>

    </div>
  );
}
