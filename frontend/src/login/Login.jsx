import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'
export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [viewPassword, setViewPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const navigate = useNavigate()
    const apiBaseUrl="http://localhost:8000"
    const handleSubmit =async (e) => {
        e.preventDefault()
        setErrorMsg('')
        setLoading(true)

        try {
            const response = await fetch(`${apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail || data.message || 'Login failed. Please check your credentials.')
            }

            // Store user session in localStorage
            localStorage.setItem('accesstoken', JSON.stringify(data.access_token))
            localStorage.setItem('user', JSON.stringify(data.user))

            // Navigate to Dashboard
            navigate('/')
        } catch (err) {
            setErrorMsg(err.message || 'Unable to connect to server.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Brand Header */}
                <div className="auth-header">
                    <div className="brand-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="22" />
                        </svg>
                        <span>Meet AI Assistant</span>
                    </div>
                    <h1 className="auth-title">Welcome back</h1>
                    <p className="auth-subtitle">Sign in to access your meeting transcripts and AI summaries</p>
                </div>

                {/* Error Alert */}
                {errorMsg && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        marginBottom: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* Login Form */}
                <form className="auth-form" onSubmit={handleSubmit}>
                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email address</label>
                        <div className="input-wrapper">
                            <div className="input-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                id="email"
                                className="form-input"
                                placeholder="name@meetai.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <div className="input-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <div className="view-icon" onClick={() => setViewPassword(!viewPassword)}>
                                {viewPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                        <line x1="2" y1="2" x2="22" y2="22" />
                                    </svg>
                                )}
                            </div>
                            <input
                                type={viewPassword ? 'text' : 'password'}
                                id="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <span>Signing in...</span> : (
                            <>
                                <span>Sign In</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="auth-footer">
                    Don't have an account? <Link to="/register" className="auth-link">Sign up</Link>
                </div>
            </div>
        </div>
    )
}
