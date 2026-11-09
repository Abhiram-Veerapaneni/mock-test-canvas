<div align="center">

# 🎓 Mock Test Canvas

### Enterprise-Grade AI-Proctored Computer-Based Testing Platform
**Engineered for High-Stakes Competitive Examinations (JEE Advanced, NEET, GATE & Aptitude)**

[![Live Frontend](https://img.shields.io/badge/Live%20App-Vercel-black?style=for-the-badge&logo=vercel)](https://mock-test-canvas.vercel.app)
[![API Status](https://img.shields.io/badge/API%20Status-Live%20on%20Render-emerald?style=for-the-badge&logo=render)](https://mock-test-canvas.onrender.com/api/health)
[![React 19](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/atlas)

<p align="center">
  <a href="#-key-features">Key Features</a> •
  <a href="#-architecture--tech-stack">Tech Stack</a> •
  <a href="#-complete-dependency-manifest--rationale">Dependencies</a> •
  <a href="#-security--proctoring-engine">Proctoring Engine</a> •
  <a href="#-project-directory-structure">Project Structure</a> •
  <a href="#-environment-configuration">Configuration</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-documentation">API Reference</a>
</p>

</div>

---

## 🌟 Executive Summary

**Mock Test Canvas** is a production-grade, full-stack assessment portal replicating the authentic interface and rigorous constraints of national-level computer-based examinations (such as India's **NTA JEE Advanced / Main**, **NEET**, and **GATE**).

Built with **React 19**, **Tailwind CSS v4**, **Node.js/Express**, and **MongoDB Atlas**, it combines:
- An **authentic national-grade exam canvas** with KaTeX LaTeX math rendering and multi-format question support.
- An **active client-side anti-cheat lockdown** with fullscreen enforcement, tab/window traps, input suppression, and a zero-drift Web Worker countdown clock.
- **On-device AI proctoring** using MediaPipe vision for face/gaze tracking, Web Audio API anomaly monitoring, and Cloudinary snapshot evidence capture.
- A **Dynamic Trust Score Engine** ($100 \rightarrow 0$) that penalizes infractions and enforces auto-termination upon integrity exhaustion.
- A **deterministic server-side grading engine** that strictly safeguards answer keys and handles complex marking schemes (+4 / -1, negative scoring).
- An **Exam Authoring Studio & AI Ingestion Pipeline** enabling creators to convert DOCX, PDF, and diagrams into LaTeX tests via Google Gemini.
- A **Centralized Question Bank** with dynamic filtering and automated one-click test generation.

---

## 🎯 Key Features

### 1. 🖥️ Authentic National Exam Player
- **STEM Formula Engine (KaTeX)**: Flawless client-side rendering of complex LaTeX formulas, matrices, integrals, fractions, chemical equations, and Greek symbols.
- **Multi-Format Question Canvas**: Native handling of Single-Choice (MCQ), Multi-Choice (MSQ), and Numerical Answer Type (NAT) questions.
- **Persistent Session State**: Powered by Zustand and `localStorage` syncing; accidental browser crashes or reloads restore answers and timer seamlessly without losing progress.

### 2. 🛡️ Advanced In-Browser Lockdown & Proctoring
- **Zero-Drift Web Worker Timer**: Solves browser background tab throttling. Uses a dedicated Web Worker running on `performance.now()` delta timestamps, combined with wall-clock reconciliation on tab return.
- **Fullscreen Enforcer with Gesture Gate**: Requires full-screen mode to test. Detects exit immediately, blocks interface with an unclosable lock overlay, records infractions, and handles browser auto-fullscreen permissions via user-gesture gates.
- **Tab & Window Focus Traps**:
  - Monitors the **Page Visibility API** (`visibilitychange`) to trap tab-switching.
  - Intercepts **Window Blur** (`blur`) for Alt+Tab detection.
  - Intelligent co-fire debouncer eliminates false-positive double strikes when switching tabs triggers both blur and visibility events simultaneously.
- **Wall-Clock Tab Return Correction & Extended Absence**: If a user switches tabs, real elapsed time is subtracted from the exam clock upon return. Absences exceeding 30 seconds trigger scaled `EXTENDED_ABSENCE` violations (up to -20 trust penalty).
- **Suppression of DevTools & Shortcuts**:
  - Disables right-click context menu (`contextmenu`).
  - Intercepts clipboard shortcuts: Copy (`Ctrl+C`), Cut (`Ctrl+X`), Paste (`Ctrl+V`), Select All (`Ctrl+A`).
  - Blocks DevTools & browser shortcuts: `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+Shift+C`, `Ctrl+Shift+K`, `Ctrl+U` (View Source), `Ctrl+S`, `Ctrl+P`, and `Alt+F4`.

### 3. 📷 On-Device ML Vision & Audio AI Proctoring
- **MediaPipe Vision Tracking**: Runs lightweight `@mediapipe/tasks-vision` models directly in the candidate's browser to detect face absence (`NO_FACE`), multiple occupants (`MULTI_FACE`), and abnormal head orientation/gaze deviations.
- **Ambient Noise & Audio Anomaly Hook**: Web Audio API monitors decibel thresholds in real time to intercept candidate conversations or coaching assistance (`NOISE_SPIKE`).
- **Cloudinary Snapshot Evidence**: Automatically snaps timestamped webcam frames upon infraction triggers and uploads them securely to Cloudinary for educator audit inspection.

### 4. ⚖️ Tiered Trust Score Engine ($100 \rightarrow 0$)
- Candidates start each test with a pristine **100 Trust Score**.
- Violations trigger tiered penalties proportional to intent:
  - **Fullscreen Exit**: `-20 pts` (deliberate drop out)
  - **Tab Switch**: `-15 pts` (high cheat risk)
  - **Multi-Face in Frame**: `-20 pts` (potential outside assistance)
  - **No Face Detected**: `-15 pts` (candidate left workspace)
  - **Extended Absence (>30s)**: `-10` to `-20 pts` (scaled by duration away)
  - **Window Focus Lost**: `-10 pts` (potential background application lookup)
  - **Noise Anomaly**: `-10 pts` (excessive volume/talking)
- **10-Second Cooldown**: Prevents rapid multi-penalty stacking from single accidental events.
- **Early Warning Threshold**: An alert modal triggers when the trust score drops to $\le 30$.
- **Automated Termination**: When trust drops to $0$, a 5-second countdown modal activates, automatically terminating and submitting the candidate's paper.
- **Cross-Session Persistence & Exam Scoping**: Trust scores and violations persist across page refreshes for the active exam, preventing candidates from clearing penalties with F5.

### 5. 🧮 Deterministic Server-Side Grading Engine
- **Zero Client Answer Exposure**: The `GET /api/exams/:id` endpoint explicitly projects out `correctAnswers` and `explanation` via Mongoose (`-correctAnswers -explanation`), preventing answers from being snooped in the Network tab.
- **Server Evaluation**: Scores are computed deterministically on the backend (`grading.service.js`) using authentic exam rules:
  - Positive marks for correct selections.
  - Negative marks for incorrect answers.
  - Multi-select matching validation.
  - Numerical range bounds verification for NAT.
- **Attempt Tracking & History**: Retains historical attempts with timestamps, scores, percentage accuracy, question breakdown, and audit logs.

### 6. 🤖 Automated AI Question Ingestion (Gemini 2.5 Flash)
- **Multimodal Document Extraction**: Upload raw `.docx`, `.pdf`, or question diagram images directly into the Test Creator studio (`/create-test`).
- **Automated Structuring**: Google Gemini transforms raw unstructured papers into standardized JSON schema with extracted LaTeX formulas, option keys, and step-by-step solutions.
- **Ingestion Review Studio**: Interactive modal preview allowing educators to review, edit, discard, or batch-import AI-extracted questions before publishing.

### 7. 📚 Question Bank & Dynamic Exam Generator
- **Centralized Question Repository (`/question-bank`)**: Search and filter thousands of questions across streams (`Engineering`, `Medical`, `Aptitude`, `General`), topics, and difficulty ratings.
- **Dynamic Exam Synthesis (`/api/questions/generate-exam`)**: Automatically generate full-length practice tests on the fly from question bank pools matching specified subjects and tags.
- **Cloud Diagram Management**: Direct image uploads to Cloudinary for math diagrams, circuits, chemical reaction pathways, and geometric figures.

### 8. 📡 Live Proctor Workstation & Audit Telemetry
- **Real-Time WebSocket Streaming**: Dispatches instant `violation:live` socket alerts to exam creators when candidates commit infractions.
- **Dedicated Live Monitor (`/test/:testId/live`)**: Real-time supervision dashboard displaying connected test takers, trust score gauges, and live camera snapshot feeds.
- **Granular Post-Exam Audit (`/test/:testId/audit`)**: Timestamped violation timeline, photographic evidence gallery, and score reports for post-test integrity verification.

### 9. 📊 Performance Analytics & BYOK AI Pedagogical Explanations
- **Bring Your Own Key (BYOK) Architecture**: Candidates can supply their personal Google Gemini API key to unlock on-demand, step-by-step pedagogical solutions directly in post-exam review sheets.
- **Zero Server Retention Guarantee**: The key is kept locally in the candidate's browser, forwarded via the `X-Gemini-Key` header, instantiated in ephemeral memory per-request, and instantly garbage-collected without ever being logged or saved to the database. Wiped automatically on logout.
- **Model Choice**: Flexible model selection with one-click toggling between `gemini-2.5-flash` (recommended), `gemini-1.5-flash`, `gemini-2.0-flash`, and `gemini-1.5-pro`.
- **Score Progression Trend**: Recharts visualization mapping chronological score evolution, contrasting official vs. practice attempts.
- **Subject Mastery & Topic Heatmap**: Dynamic aggregation evaluating subject streams and question tags to highlight weaknesses and track 14-day study streaks.
- **Decile Score Distribution Histogram**: Deep dive per-exam analysis bucketing student marks into 10 deciles (0–10% through 91–100%).
- **Global Official Leaderboard**: Fair, cheat-resilient leaderboard grouping official attempt performance across all candidates with personalized rank pinning.

### 10. 🔐 Dual Authentication: JWT & Google OAuth
- Traditional registration/login with email, **bcrypt** salted password hashing, and email OTP verification.
- Native **Google OAuth 2.0** integration (`google-auth-library`) for instant one-tap candidate sign-in.
- Stateless, cryptographically signed JSON Web Tokens (JWT) stored in secure cookies or `Authorization` headers.

---

## 🏗️ Architecture & Tech Stack

```mermaid
graph TD
    subgraph Client ["Client (React 19 + Vite + Tailwind CSS v4)"]
        UI[Exam Canvas, Catalog & Bank UI]
        Store[Zustand Stores: Auth / Exam / Proctor / Notif]
        Worker[Web Worker: Drift-Free Timer]
        Vision[MediaPipe Face & Gaze Tracking]
        Lockdown[useBrowserLockdown & Security Hooks]
        KaTeX[KaTeX Math Engine]
    end

    subgraph Security ["Security Perimeter"]
        Gate[Fullscreen Gate & Blur Traps]
        Trust[Dynamic Trust Score Engine 100->0]
        Sanitizer[Response Sanitizer: Answer Key Exclusion]
    end

    subgraph Server ["Server (Node.js + Express ES Modules)"]
        Router[Express REST API]
        SocketServer[Socket.IO Real-Time Gateway]
        AuthCtrl[Auth Controller: JWT + Google + OTP]
        ExamCtrl[Exam Controller: Catalog & Authoring]
        SubCtrl[Submission Controller & Grader]
        AICtrl[AI Ingestion Controller: Gemini GenAI]
        GradingService[Deterministic Grading Service]
    end

    subgraph Cloud ["Cloud & Third-Party Infrastructure"]
        Mongo[(MongoDB Atlas Cluster)]
        Cloudinary[(Cloudinary Snapshot CDN)]
        Gemini[Google Gemini 2.5 Flash API]
        Vercel[Vercel Edge Deployment]
        Render[Render API Web Service]
    end

    UI --> Store
    UI --> KaTeX
    Lockdown --> Gate --> Trust
    Vision --> Trust
    Worker --> Store
    Store --> Router
    Store <--> SocketServer
    Router --> Sanitizer
    Router --> AuthCtrl
    Router --> ExamCtrl
    Router --> AICtrl --> Gemini
    Router --> SubCtrl --> GradingService
    SubCtrl --> Cloudinary
    Server --> Mongo
    Client -.Deployed on.-> Vercel
    Server -.Deployed on.-> Render
```

### Layer-by-Layer Technology Matrix

| Domain | Technology | Purpose & Responsibility |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19.2 + Vite 8.2** | Next-generation React build with concurrent rendering and instant HMR. |
| **Styling & Design** | **Tailwind CSS v4.3** | High-performance CSS engine with glassmorphism, responsive breakpoints, and dark mode. |
| **State Management** | **Zustand 5.0** | Atomic client stores (`useAuthStore`, `useExamStore`, `useProctorStore`, `useNotificationStore`) with `persist` middleware. |
| **Math Typography** | **KaTeX 0.18** | High-speed, TeX-compliant math formula rendering for complex STEM equations. |
| **AI Computer Vision** | **@mediapipe/tasks-vision** | On-device face presence, multiple face detection, and head pose/gaze tracking. |
| **Real-time WebSockets** | **Socket.io + Client 4.8** | Real-time candidate proctoring alerts (`violation:live`) and supervisor synchronization. |
| **Data Visualization** | **Recharts 3.10** | Accuracy trends, subject-wise score matrices, and attempt telemetry charts. |
| **Backend Framework**| **Node.js + Express 4.21** | ES Modules server with async routing and structured JSON middleware. |
| **Database & ODM** | **MongoDB Atlas + Mongoose 8.9** | Cloud document database with strict schemas (`User`, `Exam`, `Question`, `Attempt`, `Notification`, `Otp`). |
| **Authentication** | **JWT + Google Auth Library** | Dual stateless auth: 30-day signed tokens + Google OAuth ID Token verification + Email OTP. |
| **AI Integration** | **@google/genai (Gemini API)** | Multimodal question extraction pipeline converting `.docx`, `.pdf`, and diagrams to structured LaTeX. |
| **Cloud Storage** | **Cloudinary v2** | Automated hosting of proctoring violation webcam snapshots and question diagram media. |
| **Hosting & CI/CD** | **Vercel (Client) + Render (API)** | Production edge routing with HTTPS and CORS parity. |

### 📦 Complete Dependency Manifest & Rationale

#### Backend Dependencies (`server/package.json`)

| Package | Version | Category | Purpose & Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **`express`** | `^4.21.2` | Web Framework | Core backend HTTP framework handling routes, controllers, middleware execution, and REST API endpoints. |
| **`mongoose`** | `^8.9.5` | Database ODM | Connects to MongoDB, manages schemas, validation, relationships, and queries for users, exams, questions, and attempts. |
| **`@google/genai`** | `latest` | AI / LLM SDK | Official Google Gemini API SDK used for automated question ingestion, test diagnostics, and step-by-step explanations. |
| **`jsonwebtoken`** | `^9.0.3` | Authentication | Issues, signs, and cryptographically verifies stateless JSON Web Tokens (JWT) for secure user sessions. |
| **`bcryptjs`** | `^3.0.3` | Security | Hashes candidate passwords with cryptographic salts before storage and validates credentials upon sign-in. |
| **`google-auth-library`** | `^11.0.2` | Authentication | Verifies Google OAuth 2.0 ID tokens sent from the frontend for seamless one-tap Google SSO sign-in. |
| **`cookie-parser`** | `^1.4.7` | Middleware | Parses incoming HTTP request cookies (`req.cookies`), allowing secure `httpOnly` JWT tokens to be read by the server. |
| **`cors`** | `^2.8.5` | Security / Networking | Cross-Origin Resource Sharing middleware enabling safe communication between the frontend origin and Express backend. |
| **`express-rate-limit`** | `^7.5.0` | Security | Rate limiting middleware protecting sensitive endpoints (auth, OTP verification, and AI question extraction) against abuse. |
| **`multer`** | `^2.3.0` | File Handling | Middleware for handling `multipart/form-data` uploads (question paper files, documents, and student profile images). |
| **`cloudinary`** | `^2.11.0` | Cloud Storage | Cloud asset management SDK used to upload, host, and serve user profile pictures, question diagrams, and proctoring snapshots. |
| **`mammoth`** | `^1.12.2` | Document Parsing | Extracts raw text from uploaded `.docx` Word documents so the AI engine can structure them into questions. |
| **`pdf-parse`** | `^1.1.1` | Document Parsing | Extracts text content from uploaded `.pdf` documents to ingest question banks and past exam papers. |
| **`nodemailer`** | `^10.0.10` | Email Service | Sends transactional emails over SMTP / API (email verification codes, OTPs, and password reset links). |
| **`socket.io`** | `^4.8.3` | Real-time WebSockets | Manages bidirectional WebSocket connections for real-time proctoring monitoring, live test synchronization, and instant alerts. |
| **`dotenv`** | `^16.4.7` | Configuration | Loads environment variables from `.env` into `process.env` (database URIs, secrets, API keys). |
| **`nodemon`** *(dev)* | `^3.1.9` | Dev Tooling | Development utility that automatically restarts the Node.js server upon file modifications. |

#### Frontend Dependencies (`client/package.json`)

| Package | Version | Category | Purpose & Architectural Rationale |
| :--- | :--- | :--- | :--- |
| **`react`** | `^19.2.8` | Core UI Library | Foundational library for building interactive, component-based user interfaces. |
| **`react-dom`** | `^19.2.8` | UI Renderer | Renders React component trees directly into the browser's Document Object Model (DOM). |
| **`react-router-dom`** | `^7.18.2` | Routing | Handles client-side routing, navigation, and protected routes (Login, Dashboard, Exam Canvas, Admin, Results). |
| **`zustand`** | `^5.0.15` | State Management | Lightweight, boilerplate-free state management for user auth, live exam progress, answer states, and proctoring infractions. |
| **`axios`** | `^1.20.0` | HTTP Client | Promise-based HTTP client for making API requests with pre-configured base URLs, credentials, and interceptors. |
| **`@mediapipe/tasks-vision`** | `^1.0.1` | AI / Computer Vision | Runs on-device vision models in the browser (face detection and head pose tracking) for low-latency automated webcam proctoring. |
| **`socket.io-client`** | `^4.8.3` | Real-time WebSockets | Connects to the backend WebSocket server for receiving instant proctoring warnings and live session synchronization. |
| **`recharts`** | `^3.10.1` | Data Visualization | Renders interactive charts (accuracy trends, subject-wise scores, and performance breakdowns) in the student analytics dashboard. |
| **`katex`** | `^0.18.1` | Math Typesetting | High-performance LaTeX rendering engine for formatting mathematical formulas, equations, and Greek symbols in STEM questions. |
| **`lucide-react`** | `^1.28.0` | UI Icons | Modern SVG icon library providing clean, consistent icons across buttons, inputs, alerts, and navigation. |
| **`canvas-confetti`** | `^1.9.4` | UI Effects | Renders celebratory confetti particles on completion of an exam or achievement of a high score. |
| **`tailwindcss`** | `^4.3.3` | Styling Engine | Utility-first CSS framework for creating modern, responsive styling and glassmorphism themes. |
| **`@tailwindcss/vite`** | `^4.3.3` | Build Integration | Official Vite plugin for Tailwind CSS v4, enabling seamless JIT styling compilation. |
| **`clsx`** | `^2.1.1` | Styling Utility | Utility for conditionally joining class names together. |
| **`tailwind-merge`** | `^3.6.0` | Styling Utility | Safely merges conflicting Tailwind CSS utility classes without style override bugs (used with `clsx` as `cn(...)`). |
| **`vite`** *(dev)* | `^8.2.0` | Build Tool / Bundler | Next-generation frontend tooling providing instant server start, fast HMR, and optimized production builds. |
| **`@vitejs/plugin-react`** *(dev)* | `^6.0.4` | Vite Plugin | Enables Fast Refresh and JSX transformation support for React in Vite. |
| **`oxlint`** *(dev)* | `^1.75.0` | Linter | High-speed Rust-based JavaScript/TypeScript linter for fast code analysis and error detection. |
| **`@types/react`** & **`@types/react-dom`** *(dev)* | `^19.x` | Type Definitions | TypeScript typing definitions for React and the DOM to provide IDE intellisense and autocomplete. |

---

## 📁 Project Directory Structure

```plaintext
mock-test-canvas/
├── client/                                # React 19 Frontend Application (Vite + Tailwind CSS v4)
├── server/                                # Node.js Express REST API & Proctoring WebSocket Server
├── docs/                                  # Architectural documentation & system specifications
│   └── uml/                               # System UML diagrams (Activity, Class, Sequence, State, Use-Case)
├── vercel.json                            # Root deployment & monorepo routing configuration
├── README.md                              # Main platform documentation & architectural overview
└── README_BLUEPRINT.md                    # Master engineering blueprint & phase specifications
```

### 💻 Client Directory (`client/`)

```plaintext
client/
├── index.html                             # SPA Entry HTML shell
├── package.json                           # Frontend dependencies & build scripts
├── vite.config.js                         # Vite bundler config with Tailwind CSS v4 plugin
├── vercel.json                            # Vercel SPA route rewrite rules & security headers
├── .env.example                           # Client environment variable template
├── .oxlintrc.json                         # Oxlint code quality configuration
├── public/
│   ├── favicon.ico                        # Browser tab icon
│   ├── favicon.svg                        # Vector brand favicon
│   ├── icons.svg                          # Sprite iconography sheet
│   └── _redirects                         # Static host fallback redirects
└── src/
    ├── main.jsx                           # Application bootstrapping & DOM render
    ├── App.jsx                            # Route tree, global modals & live socket alerts
    ├── App.css                            # Global animations & app-level transitions
    ├── index.css                          # Tailwind CSS v4 design tokens & glassmorphism utilities
    │
    ├── assets/
    │   ├── hero.png                       # Hero banner illustration
    │   ├── react.svg                      # React framework emblem
    │   └── vite.svg                       # Vite build tool emblem
    │
    ├── components/
    │   ├── LatexRenderer.jsx              # Direct KaTeX math formula renderer
    │   ├── common/                        # Global reusable UI widgets & modals
    │   │   ├── AuthModal.jsx              # Quick-access login/signup dialog
    │   │   ├── BackButton.jsx             # Styled navigation back button
    │   │   ├── Breadcrumbs.jsx            # Dynamic location breadcrumb trail
    │   │   ├── ConfirmLogoutModal.jsx     # Logout confirmation dialog
    │   │   ├── DiscardDraftModal.jsx      # Draft discard confirmation modal
    │   │   ├── LogoutDraftModal.jsx       # Warning modal for unsaved drafts on logout
    │   │   ├── MathRenderer.jsx           # LaTeX equation parser & inline math renderer
    │   │   ├── Modal.jsx                  # Accessible base dialog component
    │   │   ├── Navbar.jsx                 # Top bar with profile, status & theme toggles
    │   │   ├── NotificationBell.jsx       # Real-time notification indicator & dropdown
    │   │   ├── ProtectedRoute.jsx         # Authentication route guard wrapper
    │   │   ├── ServerBootIndicator.jsx    # Backend health & Render cold-start status banner
    │   │   └── ThemeToggle.jsx            # Dark / light theme switcher
    │   │
    │   ├── exam/                          # Assessment cards & exam-level dialogs
    │   │   ├── AssessmentCard.jsx         # Summary assessment card with metadata
    │   │   ├── ExamCard.jsx               # Interactive exam card in catalog & dashboard
    │   │   ├── ExamFooter.jsx             # Session action bar (Clear, Mark, Next)
    │   │   ├── ExamHeader.jsx             # Top bar with countdown clock & section tabs
    │   │   ├── ExamInstructionsModal.jsx  # Test instructions & marking rules modal
    │   │   ├── ExamQuestionPaperModal.jsx # Full paper view modal for candidates
    │   │   ├── ExamScoreReport.jsx        # Graded score summary card & accuracy report
    │   │   ├── ExamSubmitModal.jsx        # Candidate exam submission review modal
    │   │   ├── QuestionWindow.jsx         # Active question statement & KaTeX container
    │   │   ├── SidebarPalette.jsx         # Question number matrix with status color codes
    │   │   └── inputs/                    # Dedicated answer input widgets
    │   │       ├── McqInput.jsx           # Single-Choice Question (MCQ) radio selector
    │   │       ├── MsqInput.jsx           # Multiple-Choice Question (MSQ) checkbox selector
    │   │       └── NatInput.jsx           # Numerical Answer Type (NAT) numeric keypad
    │   │
    │   ├── exam-detail/                   # Exam overview & pre-test configuration tabs
    │   │   ├── ExamAttemptsTab.jsx        # Historical student attempt table & scores
    │   │   ├── ExamDetailTabs.jsx         # Tab switching controller (Questions/Attempts/Rules)
    │   │   ├── ExamHeroSection.jsx        # Exam header with title, badges & start CTA
    │   │   ├── ExamPreviewModal.jsx       # Test preview modal for educators & creators
    │   │   ├── ExamProctoringTab.jsx      # Configured integrity rules & constraint checklist
    │   │   ├── ExamQuestionsTab.jsx       # Question syllabus breakdown & format summary
    │   │   └── RevealQuestionsModal.jsx   # Administrative question inspection modal
    │   │
    │   ├── exam-player/                   # Live testing environment & anti-cheat guards
    │   │   ├── ExamFullscreenGate.jsx     # User-gesture gate requesting and enforcing fullscreen
    │   │   ├── ExamHeader.jsx             # Active test timer bar & section navigator
    │   │   ├── ExamLockdownOverlays.jsx   # Fullscreen exit & window blur blocking overlays
    │   │   ├── ExamSubmissionResult.jsx   # Post-submission scorecard and integrity outcome
    │   │   ├── ExamSubmitConfirmModal.jsx # Pre-submission summary & question confirmation
    │   │   ├── QuestionCanvas.jsx         # Core question layout, math engine & options
    │   │   └── QuestionPalette.jsx        # Question grid navigation (Answered, Marked, Review)
    │   │
    │   ├── proctoring/                    # Automated AI integrity & webcam monitoring
    │   │   ├── CameraMonitor.jsx          # Live webcam feed, face detection & gaze tracker
    │   │   ├── ExamLiveMonitorModal.jsx   # Proctor live supervisor console view
    │   │   ├── LiveConsoleTimeFilter.jsx  # Time-based violation log filter widget
    │   │   ├── LiveViolationToast.jsx     # Non-blocking violation penalty toast alert
    │   │   ├── ProctoringCheckGate.jsx    # Pre-exam hardware permissions & environment check
    │   │   ├── SnapshotPreviewModal.jsx   # High-resolution modal view of captured violation photo
    │   │   └── StrikeModal.jsx            # Warning strike overlay on integrity infractions
    │   │
    │   ├── audit/                         # Post-exam audit logs & integrity reports
    │   │   ├── AuditCompletionReportTable.jsx # Comprehensive attempt outcome & scoring matrix
    │   │   ├── AuditHeaderMetrics.jsx     # High-level audit indicators (Trust Score, Violations)
    │   │   ├── AuditSnapshotModal.jsx     # Proctoring webcam snapshots review modal
    │   │   └── AuditViolationLogsTable.jsx# Timestamped infraction trail with penalty points
    │   │
    │   ├── analytics/                     # Performance analytics & AI pedagogical explanations
    │   │   ├── AccuracyHeatmap.jsx        # Topic mastery matrix & 14-day study activity calendar
    │   │   ├── AIExplainPanel.jsx         # On-demand BYOK Gemini AI pedagogical solution generator
    │   │   ├── ExamInsightsPanel.jsx      # Per-exam deep dive, decile histogram & subject breakdowns
    │   │   ├── GeminiKeyModal.jsx         # Bring Your Own Key (BYOK) credential manager & model picker
    │   │   ├── LeaderboardTable.jsx       # Global official standings table with user rank pinning
    │   │   ├── ScoreTrendChart.jsx        # Recharts chronological score progression (Official vs Practice)
    │   │   └── StreamAccuracyChart.jsx    # Horizontal subject/stream accuracy & mastery bars
    │   │
    │   ├── question-bank/                 # Centralized question repository & generator
    │   │   ├── AddQuestionModal.jsx       # Modal form to author new questions to the bank
    │   │   ├── BankQuestionMetaFields.jsx # Metadata inputs (Subject, Topic, Difficulty, Marks)
    │   │   ├── BankQuestionOptionsEditor.jsx # Option management & correct answer selector
    │   │   ├── BankQuestionStatementEditor.jsx # Live KaTeX statement editor for question bank
    │   │   ├── GenerateExamModal.jsx      # Automated test paper generator from repository
    │   │   ├── QuestionBankCard.jsx       # Question card with preview, tags & metadata
    │   │   └── QuestionBankSidebar.jsx    # Subject, stream, and difficulty filter sidebar
    │   │
    │   └── test-builder/                  # Interactive test creation & AI question authoring
    │       ├── AIDropzoneCard.jsx         # AI drag-and-drop document upload (PDF/Word/Images)
    │       ├── ConfirmPublishModal.jsx    # Final publishing confirmation dialog
    │       ├── DraftRestoredToast.jsx     # Auto-save recovery notification toast
    │       ├── EditQuestionMetaFields.jsx # Edit-mode question metadata fields
    │       ├── EditQuestionOptionsEditor.jsx # Edit-mode option manager
    │       ├── EditQuestionStatementEditor.jsx # Edit-mode statement editor
    │       ├── ImageLightboxModal.jsx     # Zoomable lightbox modal for question diagram images
    │       ├── IngestionReviewModal.jsx   # AI-extracted question review, correction & import
    │       ├── LeaveDraftModal.jsx        # Warning modal when leaving test studio with unsaved work
    │       ├── ManualQuestionForm.jsx     # Question builder with live KaTeX preview
    │       ├── QuestionEditModal.jsx      # Modal dialog for editing existing questions
    │       ├── QuestionExplanationEditor.jsx # Step-by-step solution & explanation editor
    │       ├── QuestionListSection.jsx    # Reorderable question deck with status indicators
    │       ├── QuestionMetaFields.jsx     # Question-level subject, difficulty & marks settings
    │       ├── QuestionOptionsEditor.jsx  # Option cards, LaTeX options & correct answer keys
    │       ├── QuestionPaperPDFModal.jsx  # Print / PDF preview modal for authoring review
    │       ├── QuestionsStudioTab.jsx     # Tab wrapper coordinating AI ingestion & manual builder
    │       ├── QuestionStatementEditor.jsx# Rich LaTeX statement input with equation toolbar
    │       ├── TestCreationHeader.jsx     # Studio top navigation, draft status & publish button
    │       ├── TestCreationModals.jsx     # Centralized wrapper for test authoring dialogs
    │       └── TestSettingsTab.jsx        # Exam configuration (Duration, Marking, Proctor rules)
    │
    ├── hooks/                             # Modular custom React hooks
    │   ├── useAudioProctor.js             # Web Audio API microphone volume & noise anomaly hook
    │   ├── useBankQuestionDraft.js        # Auto-save draft hook for question bank items
    │   ├── useBrowserLockdown.js          # Fullscreen, tab visibility, blur & shortcut traps
    │   ├── useExamMediaProctoring.js      # Webcam stream management & video snapshot captures
    │   ├── useExamSchedule.js             # Exam start/end window validation & countdowns
    │   ├── useExamSubmission.js           # Exam submit workflow, payload packaging & score handling
    │   ├── useExamTimer.js                # Zero-drift Web Worker countdown timer interface
    │   ├── useExamViolations.js           # Violation tracking, penalty deductions & cooldown logic
    │   ├── useExistingExamLoader.js       # Pre-loads exam metadata for editing existing tests
    │   ├── useLiveProctorFeed.js          # Socket.io connection & real-time violation listener
    │   ├── useManualQuestionDraft.js      # Auto-save draft hook for question authoring
    │   ├── useTestCreationDraft.js        # LocalStorage auto-save & draft restoration for exams
    │   ├── useTestCreationIngestion.js    # Gemini document upload & question parsing hook
    │   ├── useTestCreationQuestions.js    # Question list manipulation (add, reorder, delete)
    │   ├── useTestCreationSave.js         # Exam publish validation & API persistence hook
    │   └── useVisionProctor.js            # MediaPipe face presence & gaze deviation hook
    │
    ├── pages/                             # Top-level view routes
    │   ├── AuthPage.jsx                   # Candidate authentication (Email/Password, OTP, Google)
    │   ├── DashboardPage.jsx              # Main hub: assessment catalog, quick actions & stats
    │   ├── ExamAuditReportPage.jsx        # Detailed proctoring audit log & violation report
    │   ├── ExamDetailPage.jsx             # Exam overview, syllabus, rules & attempt history
    │   ├── ExamLiveMonitorPage.jsx        # Real-time administrator proctoring workstation
    │   ├── ExamResponsesPage.jsx          # Post-exam question-by-question review & solutions
    │   ├── ExamSessionPage.jsx            # Live proctored testing environment
    │   ├── NotificationsPage.jsx          # User notifications center & system alerts
    │   ├── AnalyticsPage.jsx              # Personal analytics, exam insights & global leaderboard
    │   ├── QuestionBankPage.jsx           # Centralized question repository & search portal
    │   ├── TestCreationPage.jsx           # Test authoring studio with AI ingestion & live preview
    │   └── UnderDevelopmentPage.jsx       # Feature placeholder page
    │
    ├── services/
    │   ├── api.js                         # Pre-configured Axios client with JWT interceptors
    │   └── socket.js                      # Socket.io client for real-time proctoring events
    │
    ├── store/                             # Global state management (Zustand)
    │   ├── useAuthStore.js                # User session, JWT tokens, profile & authentication
    │   ├── useExamStore.js                # Active exam session, answer map & local persistence
    │   ├── useNotificationStore.js        # Real-time alerts, unread counts & notification actions
    │   ├── useProctorStore.js             # Trust score (100-0), violation audit trail & strikes
    │   ├── useServerStatusStore.js        # Backend service health check & cold-start tracking
    │   └── useThemeStore.js               # Dark mode / light mode theme preference state
    │
    ├── styles/
    │   ├── Auth.css                       # Authentication form styles & transitions
    │   ├── ExamPlayer.css                 # Fullscreen exam canvas layout & palette styles
    │   └── index.css                      # Global utility classes & theme variables
    │
    ├── utils/
    │   ├── auditConstants.js              # Violation penalty points, trust thresholds & codes
    │   ├── dateUtils.js                   # Date formatting, relative time & countdown helpers
    │   └── printPreview.js                # Print styling & paper preview generation helpers
    │
    └── workers/
        └── timer.worker.js                # High-precision performance.now() countdown clock
```

### ⚙️ Server Directory (`server/`)

```plaintext
server/
├── package.json                           # Backend dependencies & runtime scripts
├── .env.example                           # Backend environment template
└── src/
    ├── server.js                          # Express app, Socket.io setup, CORS & route registry
    │
    ├── config/
    │   ├── db.js                          # MongoDB Atlas Mongoose connection & retry logic
    │   └── cloudinary.js                  # Cloudinary SDK config for violation snapshots & media
    │
    ├── controllers/
    │   ├── ai.controller.js               # Gemini AI document parsing & automated question ingestion
    │   ├── analytics.controller.js        # Personal analytics, exam insights, leaderboard & BYOK AI explain proxy
    │   ├── auth.controller.js             # Registration, login, Google OAuth, OTP & tokens
    │   ├── exam.controller.js             # Exam CRUD, catalog listing & sanitized question delivery
    │   ├── notification.controller.js     # Notification queries & mark-as-read handlers
    │   ├── question.controller.js         # Question bank CRUD, filtering & dynamic assembly
    │   └── submission.controller.js       # Deterministic grading & attempt history retrieval
    │
    ├── middleware/
    │   ├── auth.middleware.js             # JWT verification & req.user injection guard
    │   ├── rateLimiter.middleware.js      # Endpoint rate limiting against brute force & DoS
    │   └── upload.middleware.js           # Multer middleware for document & image file uploads
    │
    ├── models/
    │   ├── Attempt.model.js               # Attempt submission, score, answers & violation logs
    │   ├── Exam.model.js                  # Exam metadata, marking scheme & proctoring toggles
    │   ├── Notification.model.js          # User notification schema & read receipts
    │   ├── Otp.model.js                   # One-time verification codes with TTL expiration
    │   ├── Question.model.js              # Question statement, type, options & answer keys
    │   └── User.model.js                  # User profiles, bcrypt credentials & attempt counts
    │
    ├── routes/
    │   ├── ai.routes.js                   # /api/ai endpoints for Gemini AI ingestion
    │   ├── auth.routes.js                 # /api/auth endpoints (register, login, google, otp)
    │   ├── exam.routes.js                 # /api/exams endpoints (CRUD, media, live-violations)
    │   ├── notification.routes.js         # /api/notifications endpoints
    │   ├── question.routes.js             # /api/questions question bank & generator endpoints
    │   └── submission.routes.js           # /api/submissions endpoints (submit, review, violations)
    │
    ├── seeds/
    │   ├── jee_adv_2024_paper1.json       # Authentic JEE Advanced 2024 Paper 1 dataset
    │   ├── seed.js                        # Database seeder with sample questions
    │   ├── seedDatabase.js                # Full database initialization runner
    │   └── seedQuestionBank.js            # Question bank pre-population dataset & runner
    │
    ├── services/
    │   ├── emailService.js                # Nodemailer / Resend / Brevo transactional email delivery
    │   ├── gemini.service.js              # Google Gemini GenAI SDK wrapper & prompt engineering
    │   └── grading.service.js             # Server-side deterministic grading (+4/-1, NAT, MSQ)
    │
    └── utils/
        ├── seeder.js                      # Question & exam parsing helpers for seeding
        └── sendEmail.js                   # Email dispatch utility wrapper
```

---

## 🔒 Security & Proctoring Matrix

| Cheat Vector | Threat Mechanism | Implemented Countermeasure | Result |
| :--- | :--- | :--- | :--- |
| **Answer Inspection** | Candidate checks DevTools / Network response for answers. | `GET /api/exams/:id` explicitly projects out `correctAnswers` and `explanation` (`select: '-correctAnswers -explanation'`). | **Answer keys never touch client memory** until graded on the server. |
| **Tab Hopping** | Candidate searches Google in another browser tab. | Page Visibility API hook records `TAB_SWITCH`, deducts `-15 pts`, and subtracts real elapsed wall-clock time on return. | Tab switch logged, alert modal triggers, timer penalizes time away. |
| **Application Swapping** | Candidate switches to Discord / WhatsApp / ChatGPT (`Alt+Tab`). | `window.onblur` event trap flags `WINDOW_BLUR` and deducts `-10 pts`. Co-fire debouncer ensures no double penalties with tab switch. | Warning overlay covers screen until candidate refocuses the exam. |
| **Fullscreen Dropping** | Candidate minimizes browser or opens split-screen notes. | `document.fullscreenchange` detects drop out, displays an unclosable blocker, and deducts `-20 pts`. | Candidate cannot view questions until re-engaging full-screen. |
| **Extended Backgrounding**| Candidate hides the tab for minutes to pause timer. | Tab return compares wall-clock `Date.now()` vs hidden timestamp; deducts all lost time. If $>30\text{s}$, extra deduction (`-10` to `-20 pts`). | Timer cannot be frozen by backgrounding. |
| **Keyboard Inspection** | Candidate presses `F12`, `Ctrl+Shift+I`, `Ctrl+U`, `Ctrl+S`. | `keydown` event listener blocks key combinations with `preventDefault()` and `stopPropagation()`. | DevTools shortcuts and source views completely neutralized. |
| **Clipboard Copying** | Candidate copies questions to send to third parties. | Intercepts `contextmenu`, `copy`, `cut`, `paste`, and `Ctrl+C/X/V/A`. | Text selection, right-click, and clipboard copying disabled. |
| **Page Refresh Reset** | Candidate reloads page (`F5`) to wipe violation count. | `useProctorStore` persists violation history, trust score, and active `examId` to `localStorage`. | Penalties and trust score survive page refreshes intact. |
| **Absent / Second Person**| Candidate leaves webcam view or receives coaching from a helper. | MediaPipe vision detects `NO_FACE` (-15 pts) or `MULTI_FACE` (-20 pts) and uploads evidence snapshots. | Violation recorded, warning toast displayed, proctor alerted. |
| **Persistent Violations**| Candidate repeatedly ignores warnings. | If trust score drops $\le 30$, final warning triggers. At $0$, a 5-second countdown auto-submits the test. | Candidate is disqualified / auto-submitted with recorded audit trail. |
| **Attempt Retake Abuse** | Candidate clears cache to restart an exam repeatedly. | Server checks `Attempt.countDocuments()` against `exam.maxAttempts`. Exceeding limit returns `403 Forbidden`. | Candidate cannot bypass maximum attempt restrictions. |

### 📋 Proctoring Security Specification Checklist (S1 – S6)

To maintain strict traceability across client stores, hooks, and modals, the core proctoring requirements are tagged with identifiers `S1` through `S6` in the codebase:

| Spec ID | Requirement & Threat Addressed | Implementation Detail | Primary Code Reference |
| :---: | :--- | :--- | :--- |
| **`S1`** | **Per-Type Violation Cooldown (Anti-Spam)** | Enforces a minimum 10-second cooldown between consecutive infractions of the same type. Prevents a single accidental window flicker from triggering multiple rapid penalties. | [`useProctorStore.js`](file:///client/src/store/useProctorStore.js#L29-L31) |
| **`S2`** | **Tiered Trust Score Deductions** | Assigns weighted penalties based on deliberate intent: Fullscreen Exit (`-20`), Tab Switch (`-15`), Window Blur (`-10`), No Face (`-15`), Multi-Face (`-20`), Noise Spike (`-10`). | [`useProctorStore.js`](file:///client/src/store/useProctorStore.js#L18-L27) |
| **`S3`** | **Live Violation Broadcast & Toast Notification** | Dispatches real-time WebSocket alerts via Socket.IO (`violation:live`) to the exam creator and displays immediate feedback toasts to the candidate. | [`App.jsx`](file:///client/src/App.jsx#L39-L50) / [`submission.controller.js`](file:///server/src/controllers/submission.controller.js#L539) |
| **`S4`** | **Critical Final Warning Modal** | Intercepts testing with an unmissable modal dialog when candidate reaches the penultimate strike limit or when Trust Score drops $\le 30$. | [`ExamLockdownOverlays.jsx`](file:///client/src/components/exam-player/ExamLockdownOverlays.jsx#L154-L165) |
| **`S5`** | **Automated Exam Termination & Eviction** | Triggers an irreversible 5-second countdown modal that locks the interface and auto-submits the candidate's test if Trust Score reaches 0 or warnings exceed limit. | [`submission.controller.js`](file:///server/src/controllers/submission.controller.js) / [`ExamSessionPage.jsx`](file:///client/src/pages/ExamSessionPage.jsx) |
| **`S6`** | **Cross-Platform Fullscreen API Guard** | Detects `document.fullscreenEnabled` to prevent crashes on non-supporting devices (e.g., Apple Safari on iOS) and emits a graceful fallback event. | [`useBrowserLockdown.js`](file:///client/src/hooks/useBrowserLockdown.js#L33-L37) |

---

## ⚙️ Environment Configuration

### 1. Server Configuration (`server/.env`)

Create a `.env` file in the `server/` folder:

```env
# Server Network Port
PORT=5000

# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/mock_test_canvas?retryWrites=true&w=majority

# JWT Authentication Secret Key
JWT_SECRET=your_super_secret_jwt_signing_key_here

# Runtime Environment (development | production)
NODE_ENV=development

# Allowed Frontend Client URL (for CORS validation)
CLIENT_URL=http://localhost:5173

# Google OAuth 2.0 Credentials (for Google Sign-In)
GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

# Cloudinary (for violation snapshot evidence & question diagram media)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini API (for AI Question Paper Document/Image/PDF Ingestion)
# Get a free API key at https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Optional: Transactional Email Service for OTP verification & alerts
# Option A: Resend API (Recommended for production)
# RESEND_API_KEY=re_your_resend_api_key_here
# EMAIL_FROM="Mock Test Canvas" <onboarding@resend.dev>

# Option B: Brevo API
# BREVO_API_KEY=your_brevo_api_key_here

# Option C: Standard SMTP (Gmail, SendGrid, etc.)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=465
# EMAIL_SECURE=true
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_gmail_app_password
# EMAIL_FROM="Mock Test Canvas" <your_email@gmail.com>
```

### 2. Client Configuration (`client/.env`)

Create a `.env` file in the `client/` folder:

```env
# API Base Endpoint (Point to local backend for dev, Render URL for production)
# Local:
VITE_API_BASE_URL=http://localhost:5000/api
# Production (Render):
# VITE_API_BASE_URL=https://mock-test-canvas.onrender.com/api

# Frontend URL
VITE_FRONTEND_URL=http://localhost:5173

# Google OAuth 2.0 Client ID (must match backend GOOGLE_CLIENT_ID)
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB Atlas**: Free M0 Cluster or local MongoDB instance

### Step 1: Clone the Repository
```bash
git clone https://github.com/Abhiram-Veerapaneni/mock-test-canvas.git
cd mock-test-canvas
```

### Step 2: Backend Setup & Seeding
```bash
cd server
npm install

# Configure your server/.env with your MongoDB Atlas URI, JWT_SECRET, and Cloudinary keys
cp .env.example .env

# Seed the database with official JEE Advanced 2024 Paper 1 questions
npm run seed

# Launch the development server (runs nodemon on port 5000)
npm run dev
```

> **Health Verification**: Visit `http://localhost:5000/api/health` in your browser. You should receive:
> ```json
> { "status": "ok", "timestamp": "...", "environment": "development" }
> ```

### Step 3: Frontend Setup & Launch
Open a second terminal window:
```bash
cd client
npm install

# Configure your client/.env
cp .env.example .env

# Launch the Vite development server (runs on port 5173)
npm run dev
```

> Open your browser and navigate to: **`http://localhost:5173`**

---

## 📡 API Documentation

All API endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header or authenticated HTTP-only cookie.

### 🔑 Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new user with `name`, `email`, `password`. |
| `POST` | `/api/auth/login` | Public | Authenticate user with `email` and `password`. Returns JWT and profile. |
| `POST` | `/api/auth/logout` | Public | Clear session cookies. |
| `POST` | `/api/auth/google` | Public | Authenticate via Google OAuth ID token (`credential`). Auto-provisions user. |
| `POST` | `/api/auth/send-otp` | Public | Send verification OTP to email for passwordless verification. |
| `POST` | `/api/auth/verify-otp` | Public | Verify submitted OTP code against stored session. |
| `GET` | `/api/auth/me` | Protected | Returns authenticated user profile, populated with created and attempted tests. |

### 📝 Examination & Authoring Endpoints (`/api/exams`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/exams` | Optional Auth | List exams with query filters: `category`, `search`, `page`, `limit`. |
| `POST` | `/api/exams` | Protected | Create exam with bulk questions, marking scheme, duration, and proctor toggles. |
| `GET` | `/api/exams/:id` | Optional Auth | Get exam metadata and questions. **Answer keys & explanations are stripped**. |
| `PUT` | `/api/exams/:id` | Protected | Update existing exam metadata, question items, or proctoring rules. |
| `DELETE` | `/api/exams/:id` | Protected | Delete exam or draft. |
| `POST` | `/api/exams/upload-media` | Protected | Upload diagram image or figure to Cloudinary for an exam. |
| `GET` | `/api/exams/:id/live-violations`| Protected | Fetch live proctoring violation logs for an exam session. |

### 📊 Submissions & Grading (`/api/submissions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/submissions/start` | Protected | Initialize or resume an exam attempt session. |
| `POST` | `/api/submissions/submit` | Protected | Submit completed answers & violation logs. Evaluated on backend; returns graded score. |
| `GET` | `/api/submissions/my/:examId` | Protected | Retrieve all historical attempts by the authenticated user for a specific exam. |
| `GET` | `/api/submissions/attempt/:attemptId/review` | Protected | Retrieve full post-exam response breakdown, solutions, and explanations. |
| `POST` | `/api/submissions/:id/violation` | Protected | Log real-time proctoring violation with optional webcam snapshot upload. |

### 📚 Question Bank Endpoints (`/api/questions`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/questions` | Optional Auth | Query question bank with pagination, stream, tag, subject, and difficulty filters. |
| `POST` | `/api/questions` | Protected | Create and author a new question directly into the global pool. |
| `GET` | `/api/questions/meta/streams` | Public | Retrieve all distinct academic streams represented in the bank. |
| `GET` | `/api/questions/meta/tags` | Public | Retrieve distinct subject tags (optionally filtered by stream). |
| `POST` | `/api/questions/generate-exam` | Protected | Dynamically synthesize a complete test paper from matching question bank pools. |
| `POST` | `/api/questions/upload-image` | Protected | Upload question diagram or figure to Cloudinary. |
| `GET` | `/api/questions/:id` | Optional Auth | Retrieve a specific bank question by ID. |
| `PUT` | `/api/questions/:id` | Protected | Update a bank question's statement, options, or solution. |
| `DELETE` | `/api/questions/:id` | Protected | Delete a question from the bank pool. |

### 📈 Analytics & AI Solutions (`/api/analytics`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/me` | Protected | Retrieve candidate performance summary, score progression trend, stream accuracy, tag matrix, and daily streak. |
| `GET` | `/api/analytics/exam/:examId` | Protected | Retrieve per-exam metrics, score distribution histogram (deciles), and topic answer breakdown. |
| `GET` | `/api/analytics/leaderboard` | Public / Optional Auth | Retrieve global official leaderboard rankings (top 50 + authenticated candidate's rank). |
| `POST` | `/api/analytics/ai-explain` | Protected | BYOK Gemini proxy: generates on-demand pedagogical explanation with LaTeX math using client-supplied API key. Zero server storage. |

### 🤖 AI Document Ingestion (`/api/ai`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/ingest` | Protected | Upload DOCX, PDF, or image file; extracts structured LaTeX questions via Gemini 2.5. |

### 🔔 Notifications Endpoints (`/api/notifications`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Protected | Retrieve all proctoring alerts and system notifications for the user. |
| `PATCH` | `/api/notifications/mark-all-read` | Protected | Mark all user notifications as read. |
| `PATCH` | `/api/notifications/:id/read` | Protected | Mark a single notification as read. |
| `DELETE` | `/api/notifications/:id` | Protected | Delete a specific notification. |
| `DELETE` | `/api/notifications` | Protected | Clear all notifications for the user. |

### 💓 Health Check (`/api/health`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Returns service availability status, ISO timestamp, and active environment. |

---

## 🧪 Seeding & Test Data

The platform comes pre-packaged with authentic **JEE Advanced 2024 Paper 1** questions spanning:
- ⚛️ **Physics**: Mechanics, Rotational Dynamics, Electromagnetism, Modern Physics
- 🧪 **Chemistry**: Coordination Compounds, Organic Reaction Mechanisms, Thermodynamics
- 📐 **Mathematics**: Definite Integrals, Differential Equations, 3D Vectors, Probability

To seed or re-seed the test database:
```bash
cd server
npm run seed
```
This populates the database with real questions including LaTeX mathematical formulas (`\int_{0}^{\pi} ...`, `\sqrt{x}`, `\frac{d}{dx}`) ready for instant testing.

---

## 🚢 Deployment Guide

### Frontend Deployment (Vercel)
1. Push your repository to GitHub.
2. Link the repository on **Vercel**.
3. Set the **Root Directory** to `client`.
4. Add environment variables:
   - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com/api`
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `VITE_FRONTEND_URL`: `https://your-app.vercel.app`
5. Deploy. The bundled `client/vercel.json` ensures all SPA routes (`/dashboard`, `/test`, `/create-test`, `/test/:id`, `/question-bank`, `/notifications`) rewrite correctly to `index.html`.

### Backend Deployment (Render)
1. Create a new **Web Service** on **Render**.
2. Set the **Root Directory** to `server`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Add all environment variables from `server/.env` (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `NODE_ENV=production`).
6. Deploy and copy your service URL (e.g. `https://mock-test-canvas.onrender.com`).

---

## 🗺️ Roadmap & Upcoming Milestones

- [x] **Phase 1**: Monorepo Architecture, Unified Auth (JWT + Google OAuth + Email OTP), Database Contracts.
- [x] **Phase 2**: High-Fidelity Exam Player Canvas, KaTeX LaTeX Rendering, Multi-Format Inputs (MCQ, MSQ, NAT).
- [x] **Phase 3**: Browser Lockdown (Fullscreen gate, Page Visibility traps, DevTools suppression, drift-free Web Worker timer).
- [x] **Phase 4**: Dynamic Trust Score Engine ($100 \rightarrow 0$), tiered infraction penalties, auto-submission.
- [x] **Phase 5**: Exam Authoring Studio, customizable marking schemes, attempt quota restrictions.
- [x] **Phase 6**: Deterministic Server-Side Grading Engine & Historical Attempt Review Breakdown.
- [x] **Phase 7**: Edge ML Computer Vision Proctoring (MediaPipe Face & Gaze Tracking, Audio Anomaly Hook, Cloudinary Snapshot Evidence).
- [x] **Phase 8**: Automated AI Question Paper Ingestion (DOCX, PDF & image OCR to structured LaTeX JSON via Gemini 2.5 Flash).
- [x] **Phase 9**: Performance Analytics & AI-Powered Solutions (BYOK Gemini API key proxy, score progression trends, subject mastery, decile score distribution histogram, global official leaderboard, and on-demand AI pedagogical explanations in exam review).
- [ ] **Phase 10**: Dynamic Question & Option Shuffling Engine (Per-candidate order jumbling, option randomization & attempt seed persistence for anti-collusion).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/Abhiram-Veerapaneni/mock-test-canvas/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  <sub>Engineered with precision for modern competitive assessments. Designed & Developed by <strong><a href="https://github.com/Abhiram-Veerapaneni">Abhiram Veerapaneni</a></strong>.</sub>
</div>
