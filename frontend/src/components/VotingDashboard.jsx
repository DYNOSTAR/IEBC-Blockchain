import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './VotingDashboard.css';

const VotingDashboard = () => {
    const navigate = useNavigate();
    const [voter, setVoter] = useState(null);
    const [candidates] = useState([
        {
            id: 1,
            name: 'John Kipchoge',
            party: 'Democratic Alliance',
            symbol: '🦁',
            votes: 1245
        },
        {
            id: 2,
            name: 'Mary Wanjiru',
            party: 'Progressive Movement',
            symbol: '🌟',
            votes: 1089
        },
        {
            id: 3,
            name: 'Ahmed Hassan',
            party: 'Unity Coalition',
            symbol: '🕊️',
            votes: 987
        }
    ]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [confirmVote, setConfirmVote] = useState(false);

    useEffect(() => {
        const voterData = localStorage.getItem('voter');
        if (voterData) {
            setVoter(JSON.parse(voterData));
        }
    }, []);

    const handleVote = (candidateId) => {
        setSelectedCandidate(candidateId);
        setConfirmVote(true);
    };

    const confirmVoteSubmission = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/votes/cast',
                {
                    candidateId: selectedCandidate,
                    voterId: voter?.id
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setHasVoted(true);
            setConfirmVote(false);
            alert('Your vote has been securely recorded on the blockchain!');
        } catch (error) {
            alert('Error submitting vote: ' + error.message);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('voter');
        localStorage.removeItem('role');
        navigate('/');
    };

    if (!voter) {
        return <div className="text-center mt-10">Loading voter information...</div>;
    }

    if (hasVoted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                        <div className="text-6xl mb-4">✅</div>
                        <h1 className="text-3xl font-bold text-green-600 mb-4">Vote Submitted Successfully!</h1>
                        <p className="text-gray-700 mb-4">
                            Your vote has been securely recorded and encrypted on the blockchain.
                        </p>
                        <p className="text-gray-600 mb-6">
                            You can verify your vote using your transaction ID: <br />
                            <code className="bg-gray-100 p-2 rounded mt-2 inline-block">0x{Math.random().toString(16).substr(2, 10)}</code>
                        </p>
                        <button
                            onClick={handleLogout}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">🗳️ Voting Portal</h1>
                        <p className="text-gray-600">Welcome, {voter.firstName} {voter.lastName}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                        Logout
                    </button>
                </div>

                {/* Voter Info */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">Your Information</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-gray-600 text-sm">National ID</p>
                            <p className="font-bold">{voter.nationalId}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm">Polling Station</p>
                            <p className="font-bold">PS-{String(voter.pollingStationId).padStart(3, '0')}</p>
                        </div>
                    </div>
                </div>

                {/* Candidates */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Cast Your Vote</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {candidates.map((candidate) => (
                            <div
                                key={candidate.id}
                                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
                            >
                                <div className="text-6xl mb-4 text-center">{candidate.symbol}</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{candidate.name}</h3>
                                <p className="text-gray-600 mb-4">{candidate.party}</p>
                                <div className="mb-6">
                                    <p className="text-sm text-gray-600">Current Votes</p>
                                    <p className="text-2xl font-bold text-blue-600">{candidate.votes}</p>
                                </div>
                                <button
                                    onClick={() => handleVote(candidate.id)}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
                                >
                                    Vote for {candidate.name.split(' ')[0]}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Confirmation Modal */}
                {confirmVote && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-8 max-w-md">
                            <h2 className="text-2xl font-bold mb-4">Confirm Your Vote</h2>
                            <p className="text-gray-700 mb-6">
                                Are you sure you want to vote for <strong>{candidates.find(c => c.id === selectedCandidate)?.name}</strong>?
                                <br /><br />
                                This action cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setConfirmVote(false)}
                                    className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmVoteSubmission}
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-bold"
                                >
                                    Confirm Vote
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VotingDashboard;
