import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import '../../styles/admin.css';

// ── Helpers ────────────────────────────────────────────────────
const STATUS_META = {
    pending:           { label: 'Pending',          color: '#f59e0b', bg: '#fffbeb' },
    active:            { label: 'Active',            color: '#006B3F', bg: '#e6f4ed' },
    closed:            { label: 'Closed',            color: '#6b7280', bg: '#f3f4f6' },
    results_published: { label: 'Results Published', color: '#1d4ed8', bg: '#eff6ff' },
};
const sm  = (s) => STATUS_META[s] || { label: s, color: '#888', bg: '#f5f5f5' };
const fmt = (n) => Number(n || 0).toLocaleString();
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const LIFECYCLE_STEPS = [
    { icon: '🕐', title: 'Pending',          desc: 'Election created. Positions & candidates being registered.' },
    { icon: '🟢', title: 'Active / Open',    desc: 'Voting is open. Voters can cast ballots.' },
    { icon: '🔒', title: 'Closed',           desc: 'Voting period ended. Counting in progress.' },
    { icon: '📢', title: 'Results Published', desc: 'Official results are public.' },
];

const btnStyle = (bg, color) => ({
    background: bg, color, border: 'none', borderRadius: 8,
    padding: '7px 14px', fontSize: '0.8rem', fontWeight: 600,
    cursor: 'pointer', transition: 'opacity 0.15s'
});

const labelStyle = {
    display: 'block', fontSize: '0.72rem', fontWeight: 600, color: '#555',
    textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 5
};
const inputStyle = {
    width: '100%', padding: '9px 12px', border: '1.5px solid #ddd',
    borderRadius: 8, fontSize: '0.87rem', color: '#333',
    background: '#fafafa', boxSizing: 'border-box', outline: 'none'
};

// ── Election card ───────────────────────────────────────────────
const ElectionCard = ({ election, registered, onStatusChange, onLock, onViewReport }) => {
    const meta       = sm(election.status);
    const isActive   = election.status === 'active';
    const isClosed   = election.status === 'closed';
    const isPending  = election.status === 'pending';
    const isPublished = election.status === 'results_published';
    const locked     = election.is_locked;
    const turnout    = registered > 0 ? ((election.votes_cast / registered) * 100).toFixed(1) : '0.0';

    return (
        <div style={{
            background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            overflow: 'hidden', marginBottom: 20,
            border: isActive ? '2px solid #006B3F' : '1px solid #e5e7eb'
        }}>
            <div style={{
                background: isActive
                    ? 'linear-gradient(135deg, #003d24, #006B3F)'
                    : isPublished ? 'linear-gradient(135deg, #1e3a8a, #1d4ed8)'
                    : 'linear-gradient(135deg, #1f2937, #374151)',
                padding: '16px 20px', color: '#fff',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                flexWrap: 'wrap', gap: 10
            }}>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{election.name}</div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.75, marginTop: 3 }}>
                        {fmtDate(election.start_date)} → {fmtDate(election.end_date)}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ background: meta.bg, color: meta.color, fontWeight: 700, fontSize: '0.72rem', padding: '4px 12px', borderRadius: 20 }}>
                        {meta.label}
                    </span>
                    {locked && (
                        <span style={{ background: '#fff3cd', color: '#92400e', fontWeight: 700, fontSize: '0.72rem', padding: '4px 10px', borderRadius: 20 }}>
                            🔒 Locked
                        </span>
                    )}
                    {isActive && !locked && (
                        <span style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.7rem', padding: '3px 10px', borderRadius: 20 }}>
                            🟢 Voting Open
                        </span>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))', borderBottom: '1px solid #f0f0f0' }}>
                {[
                    { icon: '🗳️', val: fmt(election.votes_cast),     lbl: 'Votes Cast' },
                    { icon: '📊', val: `${turnout}%`,                lbl: 'Turnout' },
                    { icon: '🏛️', val: fmt(election.position_count), lbl: 'Positions' },
                    { icon: '👥', val: fmt(election.candidate_count), lbl: 'Candidates' },
                ].map(s => (
                    <div key={s.lbl} style={{ padding: '14px 16px', textAlign: 'center', borderRight: '1px solid #f0f0f0' }}>
                        <div style={{ fontSize: '1.1rem' }}>{s.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#111' }}>{s.val}</div>
                        <div style={{ fontSize: '0.68rem', color: '#888', marginTop: 2 }}>{s.lbl}</div>
                    </div>
                ))}
            </div>

            <div style={{ padding: '14px 20px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => onViewReport(election.id)} style={btnStyle('#1f2937', '#fff')}>
                    📊 View Report
                </button>
                {isPending  && <button onClick={() => onStatusChange(election.id, 'active')}            style={btnStyle('#006B3F', '#fff')}>▶ Activate Election</button>}
                {isActive   && <button onClick={() => onStatusChange(election.id, 'closed')}            style={btnStyle('#CE1126', '#fff')}>⏹ Close Voting</button>}
                {isClosed   && <button onClick={() => onStatusChange(election.id, 'results_published')} style={btnStyle('#1d4ed8', '#fff')}>📢 Publish Results</button>}
                {(isActive || isClosed) && (
                    <button onClick={() => onLock(election.id, !locked)} style={btnStyle(locked ? '#006B3F' : '#92400e', '#fff')}>
                        {locked ? '🔓 Unlock Voting' : '🔒 Lock Voting'}
                    </button>
                )}
            </div>
        </div>
    );
};

// ── Election report modal ───────────────────────────────────────
const ElectionReport = ({ electionId, onClose }) => {
    const [report, setReport]   = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!electionId) return;
        api.get(`/elections/${electionId}/report`)
            .then(r => { if (r.data.success) setReport(r.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [electionId]);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
            <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 720, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                <div style={{ background: 'linear-gradient(135deg, #1f2937, #374151)', padding: '16px 24px', borderRadius: '16px 16px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
                        {loading ? 'Loading report…' : report?.election?.name}
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                </div>
                <div style={{ padding: '20px 24px' }}>
                    {loading && <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Loading…</div>}
                    {!loading && report && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                                {[
                                    { icon: '🗳️', val: fmt(report.turnout.voted),       lbl: 'Votes Cast' },
                                    { icon: '👥', val: fmt(report.turnout.registered),  lbl: 'Registered' },
                                    { icon: '📊', val: `${report.turnout.percentage}%`, lbl: 'Turnout' },
                                ].map(s => (
                                    <div key={s.lbl} style={{ background: '#f9fafb', borderRadius: 10, padding: 12, textAlign: 'center', border: '1px solid #e5e7eb' }}>
                                        <div style={{ fontSize: '1.3rem' }}>{s.icon}</div>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111' }}>{s.val}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#888' }}>{s.lbl}</div>
                                    </div>
                                ))}
                            </div>
                            {report.positions.map((pos, i) => {
                                const total = pos.totalVotes;
                                return (
                                    <div key={i} style={{ marginBottom: 18 }}>
                                        <div style={{ background: pos.level === 'national' ? 'linear-gradient(90deg,#003d24,#006B3F)' : pos.level === 'county' ? 'linear-gradient(90deg,#8a000a,#CE1126)' : '#374151', color: '#fff', padding: '8px 14px', borderRadius: '8px 8px 0 0', fontWeight: 600, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{pos.name}</span>
                                            <span style={{ opacity: 0.7, fontSize: '0.72rem' }}>{total.toLocaleString()} votes · {pos.level}</span>
                                        </div>
                                        <div style={{ border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                                            {pos.candidates.map((c, j) => {
                                                const pct  = total > 0 ? Math.round((c.votes / total) * 1000) / 10 : 0;
                                                const lead = j === 0 && c.votes > 0;
                                                return (
                                                    <div key={j} style={{ padding: '9px 14px', background: lead ? '#e6f4ed' : j % 2 === 0 ? '#fff' : '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                                                            <span style={{ fontWeight: lead ? 700 : 500, fontSize: '0.85rem' }}>
                                                                {lead && '🏆 '}{c.name}
                                                                <span style={{ marginLeft: 8, fontSize: '0.65rem', padding: '1px 7px', borderRadius: 10, background: lead ? '#006B3F' : '#e5e7eb', color: lead ? '#fff' : '#555' }}>{c.party}</span>
                                                            </span>
                                                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111' }}>
                                                                {fmt(c.votes)} <span style={{ fontWeight: 400, color: '#888', fontSize: '0.75rem' }}>({pct}%)</span>
                                                            </span>
                                                        </div>
                                                        <div style={{ background: '#e0e0e0', borderRadius: 4, height: 5 }}>
                                                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: lead ? '#006B3F' : '#9ca3af', transition: 'width 0.5s ease' }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {pos.candidates.length === 0 && (
                                                <div style={{ padding: 14, color: '#bbb', fontSize: '0.82rem', textAlign: 'center' }}>No candidates registered.</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {report.positions.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#bbb', padding: '20px 0' }}>No positions recorded for this election.</div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Main shared content (no layout wrapper) ────────────────────
const ElectionManagementContent = () => {
    const [elections, setElections]   = useState([]);
    const [registered, setRegistered] = useState(0);
    const [loading, setLoading]       = useState(true);
    const [statusMsg, setStatusMsg]   = useState({ text: '', type: '' });
    const [reportId, setReportId]     = useState(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating]     = useState(false);
    const [newElection, setNewElection] = useState({ name: '', description: '', startDate: '', endDate: '' });

    const flash = (text, type = 'ok') => {
        setStatusMsg({ text, type });
        setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
    };

    const loadElections = useCallback(async () => {
        setLoading(true);
        try {
            const r = await api.get('/elections/admin/all-stats');
            if (r.data.success) { setElections(r.data.elections); setRegistered(r.data.registered); }
        } catch (err) {
            flash('Failed to load elections: ' + (err.response?.data?.error || err.message), 'err');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadElections(); }, [loadElections]);

    const handleStatusChange = async (id, newStatus) => {
        const labels = { active: 'activate', closed: 'close', results_published: 'publish results for' };
        if (!window.confirm(`Are you sure you want to ${labels[newStatus] || 'update'} this election?`)) return;
        try {
            await api.patch(`/elections/${id}/status`, { status: newStatus });
            flash(`Election ${newStatus === 'active' ? 'activated' : newStatus === 'closed' ? 'closed' : 'results published'} successfully.`);
            loadElections();
        } catch (err) { flash('Status update failed: ' + (err.response?.data?.error || err.message), 'err'); }
    };

    const handleLock = async (id, lock) => {
        try {
            await api.patch(`/elections/${id}/lock`, { locked: lock });
            flash(`Election ${lock ? 'locked' : 'unlocked'} successfully.`);
            loadElections();
        } catch (err) { flash('Lock update failed: ' + (err.response?.data?.error || err.message), 'err'); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newElection.name || !newElection.startDate || !newElection.endDate) {
            flash('Name, start date, and end date are required.', 'err'); return;
        }
        if (new Date(newElection.startDate) >= new Date(newElection.endDate)) {
            flash('Start date must be before end date.', 'err'); return;
        }
        setCreating(true);
        try {
            await api.post('/elections', newElection);
            flash('Election created. Add positions and candidates, then activate it.');
            setShowCreate(false);
            setNewElection({ name: '', description: '', startDate: '', endDate: '' });
            loadElections();
        } catch (err) { flash('Create failed: ' + (err.response?.data?.error || err.message), 'err'); }
        finally { setCreating(false); }
    };

    const activeElection = elections.find(e => e.status === 'active');
    const otherElections = elections.filter(e => e.status !== 'active');

    return (
        <div style={{ padding: 24, maxWidth: 900 }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111', margin: 0 }}>
                        Election Management & Reports
                    </h1>
                    <p style={{ color: '#777', fontSize: '0.82rem', margin: '4px 0 0' }}>
                        Manage elections, lock/unlock voting, and view detailed results reports.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={loadElections} style={{ ...btnStyle('#374151', '#fff'), padding: '8px 16px' }}>
                        ↻ Refresh
                    </button>
                    <button onClick={() => setShowCreate(s => !s)} style={{ ...btnStyle('#006B3F', '#fff'), padding: '8px 16px' }}>
                        {showCreate ? '✕ Cancel' : '＋ New Election'}
                    </button>
                </div>
            </div>

            {/* Flash */}
            {statusMsg.text && (
                <div style={{ padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: '0.87rem', fontWeight: 500, background: statusMsg.type === 'err' ? '#fce8eb' : '#e6f4ed', border: `1px solid ${statusMsg.type === 'err' ? '#f5a0aa' : '#a5d6a7'}`, color: statusMsg.type === 'err' ? '#b71c1c' : '#1b5e20' }}>
                    {statusMsg.type === 'err' ? '❌ ' : '✅ '}{statusMsg.text}
                </div>
            )}

            {/* Create form */}
            {showCreate && (
                <div style={{ background: '#fff', borderRadius: 14, border: '2px dashed #006B3F', padding: 24, marginBottom: 24 }}>
                    <h3 style={{ margin: '0 0 16px', color: '#111', fontSize: '1rem' }}>Create New Election</h3>
                    <form onSubmit={handleCreate}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Election Name *</label>
                                <input style={inputStyle} placeholder="e.g. Kenya General Election 2032" value={newElection.name} onChange={e => setNewElection(p => ({ ...p, name: e.target.value }))} />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={labelStyle}>Description</label>
                                <input style={inputStyle} placeholder="Brief description (optional)" value={newElection.description} onChange={e => setNewElection(p => ({ ...p, description: e.target.value }))} />
                            </div>
                            <div>
                                <label style={labelStyle}>Voting Opens *</label>
                                <input style={inputStyle} type="datetime-local" value={newElection.startDate} onChange={e => setNewElection(p => ({ ...p, startDate: e.target.value }))} />
                            </div>
                            <div>
                                <label style={labelStyle}>Voting Closes *</label>
                                <input style={inputStyle} type="datetime-local" value={newElection.endDate} onChange={e => setNewElection(p => ({ ...p, endDate: e.target.value }))} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button type="submit" disabled={creating} style={{ ...btnStyle('#006B3F', '#fff'), padding: '9px 20px', opacity: creating ? 0.6 : 1 }}>
                                {creating ? 'Creating…' : '＋ Create Election'}
                            </button>
                            <button type="button" onClick={() => setShowCreate(false)} style={{ ...btnStyle('#e5e7eb', '#333'), padding: '9px 20px' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading && <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading elections…</div>}

            {!loading && elections.length === 0 && (
                <div style={{ background: '#fff', borderRadius: 14, padding: '40px 24px', textAlign: 'center', border: '2px dashed #ddd' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🗳️</div>
                    <p style={{ color: '#666', marginBottom: 16 }}>No elections found in the database.</p>
                    <button onClick={() => setShowCreate(true)} style={{ ...btnStyle('#006B3F', '#fff'), padding: '10px 22px' }}>
                        Create First Election
                    </button>
                </div>
            )}

            {activeElection && (
                <>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#006B3F', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 10 }}>
                        🟢 Current Active Election
                    </div>
                    <ElectionCard election={activeElection} registered={registered} onStatusChange={handleStatusChange} onLock={handleLock} onViewReport={setReportId} />
                </>
            )}

            {otherElections.length > 0 && (
                <>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 10, marginTop: activeElection ? 24 : 0 }}>
                        📅 All Elections ({elections.length} total)
                    </div>
                    {otherElections.map(el => (
                        <ElectionCard key={el.id} election={el} registered={registered} onStatusChange={handleStatusChange} onLock={handleLock} onViewReport={setReportId} />
                    ))}
                </>
            )}

            {/* Lifecycle guide */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', marginTop: 8 }}>
                <div style={{ background: 'linear-gradient(90deg, #1f2937, #374151)', padding: '12px 20px', color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>
                    📖 Election Lifecycle Guide
                </div>
                <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12, marginBottom: 16 }}>
                        {LIFECYCLE_STEPS.map((step, i) => (
                            <div key={i} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{step.icon}</div>
                                <div style={{ fontWeight: 700, fontSize: '0.83rem', color: '#111', marginBottom: 4 }}>{i + 1}. {step.title}</div>
                                <div style={{ fontSize: '0.73rem', color: '#666', lineHeight: 1.5 }}>{step.desc}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 16px', fontSize: '0.8rem', color: '#166534', lineHeight: 1.7 }}>
                        <strong>Running a new election:</strong><br />
                        1. Close the current election → 2. Publish its results → 3. Create a new election above →
                        4. Run <code style={{ background: '#dcfce7', padding: '1px 5px', borderRadius: 4 }}>node smart-contracts/scripts/setupElection.js</code> →
                        5. Activate the new election.
                    </div>
                </div>
            </div>

            {reportId && <ElectionReport electionId={reportId} onClose={() => setReportId(null)} />}
        </div>
    );
};

export default ElectionManagementContent;
