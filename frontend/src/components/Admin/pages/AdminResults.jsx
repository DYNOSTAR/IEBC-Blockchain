import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../AdminLayout';
import api, { electionAPI } from '../../../services/api';
import '../../../styles/results.css';

const PARTY_COLORS = {
    UDA: '#006B3F', ODM: '#CE1126', Wiper: '#ca8a04',
    Roots: '#854d0e', ANC: '#2563eb', Jubilee: '#7c3aed',
};
const partyColor = (p) => PARTY_COLORS[p] || '#6b7280';

// Use blockchain votes when connected, fall back to DB
const votes = (c, blockchain) =>
    (blockchain?.connected && c.chainVotes != null) ? c.chainVotes : c.dbVotes;

// ── PositionTable ──────────────────────────────────────────────
const PositionTable = ({ pos, locationLabel, blockchain }) => {
    const sorted = [...pos.candidates].sort((a, b) => votes(b, blockchain) - votes(a, blockchain));
    const total  = sorted.reduce((s, c) => s + votes(c, blockchain), 0);

    const headGrad = {
        national:     'linear-gradient(135deg, #003d24 0%, #006B3F 100%)',
        county:       'linear-gradient(135deg, #8a000a 0%, #CE1126 100%)',
        constituency: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        ward:         'linear-gradient(135deg, #4a1270 0%, #7b1fa2 100%)',
    }[pos.level] || 'linear-gradient(135deg,#222,#444)';

    return (
        <div className="pos-card" style={{ marginBottom: 20 }}>
            <div className="pos-card-head" style={{ background: headGrad }}>
                <div>
                    <div className="pos-card-title">{pos.positionName}</div>
                    <div className="pos-card-meta">
                        {total.toLocaleString()} votes · Level: {pos.level}
                        {locationLabel && <span className="locality-badge">{locationLabel}</span>}
                    </div>
                </div>
                {sorted[0]?.dbVotes > 0 && (
                    <div className="leader-chip">
                        🏆 {sorted[0].name} ({total > 0 ? Math.round((votes(sorted[0], blockchain) / total) * 100) : 0}%)
                    </div>
                )}
            </div>
            {sorted.length === 0 && (
                <div className="no-votes">No candidates found for this location.</div>
            )}
            {sorted.length > 0 && (
                <div className="results-table-wrap">
                    <table className="results-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Candidate</th>
                                <th>Party</th>
                                <th className="t-right">{blockchain?.connected ? 'Chain Votes' : 'DB Votes'}</th>
                                {blockchain?.connected && <th className="t-right">DB</th>}
                                <th className="t-right">Share</th>
                                <th className="t-center">Integrity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sorted.map((c, idx) => {
                                const v    = votes(c, blockchain);
                                const pct  = total > 0 ? Math.round((v / total) * 1000) / 10 : 0;
                                const lead = idx === 0 && v > 0;
                                return (
                                    <tr key={c.id} className={lead ? 'tbl-leader' : ''}>
                                        <td style={{ fontWeight: 700, color: '#aaa' }}>
                                            {lead ? '🥇' : `#${idx + 1}`}
                                        </td>
                                        <td style={{ fontWeight: 600, color: '#111' }}>{c.name}</td>
                                        <td>
                                            <span className="party-chip"
                                                style={{ background: partyColor(c.party) }}>
                                                {c.party}
                                            </span>
                                        </td>
                                        <td className="t-right" style={{ fontWeight: 700 }}>
                                            {v.toLocaleString()}
                                        </td>
                                        {blockchain?.connected && (
                                            <td className="t-right" style={{ color: '#777', fontSize: '0.8rem' }}>
                                                {c.dbVotes.toLocaleString()}
                                            </td>
                                        )}
                                        <td className="t-right">
                                            <span style={{ fontWeight: 600 }}>{pct}%</span>
                                            <div className="mini-bar-bg">
                                                <div className="mini-bar-fill"
                                                    style={{ width: `${pct}%`, background: partyColor(c.party) }} />
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
            )}
            {total === 0 && sorted.length > 0 && (
                <div className="no-votes">No votes recorded yet.</div>
            )}
        </div>
    );
};

// ── AdminResults ───────────────────────────────────────────────
const AdminResults = () => {
    const navigate = useNavigate();
    const [data, setData]             = useState(null);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [lastUpdated, setLastUpdated] = useState(null);

    const [counties, setCounties]               = useState([]);
    const [constituencies, setConstituencies]   = useState([]);
    const [wards, setWards]                     = useState([]);
    const [filterCountyId, setFilterCountyId]   = useState('');
    const [filterConstId, setFilterConstId]     = useState('');
    const [filterWardId, setFilterWardId]       = useState('');

    const locationRef = useRef({ countyId: '', constituencyId: '', wardId: '' });

    const loadResults = useCallback(async (location = {}) => {
        setError('');
        try {
            const electionRes = await api.get('/elections/active');
            if (!electionRes.data.success) { setError('No active election found.'); setLoading(false); return; }
            const electionId = electionRes.data.election.id;
            const resultsRes = await electionAPI.getResults(electionId, location);
            if (!resultsRes.data.success) { setError('Failed to load results.'); setLoading(false); return; }
            setData(resultsRes.data);
            setLastUpdated(new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' }));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to load results.');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        loadResults({});
        api.get('/counties').then(r => { if (r.data?.success) setCounties(r.data.counties); }).catch(() => {});
        const t = setInterval(() => loadResults(locationRef.current), 30000);
        return () => clearInterval(t);
    }, [loadResults]);

    useEffect(() => {
        const loc = { countyId: filterCountyId, constituencyId: filterConstId, wardId: filterWardId };
        locationRef.current = loc;
        loadResults(loc);
    }, [filterCountyId, filterConstId, filterWardId]); // eslint-disable-line

    useEffect(() => {
        setFilterConstId(''); setFilterWardId(''); setConstituencies([]); setWards([]);
        if (!filterCountyId) return;
        api.get(`/constituencies/${filterCountyId}`).then(r => {
            if (r.data?.success) setConstituencies(r.data.constituencies);
        }).catch(() => {});
    }, [filterCountyId]);

    useEffect(() => {
        setFilterWardId(''); setWards([]);
        if (!filterConstId) return;
        api.get(`/wards/${filterConstId}`).then(r => {
            if (r.data?.success) setWards(r.data.wards);
        }).catch(() => {});
    }, [filterConstId]);

    const allPositions    = data?.positions || [];
    const presidentialPos = allPositions.find(p => p.level === 'national');

    const locationRaces = useMemo(() => {
        if (!filterCountyId) return [];
        return allPositions.filter(p => {
            if (p.level === 'national') return false;
            if (p.level === 'county')        return true;
            if (p.level === 'constituency')  return !!filterConstId;
            if (p.level === 'ward')          return !!filterWardId;
            return false;
        });
    }, [allPositions, filterCountyId, filterConstId, filterWardId]);

    const integrityStats = useMemo(() => {
        let verified = 0, mismatched = 0, pending = 0;
        allPositions.forEach(p => p.candidates.forEach(c => {
            if (c.verified === true) verified++;
            else if (c.verified === false) mismatched++;
            else pending++;
        }));
        return { verified, mismatched, pending };
    }, [allPositions]);

    const countyName       = counties.find(c => String(c.id) === filterCountyId)?.name;
    const constituencyName = constituencies.find(c => String(c.id) === filterConstId)?.name;
    const wardName         = wards.find(w => String(w.id) === filterWardId)?.name;

    const locationLabel = (level) => {
        if (level === 'county')       return countyName ? `${countyName} County` : null;
        if (level === 'constituency') return constituencyName || null;
        if (level === 'ward')         return wardName ? `${wardName} Ward` : null;
        return null;
    };

    const clearFilter = () => { setFilterCountyId(''); setFilterConstId(''); setFilterWardId(''); };

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
                <button className="res-btn green" onClick={() => loadResults({})}>Retry</button>
            </div>
        </AdminLayout>
    );

    const { turnout, blockchain } = data;
    const chainActive = blockchain?.connected;

    return (
        <AdminLayout>
            <div style={{ padding: '24px' }}>

                <div className="results-page-head">
                    <div>
                        <div className="results-page-title">Election Results</div>
                        <div className="results-page-subtitle">Kenya General Election 2027 · Admin View</div>
                    </div>
                    <div className="btn-row">
                        <button className="res-btn green" onClick={() => loadResults(locationRef.current)}>↻ Refresh</button>
                        <button className="res-btn outline" onClick={() => navigate('/admin/elections')}>Manage Elections</button>
                    </div>
                </div>

                {/* Blockchain status */}
                <div className={`bc-banner ${chainActive ? 'ok' : 'warn'}`}>
                    <span style={{ fontSize: '1.4rem' }}>{chainActive ? '✅' : '⚠️'}</span>
                    <div>
                        <div className="bc-banner-text">
                            {chainActive
                                ? `Blockchain connected — ${blockchain.candidateCount ?? '—'} candidates on chain`
                                : 'Blockchain offline — results unavailable'}
                        </div>
                        <div className="bc-banner-sub">
                            {chainActive
                                ? 'Chain vote counts shown below'
                                : 'Start Ganache to view results. Unverified tallies are not displayed.'}
                        </div>
                    </div>
                    {blockchain?.contractAddress && (
                        <span className="bc-address">{blockchain.contractAddress.slice(0, 12)}...{blockchain.contractAddress.slice(-6)}</span>
                    )}
                </div>

                {/* Offline — no results */}
                {!chainActive && (
                    <div className="location-empty-prompt">
                        <div className="loc-prompt-icon">⛓️</div>
                        <div className="loc-prompt-title">Blockchain Node Offline</div>
                        <div className="loc-prompt-sub">
                            Results are only shown when the Ethereum node is reachable.
                            Start Ganache and ensure the contract is deployed, then refresh.
                        </div>
                        <button className="res-btn green" onClick={() => loadResults(locationRef.current)}
                            style={{ marginTop: 16 }}>
                            ↻ Retry Connection
                        </button>
                    </div>
                )}

                {chainActive && <>

                {/* Stats */}
                <div className="stats-row">
                    {[
                        { icon: '🗳️', val: turnout.voted.toLocaleString(),      lbl: 'Votes Cast',     top: '' },
                        { icon: '👥', val: turnout.registered.toLocaleString(), lbl: 'Registered',     top: '' },
                        { icon: '📊', val: `${turnout.percentage}%`,            lbl: 'Turnout',        top: '' },
                        { icon: '✅', val: integrityStats.verified,              lbl: 'Chain Verified', top: '' },
                        { icon: '⚠️', val: integrityStats.mismatched,           lbl: 'Mismatches',     top: integrityStats.mismatched > 0 ? 'red-top' : '' },
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

                {/* Presidential Race */}
                {presidentialPos && (
                    <>
                        <div className="section-label section-label-national">
                            🇰🇪 Presidential Race — All Kenya
                        </div>
                        <PositionTable
                            pos={presidentialPos}
                            locationLabel="National"
                            blockchain={blockchain}
                        />
                    </>
                )}

                {/* County / Constituency / Ward Races */}
                <div className="section-label section-label-local">
                    📍 County, Constituency & Ward Races
                </div>

                <div className="location-filter-panel">
                    <div className="filter-panel-title">Filter by Location</div>
                    <div className="filter-panel-row">
                        <div className="filter-group">
                            <label>County</label>
                            <select className="filter-select" value={filterCountyId}
                                onChange={e => setFilterCountyId(e.target.value)}>
                                <option value="">— Select County —</option>
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
                                <option value="">{filterCountyId ? '— All —' : 'Select county first'}</option>
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
                                <option value="">{filterConstId ? '— All —' : 'Select constituency first'}</option>
                                {wards.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                        {filterCountyId && (
                            <button className="res-btn outline" onClick={clearFilter}
                                style={{ alignSelf: 'flex-end' }}>✕ Clear</button>
                        )}
                    </div>
                    {filterCountyId && (
                        <div className="filter-summary">
                            Showing: {[
                                countyName && `${countyName} County`,
                                constituencyName,
                                wardName && `${wardName} Ward`
                            ].filter(Boolean).join(' · ')}
                            {' · '}{locationRaces.length} race{locationRaces.length !== 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {!filterCountyId && (
                    <div className="location-empty-prompt">
                        <div className="loc-prompt-icon">📍</div>
                        <div className="loc-prompt-title">Select a county to view local race results</div>
                        <div className="loc-prompt-sub">
                            Governor, Senator, Women Rep, MP and MCA results are location-specific.
                            Filter by county to see candidates for that area.
                        </div>
                    </div>
                )}

                {locationRaces.map(pos => (
                    <PositionTable
                        key={pos.positionId}
                        pos={pos}
                        locationLabel={locationLabel(pos.level)}
                        blockchain={blockchain}
                    />
                ))}

                {filterCountyId && !filterConstId && (
                    <div className="drill-hint">Select a constituency above to view MP race results.</div>
                )}
                {filterConstId && !filterWardId && (
                    <div className="drill-hint">Select a ward above to view MCA race results.</div>
                )}

                </>} {/* end chainActive results section */}

                <div className="results-foot">
                    Last updated: {lastUpdated} · Auto-refreshes every 30 seconds ·{' '}
                    {chainActive ? 'Blockchain counts' : 'Blockchain offline'}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminResults;
