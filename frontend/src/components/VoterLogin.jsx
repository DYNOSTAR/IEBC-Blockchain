import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/main.css';
import '../styles/voter-login.css';

const VoterLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nationalId: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showVerification, setShowVerification] = useState(false);
    const [verificationData, setVerificationData] = useState(null);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:5000/api/auth/voter/login', {
                nationalId: formData.nationalId,
                password: formData.password
            });

            if (response.data.success) {
                // Store token and voter info
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('voter', JSON.stringify(response.data.voter));
                localStorage.setItem('role', 'voter');
                
                // Navigate to voting dashboard
                navigate('/voting');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyRegistration = async () => {
        if (!formData.nationalId) {
            setError('Please enter your National ID to verify');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/auth/verify-voter', {
                nationalId: formData.nationalId
            });
            setVerificationData(response.data);
            setShowVerification(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Voter not found');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
                <div className="text-center mb-8">
                    <div className="text-4xl mb-3">🗳️</div>
                    <h1 className="text-2xl font-bold text-gray-800">Voter Login</h1>
                    <p className="text-gray-600 mt-2">Access your voting dashboard</p>
                </div>

                {!showVerification ? (
                    <>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    National ID Number
                                </label>
                                <input
                                    type="text"
                                    name="nationalId"
                                    value={formData.nationalId}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    placeholder="e.g., 12345678"
                                    required
                                />
                            </div>

                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                            >
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">or</span>
                                </div>
                            </div>

                            <button
                                onClick={handleVerifyRegistration}
                                className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                            >
                                Verify Registration Status
                            </button>
                        </div>
                    </>
                ) : (
                    <div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold text-green-800 mb-2">Voter Verification Result</h3>
                            <div className="space-y-2 text-sm">
                                <p><span className="font-semibold">Name:</span> {verificationData?.fullName}</p>
                                <p><span className="font-semibold">National ID:</span> {verificationData?.nationalId}</p>
                                <p><span className="font-semibold">Polling Station:</span> {verificationData?.pollingStation}</p>
                                <p><span className="font-semibold">County:</span> {verificationData?.county}</p>
                                <p><span className="font-semibold">Constituency:</span> {verificationData?.constituency}</p>
                                <p><span className="font-semibold">Status:</span> 
                                    <span className="text-green-600 ml-1">✓ Registered Voter</span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowVerification(false)}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            Back to Login
                        </button>
                    </div>
                )}

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Need help? Contact IEBC helpline: 0700-111-111
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VoterLogin;