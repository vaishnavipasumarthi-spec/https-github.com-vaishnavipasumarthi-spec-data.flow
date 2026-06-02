# AI Output Validation Layer — User Journey & Data Flow

This document outlines the detailed **User Journey Mapping** and underlying **System Data Flow** architecture for the **AI Output Validation Layer** (TrustCopilot). This covers how a user initiates an audit, how the server-side AI validates the output, and how interactive feedback loops calibrate subsequent evaluations.

---

## 1. User Journey Mapping

The user journey represents the experiences, cognitive states, and trust levels of professional writers, researchers, or recruiters validating high-stakes text outputs before delivery.

```
       [ 1. Audit Initiation ] ───> [ 2. AI Trust Processing ] ───> [ 3. Verification & Calibration ]
```

### Phase 1: Audit Initiation
* **User Goal**: Check an AI-generated draft for accuracy, credentials credibility, or copywriting effectiveness against a specific prompt.
* **Actions**: 
  1. The user copies an AI-generated response from ChatGPT, Claude, or Gemini.
  2. They paste it into the editor workspace, optionally adding the original context prompt.
  3. They select an audit mode (e.g. `Research & Sourcing` or `Auto-Detect`).
* **System Response**: Prepares the UI payload, sets initial state, and disables inputs.

### Phase 2: AI Processing (Deep Analysis)
* **User Goal**: Get a quick, objective critique of vulnerabilities, sources, and improvements.
* **Actions**: The user clicks **"Verify Security & Trust"** and watches the analysis progress.
* **System Response**:
  1. Activates terminal-style loading telemetry representing key analysis phases (claims extraction, evidence rating, ATS indexing).
  2. Executes a server-side request to path `/api/validate` appending the active custom **Calibration Profile**.
  3. Uses `gemini-3.5-flash` with structured schema constraints to parse and grade the text objectively.

### Phase 3: Interactive Review & Feedback Loops
* **User Goal**: Extract action items to verify facts manually, and tune the model.
* **Actions**:
  1. Reviewing the **Unified Validation Panel** containing core confidence score, risk matrix, and top-5 suggestions.
  2. Clicking **"Add to Brain"** on any recommended suggestion to emphasize that priority in subsequent validation tasks.
  3. Rating the precision of the current audit (Precise, False Warning, or Missed Issue) to record context.
* **System Response**: Saves the updated rules dynamically to **LocalStorage**, updating user's calibrated baseline.

---

## 2. Technical Data Flow Diagram

This data flow mapping explains how client inputs are transferred to the full-stack server proxy, analyzed via Gemini, returned as structured data, and saved locally.

```
 +-----------------------------------------------------------------------------------------+
 |                               1. CLIENT SIDE (VITE + REACT)                             |
 |                                                                                         |
 |  [ Raw Text Input ] + [ Context Prompt ] + [ Calibration Patterns ]                     |
 |        │                                                                                |
 |        ▼ (Appends custom LocalStorage rules)                                            |
 |  [ Payload Serialization ] ──( POST /api/validate )──────────────────────────────┐     |
 |                                                                                   │     |
 +───────────────────────────────────────────────────────────────────────────────────┼─────+
                                                                                     │
                                                                                     ▼
 +-----------------------------------------------------------------------------------------+
 |                            2. SERVER SIDE (EXPRESS BACKEND)                             |
 |                                                                                         |
 |  - Mounts active /api/validate endpoint.                                                |
 |  - Injects secure `process.env.GEMINI_API_KEY` from environment.                        |
 |  - Avoids client-side exposure of API secrets.                                          |
 |  - Compiles the meta-prompt containing Calibration Guidelines.                          |
 |        │                                                                                |
 |        ▼                                                                                |
 +─────────────────────────────────────────────────────────────────────────────────────────+
                                                                                     │
                                                                                     ▼
 +-----------------------------------------------------------------------------------------+
 |                              3. GOOGLE GEMINI 3.5 APIS                                  |
 |                                                                                         |
 |  - Executes content generation using `gemini-3.5-flash`.                                |
 |  - Validates output text structure with formal JSON schemas.                            |
 |  - Returns deterministic fields: severity risks, task validations, human checklists.      |
 |        │                                                                                |
 |        ▼                                                                                |
 +─────────────────────────────────────────────────────────────────────────────────────────+
                                                                                     │
                                                                                     ▼
 +-----------------------------------------------------------------------------------------+
 |                             4. DETERMINISTIC ACTION RESPONSES                           |
 |                                                                                         |
 |  - Client parses structured JSON response.                                              |
 |  - Visualizes rich categorized widgets (Risk Matrix, ATS dials, Evidence indicators).   |
 |  - Logging audit feedbacks writes back directly to user's Calibration History.          |
 +-----------------------------------------------------------------------------------------+
```

---

## 3. Security & Operational Safety

1. **Proxy Protection**: All third-party Gemini requests must go through the Node.js server to shield the private key from reverse engineering or leakage inside browser inspector headers.
2. **Deterministic Schemas**: Using Gemini Schema structures guarantees the UI receives consistent parameters and scores, guarding the frontend layer from runtime rendering crashes.
3. **Local Sovereignty**: Custom user history data stays inside local browser cache profiles, ensuring high-speed access without secondary database dependencies.
