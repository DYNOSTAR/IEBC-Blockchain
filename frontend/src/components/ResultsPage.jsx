import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/main.css';
import '../styles/results.css';

const ResultsPage = () => {
    const navigate = useNavigate();
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedCounty, setSelectedCounty] = useState('all');
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = () => {
        // Mock results data
        setTimeout(() => {
            const mockResults = {
                president: [
                    { candidate: "William Ruto", party: "UDA", votes: 4523456, percentage: 48.5, color: "green" },
                    { candidate: "Raila Odinga", party: "ODM", votes: 4432123, percentage: 47.2, color: "red" },
                    { candidate: "Kalonzo Musyoka", party: "Wiper", votes: 234567, percentage: 2.5, color: "yellow" },
                    { candidate: "George Wajackoyah", party: "Roots", votes: 123456, percentage: 1.8, color: "brown" }
                ],
                totalVotes: 9313602,
                turnout: 68.5,
                pollingStationsReported: 43289,
                totalPollingStations: 46229,
                lastBlockHash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"
            };
            setResults(mockResults);
            setLastUpdated(new Date().toLocaleString());
            setLoading(false);
        }, 1000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">⛓️</div>
                    <div className="text-xl text-gray-600">Loading blockchain results...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-blue-900 text-white shadow-lg">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="text-2xl">🗳️</div>
                            <div>
                                <h1 className="text-xl font-bold">IEBC Blockchain Voting System</h1>
                                <p className="text-xs text-blue-200">Live Election Results</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => navigate('/')}
                            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            Back to Home
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 py-8">
                {/* Blockchain Verification Banner */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="text-2xl">✅</div>
                            <div>
                                <p className="font-semibold text-green-800">Blockchain Verified Results</p>
                                <p className="text-sm text-green-600">Results are tamper-proof and auditable on the distributed ledger</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-600">Last Block Hash</p>
                            <p className="text-xs font-mono text-gray-500">{results.lastBlockHash.slice(0, 20)}...</p>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-3xl mb-2">🗳️</div>
                        <div className="text-2xl font-bold text-blue-900">{results.totalVotes.toLocaleString()}</div>
                        <div className="text-gray-600">Total Votes Cast</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-3xl mb-2">📊</div>
                        <div className="text-2xl font-bold text-blue-900">{results.turnout}%</div>
                        <div className="text-gray-600">Voter Turnout</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-3xl mb-2">🏛️</div>
                        <div className="text-2xl font-bold text-blue-900">{results.pollingStationsReported.toLocaleString()}</div>
                        <div className="text-gray-600">Polling Stations Reporting</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 text-center">
                        <div className="text-3xl mb-2">⛓️</div>
                        <div className="text-2xl font-bold text-blue-900">100%</div>
                        <div className="text-gray-600">Blockchain Integrity</div>
                    </div>
                </div>

                {/* Presidential Results */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
                        <h2 className="text-xl font-bold text-white">Presidential Election Results</h2>
                        <p className="text-blue-100 text-sm">Official results verified on the blockchain</p>
                    </div>
                    <div className="p-6">
                        {results.president.map((candidate, index) => (
                            <div key={index} className="mb-6">
                                <div className="flex justify-between mb-2">
                                    <div>
                                        <span className="font-semibold">{candidate.candidate}</span>
                                        <span className="text-gray-600 text-sm ml-2">({candidate.party})</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold">{candidate.votes.toLocaleString()}</span>
                                        <span className="text-gray-600 ml-2">({candidate.percentage}%)</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                    <div 
                                        className={`h-4 rounded-full transition-all duration-1000 bg-${candidate.color}-600`}
                                        style={{ 
                                            width: `${candidate.percentage}%`,
                                            backgroundColor: candidate.color === 'green' ? '#16a34a' :
                                                           candidate.color === 'red' ? '#dc2626' :
                                                           candidate.color === 'yellow' ? '#ca8a04' : '#854d0e'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Verification Section */}
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gray-800 px-6 py-4">
                        <h2 className="text-xl font-bold text-white">Verify Your Vote</h2>
                        <p className="text-gray-300 text-sm">Enter your verification code to confirm your vote was recorded correctly</p>
                    </div>
                    <div className="p-6">
                        <div className="flex space-x-4">
                            <input 
                                type="text" 
                                placeholder="Enter your verification code"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Verify Vote
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">
                            Each vote is recorded on the Ethereum blockchain with a unique transaction hash. 
                            Your verification code allows you to confirm your vote was counted without revealing your choice.
                        </p>
                    </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>Last updated: {lastUpdated} | Results are final and verifiable on the blockchain</p>
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;