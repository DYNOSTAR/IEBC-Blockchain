import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/admin-dashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Data states
    const [counties, setCounties] = useState([]);
    const [constituencies, setConstituencies] = useState([]);
    const [wards, setWards] = useState([]);
    const [pollingStations, setPollingStations] = useState([]);
    const [parties, setParties] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [elections, setElections] = useState([]);
    
    // Form states
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({});
    const [selectedCounty, setSelectedCounty] = useState('');
    const [selectedConstituency, setSelectedConstituency] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const adminData = localStorage.getItem('user');
        
        if (!token || JSON.parse(adminData || '{}').role !== 'admin') {
            navigate('/admin/login');
            return;
        }
        
        setAdmin(JSON.parse(adminData));
        loadAllData();
    }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { Authorization: `Bearer ${token}` };
            
            const [countiesRes, constituenciesRes, partiesRes, electionsRes] = await Promise.all([
                axios.get('http://localhost:5000/api/admin/counties', { headers }),
                axios.get('http://localhost:5000/api/admin/constituencies', { headers }),
                axios.get('http://localhost:5000/api/admin/parties', { headers }),
                axios.get('http://localhost:5000/api/admin/elections', { headers })
            ]);
            
            setCounties(countiesRes.data.counties);
            setConstituencies(constituenciesRes.data.constituencies);
            setParties(partiesRes.data.parties);
            setElections(electionsRes.data.elections);
        } catch (error) {
            console.error('Error loading data:', error);
            showMessage('error', 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            let response;
            
            switch (activeTab) {
                case 'counties':
                    response = await axios.post('http://localhost:5000/api/admin/counties', formData, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    break;
                case 'constituencies':
                    response = await axios.post('http://localhost:5000/api/admin/constituencies', formData, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    break;
                case 'wards':
                    response = await axios.post('http://localhost:5000/api/admin/wards', formData, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    break;
                case 'polling-stations':
                    response = await axios.post('http://localhost:5000/api/admin/polling-stations', formData, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    break;
                case 'parties':
                    response = await axios.post('http://localhost:5000/api/admin/parties', formData, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    break;
                case 'candidates':
                    response = await axios.post('http://localhost:5000/api/admin/candidates', formData, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    break;
                case 'elections':
                    response = await axios.post('http://localhost:5000/api/admin/elections', formData, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    break;
            }
            
            if (response.data.success) {
                showMessage('success', `${getEntityName()} added successfully!`);
                setShowForm(false);
                setFormData({});
                loadAllData();
            }
        } catch (error) {
            showMessage('error', error.response?.data?.error || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    const getEntityName = () => {
        const names = {
            'counties': 'County',
            'constituencies': 'Constituency',
            'wards': 'Ward',
            'polling-stations': 'Polling Station',
            'parties': 'Political Party',
            'candidates': 'Candidate',
            'elections': 'Election'
        };
        return names[activeTab] || 'Item';
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/admin/login');
    };

    const renderForm = () => {
        switch (activeTab) {
            case 'counties':
                return (
                    <div className="form-grid">
                        <div className="form-group">
                            <label>County Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="e.g., Nairobi"
                            />
                        </div>
                        <div className="form-group">
                            <label>County Code *</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code || ''}
                                onChange={(e) => setFormData({...formData, code: e.target.value})}
                                required
                                placeholder="e.g., 001"
                            />
                        </div>
                        <div className="form-group">
                            <label>Headquarters</label>
                            <input
                                type="text"
                                name="headquarters"
                                value={formData.headquarters || ''}
                                onChange={(e) => setFormData({...formData, headquarters: e.target.value})}
                                placeholder="e.g., Nairobi City"
                            />
                        </div>
                        <div className="form-group">
                            <label>Population</label>
                            <input
                                type="number"
                                name="population"
                                value={formData.population || ''}
                                onChange={(e) => setFormData({...formData, population: e.target.value})}
                                placeholder="e.g., 4397073"
                            />
                        </div>
                    </div>
                );
                
            case 'constituencies':
                return (
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Select County *</label>
                            <select
                                value={formData.county_id || ''}
                                onChange={(e) => setFormData({...formData, county_id: e.target.value})}
                                required
                            >
                                <option value="">Select County</option>
                                {counties.map(county => (
                                    <option key={county.id} value={county.id}>{county.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Constituency Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="e.g., Starehe"
                            />
                        </div>
                        <div className="form-group">
                            <label>Constituency Code *</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code || ''}
                                onChange={(e) => setFormData({...formData, code: e.target.value})}
                                required
                                placeholder="e.g., 001"
                            />
                        </div>
                    </div>
                );
                
            case 'wards':
                return (
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Select Constituency *</label>
                            <select
                                value={formData.constituency_id || ''}
                                onChange={(e) => setFormData({...formData, constituency_id: e.target.value})}
                                required
                            >
                                <option value="">Select Constituency</option>
                                {constituencies.map(con => (
                                    <option key={con.id} value={con.id}>{con.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Ward Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="e.g., Kasarani"
                            />
                        </div>
                        <div className="form-group">
                            <label>Ward Code</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code || ''}
                                onChange={(e) => setFormData({...formData, code: e.target.value})}
                                placeholder="e.g., 001"
                            />
                        </div>
                    </div>
                );
                
            case 'polling-stations':
                return (
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Select Ward *</label>
                            <select
                                value={formData.ward_id || ''}
                                onChange={(e) => setFormData({...formData, ward_id: e.target.value})}
                                required
                            >
                                <option value="">Select Ward</option>
                                {wards.map(ward => (
                                    <option key={ward.id} value={ward.id}>{ward.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Polling Station Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="e.g., Kasarani Primary School"
                            />
                        </div>
                        <div className="form-group">
                            <label>Station Code *</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code || ''}
                                onChange={(e) => setFormData({...formData, code: e.target.value})}
                                required
                                placeholder="e.g., PS001"
                            />
                        </div>
                        <div className="form-group">
                            <label>Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location || ''}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                placeholder="Address or landmark"
                            />
                        </div>
                    </div>
                );
                
            case 'parties':
                return (
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Party Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="e.g., United Democratic Alliance"
                            />
                        </div>
                        <div className="form-group">
                            <label>Party Code *</label>
                            <input
                                type="text"
                                name="code"
                                value={formData.code || ''}
                                onChange={(e) => setFormData({...formData, code: e.target.value})}
                                required
                                placeholder="e.g., UDA"
                            />
                        </div>
                        <div className="form-group">
                            <label>Party Symbol</label>
                            <input
                                type="text"
                                name="symbol"
                                value={formData.symbol || ''}
                                onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                                placeholder="e.g., 🟢"
                            />
                        </div>
                        <div className="form-group">
                            <label>Party Color</label>
                            <input
                                type="color"
                                name="color"
                                value={formData.color || '#00A651'}
                                onChange={(e) => setFormData({...formData, color: e.target.value})}
                            />
                        </div>
                    </div>
                );
                
            case 'candidates':
                return (
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Select Election *</label>
                            <select
                                value={formData.election_id || ''}
                                onChange={(e) => setFormData({...formData, election_id: e.target.value})}
                                required
                            >
                                <option value="">Select Election</option>
                                {elections.map(election => (
                                    <option key={election.id} value={election.id}>{election.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Select Position *</label>
                            <select
                                value={formData.position_id || ''}
                                onChange={(e) => setFormData({...formData, position_id: e.target.value})}
                                required
                            >
                                <option value="">Select Position</option>
                                <option value="1">President</option>
                                <option value="2">Governor</option>
                                <option value="3">Senator</option>
                                <option value="4">Member of Parliament</option>
                                <option value="5">Women Representative</option>
                                <option value="6">MCA</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Candidate Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="Full name"
                            />
                        </div>
                        <div className="form-group">
                            <label>Select Party *</label>
                            <select
                                value={formData.party_id || ''}
                                onChange={(e) => setFormData({...formData, party_id: e.target.value})}
                                required
                            >
                                <option value="">Select Party</option>
                                {parties.map(party => (
                                    <option key={party.id} value={party.id}>{party.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Select County (for county positions)</label>
                            <select
                                value={formData.county_id || ''}
                                onChange={(e) => setFormData({...formData, county_id: e.target.value})}
                            >
                                <option value="">Select County (if applicable)</option>
                                {counties.map(county => (
                                    <option key={county.id} value={county.id}>{county.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );
                
            case 'elections':
                return (
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Election Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name || ''}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="e.g., Kenya General Election 2027"
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                rows="3"
                                placeholder="Election description"
                            />
                        </div>
                        <div className="form-group">
                            <label>Start Date *</label>
                            <input
                                type="datetime-local"
                                name="start_date"
                                value={formData.start_date || ''}
                                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>End Date *</label>
                            <input
                                type="datetime-local"
                                name="end_date"
                                value={formData.end_date || ''}
                                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                name="status"
                                value={formData.status || 'upcoming'}
                                onChange={(e) => setFormData({...formData, status: e.target.value})}
                            >
                                <option value="upcoming">Upcoming</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                    </div>
                );
                
            default:
                return null;
        }
    };

    const renderList = () => {
        switch (activeTab) {
            case 'counties':
                return (
                    <table className="data-table">
                        <thead>
                            <tr><th>Code</th><th>County Name</th><th>Headquarters</th><th>Population</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {counties.map(county => (
                                <tr key={county.id}>
                                    <td>{county.code}</td>
                                    <td>{county.name}</td>
                                    <td>{county.headquarters || '-'}</td>
                                    <td>{county.population?.toLocaleString() || '-'}</td>
                                    <td><button className="btn-small">Edit</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
                
            case 'constituencies':
                return (
                    <table className="data-table">
                        <thead><tr><th>County</th><th>Code</th><th>Constituency Name</th><th>Actions</th></tr></thead>
                        <tbody>
                            {constituencies.map(con => (
                                <tr key={con.id}>
                                    <td>{con.county_name}</td>
                                    <td>{con.code}</td>
                                    <td>{con.name}</td>
                                    <td><button className="btn-small">Edit</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
                
            case 'parties':
                return (
                    <table className="data-table">
                        <thead><tr><th>Symbol</th><th>Code</th><th>Party Name</th><th>Color</th><th>Actions</th></tr></thead>
                        <tbody>
                            {parties.map(party => (
                                <tr key={party.id}>
                                    <td>{party.symbol || '🗳️'}</td>
                                    <td>{party.code}</td>
                                    <td>{party.name}</td>
                                    <td><span style={{backgroundColor: party.color, padding: '2px 10px', borderRadius: '4px'}}>{party.color}</span></td>
                                    <td><button className="btn-small">Edit</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
                
            default:
                return <p>Select a category to view data</p>;
        }
    };

    return (
        <div className="admin-dashboard">
            {/* Sidebar */}
            <div className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="admin-logo">🗳️</div>
                    <h3>IEBC Admin</h3>
                    <p>{admin?.name}</p>
                </div>
                
                <nav className="sidebar-nav">
                    <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
                        📊 Dashboard
                    </button>
                    <button className={activeTab === 'counties' ? 'active' : ''} onClick={() => setActiveTab('counties')}>
                        🏛️ Counties (47)
                    </button>
                    <button className={activeTab === 'constituencies' ? 'active' : ''} onClick={() => setActiveTab('constituencies')}>
                        📍 Constituencies (290)
                    </button>
                    <button className={activeTab === 'wards' ? 'active' : ''} onClick={() => setActiveTab('wards')}>
                        🏘️ Wards
                    </button>
                    <button className={activeTab === 'polling-stations' ? 'active' : ''} onClick={() => setActiveTab('polling-stations')}>
                        🏢 Polling Stations
                    </button>
                    <button className={activeTab === 'parties' ? 'active' : ''} onClick={() => setActiveTab('parties')}>
                        🎭 Political Parties
                    </button>
                    <button className={activeTab === 'candidates' ? 'active' : ''} onClick={() => setActiveTab('candidates')}>
                        👥 Candidates
                    </button>
                    <button className={activeTab === 'elections' ? 'active' : ''} onClick={() => setActiveTab('elections')}>
                        📅 Elections
                    </button>
                    <button className={activeTab === 'voters' ? 'active' : ''} onClick={() => setActiveTab('voters')}>
                        👤 Registered Voters
                    </button>
                </nav>
                
                <button onClick={handleLogout} className="logout-btn">
                    🚪 Logout
                </button>
            </div>
            
            {/* Main Content */}
            <div className="admin-main">
                <div className="admin-header">
                    <h1>Election Management System</h1>
                    <p>Manage counties, constituencies, polling stations, parties, and candidates</p>
                </div>
                
                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}
                
                {activeTab !== 'dashboard' && (
                    <div className="section-header">
                        <h2>
                            {activeTab === 'counties' && '🗺️ Manage Counties (47 Counties)'}
                            {activeTab === 'constituencies' && '📍 Manage Constituencies (290 Constituencies)'}
                            {activeTab === 'wards' && '🏘️ Manage Wards'}
                            {activeTab === 'polling-stations' && '🏢 Manage Polling Stations'}
                            {activeTab === 'parties' && '🎭 Manage Political Parties'}
                            {activeTab === 'candidates' && '👥 Manage Candidates'}
                            {activeTab === 'elections' && '📅 Manage Elections'}
                            {activeTab === 'voters' && '👤 Registered Voters'}
                        </h2>
                        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                            {showForm ? 'Cancel' : `+ Add New`}
                        </button>
                    </div>
                )}
                
                {showForm && activeTab !== 'dashboard' && (
                    <div className="form-card">
                        <h3>Add New {getEntityName()}</h3>
                        <form onSubmit={handleSubmit}>
                            {renderForm()}
                            <div className="form-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Saving...' : `Add ${getEntityName()}`}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
                <div className="data-card">
                    {loading && !showForm ? (
                        <div className="loading-spinner"></div>
                    ) : (
                        renderList()
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;