import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Layout/Header';
import Footer from './Layout/Footer';
import '../styles/registration.css';

const VoterRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        nationalId: '',
        passportNumber: '',
        email: '',
        phone: '',
        county: '',
        constituency: '',
        ward: '',
        pollingStation: '',
        password: '',
        confirmPassword: ''
    });
    const [counties, setCounties] = useState([]);
    const [constituencies, setConstituencies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [step, setStep] = useState(1);

    useEffect(() => {
        loadCounties();
    }, []);

    const loadCounties = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/counties');
            setCounties(response.data.counties);
        } catch (error) {
            console.error('Error loading counties:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleCountyChange = async (e) => {
        const countyId = e.target.value;
        setFormData({
            ...formData,
            county: countyId,
            constituency: '',
            ward: ''
        });
        
        // Load constituencies for selected county
        try {
            const response = await axios.get(`http://localhost:5000/api/constituencies/${countyId}`);
            setConstituencies(response.data.constituencies);
        } catch (error) {
            console.error('Error loading constituencies:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        setLoading(true);
        setError('');
        
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', formData);
            
            if (response.data.success) {
                setSuccess('Registration successful! You can now login.');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            }
        } catch (error) {
            setError(error.response?.data?.error || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="registration-page">
            <Header />
            
            <div className="registration-bg-overlay"></div>
            
            <div className="registration-main">
                <div className="container">
                    <div className="registration-wrapper">
                        <div className="registration-card">
                            <div className="registration-header">
                                <div className="registration-icon">📝</div>
                                <h1>Voter Registration</h1>
                                <p>Register to vote in the 2027 General Election</p>
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
                            
                            <form onSubmit={handleSubmit} className="registration-form">
                                {/* Step 1: Personal Information */}
                                {step === 1 && (
                                    <div className="form-step">
                                        <h3>Personal Information</h3>
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>First Name *</label>
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Enter your first name"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Last Name *</label>
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Enter your last name"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>National ID Number *</label>
                                                <input
                                                    type="text"
                                                    name="nationalId"
                                                    value={formData.nationalId}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="e.g., 12345678"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Passport Number (Optional)</label>
                                                <input
                                                    type="text"
                                                    name="passportNumber"
                                                    value={formData.passportNumber}
                                                    onChange={handleChange}
                                                    placeholder="e.g., A1234567"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>Email Address *</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="you@example.com"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Phone Number *</label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="e.g., 0712345678"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Step 2: Location Information */}
                                {step === 2 && (
                                    <div className="form-step">
                                        <h3>Location Information</h3>
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>County *</label>
                                                <select
                                                    name="county"
                                                    value={formData.county}
                                                    onChange={handleCountyChange}
                                                    required
                                                >
                                                    <option value="">Select County</option>
                                                    {counties.map(county => (
                                                        <option key={county.id} value={county.id}>
                                                            {county.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label>Constituency *</label>
                                                <select
                                                    name="constituency"
                                                    value={formData.constituency}
                                                    onChange={handleChange}
                                                    required
                                                    disabled={!formData.county}
                                                >
                                                    <option value="">Select Constituency</option>
                                                    {constituencies.map(constituency => (
                                                        <option key={constituency.id} value={constituency.id}>
                                                            {constituency.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>Ward *</label>
                                                <input
                                                    type="text"
                                                    name="ward"
                                                    value={formData.ward}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Enter your ward"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label>Polling Station *</label>
                                                <input
                                                    type="text"
                                                    name="pollingStation"
                                                    value={formData.pollingStation}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="e.g., PS001"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Step 3: Account Setup */}
                                {step === 3 && (
                                    <div className="form-step">
                                        <h3>Create Account</h3>
                                        <div className="form-row">
                                            <div className="input-group">
                                                <label>Password *</label>
                                                <input
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Create a strong password"
                                                />
                                                <small>Minimum 8 characters</small>
                                            </div>
                                            <div className="input-group">
                                                <label>Confirm Password *</label>
                                                <input
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleChange}
                                                    required
                                                    placeholder="Confirm your password"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="terms">
                                            <input type="checkbox" id="terms" required />
                                            <label htmlFor="terms">
                                                I confirm that the information provided is accurate and I am eligible to vote.
                                            </label>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="form-navigation">
                                    {step > 1 && (
                                        <button type="button" onClick={() => setStep(step - 1)} className="btn-prev">
                                            ← Previous
                                        </button>
                                    )}
                                    {step < 3 ? (
                                        <button type="button" onClick={() => setStep(step + 1)} className="btn-next">
                                            Next →
                                        </button>
                                    ) : (
                                        <button type="submit" disabled={loading} className="btn-submit">
                                            {loading ? 'Registering...' : 'Complete Registration'}
                                        </button>
                                    )}
                                </div>
                            </form>
                            
                            <div className="login-link">
                                Already have an account? <button onClick={() => navigate('/login')}>Login here</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <Footer />
        </div>
    );
};

export default VoterRegistration;