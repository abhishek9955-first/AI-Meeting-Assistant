import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'
import Meeting from '../meeting/Meeting'
import Decode from '../decode/Decode'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="dashboard-layout">
      {/* ================= SIDEBAR ================= */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-top">
          {/* Meet AI Brand & AI Transcription Icon */}
          <div className="sidebar-brand">
            <div className="brand-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            <div className="brand-info">
              <span className="brand-title">Meet AI</span>
              <span className="brand-tagline">AI Transcription</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="sidebar-nav">
            <button
              type="button"
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeTab === 'meeting' ? 'active' : ''}`}
              onClick={() => setActiveTab('meeting')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <span>Meeting</span>
            </button>

            <button
              type="button"
              className={`nav-item ${activeTab === 'decode' ? 'active' : ''}`}
              onClick={() => setActiveTab('decode')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>QR & ArUco Decode</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom (Profile & Logout) */}
        <div className="sidebar-bottom">
          <div className="profile-card">
            <div className="profile-avatar">MA</div>
            <div className="profile-info">
              <span className="profile-name">MeetAI User</span>
              <span className="profile-email">user@meetai.com</span>
            </div>
          </div>

          <button type="button" className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* ================= RIGHT MAIN CONTENT ================= */}
      <main className="dashboard-main">
        {activeTab === 'dashboard' ? (
          <div>
            {/* Top Greeting & Quick Action */}
            <header className="main-header">
              <div className="header-title-group">
                <h1>Overview</h1>
                <p>Track your meetings, recordings, and AI-generated action items</p>
              </div>
              <div className="header-actions">
                <button
                  type="button"
                  className="btn-new-meeting"
                  onClick={() => setActiveTab('meeting')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>New Meeting</span>
                </button>
              </div>
            </header>

            {/* Stat Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-value">12</span>
                  <span className="stat-label">Total Meetings</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-value">34</span>
                  <span className="stat-label">Action Items</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-value">8.5 hrs</span>
                  <span className="stat-label">Audio Transcribed</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon pink">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="stat-info">
                  <span className="stat-value">18</span>
                  <span className="stat-label">Key Decisions</span>
                </div>
              </div>
            </div>

            {/* Recent Meetings Section */}
            <div className="dashboard-section">
              <div className="section-header">
                <h2 className="section-title">Recent Meetings</h2>
              </div>
              <div className="meeting-list">
                <div className="meeting-item">
                  <div className="meeting-left">
                    <div className="meeting-badge-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      </svg>
                    </div>
                    <div>
                      <div className="meeting-title">Product Roadmap & Sprint Planning</div>
                      <div className="meeting-date">Today at 10:30 AM • 45 mins</div>
                    </div>
                  </div>
                  <div className="meeting-right">
                    <span className="status-pill completed">Completed</span>
                    <button
                      type="button"
                      className="btn-view-meeting"
                      onClick={() => setActiveTab('meeting')}
                    >
                      View Details
                    </button>
                  </div>
                </div>

                <div className="meeting-item">
                  <div className="meeting-left">
                    <div className="meeting-badge-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      </svg>
                    </div>
                    <div>
                      <div className="meeting-title">Client Sync & Architecture Review</div>
                      <div className="meeting-date">Yesterday at 3:15 PM • 32 mins</div>
                    </div>
                  </div>
                  <div className="meeting-right">
                    <span className="status-pill completed">Completed</span>
                    <button
                      type="button"
                      className="btn-view-meeting"
                      onClick={() => setActiveTab('meeting')}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'decode' ? (
          <Decode />
        ) : (
          <Meeting />
        )}
      </main>
    </div>
  )
}
