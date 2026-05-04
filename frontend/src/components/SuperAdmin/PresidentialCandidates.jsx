import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from './SuperAdminLayout';
import '../../styles/super-admin.css';

const PresidentialCandidates = () => {
    const [candidates, setCandidates] = useState([]);
    const [parties, setParties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        party_id: '',
        running_mate: '',
        running_mate_party: '',
        symbol: '',
        slogan: '',
        manifesto: '',
        is_independent: false
    });

    useEffect(() => {
        loadCandidates();
        loadParties();
    }, []);

    const loadCandidates = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/presidential-candidates', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setCandidates(response.data.candidates);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/super-admin/presidential-candidates', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            loadCandidates();
            setShowModal(false);
            setFormData({
                name: '',
                party_id: '',
                running_mate: '',
                running_mate_party: '',
                symbol: '',
                slogan: '',
                manifesto: '',
                is_independent: false
            });
        } catch (error) {
            console.error('Error creating candidate:', error);
        }
    };

    if (loading) return <div className="admin-loading">Loading...</div>;

    return (
        <SuperAdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <div>
                        <h2>Presidential Candidates</h2>
                        <p>Manage presidential candidates for the 2027 election</p>
                    </div>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        + Add Presidential Candidate
                    </button>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Candidate Name</th>
                                <th>Party</th>
                                <th>Running Mate</th>
                                <th>Slogan</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {candidates.map((candidate) => (
                                <tr key={candidate.id}>
                                    <td style={{ fontSize: '1.5rem' }}>{candidate.symbol}</td>
                                    <td><strong>{candidate.name}</strong></td>
                                    <td>
                                        <span style={{ color: candidate.party_color }}>
                                            {candidate.party_name}
                                        </span>
                                    </td>
                                    <td>{candidate.running_mate}</td>
                                    <td>{candidate.slogan}</td>
                                    <td>
                                        <span className={`status-badge ${candidate.status === 'active' ? 'active' : 'inactive'}`}>
                                            {candidate.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="edit-btn">✏️</button>
                                        <button className="delete-btn">🗑️</button>
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
                                <h3>Add Presidential Candidate</h3>
                                <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <form onSubmit={handleSubmit}>
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
                                            value={formData.party_id}
                                            onChange={(e) => setFormData({...formData, party_id: e.target.value})}
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
                                        <label>Running Mate *</label>
                                        <input
                                            type="text"
                                            value={formData.running_mate}
                                            onChange={(e) => setFormData({...formData, running_mate: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Running Mate Party</label>
                                        <input
                                            type="text"
                                            value={formData.running_mate_party}
                                            onChange={(e) => setFormData({...formData, running_mate_party: e.target.value})}
                                        />
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
                                        <label>Independent Candidate</label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_independent}
                                                onChange={(e) => setFormData({...formData, is_independent: e.target.checked})}
                                            />
                                            Yes, independent candidate
                                        </label>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Slogan</label>
                                    <input
                                        type="text"
                                        value={formData.slogan}
                                        onChange={(e) => setFormData({...formData, slogan: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Manifesto</label>
                                    <textarea
                                        rows="4"
                                        value={formData.manifesto}
                                        onChange={(e) => setFormData({...formData, manifesto: e.target.value})}
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="submit-btn">Add Candidate</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
};

export default PresidentialCandidates;