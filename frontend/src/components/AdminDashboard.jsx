import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [stats] = useState({
        totalVotes: 3321,
        registeredVoters: 22456789,
        pollingStations: 46229,
        blockchainNodes: 157
    });
    const [candidates] = useState([
        {
            id: 1,
            name: 'John Kipchoge',
            party: 'Democratic Alliance',
            votes: 1245,
            percentage: 37.5
        },
        {
            id: 2,
            name: 'Mary Wanjiru',
            party: 'Progressive Movement',
            votes: 1089,
            percentage: 32.8
        },
        {
            id: 3,
            name: 'Ahmed Hassan',
            party: 'Unity Coalition',
            votes: 987,
            percentage: 29.7
        }
    ]);
    const [electionStatus, setElectionStatus] = useState('ongoing');

    useEffect(() => {
        const adminData = localStorage.getItem('admin');
        if (adminData) {
            setAdmin(JSON.parse(adminData));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('admin');
        localStorage.removeItem('role');
        navigate('/');
    };

    const endElection = async () => {
        if (window.confirm('Are you sure you want to end the election? This cannot be undone.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.post(
                    'http://localhost:5000/api/elections/end',
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                setElectionStatus('ended');
                alert('Election ended successfully');
            } catch (error) {
                alert('Error ending election: ' + error.message);
            }
        }
    };

    if (!admin) {
        return <div className="text-center mt-10">Loading admin information...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Navigation */}
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">🛡️ IEBC Admin Dashboard</h1>
                        <p className="text-gray-600 text-sm">Election Management System</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-700">{admin.name}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto p-6">
                {/* Status Alert */}
                <div className={`rounded-lg p-4 mb-6 text-white ${electionStatus === 'ongoing' ? 'bg-green-600' : 'bg-gray-600'}`}>
                    <p className="font-bold text-lg">
                        {electionStatus === 'ongoing' ? '🟢 Election In Progress' : '🔴 Election Ended'}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-gray-600 text-sm mb-2">Total Votes Cast</p>
                        <p className="text-4xl font-bold text-blue-600">{stats.totalVotes.toLocaleString()}</p>
                        <p className="text-gray-500 text-xs mt-2">Real-time count</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-gray-600 text-sm mb-2">Registered Voters</p>
                        <p className="text-4xl font-bold text-green-600">{(stats.registeredVoters / 1000000).toFixed(1)}M</p>
                        <p className="text-gray-500 text-xs mt-2">Nationwide</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-gray-600 text-sm mb-2">Polling Stations</p>
                        <p className="text-4xl font-bold text-purple-600">{stats.pollingStations.toLocaleString()}</p>
                        <p className="text-gray-500 text-xs mt-2">Active stations</p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <p className="text-gray-600 text-sm mb-2">Blockchain Nodes</p>
                        <p className="text-4xl font-bold text-orange-600">{stats.blockchainNodes}</p>
                        <p className="text-gray-500 text-xs mt-2">Distributed network</p>
                    </div>
                </div>

                {/* Results Section */}
                <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Live Results</h2>
                    <div className="space-y-6">
                        {candidates.map((candidate) => (
                            <div key={candidate.id}>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-800">{candidate.name}</h3>
                                    <span className="text-blue-600 font-bold">{candidate.votes.toLocaleString()} votes ({candidate.percentage}%)</span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-8 overflow-hidden">
                                    <div
                                        className="bg-blue-600 h-full flex items-center justify-end pr-3 text-white font-bold transition-all duration-500"
                                        style={{ width: `${candidate.percentage}%` }}
                                    >
                                        {candidate.percentage > 15 && `${candidate.percentage}%`}
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mt-1">{candidate.party}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Election Management</h3>
                        <button
                            onClick={endElection}
                            disabled={electionStatus === 'ended'}
                            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 font-semibold"
                        >
                            {electionStatus === 'ongoing' ? 'End Election' : 'Election Ended'}
                        </button>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">System Health</h3>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-700">✅ Database: Connected</p>
                            <p className="text-sm text-gray-700">✅ Blockchain: Synced</p>
                            <p className="text-sm text-gray-700">✅ API: Responsive</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Security Status</h3>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-700">🔒 Votes Encrypted: Yes</p>
                            <p className="text-sm text-gray-700">🔗 Blockchain: Immutable</p>
                            <p className="text-sm text-gray-700">✓ Audit Trail: Active</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-gray-600 text-sm">
                    <p>IEBC Blockchain Voting System v1.0</p>
                    <p>2027 General Election | Secure & Transparent</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
