import React from 'react';
import '../../styles/footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="kenyan-footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-section">
                        <h4>IEBC Contact</h4>
                        <ul>
                            <li>📞 Toll Free: 0800-111-111</li>
                            <li>📧 info@iebc.or.ke</li>
                            <li>📍 Anniversary Towers, Nairobi</li>
                        </ul>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Quick Links</h4>
                        <ul>
                            <li><a href="/">Home</a></li>
                            <li><a href="/verify">Verify Registration</a></li>
                            <li><a href="/results">Election Results</a></li>
                            <li><a href="/login">Voter Login</a></li>
                        </ul>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Blockchain Info</h4>
                        <ul>
                            <li>🔗 Network: Ethereum</li>
                            <li>✅ Consensus: Proof of Stake</li>
                            <li>🛡️ Security: Smart Contracts</li>
                            <li>📊 Transparency: Public Ledger</li>
                        </ul>
                    </div>
                    
                    <div className="footer-section">
                        <h4>Follow Us</h4>
                        <div className="social-links">
                            <a href="#" className="social-link">🐦 Twitter</a>
                            <a href="#" className="social-link">📘 Facebook</a>
                            <a href="#" className="social-link">📸 Instagram</a>
                            <a href="#" className="social-link">▶️ YouTube</a>
                        </div>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <p>&copy; {currentYear} Independent Electoral and Boundaries Commission - Kenya</p>
                    <p className="footer-tagline">Your Vote, Your Future</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;