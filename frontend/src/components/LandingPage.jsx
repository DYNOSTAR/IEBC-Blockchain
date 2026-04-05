import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();
    const [announcements, setAnnouncements] = useState([
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
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-blue-900 text-white shadow-lg">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="text-2xl">🗳️</div>
                            <div>
                                <h1 className="text-xl font-bold">IEBC Blockchain Voting System</h1>
                                <p className="text-xs text-blue-200">Secure • Transparent • Verifiable</p>
                            </div>
                        </div>
                        <div className="space-x-4">
                            <button 
                                onClick={() => navigate('/login')}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                            >
                                Voter Login
                            </button>
                            <button 
                                onClick={() => navigate('/admin/login')}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                            >
                                Admin Portal
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
                <div className="container mx-auto px-6 py-16">
                    <div className="max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            Kenya's First Blockchain-Powered Elections
                        </h1>
                        <p className="text-xl mb-6 text-blue-100">
                            Experience transparent, secure, and verifiable voting for the 2027 General Election.
                            Every vote recorded on an immutable blockchain ledger.
                        </p>
                        <div className="flex space-x-4">
                            <button 
                                onClick={() => navigate('/login')}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
                            >
                                Start Voting
                            </button>
                            <button 
                                onClick={() => navigate('/verify')}
                                className="px-6 py-3 bg-transparent border-2 border-white hover:bg-white hover:text-blue-900 rounded-lg font-semibold transition"
                            >
                                Verify Registration
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-3xl mb-2">👥</div>
                        <div className="text-2xl font-bold text-blue-900">{stats.registeredVoters}</div>
                        <div className="text-gray-600">Registered Voters</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-3xl mb-2">🏛️</div>
                        <div className="text-2xl font-bold text-blue-900">{stats.pollingStations}</div>
                        <div className="text-gray-600">Polling Stations</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-3xl mb-2">🗺️</div>
                        <div className="text-2xl font-bold text-blue-900">{stats.counties}</div>
                        <div className="text-gray-600">Counties</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-3xl mb-2">⛓️</div>
                        <div className="text-2xl font-bold text-blue-900">{stats.blockchainNodes}</div>
                        <div className="text-gray-600">Blockchain Nodes</div>
                    </div>
                </div>
            </div>

            {/* Announcements Section */}
            <div className="container mx-auto px-6 py-12">
                <h2 className="text-2xl font-bold mb-6">Official Announcements</h2>
                <div className="space-y-4">
                    {announcements.map(announcement => (
                        <div 
                            key={announcement.id} 
                            className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                                announcement.type === 'important' ? 'border-red-500' :
                                announcement.type === 'success' ? 'border-green-500' : 'border-blue-500'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold">{announcement.title}</h3>
                                <span className="text-sm text-gray-500">{announcement.date}</span>
                            </div>
                            <p className="text-gray-700">{announcement.content}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-gray-100 py-12">
                <div className="container mx-auto px-6">
                    <h2 className="text-2xl font-bold text-center mb-8">Why Blockchain Voting?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="text-4xl mb-3">🔒</div>
                            <h3 className="text-lg font-semibold mb-2">Tamper-Proof</h3>
                            <p className="text-gray-600">Votes cannot be altered or deleted once recorded on the blockchain</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-3">👁️</div>
                            <h3 className="text-lg font-semibold mb-2">Fully Transparent</h3>
                            <p className="text-gray-600">Anyone can verify the results without compromising voter privacy</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-3">✅</div>
                            <h3 className="text-lg font-semibold mb-2">Real-Time Verification</h3>
                            <p className="text-gray-600">Track and verify your vote from casting to final tally</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-800 text-white py-8">
                <div className="container mx-auto px-6">
                    <div className="text-center">
                        <p>&copy; 2026 Independent Electoral and Boundaries Commission - Kenya</p>
                        <p className="text-sm text-gray-400 mt-2">Blockchain Secured Elections | Transparency & Trust</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;