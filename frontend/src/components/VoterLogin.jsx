import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/voter-login.css';

const VoterLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nationalId: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

        if (!formData.nationalId || !formData.password) {
            setError('Please enter both National ID and Password');
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/auth/voter/login', {
                nationalId: formData.nationalId.trim(),
                password: formData.password
            });

            if (response.data.success) {
                const { token, voter } = response.data;

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(voter));
                localStorage.setItem('role', 'voter');

                // Redirect to voter portal
                navigate('/portal');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="voter-login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-icon">🗳️</div>
                        <h1>Voter Login</h1>
                        <p>Access your voting dashboard</p>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>National ID Number</label>
                            <input
                                type="text"
                                name="nationalId"
                                value={formData.nationalId}
                                onChange={handleChange}
                                placeholder="e.g., 12345678"
                                autoComplete="off"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                required
                            />
                        </div>
                        
                        {error && (
                            <div className="error-message">
                                <span>⚠️</span> {error}
                            </div>
                        )}
                        
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login to Vote'}
                        </button>
                        
                        <div className="divider">
                            <span>or</span>
                        </div>
                        
                        <button 
                            type="button" 
                            onClick={() => navigate('/register')} 
                            className="register-btn"
                        >
                            Create New Account
                        </button>
                    </form>
                    
                    <div className="login-footer">
                        <p>Need help? Contact IEBC helpline: 0700-111-111</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoterLogin;