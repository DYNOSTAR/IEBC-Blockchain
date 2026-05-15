import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from '../SuperAdminLayout';
import '../../../styles/super-admin-candidates.css';

const SuperAdminCandidates = () => {
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
    const [selectedPosition, setSelectedPosition] = useState('');
    const [selectedCounty, setSelectedCounty] = useState('');
    
    const [formData, setFormData] = useState({
        election_id: '',
        position_id: '',
        political_party_id: '',
        name: '',
        running_mate: '',  // For presidential candidates
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
        if (selectedPosition) {
            const position = positions.find(p => p.id == selectedPosition);
            if (position) {
                // Reset location fields when position changes
                setFormData(prev => ({
                    ...prev,
                    county_id: '',
                    constituency_id: '',
                    ward_id: ''
                }));
            }
        }
    }, [selectedPosition]);

    useEffect(() => {
        if (selectedCounty) {
            loadConstituencies(selectedCounty);
        }
    }, [selectedCounty]);

    const loadCandidates = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/candidates', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setCandidates(response.data.candidates);
            }
        } catch (error) {
            console.error('Error loading candidates:', error);
            alert('Failed to load candidates');
        } finally {
            setLoading(false);
        }
    };

    const loadParties = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/parties', {
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
            const response = await axios.get('http://localhost:5000/api/super-admin/elections', {
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
            const response = await axios.get('http://localhost:5000/api/super-admin/positions', {
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
            const response = await axios.get('http://localhost:5000/api/super-admin/counties', {
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
            const response = await axios.get(`http://localhost:5000/api/super-admin/constituencies/by-county/${countyId}`, {
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
            const response = await axios.get(`http://localhost:5000/api/super-admin/wards/by-constituency/${constituencyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setWards(response.data.wards);
            }
        } catch (error) {
            console.error('Error loading wards:', error);
        }
    };

    const handlePositionChange = (e) => {
        const positionId = e.target.value;
        setSelectedPosition(positionId);
        setFormData({ ...formData, position_id: positionId, county_id: '', constituency_id: '', ward_id: '' });
        
        // Clear dependent fields
        setConstituencies([]);
        setWards([]);
        setSelectedCounty('');
    };

    const handleCountyChange = (e) => {
        const countyId = e.target.value;
        setSelectedCounty(countyId);
        setFormData({ ...formData, county_id: countyId, constituency_id: '', ward_id: '' });
        setWards([]);
    };

    const handleConstituencyChange = (e) => {
        const constituencyId = e.target.value;
        setFormData({ ...formData, constituency_id: constituencyId, ward_id: '' });
        loadWards(constituencyId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.election_id || !formData.position_id || !formData.name) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Validate location based on position level
        const position = positions.find(p => p.id == formData.position_id);
        if (position) {
            if (position.level === 'county' && !formData.county_id) {
                alert('Please select a county for this position');
                return;
            }
            if (position.level === 'constituency' && !formData.constituency_id) {
                alert('Please select a constituency for this position');
                return;
            }
            if (position.level === 'ward' && !formData.ward_id) {
                alert('Please select a ward for this position');
                return;
            }
        }
        
        try {
            const token = localStorage.getItem('token');
            const url = editingCandidate 
                ? `http://localhost:5000/api/super-admin/candidates/${editingCandidate.id}`
                : 'http://localhost:5000/api/super-admin/candidates';
            const method = editingCandidate ? 'put' : 'post';
            
            const response = await axios[method](url, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                alert(editingCandidate ? 'Candidate updated successfully!' : 'Candidate added successfully!');
                loadCandidates();
                setShowModal(false);
                setEditingCandidate(null);
                resetForm();
            }
        } catch (error) {
            console.error('Error saving candidate:', error);
            alert(error.response?.data?.error || 'Failed to save candidate');
        }
    };

    const resetForm = () => {
        setFormData({
            election_id: '',
            position_id: '',
            political_party_id: '',
            name: '',
            running_mate: '',
            symbol: '',
            description: '',
            county_id: '',
            constituency_id: '',
            ward_id: '',
            is_independent: false
        });
        setSelectedPosition('');
        setSelectedCounty('');
        setConstituencies([]);
        setWards([]);
    };

    const handleEdit = (candidate) => {
        setEditingCandidate(candidate);
        setFormData({
            election_id: candidate.election_id,
            position_id: candidate.position_id,
            political_party_id: candidate.political_party_id || '',
            name: candidate.name,
            running_mate: candidate.running_mate || '',
            symbol: candidate.symbol || '',
            description: candidate.description || '',
            county_id: candidate.county_id || '',
            constituency_id: candidate.constituency_id || '',
            ward_id: candidate.ward_id || '',
            is_independent: candidate.is_independent || false
        });
        setSelectedPosition(candidate.position_id);
        
        if (candidate.county_id) {
            setSelectedCounty(candidate.county_id);
            loadConstituencies(candidate.county_id);
        }
        if (candidate.constituency_id) {
            loadWards(candidate.constituency_id);
        }
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this candidate?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:5000/api/super-admin/candidates/${id}`, {
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

    const getPositionLevel = (positionId) => {
        const position = positions.find(p => p.id == positionId);
        return position ? position.level : '';
    };

    const getLocationName = (candidate) => {
        if (candidate.county_name) return candidate.county_name;
        if (candidate.constituency_name) return candidate.constituency_name;
        if (candidate.ward_name) return candidate.ward_name;
        return 'National';
    };

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="admin-loading">Loading candidates...</div>
            </SuperAdminLayout>
        );
    }

    return (
        <SuperAdminLayout>
            <div className="super-admin-candidates-page">
                <div className="page-header">
                    <div>
                        <h1>👥 Candidates Management</h1>
                        <p>Manage all election candidates (Party-affiliated and Independent)</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add New Candidate
                    </button>
                </div>

                <div className="stats-summary">
                    <div className="stat-box">
                        <span className="stat-number">{candidates.length}</span>
                        <span className="stat-label">Total Candidates</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">{candidates.filter(c => !c.is_independent).length}</span>
                        <span className="stat-label">Party Affiliated</span>
                    </div>
                    <div className="stat-box">
                        <span className="stat-number">{candidates.filter(c => c.is_independent).length}</span>
                        <span className="stat-label">Independent</span>
                    </div>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Position</th>
                                <th>Party</th>
                                <th>Location</th>
                                <th>Symbol</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidates.map((candidate) => (
                                <tr key={candidate.id}>
                                    <td><strong>{candidate.name}</strong></td>
                                    <td>
                                        <span className="position-badge">{candidate.position_name}</span>
                                    </td>
                                    <td>
                                        {candidate.is_independent ? (
                                            <span className="independent-badge">Independent</span>
                                        ) : (
                                            <span className="party-badge" style={{ backgroundColor: candidate.party_color }}>
                                                {candidate.party_name}
                                            </span>
                                        )}
                                    </td>
                                    <td>{getLocationName(candidate)}</td>
                                    <td className="symbol-cell">{candidate.symbol || '🗳️'}</td>
                                    <td>
                                        <span className={`status-badge ${candidate.is_active !== false ? 'active' : 'inactive'}`}>
                                            Active
                                        </span>
                                    </td>
                                    <td>
                                        <button className="edit-btn" onClick={() => handleEdit(candidate)}>✏️</button>
                                        <button className="delete-btn" onClick={() => handleDelete(candidate.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
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
                                    resetForm();
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
                                                <option key={position.id} value={position.id}>{position.name}</option>
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
                                            placeholder="Full name of candidate"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Running Mate (President only)</label>
                                        <input
                                            type="text"
                                            value={formData.running_mate}
                                            onChange={(e) => setFormData({...formData, running_mate: e.target.value})}
                                            placeholder="Deputy President candidate"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
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
                                    <div className="form-group">
                                        <label>Symbol</label>
                                        <input
                                            type="text"
                                            value={formData.symbol}
                                            onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                                            placeholder="e.g., 🟢, 🔴"
                                        />
                                    </div>
                                </div>

                                {/* Location fields based on position level */}
                                {getPositionLevel(formData.position_id) === 'county' && (
                                    <div className="form-group">
                                        <label>County *</label>
                                        <select
                                            value={formData.county_id}
                                            onChange={handleCountyChange}
                                            required
                                        >
                                            <option value="">Select County</option>
                                            {counties.map(county => (
                                                <option key={county.id} value={county.id}>{county.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {getPositionLevel(formData.position_id) === 'constituency' && (
                                    <>
                                        <div className="form-group">
                                            <label>County *</label>
                                            <select
                                                value={formData.county_id}
                                                onChange={handleCountyChange}
                                                required
                                            >
                                                <option value="">Select County</option>
                                                {counties.map(county => (
                                                    <option key={county.id} value={county.id}>{county.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Constituency *</label>
                                            <select
                                                value={formData.constituency_id}
                                                onChange={handleConstituencyChange}
                                                disabled={!formData.county_id}
                                                required
                                            >
                                                <option value="">Select Constituency</option>
                                                {constituencies.map(constituency => (
                                                    <option key={constituency.id} value={constituency.id}>{constituency.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {getPositionLevel(formData.position_id) === 'ward' && (
                                    <>
                                        <div className="form-group">
                                            <label>County *</label>
                                            <select
                                                value={formData.county_id}
                                                onChange={handleCountyChange}
                                                required
                                            >
                                                <option value="">Select County</option>
                                                {counties.map(county => (
                                                    <option key={county.id} value={county.id}>{county.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Constituency *</label>
                                            <select
                                                value={formData.constituency_id}
                                                onChange={handleConstituencyChange}
                                                disabled={!formData.county_id}
                                                required
                                            >
                                                <option value="">Select Constituency</option>
                                                {constituencies.map(constituency => (
                                                    <option key={constituency.id} value={constituency.id}>{constituency.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Ward *</label>
                                            <select
                                                value={formData.ward_id}
                                                onChange={(e) => setFormData({...formData, ward_id: e.target.value})}
                                                disabled={!formData.constituency_id}
                                                required
                                            >
                                                <option value="">Select Ward</option>
                                                {wards.map(ward => (
                                                    <option key={ward.id} value={ward.id}>{ward.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div className="form-group">
                                    <label>Description / Bio</label>
                                    <textarea
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        placeholder="Candidate's background, achievements, manifesto..."
                                    />
                                </div>

                                <div className="form-group checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_independent}
                                            onChange={(e) => setFormData({...formData, is_independent: e.target.checked, political_party_id: ''})}
                                        />
                                        <span>Independent Candidate (No party affiliation)</span>
                                    </label>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => {
                                        setShowModal(false);
                                        setEditingCandidate(null);
                                        resetForm();
                                    }}>Cancel</button>
                                    <button type="submit" className="submit-btn">{editingCandidate ? 'Update' : 'Add Candidate'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminCandidates;