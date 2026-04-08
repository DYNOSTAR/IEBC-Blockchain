import React from 'react';
import '../../styles/footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="iebc-footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-section">
                        <h3>IEBC Contact</h3>
                        <ul>
                            <li>📞 Toll Free: 0800-111-111</li>
                            <li>📱 SMS: 22222</li>
                            <li>📧 Email: info@iebc.or.ke</li>
                            <li>📍 Anniversary Towers, Nairobi</li>
                        </ul>
                    </div>
                    
                    <div className="footer-section">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><a href="/">Home</a></li>
                            <li><a href="/verify">Verify Registration</a></li>
                            <li><a href="/results">Election Results</a></li>
                            <li><a href="/login">Voter Login</a></li>
                        </ul>
                    </div>
                    
                    <div className="footer-section">
                        <h3>Blockchain Info</h3>
                        <ul>
                            <li>🔗 Network: Ethereum</li>
                            <li>✅ Consensus: Proof of Stake</li>
                            <li>🛡️ Security: Smart Contracts</li>
                            <li>📊 Transparency: Public Ledger</li>
                        </ul>
                    </div>
                    
                    <div className="footer-section">
                        <h3>Support</h3>
                        <ul>
                            <li>📖 Voter Education</li>
                            <li>❓ FAQ</li>
                            <li>📞 Help Desk: 0700-123-456</li>
                            <li>💬 Live Chat</li>
                        </ul>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <div className="footer-copyright">
                        <p>&copy; {currentYear} Independent Electoral and Boundaries Commission - Kenya</p>
                        <p>All votes are recorded on the blockchain for transparency and security</p>
                    </div>
                    <div className="footer-social">
                        <a href="#" className="social-icon">📘</a>
                        <a href="#" className="social-icon">🐦</a>
                        <a href="#" className="social-icon">📸</a>
                        <a href="#" className="social-icon">▶️</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;