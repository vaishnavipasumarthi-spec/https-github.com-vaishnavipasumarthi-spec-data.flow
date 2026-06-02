import React, { useState } from 'react';
import { CalibrationProfile } from '../types';
import { Save, Brain, Check, Plus, Trash2, Award, Info, AlertTriangle } from 'lucide-react';

interface CalibrationPanelProps {
  profile: CalibrationProfile;
  setProfile: React.Dispatch<React.SetStateAction<CalibrationProfile>>;
}

export default function CalibrationPanel({ profile, setProfile }: CalibrationPanelProps) {
  const [newAccepted, setNewAccepted] = useState('');
  const [newRejected, setNewRejected] = useState('');

  const addAccepted = () => {
    if (newAccepted.trim() && !profile.accepted_patterns.includes(newAccepted.trim())) {
      const updated = {
        ...profile,
        accepted_patterns: [...profile.accepted_patterns, newAccepted.trim()]
      };
      setProfile(updated);
      localStorage.setItem('ai_validation_calibration', JSON.stringify(updated));
      setNewAccepted('');
    }
  };

  const addRejected = () => {
    if (newRejected.trim() && !profile.rejected_patterns.includes(newRejected.trim())) {
      const updated = {
        ...profile,
        rejected_patterns: [...profile.rejected_patterns, newRejected.trim()]
      };
      setProfile(updated);
      localStorage.setItem('ai_validation_calibration', JSON.stringify(updated));
      setNewRejected('');
    }
  };

  const removeAccepted = (idx: number) => {
    const updatedList = profile.accepted_patterns.filter((_, i) => i !== idx);
    const updated = { ...profile, accepted_patterns: updatedList };
    setProfile(updated);
    localStorage.setItem('ai_validation_calibration', JSON.stringify(updated));
  };

  const removeRejected = (idx: number) => {
    const updatedList = profile.rejected_patterns.filter((_, i) => i !== idx);
    const updated = { ...profile, rejected_patterns: updatedList };
    setProfile(updated);
    localStorage.setItem('ai_validation_calibration', JSON.stringify(updated));
  };

  const clearCalibration = () => {
    const fresh: CalibrationProfile = {
      calibration_level: 'Low',
      accepted_patterns: [],
      rejected_patterns: [],
      feedback_history: []
    };
    setProfile(fresh);
    localStorage.setItem('ai_validation_calibration', JSON.stringify(fresh));
  };

  // Determine active level
  const totalInteractions = profile.accepted_patterns.length + profile.rejected_patterns.length + profile.feedback_history.length;
  let calibrationLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (totalInteractions > 8) {
    calibrationLevel = 'High';
  } else if (totalInteractions > 2) {
    calibrationLevel = 'Medium';
  }

  return (
    <div id="calibration-panel-container" className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center bg-radial-at-t from-sky-50/20 via-transparent to-transparent">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-600 animate-pulse" />
          <div>
            <h3 className="font-display font-semibold text-slate-800 text-sm">Calibration Brain</h3>
            <p className="text-xs text-slate-400">Contextualizes validation logic</p>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider flex items-center gap-1 ${
          calibrationLevel === 'High' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          calibrationLevel === 'Medium' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
          'bg-slate-100 text-slate-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            calibrationLevel === 'High' ? 'bg-emerald-500' :
            calibrationLevel === 'Medium' ? 'bg-blue-500' :
            'bg-slate-400'
          }`} />
          {calibrationLevel} Level
        </span>
      </div>

      <div className="p-5 space-y-6 overflow-y-auto flex-1">
        {/* Intro */}
        <div className="text-xs text-slate-500 leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50 flex gap-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p>
            Suggestions or corrections you accept or log are stored here. On subsequent evaluations, they calibrate the system prompt, tailoring the assessment criteria to your personal style.
          </p>
        </div>

        {/* Accepted Registry */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Priorities to Emphasize
            </h4>
            <span className="text-[10px] text-slate-400">{profile.accepted_patterns.length} registered</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newAccepted}
              onChange={(e) => setNewAccepted(e.target.value)}
              placeholder="e.g. strict fact checking, highlight buzzwords"
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all placeholder:text-slate-300"
              onKeyDown={(e) => e.key === 'Enter' && addAccepted()}
            />
            <button
              onClick={addAccepted}
              className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
              title="Add preferred pattern"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {profile.accepted_patterns.length === 0 ? (
            <p className="text-[11px] text-slate-300 italic py-1 pl-1">No preferences configured yet</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
              {profile.accepted_patterns.map((pat, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] pl-2 pr-1.5 py-0.5 rounded-md hover:bg-emerald-100 transition">
                  {pat}
                  <button onClick={() => removeAccepted(idx)} className="hover:text-emerald-900 focus:outline-hidden">
                    <Trash2 className="w-3 h-3 text-emerald-400 hover:text-emerald-600" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Rejected Registry */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Warnings to Ignore
            </h4>
            <span className="text-[10px] text-slate-400">{profile.rejected_patterns.length} registered</span>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newRejected}
              onChange={(e) => setNewRejected(e.target.value)}
              placeholder="e.g. minor typos, structural style guidelines"
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition-all placeholder:text-slate-300"
              onKeyDown={(e) => e.key === 'Enter' && addRejected()}
            />
            <button
              onClick={addRejected}
              className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
              title="Add warning to ignore"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {profile.rejected_patterns.length === 0 ? (
            <p className="text-[11px] text-slate-300 italic py-1 pl-1">No warning bypasses configured yet</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
              {profile.rejected_patterns.map((pat, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 text-[10px] pl-2 pr-1.5 py-0.5 rounded-md hover:bg-rose-100 transition">
                  {pat}
                  <button onClick={() => removeRejected(idx)} className="hover:text-rose-900 focus:outline-hidden">
                    <Trash2 className="w-3 h-3 text-rose-400 hover:text-rose-600" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Calibration Feedbacks */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center border-t border-slate-100 pt-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-violet-500" />
              Correction Audit Trail
            </h4>
            <span className="text-[10px] text-slate-400">{profile.feedback_history.length} logged</span>
          </div>

          {profile.feedback_history.length === 0 ? (
            <p className="text-[11px] text-slate-300 italic py-1 pl-1">No historical feedback reported yet</p>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {profile.feedback_history.map((log, index) => (
                <div key={index} className="p-2 border border-slate-100 rounded-lg text-[10px] bg-slate-50 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-slate-500 bg-slate-200/60 px-1 py-0.2 rounded text-[9px]">{log.taskType}</span>
                    <span className={`px-1.5 py-0.2 rounded-full font-sans tracking-wide truncate ${
                      log.feedbackType === 'correct' ? 'bg-emerald-100 text-emerald-800' :
                      log.feedbackType === 'false_warning' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {log.feedbackType === 'correct' ? 'Precise' : log.feedbackType === 'false_warning' ? 'False Warning' : 'Missed Issue'}
                    </span>
                  </div>
                  {log.comment && <p className="text-slate-600 leading-tight italic">"{log.comment}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-2 max-h-16 shrink-0">
        <button
          onClick={clearCalibration}
          className="text-slate-400 text-[10px] font-semibold tracking-wider hover:text-slate-600 transition uppercase"
        >
          Reset Profile
        </button>
        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Check className="w-3 h-3 text-emerald-500" /> Auto-saved
        </span>
      </div>
    </div>
  );
}
