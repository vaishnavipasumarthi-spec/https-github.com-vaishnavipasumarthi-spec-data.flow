# AI Trust Layer / TrustCopilot

This document outlines the **User Journey Mapping** and **System Data Flow** designed for the TrustCopilot prototype. It serves as an architectural blueprint for understanding human-AI trust calibration.

---

## 1. User Journey Mapping

The User Journey Map illustrates the user experience of a professional evaluating high-stakes academic, content, or career material before deployment.

### User Persona: **The Skeptical Deliverer**
* **Goal**: Disseminate AI-generated content (reports, blogs, resumes) with absolute certainty and low professional liability.
* **Pain Point**: Hidden hallucinations, unquantified claims, boilerplate AI buzzwords, and lack of verified references.

| Journey Phase | 1. Intake & Preparation | 2. Vulnerability Scan | 3. Trust Calibration | 4. Verification Check | 5. Feedback Loop |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User Action** | Pastes AI-generated text or clicks a demo benchmark preset (e.g. Research). | Selects evaluation mode (e.g., auto-detect) and triggers **"Verify Security & Trust"**. | Reviews the confidence rating (High/Medium/Low) and detected risks. | Uses the "Must Triple-Check" checklist to verify facts manually. | Rates the precision of the audit or adds priority rules to the brain. |
| **System Event** | Populates text input block and selects context target. | Animates analysis phases; triggers the server-side validator API. | Emphasizes risks, lists top-5 suggestions, and profiles task compatibility. | Displays task-specific evaluation metrics (e.g., ATS scoring). | Saves preference weights inside the **Calibration Profile (LocalStorage)**. |
| **User Emotion** | *Anxious & Overwhelmed* | *Curious & Anticipating* | *Illuminated / Skeptical* | *Empowered / Focused* | *Confident & Validated* |
| **Trust Score** | **20%** (Blind Trust) | **40%** (Process active) | **65%** (Blind spots exposed) | **90%** (Human-verified) | **98%** (Custom calibrated) |
| **Key Output** | Raw raw-text draft | Animated progress telemetry | Classified Task Card | Specific checklist facts | Calibrated local weights |

---

## 2. User Data Flow Diagram

This diagram maps how information passes from client UI actions to server-side AI processing and returns to the interface securely.

```
+---------------------------------------------------------------------------------+
|                                1. CLIENT CANVAS                                 |
|                                                                                 |
|   +--------------------------+                         +---------------------+  |
|   |   Prompt Context & Text  |                         |  Calibration Panel  |  |
|   +------------+-------------+                         +----------+----------+  |
|                |                                                  |             |
|                | [Payload: Prompt, Text, Calibration weights]     |             |
|                v                                                  v             |
|     (POST to /api/validate)                             (Write LocalStorage)   |
+----------------|--------------------------------------------------|-------------+
                 |                                                  |
                 v                                                  |
+-----------------------------------------------------------------+ |
|            2. FULL-STACK EXPRESS SERVER (PORT 3000)             | |
|                                                                 | |
|  - Receives payload securely.                                   | |
|  - Extracts current Calibration Profile boundaries.             | |
|  - Prevents Client-Side key exposure.                           | |
|                                                                 | |
|         [Inject Environment: process.env.GEMINI_API_KEY]        | |
+----------------|------------------------------------------------+ |
                 |                                                  |
                 v                                                  |
+-----------------------------------------------------------------+ |
|                   3. GOOGLE GEMINI 3.5 ENGINE                   | |
|                                                                 | |
|  - Compares raw text with dynamic system rules.                 | |
|  - Classifies document type with match percentage parameters.   | |
|  - Checks citations & generates verification lists.             | |
|  - Returns structured, deterministic JSON schema response.       | |
+----------------|------------------------------------------------+ |
                 |                                                  |
                 v [Formatted JSON Output]                          |
+-----------------------------------------------------------------+ |
|               4. CLIENT RENDER & MEMORY UPDATE                  | |
|                                                                 | |
|  - Visualizes dynamic Task-Specific metrics panels.             | |
|  - Displays Interactive Feedback sliders.                       | |
|  - Clicking "Add to brain" updates LocalStorage. <----------------+             |
+---------------------------------------------------------------------------------+
```

---

## 3. Data Flow Step-by-Step Logic

1. **Intake Payload**: The client aggregates the user draft (`outputToValidate`), the original model prompt context (`prompt`), the audit mode, and the current list of custom rules inside the `CalibrationProfile`.
2. **Secure Transition**: The client submits a post payload to `/api/validate`. By proxying this call through our custom server, your private api key (`GEMINI_API_KEY`) is kept secure on the backend layer.
3. **Structured Reflection**: The server invokes `gemini-3.5-flash` with a custom JSON Schema. This ensures that the generated response maps directly to our strict validation objects (`risks`, `improvements`, and task-specific properties like `ats_score`).
4. **Local Calibration**: If the user modifies preferences or accepts suggestions, those rules are injected directly into subsequent API requests as custom calibration system instructions, continually refining the engine's accuracy over time.
