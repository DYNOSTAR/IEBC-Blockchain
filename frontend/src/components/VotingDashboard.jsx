import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { initWeb3, isMetaMaskInstalled, castVote as castBlockchainVote } from '../services/blockchain';
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
    const [verificationCodes, setVerificationCodes] = useState([]);
    const [electionActive, setElectionActive] = useState(false);
    const [votingComplete, setVotingComplete] = useState(false);
    const [error, setError] = useState('');
    
    // Blockchain states
    const [web3Connected, setWeb3Connected] = useState(false);
    const [userEthAddress, setUserEthAddress] = useState('');
    const [connectingWallet, setConnectingWallet] = useState(false);

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
        
        checkElectionStatus();
        checkMetaMask();
    }, []);

    const checkMetaMask = () => {
        if (isMetaMaskInstalled()) {
            console.log('✅ MetaMask is installed');
        } else {
            console.log('⚠️ MetaMask not installed');
        }
    };

    const connectWallet = async () => {
        if (!isMetaMaskInstalled()) {
            alert('Please install MetaMask extension to vote on the blockchain');
            return;
        }
        
        setConnectingWallet(true);
        try {
            const result = await initWeb3();
            if (result && result.userAccount) {
                setWeb3Connected(true);
                setUserEthAddress(result.userAccount);
                alert('✅ Wallet connected successfully!');
            }
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            alert('Failed to connect wallet. Please make sure MetaMask is unlocked.');
        } finally {
            setConnectingWallet(false);
        }
    };

    const checkElectionStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/elections/active', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.hasActiveElection) {
                setElection(response.data.election);
                setElectionActive(true);
                loadPositions(response.data.election.id);
                checkPreviousVotes(response.data.election.id);
            } else {
                setElectionActive(false);
                setLoading(false);
            }
        } catch (error) {
            console.error('Error checking election:', error);
            setError('Unable to check election status');
            setLoading(false);
        }
    };

    const checkPreviousVotes = async (electionId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/elections/check-completion/${electionId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.completed) {
                setVotingComplete(true);
                setSubmitted(true);
            }
        } catch (error) {
            console.error('Error checking previous votes:', error);
        }
    };

    const loadPositions = async (electionId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/elections/${electionId}/positions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setPositions(response.data.positions);
        } catch (error) {
            console.error('Error loading positions:', error);
            setError('Failed to load voting positions');
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

        // Check if wallet is connected for blockchain voting
        if (!web3Connected) {
            setError('Please connect your wallet first to vote on the blockchain');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const selectedCandidate = currentPosition.candidates.find(
                c => c.id === selectedVotes[currentPosition.id]
            );
            
            // Generate verification code
            const verificationCode = 'V' + Math.random().toString(36).substring(2, 10).toUpperCase();
            
            // Cast vote on blockchain
            const blockchainResult = await castBlockchainVote(
                parseInt(election.id),
                parseInt(currentPosition.id),
                parseInt(selectedVotes[currentPosition.id]),
                verificationCode
            );
            
            if (!blockchainResult.success) {
                throw new Error(blockchainResult.error || 'Blockchain transaction failed');
            }
            
            // Record vote in database
            const response = await axios.post('http://localhost:5000/api/elections/cast', {
                electionId: election.id,
                positionId: currentPosition.id,
                candidateId: selectedVotes[currentPosition.id],
                transactionHash: blockchainResult.transactionHash
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setVerificationCodes(prev => [...prev, {
                    position: currentPosition.title,
                    code: response.data.verificationCode,
                    candidate: selectedCandidate?.name,
                    transactionHash: blockchainResult.transactionHash
                }]);

                // Move to next position or finish
                if (currentStep + 1 < positions.length) {
                    setCurrentStep(currentStep + 1);
                    setSubmitting(false);
                } else {
                    // All votes submitted
                    setSubmitted(true);
                    setSubmitting(false);
                }
            }
        } catch (error) {
            console.error('Error submitting vote:', error);
            setError(error.response?.data?.error || error.message || 'Failed to submit vote. Please try again.');
            setSubmitting(false);
        }
    };

    const currentPosition = positions[currentStep];
    const votedCount = Object.keys(selectedVotes).length;
    const progressPercentage = (votedCount / positions.length) * 100;

    if (loading) {
        return (
            <div className="voting-loading">
                <div className="loading-spinner"></div>
                <p>Loading voting dashboard...</p>
            </div>
        );
    }

    if (!electionActive) {
        return (
            <div className="voting-container">
                <div className="no-election-card">
                    <div className="no-election-icon">🗳️</div>
                    <h2>No Active Election</h2>
                    <p>There is no active election at this time. Please check back later.</p>
                    <button onClick={() => navigate('/')} className="back-home-btn">
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    if (votingComplete || submitted) {
        return (
            <div className="voting-container">
                <div className="success-card">
                    <div className="success-icon">✅</div>
                    <h2>Voting Complete!</h2>
                    <p>Thank you for participating in the {election?.name}</p>
                    
                    <div className="verification-codes">
                        <h3>Your Blockchain Verification Codes</h3>
                        <p>Save these codes to verify your votes on the blockchain:</p>
                        {verificationCodes.map((item, index) => (
                            <div key={index} className="code-item">
                                <div className="code-position">{item.position}:</div>
                                <div className="code-details">
                                    <div className="code-value">{item.code}</div>
                                    <div className="code-candidate">{item.candidate}</div>
                                    <div className="code-tx">Tx: {item.transactionHash?.slice(0, 20)}...</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="success-buttons">
                        <button onClick={() => navigate('/results')} className="view-results-btn">
                            View Live Results
                        </button>
                        <button onClick={() => navigate('/')} className="home-btn">
                            Return to Home
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
                        <div className="voting-title">
                            <h1>{election?.name}</h1>
                            <p>Cast your vote for Kenya's leadership</p>
                        </div>
                        <div className="voter-info-card">
                            <div className="voter-avatar">👤</div>
                            <div className="voter-details">
                                <span className="voter-name">{voter?.firstName} {voter?.lastName}</span>
                                <span className="voter-id">ID: {voter?.nationalId}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MetaMask Connection Warning */}
            {!web3Connected && (
                <div className="metamask-warning">
                    <div className="container">
                        <div className="warning-content">
                            <span className="warning-icon">⚠️</span>
                            <div className="warning-text">
                                <strong>Blockchain connection required</strong>
                                <p>Connect your MetaMask wallet to vote securely on the blockchain</p>
                            </div>
                            <button 
                                onClick={connectWallet} 
                                className="connect-wallet-btn"
                                disabled={connectingWallet}
                            >
                                {connectingWallet ? 'Connecting...' : '🔗 Connect MetaMask'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Progress Bar */}
            <div className="progress-section">
                <div className="container">
                    <div className="progress-wrapper">
                        <div className="progress-info">
                            <span>Voting Progress</span>
                            <span>{votedCount} of {positions.length} positions completed</span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Voting Card */}
            <div className="voting-main">
                <div className="container">
                    <div className="voting-card">
                        <div className="position-header">
                            <div className="position-badge">
                                Position {currentStep + 1} of {positions.length}
                            </div>
                            <h2>{currentPosition?.title}</h2>
                            <p>{currentPosition?.description}</p>
                        </div>

                        <div className="candidates-list">
                            {currentPosition?.candidates?.map((candidate) => (
                                <div
                                    key={candidate.id}
                                    className={`candidate-option ${selectedVotes[currentPosition.id] === candidate.id ? 'selected' : ''}`}
                                    onClick={() => handleVoteSelect(currentPosition.id, candidate.id)}
                                >
                                    <div className="candidate-avatar">
                                        <span className="candidate-symbol">{candidate.symbol || '🗳️'}</span>
                                    </div>
                                    <div className="candidate-info">
                                        <div className="candidate-name">{candidate.name}</div>
                                        <div className="candidate-party">{candidate.party}</div>
                                        <div className="candidate-description">{candidate.description}</div>
                                    </div>
                                    <div className="candidate-select">
                                        <div className={`radio-button ${selectedVotes[currentPosition.id] === candidate.id ? 'selected' : ''}`}>
                                            {selectedVotes[currentPosition.id] === candidate.id && <span>✓</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="error-message">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div className="voting-actions">
                            <button
                                onClick={prevStep}
                                disabled={currentStep === 0}
                                className={`nav-btn prev-btn ${currentStep === 0 ? 'disabled' : ''}`}
                            >
                                ← Previous
                            </button>
                            
                            {currentStep === positions.length - 1 ? (
                                <button
                                    onClick={submitVote}
                                    disabled={submitting || !selectedVotes[currentPosition?.id] || !web3Connected}
                                    className="nav-btn submit-btn"
                                >
                                    {submitting ? 'Recording on Blockchain...' : 'Submit All Votes'}
                                </button>
                            ) : (
                                <button
                                    onClick={nextStep}
                                    disabled={!selectedVotes[currentPosition?.id]}
                                    className={`nav-btn next-btn ${!selectedVotes[currentPosition?.id] ? 'disabled' : ''}`}
                                >
                                    Next →
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="voting-footer-note">
                        <p>🔒 Your vote is encrypted and recorded on the Ethereum blockchain</p>
                        <p>✓ You cannot change your vote once submitted</p>
                        <p>⛓️ Each vote has a unique transaction hash for verification</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VotingDashboard;