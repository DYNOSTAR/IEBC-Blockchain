import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { voteAPI, electionAPI } from '../../services/api';
import '../../styles/voting-booth.css';

const VotingBooth = ({ voter }) => {
    const navigate = useNavigate();
    const [positions, setPositions]               = useState([]);
    const [candidatesByPosition, setCandidatesByPosition] = useState({});
    const [selectedVotes, setSelectedVotes]       = useState({});
    const [currentStep, setCurrentStep]           = useState(0);
    const [loading, setLoading]                   = useState(true);
    const [casting, setCasting]                   = useState(false);
    const [allVoted, setAllVoted]                 = useState(false);
    const [votedPositions, setVotedPositions]     = useState({});
    const [error, setError]                       = useState('');
    const [electionId, setElectionId]             = useState(null);
    const [electionLocked, setElectionLocked]     = useState(false);
    const [electionName, setElectionName]         = useState('');

    const loadAll = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const electionRes = await electionAPI.getActive();
            if (!electionRes.data.success || !electionRes.data.election) {
                setError('No active election found. Please check back later.');
                setLoading(false);
                return;
            }
            const election = electionRes.data.election;
            setElectionId(election.id);
            setElectionName(election.name || '');
            if (election.is_locked) {
                setElectionLocked(true);
                setLoading(false);
                return;
            }

            const [positionsRes, myVotesRes] = await Promise.all([
                electionAPI.getPositions(election.id, {
                    countyId:       voter?.countyId,
                    constituencyId: voter?.constituencyId,
                    wardId:         voter?.wardId
                }),
                voteAPI.getMyVotes()
            ]);

            if (!positionsRes.data.success || !positionsRes.data.positions?.length) {
                setError('No positions found for this election.');
                setLoading(false);
                return;
            }

            // Build existing votes map keyed by dbPositionId
            const existingVotes = {};
            if (myVotesRes.data.success) {
                for (const v of myVotesRes.data.votes) {
                    existingVotes[v.positionId] = {
                        candidateName:    v.candidateName,
                        party:            v.party,
                        positionName:     v.positionName,
                        verificationCode: v.verificationCode,
                        transactionHash:  v.transactionHash,
                        votedAt:          v.votedAt
                    };
                }
            }

            // Build candidates map keyed by blockchainPositionId
            const candidatesMap = {};
            const validPositions = [];

            for (const dbPosition of positionsRes.data.positions) {
                const blockchainPositionId = dbPosition.display_order;
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
                        id:          blockchainPositionId,
                        dbId:        dbPosition.id,
                        name:        dbPosition.title,
                        level:       dbPosition.level,
                        description: dbPosition.description
                    });
                }
            }
            validPositions.sort((a, b) => a.id - b.id);

            setCandidatesByPosition(candidatesMap);
            setPositions(validPositions);
            setVotedPositions(existingVotes);

            if (validPositions.length > 0 && validPositions.every(p => existingVotes[p.dbId])) {
                setAllVoted(true);
            } else {
                const firstUnvoted = validPositions.findIndex(p => !existingVotes[p.dbId]);
                setCurrentStep(firstUnvoted >= 0 ? firstUnvoted : 0);
            }
        } catch (err) {
            console.error('Failed to load election data:', err);
            setError('Failed to load election data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    const handleVoteSelect = (positionId, candidateId) => {
        setSelectedVotes(prev => ({ ...prev, [positionId]: candidateId }));
        setError('');
    };

    const castCurrentVote = async () => {
        const pos = positions[currentStep];
        const candidateId = selectedVotes[pos.id];
        if (!candidateId) {
            setError(`Please select a candidate for ${pos.name}`);
            return;
        }
        setCasting(true);
        setError('');
        try {
            const response = await voteAPI.cast(electionId, pos.dbId, candidateId);
            if (!response.data.success) {
                setError(response.data.error || 'Vote failed. Please try again.');
                setCasting(false);
                return;
            }
            const candidate = candidatesByPosition[pos.id]?.find(c => c.id === candidateId);
            const newVoted = {
                ...votedPositions,
                [pos.dbId]: {
                    candidateName:    candidate?.name,
                    party:            candidate?.party,
                    positionName:     pos.name,
                    verificationCode: response.data.verificationCode,
                    transactionHash:  response.data.transactionHash,
                    blockNumber:      response.data.blockNumber,
                    simulated:        response.data.simulated || false
                }
            };
            setVotedPositions(newVoted);

            if (positions.every(p => newVoted[p.dbId])) {
                setAllVoted(true);
                return;
            }

            // Advance to next unvoted position
            const nextUnvoted = positions.findIndex((p, i) => i > currentStep && !newVoted[p.dbId]);
            if (nextUnvoted >= 0) {
                setCurrentStep(nextUnvoted);
            } else {
                const firstUnvoted = positions.findIndex(p => !newVoted[p.dbId]);
                if (firstUnvoted >= 0) setCurrentStep(firstUnvoted);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to cast vote. Please try again.');
        } finally {
            setCasting(false);
        }
    };

    const currentPosition = positions[currentStep];
    const totalVoted      = positions.filter(p => votedPositions[p.dbId]).length;
    const progressPct     = positions.length > 0 ? (totalVoted / positions.length) * 100 : 0;
    const alreadyVotedHere = currentPosition && !!votedPositions[currentPosition.dbId];

    // ── Locked ───────────────────────────────────────────────
    if (electionLocked) {
        return (
            <div className="voting-error" style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
                <h2 style={{ color: '#CE1126', marginBottom: 8 }}>Voting Temporarily Locked</h2>
                {electionName && (
                    <p style={{ fontWeight: 600, color: '#333', marginBottom: 8 }}>{electionName}</p>
                )}
                <p style={{ color: '#666', marginBottom: 24, lineHeight: 1.6 }}>
                    The election administrator has temporarily suspended voting.
                    Please check back shortly or contact your polling officer.
                </p>
                <button onClick={loadAll} className="retry-btn">Check Again</button>
                <button onClick={() => navigate('/portal/profile')} className="back-btn" style={{ marginLeft: 12 }}>
                    Back to Profile
                </button>
            </div>
        );
    }

    // ── Loading ───────────────────────────────────────────────
    if (loading) {
        return (
            <div className="voting-loading">
                <div className="spinner"></div>
                <p>Loading election data...</p>
            </div>
        );
    }

    if (error && !positions.length) {
        return (
            <div className="voting-error">
                <div style={{ fontSize: '2rem' }}>⚠️</div>
                <h2>Unable to Load Election</h2>
                <p>{error}</p>
                <button onClick={loadAll} className="retry-btn">Try Again</button>
            </div>
        );
    }

    if (!positions.length) {
        return (
            <div className="voting-no-candidates">
                <div style={{ fontSize: '2rem' }}>ℹ️</div>
                <h2>No Candidates Available</h2>
                <p>Candidates have not been added to this election yet.</p>
                <button onClick={loadAll} className="retry-btn">Refresh</button>
                <button onClick={() => navigate('/portal/profile')} className="back-btn" style={{ marginLeft: 12 }}>
                    Back to Profile
                </button>
            </div>
        );
    }

    // ── Receipt (all positions voted) ─────────────────────────
    if (allVoted) {
        return (
            <div className="voting-success">
                <div style={{ fontSize: '3rem' }}>✅</div>
                <h2>You Have Voted!</h2>
                <p>All your votes have been securely recorded on the blockchain.</p>

                <div className="verification-section">
                    <h3>Your Blockchain Receipt</h3>
                    <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
                        Save these codes to verify your votes were counted.
                    </p>
                    {positions.map((pos, i) => {
                        const info = votedPositions[pos.dbId];
                        if (!info) return null;
                        return (
                            <div key={i} className="verification-item">
                                <div className="item-position">{pos.name}</div>
                                <div className="item-details">
                                    <div><strong>Voted for:</strong> {info.candidateName} ({info.party})</div>
                                    <div>
                                        <strong>Code:</strong>{' '}
                                        <code style={{ background: '#e8f4f0', padding: '2px 6px', borderRadius: 4 }}>
                                            {info.verificationCode}
                                        </code>
                                    </div>
                                    <div>
                                        <strong>TX:</strong>{' '}
                                        <code style={{ fontSize: 11 }}>{info.transactionHash?.slice(0, 24)}...</code>
                                        {info.simulated && (
                                            <span style={{ marginLeft: 8, fontSize: 11, color: '#f59e0b' }}>(simulated)</span>
                                        )}
                                    </div>
                                    {info.blockNumber && <div><strong>Block:</strong> #{info.blockNumber}</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="success-buttons">
                    <button onClick={() => navigate('/portal/results')} className="view-results-btn">
                        View Live Results
                    </button>
                    <button onClick={() => navigate('/portal/profile')} className="home-btn">
                        Return to Profile
                    </button>
                </div>
            </div>
        );
    }

    // ── Main ballot ───────────────────────────────────────────
    return (
        <div className="voting-booth">

            {/* Progress */}
            <div className="voting-progress">
                <div className="progress-info">
                    <span>Voting Progress</span>
                    <span>{totalVoted} of {positions.length} positions voted</span>
                </div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {positions.map((pos, i) => {
                        const voted     = !!votedPositions[pos.dbId];
                        const isCurrent = i === currentStep;
                        return (
                            <span
                                key={pos.id}
                                onClick={() => setCurrentStep(i)}
                                title={pos.name}
                                style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: voted ? 14 : 12, fontWeight: 600,
                                    background: voted ? '#00A651' : isCurrent ? '#1E3C72' : '#e2e8f0',
                                    color: (voted || isCurrent) ? 'white' : '#666',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {voted ? '✓' : i + 1}
                            </span>
                        );
                    })}
                </div>
            </div>

            <div className="voting-card">
                <div className="position-header">
                    <span className="position-counter">
                        Position {currentStep + 1} of {positions.length}
                    </span>
                    <h2>{currentPosition?.name}</h2>
                    {currentPosition?.level === 'national' && (
                        <p className="position-locality">🇰🇪 National Race — All Kenya</p>
                    )}
                    {currentPosition?.level === 'county' && voter?.countyName && (
                        <p className="position-locality">📍 County Race — {voter.countyName} County</p>
                    )}
                    {currentPosition?.level === 'constituency' && voter?.constituencyName && (
                        <p className="position-locality">📍 Constituency Race — {voter.constituencyName}</p>
                    )}
                    {currentPosition?.level === 'ward' && voter?.wardName && (
                        <p className="position-locality">📍 Ward Race — {voter.wardName} Ward</p>
                    )}
                    {currentPosition?.description && (
                        <p style={{ opacity: 0.9, fontSize: '0.9rem', marginTop: 6 }}>
                            {currentPosition.description}
                        </p>
                    )}
                </div>

                {/* Already voted for this position — show locked receipt */}
                {alreadyVotedHere ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
                        <h3 style={{ color: '#00A651', marginBottom: 8 }}>Vote Already Cast</h3>
                        <p style={{ color: '#666', marginBottom: 20 }}>
                            You have already voted for this position.
                        </p>
                        <div style={{
                            background: '#f0fff4', border: '1px solid #c6f6d5',
                            borderRadius: 12, padding: '16px 20px',
                            textAlign: 'left', maxWidth: 400, margin: '0 auto 24px'
                        }}>
                            <div style={{ fontWeight: 700, color: '#1E3C72', marginBottom: 6 }}>
                                {votedPositions[currentPosition.dbId]?.candidateName}
                                {' '}
                                <span style={{ fontWeight: 400, color: '#666', fontSize: '0.85rem' }}>
                                    ({votedPositions[currentPosition.dbId]?.party})
                                </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                <strong>Code:</strong>{' '}
                                <code style={{ background: '#e8f4f0', padding: '2px 6px', borderRadius: 4 }}>
                                    {votedPositions[currentPosition.dbId]?.verificationCode}
                                </code>
                            </div>
                        </div>
                        {/* Navigate to next unvoted */}
                        {positions.findIndex((p, i) => i > currentStep && !votedPositions[p.dbId]) >= 0 ? (
                            <button
                                className="btn-next"
                                onClick={() => {
                                    const next = positions.findIndex((p, i) => i > currentStep && !votedPositions[p.dbId]);
                                    if (next >= 0) setCurrentStep(next);
                                }}
                            >
                                Next Position →
                            </button>
                        ) : null}
                    </div>
                ) : (
                    /* Normal voting UI */
                    <>
                        <div className="candidates-list">
                            {candidatesByPosition[currentPosition?.id]?.map((candidate) => (
                                <div
                                    key={candidate.id}
                                    className={`candidate-card ${
                                        selectedVotes[currentPosition.id] === candidate.id ? 'selected' : ''
                                    }`}
                                    onClick={() => handleVoteSelect(currentPosition.id, candidate.id)}
                                >
                                    <div className="candidate-symbol">{candidate.symbol || '🗳️'}</div>
                                    <div className="candidate-info">
                                        <div className="candidate-name">{candidate.name}</div>
                                        <div className="candidate-party">{candidate.party}</div>
                                        {candidate.description && (
                                            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                                                {candidate.description}
                                            </div>
                                        )}
                                    </div>
                                    <div className="candidate-check">
                                        {selectedVotes[currentPosition.id] === candidate.id && <span>✓</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="voting-actions">
                            <button
                                onClick={() => currentStep > 0 && setCurrentStep(currentStep - 1)}
                                disabled={currentStep === 0}
                                className="btn-prev"
                            >
                                ← Previous
                            </button>

                            <button
                                onClick={castCurrentVote}
                                disabled={casting || !selectedVotes[currentPosition?.id]}
                                className="btn-submit"
                            >
                                {casting
                                    ? '⏳ Recording on Blockchain...'
                                    : `✓ Cast Vote — ${currentPosition?.name}`}
                            </button>
                        </div>
                    </>
                )}
            </div>

            <div className="voting-footer-note">
                <p>🔒 Each vote is recorded on the blockchain immediately and cannot be altered</p>
                <p>📋 You can navigate between positions using the circles above</p>
            </div>
        </div>
    );
};

export default VotingBooth;
