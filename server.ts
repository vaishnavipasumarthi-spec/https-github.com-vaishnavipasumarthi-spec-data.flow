import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Serve large payloads if needed for long outputs/resumes
app.use(express.json({ limit: '15mb' }));

// Initialize the Google Gemini client
// Only fail on actual request if key is missing to prevent crash-on-load issues as per guidelines
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Define the schema for response verification
const validationSchema = {
  type: Type.OBJECT,
  properties: {
    task_type: {
      type: Type.STRING,
      description: "Classified category of the task. Must be one of: 'Research', 'Content Writing', 'Resume Preparation', 'Other'."
    },
    task_type_confidence: {
      type: Type.INTEGER,
      description: "Confidence in task classification from 0 to 100."
    },
    confidence_score: {
      type: Type.STRING,
      description: "Validation confidence level: 'High', 'Medium', or 'Low'."
    },
    confidence_explanation: {
      type: Type.STRING,
      description: "Detailed explanation of why this confidence level was assigned, outlining the overall health and safety of the output text."
    },
    risks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "Category of risk (e.g., Potential Inaccuracy, Outdated information, Unsupported assumptions, Hallucination risk, Language/Tone inconsistency, Plagiarism/Originality concern)." },
          description: { type: Type.STRING, description: "Detailed description of the specific risk found in the AI output." },
          severity: { type: Type.STRING, description: "Severity of the risk: 'High', 'Medium', 'Low'." }
        },
        required: ["category", "description", "severity"]
      }
    },
    improvements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          suggestion: { type: Type.STRING, description: "Direct, constructive action the user can take." },
          impact: { type: Type.STRING, description: "Expected improvement impact: 'High', 'Medium', 'Low'." },
          reason: { type: Type.STRING, description: "Why making this change makes the AI output more reliable or professional." }
        },
        required: ["suggestion", "impact", "reason"]
      }
    },
    research_validation: {
      type: Type.OBJECT,
      properties: {
        evidence_strength: { type: Type.STRING, description: "Analysis of how strong and credible the references or arguments are." },
        research_gaps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Crucial viewpoints, missing contexts, missing statistics, or sources that are neglected."
        },
        verification_checklist: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of facts, figures, or assertions in the text that MUST be verified independently."
        }
      },
      required: ["evidence_strength", "research_gaps", "verification_checklist"]
    },
    content_validation: {
      type: Type.OBJECT,
      properties: {
        clarity_score: { type: Type.INTEGER, description: "Score from 1 to 10 for clarity, structure, and readability." },
        tone_match: { type: Type.STRING, description: "Evaluation of the tone and style (e.g., professional, active, jargon-heavy)." },
        audience_alignment: { type: Type.STRING, description: "Whether the text matches the needs, reading level, and expectations of its likely audience." },
        content_improvements: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Actionable points specifically on copywriting, structure, flow, or layout format."
        }
      },
      required: ["clarity_score", "tone_match", "audience_alignment", "content_improvements"]
    },
    resume_validation: {
      type: Type.OBJECT,
      properties: {
        ats_score: { type: Type.INTEGER, description: "Estimated ATS alignment score from 1 to 100 based on standard recruiter screens." },
        credibility_flags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Achievements that lack quantification, vague descriptions, buzzwords, or weak visual phrasing."
        },
        resume_improvements: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of suggestions to improve recruitment alignment."
        }
      },
      required: ["ats_score", "credibility_flags", "resume_improvements"]
    },
    human_review_required: {
      type: Type.OBJECT,
      properties: {
        definitely_verify: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Points, stats, names, dates, or assertions in the output that must be triple-checked."
        },
        unsafe_assumptions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Implicit assumptions made by the model that have high likelihood of being flawed or contextual."
        },
        restricted_decisions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Specific actions or decisions that should strictly not be made based solely on this output."
        }
      },
      required: ["definitely_verify", "unsafe_assumptions", "restricted_decisions"]
    },
    calibration_insights: {
      type: Type.OBJECT,
      properties: {
        calibration_level: { type: Type.STRING, description: "Calibrated experience level of the feedback database: 'Low', 'Medium', or 'High'." },
        accepted_patterns_applied: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Feedback patterns provided in calibration history that helped refine these recommendations."
        },
        rejected_patterns_avoided: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Avoided suggestions or patterns based on user history of rejected recommendations."
        },
        confidence_adjustment: { type: Type.STRING, description: "Explanation of how confidence rating shifted or was adjusted due to user's personal context." }
      },
      required: ["calibration_level", "accepted_patterns_applied", "rejected_patterns_avoided", "confidence_adjustment"]
    }
  },
  required: [
    "task_type",
    "task_type_confidence",
    "confidence_score",
    "confidence_explanation",
    "risks",
    "improvements",
    "human_review_required"
  ]
};

// API Endpoint for output validation
app.post('/api/validate', async (req, res) => {
  try {
    const { prompt, outputToValidate, selectedTaskType, calibrationProfile } = req.body;

    if (!outputToValidate || typeof outputToValidate !== 'string' || outputToValidate.trim().length === 0) {
      return res.status(400).json({ error: 'AI output text is empty or missing.' });
    }

    // Initialize/retrieve client
    const ai = getGeminiClient();

    // Prepare core instruction context
    let calibrationInstruction = '';
    if (calibrationProfile) {
      const accepted = calibrationProfile.accepted_patterns?.join(', ') || 'none';
      const rejected = calibrationProfile.rejected_patterns?.join(', ') || 'none';
      
      calibrationInstruction = `
[CALIBRATION PROFILE ACTIVE]
The user has customized their calibration preference:
- Accepted/Preferred patterns to focus on: ${accepted}
- Rejected/Ignored patterns to avoid suggesting: ${rejected}
Use this calibration profile to adjust your assessments:
1. Emphasize suggestions aligning with accepted/preferred patterns.
2. Completely avoid or reframe suggests matching rejected/ignored patterns.
3. Populate the 'calibration_insights' block reflecting how you applied or ignored these rules. Set calibration_level to based on the size of the history and adjust confidence_adjustment with clear rationale (e.g., '+5% confidence' or 'No adjustment').`;
    }

    const corePrompt = `
You are the AI Validation Engine working as an AI Trust Layer.
Your task is to thoroughly analyze, validate, and criticize the following AI-generated output to help a human determine whether they can trust it and how to verify it.

--- TOPIC CONTEXT ---
User's Original Prompt / Context:
${prompt ? prompt.trim() : "(No original prompt was provided)"}

AI-Generated Output to Validate:
${outputToValidate.trim()}

Selected Task Mode: ${selectedTaskType}
(If Selected Task Mode is 'auto', automatically detect the task type among: 'Research', 'Content Writing', 'Resume Preparation', 'Other'. If it is a specific value, respect it and run the logic corresponding to that type.)

--- CALIBRATION INSTRUCTIONS ---
${calibrationInstruction}

--- STEPS & RULES ---
1. Classify the output task into 'Research', 'Content Writing', 'Resume Preparation', or 'Other' and specify your classification confidence (0 to 100).
2. Generate a Unified Validation Panel:
   - confidence_score: High (extremely reliable, verified facts), Medium (good structure but needs some review), Low (contains high risk of halls, errors, or outdated info).
   - confidence_explanation: Give a clear 1-2 sentence honest briefing.
   - risks: Categorize potential inaccuracies, missing information, unsupported assumptions, outdated facts, or hallucination vectors. Limit to 3-5 specific points.
   - improvements: Limit to top 5 highest-impact suggestions with clear rationale and expected impact.
3. Apply Task-Specific Validation Logic:
   - If classified Task Type = 'Research', you MUST populate the 'research_validation' object. Give specific, non-vague feedback about evidence strength, point out what specific viewpoints/statistics are missing as research gaps, and list facts/citations in the verification checklist.
   - If classified Task Type = 'Content Writing', you MUST populate the 'content_validation' object. Provide a readability/clarity score (1-10), analyze the tone suitability, verify audience alignment, and list specific copywriting or messaging improvements.
   - If classified Task Type = 'Resume Preparation', you MUST populate the 'resume_validation' object. Estimate ATS compliance (1-100), flag achievements lacking quantification or vague sentences, and list recruitment-ready enhancements.
   - If classified Task Type = 'Other', analyze its content structure creatively but do not populate any of the three specific objects (research, content, resume) unless it closely approximates them.
4. Compose "Human Review Required" checklists using strong direct human-in-the-loop language. Highlight what should definitely be verified, what implicit model assumptions could be incorrect, and what sensitive decisions (e.g. professional, medical, financial, or employment hiring decisions) should NOT be made solely from this output.

Make sure your evaluation is objective, rigorous, and highly actionable. No hype. Return ONLY a valid JSON matching the schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: corePrompt,
      config: {
        systemInstruction: `You are an AI Output Validation Layer (Trust Layer & Verification Copilot).
Your goal is to increase user confidence when confidence is warranted, and increase user skepticism when confidence is not warranted.
Never present AI-generated content as fully correct. Be an objective, helpful, and highly detailed critic.`,
        responseMimeType: 'application/json',
        responseSchema: validationSchema,
        temperature: 0.1, // low temperature for precise, predictable structured validation
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    
    // Process server side response additions
    const results = {
      id: 'v_' + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      task_type: parsedData.task_type || 'Other',
      task_type_confidence: parsedData.task_type_confidence || 80,
      confidence_score: parsedData.confidence_score || 'Medium',
      confidence_explanation: parsedData.confidence_explanation || '',
      risks: parsedData.risks || [],
      improvements: parsedData.improvements || [],
      research_validation: parsedData.research_validation,
      content_validation: parsedData.content_validation,
      resume_validation: parsedData.resume_validation,
      human_review_required: parsedData.human_review_required || {
        definitely_verify: [],
        unsafe_assumptions: [],
        restricted_decisions: []
      },
      calibration_insights: parsedData.calibration_insights
    };

    return res.json(results);
  } catch (error: any) {
    console.error('Validation Error:', error);
    return res.status(500).json({ error: error.message || 'An internal validation error occurred.' });
  }
});

// Setup Vite & static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Output Validation Layer Server running on port ${PORT}`);
  });
}

startServer();
