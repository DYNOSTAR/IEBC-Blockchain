import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/registration.css';

const VoterRegistration = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Data from database
    const [counties, setCounties] = useState([]);
    const [constituencies, setConstituencies] = useState([]);
    const [wards, setWards] = useState([]);
    
    const [formData, setFormData] = useState({
        nationalId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        countyId: '',
        constituencyId: '',
        wardId: '',
        password: '',
        confirmPassword: ''
    });

    // Load counties on component mount
    useEffect(() => {
        loadCounties();
    }, []);

    // Load constituencies when county changes
    useEffect(() => {
        if (formData.countyId) {
            loadConstituencies(formData.countyId);
            // Reset dependent fields
            setFormData(prev => ({ ...prev, constituencyId: '', wardId: '' }));
            setWards([]);
        }
    }, [formData.countyId]);

    // Load wards when constituency changes
    useEffect(() => {
        if (formData.constituencyId) {
            loadWards(formData.constituencyId);
            setFormData(prev => ({ ...prev, wardId: '' }));
        }
    }, [formData.constituencyId]);

    const loadCounties = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/locations/counties');
            if (response.data.success) {
                setCounties(response.data.counties);
            }
        } catch (error) {
            console.error('Error loading counties:', error);
            setError('Failed to load county data. Please refresh the page.');
        }
    };

    const loadConstituencies = async (countyId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/locations/constituencies/${countyId}`);
            if (response.data.success) {
                setConstituencies(response.data.constituencies);
            }
        } catch (error) {
            console.error('Error loading constituencies:', error);
        }
    };

    const loadWards = async (constituencyId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/locations/wards/${constituencyId}`);
            if (response.data.success) {
                setWards(response.data.wards);
            }
        } catch (error) {
            console.error('Error loading wards:', error);
        }
    };

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
                email: formData.email,
                phone: formData.phone,
                countyId: formData.countyId,
                constituencyId: formData.constituencyId,
                wardId: formData.wardId,
                password: formData.password
            });
            
            if (response.data.success) {
                // Store token and user data for auto-login
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.voter));
                localStorage.setItem('role', 'voter');
                
                setSuccess('Registration successful! Redirecting to your portal...');
                
                // Redirect to voter portal after 1.5 seconds
                setTimeout(() => {
                    navigate('/portal');
                }, 1500);
            }
        } catch (err) {
            console.error('Registration error:', err);
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
                        <div className="registration-icon">📱</div>
                        <h1>Voter Registration</h1>
                        <p>Create your mobile voting account</p>
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
                        <div className="form-row">
                            <div className="form-group">
                                <label>First Name *</label>
                                <input
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    placeholder="Your first name"
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
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>National ID Number *</label>
                            <input
                                type="text"
                                name="nationalId"
                                value={formData.nationalId}
                                onChange={handleChange}
                                placeholder="e.g., 12345678"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="0712345678"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>County *</label>
                                <select
                                    name="countyId"
                                    value={formData.countyId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select County</option>
                                    {counties.map(county => (
                                        <option key={county.id} value={county.id}>{county.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Constituency *</label>
                                <select
                                    name="constituencyId"
                                    value={formData.constituencyId}
                                    onChange={handleChange}
                                    disabled={!formData.countyId}
                                    required
                                >
                                    <option value="">Select Constituency</option>
                                    {constituencies.map(con => (
                                        <option key={con.id} value={con.id}>{con.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Ward *</label>
                                <select
                                    name="wardId"
                                    value={formData.wardId}
                                    onChange={handleChange}
                                    disabled={!formData.constituencyId}
                                    required
                                >
                                    <option value="">Select Ward</option>
                                    {wards.map(ward => (
                                        <option key={ward.id} value={ward.id}>{ward.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Password *</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Min. 6 characters"
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
                            <div className="form-group">
                                <label>Confirm Password *</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm your password"
                                        required
                                    />
                                    <button 
                                        type="button"
                                        className="toggle-password-btn"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? '🙈' : '👁️'}
                                    </button>
                                </div>
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