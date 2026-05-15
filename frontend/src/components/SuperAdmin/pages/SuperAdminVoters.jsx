import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SuperAdminLayout from '../SuperAdminLayout';
import '../../../styles/super-admin-voters.css';

const SuperAdminVoters = () => {
    const [voters, setVoters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredVoters, setFilteredVoters] = useState([]);
    const [selectedCounty, setSelectedCounty] = useState('');
    const [selectedConstituency, setSelectedConstituency] = useState('');
    const [counties, setCounties] = useState([]);
    const [constituencies, setConstituencies] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        voted: 0,
        notVoted: 0,
        verified: 0,
        notVerified: 0
    });

    useEffect(() => {
        loadVoters();
        loadCounties();
    }, []);

    useEffect(() => {
        filterVoters();
    }, [searchTerm, selectedCounty, selectedConstituency, voters]);

    const loadVoters = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/super-admin/voters', {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (response.data.success) {
                setVoters(response.data.voters);
                calculateStats(response.data.voters);
            }
        } catch (error) {
            console.error('Error loading voters:', error);
            alert('Failed to load voters data');
        } finally {
            setLoading(false);
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

    const calculateStats = (votersList) => {
        const total = votersList.length;
        const voted = votersList.filter(v => v.has_voted).length;
        const notVoted = total - voted;
        const verified = votersList.filter(v => v.is_verified).length;
        const notVerified = total - verified;
        
        setStats({ total, voted, notVoted, verified, notVerified });
    };

    const filterVoters = () => {
        let filtered = [...voters];
        
        if (searchTerm) {
            filtered = filtered.filter(voter => 
                voter.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                voter.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                voter.national_id?.includes(searchTerm) ||
                voter.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                voter.phone?.includes(searchTerm)
            );
        }
        
        if (selectedCounty) {
            filtered = filtered.filter(voter => voter.county_id == selectedCounty);
        }
        
        if (selectedConstituency) {
            filtered = filtered.filter(voter => voter.constituency_id == selectedConstituency);
        }
        
        setFilteredVoters(filtered);
    };

    const handleCountyChange = (e) => {
        const countyId = e.target.value;
        setSelectedCounty(countyId);
        setSelectedConstituency('');
        if (countyId) {
            loadConstituencies(countyId);
        } else {
            setConstituencies([]);
        }
    };

    const exportToCSV = () => {
        const headers = ['National ID', 'First Name', 'Last Name', 'Email', 'Phone', 'County', 'Constituency', 'Ward', 'Voted', 'Verified', 'Registration Date'];
        const csvData = filteredVoters.map(voter => [
            voter.national_id,
            voter.first_name,
            voter.last_name,
            voter.email || '',
            voter.phone || '',
            voter.county_name || '',
            voter.constituency_name || '',
            voter.ward_name || '',
            voter.has_voted ? 'Yes' : 'No',
            voter.is_verified ? 'Yes' : 'No',
            new Date(voter.registered_at).toLocaleDateString()
        ]);
        
        const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voters_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <SuperAdminLayout>
                <div className="admin-loading">Loading voters data...</div>
            </SuperAdminLayout>
        );
    }

    return (
        <SuperAdminLayout>
            <div className="super-admin-voters-page">
                <div className="page-header">
                    <div>
                        <h1>👤 Voters Data Management</h1>
                        <p>View and manage all registered voters (Super Admin - Country Level)</p>
                    </div>
                    <button className="export-btn" onClick={exportToCSV}>
                        📥 Export to CSV
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="stats-grid">
                    <div className="stat-card total">
                        <div className="stat-icon">👥</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.total.toLocaleString()}</div>
                            <div className="stat-title">Total Voters</div>
                        </div>
                    </div>
                    <div className="stat-card voted">
                        <div className="stat-icon">🗳️</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.voted.toLocaleString()}</div>
                            <div className="stat-title">Voted</div>
                            <div className="stat-percent">{stats.total ? Math.round((stats.voted / stats.total) * 100) : 0}%</div>
                        </div>
                    </div>
                    <div className="stat-card not-voted">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.notVoted.toLocaleString()}</div>
                            <div className="stat-title">Not Voted Yet</div>
                            <div className="stat-percent">{stats.total ? Math.round((stats.notVoted / stats.total) * 100) : 0}%</div>
                        </div>
                    </div>
                    <div className="stat-card verified">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.verified.toLocaleString()}</div>
                            <div className="stat-title">Verified</div>
                        </div>
                    </div>
                    <div className="stat-card not-verified">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-info">
                            <div className="stat-value">{stats.notVerified.toLocaleString()}</div>
                            <div className="stat-title">Not Verified</div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-section">
                    <div className="filter-group">
                        <label>Search</label>
                        <input
                            type="text"
                            placeholder="Search by name, ID, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <div className="filter-group">
                        <label>County</label>
                        <select value={selectedCounty} onChange={handleCountyChange}>
                            <option value="">All Counties</option>
                            {counties.map(county => (
                                <option key={county.id} value={county.id}>{county.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Constituency</label>
                        <select 
                            value={selectedConstituency} 
                            onChange={(e) => setSelectedConstituency(e.target.value)}
                            disabled={!selectedCounty}
                        >
                            <option value="">All Constituencies</option>
                            {constituencies.map(constituency => (
                                <option key={constituency.id} value={constituency.id}>{constituency.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Records Found</label>
                        <div className="record-count">{filteredVoters.length} voters</div>
                    </div>
                </div>

                {/* Voters Table */}
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
                                <th>Voted</th>
                                <th>Verified</th>
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
                                        <td>
                                            <span className={`status-badge ${voter.has_voted ? 'voted' : 'not-voted'}`}>
                                                {voter.has_voted ? '✓ Voted' : 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${voter.is_verified ? 'verified' : 'pending'}`}>
                                                {voter.is_verified ? 'Verified' : 'Pending'}
                                            </span>
                                        </td>
                                        <td>{new Date(voter.registered_at).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </SuperAdminLayout>
    );
};

export default SuperAdminVoters;