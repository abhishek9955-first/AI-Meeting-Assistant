import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Dashboard.css'
import Meeting from '../meeting/Meeting'
import Decode from '../decode/Decode'

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedMeeting, setSelectedMeeting] = useState(null)
  const [openingMeetingId, setOpeningMeetingId] = useState(null)
  const [stats, setStats] = useState({
    total_meetings: 0,
    total_action_items: 0,
    total_decisions: 0,
    audio_hours: '0 hrs',
    recent_meetings: []
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const navigate = useNavigate()

  // Safely parse user from localStorage
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || { name: 'MeetAI User', email: 'user@meetai.com' }
    } catch {
      return { name: 'MeetAI User', email: 'user@meetai.com' }
    }
  })()

  // Fetch real MongoDB statistics on load or when switching back to dashboard tab
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true)
        const response = await fetch('http://localhost:8000/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (err) {
        console.error('Failed to load dashboard stats:', err)
      } finally {
        setLoadingStats(false)
      }
    }

    if (activeTab === 'dashboard') {
      fetchStats()
    }
  }, [activeTab])

  const handleOpenMeeting = async (meetingId) => {
    try {
      setOpeningMeetingId(meetingId)
      const response = await fetch(`http://localhost:8000/meetings/${meetingId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedMeeting(data)
        setActiveTab('meeting')
      } else {
        console.error('Failed to load meeting details from database:', response.statusText)
      }
    } catch (err) {
      console.error('Error loading meeting from database:', err)
    } finally {
      setOpeningMeetingId(null)
    }
  }

  const handleStartNewMeeting = () => {
    setSelectedMeeting(null)
    setActiveTab('meeting')
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('accesstoken')
    navigate('/login')
  }

  const userInitial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U'

  return (
    <div className="dashboard-layout">
      {/* ================= SIDEBAR ================= */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-top">
          {/* Brand Header */}
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
              <span className="brand-tagline">AI Meeting Assistant</span>
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
              onClick={handleStartNewMeeting}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <span>Meeting AI</span>
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
            <div className="profile-avatar">{userInitial}</div>
            <div className="profile-info">
              <span className="profile-name">{user?.name || 'MeetAI User'}</span>
              <span className="profile-email">{user?.email || 'user@meetai.com'}</span>
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
          <div className="dashboard-content-container">
            {/* Top Greeting & Action Header */}
            <header className="main-header">
              <div className="header-title-group">
                <h1>Welcome back, {user?.name ? user.name.split(' ')[0] : 'there'} 👋</h1>
                <p>Track your meetings, recordings, and AI-generated decisions and action items</p>
              </div>
              <div className="header-actions">
                <button
                  type="button"
                  className="btn-new-meeting"
                  onClick={handleStartNewMeeting}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>New Meeting</span>
                </button>
              </div>
            </header>

            {/* Statistics Cards Grid */}
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
                  <span className="stat-value">{loadingStats ? '—' : stats.total_meetings}</span>
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
                  <span className="stat-value">{loadingStats ? '—' : stats.total_action_items}</span>
                  <span className="stat-label">Action Items Extracted</span>
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
                  <span className="stat-value">{loadingStats ? '—' : stats.total_decisions}</span>
                  <span className="stat-label">Confirmed Decisions</span>
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
                  <span className="stat-value">{loadingStats ? '—' : stats.audio_hours}</span>
                  <span className="stat-label">Audio Processed</span>
                </div>
              </div>
            </div>

            {/* Recent Meetings Section */}
            <div className="dashboard-section">
              <div className="section-header">
                <div>
                  <h2 className="section-title">Recent Meetings</h2>
                  <p className="section-subtitle">Your transcribed recordings and AI summaries</p>
                </div>
              </div>

              {loadingStats ? (
                <div className="dashboard-loading-state">
                  <div className="loading-spinner" />
                  <span>Loading meetings from database...</span>
                </div>
              ) : stats.recent_meetings && stats.recent_meetings.length > 0 ? (
                <div className="meeting-list">
                  {stats.recent_meetings.map((meeting) => (
                    <div key={meeting.id} className="meeting-item">
                      <div className="meeting-left">
                        <div className="meeting-badge-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          </svg>
                        </div>
                        <div className="meeting-text-group">
                          <div className="meeting-title">{meeting.title}</div>
                          <div className="meeting-date">{meeting.date}</div>
                        </div>
                      </div>
                      <div className="meeting-right">
                        <div className="meeting-meta-pills">
                          {meeting.action_items_count > 0 && (
                            <span className="count-tag blue">{meeting.action_items_count} Tasks</span>
                          )}
                          {meeting.decisions_count > 0 && (
                            <span className="count-tag green">{meeting.decisions_count} Decisions</span>
                          )}
                        </div>
                        <span className="status-pill completed">Completed</span>
                        <button
                          type="button"
                          className="btn-view-meeting"
                          disabled={openingMeetingId === meeting.id}
                          onClick={() => handleOpenMeeting(meeting.id)}
                        >
                          {openingMeetingId === meeting.id ? 'Loading...' : 'Open Meeting'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  <div className="empty-icon-circle">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  </div>
                  <h3>No meetings documented yet</h3>
                  <p>Upload your first meeting recording to transcribe, refine, and generate AI minutes automatically.</p>
                  <button
                    type="button"
                    className="btn-start-first"
                    onClick={handleStartNewMeeting}
                  >
                    Start New Meeting
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'decode' ? (
          <Decode />
        ) : (
          <Meeting 
            initialMeeting={selectedMeeting} 
            onClearSelected={() => setSelectedMeeting(null)} 
          />
        )}
      </main>
    </div>
  )
}
