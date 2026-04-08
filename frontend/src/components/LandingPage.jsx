import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/main.css';
import '../styles/landing.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [announcements] = useState([
        {
            id: 1,
            title: "2027 General Election Dates Announced",
            date: "March 15, 2026",
            content: "The 2027 General Election will be held on August 9, 2027. This will be Kenya's first blockchain-secured election.",
            icon: "📢"
        },
        {
            id: 2,
            title: "Voter Registration Ongoing",
            date: "March 10, 2026",
            content: "Continuous voter registration is ongoing at all IEBC offices nationwide. Deadline: July 9, 2027.",
            icon: "✅"
        },
        {
            id: 3,
            title: "Blockchain Voting System Launch",
            date: "February 28, 2026",
            content: "IEBC launches new blockchain-based voting system to enhance transparency and security.",
            icon: "⛓️"
        }
    ]);

    const [stats] = useState([
        { icon: "👥", number: "22.5M+", label: "Registered Voters" },
        { icon: "🏛️", number: "46,229", label: "Polling Stations" },
        { icon: "🗺️", number: "47", label: "Counties" },
        { icon: "⛓️", number: "157", label: "Blockchain Nodes" }
    ]);

    return (
        <div className="landing-page">
            {/* Navigation Bar - IEBC Colors */}
            <nav className="iebc-nav">
                <div className="container">
                    <div className="nav-container">
                        <div className="logo" onClick={() => navigate('/')}>
                            <div className="logo-icon">🗳️</div>
                            <div className="logo-text">
                                <span className="logo-title">IEBC</span>
                                <span className="logo-subtitle">Kenya</span>
                            </div>
                        </div>
                        <div className="nav-links">
                            <button onClick={() => navigate('/')} className="nav-link active">Home</button>
                            <button onClick={() => navigate('/verify')} className="nav-link">Verify Status</button>
                            <button onClick={() => navigate('/results')} className="nav-link">Results</button>
                        </div>
                        <div className="nav-buttons">
                            <button onClick={() => navigate('/login')} className="btn-voter">
                                <span>🗳️</span> Voter Login
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="badge-icon">⛓️</span>
                            <span>Blockchain Secured Elections 2027</span>
                        </div>
                        <h1 className="hero-title">
                            Your Vote,
                            <br />
                            <span className="highlight">Your Future</span>
                        </h1>
                        <p className="hero-description">
                            Experience transparent, verifiable, and tamper-proof voting for the 2027 General Election.
                            Every vote recorded on an immutable blockchain ledger.
                        </p>
                        <div className="hero-buttons">
                            <button onClick={() => navigate('/login')} className="hero-btn-primary">
                                Start Voting
                            </button>
                            <button onClick={() => navigate('/verify')} className="hero-btn-secondary">
                                Verify Registration
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-card">
                                <div className="stat-icon">{stat.icon}</div>
                                <div className="stat-number">{stat.number}</div>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Announcements Section */}
            <section className="announcements-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Official Announcements</h2>
                        <div className="section-line"></div>
                    </div>
                    <div className="announcements-grid">
                        {announcements.map(announcement => (
                            <div key={announcement.id} className="announcement-card">
                                <div className="announcement-header">
                                    <div className="announcement-icon">{announcement.icon}</div>
                                    <span className="announcement-date">{announcement.date}</span>
                                </div>
                                <h3 className="announcement-title">{announcement.title}</h3>
                                <p className="announcement-content">{announcement.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Make Your Voice Heard?</h2>
                        <p>Join millions of Kenyans in shaping the future of our nation</p>
                        <div className="cta-buttons">
                            <button onClick={() => navigate('/login')} className="cta-btn-primary">
                                Vote Now
                            </button>
                            <button onClick={() => navigate('/verify')} className="cta-btn-secondary">
                                Check Registration
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="iebc-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h4>IEBC Contact</h4>
                            <p>📞 Toll Free: 0800-111-111</p>
                            <p>📧 info@iebc.or.ke</p>
                            <p>📍 Anniversary Towers, Nairobi</p>
                        </div>
                        <div className="footer-section">
                            <h4>Quick Links</h4>
                            <button onClick={() => navigate('/')}>Home</button>
                            <button onClick={() => navigate('/verify')}>Verify Status</button>
                            <button onClick={() => navigate('/results')}>Results</button>
                        </div>
                        <div className="footer-section">
                            <h4>Follow Us</h4>
                            <div className="social-links">
                                <a href="#" className="social-link">🐦 Twitter</a>
                                <a href="#" className="social-link">📘 Facebook</a>
                                <a href="#" className="social-link">📸 Instagram</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2027 Independent Electoral and Boundaries Commission - Kenya</p>
                        <p className="footer-tagline">Your Vote, Your Future</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;