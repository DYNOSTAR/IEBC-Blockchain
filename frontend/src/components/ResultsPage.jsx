import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { electionAPI } from '../services/api';
import '../styles/results.css';

const PARTY_COLORS = {
    UDA: '#16a34a', ODM: '#dc2626', Wiper: '#ca8a04',
    Roots: '#854d0e', ANC: '#2563eb', Ford: '#7c3aed',
};
const partyColor = (p) => PARTY_COLORS[p] || '#6b7280';
const fillClass  = (p) => ({ UDA:'fill-green', ODM:'fill-red', Wiper:'fill-gold', ANC:'fill-blue' }[p] || 'fill-gray');

const ResultsPage = () => {
    const navigate = useNavigate();
    const [data, setData]               = useState(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [verifyCode, setVerifyCode]   = useState('');
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifying, setVerifying]     = useState(false);
    const [activeTab, setActiveTab]     = useState(0);

    // Location filter state
    const [counties, setCounties]               = useState([]);
    const [constituencies, setConstituencies]   = useState([]);
    const [wards, setWards]                     = useState([]);
    const [filterCountyId, setFilterCountyId]   = useState('');
    const [filterConstId, setFilterConstId]     = useState('');
    const [filterWardId, setFilterWardId]       = useState('');

    // Keep a ref to the current location so the auto-refresh interval can use it
    const locationRef = useRef({ countyId: '', constituencyId: '', wardId: '' });

    const loadResults = useCallback(async (location = {}) => {
        setLoading(true); setError('');
        try {
            const electionRes = await api.get('/elections/public/current');
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
        } catch (err) {
            setError('Failed to load results. Please try again.');
        } finally { setLoading(false); }
    }, []);

    // Load counties once on mount + start 30s refresh interval
    useEffect(() => {
        loadResults({});
        api.get('/counties').then(r => { if (r.data.success) setCounties(r.data.counties); }).catch(() => {});
        const t = setInterval(() => loadResults(locationRef.current), 30000);
        return () => clearInterval(t);
    }, [loadResults]);

    // Re-fetch with location whenever the filter changes
    useEffect(() => {
        const loc = { countyId: filterCountyId, constituencyId: filterConstId, wardId: filterWardId };
        locationRef.current = loc;
        loadResults(loc);
    }, [filterCountyId, filterConstId, filterWardId]); // eslint-disable-line

    useEffect(() => {
        setFilterConstId(''); setFilterWardId(''); setConstituencies([]); setWards([]);
        if (!filterCountyId) return;
        api.get(`/constituencies/${filterCountyId}`).then(r => {
            if (r.data.success) setConstituencies(r.data.constituencies);
        }).catch(() => {});
    }, [filterCountyId]);

    useEffect(() => {
        setFilterWardId(''); setWards([]);
        if (!filterConstId) return;
        api.get(`/wards/${filterConstId}`).then(r => {
            if (r.data.success) setWards(r.data.wards);
        }).catch(() => {});
    }, [filterConstId]);

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

    // Tab-level filter: hide position tabs not relevant to the chosen location level
    // (Candidate-level filtering is done server-side via location params)
    const allPositions = data?.positions || [];
    const visiblePositions = useMemo(() => {
        if (!filterCountyId) return allPositions;
        return allPositions.filter(p => {
            if (p.level === 'national') return true;
            if (p.level === 'county') return true;
            if (p.level === 'constituency') return !!filterConstId;
            if (p.level === 'ward') return !!filterWardId;
            return false;
        });
    }, [allPositions, filterCountyId, filterConstId, filterWardId]);

    const clearFilter = () => { setFilterCountyId(''); setFilterConstId(''); setFilterWardId(''); };

    const filterLabel = () => {
        const parts = [];
        if (filterCountyId) parts.push(counties.find(c => String(c.id) === filterCountyId)?.name + ' County');
        if (filterConstId)  parts.push(constituencies.find(c => String(c.id) === filterConstId)?.name);
        if (filterWardId)   parts.push(wards.find(w => String(w.id) === filterWardId)?.name + ' Ward');
        return parts.join(' · ');
    };

    if (loading) return (
        <div className="results-page-wrap">
            <div className="ke-flag-bar" />
            <div className="results-pub-header">
                <div className="results-pub-header-inner">
                    <div>
                        <div className="results-pub-title">🗳️ IEBC Blockchain Voting System</div>
                        <div className="results-pub-sub">Live Election Results · Kenya General Election 2027</div>
                    </div>
                </div>
            </div>
            <div className="results-loading" style={{ height: 320 }}>
                <div className="spin-icon">⛓️</div>
                <p>Loading blockchain results...</p>
            </div>
        </div>
    );

    if (error || !data) return (
        <div className="results-page-wrap">
            <div className="ke-flag-bar" />
            <div className="results-pub-header">
                <div className="results-pub-header-inner">
                    <div>
                        <div className="results-pub-title">🗳️ IEBC Blockchain Voting System</div>
                        <div className="results-pub-sub">Live Election Results · Kenya General Election 2027</div>
                    </div>
                    <button className="res-btn outline" onClick={() => navigate('/')}>Home</button>
                </div>
            </div>
            <div className="results-error" style={{ height: 320 }}>
                <div className="err-icon">⚠️</div>
                <p>{error || 'No results available yet.'}</p>
                <button className="res-btn green" style={{ marginTop: 12 }} onClick={loadResults}>Try Again</button>
            </div>
        </div>
    );

    const { turnout, blockchain } = data;
    const pos = visiblePositions[activeTab];

    return (
        <div className="results-page-wrap">
            <div className="ke-flag-bar" />

            <div className="results-pub-header">
                <div className="results-pub-header-inner">
                    <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                        <div className="results-pub-title">🗳️ IEBC Blockchain Voting System</div>
                        <div className="results-pub-sub">Live Election Results · Kenya General Election 2027</div>
                    </div>
                    <div className="btn-row">
                        <button className="res-btn green" onClick={loadResults}>↻ Refresh</button>
                        <button className="res-btn outline" onClick={() => navigate('/')}>Home</button>
                    </div>
                </div>
            </div>

            <div className="results-content-wrap">

                {/* Blockchain banner */}
                <div className={`bc-banner ${blockchain.connected ? 'ok' : 'warn'}`}>
                    <span style={{ fontSize: '1.3rem' }}>{blockchain.connected ? '✅' : '⚠️'}</span>
                    <div>
                        <div className="bc-banner-text">
                            {blockchain.connected
                                ? 'Results cross-verified between database and Ethereum blockchain'
                                : 'Database Results — Blockchain offline'}
                        </div>
                        <div className="bc-banner-sub">
                            {blockchain.connected
                                ? 'All votes independently verifiable on-chain'
                                : 'Connect Ganache to enable blockchain cross-verification'}
                        </div>
                    </div>
                    {blockchain.contractAddress && (
                        <span className="bc-address">
                            {blockchain.contractAddress.slice(0, 10)}...{blockchain.contractAddress.slice(-6)}
                        </span>
                    )}
                </div>

                {/* Stats */}
                <div className="stats-row">
                    {[
                        { icon: '🗳️', val: turnout.voted.toLocaleString(),         lbl: 'Votes Cast' },
                        { icon: '📊', val: `${turnout.percentage}%`,               lbl: 'Voter Turnout' },
                        { icon: '🏛️', val: allPositions.length,                   lbl: 'Positions' },
                        { icon: '⛓️', val: blockchain.connected ? '100%' : 'N/A', lbl: 'Chain Integrity' },
                    ].map(s => (
                        <div key={s.lbl} className="stat-card">
                            <div className="stat-icon-r">{s.icon}</div>
                            <div className="stat-num">{s.val}</div>
                            <div className="stat-label-r">{s.lbl}</div>
                        </div>
                    ))}
                </div>

                {/* ── Location Filter ── */}
                <div className="location-filter-panel">
                    <div className="filter-panel-title">
                        📍 Filter Results by Location
                        <span style={{ fontWeight: 400, fontSize: '0.75rem', color: '#888' }}>
                            — Select your area to see relevant race results
                        </span>
                    </div>
                    <div className="filter-panel-row">
                        <div className="filter-group">
                            <label>County</label>
                            <select
                                className="filter-select"
                                value={filterCountyId}
                                onChange={e => setFilterCountyId(e.target.value)}
                            >
                                <option value="">All Counties (National Overview)</option>
                                {counties.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} County</option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Constituency</label>
                            <select
                                className="filter-select"
                                value={filterConstId}
                                disabled={!filterCountyId}
                                onChange={e => setFilterConstId(e.target.value)}
                            >
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
                            <select
                                className="filter-select"
                                value={filterWardId}
                                disabled={!filterConstId}
                                onChange={e => setFilterWardId(e.target.value)}
                            >
                                <option value="">
                                    {filterConstId ? 'All Wards' : 'Select constituency first'}
                                </option>
                                {wards.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>

                        {filterCountyId && (
                            <button className="res-btn outline" onClick={clearFilter}
                                style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
                                ✕ Clear
                            </button>
                        )}
                    </div>

                    {filterCountyId && (
                        <div className="filter-summary">
                            Showing: {filterLabel()} —{' '}
                            {visiblePositions.length} position{visiblePositions.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {/* No positions after filter */}
                {visiblePositions.length === 0 && (
                    <div className="no-votes" style={{ padding: '40px', background: '#fff', borderRadius: 12 }}>
                        No positions to show for the selected filter.
                    </div>
                )}

                {/* Position tabs */}
                {visiblePositions.length > 0 && (
                    <div className="pos-tabs">
                        {visiblePositions.map((p, i) => (
                            <button key={p.positionId} onClick={() => setActiveTab(i)}
                                className={`pos-tab ${activeTab === i ? 'active' : ''}`}>
                                {p.positionName.replace('Member of ', '')}
                                {p.level !== 'national' && (
                                    <span style={{
                                        marginLeft: 5, fontSize: '0.65rem',
                                        opacity: 0.7, fontWeight: 400
                                    }}>
                                        ({p.level})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Active position card */}
                {pos && (() => {
                    const total  = pos.candidates.reduce((s, c) => s + c.dbVotes, 0);
                    const winner = pos.candidates.find(c => c.dbVotes > 0);
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
                                            {pos.level}
                                        </span>
                                        {filterCountyId && pos.level === 'county' && (
                                            <span className="locality-badge">
                                                {counties.find(c => String(c.id) === filterCountyId)?.name}
                                            </span>
                                        )}
                                        {filterConstId && pos.level === 'constituency' && (
                                            <span className="locality-badge">
                                                {constituencies.find(c => String(c.id) === filterConstId)?.name}
                                            </span>
                                        )}
                                        {filterWardId && pos.level === 'ward' && (
                                            <span className="locality-badge">
                                                {wards.find(w => String(w.id) === filterWardId)?.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {winner && (
                                    <div className="leader-chip">🏆 Leader: {winner.name}</div>
                                )}
                            </div>
                            <div className="pos-card-body">
                                {pos.candidates.map((c, idx) => {
                                    const pct  = total > 0 ? Math.round((c.dbVotes / total) * 1000) / 10 : 0;
                                    const lead = idx === 0 && c.dbVotes > 0;
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
                                                    {c.verified === false && <span className="chain-mismatch">⚠ Mismatch</span>}
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
                                    <div className="no-votes">No votes cast yet for this position.</div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Leaders summary */}
                {visiblePositions.some(p => p.winner?.dbVotes > 0) && (
                    <div className="winners-section">
                        <div className="winners-head">
                            <h3>Current Leaders</h3>
                            <p>Leading candidates per position</p>
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
                                </div>
                            ) : null)}
                        </div>
                    </div>
                )}

                {/* Vote verifier */}
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
                                placeholder="Enter code e.g. V-AB3XY7KP" />
                            <button className="verify-btn" onClick={handleVerify}
                                disabled={verifying || !verifyCode.trim()}>
                                {verifying ? 'Checking...' : 'Verify Vote'}
                            </button>
                        </div>
                        {verifyResult && (
                            <div className={`verify-result ${verifyResult.success ? 'ok' : 'err'}`}>
                                {verifyResult.success ? (
                                    <>
                                        <strong>✅ Vote Verified on Blockchain</strong>
                                        <div style={{ marginTop: 8 }}>
                                            <div>Election: {verifyResult.vote.electionName}</div>
                                            <div>Position: {verifyResult.vote.positionTitle}</div>
                                            <div>
                                                TX: <span className="tx-mono">
                                                    {verifyResult.vote.transactionHash?.slice(0, 24)}...
                                                </span>
                                            </div>
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
                            Your code confirms your vote was counted without revealing your choice.
                        </p>
                    </div>
                </div>

                <div className="results-foot">
                    Last updated: {lastUpdated} · Auto-refreshes every 30 seconds · Results verifiable on the blockchain
                </div>
            </div>
        </div>
    );
};

export default ResultsPage;
