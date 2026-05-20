import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api, { electionAPI } from '../../services/api';
import '../../styles/results.css';

const PARTY_COLORS = {
    UDA: '#16a34a', ODM: '#dc2626', Wiper: '#ca8a04',
    Roots: '#854d0e', ANC: '#2563eb', Ford: '#7c3aed',
};
const partyColor = (p) => PARTY_COLORS[p] || '#6b7280';
const fillClass  = (p) => ({ UDA: 'fill-green', ODM: 'fill-red', Wiper: 'fill-gold', ANC: 'fill-blue' }[p] || 'fill-gray');

const LEVEL_LABEL = { national: 'National', county: 'County', constituency: 'Constituency', ward: 'Ward' };

const VoterResults = ({ voter }) => {
    const [data, setData]               = useState(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [activeTab, setActiveTab]     = useState(0);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [verifyCode, setVerifyCode]   = useState('');
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifying, setVerifying]     = useState(false);
    const [showAllPositions, setShowAllPositions] = useState(false);

    // Location filter (cascading dropdowns)
    const [counties, setCounties]             = useState([]);
    const [constituencies, setConstituencies] = useState([]);
    const [wards, setWards]                   = useState([]);
    const [filterCountyId, setFilterCountyId] = useState('');
    const [filterConstId, setFilterConstId]   = useState('');
    const [filterWardId, setFilterWardId]     = useState('');
    const [filterOpen, setFilterOpen]         = useState(false);

    const locationRef = useRef({ countyId: '', constituencyId: '', wardId: '' });

    const loadResults = useCallback(async (location = {}) => {
        setLoading(true); setError('');
        try {
            const electionRes = await api.get('/elections/active');
            if (!electionRes.data.success) {
                setError('No active election found.'); setLoading(false); return;
            }
            const electionId = electionRes.data.election.id;
            const resultsRes = await electionAPI.getResults(electionId, location);
            if (!resultsRes.data.success) {
                setError('Failed to load results.'); setLoading(false); return;
            }
            setData(resultsRes.data);
            setLastUpdated(new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }));
        } catch {
            setError('Failed to load results. Please try again.');
        } finally { setLoading(false); }
    }, []);

    // Load counties once on mount + 30s refresh using current location
    useEffect(() => {
        loadResults({});
        api.get('/counties').then(r => { if (r.data.success) setCounties(r.data.counties); }).catch(() => {});
        const t = setInterval(() => loadResults(locationRef.current), 30000);
        return () => clearInterval(t);
    }, [loadResults]);

    // Re-fetch when filter changes
    useEffect(() => {
        const loc = { countyId: filterCountyId, constituencyId: filterConstId, wardId: filterWardId };
        locationRef.current = loc;
        // Don't re-fetch on very first render (handled above); only when values actually change
        if (filterCountyId || filterConstId || filterWardId) loadResults(loc);
    }, [filterCountyId, filterConstId, filterWardId]); // eslint-disable-line

    // Pre-populate from voter profile
    useEffect(() => {
        if (!voter) return;
        if (voter.countyId)        setFilterCountyId(String(voter.countyId));
        if (voter.constituencyId)  setFilterConstId(String(voter.constituencyId));
        if (voter.wardId)          setFilterWardId(String(voter.wardId));
    }, [voter]);

    // Load constituencies for voter's county
    useEffect(() => {
        setConstituencies([]); setFilterConstId(''); setFilterWardId('');
        if (!filterCountyId) return;
        api.get(`/constituencies/${filterCountyId}`).then(r => {
            if (r.data.success) {
                setConstituencies(r.data.constituencies);
                // Re-apply voter's constituency if still in same county
                if (voter?.constituencyId && String(voter.countyId) === filterCountyId) {
                    setFilterConstId(String(voter.constituencyId));
                }
            }
        }).catch(() => {});
    }, [filterCountyId]); // eslint-disable-line

    // Load wards for voter's constituency
    useEffect(() => {
        setWards([]); setFilterWardId('');
        if (!filterConstId) return;
        api.get(`/wards/${filterConstId}`).then(r => {
            if (r.data.success) {
                setWards(r.data.wards);
                // Re-apply voter's ward if still in same constituency
                if (voter?.wardId && String(voter.constituencyId) === filterConstId) {
                    setFilterWardId(String(voter.wardId));
                }
            }
        }).catch(() => {});
    }, [filterConstId]); // eslint-disable-line

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

    const allPositions = data?.positions || [];

    // Tab-level filter: server already scoped candidates, this just hides irrelevant position tabs
    const visiblePositions = useMemo(() => {
        if (showAllPositions || !filterCountyId) return allPositions;
        return allPositions.filter(p => {
            if (p.level === 'national') return true;
            if (p.level === 'county') return true;
            if (p.level === 'constituency') return !!filterConstId;
            if (p.level === 'ward') return !!filterWardId;
            return false;
        });
    }, [allPositions, filterCountyId, filterConstId, filterWardId, showAllPositions]);

    useEffect(() => { setActiveTab(0); }, [filterCountyId, filterConstId, filterWardId, showAllPositions]);

    // Label for current filter
    const locationLabel = useMemo(() => {
        if (filterWardId) {
            const w = wards.find(x => String(x.id) === filterWardId);
            const con = constituencies.find(x => String(x.id) === filterConstId);
            const co = counties.find(x => String(x.id) === filterCountyId);
            return [co?.name + ' County', con?.name, w?.name + ' Ward'].filter(Boolean).join(' · ');
        }
        if (filterConstId) {
            const con = constituencies.find(x => String(x.id) === filterConstId);
            const co = counties.find(x => String(x.id) === filterCountyId);
            return [co?.name + ' County', con?.name].filter(Boolean).join(' · ');
        }
        if (filterCountyId) {
            const co = counties.find(x => String(x.id) === filterCountyId);
            return co?.name + ' County';
        }
        return null;
    }, [filterCountyId, filterConstId, filterWardId, counties, constituencies, wards]);

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
            <button className="res-btn green" style={{ marginTop: 12 }} onClick={loadResults}>Try Again</button>
        </div>
    );

    const { turnout, blockchain } = data;
    const pos = visiblePositions[activeTab];

    return (
        <div style={{ padding: '16px 0', maxWidth: 860 }}>

            {/* Header */}
            <div className="results-page-head">
                <div>
                    <div className="results-page-title">🗳️ Election Results</div>
                    <div className="results-page-subtitle">Kenya General Election 2027 — Live blockchain-verified counts</div>
                </div>
                <div className="btn-row">
                    <button className="res-btn green" onClick={loadResults}>↻ Refresh</button>
                </div>
            </div>

            {/* Blockchain banner */}
            <div className={`bc-banner ${blockchain.connected ? 'ok' : 'warn'}`}>
                <span style={{ fontSize: '1.2rem' }}>{blockchain.connected ? '✅' : '⚠️'}</span>
                <div>
                    <div className="bc-banner-text">
                        {blockchain.connected
                            ? 'Results cross-verified against the Ethereum blockchain'
                            : 'Blockchain offline — showing database totals only'}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                {[
                    { icon: '🗳️', val: turnout.voted.toLocaleString(), lbl: 'Votes Cast' },
                    { icon: '📊', val: `${turnout.percentage}%`,        lbl: 'Turnout' },
                    { icon: '🏛️', val: allPositions.length,            lbl: 'Total Positions' },
                    { icon: '📍', val: visiblePositions.length,         lbl: 'Showing' },
                ].map(s => (
                    <div key={s.lbl} className="stat-card">
                        <div className="stat-icon-r">{s.icon}</div>
                        <div className="stat-num">{s.val}</div>
                        <div className="stat-label-r">{s.lbl}</div>
                    </div>
                ))}
            </div>

            {/* Your location info */}
            {voter?.countyName && (
                <div className="location-banner">
                    <strong>📍 Your Registered Location:</strong>{' '}
                    {voter.countyName} County
                    {voter.constituencyName && ` · ${voter.constituencyName}`}
                    {voter.wardName && ` · ${voter.wardName} Ward`}
                    {' '}
                    <button
                        onClick={() => setFilterOpen(f => !f)}
                        style={{ marginLeft: 12, fontSize: '0.75rem', background: 'none', border: '1px solid #90caf9', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', color: '#1565c0' }}
                    >
                        {filterOpen ? 'Hide Filter' : '⚙ Change Area'}
                    </button>
                    {!showAllPositions && (
                        <button
                            onClick={() => setShowAllPositions(true)}
                            style={{ marginLeft: 8, fontSize: '0.75rem', background: 'none', border: '1px solid #90caf9', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', color: '#1565c0' }}
                        >
                            View All Positions
                        </button>
                    )}
                    {showAllPositions && (
                        <button
                            onClick={() => setShowAllPositions(false)}
                            style={{ marginLeft: 8, fontSize: '0.75rem', background: 'none', border: '1px solid #90caf9', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', color: '#1565c0' }}
                        >
                            My Positions Only
                        </button>
                    )}
                </div>
            )}

            {/* Location filter panel (collapsible) */}
            {(filterOpen || !voter?.countyName) && (
                <div className="location-filter-panel">
                    <div className="filter-panel-title">
                        📍 Filter Results by Location
                    </div>
                    <div className="filter-panel-row">
                        <div className="filter-group">
                            <label>County</label>
                            <select className="filter-select" value={filterCountyId}
                                onChange={e => { setFilterCountyId(e.target.value); setShowAllPositions(false); }}>
                                <option value="">All Counties</option>
                                {counties.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} County</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Constituency</label>
                            <select className="filter-select" value={filterConstId}
                                disabled={!filterCountyId}
                                onChange={e => setFilterConstId(e.target.value)}>
                                <option value="">
                                    {filterCountyId ? 'All Constituencies' : 'Select county first'}
                                </option>
                                {constituencies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Ward</label>
                            <select className="filter-select" value={filterWardId}
                                disabled={!filterConstId}
                                onChange={e => setFilterWardId(e.target.value)}>
                                <option value="">
                                    {filterConstId ? 'All Wards' : 'Select constituency first'}
                                </option>
                                {wards.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {locationLabel && !showAllPositions && (
                        <div className="filter-summary">
                            📍 Showing results for: {locationLabel}
                            {' · '}{visiblePositions.length} race{visiblePositions.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            )}

            {/* What we're showing */}
            {locationLabel && !showAllPositions && !filterOpen && (
                <div className="filter-summary" style={{ marginBottom: 16 }}>
                    📍 Showing results for: {locationLabel} · {visiblePositions.length} race{visiblePositions.length !== 1 ? 's' : ''}
                </div>
            )}

            {/* Position tabs */}
            <div className="pos-tabs">
                {visiblePositions.map((p, i) => (
                    <button key={p.positionId} onClick={() => setActiveTab(i)}
                        className={`pos-tab ${activeTab === i ? 'active-green' : ''}`}>
                        {p.positionName.replace('Member of ', '')}
                        <span style={{ marginLeft: 4, fontSize: '0.63rem', opacity: 0.65, fontWeight: 400 }}>
                            ({LEVEL_LABEL[p.level] || p.level})
                        </span>
                    </button>
                ))}
            </div>

            {/* Active position card */}
            {pos && (() => {
                const total = pos.candidates.reduce((s, c) => s + c.dbVotes, 0);
                const headClass = pos.level === 'national'
                    ? 'green-head'
                    : pos.level === 'county'
                        ? 'red-head'
                        : 'purple-head';
                return (
                    <div className="pos-card">
                        <div className={`pos-card-head ${headClass}`}>
                            <div>
                                <div className="pos-card-title">{pos.positionName}</div>
                                <div className="pos-card-meta">
                                    {total.toLocaleString()} votes
                                    <span className="pos-level-badge" style={{ marginLeft: 8 }}>
                                        {LEVEL_LABEL[pos.level] || pos.level}
                                    </span>
                                    {pos.level === 'county' && voter?.countyName && (
                                        <span className="locality-badge">{voter.countyName} County</span>
                                    )}
                                    {pos.level === 'constituency' && voter?.constituencyName && (
                                        <span className="locality-badge">{voter.constituencyName}</span>
                                    )}
                                    {pos.level === 'ward' && voter?.wardName && (
                                        <span className="locality-badge">{voter.wardName} Ward</span>
                                    )}
                                </div>
                            </div>
                            {pos.winner?.dbVotes > 0 && (
                                <div className="leader-chip">🏆 Leading: {pos.winner.name}</div>
                            )}
                        </div>
                        <div className="pos-card-body">
                            {pos.candidates.map((c, idx) => {
                                const pct  = total > 0 ? Math.round((c.dbVotes / total) * 1000) / 10 : 0;
                                const lead = pos.winner?.id === c.id && c.dbVotes > 0;
                                return (
                                    <div key={c.id} className={`cand-row ${lead ? 'leading-row' : ''}`}>
                                        <div className="cand-row-top">
                                            <div className="cand-left">
                                                {lead && <span className="trophy">🏆</span>}
                                                <span className={`cand-name ${lead ? 'leader-name' : ''}`}>
                                                    {c.name}
                                                </span>
                                                <span className="party-chip" style={{ background: partyColor(c.party) }}>
                                                    {c.party}
                                                </span>
                                                {c.verified === true  && <span className="chain-verified">✓ Chain verified</span>}
                                                {c.verified === false && <span className="chain-mismatch">⚠ DB/chain mismatch</span>}
                                            </div>
                                            <div className="vote-right">
                                                <span className="vote-big">{c.dbVotes.toLocaleString()}</span>
                                                <span className="vote-pct"> ({pct}%)</span>
                                                {c.chainVotes != null && (
                                                    <div className="chain-votes">Chain: {c.chainVotes}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="vote-bar">
                                            <div className={`vote-bar-fill ${lead ? 'fill-green' : fillClass(c.party)}`}
                                                style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {total === 0 && (
                                <div className="no-votes">No votes recorded yet for this position.</div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Leaders summary */}
            {visiblePositions.some(p => p.winner?.dbVotes > 0) && (
                <div className="winners-section">
                    <div className="winners-head">
                        <h3>Current Leaders per Position</h3>
                        <p>
                            {locationLabel
                                ? `Results for ${locationLabel}`
                                : 'National overview — all positions'}
                        </p>
                    </div>
                    <div className="winners-grid">
                        {visiblePositions.map(p => p.winner?.dbVotes > 0 ? (
                            <div key={p.positionId} className="winner-card">
                                <div className="winner-pos-label">{p.positionName}</div>
                                <div className="winner-name">🏆 {p.winner.name}</div>
                                <div className="winner-meta">
                                    <span className="party-chip"
                                        style={{ background: partyColor(p.winner.party), fontSize: '0.68rem', padding: '1px 7px' }}>
                                        {p.winner.party}
                                    </span>
                                </div>
                                <div className="winner-votes">
                                    {p.winner.dbVotes.toLocaleString()} votes ({p.winner.percentage}%)
                                </div>
                                {p.winner.verified === true && (
                                    <div className="winner-chain">✓ Blockchain confirmed</div>
                                )}
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
                        <button className="verify-btn" onClick={handleVerify}
                            disabled={verifying || !verifyCode.trim()}>
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
                    <p className="verify-note">
                        Each vote is recorded on Ethereum with a unique transaction hash.
                        Your code confirms your vote was counted.
                    </p>
                </div>
            </div>

            <div className="results-foot">
                Last updated: {lastUpdated} · Auto-refreshes every 30 seconds
            </div>
        </div>
    );
};

export default VoterResults;
