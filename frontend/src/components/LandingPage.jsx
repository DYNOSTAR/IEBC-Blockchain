import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Layout/Header';
import Footer from './Layout/Footer';
import '../styles/landing.css';
import '../styles/results.css';

const PARTY_COLORS = {
    UDA: '#006B3F', ODM: '#CE1126', Wiper: '#ca8a04',
    Roots: '#854d0e', ANC: '#2563eb', Jubilee: '#7c3aed',
};
const partyColor = (p) => PARTY_COLORS[p] || '#6b7280';

const LandingPage = () => {
    const navigate = useNavigate();
    const [liveResults, setLiveResults] = useState(null);

    const [electionLocked, setElectionLocked] = useState(false);

    useEffect(() => {
        fetch('http://localhost:5000/api/live-results')
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setLiveResults(d);
                    setElectionLocked(d.isLocked || false);
                }
            })
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

            {/* Live Results Section — Presidential only */}
            <section className="landing-results-section">
                <div className="container">
                    <div className="section-header">
                        <h2>🇰🇪 Presidential Race — Live Tally</h2>
                        <p>Real-time blockchain-verified vote counts</p>
                        <div className="ke-line" />
                    </div>

                    {(() => {
                        const presPos = liveResults?.positions?.find(p => p.level === 'national');
                        const total   = presPos?.candidates.reduce((s, c) => s + c.votes, 0) ?? 0;

                        return presPos ? (
                            <>
                                {/* Locked indicator */}
                                {electionLocked && (
                                    <div style={{
                                        background: '#fff3cd', border: '2px solid #CE1126',
                                        borderRadius: 10, padding: '10px 18px', marginBottom: 20,
                                        textAlign: 'center', color: '#6b1a23', fontWeight: 600,
                                        maxWidth: 640, margin: '0 auto 20px'
                                    }}>
                                        🔒 Voting is currently locked — results are read-only
                                    </div>
                                )}

                                {/* Vote count summary */}
                                <div className="stats-row" style={{ maxWidth: 500, margin: '0 auto 28px' }}>
                                    <div className="stat-card">
                                        <div className="stat-icon-r">🗳️</div>
                                        <div className="stat-num">{liveResults.totalVotes.toLocaleString()}</div>
                                        <div className="stat-label-r">Total Votes Cast</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon-r">⛓️</div>
                                        <div className="stat-num" style={{ fontSize: '1rem', color: '#006B3F' }}>Verified</div>
                                        <div className="stat-label-r">Blockchain</div>
                                    </div>
                                </div>

                                {/* Presidential candidates */}
                                <div style={{ maxWidth: 640, margin: '0 auto' }}>
                                    <div className="landing-pos-card">
                                        <div className="landing-pos-card-head" style={{
                                            background: 'linear-gradient(135deg, #003d24 0%, #006B3F 100%)'
                                        }}>
                                            <div className="landing-pos-name">President of Kenya</div>
                                            <div className="landing-pos-level">National Race · {total.toLocaleString()} votes</div>
                                        </div>
                                        <div className="landing-pos-body">
                                            {presPos.candidates.map((c, j) => {
                                                const pct = total > 0 ? Math.round((c.votes / total) * 1000) / 10 : 0;
                                                const lead = j === 0 && c.votes > 0;
                                                return (
                                                    <div key={j} className="landing-cand-row" style={{
                                                        marginBottom: 12,
                                                        background: lead ? '#e6f4ed' : '#f9f9f9',
                                                        borderRadius: 8,
                                                        padding: '8px 10px',
                                                        borderLeft: `3px solid ${lead ? '#006B3F' : '#e0e0e0'}`
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                                            {lead && <span style={{ fontSize: '0.85rem' }}>🏆</span>}
                                                            <span className="landing-cand-name" style={{ fontWeight: lead ? 700 : 600 }}>
                                                                {c.name}
                                                            </span>
                                                            <span className="party-chip" style={{
                                                                background: partyColor(c.party),
                                                                fontSize: '0.65rem', padding: '1px 7px', marginLeft: 'auto'
                                                            }}>
                                                                {c.party}
                                                            </span>
                                                            <span className="landing-cand-votes" style={{ minWidth: 50, textAlign: 'right', fontWeight: 700 }}>
                                                                {c.votes.toLocaleString()}
                                                            </span>
                                                            <span style={{ fontSize: '0.72rem', color: '#888', minWidth: 38, textAlign: 'right' }}>
                                                                {pct}%
                                                            </span>
                                                        </div>
                                                        <div style={{ background: '#e0e0e0', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                                                            <div style={{
                                                                width: `${pct}%`, height: '100%',
                                                                background: lead ? '#006B3F' : partyColor(c.party),
                                                                borderRadius: 4, transition: 'width 0.6s ease'
                                                            }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {total === 0 && (
                                                <div style={{ fontSize: '0.82rem', color: '#bbb', textAlign: 'center', padding: '16px 0' }}>
                                                    Voting in progress — counts will appear here
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="landing-results-footer">
                                    <button
                                        onClick={() => navigate('/results')}
                                        className="btn-primary-large"
                                        style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}
                                    >
                                        📊 View All Race Results →
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', color: '#aaa' }}>
                                <div style={{ fontSize: '2rem', marginBottom: 12 }}>⛓️</div>
                                <p>Election results will appear here once voting begins.</p>
                                <button
                                    onClick={() => navigate('/results')}
                                    className="btn-primary-large"
                                    style={{ marginTop: 16 }}
                                >
                                    📊 View Results Page
                                </button>
                            </div>
                        );
                    })()}
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