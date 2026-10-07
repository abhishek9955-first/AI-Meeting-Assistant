import React, { useState, useRef, useEffect } from "react";
import "./Meeting.css";
import { useNavigate } from "react-router-dom";

export default function Meeting() {
    const [tab, setTab] = useState("input"); // "input" | "transcripts" | "minutes"
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Process States
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isRefining, setIsRefining] = useState(false);
    const [isDocumenting, setIsDocumenting] = useState(false);
    const [fileLocked, setFileLocked] = useState(false);
    
    // Data States
    const [rawTranscript, setRawTranscript] = useState("");
    const [refinedTranscript, setRefinedTranscript] = useState("");
    const [meetingRecord, setMeetingRecord] = useState(null);
    
    const [error, setError] = useState("");
    const [transcriptView, setTranscriptView] = useState("split"); // "split" | "raw" | "refined"
    const [copiedKey, setCopiedKey] = useState(null);
    const [completedTasks, setCompletedTasks] = useState({});

    const fileInputRef = useRef(null);
    const apiUrl = "http://localhost:8000";
    const navigate = useNavigate();

    const acceptedFormats = [
        { label: "MP3", ext: "audio/mpeg" },
        { label: "WAV", ext: "audio/wav" },
        { label: "M4A", ext: "audio/x-m4a" },
        { label: "AAC", ext: "audio/aac" },
        { label: "OGG", ext: "audio/ogg" },
        { label: "FLAC", ext: "audio/flac" },
    ];

    const handleFileChange = (e) => {
        if (fileLocked) return;
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setError("");
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (!fileLocked) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (fileLocked) return;
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
            setError("");
        }
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
        if (fileLocked) return;
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const countWords = (str) => {
        if (!str) return 0;
        return str.trim().split(/\s+/).filter(Boolean).length;
    };

    // Step 1: Transcribe Audio File -> Raw Transcript
    const handleTranscribeAudio = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            setError("");
            setIsTranscribing(true);
            
            const response = await fetch(`${apiUrl}/transcribe`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || `Server responded with status ${response.status}`);
            }

            const result = await response.json();
            if (result.error) {
                setError(result.error + (result.details ? `: ${result.details}` : ""));
                setIsTranscribing(false);
                return;
            }

            setRawTranscript(result.raw_transcript || "");
            setFileLocked(true); // Lock audio file so it cannot be changed during the session
        } catch (err) {
            console.error("Transcription failed:", err);
            setError(err.message || "Failed to connect to backend server. Make sure the backend is running.");
        } finally {
            setIsTranscribing(false);
        }
    };

    // Step 2: Post to LLM 1 (/refine) -> Refined Transcript
    const handleRefineTranscript = async () => {
        if (!rawTranscript || !rawTranscript.trim()) {
            setError("Raw transcript is empty. Please enter or transcribe text first.");
            return;
        }

        try {
            setError("");
            setIsRefining(true);

            const response = await fetch(`${apiUrl}/refine`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    raw_transcript: rawTranscript.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || errorData.detail || `Server error: ${response.status}`);
            }

            const result = await response.json();
            if (result.error) {
                setError(result.error + (result.details ? `: ${result.details}` : ""));
                setIsRefining(false);
                return;
            }

            setRefinedTranscript(result.refined_transcript || "");
            setTab("transcripts"); // Navigate to dual transcript view
        } catch (err) {
            console.error("Refinement failed:", err);
            setError(err.message || "Failed to refine transcript with LLM 1.");
        } finally {
            setIsRefining(false);
        }
    };

    // Step 3: Post to LLM 2 (/document) -> Structured Meeting Minutes
    const handleGenerateMinutes = async () => {
        const textToDocument = refinedTranscript || rawTranscript;
        if (!textToDocument || !textToDocument.trim()) {
            setError("Refined transcript is empty. Please refine transcript first.");
            return;
        }

        try {
            setError("");
            setIsDocumenting(true);

            const response = await fetch(`${apiUrl}/document`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    refined_transcript: textToDocument.trim()
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || errorData.detail || `Server error: ${response.status}`);
            }

            const result = await response.json();
            if (result.error) {
                setError(result.error + (result.details ? `: ${result.details}` : ""));
                setIsDocumenting(false);
                return;
            }

            setMeetingRecord(result.meeting_record || null);
            setTab("minutes"); // Navigate to meeting minutes view
        } catch (err) {
            console.error("Documentation failed:", err);
            setError(err.message || "Failed to generate meeting minutes with LLM 2.");
        } finally {
            setIsDocumenting(false);
        }
    };

    const copyToClipboard = (text, key) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const toggleTaskCompleted = (idx) => {
        setCompletedTasks(prev => ({
            ...prev,
            [idx]: !prev[idx]
        }));
    };

    const isUnspecified = (val) => {
        if (!val) return true;
        const trimmed = val.trim().toLowerCase();
        return trimmed === "" || trimmed === "unspecified" || trimmed === "none" || trimmed === "n/a";
    };

    const handleDownloadRefinedTranscriptText = () => {
        if (!refinedTranscript) return;
        const blob = new Blob([refinedTranscript], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Refined-Transcript-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadMeetingRecordText = () => {
        if (!meetingRecord) return;
        let txt = `========================================\n`;
        txt += `MEETING RECORD & MINUTES\n`;
        txt += `Date: ${new Date().toLocaleDateString()}\n`;
        txt += `========================================\n\n`;

        txt += `1. EXECUTIVE SUMMARY\n`;
        txt += `--------------------\n`;
        txt += `${meetingRecord.summary || "No summary provided."}\n\n`;

        if (meetingRecord.decisions && meetingRecord.decisions.length > 0) {
            txt += `2. KEY CONFIRMED DECISIONS\n`;
            txt += `--------------------------\n`;
            meetingRecord.decisions.forEach((d, i) => {
                txt += `[✓] ${i + 1}. ${d}\n`;
            });
            txt += `\n`;
        }

        if (meetingRecord.action_items && meetingRecord.action_items.length > 0) {
            txt += `3. ACTIONABLE TASKS & ASSIGNMENTS\n`;
            txt += `---------------------------------\n`;
            meetingRecord.action_items.forEach((item, i) => {
                const owner = isUnspecified(item.owner) ? "Unspecified" : item.owner;
                const deadline = isUnspecified(item.deadline) ? "Unspecified" : item.deadline;
                txt += `• Task ${i + 1}: ${item.task}\n`;
                txt += `  Owner:    ${owner}\n`;
                txt += `  Deadline: ${deadline}\n\n`;
            });
        }

        if (meetingRecord.minutes && meetingRecord.minutes.length > 0) {
            txt += `4. DISCUSSION MINUTES\n`;
            txt += `---------------------\n`;
            meetingRecord.minutes.forEach((m) => {
                txt += `• ${m}\n`;
            });
            txt += `\n`;
        }

        if (refinedTranscript) {
            txt += `5. REFINED TRANSCRIPT\n`;
            txt += `---------------------\n`;
            txt += `${refinedTranscript}\n\n`;
        }

        const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Meeting-Record-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleResetAll = () => {
        setSelectedFile(null);
        setFileLocked(false);
        setRawTranscript("");
        setRefinedTranscript("");
        setMeetingRecord(null);
        setError("");
        setCompletedTasks({});
        setTab("input");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="meeting-container">
            {/* ============================================================== */}
            {/* STEP 1: INPUT TAB                                              */}
            {/* ============================================================== */}
            {tab === "input" && (
                <>
                    {/* Hero Section */}
                    <div className="meeting-hero">
                        <h2>
                            Turn meetings into <span>actionable insights</span>
                        </h2>
                        <p>
                            Upload your meeting audio, review and edit the raw speech transcript, then refine it and extract structured minutes.
                        </p>
                    </div>

                    {/* Main Upload Card */}
                    <div className="meeting-card">
                        {/* Formats Bar */}
                        <div className="formats-bar">
                            <div className="formats-label">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18V5l12-2v13" />
                                    <circle cx="6" cy="18" r="3" />
                                    <circle cx="18" cy="16" r="3" />
                                </svg>
                                <span>Supported Audio Formats:</span>
                            </div>
                            <div className="format-pills">
                                {acceptedFormats.map((f, index) => (
                                    <span
                                        key={f.label}
                                        className={`format-pill ${index < 3 ? "highlight" : ""}`}
                                    >
                                        .{f.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Dropzone Upload Box */}
                        <div
                            className={`dropzone-container ${isDragging ? "dragging" : ""} ${fileLocked ? "locked" : ""}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => {
                                if (!selectedFile && !fileLocked) {
                                    fileInputRef.current?.click();
                                }
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac"
                                className="hidden-file-input"
                                onChange={handleFileChange}
                                disabled={fileLocked}
                            />

                            {!selectedFile ? (
                                <>
                                    <div className="dropzone-icon-circle">
                                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </div>
                                    <div className="dropzone-title">Upload your meeting audio</div>
                                    <p className="dropzone-subtitle">
                                        Drag and drop your audio file here, or <span>browse from device</span>
                                    </p>
                                </>
                            ) : (
                                <div className="selected-file-card" onClick={(e) => e.stopPropagation()}>
                                    <div className="file-info-group">
                                        <div className="file-audio-icon">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 18V5l12-2v13" />
                                                <circle cx="6" cy="18" r="3" />
                                                <circle cx="18" cy="16" r="3" />
                                            </svg>
                                        </div>
                                        <div className="file-details">
                                            <span className="file-name">{selectedFile.name}</span>
                                            <span className="file-size">
                                                {formatFileSize(selectedFile.size)} • {fileLocked ? "🔒 Audio locked for session" : "Ready to transcribe"}
                                            </span>
                                        </div>
                                    </div>

                                    {!fileLocked && (
                                        <button
                                            type="button"
                                            className="btn-remove-file"
                                            title="Remove file"
                                            onClick={handleRemoveFile}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Transcribe Button (Before Raw Transcript is Generated) */}
                        {!rawTranscript && (
                            <div className="proceed-wrapper">
                                <button
                                    type="button"
                                    className="btn-proceed"
                                    disabled={!selectedFile || isTranscribing}
                                    onClick={handleTranscribeAudio}
                                >
                                    {isTranscribing ? (
                                        <>
                                            <div className="btn-spinner" />
                                            <span>Transcribing speech with Whisper AI...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Transcribe Audio</span>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <div className="error-alert">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        {/* ========================================================== */}
                        {/* RAW TRANSCRIPT BOTTOM CONTAINER (EDITABLE)                  */}
                        {/* ========================================================== */}
                        {rawTranscript && (
                            <div className="raw-transcript-editor-section">
                                <div className="raw-editor-header">
                                    <div className="raw-editor-title-group">
                                        <span className="raw-step-badge">Step 1</span>
                                        <h3>Raw Speech Transcript</h3>
                                        <span className="word-count-badge">{countWords(rawTranscript)} words</span>
                                    </div>
                                    <div className="raw-editor-actions">
                                        <button
                                            type="button"
                                            className="btn-reset-session"
                                            onClick={handleResetAll}
                                            title="Reset audio and transcript"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                                <path d="M3 3v5h5" />
                                            </svg>
                                            <span>Reset & New File</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="raw-editor-instruction">
                                    💡 <strong>Review & Edit:</strong> You can edit any acronyms, speaker names, or technical terms in the box below before sending to LLM 1 for refinement.
                                </div>

                                <textarea
                                    className="raw-transcript-textarea"
                                    rows={8}
                                    value={rawTranscript}
                                    onChange={(e) => setRawTranscript(e.target.value)}
                                    placeholder="Your speech transcript will appear here..."
                                />

                                <div className="raw-proceed-wrapper">
                                    <button
                                        type="button"
                                        className="btn-proceed"
                                        disabled={isRefining || !rawTranscript.trim()}
                                        onClick={handleRefineTranscript}
                                    >
                                        {isRefining ? (
                                            <>
                                                <div className="btn-spinner" />
                                                <span>Refining Transcript with LLM 1...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Refine Transcript with AI (LLM 1)</span>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="5" y1="12" x2="19" y2="12" />
                                                    <polyline points="12 5 19 12 12 19" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ============================================================== */}
            {/* STEP 2: DUAL TRANSCRIPTS TAB (RAW & REFINED)                    */}
            {/* ============================================================== */}
            {tab === "transcripts" && (
                <div className="transcripts-layout">
                    {/* Navigation Bar */}
                    <div className="transcripts-navbar">
                        <div className="nav-left">
                            <button
                                type="button"
                                className="btn-back-link"
                                onClick={() => setTab("input")}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                <span>Back to Upload</span>
                            </button>
                            <div className="tab-pill-group">
                                <button
                                    type="button"
                                    className="tab-pill active"
                                    onClick={() => setTab("transcripts")}
                                >
                                    Transcripts Comparison
                                </button>
                                <button
                                    type="button"
                                    className="tab-pill"
                                    onClick={() => setTab("minutes")}
                                >
                                    Meeting Minutes & Tasks
                                </button>
                            </div>
                        </div>

                        <div className="nav-right">
                            {/* View Switcher: Split / Raw / Refined */}
                            <div className="view-mode-toggle">
                                <button
                                    type="button"
                                    className={`toggle-btn ${transcriptView === "split" ? "active" : ""}`}
                                    onClick={() => setTranscriptView("split")}
                                >
                                    Split View
                                </button>
                                <button
                                    type="button"
                                    className={`toggle-btn ${transcriptView === "raw" ? "active" : ""}`}
                                    onClick={() => setTranscriptView("raw")}
                                >
                                    Raw Only
                                </button>
                                <button
                                    type="button"
                                    className={`toggle-btn ${transcriptView === "refined" ? "active" : ""}`}
                                    onClick={() => setTranscriptView("refined")}
                                >
                                    Refined Only
                                </button>
                            </div>

                            <button
                                type="button"
                                className="btn-download-text"
                                onClick={handleDownloadRefinedTranscriptText}
                                title="Download Refined Transcript as .txt"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>Export .txt</span>
                            </button>
                        </div>
                    </div>

                    {/* Transcripts Comparison Grid */}
                    <div className={`transcripts-grid ${transcriptView}`}>
                        {/* Raw Transcript Card */}
                        {(transcriptView === "split" || transcriptView === "raw") && (
                            <div className="transcript-panel raw-panel">
                                <div className="panel-header">
                                    <div className="panel-header-left">
                                        <span className="panel-badge raw-badge">Raw Speech-to-Text</span>
                                        <span className="word-count">{countWords(rawTranscript)} words</span>
                                    </div>
                                    <div className="panel-header-right">
                                        <button
                                            type="button"
                                            className="btn-panel-action"
                                            onClick={() => copyToClipboard(rawTranscript, "raw")}
                                            title="Copy Raw Transcript"
                                        >
                                            {copiedKey === "raw" ? (
                                                <>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                    <span style={{ color: "#10b981" }}>Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="panel-content raw-content">
                                    {rawTranscript ? rawTranscript.split("\n").map((para, i) => (
                                        <p key={i}>{para}</p>
                                    )) : <p style={{ color: '#94a3b8' }}>No raw transcript available.</p>}
                                </div>
                            </div>
                        )}

                        {/* Refined Transcript Card */}
                        {(transcriptView === "split" || transcriptView === "refined") && (
                            <div className="transcript-panel refined-panel">
                                <div className="panel-header">
                                    <div className="panel-header-left">
                                        <span className="panel-badge refined-badge">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            AI-Refined Transcript (LLM 1)
                                        </span>
                                        <span className="word-count">{countWords(refinedTranscript)} words</span>
                                    </div>
                                    <div className="panel-header-right">
                                        <button
                                            type="button"
                                            className="btn-panel-action"
                                            onClick={() => copyToClipboard(refinedTranscript, "refined")}
                                            title="Copy Refined Transcript"
                                        >
                                            {copiedKey === "refined" ? (
                                                <>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                    <span style={{ color: "#10b981" }}>Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                                                    <span>Copy</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="panel-content refined-content">
                                    {refinedTranscript ? refinedTranscript.split("\n").map((para, i) => (
                                        <p key={i}>{para}</p>
                                    )) : <p style={{ color: '#94a3b8' }}>Refined transcript is being generated...</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Action: Proceed to LLM 2 (Meeting Minutes) */}
                    <div className="transcripts-bottom-bar">
                        <button
                            type="button"
                            className="btn-next-step"
                            disabled={isDocumenting || (!refinedTranscript && !rawTranscript)}
                            onClick={handleGenerateMinutes}
                        >
                            {isDocumenting ? (
                                <>
                                    <div className="btn-spinner" />
                                    <span>Generating Minutes & Extracting Tasks (LLM 2)...</span>
                                </>
                            ) : (
                                <>
                                    <span>Generate Meeting Minutes & Action Items (LLM 2)</span>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* STEP 3: STRUCTURED MEETING MINUTES & ACTIONS                    */}
            {/* ============================================================== */}
            {tab === "minutes" && (
                <div className="minutes-layout">
                    {/* Navigation Bar */}
                    <div className="minutes-navbar">
                        <div className="nav-left">
                            <button
                                type="button"
                                className="btn-back-link"
                                onClick={() => setTab("transcripts")}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                <span>Back to Transcripts</span>
                            </button>
                            <div className="tab-pill-group">
                                <button
                                    type="button"
                                    className="tab-pill"
                                    onClick={() => setTab("transcripts")}
                                >
                                    Transcripts Comparison
                                </button>
                                <button
                                    type="button"
                                    className="tab-pill active"
                                    onClick={() => setTab("minutes")}
                                >
                                    Meeting Minutes & Tasks
                                </button>
                            </div>
                        </div>

                        <div className="nav-right">
                            <button
                                type="button"
                                className="btn-download-text primary"
                                onClick={handleDownloadMeetingRecordText}
                                title="Download Meeting Record & Minutes as .txt"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                <span>Export Complete Record (.txt)</span>
                            </button>
                        </div>
                    </div>

                    {/* Executive Summary Card */}
                    {meetingRecord?.summary && (
                        <div className="minutes-section-card summary-card">
                            <div className="section-card-header">
                                <div className="section-title-group">
                                    <div className="section-icon-badge purple">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14 2z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="16" y1="13" x2="8" y2="13" />
                                            <line x1="16" y1="17" x2="8" y2="17" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="section-heading">Executive Summary</h3>
                                        <p className="section-subheading">High-level synthesis of key topics discussed</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn-panel-action"
                                    onClick={() => copyToClipboard(meetingRecord.summary, "summary")}
                                >
                                    {copiedKey === "summary" ? "Copied" : "Copy"}
                                </button>
                            </div>
                            <div className="summary-body">
                                <p>{meetingRecord.summary}</p>
                            </div>
                        </div>
                    )}

                    {/* Confirmed Decisions Card */}
                    {meetingRecord?.decisions && meetingRecord.decisions.length > 0 && (
                        <div className="minutes-section-card decisions-card">
                            <div className="section-card-header">
                                <div className="section-title-group">
                                    <div className="section-icon-badge green">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="section-heading">Confirmed Decisions</h3>
                                        <p className="section-subheading">Approved agreements and final determinations</p>
                                    </div>
                                </div>
                                <span className="count-pill green">{meetingRecord.decisions.length} decisions</span>
                            </div>
                            <div className="decisions-list">
                                {meetingRecord.decisions.map((dec, idx) => (
                                    <div key={idx} className="decision-item">
                                        <div className="decision-check-icon">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                        <span className="decision-text">{dec}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Items Table */}
                    {meetingRecord?.action_items && meetingRecord.action_items.length > 0 && (
                        <div className="minutes-section-card tasks-card">
                            <div className="section-card-header">
                                <div className="section-title-group">
                                    <div className="section-icon-badge blue">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect width="18" height="18" x="3" y="3" rx="2" />
                                            <path d="m9 12 2 2 4-4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="section-heading">Action Items & Deliverables</h3>
                                        <p className="section-subheading">Assigned tasks, ownership, and target milestones</p>
                                    </div>
                                </div>
                                <span className="count-pill blue">{meetingRecord.action_items.length} tasks</span>
                            </div>

                            <div className="tasks-table-wrapper">
                                <table className="tasks-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "48px" }}>Status</th>
                                            <th>Task Description</th>
                                            <th style={{ width: "220px" }}>Assigned Owner</th>
                                            <th style={{ width: "180px" }}>Target Deadline</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {meetingRecord.action_items.map((item, idx) => {
                                            const isDone = completedTasks[idx];
                                            const ownerUnspecified = isUnspecified(item.owner);
                                            const deadlineUnspecified = isUnspecified(item.deadline);

                                            return (
                                                <tr key={idx} className={isDone ? "task-done" : ""}>
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="task-checkbox"
                                                            checked={!!isDone}
                                                            onChange={() => toggleTaskCompleted(idx)}
                                                            title="Toggle task completion"
                                                        />
                                                    </td>
                                                    <td className="task-name-cell">
                                                        <span className="task-title">{item.task}</span>
                                                    </td>
                                                    <td>
                                                        {ownerUnspecified ? (
                                                            <span className="empty-cell-dash">—</span>
                                                        ) : (
                                                            <div className="owner-chip">
                                                                <span className="owner-avatar">
                                                                    {item.owner.trim().charAt(0).toUpperCase()}
                                                                </span>
                                                                <span className="owner-name">{item.owner}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {deadlineUnspecified ? (
                                                            <span className="empty-cell-dash">—</span>
                                                        ) : (
                                                            <div className="deadline-badge">
                                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <circle cx="12" cy="12" r="10" />
                                                                    <polyline points="12 6 12 12 16 14" />
                                                                </svg>
                                                                <span>{item.deadline}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Detailed Discussion Minutes */}
                    {meetingRecord?.minutes && meetingRecord.minutes.length > 0 && (
                        <div className="minutes-section-card discussion-card">
                            <div className="section-card-header">
                                <div className="section-title-group">
                                    <div className="section-icon-badge orange">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="8" y1="6" x2="21" y2="6" />
                                            <line x1="8" y1="12" x2="21" y2="12" />
                                            <line x1="8" y1="18" x2="21" y2="18" />
                                            <line x1="3" y1="6" x2="3.01" y2="6" />
                                            <line x1="3" y1="12" x2="3.01" y2="12" />
                                            <line x1="3" y1="18" x2="3.01" y2="18" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="section-heading">Discussion Points</h3>
                                        <p className="section-subheading">Important notes and context from the discussion</p>
                                    </div>
                                </div>
                            </div>
                            <ul className="minutes-bullets">
                                {meetingRecord.minutes.map((m, i) => (
                                    <li key={i}>{m}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}