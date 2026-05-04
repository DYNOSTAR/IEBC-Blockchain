import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../AdminLayout';
import '../../../styles/admin-management.css';

const VotersManagement = () => {
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredVoters, setFilteredVoters] = useState([]);

    useEffect(() => {
        loadVoters();
    }, []);

    useEffect(() => {
        const filtered = voters.filter(voter => 
            voter.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            voter.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            voter.national_id?.includes(searchTerm) ||
            voter.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredVoters(filtered);
    }, [searchTerm, voters]);

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

                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search by name, ID, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
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
                                <th>Polling Station</th>
                                <th>Voted</th>
                                <th>Registered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVoters.map((voter) => (
                                <tr key={voter.id}>
                                    <td>{voter.national_id}</td>
                                    <td>{voter.first_name} {voter.last_name}</td>
                                    <td>{voter.email || '-'}</td>
                                    <td>{voter.phone || '-'}</td>
                                    <td>{voter.county_name || '-'}</td>
                                    <td>{voter.constituency_name || '-'}</td>
                                    <td>{voter.polling_station_name || '-'}</td>
                                    <td>
                                        <span className={`status-badge ${voter.has_voted ? 'active' : 'inactive'}`}>
                                            {voter.has_voted ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td>{new Date(voter.registered_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="stats-summary">
                    <p>Total Registered Voters: <strong>{voters.length.toLocaleString()}</strong></p>
                    <p>Voted: <strong>{voters.filter(v => v.has_voted).length.toLocaleString()}</strong></p>
                    <p>Pending: <strong>{voters.filter(v => !v.has_voted).length.toLocaleString()}</strong></p>
                </div>
            </div>
        </AdminLayout>
    );
};

export default VotersManagement;