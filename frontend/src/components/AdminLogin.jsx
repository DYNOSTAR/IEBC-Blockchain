import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logo.png';
import '../styles/admin-login.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
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

        try {
            const response = await axios.post('http://localhost:5000/api/auth/admin/login', {
                nationalId: formData.nationalId,
                password: formData.password
            });

            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.admin));
                localStorage.setItem('role', response.data.admin.role);
                
                if (response.data.admin.role === 'super_admin') {
                    navigate('/super-admin/dashboard');
                } else {
                    navigate('/admin/dashboard');
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-logo">
                        <img src={logo} alt="IEBC Logo" className="logo-img" />
                    </div>
                    <div className="login-header">
                        <h1>Admin Portal</h1>
                        <p>IEBC Election Management System</p>
                        <div className="admin-badge">Authorized Personnel Only</div>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>National ID</label>
                            <input
                                type="text"
                                name="nationalId"
                                value={formData.nationalId}
                                onChange={handleChange}
                                placeholder="Enter your National ID"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    required
                                />
                                <button 
                                    type="button"
                                    className="toggle-password-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>
                        
                        {error && (
                            <div className="error-message">
                                <span>⚠️</span> {error}
                            </div>
                        )}
                        
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? 'Logging in...' : 'Access Admin Portal'}
                        </button>
                    </form>
                    
                    <div className="login-footer">
                        <p>🔒 This area is restricted to authorized IEBC officials only</p>
                        <p className="demo-note">
                            Admin ID: ADMIN001 | Password: Admin@2027!<br/>
                            Super Admin ID: SUPER001 | Password: Super@2027!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;