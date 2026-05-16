import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { voteAPI, electionAPI } from '../../services/api';
import '../../styles/voting-booth.css';

// Position definitions — matches what was added to the contract via setupElection.js
const POSITION_ORDER = [
    { id: 1, name: 'President of Kenya',        level: 'national' },
    { id: 2, name: 'County Governor',           level: 'county' },
    { id: 3, name: 'Senator',                   level: 'county' },
    { id: 4, name: 'Member of Parliament',      level: 'constituency' },
    { id: 5, name: 'Women Representative',      level: 'county' },
    { id: 6, name: 'Member of County Assembly', level: 'ward' }
];

const VotingBooth = ({ voter }) => {
    const navigate = useNavigate();
    const [positions, setPositions] = useState([]);
    const [candidatesByPosition, setCandidatesByPosition] = useState({});
    const [selectedVotes, setSelectedVotes] = useState({});
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [verificationCodes, setVerificationCodes] = useState([]);
    const [error, setError] = useState('');
    const [electionId, setElectionId] = useState(null);

    const loadElectionData = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            // Load active election from backend DB
            const electionRes = await electionAPI.getActive();

            if (!electionRes.data.success || !electionRes.data.election) {
                setError('No active election found. Please check back later.');
                setLoading(false);
                return;
            }

            const election = electionRes.data.election;
            setElectionId(election.id);

            // Load positions + candidates from backend DB
            const positionsRes = await electionAPI.getPositions(election.id);

            if (!positionsRes.data.success || !positionsRes.data.positions?.length) {
                setError('No positions found for this election.');
                setLoading(false);
                return;
            }

            // Build candidates map keyed by blockchain position ID
            // Backend positions have display_order matching blockchain position IDs (1-6)
            const candidatesMap = {};
            const validPositions = [];

            for (const dbPosition of positionsRes.data.positions) {
                const blockchainPositionId = dbPosition.display_order; // 1–6
                const candidates = dbPosition.candidates || [];

                if (candidates.length > 0) {
                    candidatesMap[blockchainPositionId] = candidates.map(c => ({
                        id: c.id,
                        name: c.name,
                        party: c.party,
                        symbol: c.symbol || '🗳️',
                        description: c.description || '',
                        dbPositionId: dbPosition.id,
                        blockchainPositionId
                    }));

                    validPositions.push({
                        id: blockchainPositionId,
                        dbId: dbPosition.id,
                        name: dbPosition.title,
                        level: dbPosition.level,
                        description: dbPosition.description
                    });
                }
            }

            // Sort by blockchain position ID (1 = President first)
            validPositions.sort((a, b) => a.id - b.id);

            setCandidatesByPosition(candidatesMap);
            setPositions(validPositions);

        } catch (err) {
            console.error('Failed to load election data:', err);
            setError('Failed to load election data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadElectionData();
    }, [loadElectionData]);

    const handleVoteSelect = (positionId, candidateId) => {
        setSelectedVotes(prev => ({ ...prev, [positionId]: candidateId }));
        setError('');
    };

    const nextStep = () => {
        const currentPosition = positions[currentStep];
        if (!selectedVotes[currentPosition.id]) {
            setError(`Please select a candidate for ${currentPosition.name}`);
            return;
        }
        setError('');
        if (currentStep < positions.length - 1) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        setError('');
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const submitVote = async () => {
        const currentPosition = positions[currentStep];
        const selectedCandidateId = selectedVotes[currentPosition.id];

        if (!selectedCandidateId) {
            setError(`Please select a candidate for ${currentPosition.name}`);
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // Backend handles blockchain signing — no MetaMask needed
            const response = await voteAPI.cast(
                electionId,
                currentPosition.dbId,
                selectedCandidateId
            );

            if (response.data.success) {
                const selectedCandidate = candidatesByPosition[currentPosition.id]?.find(
                    c => c.id === selectedCandidateId
                );

                setVerificationCodes(prev => [...prev, {
                    position: currentPosition.name,
                    code: response.data.verificationCode,
                    candidate: selectedCandidate?.name,
                    party: selectedCandidate?.party,
                    transactionHash: response.data.transactionHash,
                    blockNumber: response.data.blockNumber,
                    simulated: response.data.simulated || false
                }]);

                if (currentStep + 1 < positions.length) {
                    setCurrentStep(currentStep + 1);
                } else {
                    setSubmitted(true);
                }
            } else {
                setError(response.data.error || 'Failed to cast vote.');
            }
        } catch (err) {
            console.error('Vote submission error:', err);
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
                <div className="spinner"></div>
                <p>Loading election data...</p>
            </div>
        );
    }

    // ── Error ──────────────────────────────────────────────────
    if (error && !positions.length) {
        return (
            <div className="voting-error">
                <div className="error-icon">⚠️</div>
                <h2>Unable to Load Election</h2>
                <p>{error}</p>
                <button onClick={loadElectionData} className="retry-btn">
                    Try Again
                </button>
            </div>
        );
    }

    // ── No candidates ──────────────────────────────────────────
    if (!positions.length) {
        return (
            <div className="voting-no-candidates">
                <div className="info-icon">ℹ️</div>
                <h2>No Candidates Available</h2>
                <p>Candidates have not been added to this election yet.</p>
                <button onClick={loadElectionData} className="retry-btn">
                    Refresh
                </button>
                <button
                    onClick={() => navigate('/voter/portal/profile')}
                    className="back-btn"
                    style={{ marginLeft: 12 }}
                >
                    Back to Profile
                </button>
            </div>
        );
    }

    // ── Success / Receipt ──────────────────────────────────────
    if (submitted) {
        return (
            <div className="voting-success">
                <div className="success-icon">✅</div>
                <h2>Votes Cast Successfully!</h2>
                <p>Your votes have been securely recorded on the blockchain.</p>

                <div className="verification-section">
                    <h3>Your Blockchain Receipt</h3>
                    <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                        Save these codes to verify your vote was counted.
                    </p>
                    {verificationCodes.map((item, index) => (
                        <div key={index} className="verification-item">
                            <div className="item-position">{item.position}</div>
                            <div className="item-details">
                                <div>
                                    <strong>Candidate:</strong> {item.candidate} ({item.party})
                                </div>
                                <div>
                                    <strong>Verification Code:</strong>{' '}
                                    <code>{item.code}</code>
                                </div>
                                <div>
                                    <strong>Transaction:</strong>{' '}
                                    <code>{item.transactionHash?.slice(0, 20)}...</code>
                                    {item.simulated && (
                                        <span style={{ marginLeft: 8, fontSize: 11, color: '#f59e0b' }}>
                                            (simulated — deploy contract to go live)
                                        </span>
                                    )}
                                </div>
                                {item.blockNumber && (
                                    <div><strong>Block:</strong> #{item.blockNumber}</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="success-buttons">
                    <button
                        onClick={() => navigate('/voter/portal/results')}
                        className="view-results-btn"
                    >
                        View Live Results
                    </button>
                    <button
                        onClick={() => navigate('/voter/portal/profile')}
                        className="home-btn"
                    >
                        Return to Profile
                    </button>
                </div>
            </div>
        );
    }

    // ── Main ballot ────────────────────────────────────────────
    return (
        <div className="voting-booth">

            <div className="voting-progress">
                <div className="progress-info">
                    <span>Voting Progress</span>
                    <span>{votedCount} of {positions.length} positions voted</span>
                </div>
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {positions.map((pos, i) => (
                        <span
                            key={pos.id}
                            style={{
                                width: 28, height: 28, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 12, fontWeight: 500,
                                background: i < votedCount
                                    ? '#48bb78'
                                    : i === currentStep
                                        ? '#667eea'
                                        : '#e2e8f0',
                                color: i <= currentStep ? 'white' : '#666'
                            }}
                        >
                            {i + 1}
                        </span>
                    ))}
                </div>
            </div>

            <div className="voting-card">
                <div className="position-header">
                    <span className="position-counter">
                        Position {currentStep + 1} of {positions.length}
                    </span>
                    <h2>{currentPosition?.name}</h2>
                    {currentPosition?.description && (
                        <p>{currentPosition.description}</p>
                    )}
                </div>

                <div className="candidates-list">
                    {candidatesByPosition[currentPosition?.id]?.map((candidate) => (
                        <div
                            key={candidate.id}
                            className={`candidate-card ${
                                selectedVotes[currentPosition.id] === candidate.id
                                    ? 'selected'
                                    : ''
                            }`}
                            onClick={() => handleVoteSelect(currentPosition.id, candidate.id)}
                        >
                            <div className="candidate-symbol">
                                {candidate.symbol || '🗳️'}
                            </div>
                            <div className="candidate-info">
                                <div className="candidate-name">{candidate.name}</div>
                                <div className="candidate-party">{candidate.party}</div>
                                {candidate.description && (
                                    <div className="candidate-desc"
                                        style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                        {candidate.description}
                                    </div>
                                )}
                            </div>
                            <div className="candidate-check">
                                {selectedVotes[currentPosition.id] === candidate.id && (
                                    <span>✓</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="voting-actions">
                    <button
                        onClick={prevStep}
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
                            {submitting
                                ? '⏳ Recording on Blockchain...'
                                : '✓ Submit All Votes'}
                        </button>
                    ) : (
                        <button
                            onClick={nextStep}
                            disabled={!selectedVotes[currentPosition?.id]}
                            className="btn-next"
                        >
                            Next →
                        </button>
                    )}
                </div>
            </div>

            <div className="voting-footer-note">
                <p>🔒 Your vote is recorded on the blockchain and cannot be altered</p>
                <p>✅ You cannot change your vote once submitted per position</p>
            </div>
        </div>
    );
};

export default VotingBooth;