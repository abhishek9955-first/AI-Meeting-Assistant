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

    const handleFile = (file) => {
        if (!file || !file.type.startsWith("image/")) return;
        
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setImagePreview(e.target.result);
            processImageScan(file);
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

    const processImageScan = async (fileObj) => {
        const targetFile = fileObj;
        if (!targetFile) return;

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
            console.log(data);
            console.log(data.aruco_ids);
            console.log(data.qr_data);
            setScanResult({
                isArucoDetected:data.aruco_detected,
                isQrDetected:data.qr_detected,
                arucoDetected: data.aruco_ids,
                qrDetected: data.qr_data,
            });
            console.log(scanResult,"scanned result");
        } catch (err) {
            console.error(" scan failed:", err);
            setError(err.message || "fail to scan");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="decode-container">
            {/* Header Section */}
            <div className="decode-header">
                <h2>
                    QR Code & <span>ArUco Marker</span> Scanner
                </h2>
                <p>
                    Upload an image containing both a QR code and an ArUco marker to extract the marker ID
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
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                </svg>
                            </div>
                            <h3>Upload image to scan</h3>
                            <p>
                                Drag and drop your image file here, or <span>browse from device</span>
                            </p>
                        </div>
                    ) : (
                        <div className="preview-content-box" onClick={(e) => e.stopPropagation()}>
                            <div className="image-preview-wrapper">
                                <img src={imagePreview} alt="Target upload" className="target-image" />
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
                        <span>Processing image on backend</span>
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

            {/* Response Section at Bottom (Only outputs from backend) */}
            {scanResult && (
                <div className="scan-results-container">
                    <div className="results-header-bar">
                        <div className="results-title-group">
                            <div className="result-check-icon">✓</div>
                            <div>
                                <h3>Backend Detection Results</h3>
                                <p className="results-meta">
                                    Scanned image: <strong>{scanResult.imageName}</strong> at {scanResult.timestamp}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="btn-rescan"
                            onClick={() => processImageScan(selectedImage, scanResult.imageName)}
                        >
                            Re-scan
                        </button>
                    </div>

                    <div className="results-dual-grid">
                        {/* 1. ARUCO MARKER OUTPUT */}
                        <div className="result-card aruco-card">
                            <div className="result-card-header">
                                <div className="card-badge aruco-badge">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z" />
                                    </svg>
                                    ArUco Marker
                                </div>
                                <span className={`status-chip ${scanResult.arucoDetected ? 'success' : 'warning'}`}>
                                    {scanResult.isArucoDetected ? 'Detected' : 'Not Found'}
                                </span>
                            </div>
                            <div className="result-card-body">
                                {scanResult.arucoDetected}
                            </div>

                        </div>

                        {/* 2. QR CODE OUTPUT */}
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
                                <span className={`status-chip ${scanResult.qrDetected ? 'success' : 'warning'}`}>
                                    {scanResult.isQrDetected ? "Detected" : "Not Found"}
                                </span>
                            </div>

                            <div className="result-card-body">
                                <div className="qr-text-container">
                                    <span className="stat-label">Decoded QR Text:</span>
                                    <div className="qr-text-box">
                                        <span className="one-line-qr-text">{scanResult.qrDetected}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
