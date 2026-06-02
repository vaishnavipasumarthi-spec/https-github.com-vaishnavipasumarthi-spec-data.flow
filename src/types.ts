/**
 * AI Output Validation Layer Types
 */

export type TaskType = 'Research' | 'Content Writing' | 'Resume Preparation' | 'Other';

export interface CalibrationProfile {
  calibration_level: 'Low' | 'Medium' | 'High';
  accepted_patterns: string[];
  rejected_patterns: string[];
  feedback_history: {
    taskId: string;
    taskType: TaskType;
    feedbackType: 'correct' | 'false_warning' | 'missed_issue';
    comment?: string;
  }[];
}

export interface ValidationRequest {
  prompt?: string;
  outputToValidate: string;
  selectedTaskType: 'auto' | TaskType;
  calibrationProfile?: CalibrationProfile;
}

export interface Risk {
  category: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface Improvement {
  suggestion: string;
  impact: 'High' | 'Medium' | 'Low';
  reason: string;
}

export interface ResearchValidation {
  evidence_strength: string;
  research_gaps: string[];
  verification_checklist: string[];
}

export interface ContentValidation {
  clarity_score: number; // 1-10
  tone_match: string;
  audience_alignment: string;
  content_improvements: string[];
}

export interface ResumeValidation {
  ats_score: number; // 1-100
  credibility_flags: string[];
  resume_improvements: string[];
}

export interface HumanReviewRequired {
  definitely_verify: string[];
  unsafe_assumptions: string[];
  restricted_decisions: string[];
}

export interface CalibrationInsights {
  calibration_level: 'Low' | 'Medium' | 'High';
  accepted_patterns_applied: string[];
  rejected_patterns_avoided: string[];
  confidence_adjustment: string;
}

export interface ValidationResponse {
  id: string; // generated on server
  timestamp: string;
  task_type: TaskType;
  task_type_confidence: number; // 0-100
  
  confidence_score: 'High' | 'Medium' | 'Low';
  confidence_explanation: string;
  
  risks: Risk[];
  improvements: Improvement[];
  
  research_validation?: ResearchValidation;
  content_validation?: ContentValidation;
  resume_validation?: ResumeValidation;
  
  human_review_required: HumanReviewRequired;
  
  calibration_insights?: CalibrationInsights;
}
