import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import '../../../styles/admin-management.css';

const VotersManagement = () => {
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredVoters, setFilteredVoters] = useState([]);
    const [selectedCounty, setSelectedCounty] = useState('');
    const [counties, setCounties] = useState([]);

    useEffect(() => {
        loadVoters();
        loadCounties();
    }, []);

    useEffect(() => {
        let filtered = [...voters];
        
        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(voter => 
                voter.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                voter.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                voter.national_id?.includes(searchTerm) ||
                voter.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Filter by county
        if (selectedCounty) {
            filtered = filtered.filter(voter => voter.county_id === parseInt(selectedCounty));
        }
        
        setFilteredVoters(filtered);
    }, [searchTerm, selectedCounty, voters]);

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

    const loadVoters = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/admin/voters', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setVoters(response.data.voters);
                setFilteredVoters(response.data.voters);
            }
        } catch (error) {
            console.error('Error loading voters:', error);
        } finally {
            setLoading(false);
        }
    };

    const getVerificationBadge = (voter) => {
        if (voter.is_verified) {
            return <span className="status-badge verified">✓ Verified</span>;
        } else if (voter.id_card_image || voter.face_image) {
            return <span className="status-badge partial">⏳ Partial</span>;
        } else {
            return <span className="status-badge pending">⚠️ Pending</span>;
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="admin-loading">Loading voters...</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="management-page">
                <div className="page-header">
                    <div>
                        <h2>Voters Management</h2>
                        <p>View all registered voters</p>
                    </div>
                </div>

                <div className="filters-section">
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search by name, ID, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filter-select">
                        <select
                            value={selectedCounty}
                            onChange={(e) => setSelectedCounty(e.target.value)}
                            className="county-filter"
                        >
                            <option value="">All Counties</option>
                            {counties.map(county => (
                                <option key={county.id} value={county.id}>{county.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="data-table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>National ID</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>County</th>
                                <th>Constituency</th>
                                <th>Ward</th>
                                <th>Verification</th>
                                <th>Voted</th>
                                <th>Registered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVoters.length === 0 ? (
                                <tr>
                                    <td colSpan="10" style={{ textAlign: 'center' }}>No voters found</td>
                                </tr>
                            ) : (
                                filteredVoters.map((voter) => (
                                    <tr key={voter.id}>
                                        <td>{voter.national_id}</td>
                                        <td><strong>{voter.first_name} {voter.last_name}</strong></td>
                                        <td>{voter.email || '-'}</td>
                                        <td>{voter.phone || '-'}</td>
                                        <td>{voter.county_name || '-'}</td>
                                        <td>{voter.constituency_name || '-'}</td>
                                        <td>{voter.ward_name || '-'}</td>
                                        <td>{getVerificationBadge(voter)}</td>
                                        <td>
                                            <span className={`status-badge ${voter.has_voted ? 'voted' : 'not-voted'}`}>
                                                {voter.has_voted ? '✓ Voted' : 'Not Voted'}
                                            </span>
                                        </td>
                                        <td>{new Date(voter.registered_at || voter.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="stats-summary">
                    <div className="stat-item">
                        <span className="stat-label">Total Registered Voters:</span>
                        <span className="stat-value">{voters.length.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Verified:</span>
                        <span className="stat-value verified">{voters.filter(v => v.is_verified).length.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Voted:</span>
                        <span className="stat-value voted">{voters.filter(v => v.has_voted).length.toLocaleString()}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Pending Verification:</span>
                        <span className="stat-value pending">{voters.filter(v => !v.is_verified && !v.id_card_image && !v.face_image).length.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default VotersManagement;