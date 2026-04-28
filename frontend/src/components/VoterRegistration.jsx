import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/registration.css';

const VoterRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nationalId: '',
        firstName: '',
        lastName: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        
        if (!formData.nationalId || !formData.firstName || !formData.lastName) {
            setError('Please fill in all required fields');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                nationalId: formData.nationalId,
                firstName: formData.firstName,
                lastName: formData.lastName,
                password: formData.password
            });
            
            if (response.data.success) {
                setSuccess('Registration successful! You can now login.');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registration-page">
            <div className="registration-container">
                <div className="registration-card">
                    <div className="registration-header">
                        <div className="registration-icon">📝</div>
                        <h1>Voter Registration</h1>
                        <p>Create your voting account</p>
                    </div>
                    
                    {success && (
                        <div className="success-message">
                            <span>✅</span> {success}
                        </div>
                    )}
                    
                    {error && (
                        <div className="error-message">
                            <span>⚠️</span> {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>National ID Number *</label>
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
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name *</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Your first name"
                                    autoComplete="off"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Last Name *</label>
                                <input
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    placeholder="Your last name"
                                    autoComplete="off"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min. 6 characters"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm Password *</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
                                    autoComplete="new-password"
                                    required
                                />
                            </div>
                        </div>
                        
                        <button type="submit" className="register-btn" disabled={loading}>
                            {loading ? 'Registering...' : 'Register to Vote'}
                        </button>
                        
                        <div className="login-link">
                            Already have an account? <button type="button" onClick={() => navigate('/login')}>Login here</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VoterRegistration;