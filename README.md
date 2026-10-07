# 🎙️ AI Meeting Assistant

An AI-powered web application that automates meeting transcription, LLM refinement, structured minutes generation (action items, owners, deadlines, key decisions), user authentication with MongoDB, and an OpenCV-based QR & ArUco marker vision scanner.

---

## 🌟 Key Features

- **Audio Transcription & Refinement**:
  - Transcribes meeting recordings (MP3, WAV, M4A, AAC, OGG, FLAC) using **Faster-Whisper**.
  - Review and edit the raw speech transcript directly before refining.
  - Automatically fixes domain-specific acronyms, technical terms, and speaker misheard words via OpenAI.
- **Structured Meeting Documentation**:
  - **Executive Summary**: High-level overview of the meeting.
  - **Confirmed Decisions**: Explicitly agreed determinations.
  - **Action Items Table**: Interactive task checklist with assigned owners, deadlines, and completion toggles.
  - **Export Options**: One-click `.txt` download of refined transcripts and complete meeting records.
- **Computer Vision Clue Board Scanner (`/decode`)**:
  - Detects **ArUco markers** (`DICT_4X4_50`) with physical 24 cm scale calibration.
  - Decodes **QR codes** into a clean one-line clue string.
- **Authentication & Persistence**:
  - Secure **Register & Login** with JWT tokens.
  - Asynchronous storage in **MongoDB** via `motor`.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, Faster-Whisper, OpenAI API, OpenCV (`cv2`), Motor (`motor_asyncio`), PyMongo, PyJWT, Pydantic.
- **Frontend**: React 19, Vite, React Router v7, Vanilla CSS.
- **Database**: MongoDB (Local or MongoDB Atlas).

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
   *(For MongoDB Atlas, use your `mongodb+srv://...` connection string)*.

4. **Run the Backend Server**:
   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```
   The backend API will be running at `http://localhost:8000`.

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
   The frontend will be available at `http://localhost:5173`.

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/register` | Register a new user and generate JWT token |
| `POST` | `/login` | Authenticate user credentials and return JWT token |
| `POST` | `/transcribe` | Upload audio file and receive raw speech transcript (Whisper) |
| `POST` | `/refine` | Send raw transcript to **LLM 1** for transcript refinement |
| `POST` | `/document` | Send refined transcript to **LLM 2** to extract structured minutes & action items |
| `POST` | `/generate-minutes` | Combined endpoint (LLM 1 refinement + LLM 2 minutes extraction) |
| `POST` | `/process` | Full end-to-end pipeline (audio → transcription → LLM 1 → LLM 2) |
| `POST` | `/scan-clue` | Upload clue board image to extract ArUco ID & QR text |


---

## 📁 Project Structure

```text
AI-Meeting-Assistant/
├── .env.example            # Example environment variables
├── requirements.txt        # Python backend dependencies
├── README.md               # Project documentation
├── backend/
│   ├── main.py             # FastAPI entry point & API routes
│   ├── database.py         # MongoDB connection & client initialization
│   ├── schemas.py          # Pydantic data models
│   ├── pipeline.py         # Audio to documentation processing pipeline
│   ├── transcription.py    # Faster-Whisper audio transcription
│   ├── refinement.py       # OpenAI LLM transcript correction
│   ├── documentation.py    # Structured meeting minutes generator
│   ├── vision.py           # OpenCV QR & ArUco marker scanner
│   └── utils.py            # File saving & helper utilities
└── frontend/
    ├── package.json        # Frontend scripts and packages
    ├── vite.config.js      # Vite configuration
    └── src/
        ├── App.jsx         # App router & ProtectedRoute guards
        ├── dashboard/      # Dashboard overview & navigation
        ├── meeting/        # Audio upload, transcript editor & minutes UI
        ├── decode/         # ArUco & QR vision scanner page
        ├── login/          # Login authentication view
        └── register/       # User registration view
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
