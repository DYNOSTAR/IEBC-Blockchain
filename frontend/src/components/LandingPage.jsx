import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();
    const [announcements] = useState([
        {
            id: 1,
            title: "🚨 2027 General Election Dates Announced",
            date: "March 15, 2026",
            content: "The Independent Electoral and Boundaries Commission announces that the 2027 General Election will be held on August 9, 2027. This will be Kenya's first blockchain-secured election.",
            type: "important"
        },
        {
            id: 2,
            title: "✅ Voter Registration Ongoing",
            date: "March 10, 2026",
            content: "Continuous voter registration is ongoing at all IEBC offices nationwide. Register to vote in the upcoming elections.",
            type: "info"
        },
        {
            id: 3,
            title: "🔗 Blockchain Voting System Launch",
            date: "February 28, 2026",
            content: "IEBC launches new blockchain-based voting system to enhance transparency and security. Citizens can verify their votes on the distributed ledger.",
            type: "success"
        },
        {
            id: 4,
            title: "📱 Mobile Verification Available",
            date: "February 20, 2026",
            content: "Voters can now verify their registration status via SMS by sending ID number to 22222.",
            type: "info"
        }
    ]);

    const [stats] = useState({
        registeredVoters: "22,456,789",
        pollingStations: "46,229",
        counties: "47",
        blockchainNodes: "157"
    });

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="text-3xl">🗳️</div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">IEBC Voting</h1>
                                <p className="text-xs text-gray-600">Blockchain Elections</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button 
                                onClick={() => navigate('/login')}
                                className="px-6 py-2 text-green-600 font-semibold hover:text-green-700 transition"
                            >
                                Voter Login
                            </button>
                            <button 
                                onClick={() => navigate('/admin/login')}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:shadow-lg transition transform hover:scale-105"
                            >
                                Admin Portal
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
                
                <div className="max-w-7xl mx-auto px-6 py-20 relative">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
                                🚀 Powered by Blockchain Technology
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                Kenya's Future of <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Secure Voting</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                Experience transparent, secure, and verifiable voting for the 2027 General Election. Every vote is recorded on an immutable blockchain ledger, ensuring complete transparency while protecting voter privacy.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:shadow-lg transition transform hover:scale-105"
                                >
                                    🗳️ Start Voting
                                </button>
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 border-2 border-blue-600 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition"
                                >
                                    ✅ Check Registration
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl">
                                <div className="text-6xl mb-4">🔒</div>
                                <h3 className="text-2xl font-bold mb-4">Secure & Transparent</h3>
                                <ul className="space-y-3">
                                    <li className="flex items-center space-x-2">
                                        <span className="text-2xl">⛓️</span>
                                        <span>Blockchain Verification</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <span className="text-2xl">🔐</span>
                                        <span>End-to-End Encryption</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <span className="text-2xl">👁️</span>
                                        <span>Real-Time Transparency</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <span className="text-2xl">✓</span>
                                        <span>Immutable Records</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Election Coverage</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="group bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-8 text-center hover:shadow-xl transition transform hover:scale-105">
                        <div className="text-5xl mb-3 group-hover:scale-125 transition">👥</div>
                        <div className="text-3xl font-bold text-blue-600 mb-2">{stats.registeredVoters}</div>
                        <div className="text-gray-700 font-semibold">Registered Voters</div>
                    </div>
                    <div className="group bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-8 text-center hover:shadow-xl transition transform hover:scale-105">
                        <div className="text-5xl mb-3 group-hover:scale-125 transition">🏛️</div>
                        <div className="text-3xl font-bold text-green-600 mb-2">{stats.pollingStations}</div>
                        <div className="text-gray-700 font-semibold">Polling Stations</div>
                    </div>
                    <div className="group bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-2xl p-8 text-center hover:shadow-xl transition transform hover:scale-105">
                        <div className="text-5xl mb-3 group-hover:scale-125 transition">🗺️</div>
                        <div className="text-3xl font-bold text-purple-600 mb-2">{stats.counties}</div>
                        <div className="text-gray-700 font-semibold">Counties</div>
                    </div>
                    <div className="group bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-8 text-center hover:shadow-xl transition transform hover:scale-105">
                        <div className="text-5xl mb-3 group-hover:scale-125 transition">⛓️</div>
                        <div className="text-3xl font-bold text-orange-600 mb-2">{stats.blockchainNodes}</div>
                        <div className="text-gray-700 font-semibold">Blockchain Nodes</div>
                    </div>
                </div>
            </div>

            {/* Announcements Section */}
            <div className="bg-gray-50 py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-12">Official Announcements</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {announcements.map(announcement => (
                            <div 
                                key={announcement.id} 
                                className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition p-6 border-l-4 transform hover:-translate-y-1 ${
                                    announcement.type === 'important' ? 'border-red-500 bg-gradient-to-br from-white to-red-50' :
                                    announcement.type === 'success' ? 'border-green-500 bg-gradient-to-br from-white to-green-50' : 'border-blue-500 bg-gradient-to-br from-white to-blue-50'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="text-lg font-bold text-gray-900 flex-1 pr-4">{announcement.title}</h3>
                                    <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">{announcement.date}</span>
                                </div>
                                <p className="text-gray-700 leading-relaxed">{announcement.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-gradient-to-br from-white via-blue-50 to-white py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Why Blockchain Voting?</h2>
                    <p className="text-center text-gray-600 text-lg mb-12 max-w-3xl mx-auto">
                        The blockchain technology ensures that every vote is secure, transparent, and verifiable without compromising voter privacy.
                    </p>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition text-center border border-blue-100">
                            <div className="text-6xl mb-4">🔒</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Tamper-Proof</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Votes cannot be altered, deleted, or modified once recorded on the immutable blockchain ledger
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition text-center border border-green-100">
                            <div className="text-6xl mb-4">👁️</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Fully Transparent</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Anyone can verify the results in real-time without compromising the privacy of individual voters
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition text-center border border-purple-100">
                            <div className="text-6xl mb-4">✅</div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">Real-Time Verification</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Track and verify your vote from the moment of casting through to final tally automatically
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-16">
                <div className="max-w-4xl mx-auto px-6 text-center text-white">
                    <h2 className="text-4xl font-bold mb-4">Ready to Vote?</h2>
                    <p className="text-xl mb-8 text-blue-100">
                        Participate in Kenya's first blockchain-secured election. Your voice matters.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:shadow-lg transition transform hover:scale-105"
                        >
                            🗳️ Vote Now
                        </button>
                        <button 
                            onClick={() => navigate('/admin/login')}
                            className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition"
                        >
                            Admin Dashboard
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h3 className="text-white font-bold mb-4 flex items-center space-x-2">
                                <span className="text-2xl">🗳️</span>
                                <span>IEBC Voting</span>
                            </h3>
                            <p className="text-sm">Secure, transparent, and verifiable voting for Kenya's future.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Quick Links</h4>
                            <ul className="space-y-2 text-sm">
                                <li><button onClick={() => navigate('/login')} className="hover:text-white transition bg-none border-none p-0 cursor-pointer text-left">Voter Login</button></li>
                                <li><button onClick={() => navigate('/admin/login')} className="hover:text-white transition bg-none border-none p-0 cursor-pointer text-left">Admin Portal</button></li>
                                <li><button onClick={() => navigate('/login')} className="hover:text-white transition bg-none border-none p-0 cursor-pointer text-left">Check Registration</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Information</h4>
                            <ul className="space-y-2 text-sm">
                                <li><span className="hover:text-white transition cursor-pointer">How It Works</span></li>
                                <li><span className="hover:text-white transition cursor-pointer">Security</span></li>
                                <li><span className="hover:text-white transition cursor-pointer">FAQ</span></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Contact</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="mailto:info@iebc.or.ke" className="hover:text-white transition">info@iebc.or.ke</a></li>
                                <li><a href="tel:+254711111111" className="hover:text-white transition">+254 711 111 111</a></li>
                                <li>Nairobi, Kenya</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-700 pt-8 text-center text-sm">
                        <p>&copy; 2026 Independent Electoral and Boundaries Commission - Kenya</p>
                        <p className="text-gray-500 mt-2">Blockchain Secured Elections | Transparency & Trust</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;