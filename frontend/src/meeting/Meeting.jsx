import React, { useState, useRef } from "react";
import "./Meeting.css";

// ==========================================================
// TEMPORARY / MOCK DATA FOR DEMO & TESTING
// ==========================================================
export const MOCK_RAW_TRANSCRIPT = `Speaker 1: Alright everyone, lets start the Q3 roadmap sync. First on the agenda is the cloud migration for our core authentication service. Sarah, how is AWS migration looking?
Speaker 2: We have completed the staging deployment on ECS and RDS Postgres. We ran into some latency bottlenecks with redis caching, but we shaved off about 40 milliseconds by tuning connection pooling.
Speaker 1: Great. Are we still on track for the September 15th cutover?
Speaker 2: Yes, as long as security finishes their penetration audit by next Wednesday.
Speaker 3: Security audit is scheduled for this Friday. I will oversee the compliance sign-off.
Speaker 1: Perfect. Also, we need to finalize the redesign for the client portal. Alex, can you take ownership of delivering the Figma prototypes?
Speaker 4: Sure, I can deliver the revised user journeys and Figma design tokens by next Monday.
Speaker 1: Awesome. Let's make sure we also update the API rate limiter before the mobile app release next month.`;

export const MOCK_REFINED_TRANSCRIPT = `Speaker 1: Alright everyone, let's start the Q3 roadmap sync. First on the agenda is the cloud migration for our core authentication service. Sarah, how is AWS migration looking?
Speaker 2: We have completed the staging deployment on Amazon ECS and Amazon RDS PostgreSQL. We ran into some latency bottlenecks with Redis caching, but we shaved off about 40ms by tuning connection pooling.
Speaker 1: Great. Are we still on track for the September 15th cutover?
Speaker 2: Yes, as long as security finishes their penetration audit by next Wednesday.
Speaker 3: The security audit is scheduled for this Friday. I will oversee the compliance sign-off.
Speaker 1: Perfect. Also, we need to finalize the redesign for the client portal. Alex, can you take ownership of delivering the Figma prototypes?
Speaker 4: Sure, I can deliver the revised user journeys and Figma design tokens by next Monday.
Speaker 1: Awesome. Let's make sure we also update the API rate limiter before the mobile app release next month.`;

export const MOCK_MEETING_RECORD = {
    summary: "The team held their Q3 roadmap sync to review the core authentication service AWS migration and upcoming deliverable milestones. Staging deployments on ECS and RDS are complete with Redis latency optimizations. The security audit is slated for Friday to ensure a September 15 cutover, while design tokens and API rate limiting tasks were distributed.",
    decisions: [
        "Confirmed the final cloud cutover date for September 15th.",
        "Approved the tuned connection pooling configuration for Redis caching.",
        "Scheduled the mandatory security penetration audit for this Friday."
    ],
    action_items: [
        {
            task: "Complete penetration test and oversee compliance sign-off",
            owner: "Sarah / Security Team",
            deadline: "Next Wednesday"
        },
        {
            task: "Deliver revised user journeys and Figma design tokens",
            owner: "Alex",
            deadline: "Next Monday"
        },
        {
            task: "Update API rate limiter configurations before mobile release",
            owner: "",
            deadline: "Next Month"
        },
        {
            task: "Conduct final pre-cutover smoke tests on ECS staging",
            owner: "",
            deadline: ""
        }
    ],
    minutes: [
        "Discussed core authentication cloud migration to AWS ECS and RDS PostgreSQL.",
        "Resolved Redis latency bottlenecks by tuning connection pooling, cutting latency by 40ms.",
        "Security compliance sign-off is pending Friday's audit results.",
        "Figma prototypes and UX token updates scheduled for Monday delivery."
    ]
};

export default function Meeting() {
    const [tab, setTab] = useState("input"); // "input" | "transcripts" | "minutes"
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [rawTranscript, setRawTranscript] = useState(MOCK_RAW_TRANSCRIPT);
    const [refinedTranscript, setRefinedTranscript] = useState(MOCK_REFINED_TRANSCRIPT);
    const [meetingRecord, setMeetingRecord] = useState(MOCK_MEETING_RECORD);
    const [error, setError] = useState("");
    const [transcriptView, setTranscriptView] = useState("split"); // "split" | "raw" | "refined"
    const [copiedKey, setCopiedKey] = useState(null);
    const [completedTasks, setCompletedTasks] = useState({});

    const fileInputRef = useRef(null);
    const apiUrl = "http://localhost:8000";

    const acceptedFormats = [
        { label: "MP3", ext: "audio/mpeg" },
        { label: "WAV", ext: "audio/wav" },
        { label: "M4A", ext: "audio/x-m4a" },
        { label: "AAC", ext: "audio/aac" },
        { label: "OGG", ext: "audio/ogg" },
        { label: "FLAC", ext: "audio/flac" },
    ];

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleRemoveFile = (e) => {
        e.stopPropagation();
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

    const handleProceed = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            setError("");
            setIsProcessing(true);
            const response = await fetch(`${apiUrl}/process`, {
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
                setIsProcessing(false);
                return;
            }
            setRawTranscript(result.raw_transcript || "");
            setRefinedTranscript(result.refined_transcript || "");
            setMeetingRecord(result.meeting_record || null);
            setTab("transcripts");
        } catch (err) {
            console.error("Processing failed:", err);
            setError(err.message || "Failed to connect to the backend server at http://localhost:8000. Please ensure the backend is running.");
        } finally {
            setIsProcessing(false);
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
        setRawTranscript("");
        setRefinedTranscript("");
        setMeetingRecord(null);
        setError("");
        setCompletedTasks({});
        setTab("input");
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
                            Upload your English meeting recording and let AI transcribe, refine,
                            and organize structured minutes and action items automatically.
                        </p>
                    </div>

                    {/* Main Upload Card */}
                    <div className="meeting-card">
                        {/* Accepted Formats Bar */}
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
                            className={`dropzone-container ${isDragging ? "dragging" : ""}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => {
                                if (!selectedFile) {
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
                                            <span className="file-size">{formatFileSize(selectedFile.size)} • Ready to process</span>
                                        </div>
                                    </div>
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
                                </div>
                            )}
                        </div>

                        {/* Bottom Proceed Meeting Button */}
                        <div className="proceed-wrapper">
                            <button
                                type="button"
                                className="btn-proceed"
                                disabled={!selectedFile || isProcessing}
                                onClick={handleProceed}
                            >
                                {isProcessing ? (
                                    <>
                                        <span className="spinner-icon" />
                                        <span>Transcribing & Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Process Meeting Audio</span>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                            <polyline points="12 5 19 12 12 19" />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>

                        {error && (
                            <div className="error-banner">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ============================================================== */}
            {/* STEP 2: TRANSCRIPTS TAB (RAW & REFINED ON ONE PAGE)           */}
            {/* ============================================================== */}
            {tab === "transcripts" && (
                <div className="meeting-page-section">
                    <div className="section-header-row">
                        <div>
                            <h2 className="section-title">Meeting Transcripts</h2>
                            <p className="section-subtitle">
                                Review the raw speech-to-text transcript alongside the AI-refined transcript.
                            </p>
                        </div>
                        <div className="view-toggle-group">
                            <button
                                className={`view-toggle-btn ${transcriptView === "split" ? "active" : ""}`}
                                onClick={() => setTranscriptView("split")}
                            >
                                Side-by-Side
                            </button>
                            <button
                                className={`view-toggle-btn ${transcriptView === "refined" ? "active" : ""}`}
                                onClick={() => setTranscriptView("refined")}
                            >
                                Refined Only
                            </button>
                            <button
                                className={`view-toggle-btn ${transcriptView === "raw" ? "active" : ""}`}
                                onClick={() => setTranscriptView("raw")}
                            >
                                Raw Only
                            </button>
                        </div>
                    </div>

                    {/* Transcripts Comparison Grid */}
                    <div className={`transcripts-grid view-${transcriptView}`}>
                        {/* RAW TRANSCRIPT PANEL */}
                        {(transcriptView === "split" || transcriptView === "raw") && (
                            <div className="transcript-card raw-card">
                                <div className="transcript-card-header">
                                    <div className="header-badge-group">
                                        <span className="badge badge-raw">Raw Transcript</span>
                                        <span className="word-count">{countWords(rawTranscript)} words</span>
                                    </div>
                                    <button
                                        className="btn-action-icon"
                                        title="Copy raw transcript"
                                        onClick={() => copyToClipboard(rawTranscript, "raw")}
                                    >
                                        {copiedKey === "raw" ? "✓ Copied" : "Copy"}
                                    </button>
                                </div>
                                <div className="transcript-body">
                                    {rawTranscript ? (
                                        <p className="transcript-text">{rawTranscript}</p>
                                    ) : (
                                        <div className="empty-state">No raw transcript generated yet.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* REFINED TRANSCRIPT PANEL */}
                        {(transcriptView === "split" || transcriptView === "refined") && (
                            <div className="transcript-card refined-card">
                                <div className="transcript-card-header">
                                    <div className="header-badge-group">
                                        <span className="badge badge-refined">AI Refined Transcript</span>
                                        <span className="word-count">{countWords(refinedTranscript)} words</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "6px" }}>
                                        <button
                                            className="btn-action-icon"
                                            title="Download refined transcript as text file"
                                            onClick={handleDownloadRefinedTranscriptText}
                                        >
                                            ↓ Download .TXT
                                        </button>
                                        <button
                                            className="btn-action-icon"
                                            title="Copy refined transcript"
                                            onClick={() => copyToClipboard(refinedTranscript, "refined")}
                                        >
                                            {copiedKey === "refined" ? "✓ Copied" : "Copy"}
                                        </button>
                                    </div>
                                </div>
                                <div className="transcript-body">
                                    {refinedTranscript ? (
                                        <p className="transcript-text refined-text">{refinedTranscript}</p>
                                    ) : (
                                        <div className="empty-state">No refined transcript generated yet.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Footer Navigation */}
                    <div className="page-actions-footer">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setTab("input")}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            <span>Back to Upload</span>
                        </button>

                        <button
                            type="button"
                            className="btn-proceed"
                            onClick={() => setTab("minutes")}
                            disabled={!meetingRecord}
                        >
                            <span>Proceed with Refined Transcript</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {/* ============================================================== */}
            {/* STEP 3: MEETING MINUTES & TASKS TAB                            */}
            {/* ============================================================== */}
            {tab === "minutes" && (
                <div className="meeting-page-section">
                    <div className="section-header-row">
                        <div>
                            <h2 className="section-title">Meeting Minutes & Action Items</h2>
                            <p className="section-subtitle">
                                Structured executive summary, confirmed decisions, and actionable assigned tasks.
                            </p>
                        </div>
                        <div className="export-actions-group">
                            <button
                                className="btn-secondary-sm"
                                title="Download Refined Transcript as .txt"
                                onClick={handleDownloadRefinedTranscriptText}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <line x1="16" y1="13" x2="8" y2="13" />
                                    <line x1="16" y1="17" x2="8" y2="17" />
                                </svg>
                                Download Refined Transcript (.txt)
                            </button>
                            <button
                                className="btn-secondary-sm"
                                title="Download complete Meeting Minutes as .txt"
                                onClick={handleDownloadMeetingRecordText}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download Minutes (.txt)
                            </button>
                            <button
                                className="btn-secondary-sm"
                                onClick={() => copyToClipboard(JSON.stringify(meetingRecord, null, 2), "json")}
                            >
                                {copiedKey === "json" ? "✓ JSON Copied" : "Copy JSON"}
                            </button>
                        </div>
                    </div>

                    {meetingRecord ? (
                        <div className="minutes-layout">
                            {/* Executive Summary Card */}
                            <div className="doc-section-card summary-card">
                                <div className="doc-section-header">
                                    <div className="doc-header-title">
                                        <div className="doc-icon-badge icon-summary">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="16" y1="13" x2="8" y2="13" />
                                                <line x1="16" y1="17" x2="8" y2="17" />
                                                <polyline points="10 9 9 9 8 9" />
                                            </svg>
                                        </div>
                                        <h3>Executive Summary</h3>
                                    </div>
                                    <button
                                        className="btn-action-icon"
                                        onClick={() => copyToClipboard(meetingRecord.summary, "sum")}
                                    >
                                        {copiedKey === "sum" ? "✓ Copied" : "Copy"}
                                    </button>
                                </div>
                                <p className="summary-paragraph">{meetingRecord.summary || "No summary provided."}</p>
                            </div>

                            {/* Key Decisions Card */}
                            <div className="doc-section-card decisions-card">
                                <div className="doc-section-header">
                                    <div className="doc-header-title">
                                        <div className="doc-icon-badge icon-decisions">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                        </div>
                                        <h3>Key Confirmed Decisions</h3>
                                        <span className="count-pill">{meetingRecord.decisions?.length || 0}</span>
                                    </div>
                                </div>
                                {meetingRecord.decisions && meetingRecord.decisions.length > 0 ? (
                                    <ul className="decisions-list">
                                        {meetingRecord.decisions.map((decision, idx) => (
                                            <li key={idx} className="decision-item">
                                                <span className="decision-check-icon">✓</span>
                                                <span className="decision-text">{decision}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="empty-text">No confirmed decisions recorded.</p>
                                )}
                            </div>

                            {/* Actionable Tasks Table Card */}
                            <div className="doc-section-card tasks-card">
                                <div className="doc-section-header">
                                    <div className="doc-header-title">
                                        <div className="doc-icon-badge icon-tasks">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                        </div>
                                        <h3>Actionable Tasks & Work Items</h3>
                                        <span className="count-pill">{meetingRecord.action_items?.length || 0}</span>
                                    </div>
                                </div>

                                {meetingRecord.action_items && meetingRecord.action_items.length > 0 ? (
                                    <div className="tasks-table-wrapper">
                                        <table className="tasks-table">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: "48px" }}>Status</th>
                                                    <th>Work To Be Done</th>
                                                    <th style={{ width: "180px" }}>Owner</th>
                                                    <th style={{ width: "180px" }}>Deadline</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {meetingRecord.action_items.map((item, idx) => {
                                                    const isDone = !!completedTasks[idx];
                                                    const hasOwner = !isUnspecified(item.owner);
                                                    const hasDeadline = !isUnspecified(item.deadline);

                                                    return (
                                                        <tr key={idx} className={isDone ? "task-row-done" : ""}>
                                                            <td className="status-cell">
                                                                <input
                                                                    type="checkbox"
                                                                    className="task-checkbox"
                                                                    checked={isDone}
                                                                    onChange={() => toggleTaskCompleted(idx)}
                                                                />
                                                            </td>
                                                            <td className="task-cell">
                                                                <span className="task-description">{item.task}</span>
                                                            </td>
                                                            <td className="owner-cell">
                                                                {hasOwner ? (
                                                                    <div className="owner-tag">
                                                                        <span className="owner-avatar">
                                                                            {item.owner.charAt(0).toUpperCase()}
                                                                        </span>
                                                                        <span className="owner-name">{item.owner}</span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="empty-value-cell">—</span>
                                                                )}
                                                            </td>
                                                            <td className="deadline-cell">
                                                                {hasDeadline ? (
                                                                    <span className="deadline-tag">
                                                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                            <circle cx="12" cy="12" r="10" />
                                                                            <polyline points="12 6 12 12 16 14" />
                                                                        </svg>
                                                                        {item.deadline}
                                                                    </span>
                                                                ) : (
                                                                    <span className="empty-value-cell">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="empty-text">No actionable tasks assigned in this meeting.</p>
                                )}
                            </div>

                            {/* Meeting Minutes Discussion Points */}
                            {meetingRecord.minutes && meetingRecord.minutes.length > 0 && (
                                <div className="doc-section-card minutes-card">
                                    <div className="doc-section-header">
                                        <div className="doc-header-title">
                                            <div className="doc-icon-badge icon-minutes">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="8" y1="6" x2="21" y2="6" />
                                                    <line x1="8" y1="12" x2="21" y2="12" />
                                                    <line x1="8" y1="18" x2="21" y2="18" />
                                                    <line x1="3" y1="6" x2="3.01" y2="6" />
                                                    <line x1="3" y1="12" x2="3.01" y2="12" />
                                                    <line x1="3" y1="18" x2="3.01" y2="18" />
                                                </svg>
                                            </div>
                                            <h3>Discussion Minutes</h3>
                                            <span className="count-pill">{meetingRecord.minutes.length}</span>
                                        </div>
                                    </div>
                                    <ul className="minutes-list">
                                        {meetingRecord.minutes.map((minute, idx) => (
                                            <li key={idx} className="minute-item">
                                                <span className="minute-bullet" />
                                                <span className="minute-text">{minute}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="empty-state-card">
                            <p>No meeting record available yet. Please complete processing your recording.</p>
                        </div>
                    )}

                    {/* Bottom Footer Navigation */}
                    <div className="page-actions-footer">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setTab("transcripts")}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            <span>Back to Transcripts</span>
                        </button>

                        <button
                            type="button"
                            className="btn-proceed"
                            onClick={handleResetAll}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                            </svg>
                            <span>Process New Meeting</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}