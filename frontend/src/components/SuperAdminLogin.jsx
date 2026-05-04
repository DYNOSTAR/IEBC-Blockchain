import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/admin-login.css';

const SuperAdminLogin = () => {
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

        console.log('Attempting login with:', { nationalId: formData.nationalId });

        try {
            const response = await axios.post('http://localhost:5000/api/auth/super-admin/login', {
                nationalId: formData.nationalId,
                password: formData.password
            });

            console.log('Response:', response.data);

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.admin));
                localStorage.setItem('role', 'super_admin');
                
                navigate('/super-admin/dashboard');
            }
        } catch (err) {
            console.error('Login error:', err.response?.data);
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="super-admin-login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-icon">👑</div>
                        <h1>Super Admin Portal</h1>
                        <p>IEBC System Administration</p>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>National ID</label>
                            <input
                                type="text"
                                name="nationalId"
                                value={formData.nationalId}
                                onChange={handleChange}
                                placeholder="SUPER001"
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
                            {loading ? 'Logging in...' : 'Access Super Admin Portal'}
                        </button>
                    </form>
                    
                    <div className="login-footer">
                        <p>🔒 Authorized Personnel Only</p>
                        <p className="demo-note">Super Admin ID: SUPER001 | Password: Super@2027!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminLogin;