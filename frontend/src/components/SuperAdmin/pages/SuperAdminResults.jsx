import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperAdminLayout from '../SuperAdminLayout';
import api from '../../../services/api';
import '../../../styles/results.css';

const PARTY_COLORS = {
    UDA: '#16a34a', ODM: '#dc2626', Wiper: '#ca8a04',
    Roots: '#854d0e', ANC: '#2563eb', Ford: '#7c3aed',
};
const partyColor = (p) => PARTY_COLORS[p] || '#6b7280';

const SuperAdminResults = () => {
    const navigate = useNavigate();
    const [data, setData]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [activeTab, setActiveTab]   = useState(0);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [electionId, setElectionId] = useState(null);
    const [statusMsg, setStatusMsg]   = useState('');
    const [publishing, setPublishing] = useState(false);

    const loadResults = useCallback(async () => {
        setLoading(true); setError('');
        try {
            let eid;
            const electionRes = await api.get('/elections/active');
            if (!electionRes.data.success) {
                const allRes = await api.get('/elections');
                if (!allRes.data.success || !allRes.data.elections?.length) {
                    setError('No elections found.'); setLoading(false); return;
                }
                eid = allRes.data.elections[0].id;
            } else {
                eid = electionRes.data.election.id;
            }
            setElectionId(eid);
            const resultsRes = await api.get(`/elections/results/${eid}`);
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

    const publishResults = async () => {
        if (!electionId) return;
        if (!window.confirm('Publish results? This will make them visible to all voters and the public.')) return;
        setPublishing(true);
        try {
            await api.patch(`/elections/${electionId}/status`, { status: 'results_published' });
            setStatusMsg('✅ Results published successfully.');
            setTimeout(() => setStatusMsg(''), 4000);
        } catch (err) {
            setStatusMsg('❌ Failed to publish: ' + (err.response?.data?.error || err.message));
        } finally { setPublishing(false); }
    };

    const healthClass = (bc) => {
        if (!bc?.connected) return 'hc-red';
        if (!bc.electionActive) return 'hc-yellow';
        return 'hc-green';
    };
    const healthDot = (bc) => {
        if (!bc?.connected) return 'dot-red';
        if (!bc.electionActive) return 'dot-yellow';
        return 'dot-green';
    };
    const healthLabel = (bc) => {
        if (!bc?.connected) return 'Blockchain Offline';
        if (!bc.electionActive) return 'Election Inactive';
        return 'Active & Verified';
    };

    if (loading) return (
        <SuperAdminLayout>
            <div className="results-loading" style={{ height: 260 }}>
                <div className="spin-icon">⛓️</div>
                <p>Loading national results from blockchain...</p>
            </div>
        </SuperAdminLayout>
    );

    if (error || !data) return (
        <SuperAdminLayout>
            <div className="results-error" style={{ height: 260 }}>
                <div className="err-icon">⚠️</div>
                <p>{error || 'No results available.'}</p>
                <button className="res-btn red" onClick={loadResults}>Retry</button>
            </div>
        </SuperAdminLayout>
    );

    const { positions, turnout, blockchain } = data;
    const verifiedCount  = positions.reduce((s, p) => s + p.candidates.filter(c => c.verified === true).length,  0);
    const mismatchCount  = positions.reduce((s, p) => s + p.candidates.filter(c => c.verified === false).length, 0);
    const presidentialPos = positions.find(p => p.level === 'national');
    const pos = positions[activeTab];

    return (
        <SuperAdminLayout>
            <div style={{ padding: '24px' }}>

                {/* Header */}
                <div className="results-page-head">
                    <div>
                        <div className="results-page-title">National Election Results</div>
                        <div className="results-page-subtitle">Kenya General Election 2027 · Super Admin View</div>
                    </div>
                    <div className="btn-row">
                        <button className="res-btn red" onClick={loadResults}>↻ Refresh</button>
                        <button className="res-btn green" onClick={publishResults} disabled={publishing}>
                            {publishing ? 'Publishing...' : '📢 Publish Results'}
                        </button>
                        <button className="res-btn outline" onClick={() => navigate('/super-admin/dashboard')}>Dashboard</button>
                    </div>
                </div>

                {statusMsg && (
                    <div className={`status-msg ${statusMsg.startsWith('✅') ? 'ok' : 'err'}`}>{statusMsg}</div>
                )}

                {/* Blockchain health card */}
                <div className={`health-card ${healthClass(blockchain)}`}>
                    <div className="health-row">
                        <div className={`health-dot ${healthDot(blockchain)}`} />
                        <div>
                            <div className="health-label">Blockchain: {healthLabel(blockchain)}</div>
                            {blockchain.connected ? (
                                <div className="health-sub">
                                    Block #{blockchain.blockNumber?.toLocaleString()} · Network #{blockchain.networkId} · {blockchain.candidateCount} candidates on-chain · Election {blockchain.electionActive ? 'Active' : 'Inactive'}
                                </div>
                            ) : (
                                <div className="health-sub" style={{ color: '#CE1126' }}>Ganache not running — start it at 127.0.0.1:7545</div>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        {blockchain.contractAddress && (
                            <code className="bc-contract-code">{blockchain.contractAddress}</code>
                        )}
                        {mismatchCount > 0 && (
                            <div className="mismatch-alert">⚠ {mismatchCount} DB/Chain mismatches detected!</div>
                        )}
                    </div>
                </div>

                {/* KPI stats */}
                <div className="stats-row">
                    {[
                        { icon: '🗳️', val: turnout.voted.toLocaleString(),      lbl: 'Total Votes Cast' },
                        { icon: '👥', val: turnout.registered.toLocaleString(), lbl: 'Registered Voters' },
                        { icon: '📊', val: `${turnout.percentage}%`,            lbl: 'National Turnout' },
                        { icon: '🏛️', val: positions.length,                   lbl: 'Election Positions' },
                    ].map(s => (
                        <div key={s.lbl} className="stat-card">
                            <div className="stat-icon-r">{s.icon}</div>
                            <div className="stat-num">{s.val}</div>
                            <div className="stat-label-r">{s.lbl}</div>
                        </div>
                    ))}
                </div>

                {/* Integrity grid */}
                {blockchain.connected && (
                    <div className="integrity-grid">
                        <div className="integrity-card ok">
                            <div className="integrity-num ok-num">{verifiedCount}</div>
                            <div className="integrity-lbl">Chain-Verified Records</div>
                        </div>
                        <div className={`integrity-card ${mismatchCount > 0 ? 'bad' : 'neutral'}`}>
                            <div className={`integrity-num ${mismatchCount > 0 ? 'bad-num' : 'na-num'}`}>{mismatchCount}</div>
                            <div className="integrity-lbl">DB/Chain Mismatches</div>
                        </div>
                        <div className="integrity-card neutral">
                            <div className="integrity-num ok-num">
                                {turnout.voted > 0 ? Math.round((verifiedCount / Math.max(verifiedCount + mismatchCount, 1)) * 100) : 0}%
                            </div>
                            <div className="integrity-lbl">Integrity Score</div>
                        </div>
                    </div>
                )}

                {/* Presidential race hero */}
                {presidentialPos?.candidates.length > 0 && (
                    <div className="pos-card" style={{ marginBottom: 24 }}>
                        <div className="pos-card-head" style={{ background: 'linear-gradient(135deg, #000, #1a1a1a)' }}>
                            <div>
                                <div className="pos-card-title">🇰🇪 Presidential Race</div>
                                <div className="pos-card-meta">
                                    {presidentialPos.candidates.reduce((s, c) => s + c.dbVotes, 0).toLocaleString()} votes counted
                                </div>
                            </div>
                            {presidentialPos.winner?.dbVotes > 0 && (
                                <div className="leader-chip">🏆 {presidentialPos.winner.name} ({presidentialPos.winner.percentage}%)</div>
                            )}
                        </div>
                        <div className="pos-card-body">
                            {presidentialPos.candidates.map((c, idx) => {
                                const total = presidentialPos.candidates.reduce((s, x) => s + x.dbVotes, 0);
                                const pct   = total > 0 ? Math.round((c.dbVotes / total) * 1000) / 10 : 0;
                                const lead  = idx === 0 && c.dbVotes > 0;
                                return (
                                    <div key={c.id} className={`pres-row ${lead ? 'pres-leading' : 'pres-other'}`}>
                                        <span className="pres-rank">{lead ? '🥇' : `#${idx + 1}`}</span>
                                        <div className="pres-bar-wrap">
                                            <div className="pres-name-row">
                                                {lead && <span style={{ color: '#DAA520' }}>🏆</span>}
                                                <span className="pres-name">{c.name}</span>
                                                <span className="party-chip" style={{ background: partyColor(c.party) }}>{c.party}</span>
                                                {c.verified === true  && <span className="chain-verified">✓ Chain</span>}
                                                {c.verified === false && <span className="chain-mismatch">⚠ Mismatch</span>}
                                            </div>
                                            <div className="vote-bar">
                                                <div className="vote-bar-fill" style={{ width: `${pct}%`, background: lead ? '#006B3F' : partyColor(c.party) }} />
                                            </div>
                                        </div>
                                        <div className="pres-count">
                                            <div className="pres-votes">{c.dbVotes.toLocaleString()}</div>
                                            <div className="pres-pct">{pct}%</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* All positions tabs */}
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#111', marginBottom: 12 }}>All Positions Breakdown</div>
                <div className="pos-tabs">
                    {positions.map((p, i) => (
                        <button key={p.positionId} onClick={() => setActiveTab(i)}
                            className={`pos-tab ${activeTab === i ? 'active-red' : ''}`}>
                            {p.positionName.replace('Member of ', '')}
                        </button>
                    ))}
                </div>

                {pos && (() => {
                    const total = pos.candidates.reduce((s, c) => s + c.dbVotes, 0);
                    return (
                        <div className="pos-card">
                            <div className="pos-card-head red-head">
                                <div>
                                    <div className="pos-card-title">{pos.positionName}</div>
                                    <div className="pos-card-meta">{total.toLocaleString()} total votes · Level: {pos.level}</div>
                                </div>
                                {pos.winner?.dbVotes > 0 && (
                                    <div className="leader-chip">🏆 {pos.winner.name} — {pos.winner.percentage}%</div>
                                )}
                            </div>
                            <div className="results-table-wrap">
                                <table className="results-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Candidate</th>
                                            <th>Party</th>
                                            <th className="t-right">DB Votes</th>
                                            <th className="t-right">Chain</th>
                                            <th className="t-right">Share</th>
                                            <th className="t-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pos.candidates.map((c, idx) => {
                                            const lead = idx === 0 && c.dbVotes > 0;
                                            const pct  = total > 0 ? Math.round((c.dbVotes / total) * 1000) / 10 : 0;
                                            return (
                                                <tr key={c.id} className={lead ? 'tbl-leader' : ''}>
                                                    <td style={{ fontWeight: 700, color: '#aaa' }}>{lead ? '🥇' : idx + 1}</td>
                                                    <td style={{ fontWeight: 600, color: '#111' }}>{c.name}</td>
                                                    <td><span className="party-chip" style={{ background: partyColor(c.party) }}>{c.party}</span></td>
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
                                                        {c.verified === true  && <span className="chip-match">✓ Verified</span>}
                                                        {c.verified === false && <span className="chip-mismatch">⚠ Mismatch</span>}
                                                        {c.verified === null  && <span className="chip-na">No chain data</span>}
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

                <div className="results-foot">
                    Last updated: {lastUpdated} · Auto-refreshes every 30s ·
                    {blockchain.connected ? ` Block #${blockchain.blockNumber?.toLocaleString()}` : ' Blockchain offline'}
                </div>
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminResults;
