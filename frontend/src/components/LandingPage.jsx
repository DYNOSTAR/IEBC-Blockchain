import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Layout/Header';
import Footer from './Layout/Footer';
import '../styles/main.css';
import '../styles/landing.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([
        {
            id: 1,
            title: "2027 General Election Dates Announced",
            date: "March 15, 2026",
            content: "The Independent Electoral and Boundaries Commission announces that the 2027 General Election will be held on August 9, 2027. This will be Kenya's first blockchain-secured election.",
            type: "important",
            icon: "📢"
        },
        {
            id: 2,
            title: "Voter Registration Ongoing",
            date: "March 10, 2026",
            content: "Continuous voter registration is ongoing at all IEBC offices nationwide. Register to vote in the upcoming elections. Deadline: July 9, 2027.",
            type: "info",
            icon: "✅"
        },
        {
            id: 3,
            title: "Blockchain Voting System Launch",
            date: "February 28, 2026",
            content: "IEBC launches new blockchain-based voting system to enhance transparency and security. Citizens can verify their votes on the distributed ledger in real-time.",
            type: "success",
            icon: "⛓️"
        },
        {
            id: 4,
            title: "Mobile Verification Available",
            date: "February 20, 2026",
            content: "Voters can now verify their registration status via SMS by sending ID number to 22222. Also available on our USSD code *384#.",
            type: "info",
            icon: "📱"
        }
    ]);

    const [stats, setStats] = useState([
        { icon: "👥", number: "22.5M+", label: "Registered Voters", color: "#667eea" },
        { icon: "🏛️", number: "46,229", label: "Polling Stations", color: "#48bb78" },
        { icon: "🗺️", number: "47", label: "Counties", color: "#f59e0b" },
        { icon: "⛓️", number: "157", label: "Blockchain Nodes", color: "#ef4444" }
    ]);

    const [features, setFeatures] = useState([
        {
            icon: "🔒",
            title: "Tamper-Proof Voting",
            description: "Once recorded on the blockchain, votes cannot be altered, deleted, or manipulated. Every vote is permanently secured.",
            color: "#667eea"
        },
        {
            icon: "👁️",
            title: "Full Transparency",
            description: "Anyone can verify election results in real-time without compromising voter privacy. Complete audit trail available.",
            color: "#48bb78"
        },
        {
            icon: "⚡",
            title: "Real-Time Results",
            description: "Results are updated instantly as votes are counted. No delays, no manual errors, complete accuracy.",
            color: "#f59e0b"
        },
        {
            icon: "🔐",
            title: "Voter Privacy",
            description: "Advanced encryption ensures your vote remains secret while still being verifiable on the blockchain.",
            color: "#ef4444"
        },
        {
            icon: "📱",
            title: "Mobile Access",
            description: "Vote from any device with our secure mobile platform. Accessible to all Kenyan citizens.",
            color: "#8b5cf6"
        },
        {
            icon: "✅",
            title: "Instant Verification",
            description: "Receive a unique verification code to confirm your vote was recorded correctly on the blockchain.",
            color: "#ec4899"
        }
    ]);

    const [counters, setCounters] = useState({
        registeredVoters: 0,
        pollingStations: 0,
        counties: 0,
        blockchainNodes: 0
    });

    // Animate counters on load
    useEffect(() => {
        const animateCounter = (target, field, duration = 2000) => {
            const steps = 60;
            const increment = target / steps;
            let current = 0;
            let step = 0;
            
            const interval = setInterval(() => {
                step++;
                current += increment;
                if (step >= steps) {
                    current = target;
                    clearInterval(interval);
                }
                setCounters(prev => ({ ...prev, [field]: Math.floor(current) }));
            }, duration / steps);
        };

        animateCounter(22500000, 'registeredVoters');
        animateCounter(46229, 'pollingStations');
        animateCounter(47, 'counties');
        animateCounter(157, 'blockchainNodes');
    }, []);

    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M+';
        }
        return num.toLocaleString();
    };

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
                            <span>Kenya's First Blockchain-Powered Elections</span>
                        </div>
                        <h1 className="hero-title">
                            Secure Your Vote,
                            <br />
                            <span className="gradient-text">Secure Your Future</span>
                        </h1>
                        <p className="hero-description">
                            Experience transparent, verifiable, and tamper-proof voting for the 2027 General Election.
                            Every vote recorded on an immutable blockchain ledger.
                        </p>
                        <div className="hero-buttons">
                            <button 
                                onClick={() => navigate('/login')}
                                className="hero-btn hero-btn-primary"
                            >
                                <span>🗳️</span>
                                Start Voting
                            </button>
                            <button 
                                onClick={() => navigate('/verify')}
                                className="hero-btn hero-btn-secondary"
                            >
                                <span>✅</span>
                                Verify Registration
                            </button>
                            <button 
                                onClick={() => navigate('/results')}
                                className="hero-btn hero-btn-outline"
                            >
                                <span>📊</span>
                                Live Results
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Floating Elements */}
                <div className="floating-elements">
                    <div className="floating-element element-1">⛓️</div>
                    <div className="floating-element element-2">🗳️</div>
                    <div className="floating-element element-3">🔒</div>
                    <div className="floating-element element-4">✅</div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="container">
                    <div className="stats-grid">
                        {stats.map((stat, index) => (
                            <div key={index} className="stat-card" style={{ borderBottomColor: stat.color }}>
                                <div className="stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
                                <div className="stat-number">
                                    {stat.number.includes('M') 
                                        ? formatNumber(counters.registeredVoters) 
                                        : stat.number === '46,229' 
                                            ? counters.pollingStations.toLocaleString() 
                                            : stat.number === '47' 
                                                ? counters.counties 
                                                : counters.blockchainNodes}
                                </div>
                                <div className="stat-label">{stat.label}</div>
                                <div className="stat-trend">
                                    <span className="trend-up">↑</span> 12% from 2022
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-badge">Why Blockchain?</div>
                        <h2 className="section-title">Revolutionizing Democracy in Kenya</h2>
                        <p className="section-subtitle">
                            Our blockchain voting system ensures every vote counts and every result can be trusted
                        </p>
                    </div>
                    
                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card" style={{ '--feature-color': feature.color }}>
                                <div className="feature-icon-wrapper">
                                    <div className="feature-icon" style={{ background: `${feature.color}20`, color: feature.color }}>
                                        {feature.icon}
                                    </div>
                                </div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                                <div className="feature-link">
                                    <span>Learn more</span>
                                    <span className="feature-arrow">→</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <div className="section-badge">Simple Process</div>
                        <h2 className="section-title">How Blockchain Voting Works</h2>
                        <p className="section-subtitle">
                            Four simple steps to cast your secure vote
                        </p>
                    </div>
                    
                    <div className="steps-container">
                        <div className="step">
                            <div className="step-number">1</div>
                            <div className="step-icon">🆔</div>
                            <h3>Verify Identity</h3>
                            <p>Login with your National ID and password to access the voting portal</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step">
                            <div className="step-number">2</div>
                            <div className="step-icon">🗳️</div>
                            <h3>Cast Your Vote</h3>
                            <p>Select your preferred candidates for all positions in the multi-level election</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step">
                            <div className="step-number">3</div>
                            <div className="step-icon">⛓️</div>
                            <h3>Blockchain Recording</h3>
                            <p>Your encrypted vote is recorded on the blockchain with a unique transaction hash</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step">
                            <div className="step-number">4</div>
                            <div className="step-icon">✅</div>
                            <h3>Verify & Track</h3>
                            <p>Use your verification code to confirm your vote on the blockchain ledger</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Announcements Section */}
            <section className="announcements-section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-badge">Latest Updates</div>
                        <h2 className="section-title">Official Announcements</h2>
                        <p className="section-subtitle">
                            Stay informed about the electoral process
                        </p>
                    </div>
                    
                    <div className="announcements-grid">
                        {announcements.map(announcement => (
                            <div key={announcement.id} className={`announcement-card announcement-${announcement.type}`}>
                                <div className="announcement-header">
                                    <div className="announcement-icon">{announcement.icon}</div>
                                    <div className="announcement-meta">
                                        <span className="announcement-date">{announcement.date}</span>
                                        <span className={`announcement-type type-${announcement.type}`}>
                                            {announcement.type === 'important' ? 'Important' : 
                                             announcement.type === 'success' ? 'Success' : 'Information'}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="announcement-title">{announcement.title}</h3>
                                <p className="announcement-content">{announcement.content}</p>
                                <div className="announcement-footer">
                                    <button className="read-more">Read more →</button>
                                </div>
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
                        <p>Join millions of Kenyans in shaping the future of our nation through secure blockchain voting</p>
                        <div className="cta-buttons">
                            <button onClick={() => navigate('/login')} className="cta-btn cta-btn-primary">
                                Vote Now
                            </button>
                            <button onClick={() => navigate('/verify')} className="cta-btn cta-btn-secondary">
                                Check Registration
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            <section className="partners-section">
                <div className="container">
                    <p className="partners-title">Trusted By</p>
                    <div className="partners-grid">
                        <div className="partner">IEBC</div>
                        <div className="partner">Government of Kenya</div>
                        <div className="partner">Ethereum Foundation</div>
                        <div className="partner">KICTANet</div>
                        <div className="partner">UNDP Kenya</div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;