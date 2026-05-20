import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import '../../styles/results.css';

const PARTY_COLORS = {
    UDA: '#16a34a', ODM: '#dc2626', Wiper: '#ca8a04',
    Roots: '#854d0e', ANC: '#2563eb', Ford: '#7c3aed',
};
const partyColor = (p) => PARTY_COLORS[p] || '#6b7280';
const fillClass  = (p) => ({ UDA: 'fill-green', ODM: 'fill-red', Wiper: 'fill-gold', ANC: 'fill-blue' }[p] || 'fill-gray');

const localityLabel = (level, voter) => {
    switch (level) {
        case 'county':       return voter?.countyName       ? `${voter.countyName} County Race`         : 'County Race';
        case 'constituency': return voter?.constituencyName ? `${voter.constituencyName} Constituency`  : 'Constituency Race';
        case 'ward':         return voter?.wardName         ? `${voter.wardName} Ward Race`             : 'Ward Race';
        default:             return null;
    }
};

const VoterResults = ({ voter }) => {
    const [data, setData]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [activeTab, setActiveTab]   = useState(0);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [verifyCode, setVerifyCode]   = useState('');
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifying, setVerifying]   = useState(false);

    const loadResults = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const electionRes = await api.get('/elections/active');
            if (!electionRes.data.success) { setError('No active election found.'); setLoading(false); return; }
            const electionId = electionRes.data.election.id;
            const resultsRes = await api.get(`/elections/results/${electionId}`);
            if (!resultsRes.data.success) { setError('Failed to load results.'); setLoading(false); return; }
            setData(resultsRes.data);
            setLastUpdated(new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }));
        } catch {
            setError('Failed to load results. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadResults();
        const t = setInterval(loadResults, 30000);
        return () => clearInterval(t);
    }, [loadResults]);

    const handleVerify = async () => {
        if (!verifyCode.trim()) return;
        setVerifying(true); setVerifyResult(null);
        try {
            const res = await api.post('/votes/verify', { verificationCode: verifyCode.trim() });
            setVerifyResult(res.data);
        } catch (err) {
            setVerifyResult({ success: false, error: err.response?.data?.error || 'Code not found.' });
        } finally { setVerifying(false); }
    };

    if (loading) return (
        <div className="results-loading">
            <div className="spin-icon">⛓️</div>
            <p>Loading blockchain results...</p>
        </div>
    );

    if (error || !data) return (
        <div className="results-error">
            <div className="err-icon">⚠️</div>
            <p>{error || 'No results available yet.'}</p>
            <button className="res-btn green" onClick={loadResults}>Try Again</button>
        </div>
    );

    const { positions, turnout, blockchain } = data;
    const pos = positions[activeTab];

    return (
        <div style={{ padding: '16px 0', maxWidth: 860 }}>

            {/* Header row */}
            <div className="results-page-head">
                <div>
                    <div className="results-page-title">Election Results</div>
                    <div className="results-page-subtitle">Kenya General Election 2027 — Live counts</div>
                </div>
                <button className="res-btn green" onClick={loadResults}>↻ Refresh</button>
            </div>

            {/* Blockchain banner */}
            <div className={`bc-banner ${blockchain.connected ? 'ok' : 'warn'}`}>
                <span style={{ fontSize: '1.2rem' }}>{blockchain.connected ? '✅' : '⚠️'}</span>
                <div>
                    <div className="bc-banner-text">
                        {blockchain.connected ? 'Results cross-verified against the Ethereum blockchain' : 'Blockchain offline — showing database totals only'}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                {[
                    { icon: '🗳️', val: turnout.voted.toLocaleString(), lbl: 'Votes Cast' },
                    { icon: '📊', val: `${turnout.percentage}%`,        lbl: 'Turnout' },
                    { icon: '🏛️', val: positions.length,               lbl: 'Positions' },
                ].map(s => (
                    <div key={s.lbl} className="stat-card">
                        <div className="stat-icon-r">{s.icon}</div>
                        <div className="stat-num">{s.val}</div>
                        <div className="stat-label-r">{s.lbl}</div>
                    </div>
                ))}
            </div>

            {/* Voter locality */}
            {voter?.countyName && (
                <div className="location-banner">
                    <strong>Your Location:</strong> {voter.countyName} County
                    {voter.constituencyName && ` · ${voter.constituencyName}`}
                    {voter.wardName && ` · ${voter.wardName} Ward`}
                </div>
            )}

            {/* Tabs */}
            <div className="pos-tabs">
                {positions.map((p, i) => (
                    <button key={p.positionId} onClick={() => setActiveTab(i)}
                        className={`pos-tab ${activeTab === i ? 'active-green' : ''}`}>
                        {p.positionName.replace('Member of ', '')}
                    </button>
                ))}
            </div>

            {/* Active position */}
            {pos && (() => {
                const total = pos.candidates.reduce((s, c) => s + c.dbVotes, 0);
                const badge = localityLabel(pos.level, voter);
                return (
                    <div className="pos-card">
                        <div className="pos-card-head green-head">
                            <div>
                                <div className="pos-card-title">{pos.positionName}</div>
                                <div className="pos-card-meta">
                                    {total.toLocaleString()} votes
                                    <span className="pos-level-badge" style={{ marginLeft: 8 }}>{pos.level}</span>
                                    {badge && <span className="locality-badge">{badge}</span>}
                                </div>
                            </div>
                            {pos.winner?.dbVotes > 0 && (
                                <div className="leader-chip">🏆 Leading: {pos.winner.name}</div>
                            )}
                        </div>
                        <div className="pos-card-body">
                            {pos.candidates.map((c, idx) => {
                                const pct = total > 0 ? Math.round((c.dbVotes / total) * 1000) / 10 : 0;
                                const lead = pos.winner?.id === c.id && c.dbVotes > 0;
                                return (
                                    <div key={c.id} className={`cand-row ${lead ? 'leading-row' : ''}`}>
                                        <div className="cand-row-top">
                                            <div className="cand-left">
                                                {lead && <span className="trophy">🏆</span>}
                                                <span className={`cand-name ${lead ? 'leader-name' : ''}`}>{c.name}</span>
                                                <span className="party-chip" style={{ background: partyColor(c.party) }}>{c.party}</span>
                                                {c.verified === true  && <span className="chain-verified">✓ Chain verified</span>}
                                                {c.verified === false && <span className="chain-mismatch">⚠ DB/chain mismatch</span>}
                                            </div>
                                            <div className="vote-right">
                                                <span className="vote-big">{c.dbVotes.toLocaleString()}</span>
                                                <span className="vote-pct">({pct}%)</span>
                                                {c.chainVotes != null && <div className="chain-votes">Chain: {c.chainVotes}</div>}
                                            </div>
                                        </div>
                                        <div className="vote-bar">
                                            <div className={`vote-bar-fill ${lead ? 'fill-green' : fillClass(c.party)}`}
                                                style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {total === 0 && <div className="no-votes">No votes recorded yet for this position.</div>}
                        </div>
                    </div>
                );
            })()}

            {/* Leaders summary */}
            {positions.some(p => p.winner?.dbVotes > 0) && (
                <div className="winners-section">
                    <div className="winners-head">
                        <h3>Current Leaders per Position</h3>
                    </div>
                    <div className="winners-grid">
                        {positions.map(p => p.winner?.dbVotes > 0 ? (
                            <div key={p.positionId} className="winner-card">
                                <div className="winner-pos-label">{p.positionName}</div>
                                <div className="winner-name">🏆 {p.winner.name}</div>
                                <div className="winner-meta">
                                    <span className="party-chip" style={{ background: partyColor(p.winner.party), fontSize: '0.68rem', padding: '1px 7px' }}>
                                        {p.winner.party}
                                    </span>
                                </div>
                                <div className="winner-votes">{p.winner.dbVotes.toLocaleString()} votes ({p.winner.percentage}%)</div>
                                {p.winner.verified === true && <div className="winner-chain">✓ Blockchain confirmed</div>}
                            </div>
                        ) : null)}
                    </div>
                </div>
            )}

            {/* Verify widget */}
            <div className="verify-section">
                <div className="verify-head">
                    <h3>Verify Your Vote</h3>
                    <p>Enter your verification code to confirm your vote is on the blockchain</p>
                </div>
                <div className="verify-body">
                    <div className="verify-row">
                        <input className="verify-input" type="text" value={verifyCode}
                            onChange={e => setVerifyCode(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && handleVerify()}
                            placeholder="e.g. V-AB3XY7KP" />
                        <button className="verify-btn" onClick={handleVerify} disabled={verifying || !verifyCode.trim()}>
                            {verifying ? 'Checking...' : 'Verify'}
                        </button>
                    </div>
                    {verifyResult && (
                        <div className={`verify-result ${verifyResult.success ? 'ok' : 'err'}`}>
                            {verifyResult.success ? (
                                <>
                                    <strong>✅ Vote Verified on Blockchain</strong>
                                    <div style={{ marginTop: 6 }}>
                                        <div>Election: {verifyResult.vote.electionName}</div>
                                        <div>Position: {verifyResult.vote.positionTitle}</div>
                                        <div className="tx-mono">TX: {verifyResult.vote.transactionHash?.slice(0, 28)}...</div>
                                        <div>Voted: {new Date(verifyResult.vote.votedAt).toLocaleString()}</div>
                                    </div>
                                </>
                            ) : (
                                <span>❌ {verifyResult.error}</span>
                            )}
                        </div>
                    )}
                    <p className="verify-note">Each vote is recorded on Ethereum with a unique transaction hash. Your code confirms your vote was counted.</p>
                </div>
            </div>

            <div className="results-foot">Last updated: {lastUpdated} · Auto-refreshes every 30 seconds</div>
        </div>
    );
};

export default VoterResults;
