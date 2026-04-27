import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { electionAPI, voteAPI } from '../services/api';
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

    useEffect(() => {
        const token = localStorage.getItem('token');
        const voterData = localStorage.getItem('user');

        if (!token) {
            navigate('/login');
            return;
        }

        if (voterData) {
            try { setVoter(JSON.parse(voterData)); } catch {}
        }

        loadElectionData();
    }, []);

    const loadElectionData = async () => {
        try {
            setError('');
            const electionRes = await electionAPI.getActive();

            if (!electionRes.data.success || !electionRes.data.election) {
                setError('No active election found. Please check back later.');
                setLoading(false);
                return;
            }

            const activeElection = electionRes.data.election;
            setElection(activeElection);

            const positionsRes = await electionAPI.getPositions(activeElection.id);

            if (!positionsRes.data.success || !positionsRes.data.positions?.length) {
                setError('No positions found for this election.');
                setLoading(false);
                return;
            }

            setPositions(positionsRes.data.positions);
        } catch (err) {
            console.error('Error loading election data:', err);
            setError('Failed to load election data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVoteSelect = (positionId, candidateId) => {
        setSelectedVotes(prev => ({ ...prev, [positionId]: candidateId }));
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
            // Backend handles blockchain signing — no fake tx hash from frontend
            const response = await voteAPI.cast(
                election.id,
                currentPosition.id,
                selectedVotes[currentPosition.id]
            );

            if (response.data.success) {
                const selectedCandidate = currentPosition.candidates.find(
                    c => c.id === selectedVotes[currentPosition.id]
                );

                setVerificationCodes(prev => [...prev, {
                    position: currentPosition.title,
                    code: response.data.verificationCode,
                    candidate: selectedCandidate?.name,
                    party: selectedCandidate?.party,
                    transactionHash: response.data.transactionHash,
                    blockNumber: response.data.blockNumber,
                    simulated: response.data.simulated || false
                }]);

                if (currentStep + 1 < positions.length) {
                    setCurrentStep(prev => prev + 1);
                } else {
                    setSubmitted(true);
                }
            }
        } catch (err) {
            console.error('Error submitting vote:', err);
            setError(err.response?.data?.error || 'Failed to submit vote. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const currentPosition = positions[currentStep];
    const votedCount = verificationCodes.length;
    const progressPercentage = positions.length > 0
        ? (votedCount / positions.length) * 100
        : 0;

    // ── Loading ────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="voting-loading">
                <div className="loading-spinner"></div>
                <p>Loading election data...</p>
            </div>
        );
    }

    // ── Error ──────────────────────────────────────────────────
    if (error && !election) {
        return (
            <div className="voting-container">
                <div className="error-card">
                    <div className="error-icon">⚠️</div>
                    <h2>Unable to Load Election</h2>
                    <p>{error}</p>
                    <button onClick={loadElectionData} className="retry-btn">
                        Retry
                    </button>
                    <button onClick={() => navigate('/')} className="home-btn" style={{ marginLeft: 12 }}>
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    // ── Success / Receipt ──────────────────────────────────────
    if (submitted) {
        return (
            <div className="voting-container">
                <div className="success-card">
                    <div className="success-icon">✅</div>
                    <h2>Voting Complete!</h2>
                    <p>Your votes have been securely recorded on the blockchain.</p>

                    <div className="verification-codes">
                        <h3>Your Blockchain Receipt</h3>
                        <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                            Save these codes — you can use them to verify your vote was counted.
                        </p>
                        {verificationCodes.map((item, index) => (
                            <div key={index} className="transaction-item">
                                <div className="tx-position">{item.position}</div>
                                <div className="tx-details">
                                    <div className="tx-candidate">
                                        {item.candidate} — {item.party}
                                    </div>
                                    <div className="tx-code">
                                        Verification code: <strong>{item.code}</strong>
                                    </div>
                                    <div className="tx-hash">
                                        TX: {item.transactionHash}
                                        {item.simulated && (
                                            <span style={{ marginLeft: 8, fontSize: 11, color: '#f59e0b' }}>
                                                (simulated — deploy contract to go live)
                                            </span>
                                        )}
                                    </div>
                                    {item.blockNumber && (
                                        <div className="tx-block">Block: #{item.blockNumber}</div>
                                    )}
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

    // ── Main ballot ────────────────────────────────────────────
    return (
        <div className="voting-dashboard">
            <div className="voting-header">
                <div className="container">
                    <div className="voting-header-content">
                        <div>
                            <h1>{election?.name}</h1>
                            <p>Blockchain-secured voting system</p>
                        </div>
                        {voter && (
                            <div className="voter-card">
                                <span className="voter-icon">🗳️</span>
                                <div>
                                    <div>{voter.firstName} {voter.lastName}</div>
                                    <small>ID: {voter.nationalId}</small>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="progress-section">
                <div className="container">
                    <div className="progress-info">
                        <span>Progress</span>
                        <span>{votedCount} of {positions.length} positions voted</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <div className="position-pills">
                        {positions.map((pos, i) => (
                            <span
                                key={pos.id}
                                className={`position-pill ${i < votedCount ? 'done' : i === currentStep ? 'active' : ''}`}
                            >
                                {i + 1}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="voting-main">
                <div className="container">
                    <div className="voting-card">
                        <div className="position-header">
                            <span className="position-count">
                                Position {currentStep + 1} of {positions.length}
                            </span>
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
                                        {candidate.description && (
                                            <div className="candidate-desc">{candidate.description}</div>
                                        )}
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

                            {currentStep < positions.length - 1 ? (
                                <button
                                    onClick={() => {
                                        if (!selectedVotes[currentPosition?.id]) {
                                            setError(`Please select a candidate for ${currentPosition.title}`);
                                            return;
                                        }
                                        setError('');
                                        setCurrentStep(prev => prev + 1);
                                    }}
                                    className="btn-next"
                                >
                                    Next →
                                </button>
                            ) : (
                                <button
                                    onClick={submitVote}
                                    disabled={submitting || !selectedVotes[currentPosition?.id]}
                                    className="btn-submit"
                                >
                                    {submitting ? 'Recording on Blockchain...' : 'Submit All Votes'}
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