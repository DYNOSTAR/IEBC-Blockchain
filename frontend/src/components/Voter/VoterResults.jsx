import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import api, { electionAPI } from '../../services/api';
import '../../styles/results.css';

const PARTY_COLORS = {
    UDA: '#006B3F', ODM: '#CE1126', Wiper: '#ca8a04',
    Roots: '#854d0e', ANC: '#2563eb', Jubilee: '#7c3aed',
};
const partyColor = (p) => PARTY_COLORS[p] || '#6b7280';
const votes = (c, bc) => (bc?.connected && c.chainVotes != null) ? c.chainVotes : c.dbVotes;

// ── LocationGroup ─────────────────────────────────────────────
const LocationGroup = ({ label, candidates, blockchain, expanded, onToggle }) => {
    const sorted = [...candidates].sort((a, b) => votes(b, blockchain) - votes(a, blockchain));
    const total  = sorted.reduce((s, c) => s + votes(c, blockchain), 0);
    const leader = sorted[0];

    return (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
            <div onClick={onToggle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#f8f9fa', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.87rem', color: '#111' }}>{label}</span>
                    {leader?.dbVotes > 0 && (
                        <span style={{ fontSize: '0.68rem', background: '#e6f4ed', color: '#006B3F', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>
                            🏆 {leader.name}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.72rem', color: '#888' }}>{total.toLocaleString()} votes</span>
                    <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{expanded ? '▲' : '▼'}</span>
                </div>
            </div>
            {expanded && (
                <div style={{ padding: '8px 14px 12px' }}>
                    {sorted.map((c, i) => {
                        const v    = votes(c, blockchain);
                        const pct  = total > 0 ? Math.round((v / total) * 1000) / 10 : 0;
                        const lead = i === 0 && v > 0;
                        return (
                            <div key={c.id} style={{ marginBottom: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                        {lead && <span>🏆</span>}
                                        <span style={{ fontWeight: lead ? 700 : 500, fontSize: '0.85rem', color: lead ? '#006B3F' : '#333' }}>{c.name}</span>
                                        <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 10, background: partyColor(c.party), color: '#fff', fontWeight: 600 }}>{c.party}</span>
                                    </div>
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111' }}>
                                        {v.toLocaleString()} <span style={{ fontWeight: 400, color: '#999', fontSize: '0.75rem' }}>({pct}%)</span>
                                    </span>
                                </div>
                                <div style={{ background: '#e5e7eb', borderRadius: 4, height: 5 }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: lead ? '#006B3F' : partyColor(c.party), borderRadius: 4, opacity: 0.85 }} />
                                </div>
                            </div>
                        );
                    })}
                    {total === 0 && <div style={{ color: '#bbb', fontSize: '0.82rem', textAlign: 'center', padding: 8 }}>No votes yet.</div>}
                </div>
            )}
        </div>
    );
};

// ── PositionSection ───────────────────────────────────────────
const PositionSection = ({ pos, blockchain, search, voter }) => {
    const [expanded, setExpanded] = useState({});

    const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));

    const groups = useMemo(() => {
        if (pos.level === 'national') {
            return [{ key: 'national', label: '🇰🇪 National — All Kenya', candidates: pos.candidates }];
        }
        const map = {};
        pos.candidates.forEach(c => {
            let key, label;
            if (pos.level === 'county') {
                key   = c.county_id || 'unknown';
                label = c.countyName ? `${c.countyName} County` : `County ${key}`;
            } else if (pos.level === 'constituency') {
                key   = c.constituency_id || 'unknown';
                label = c.constituencyName || `Constituency ${key}`;
            } else {
                key   = c.ward_id || 'unknown';
                label = c.wardName ? `${c.wardName} Ward` : `Ward ${key}`;
            }
            if (!map[key]) map[key] = { key: String(key), label, candidates: [] };
            map[key].candidates.push(c);
        });
        return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
    }, [pos]);

    // Auto-expand voter's own area on mount
    useEffect(() => {
        if (!voter) return;
        const init = {};
        groups.forEach(g => {
            if (pos.level === 'county'        && String(voter.countyId)       === g.key) init[g.key] = true;
            if (pos.level === 'constituency'  && String(voter.constituencyId) === g.key) init[g.key] = true;
            if (pos.level === 'ward'          && String(voter.wardId)         === g.key) init[g.key] = true;
            if (pos.level === 'national') init[g.key] = true;
        });
        setExpanded(init);
    }, []); // eslint-disable-line

    const filteredGroups = useMemo(() => {
        if (!search) return groups;
        const q = search.toLowerCase();
        return groups
            .map(g => ({ ...g, candidates: g.candidates.filter(c => c.name.toLowerCase().includes(q) || (c.party||'').toLowerCase().includes(q) || g.label.toLowerCase().includes(q)) }))
            .filter(g => g.candidates.length > 0 || g.label.toLowerCase().includes(q));
    }, [groups, search]);

    if (filteredGroups.length === 0) return null;

    const headGrad = {
        national:     'linear-gradient(135deg, #003d24, #006B3F)',
        county:       'linear-gradient(135deg, #8a000a, #CE1126)',
        constituency: 'linear-gradient(135deg, #1a237e, #283593)',
        ward:         'linear-gradient(135deg, #4a1270, #7b1fa2)',
    }[pos.level] || 'linear-gradient(135deg,#222,#444)';

    const totalVotes = pos.candidates.reduce((s, c) => s + votes(c, blockchain), 0);

    return (
        <div className="pos-card" style={{ marginBottom: 20 }}>
            <div className="pos-card-head" style={{ background: headGrad }}>
                <div>
                    <div className="pos-card-title">{pos.positionName}</div>
                    <div className="pos-card-meta">
                        {totalVotes.toLocaleString()} votes · <span className="pos-level-badge">{pos.level}</span> · {filteredGroups.length} area{filteredGroups.length !== 1 ? 's' : ''}
                    </div>
                </div>
                <button onClick={() => { const allKeys = filteredGroups.map(g=>g.key); const open = allKeys.every(k=>expanded[k]); const n={}; allKeys.forEach(k=>{n[k]=!open;}); setExpanded(n); }}
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '4px 12px', borderRadius: 8, fontSize: '0.75rem', cursor: 'pointer' }}>
                    {filteredGroups.every(g => expanded[g.key]) ? '▲ Collapse All' : '▼ Expand All'}
                </button>
            </div>
            <div className="pos-card-body">
                {filteredGroups.map(g => (
                    <LocationGroup key={g.key} label={g.label} candidates={g.candidates} blockchain={blockchain} expanded={!!expanded[g.key]} onToggle={() => toggle(g.key)} />
                ))}
            </div>
        </div>
    );
};

// ── VoterResults ──────────────────────────────────────────────
const VoterResults = ({ voter }) => {
    const [data, setData]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);
    const [search, setSearch]         = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifying, setVerifying]   = useState(false);
    const timerRef = useRef(null);

    const loadResults = useCallback(async () => {
        setError('');
        try {
            const electionRes = await api.get('/elections/active');
            if (!electionRes.data.success) { setError('No active election.'); setLoading(false); return; }
            const resultsRes = await electionAPI.getResults(electionRes.data.election.id, {});
            if (!resultsRes.data.success) { setError('Failed to load results.'); setLoading(false); return; }
            setData(resultsRes.data);
            setLastUpdated(new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }));
        } catch { setError('Failed to load results.'); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        loadResults();
        timerRef.current = setInterval(loadResults, 30000);
        return () => clearInterval(timerRef.current);
    }, [loadResults]);

    const handleVerify = async () => {
        if (!verifyCode.trim()) return;
        setVerifying(true); setVerifyResult(null);
        try {
            const res = await api.post('/votes/verify', { verificationCode: verifyCode.trim() });
            setVerifyResult(res.data);
        } catch (err) {
            setVerifyResult({ success: false, error: err.response?.data?.error || 'Not found.' });
        } finally { setVerifying(false); }
    };

    if (loading) return <div className="results-loading"><div className="spin-icon">⛓️</div><p>Loading results…</p></div>;

    if (error || !data) return (
        <div className="results-error"><div className="err-icon">⚠️</div><p>{error || 'No results.'}</p>
            <button className="res-btn green" style={{ marginTop: 12 }} onClick={loadResults}>Try Again</button>
        </div>
    );

    const { turnout, blockchain, isLocked, electionName } = data;
    const chainActive   = blockchain?.connected;
    const allPositions  = data.positions || [];

    return (
        <div style={{ padding: '16px 0', maxWidth: 860 }}>

            {/* Locked banner */}
            {isLocked && (
                <div className="election-locked-banner">
                    <span style={{ fontSize: '1.4rem' }}>🔒</span>
                    <div><div style={{ fontWeight: 700 }}>Voting Temporarily Locked</div>
                        <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>Results are read-only.</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="results-page-head">
                <div>
                    <div className="results-page-title">Election Results</div>
                    <div className="results-page-subtitle">
                        {electionName || 'Kenya General Election'} · {chainActive ? 'Blockchain-verified' : 'Blockchain offline'}
                    </div>
                </div>
                <button className="res-btn green" onClick={loadResults}>↻ Refresh</button>
            </div>

            {/* Voter location info */}
            {voter?.countyName && (
                <div className="location-banner">
                    <strong>Your Area:</strong>{' '}
                    {voter.countyName} County
                    {voter.constituencyName && ` · ${voter.constituencyName}`}
                    {voter.wardName && ` · ${voter.wardName} Ward`}
                    {' '}— your area's candidates are auto-expanded below
                </div>
            )}

            {/* Blockchain status */}
            <div className={`bc-banner ${chainActive ? 'ok' : 'warn'}`}>
                <span>{chainActive ? '✅' : '⚠️'}</span>
                <div>
                    <div className="bc-banner-text">
                        {chainActive ? 'Vote counts verified against blockchain' : 'Blockchain offline — results unavailable'}
                    </div>
                </div>
            </div>

            {!chainActive && (
                <div className="location-empty-prompt">
                    <div className="loc-prompt-icon">⛓️</div>
                    <div className="loc-prompt-title">Blockchain Node Offline</div>
                    <div className="loc-prompt-sub">Start Ganache to view live results.</div>
                    <button className="res-btn green" onClick={loadResults} style={{ marginTop: 16 }}>↻ Retry</button>
                </div>
            )}

            {chainActive && (
                <>
                    {/* Stats */}
                    <div className="stats-row">
                        {[
                            { icon: '🗳️', val: turnout.voted.toLocaleString(), lbl: 'Votes Cast' },
                            { icon: '📊', val: `${turnout.percentage}%`,        lbl: 'Turnout' },
                            { icon: '🏛️', val: allPositions.length,            lbl: 'Positions' },
                            { icon: '⛓️', val: 'Live',                         lbl: 'Blockchain' },
                        ].map(s => (
                            <div key={s.lbl} className="stat-card">
                                <div className="stat-icon-r">{s.icon}</div>
                                <div className="stat-num">{s.val}</div>
                                <div className="stat-label-r">{s.lbl}</div>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div style={{ marginBottom: 20 }}>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search candidate, party, county, constituency or ward…"
                            style={{ width: '100%', padding: '11px 16px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box' }} />
                    </div>

                    {/* All positions */}
                    {allPositions.map(pos => (
                        <PositionSection key={pos.positionId} pos={pos} blockchain={blockchain} search={search} voter={voter} />
                    ))}
                </>
            )}

            {/* Verify */}
            <div className="verify-section">
                <div className="verify-head"><h3>Verify Your Vote</h3><p>Enter your verification code to confirm your vote is on the blockchain</p></div>
                <div className="verify-body">
                    <div className="verify-row">
                        <input className="verify-input" type="text" value={verifyCode}
                            onChange={e => setVerifyCode(e.target.value.toUpperCase())}
                            onKeyDown={e => e.key === 'Enter' && handleVerify()}
                            placeholder="e.g. V-AB3XY7KP" />
                        <button className="verify-btn" onClick={handleVerify} disabled={verifying || !verifyCode.trim()}>
                            {verifying ? 'Checking…' : 'Verify'}
                        </button>
                    </div>
                    {verifyResult && (
                        <div className={`verify-result ${verifyResult.success ? 'ok' : 'err'}`}>
                            {verifyResult.success
                                ? <><strong>✅ Vote Verified</strong><div style={{ marginTop: 6 }}><div>Position: {verifyResult.vote.positionTitle}</div></div></>
                                : <span>❌ {verifyResult.error}</span>}
                        </div>
                    )}
                    <p className="verify-note">Each vote is recorded on Ethereum with a unique transaction hash.</p>
                </div>
            </div>

            <div className="results-foot">Last updated: {lastUpdated} · Auto-refreshes every 30 s</div>
        </div>
    );
};

export default VoterResults;
