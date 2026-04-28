import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/voting-component.css';

const VotingComponent = ({ onComplete }) => {
    const [election, setElection] = useState(null);
    const [positions, setPositions] = useState([]);
    const [selectedVotes, setSelectedVotes] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [verificationCodes, setVerificationCodes] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        loadElectionData();
    }, []);

    const loadElectionData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Try to get active election from backend
            const response = await axios.get('http://localhost:5000/api/elections/active', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.hasActiveElection) {
                setElection(response.data.election);
                
                // Get positions for this election
                const positionsResponse = await axios.get(`http://localhost:5000/api/elections/${response.data.election.id}/positions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                if (positionsResponse.data.positions && positionsResponse.data.positions.length > 0) {
                    setPositions(positionsResponse.data.positions);
                } else {
                    // Use mock data if no positions in database
                    setPositions(getMockPositions());
                }
            } else {
                // Use mock data for testing
                setElection({
                    id: 1,
                    name: 'Kenya General Election 2027'
                });
                setPositions(getMockPositions());
            }
        } catch (error) {
            console.error('Error loading election data:', error);
            // Use mock data on error
            setElection({
                id: 1,
                name: 'Kenya General Election 2027'
            });
            setPositions(getMockPositions());
        } finally {
            setLoading(false);
        }
    };

    const getMockPositions = () => {
        return [
            {
                id: 1,
                title: "President of Kenya",
                description: "Vote for the next President of the Republic of Kenya",
                candidates: [
                    { id: 1, name: "William Ruto", party: "UDA", symbol: "🟢", description: "Current President seeking re-election" },
                    { id: 2, name: "Raila Odinga", party: "ODM", symbol: "🔴", description: "Veteran opposition leader" },
                    { id: 3, name: "Kalonzo Musyoka", party: "Wiper", symbol: "🟡", description: "Former Vice President" }
                ]
            },
            {
                id: 2,
                title: "County Governor",
                description: "Vote for your County Governor",
                candidates: [
                    { id: 4, name: "Johnson Sakaja", party: "UDA", symbol: "🏗️", description: "Current Nairobi Governor" },
                    { id: 5, name: "Timothy Wanyonyi", party: "ODM", symbol: "🤝", description: "Westlands MP" }
                ]
            },
            {
                id: 3,
                title: "Senator",
                description: "Vote for your County Senator",
                candidates: [
                    { id: 6, name: "Edwin Sifuna", party: "ODM", symbol: "📚", description: "Current Nairobi Senator" },
                    { id: 7, name: "Millicent Omanga", party: "UDA", symbol: "💪", description: "Former nominated Senator" }
                ]
            },
            {
                id: 4,
                title: "Member of Parliament",
                description: "Vote for your Constituency Member of Parliament",
                candidates: [
                    { id: 8, name: "John Doe", party: "UDA", symbol: "📋", description: "Current Area MP" },
                    { id: 9, name: "Jane Smith", party: "ODM", symbol: "🌹", description: "Community leader" }
                ]
            },
            {
                id: 5,
                title: "Women Representative",
                description: "Vote for your County Women Representative",
                candidates: [
                    { id: 10, name: "Esther Passaris", party: "ODM", symbol: "👩‍⚖️", description: "Current Women Rep" },
                    { id: 11, name: "Rachel Shebesh", party: "UDA", symbol: "🏛️", description: "Former CAS" }
                ]
            },
            {
                id: 6,
                title: "Member of County Assembly (MCA)",
                description: "Vote for your Ward MCA",
                candidates: [
                    { id: 12, name: "James Mwangi", party: "UDA", symbol: "🏘️", description: "Ward development advocate" },
                    { id: 13, name: "Lucy Wanjiku", party: "ODM", symbol: "🏥", description: "Healthcare worker" }
                ]
            }
        ];
    };

    const handleVoteSelect = (positionId, candidateId) => {
        setSelectedVotes(prev => ({
            ...prev,
            [positionId]: candidateId
        }));
        setError('');
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
            
            // Generate a simple transaction ID (not blockchain)
            const transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
            const verificationCode = 'V' + Math.random().toString(36).substring(2, 10).toUpperCase();
            
            // Save vote to backend
            const response = await axios.post('http://localhost:5000/api/elections/cast', {
                electionId: election.id,
                positionId: currentPosition.id,
                candidateId: selectedVotes[currentPosition.id],
                transactionHash: transactionId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const selectedCandidate = currentPosition.candidates.find(
                    c => c.id === selectedVotes[currentPosition.id]
                );
                
                setVerificationCodes(prev => [...prev, {
                    position: currentPosition.title,
                    code: response.data.verificationCode || verificationCode,
                    candidate: selectedCandidate?.name,
                    transactionId: transactionId
                }]);

                if (currentStep + 1 < positions.length) {
                    setCurrentStep(currentStep + 1);
                    setSubmitting(false);
                } else {
                    setSubmitted(true);
                    setSubmitting(false);
                    if (onComplete) {
                        onComplete(verificationCodes);
                    }
                }
            } else {
                throw new Error('Vote submission failed');
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
            setError(error.response?.data?.error || 'Failed to submit vote. Please try again.');
            setSubmitting(false);
        }
    };

    const currentPosition = positions[currentStep];
    const votedCount = Object.keys(selectedVotes).length;
    const progressPercentage = positions.length > 0 ? (votedCount / positions.length) * 100 : 0;

    if (loading) {
        return (
            <div className="voting-loading-state">
                <div className="spinner"></div>
                <p>Loading voting data...</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="voting-success-state">
                <div className="success-icon">✅</div>
                <h2>Voting Complete!</h2>
                <p>Thank you for casting your votes</p>
                <div className="verification-summary">
                    <h3>Your Verification Codes</h3>
                    {verificationCodes.map((item, index) => (
                        <div key={index} className="verification-item">
                            <strong>{item.position}:</strong> {item.code}
                        </div>
                    ))}
                </div>
                <button onClick={() => window.location.reload()} className="done-btn">
                    Done
                </button>
            </div>
        );
    }

    return (
        <div className="voting-component">
            <div className="voting-progress">
                <div className="progress-text">
                    <span>Voting Progress</span>
                    <span>{votedCount} of {positions.length} positions</span>
                </div>
                <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>

            <div className="voting-card">
                <div className="position-header">
                    <span className="position-counter">Position {currentStep + 1} of {positions.length}</span>
                    <h2>{currentPosition?.title}</h2>
                    <p>{currentPosition?.description}</p>
                </div>

                <div className="candidates-container">
                    {currentPosition?.candidates?.map((candidate) => (
                        <div
                            key={candidate.id}
                            className={`candidate-item ${selectedVotes[currentPosition.id] === candidate.id ? 'selected' : ''}`}
                            onClick={() => handleVoteSelect(currentPosition.id, candidate.id)}
                        >
                            <div className="candidate-symbol">{candidate.symbol || '🗳️'}</div>
                            <div className="candidate-details">
                                <div className="candidate-name">{candidate.name}</div>
                                <div className="candidate-party">{candidate.party}</div>
                                <div className="candidate-description">{candidate.description}</div>
                            </div>
                            <div className="candidate-check">
                                {selectedVotes[currentPosition.id] === candidate.id && <span>✓</span>}
                            </div>
                        </div>
                    ))}
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="voting-navigation">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="nav-prev"
                    >
                        ← Previous
                    </button>
                    {currentStep === positions.length - 1 ? (
                        <button
                            onClick={submitVote}
                            disabled={submitting || !selectedVotes[currentPosition?.id]}
                            className="nav-submit"
                        >
                            {submitting ? 'Submitting...' : 'Submit All Votes'}
                        </button>
                    ) : (
                        <button
                            onClick={nextStep}
                            disabled={!selectedVotes[currentPosition?.id]}
                            className="nav-next"
                        >
                            Next →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VotingComponent;