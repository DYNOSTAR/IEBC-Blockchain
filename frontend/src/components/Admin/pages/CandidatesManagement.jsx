import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import '../../../styles/admin-management.css';

const CandidatesManagement = () => {
    const [candidates, setCandidates] = useState([]);
    const [parties, setParties] = useState([]);
    const [elections, setElections] = useState([]);
    const [positions, setPositions] = useState([]);
    const [counties, setCounties] = useState([]);
    const [constituencies, setConstituencies] = useState([]);
    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCandidate, setEditingCandidate] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCandidates, setFilteredCandidates] = useState([]);
    
    const [formData, setFormData] = useState({
        election_id: '',
        position_id: '',
        political_party_id: '',
        name: '',
        symbol: '',
        description: '',
        county_id: '',
        constituency_id: '',
        ward_id: '',
        is_independent: false
    });

    useEffect(() => {
        loadCandidates();
        loadParties();
        loadElections();
        loadPositions();
        loadCounties();
    }, []);

    useEffect(() => {
        const filtered = candidates.filter(candidate => 
            candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            candidate.party_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            candidate.position_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCandidates(filtered);
    }, [searchTerm, candidates]);

    const loadCandidates = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/candidates', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setCandidates(response.data.candidates);
                setFilteredCandidates(response.data.candidates);
            }
        } catch (error) {
            console.error('Error loading candidates:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadParties = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/parties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setParties(response.data.parties);
            }
        } catch (error) {
            console.error('Error loading parties:', error);
        }
    };

    const loadElections = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/elections', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setElections(response.data.elections);
            }
        } catch (error) {
            console.error('Error loading elections:', error);
        }
    };

    const loadPositions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/positions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setPositions(response.data.positions);
            }
        } catch (error) {
            console.error('Error loading positions:', error);
        }
    };

    const loadCounties = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/counties', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setCounties(response.data.counties);
            }
        } catch (error) {
            console.error('Error loading counties:', error);
        }
    };

    const loadConstituencies = async (countyId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/admin/constituencies/county/${countyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setConstituencies(response.data.constituencies);
            }
        } catch (error) {
            console.error('Error loading constituencies:', error);
        }
    };

    const loadWards = async (constituencyId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5000/api/admin/wards/constituency/${constituencyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setWards(response.data.wards);
            }
        } catch (error) {
            console.error('Error loading wards:', error);
        }
    };

    const handlePositionChange = async (e) => {
        const positionId = e.target.value;
        setFormData({ ...formData, position_id: positionId });
        
        // Reset location fields when position changes
        setFormData(prev => ({ ...prev, county_id: '', constituency_id: '', ward_id: '' }));
        setConstituencies([]);
        setWards([]);
    };

    const handleCountyChange = async (e) => {
        const countyId = e.target.value;
        setFormData({ ...formData, county_id: countyId, constituency_id: '', ward_id: '' });
        if (countyId) {
            await loadConstituencies(countyId);
        } else {
            setConstituencies([]);
            setWards([]);
        }
    };

    const handleConstituencyChange = async (e) => {
        const constituencyId = e.target.value;
        setFormData({ ...formData, constituency_id: constituencyId, ward_id: '' });
        if (constituencyId) {
            await loadWards(constituencyId);
        } else {
            setWards([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const url = editingCandidate 
                ? `http://localhost:5000/api/admin/candidates/${editingCandidate.id}`
                : 'http://localhost:5000/api/admin/candidates';
            const method = editingCandidate ? 'put' : 'post';
            
            const response = await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                alert(editingCandidate ? 'Candidate updated successfully!' : 'Candidate added successfully!');
                loadCandidates();
                setShowModal(false);
                setEditingCandidate(null);
                setFormData({
                    election_id: '',
                    position_id: '',
                    political_party_id: '',
                    name: '',
                    symbol: '',
                    description: '',
                    county_id: '',
                    constituency_id: '',
                    ward_id: '',
                    is_independent: false
                });
            }
        } catch (error) {
            console.error('Error saving candidate:', error);
            alert(error.response?.data?.error || 'Failed to save candidate');
        }
    };

    const handleEdit = (candidate) => {
        setEditingCandidate(candidate);
        setFormData({
            election_id: candidate.election_id,
            position_id: candidate.position_id,
            political_party_id: candidate.political_party_id,
            name: candidate.name,
            symbol: candidate.symbol || '',
            description: candidate.description || '',
            county_id: candidate.county_id || '',
            constituency_id: candidate.constituency_id || '',
            ward_id: candidate.ward_id || '',
            is_independent: candidate.is_independent || false
        });
        
        // Load dependent data if needed
        if (candidate.county_id) {
            loadConstituencies(candidate.county_id);
            if (candidate.constituency_id) {
                loadWards(candidate.constituency_id);
            }
        }
        
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this candidate?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/admin/candidates/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                alert('Candidate deleted successfully!');
                loadCandidates();
            } catch (error) {
                console.error('Error deleting candidate:', error);
                alert('Failed to delete candidate');
            }
        }
    };

    const getPositionLevel = (positionName) => {
        if (positionName === 'President of Kenya') return 'national';
        if (['County Governor', 'Senator', 'Women Representative'].includes(positionName)) return 'county';
        if (positionName === 'Member of Parliament') return 'constituency';
        if (positionName === 'Member of County Assembly') return 'ward';
        return 'unknown';
    };

    const showLocationFields = (positionName) => {
        const level = getPositionLevel(positionName);
        return level === 'county' || level === 'constituency' || level === 'ward';
    };

    const getPosition = (positionId) => {
        return positions.find(p => p.id === positionId);
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-loading">Loading candidates...</div>
            </AdminLayout>
        );
    }

    const currentPosition = getPosition(formData.position_id);
    const positionLevel = currentPosition ? getPositionLevel(currentPosition.name) : 'unknown';

    return (
        <AdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <div>
                        <h2>Candidates Management</h2>
                        <p>Manage all election candidates</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add New Candidate
                    </button>
                </div>

                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search by name, party, or position..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Party</th>
                                <th>Position</th>
                                <th>Election</th>
                                <th>Symbol</th>
                                <th>Location</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCandidates.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center' }}>No candidates found</td>
                                </tr>
                            ) : (
                                filteredCandidates.map((candidate) => (
                                    <tr key={candidate.id}>
                                        <td><strong>{candidate.name}</strong></td>
                                        <td>
                                            <span style={{ color: candidate.party_color }}>
                                                {candidate.party_name || (candidate.is_independent ? 'Independent' : '-')}
                                            </span>
                                        </td>
                                        <td>{candidate.position_name}</td>
                                        <td>{candidate.election_name}</td>
                                        <td style={{ fontSize: '1.2rem' }}>{candidate.symbol || '🗳️'}</td>
                                        <td>
                                            {candidate.county_name && <span>{candidate.county_name}</span>}
                                            {candidate.constituency_name && <span> / {candidate.constituency_name}</span>}
                                            {candidate.ward_name && <span> / {candidate.ward_name}</span>}
                                            {!candidate.county_name && !candidate.constituency_name && !candidate.ward_name && <span>National</span>}
                                        </td>
                                        <td>
                                            <span className="status-badge active">Active</span>
                                        </td>
                                        <td>
                                            <button className="edit-btn" onClick={() => handleEdit(candidate)}>✏️</button>
                                            <button className="delete-btn" onClick={() => handleDelete(candidate.id)}>🗑️</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content large">
                            <div className="modal-header">
                                <h3>{editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}</h3>
                                <button className="close-modal" onClick={() => {
                                    setShowModal(false);
                                    setEditingCandidate(null);
                                }}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Election *</label>
                                        <select
                                            value={formData.election_id}
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
                                        <label>Position *</label>
                                        <select
                                            value={formData.position_id}
                                            onChange={handlePositionChange}
                                            required
                                        >
                                            <option value="">Select Position</option>
                                            {positions.map(position => (
                                                <option key={position.id} value={position.id}>{position.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Candidate Name *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Political Party</label>
                                        <select
                                            value={formData.political_party_id}
                                            onChange={(e) => setFormData({...formData, political_party_id: e.target.value})}
                                            disabled={formData.is_independent}
                                        >
                                            <option value="">Select Party</option>
                                            {parties.map(party => (
                                                <option key={party.id} value={party.id}>{party.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Symbol</label>
                                        <input
                                            type="text"
                                            value={formData.symbol}
                                            onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                                            placeholder="e.g., 🟢"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_independent}
                                                onChange={(e) => setFormData({...formData, is_independent: e.target.checked})}
                                            />
                                            Independent Candidate
                                        </label>
                                    </div>
                                </div>

                                {showLocationFields(currentPosition?.title) && (
                                    <>
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label>County</label>
                                                <select
                                                    value={formData.county_id}
                                                    onChange={handleCountyChange}
                                                >
                                                    <option value="">Select County</option>
                                                    {counties.map(county => (
                                                        <option key={county.id} value={county.id}>{county.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            {positionLevel === 'constituency' || positionLevel === 'ward' ? (
                                                <div className="form-group">
                                                    <label>Constituency</label>
                                                    <select
                                                        value={formData.constituency_id}
                                                        onChange={handleConstituencyChange}
                                                        disabled={!formData.county_id}
                                                    >
                                                        <option value="">Select Constituency</option>
                                                        {constituencies.map(con => (
                                                            <option key={con.id} value={con.id}>{con.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : null}
                                        </div>

                                        {positionLevel === 'ward' && (
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Ward</label>
                                                    <select
                                                        value={formData.ward_id}
                                                        onChange={(e) => setFormData({...formData, ward_id: e.target.value})}
                                                        disabled={!formData.constituency_id}
                                                    >
                                                        <option value="">Select Ward</option>
                                                        {wards.map(ward => (
                                                            <option key={ward.id} value={ward.id}>{ward.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="form-group">
                                    <label>Description / Bio</label>
                                    <textarea
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => {
                                        setShowModal(false);
                                        setEditingCandidate(null);
                                    }}>Cancel</button>
                                    <button type="submit" className="submit-btn">
                                        {editingCandidate ? 'Update' : 'Add'} Candidate
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default CandidatesManagement;