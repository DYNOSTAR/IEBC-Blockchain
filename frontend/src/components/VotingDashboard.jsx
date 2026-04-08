import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/main.css';
import '../styles/voting-dashboard.css';

const VotingDashboard = () => {
    const navigate = useNavigate();
    const [voter, setVoter] = useState(null);
    const [election, setElection] = useState(null);
    const [positions, setPositions] = useState([]);
    const [selectedVotes, setSelectedVotes] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [verificationCode, setVerificationCode] = useState(null);

    useEffect(() => {
        // Get voter data from localStorage
        const voterData = localStorage.getItem('voter');
        if (voterData) {
            setVoter(JSON.parse(voterData));
        }
        
        loadElectionData();
    }, []);

    const loadElectionData = async () => {
        try {
            // Mock election data for now (will connect to backend later)
            const mockElection = {
                id: 1,
                name: "Kenya General Election 2027",
                description: "Multi-level elections for President, Governors, Senators, MPs, MCAs, and Women Reps",
                startDate: "2027-08-09",
                endDate: "2027-08-09"
            };
            setElection(mockElection);

            // Mock positions and candidates for Kenya's multi-level elections
            const mockPositions = [
                {
                    id: 1,
                    title: "President of the Republic of Kenya",
                    description: "Vote for the next President of Kenya",
                    candidates: [
                        { id: 1, name: "William Ruto", party: "UDA", symbol: "🟢", description: "Current President seeking re-election" },
                        { id: 2, name: "Raila Odinga", party: "ODM", symbol: "🔴", description: "Veteran opposition leader" },
                        { id: 3, name: "Kalonzo Musyoka", party: "Wiper", symbol: "🟡", description: "Former Vice President" },
                        { id: 4, name: "George Wajackoyah", party: "Roots", symbol: "🌿", description: "Roots Party candidate" }
                    ]
                },
                {
                    id: 2,
                    title: "County Governor",
                    description: "Vote for your County Governor",
                    candidates: [
                        { id: 5, name: "Johnson Sakaja", party: "UDA", symbol: "🏗️", description: "Current Nairobi Governor" },
                        { id: 6, name: "Timothy Wanyonyi", party: "ODM", symbol: "🤝", description: "Westlands MP" },
                        { id: 7, name: "Esther Passaris", party: "ODM", symbol: "⭐", description: "Nairobi Women Rep" }
                    ]
                },
                {
                    id: 3,
                    title: "Senator",
                    description: "Vote for your County Senator",
                    candidates: [
                        { id: 8, name: "Edwin Sifuna", party: "ODM", symbol: "📚", description: "Current Nairobi Senator" },
                        { id: 9, name: "Millicent Omanga", party: "UDA", symbol: "💪", description: "Former nominated Senator" },
                        { id: 10, name: "Mike Sonko", party: "Independent", symbol: "🎤", description: "Former Nairobi Governor" }
                    ]
                },
                {
                    id: 4,
                    title: "Member of Parliament",
                    description: "Vote for your Constituency MP",
                    candidates: [
                        { id: 11, name: "John Doe", party: "UDA", symbol: "📋", description: "Current Area MP" },
                        { id: 12, name: "Jane Smith", party: "ODM", symbol: "🌹", description: "Community leader" },
                        { id: 13, name: "Peter Ochieng", party: "Wiper", symbol: "🏫", description: "Former teacher" }
                    ]
                },
                {
                    id: 5,
                    title: "Women Representative",
                    description: "Vote for your County Women Representative",
                    candidates: [
                        { id: 14, name: "Esther Passaris", party: "ODM", symbol: "👩‍⚖️", description: "Current Women Rep" },
                        { id: 15, name: "Rachel Shebesh", party: "UDA", symbol: "🏛️", description: "Former Chief Administrative Secretary" },
                        { id: 16, name: "Katherine Mwangi", party: "Independent", symbol: "📚", description: "Women's rights activist" }
                    ]
                },
                {
                    id: 6,
                    title: "Member of County Assembly (MCA)",
                    description: "Vote for your Ward MCA",
                    candidates: [
                        { id: 17, name: "James Mwangi", party: "UDA", symbol: "🏘️", description: "Ward development advocate" },
                        { id: 18, name: "Lucy Wanjiku", party: "ODM", symbol: "🏥", description: "Healthcare worker" },
                        { id: 19, name: "Bernard Otieno", party: "Wiper", symbol: "📖", description: "Youth leader" }
                    ]
                }
            ];
            setPositions(mockPositions);
        } catch (error) {
            console.error('Error loading election data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVoteSelect = (positionId, candidateId) => {
        setSelectedVotes(prev => ({
            ...prev,
            [positionId]: candidateId
        }));
    };

    const nextStep = () => {
        if (currentStep < positions.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const submitVotes = async () => {
        // Check if all positions have been voted
        if (Object.keys(selectedVotes).length !== positions.length) {
            alert(`Please vote for all ${positions.length} positions before submitting. You have voted for ${Object.keys(selectedVotes).length} positions.`);
            return;
        }

        setSubmitting(true);
        
        // Simulate blockchain transaction
        setTimeout(() => {
            const mockTxHash = '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const mockVerificationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
            
            setVerificationCode(mockVerificationCode);
            setSubmitted(true);
            setSubmitting(false);
            
            // Store votes in localStorage for demo
            localStorage.setItem('submittedVotes', JSON.stringify({
                votes: selectedVotes,
                timestamp: new Date().toISOString(),
                transactionHash: mockTxHash,
                verificationCode: mockVerificationCode
            }));
        }, 2000);
    };

    const currentPosition = positions[currentStep];
    const votedCount = Object.keys(selectedVotes).length;
    const progressPercentage = (votedCount / positions.length) * 100;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🗳️</div>
                    <div className="text-xl text-gray-600">Loading election data...</div>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8 text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold text-green-600 mb-4">Votes Successfully Cast!</h1>
                    <p className="text-gray-700 mb-4">
                        Your votes have been recorded on the blockchain. You can verify your vote using the verification code below.
                    </p>
                    <div className="bg-gray-100 p-4 rounded-lg mb-6">
                        <p className="text-sm text-gray-600">Your Verification Code</p>
                        <p className="text-2xl font-mono font-bold text-blue-600">{verificationCode}</p>
                        <p className="text-xs text-gray-500 mt-2">Keep this code safe to verify your vote</p>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate('/results')}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                        >
                            View Live Results
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition"
                        >
                            Return to Home
                        </button>
                    </div>
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
                        <div className="flex items-center space-x-3">
                            <div className="text-2xl">🗳️</div>
                            <div>
                                <h1 className="text-xl font-bold">IEBC Blockchain Voting System</h1>
                                <p className="text-xs text-blue-200">Secure • Transparent • Verifiable</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm">Welcome, {voter?.firstName || 'Voter'}</p>
                            <button 
                                onClick={() => {
                                    localStorage.clear();
                                    navigate('/');
                                }}
                                className="text-sm text-blue-200 hover:text-white"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-white shadow-md">
                <div className="container mx-auto px-6 py-4">
                    <div className="mb-2 flex justify-between text-sm">
                        <span>Voting Progress</span>
                        <span>{votedCount} of {positions.length} positions completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Voting Interface */}
            <div className="container mx-auto px-6 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
                            <h2 className="text-xl font-bold text-white">
                                {currentPosition?.title}
                            </h2>
                            <p className="text-blue-100 text-sm mt-1">
                                {currentPosition?.description}
                            </p>
                            <div className="text-white text-sm mt-2">
                                Position {currentStep + 1} of {positions.length}
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="space-y-4">
                                {currentPosition?.candidates.map((candidate) => (
                                    <div
                                        key={candidate.id}
                                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                            selectedVotes[currentPosition.id] === candidate.id
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-blue-300'
                                        }`}
                                        onClick={() => handleVoteSelect(currentPosition.id, candidate.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4">
                                                <div className="text-3xl">{candidate.symbol || '🗳️'}</div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{candidate.name}</h3>
                                                    <p className="text-gray-600 text-sm">{candidate.party}</p>
                                                    <p className="text-gray-500 text-xs mt-1">{candidate.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <div className={`w-5 h-5 rounded-full border-2 ${
                                                    selectedVotes[currentPosition.id] === candidate.id
                                                        ? 'border-green-500 bg-green-500'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {selectedVotes[currentPosition.id] === candidate.id && (
                                                        <div className="text-white text-xs text-center">✓</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-between">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className={`px-6 py-2 rounded-lg font-semibold ${
                                    currentStep === 0
                                        ? 'bg-gray-300 cursor-not-allowed'
                                        : 'bg-gray-600 text-white hover:bg-gray-700'
                                }`}
                            >
                                ← Previous
                            </button>
                            
                            {currentStep === positions.length - 1 ? (
                                <button
                                    onClick={submitVotes}
                                    disabled={submitting || votedCount !== positions.length}
                                    className={`px-6 py-2 rounded-lg font-semibold ${
                                        submitting || votedCount !== positions.length
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                                >
                                    {submitting ? 'Recording on Blockchain...' : 'Submit All Votes ✓'}
                                </button>
                            ) : (
                                <button
                                    onClick={nextStep}
                                    disabled={!selectedVotes[currentPosition?.id]}
                                    className={`px-6 py-2 rounded-lg font-semibold ${
                                        !selectedVotes[currentPosition?.id]
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                >
                                    Next →
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Your vote is encrypted and will be recorded on the blockchain ledger</p>
                        <p className="mt-1">You cannot change your vote once submitted</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VotingDashboard;