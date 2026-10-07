# 🎙️ AI Meeting Assistant

An intelligent, full-stack AI Meeting Assistant application that automates audio transcription, transcript error refinement, structured meeting documentation (executive summary, confirmed decisions, interactive action items table), and OpenCV-based QR & ArUco marker computer vision scanning. Connected to MongoDB with JWT user authentication and live dashboard analytics.

---

## 🌟 Key Features

### 1. 🎧 Speech-to-Text & Transcript Editing
- Transcribes audio recordings (`.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`) using **Faster-Whisper**.
- **Interactive Raw Transcript Editor**: Review and fix misheard words, speaker names, numbers, or technical acronyms directly before AI processing.
- **Audio Session Locking**: Locks the uploaded audio during processing to avoid accidental file changes.

### 2. 🤖 Two-Stage AI Pipeline (Separate LLMs)
- **LLM 1 — Transcript Refinement (`POST /refine`)**:
  - Corrects phonetic errors, domain-specific terminology, and punctuation while preserving 100% of the original meaning without summarizing.
- **LLM 2 — Documentation & Minutes Extraction (`POST /document`)**:
  - **Executive Summary**: High-level synthesis of discussion topics.
  - **Confirmed Decisions**: Explicitly agreed resolutions.
  - **Action Items Table**: Assigned tasks with owner tags, deadline badges, and completion checkboxes.
  - **Discussion Points**: Key discussion takeaways.

### 3. 📊 Live Dashboard & MongoDB Integration
- Connected to **MongoDB** via `motor` (async driver) for persistence.
- **`GET /dashboard/stats`**: Live aggregated metrics (Total Meetings, Action Items extracted, Key Decisions, Audio Hours, and Recent Meetings list).
- Personalized greeting, dynamic user profile initials, and empty state guidance.

### 4. 📷 Computer Vision Scanner (`/decode`)
- Built with **OpenCV (`cv2`)** for clue-board analysis.
- Detects **ArUco markers** (`DICT_4X4_50`) with physical 24 cm scale calibration.
- Decodes **QR codes** into a single-line clean clue output with one-click copy.

### 5. 🔐 Authentication & Protected Routing
- Secure **User Registration** & **Login** with password validation and duplicate email checks.
- **JWT Access Tokens** (`PyJWT`) with expiration handling.
- React Router **`ProtectedRoute`** wrappers preventing unauthorized access.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Faster-Whisper, OpenAI API / Local LLM, OpenCV (`cv2`), Motor (`motor_asyncio`), PyMongo, PyJWT, Pydantic, Certifi |
| **Frontend** | React 19, Vite, React Router v7, Vanilla CSS Design System |
| **Database** | MongoDB (Local instance or MongoDB Atlas Cloud) |

---

## 📋 Prerequisites

Ensure you have the following installed on your machine:
- **Python** (version 3.10, 3.11, or 3.12)
- **Node.js** (version 18+ or 20+) & **npm**
- **MongoDB** (Local instance or MongoDB Atlas account)
- **FFmpeg** (Recommended for audio decoding with Whisper)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/abhishek9955-first/AI-Meeting-Assistant.git
cd AI-Meeting-Assistant
```

---

### 2. Backend Setup

1. **Create and activate a virtual environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to create your `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your credentials:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   MONGO_URI=mongodb://localhost:27017
   DB_NAME=meet_ai_db
   ```
   *(For MongoDB Atlas, use your `mongodb+srv://...` connection string. IP must be whitelisted in MongoDB Atlas Network Access)*.

4. **Run the Backend Server**:
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```
   The backend API will start at `http://localhost:8000`.

---

### 3. Frontend Setup

1. **Navigate to the frontend folder**:
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the Vite development server**:
   ```bash
   npm run dev
   ```
   The frontend application will be live at `http://localhost:5173`.

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Register a new user and generate JWT access token |
| `POST` | `/login` | Authenticate user credentials and return JWT token |
| `POST` | `/transcribe` | Upload meeting audio file and receive raw speech transcript |
| `POST` | `/refine` | Send raw transcript to **LLM 1** for transcript error correction |
| `POST` | `/document` | Send refined transcript to **LLM 2** to extract structured minutes & save to MongoDB |
| `POST` | `/generate-minutes` | Combined endpoint (LLM 1 refinement + LLM 2 minutes extraction) |
| `POST` | `/process` | Full end-to-end pipeline (audio → transcription → LLM 1 → LLM 2) |
| `GET` | `/dashboard/stats` | Fetch aggregated MongoDB metrics and recent meetings list |
| `POST` | `/scan-clue` | Upload clue board image to extract ArUco ID & QR text |

---

## 📁 Project Structure

```text
AI-Meeting-Assistant/
├── .env                    # Environment variables (private)
├── .env.example            # Environment template
├── requirements.txt        # Python backend dependencies
├── README.md               # Project documentation
├── backend/
│   ├── main.py             # FastAPI entry point & API routes
│   ├── database.py         # MongoDB connection & client initialization
│   ├── schemas.py          # Pydantic data models
│   ├── pipeline.py         # Audio to documentation processing pipeline
│   ├── transcription.py    # Faster-Whisper audio transcription
│   ├── refinement.py       # LLM 1: Transcript error correction
│   ├── documentation.py    # LLM 2: Structured meeting minutes generator
│   ├── vision.py           # OpenCV QR & ArUco marker scanner
│   └── utils.py            # File saving & helper utilities
└── frontend/
    ├── package.json        # Frontend scripts and packages
    ├── vite.config.js      # Vite configuration
    └── src/
        ├── App.jsx         # App router & ProtectedRoute guards
        ├── dashboard/      # Connected Dashboard overview & stats feed
        ├── meeting/        # Audio upload, editable transcript & minutes UI
        ├── decode/         # ArUco & QR vision scanner page
        ├── login/          # Login authentication view
        └── register/       # User registration view
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
