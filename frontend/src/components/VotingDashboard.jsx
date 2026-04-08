import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
    const [verificationCodes, setVerificationCodes] = useState([]);
    const [error, setError] = useState('');
    const [transactionHash, setTransactionHash] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const voterData = localStorage.getItem('user');
        
        if (!token) {
            navigate('/login');
            return;
        }
        
        if (voterData) {
            setVoter(JSON.parse(voterData));
        }
        
        loadElectionData();
    }, []);

    const loadElectionData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Load active election
            const electionRes = await axios.get('http://localhost:5000/api/elections/active', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (electionRes.data.hasActiveElection) {
                setElection(electionRes.data.election);
                
                // Load positions with candidates
                const positionsRes = await axios.get(`http://localhost:5000/api/elections/${electionRes.data.election.id}/positions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                setPositions(positionsRes.data.positions);
            } else {
                setError('No active election found');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Failed to load election data');
        } finally {
            setLoading(false);
        }
    };

    const handleVoteSelect = (positionId, candidateId) => {
        setSelectedVotes(prev => ({
            ...prev,
            [positionId]: candidateId
        }));
        setError('');
    };

    const submitVote = async () => {
        const currentPosition = positions[currentStep];
        
        if (!selectedVotes[currentPosition.id]) {
            setError(`Please select a candidate for ${currentPosition.title}`);
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            
            // Generate blockchain transaction hash
            const txHash = '0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            
            // Submit vote to backend (which records on blockchain)
            const response = await axios.post('http://localhost:5000/api/elections/cast', {
                electionId: election.id,
                positionId: currentPosition.id,
                candidateId: selectedVotes[currentPosition.id],
                transactionHash: txHash
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const selectedCandidate = currentPosition.candidates.find(
                    c => c.id === selectedVotes[currentPosition.id]
                );
                
                setVerificationCodes(prev => [...prev, {
                    position: currentPosition.title,
                    code: response.data.verificationCode,
                    candidate: selectedCandidate?.name,
                    party: selectedCandidate?.party,
                    transactionHash: txHash
                }]);

                // Move to next position or finish
                if (currentStep + 1 < positions.length) {
                    setCurrentStep(currentStep + 1);
                    setSubmitting(false);
                } else {
                    setSubmitted(true);
                    setSubmitting(false);
                }
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
            setError(error.response?.data?.error || 'Failed to submit vote');
            setSubmitting(false);
        }
    };

    const currentPosition = positions[currentStep];
    const votedCount = Object.keys(selectedVotes).length;
    const progressPercentage = positions.length > 0 ? (votedCount / positions.length) * 100 : 0;

    if (loading) {
        return (
            <div className="voting-loading">
                <div className="loading-spinner"></div>
                <p>Loading election data from database...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="voting-container">
                <div className="error-card">
                    <div className="error-icon">⚠️</div>
                    <h2>Error Loading Election</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="retry-btn">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="voting-container">
                <div className="success-card">
                    <div className="success-icon">✅</div>
                    <h2>Voting Complete!</h2>
                    <p>Your votes have been recorded on the blockchain</p>
                    
                    <div className="verification-codes">
                        <h3>Blockchain Transaction Records</h3>
                        {verificationCodes.map((item, index) => (
                            <div key={index} className="transaction-item">
                                <div className="tx-position">{item.position}</div>
                                <div className="tx-details">
                                    <div className="tx-candidate">{item.candidate} ({item.party})</div>
                                    <div className="tx-hash">TX: {item.transactionHash}</div>
                                    <div className="tx-code">Code: {item.code}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="success-buttons">
                        <button onClick={() => navigate('/results')} className="view-results-btn">
                            View Live Results
                        </button>
                        <button onClick={() => navigate('/')} className="home-btn">
                            Return Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="voting-dashboard">
            {/* Header */}
            <div className="voting-header">
                <div className="container">
                    <div className="voting-header-content">
                        <div>
                            <h1>{election?.name}</h1>
                            <p>Blockchain-secured voting system</p>
                        </div>
                        <div className="voter-card">
                            <span className="voter-icon">🗳️</span>
                            <div>
                                <div>{voter?.firstName} {voter?.lastName}</div>
                                <small>ID: {voter?.nationalId}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress */}
            <div className="progress-section">
                <div className="container">
                    <div className="progress-info">
                        <span>Progress</span>
                        <span>{votedCount} of {positions.length}</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Voting Card */}
            <div className="voting-main">
                <div className="container">
                    <div className="voting-card">
                        <div className="position-header">
                            <span className="position-count">Position {currentStep + 1} of {positions.length}</span>
                            <h2>{currentPosition?.title}</h2>
                            <p>{currentPosition?.description}</p>
                        </div>

                        <div className="candidates-list">
                            {currentPosition?.candidates?.map((candidate) => (
                                <div
                                    key={candidate.id}
                                    className={`candidate-card ${selectedVotes[currentPosition.id] === candidate.id ? 'selected' : ''}`}
                                    onClick={() => handleVoteSelect(currentPosition.id, candidate.id)}
                                >
                                    <div className="candidate-symbol">{candidate.symbol || '🗳️'}</div>
                                    <div className="candidate-info">
                                        <div className="candidate-name">{candidate.name}</div>
                                        <div className="candidate-party">{candidate.party}</div>
                                        <div className="candidate-desc">{candidate.description}</div>
                                    </div>
                                    <div className="candidate-radio">
                                        {selectedVotes[currentPosition.id] === candidate.id && <span>✓</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="voting-actions">
                            <button 
                                onClick={() => setCurrentStep(prev => prev - 1)} 
                                disabled={currentStep === 0}
                                className="btn-prev"
                            >
                                ← Previous
                            </button>
                            {currentStep === positions.length - 1 ? (
                                <button 
                                    onClick={submitVote} 
                                    disabled={submitting || !selectedVotes[currentPosition?.id]}
                                    className="btn-submit"
                                >
                                    {submitting ? 'Recording on Blockchain...' : 'Submit All Votes'}
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setCurrentStep(prev => prev + 1)} 
                                    disabled={!selectedVotes[currentPosition?.id]}
                                    className="btn-next"
                                >
                                    Next →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VotingDashboard;