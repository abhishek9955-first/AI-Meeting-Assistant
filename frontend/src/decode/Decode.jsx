import React, { useState, useRef } from "react";
import "./Decode.css";

export default function Decode() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [copiedKey, setCopiedKey] = useState(null);
    const [error, setError] = useState("");

    const fileInputRef = useRef(null);
    const apiUrl = "http://localhost:8000";

    // Sample fallback test data
    const loadSampleData = () => {
        setIsScanning(true);
        setError("");
        setTimeout(() => {
            setScanResult({
                timestamp: new Date().toLocaleTimeString(),
                imageName: "sample_clue_board.png",
                aruco: {
                    detected: true,
                    id: "42",
                    size: "24 cm",
                    dictionary: "DICT_4X4_50",
                    rawIds: [42],
                    status: "Detected"
                },
                qrCode: {
                    detected: true,
                    text: "https://meetai.org/session/verify-token-alpha982",
                    type: "URL Link",
                    status: "Decoded"
                }
            });
            setIsScanning(false);
        }, 500);
    };

    const handleFile = (file) => {
        if (!file || !file.type.startsWith("image/")) return;
        
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
            processImageScan(file, file.name);
        };
        reader.readAsDataURL(file);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
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
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation();
        setSelectedImage(null);
        setImagePreview(null);
        setScanResult(null);
        setError("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const processImageScan = async (fileObj, fileName) => {
        const targetFile = fileObj || selectedImage;
        if (!targetFile) return;
        const targetName = fileName || targetFile.name;

        const formData = new FormData();
        formData.append("file", targetFile);

        try {
            setError("");
            setIsScanning(true);

            const response = await fetch(`${apiUrl}/scan-clue`, {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.error || `Server returned status ${response.status}`);
            }

            const data = await response.json();

            setScanResult({
                timestamp: new Date().toLocaleTimeString(),
                imageName: targetName,
                aruco: {
                    detected: !!data.aruco_detected,
                    id: data.aruco_detected && data.aruco_ids && data.aruco_ids.length > 0 ? data.aruco_ids.join(", ") : "None",
                    size: data.aruco_detected ? "24 cm" : "—",
                    dictionary: "DICT_4X4_50",
                    rawIds: data.aruco_ids || [],
                    status: data.aruco_detected ? "Detected" : "Not Found"
                },
                qrCode: {
                    detected: !!data.qr_detected,
                    text: data.qr_data || "No QR Code payload found in image",
                    type: data.qr_detected ? (data.qr_data?.startsWith("http") ? "URL Link" : "Single-line Text") : "—",
                    status: data.qr_detected ? "Decoded" : "Not Found"
                }
            });
        } catch (err) {
            console.error("Backend scan failed:", err);
            setError(err.message || "Failed to connect to backend /scan-clue endpoint at http://localhost:8000.");
        } finally {
            setIsScanning(false);
        }
    };

    const copyText = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="decode-container">
            {/* Header Section */}
            <div className="decode-header">
                <div className="header-badge-tag">
                    <span className="dot" />
                    Dual Vision Scanner
                </div>
                <h2>
                    QR Code & <span>ArUco Marker</span> Scanner
                </h2>
                <p>
                    Upload a single image containing both a QR code and an ArUco marker. 
                    The OpenCV vision backend processes the image, extracts the ArUco ID with 24 cm scale calibration, and decodes the QR code text.
                </p>
            </div>

            {/* Upload Area */}
            <div className="decode-upload-card">
                <div
                    className={`decode-dropzone ${isDragging ? "dragging" : ""} ${imagePreview ? "has-preview" : ""}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => {
                        if (!selectedImage) fileInputRef.current?.click();
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden-decode-input"
                        onChange={handleFileChange}
                    />

                    {!imagePreview ? (
                        <div className="dropzone-empty-content">
                            <div className="dual-scan-icon-bubble">
                                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                </svg>
                            </div>
                            <h3>Upload image with QR & ArUco</h3>
                            <p>
                                Drag and drop your image file here, or <span>browse from device</span>
                            </p>
                            <div className="preset-sample-link" onClick={(e) => { e.stopPropagation(); loadSampleData(); }}>
                                Or try sample test scanner data →
                            </div>
                        </div>
                    ) : (
                        <div className="preview-content-box" onClick={(e) => e.stopPropagation()}>
                            <div className="image-preview-wrapper">
                                <img src={imagePreview} alt="Target upload" className="target-image" />
                                <div className="scanning-overlay-grid">
                                    <div className="scan-line" />
                                    <div className="aruco-bounding-box" title="ArUco Marker Detected">
                                        <span className="box-tag">ArUco #24cm</span>
                                    </div>
                                    <div className="qr-bounding-box" title="QR Code Detected">
                                        <span className="box-tag">QR Code</span>
                                    </div>
                                </div>
                            </div>
                            <div className="preview-toolbar">
                                <span className="preview-filename">{selectedImage?.name || "Uploaded Image"}</span>
                                <button
                                    type="button"
                                    className="btn-remove-image"
                                    onClick={handleRemoveImage}
                                    title="Remove and select another image"
                                >
                                    Remove & Replace
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {isScanning && (
                    <div className="scanning-status-bar">
                        <div className="pulse-spinner" />
                        <span>Sending to OpenCV backend: Detecting ArUco markers (24 cm scale) and decoding QR payload...</span>
                    </div>
                )}

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

            {/* Response Section at Bottom */}
            {scanResult && (
                <div className="scan-results-container">
                    <div className="results-header-bar">
                        <div className="results-title-group">
                            <div className="result-check-icon">✓</div>
                            <div>
                                <h3>Backend Detection Results</h3>
                                <p className="results-meta">
                                    Target: <strong>{scanResult.imageName}</strong> • Scanned at {scanResult.timestamp}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn-rescan"
                            onClick={() => processImageScan(selectedImage, scanResult.imageName)}
                        >
                            Re-scan Image
                        </button>
                    </div>

                    <div className="results-dual-grid">
                        {/* 1. ARUCO MARKER CARD */}
                        <div className="result-card aruco-card">
                            <div className="result-card-header">
                                <div className="card-badge aruco-badge">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z" />
                                    </svg>
                                    ArUco Marker
                                </div>
                                <span className={`status-chip ${scanResult.aruco.detected ? 'success' : 'warning'}`}>
                                    {scanResult.aruco.status}
                                </span>
                            </div>

                            <div className="result-card-body">
                                <div className="primary-stat-row">
                                    <div className="stat-box">
                                        <span className="stat-label">ArUco ID</span>
                                        <span className="stat-value-highlight">
                                            {scanResult.aruco.detected ? `#${scanResult.aruco.id}` : "None"}
                                        </span>
                                    </div>
                                    <div className="stat-box">
                                        <span className="stat-label">Marker Size</span>
                                        <span className="stat-value-highlight size-badge">
                                            {scanResult.aruco.size}
                                        </span>
                                    </div>
                                </div>

                                <div className="info-detail-list">
                                    <div className="info-detail-row">
                                        <span className="detail-key">Dictionary:</span>
                                        <span className="detail-val font-mono">{scanResult.aruco.dictionary}</span>
                                    </div>
                                    <div className="info-detail-row">
                                        <span className="detail-key">Detected IDs Count:</span>
                                        <span className="detail-val font-mono">{scanResult.aruco.rawIds.length}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="result-card-footer">
                                <button
                                    className="btn-card-action"
                                    disabled={!scanResult.aruco.detected}
                                    onClick={() => copyText(`ArUco ID: ${scanResult.aruco.id} | Size: ${scanResult.aruco.size}`, 'aruco')}
                                >
                                    {copiedKey === 'aruco' ? "✓ ArUco Info Copied" : "Copy ArUco Data"}
                                </button>
                            </div>
                        </div>

                        {/* 2. QR CODE CARD */}
                        <div className="result-card qr-card">
                            <div className="result-card-header">
                                <div className="card-badge qr-badge">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                    QR Code
                                </div>
                                <span className={`status-chip ${scanResult.qrCode.detected ? 'success' : 'warning'}`}>
                                    {scanResult.qrCode.status}
                                </span>
                            </div>

                            <div className="result-card-body">
                                <div className="qr-text-container">
                                    <span className="stat-label">Decoded One-Line Text:</span>
                                    <div className="qr-text-box">
                                        <span className="one-line-qr-text">{scanResult.qrCode.text}</span>
                                    </div>
                                </div>

                                <div className="info-detail-list">
                                    <div className="info-detail-row">
                                        <span className="detail-key">Payload Type:</span>
                                        <span className="detail-val">{scanResult.qrCode.type}</span>
                                    </div>
                                    <div className="info-detail-row">
                                        <span className="detail-key">Detection Status:</span>
                                        <span className="detail-val">{scanResult.qrCode.detected ? "Payload Extracted" : "No QR found"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="result-card-footer">
                                <button
                                    className="btn-card-action primary-action"
                                    disabled={!scanResult.qrCode.detected}
                                    onClick={() => copyText(scanResult.qrCode.text, 'qr')}
                                >
                                    {copiedKey === 'qr' ? "✓ Decoded Text Copied" : "Copy QR Text"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
