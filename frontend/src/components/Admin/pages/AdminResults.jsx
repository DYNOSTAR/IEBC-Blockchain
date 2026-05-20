import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import api from '../../../services/api';
import '../../../styles/results.css';

const PARTY_COLORS = {
    UDA: '#16a34a', ODM: '#dc2626', Wiper: '#ca8a04',
    Roots: '#854d0e', ANC: '#2563eb', Ford: '#7c3aed',
};
const partyColor = (p) => PARTY_COLORS[p] || '#6b7280';

const AdminResults = () => {
    const navigate = useNavigate();
    const [data, setData]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [activeTab, setActiveTab]   = useState(0);
    const [lastUpdated, setLastUpdated] = useState(null);

    const loadResults = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const electionRes = await api.get('/elections/active');
            if (!electionRes.data.success) { setError('No active election found.'); setLoading(false); return; }
            const electionId = electionRes.data.election.id;
            const resultsRes = await api.get(`/elections/results/${electionId}`);
            if (!resultsRes.data.success) { setError('Failed to load results.'); setLoading(false); return; }
            setData(resultsRes.data);
            setLastUpdated(new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load results.');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        loadResults();
        const t = setInterval(loadResults, 30000);
        return () => clearInterval(t);
    }, [loadResults]);

    const integrityStats = (positions) => {
        let verified = 0, mismatched = 0, pending = 0;
        positions.forEach(p => p.candidates.forEach(c => {
            if (c.verified === true) verified++;
            else if (c.verified === false) mismatched++;
            else pending++;
        }));
        return { verified, mismatched, pending };
    };

    if (loading) return (
        <AdminLayout>
            <div className="results-loading" style={{ height: 260 }}>
                <div className="spin-icon">⛓️</div>
                <p>Loading results from blockchain...</p>
            </div>
        </AdminLayout>
    );

    if (error || !data) return (
        <AdminLayout>
            <div className="results-error" style={{ height: 260 }}>
                <div className="err-icon">⚠️</div>
                <p>{error || 'No results available.'}</p>
                <button className="res-btn green" onClick={loadResults}>Retry</button>
            </div>
        </AdminLayout>
    );

    const { positions, turnout, blockchain } = data;
    const integrity = integrityStats(positions);
    const totalCandidateVotes = positions.reduce((s, p) =>
        s + p.candidates.reduce((cs, c) => cs + c.dbVotes, 0), 0);
    const pos = positions[activeTab];

    return (
        <AdminLayout>
            <div style={{ padding: '24px' }}>

                {/* Header */}
                <div className="results-page-head">
                    <div>
                        <div className="results-page-title">Election Results</div>
                        <div className="results-page-subtitle">Kenya General Election 2027 · Admin View</div>
                    </div>
                    <div className="btn-row">
                        <button className="res-btn green" onClick={loadResults}>↻ Refresh</button>
                        <button className="res-btn outline" onClick={() => navigate('/admin/elections')}>Manage Elections</button>
                    </div>
                </div>

                {/* Blockchain status */}
                <div className={`bc-banner ${blockchain.connected ? 'ok' : 'warn'}`}>
                    <span style={{ fontSize: '1.4rem' }}>{blockchain.connected ? '✅' : '⚠️'}</span>
                    <div>
                        <div className="bc-banner-text">
                            {blockchain.connected ? 'Blockchain Connected & Verified' : 'Blockchain Offline — DB Results Only'}
                        </div>
                        <div className="bc-banner-sub">
                            {blockchain.connected
                                ? `Block #${blockchain.blockNumber?.toLocaleString()} · ${blockchain.candidateCount} candidates on chain`
                                : 'Start Ganache to enable blockchain cross-verification'}
                        </div>
                    </div>
                    {blockchain.contractAddress && (
                        <span className="bc-address">{blockchain.contractAddress.slice(0, 12)}...{blockchain.contractAddress.slice(-6)}</span>
                    )}
                </div>

                {/* Stats */}
                <div className="stats-row">
                    {[
                        { icon: '🗳️', val: turnout.voted.toLocaleString(),      lbl: 'Votes Cast',       top: '' },
                        { icon: '👥', val: turnout.registered.toLocaleString(), lbl: 'Registered',       top: '' },
                        { icon: '📊', val: `${turnout.percentage}%`,            lbl: 'Turnout',          top: '' },
                        { icon: '✅', val: integrity.verified,                  lbl: 'Chain Verified',   top: '' },
                        { icon: '⚠️', val: integrity.mismatched,               lbl: 'Mismatches',       top: integrity.mismatched > 0 ? 'red-top' : '' },
                    ].map(s => (
                        <div key={s.lbl} className={`stat-card ${s.top}`}>
                            <div className="stat-icon-r">{s.icon}</div>
                            <div className="stat-num" style={s.lbl === 'Mismatches' && s.val > 0 ? { color: '#CE1126' } : {}}>
                                {s.val}
                            </div>
                            <div className="stat-label-r">{s.lbl}</div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="pos-tabs">
                    {positions.map((p, i) => (
                        <button key={p.positionId} onClick={() => setActiveTab(i)}
                            className={`pos-tab ${activeTab === i ? 'active' : ''}`}>
                            {p.positionName.replace('Member of ', '')}
                        </button>
                    ))}
                </div>

                {/* Position table */}
                {pos && (() => {
                    const total = pos.candidates.reduce((s, c) => s + c.dbVotes, 0);
                    return (
                        <div className="pos-card">
                            <div className="pos-card-head">
                                <div>
                                    <div className="pos-card-title">{pos.positionName}</div>
                                    <div className="pos-card-meta">
                                        {total.toLocaleString()} votes · Level: {pos.level}
                                    </div>
                                </div>
                                {pos.winner?.dbVotes > 0 && (
                                    <div className="leader-chip">🏆 {pos.winner.name} ({pos.winner.percentage}%)</div>
                                )}
                            </div>
                            <div className="results-table-wrap">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>Rank</th>
                                            <th>Candidate</th>
                                            <th>Party</th>
                                            <th className="t-right">DB Votes</th>
                                            <th className="t-right">Chain</th>
                                            <th className="t-right">Share</th>
                                            <th className="t-center">Integrity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pos.candidates.map((c, idx) => {
                                            const lead = idx === 0 && c.dbVotes > 0;
                                            const pct  = total > 0 ? Math.round((c.dbVotes / total) * 1000) / 10 : 0;
                                            return (
                                                <tr key={c.id} className={lead ? 'tbl-leader' : ''}>
                                                    <td style={{ fontWeight: 700, color: '#aaa' }}>{lead ? '🥇' : `#${idx + 1}`}</td>
                                                    <td style={{ fontWeight: 600, color: '#111' }}>{c.name}</td>
                                                    <td>
                                                        <span className="party-chip" style={{ background: partyColor(c.party) }}>{c.party}</span>
                                                    </td>
                                                    <td className="t-right" style={{ fontWeight: 700 }}>{c.dbVotes.toLocaleString()}</td>
                                                    <td className="t-right" style={{ color: '#777' }}>
                                                        {c.chainVotes != null ? c.chainVotes.toLocaleString() : <span style={{ color: '#ccc' }}>—</span>}
                                                    </td>
                                                    <td className="t-right">
                                                        <span style={{ fontWeight: 600 }}>{pct}%</span>
                                                        <div className="mini-bar-bg">
                                                            <div className="mini-bar-fill" style={{ width: `${pct}%`, background: partyColor(c.party) }} />
                                                        </div>
                                                    </td>
                                                    <td className="t-center">
                                                        {c.verified === true  && <span className="chip-match">✓ Match</span>}
                                                        {c.verified === false && <span className="chip-mismatch">⚠ Mismatch</span>}
                                                        {c.verified === null  && <span className="chip-na">— N/A</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {total === 0 && <div className="no-votes">No votes recorded for this position yet.</div>}
                        </div>
                    );
                })()}

                {/* Leaders summary */}
                {positions.some(p => p.winner?.dbVotes > 0) && (
                    <div className="winners-section">
                        <div className="winners-head">
                            <h3>Current Leaders</h3>
                            <p>Based on votes counted so far</p>
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

                <div className="results-foot">
                    Last updated: {lastUpdated} · Auto-refreshes every 30 seconds · Total vote transactions: {totalCandidateVotes.toLocaleString()}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminResults;
