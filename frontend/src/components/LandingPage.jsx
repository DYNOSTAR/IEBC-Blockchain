import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Layout/Header';
import Footer from './Layout/Footer';
import '../styles/landing.css';
import '../styles/results.css';

const PARTY_COLORS = {
    UDA: '#16a34a', ODM: '#dc2626', Wiper: '#ca8a04',
    Roots: '#854d0e', ANC: '#2563eb', Ford: '#7c3aed',
};
const partyColor = (p) => PARTY_COLORS[p] || '#6b7280';

const LandingPage = () => {
    const navigate = useNavigate();
    const [liveResults, setLiveResults] = useState(null);

    useEffect(() => {
        fetch('http://localhost:5000/api/live-results')
            .then(r => r.json())
            .then(d => { if (d.success) setLiveResults(d); })
            .catch(() => {});
    }, []);

    const [announcements] = useState([
        {
            id: 1,
            title: "2027 General Election Dates Announced",
            date: "March 15, 2026",
            content: "The 2027 General Election will be held on August 9, 2027. This will be Kenya's first blockchain-secured election.",
            type: "info"
        },
        {
            id: 2,
            title: "Voter Registration Ongoing",
            date: "March 10, 2026",
            content: "Continuous voter registration is ongoing at all IEBC offices nationwide. Deadline: July 9, 2027.",
            type: "success"
        },
        {
            id: 3,
            title: "Blockchain Voting System Launch",
            date: "February 28, 2026",
            content: "IEBC launches new blockchain-based voting system to enhance transparency and security.",
            type: "info"
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
            <Header />
            
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-overlay"></div>
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="badge-icon">⛓️</span>
                            <span>Kenya's Blockchain Secured Elections</span>
                        </div>
                        <h1 className="hero-title">
                            Your Vote,
                            <br />
                            <span className="highlight">Your Future</span>
                        </h1>
                        <p className="hero-description">
                            Experience transparent, verifiable, and tamper-proof voting.
                            Every vote recorded on an immutable blockchain ledger.
                        </p>
                        <div className="hero-buttons">
                            <button onClick={() => navigate('/login')} className="btn-primary-large">
                                Voter Login
                            </button>
                            <button onClick={() => navigate('/register')} className="btn-register-large">
                                <span>📝</span> Register to Vote
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
                        {announcements.map((announcement) => (
                            <div key={announcement.id} className="announcement-card">
                                <div className="announcement-header">
                                    <span className="announcement-icon">📢</span>
                                    <span className="announcement-date">{announcement.date}</span>
                                </div>
                                <h3 className="announcement-title">{announcement.title}</h3>
                                <p className="announcement-content">{announcement.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Live Results Section */}
            <section className="landing-results-section">
                <div className="container">
                    <div className="section-header">
                        <h2>🗳️ Live Election Results</h2>
                        <p>Kenya General Election 2027 — Real-time blockchain-verified counts</p>
                        <div className="ke-line" />
                    </div>

                    {liveResults ? (
                        <>
                            <div className="stats-row" style={{ maxWidth: 600, margin: '0 auto 28px' }}>
                                <div className="stat-card">
                                    <div className="stat-icon-r">🗳️</div>
                                    <div className="stat-num">{liveResults.totalVotes.toLocaleString()}</div>
                                    <div className="stat-label-r">Votes Cast</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon-r">🏛️</div>
                                    <div className="stat-num">{liveResults.positions.length}</div>
                                    <div className="stat-label-r">Positions</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon-r">⛓️</div>
                                    <div className="stat-num" style={{ fontSize: '1rem' }}>Live</div>
                                    <div className="stat-label-r">Blockchain Verified</div>
                                </div>
                            </div>

                            <div className="landing-pos-grid">
                                {liveResults.positions.map((pos, i) => {
                                    const total = pos.candidates.reduce((s, c) => s + c.votes, 0);
                                    return (
                                        <div key={i} className="landing-pos-card">
                                            <div className="landing-pos-card-head">
                                                <div className="landing-pos-name">{pos.name}</div>
                                                <div className="landing-pos-level">{pos.level}</div>
                                            </div>
                                            <div className="landing-pos-body">
                                                {pos.candidates.map((c, j) => {
                                                    const pct = total > 0 ? Math.round((c.votes / total) * 1000) / 10 : 0;
                                                    return (
                                                        <div key={j} className="landing-cand-row">
                                                            {j === 0 && c.votes > 0 && <span style={{ fontSize: '0.85rem' }}>🏆</span>}
                                                            <span className="landing-cand-name">{c.name}</span>
                                                            <span className="party-chip" style={{ background: partyColor(c.party), fontSize: '0.65rem', padding: '1px 6px' }}>
                                                                {c.party}
                                                            </span>
                                                            <span className="landing-cand-votes">{c.votes.toLocaleString()}</span>
                                                        </div>
                                                    );
                                                })}
                                                {pos.candidates.every(c => c.votes === 0) && (
                                                    <div style={{ fontSize: '0.78rem', color: '#bbb', textAlign: 'center', padding: '8px 0' }}>
                                                        Voting not yet started
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="landing-results-footer">
                                <button onClick={() => navigate('/results')} className="btn-primary-large" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                                    📊 View Full Results →
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
                            <div style={{ fontSize: '2rem', marginBottom: 12 }}>⛓️</div>
                            <p>Election results will appear here once voting begins.</p>
                            <button onClick={() => navigate('/results')} className="btn-register-large" style={{ marginTop: 16 }}>
                                Check Results Page
                            </button>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section with Background Image */}
            <section className="cta-section">
                <div className="cta-bg-overlay"></div>
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Make Your Voice Heard?</h2>
                        <p>Join millions of Kenyans in shaping the future of our nation</p>
                        <div className="cta-buttons">
                            <button onClick={() => navigate('/register')} className="cta-btn-primary">
                                Register Now
                            </button>
                            <button onClick={() => navigate('/login')} className="cta-btn-secondary">
                                Login to Vote
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;