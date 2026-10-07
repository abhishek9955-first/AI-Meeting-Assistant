import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Register.css'

export default function Register() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [agreeTerms, setAgreeTerms] = useState(false)
    const [viewPassword ,setViewPassword]=useState(false)
    const navigate = useNavigate()

    const handleSubmit = (e) => {
        e.preventDefault()
        // Navigate to dashboard
        navigate('/')
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Brand Header */}
                <div className="auth-header">
                    <div className="brand-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <line x1="19" y1="8" x2="19" y2="14" />
                            <line x1="22" y1="11" x2="16" y2="11" />
                        </svg>
                        <span>Create Free Account</span>
                    </div>
                    <h1 className="auth-title">Get started today</h1>
                    <p className="auth-subtitle">Join AI Meeting Assistant to automatically transcribe & document meetings</p>
                </div>

                {/* Register Form */}
                <form className="auth-form" onSubmit={handleSubmit}>
                    {/* Username */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="username">Full Name or Username</label>
                        <div className="input-wrapper">
                            <div className="input-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                id="username"
                                className="form-input"
                                placeholder="MeetAI-user"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Work Email</label>
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
                                placeholder="alex@meetai.com"
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
                            <div className="view-icon" onClick={() => { setViewPassword(!viewPassword) }} >
                                {viewPassword ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                    <line x1="2" y1="2" x2="22" y2="22" />
                                </svg>

                                }
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

                    {/* Terms checkbox */}
                    <label className="terms-label">
                        <input
                            type="checkbox"
                            className="terms-checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            required
                        />
                        <span>I agree to the <a href="#terms" className="terms-link" onClick={(e) => e.preventDefault()}>Terms of Service</a> and <a href="#privacy" className="terms-link" onClick={(e) => e.preventDefault()}>Privacy Policy</a></span>
                    </label>

                    {/* Submit Button */}
                    <button type="submit" className="btn-primary">
                        <span>Create Account</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                </form>

                {/* Footer */}
                <div className="auth-footer">
                    Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
                </div>
            </div>
        </div>
    )
}