import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import VoterPortalHeader from '../VoterPortalHeader';
import VerticalSidebar from '../VerticalSidebar';
import '../../styles/verification-page.css';

const VerificationPage = ({ voter, onComplete }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeStep, setActiveStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    
    // Step 1: OTP Verification
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    
    // Step 2: ID Card Image
    const [idCardImage, setIdCardImage] = useState(null);
    const [idCardPreview, setIdCardPreview] = useState(null);
    const [idCardVerified, setIdCardVerified] = useState(false);
    
    // Step 3: Face Image / Camera
    const [faceImage, setFaceImage] = useState(null);
    const [facePreview, setFacePreview] = useState(null);
    const [useCamera, setUseCamera] = useState(false);
    const [faceVerified, setFaceVerified] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    
    // Step 4: Biometric
    const [biometricVerified, setBiometricVerified] = useState(false);

    // Get user data from localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    const showMessage = (msg, type = 'success') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 3000);
    };

    // Step 1: Send OTP
    const sendOTP = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/send-otp', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setOtpSent(true);
                showMessage('OTP sent to your email!', 'success');
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            showMessage(error.response?.data?.error || 'Failed to send OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Verify OTP
    const verifyOTP = async () => {
        if (!otpCode || otpCode.length !== 6) {
            showMessage('Please enter a valid 6-digit OTP', 'error');
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-otp', 
                { otpCode },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
                setOtpVerified(true);
                showMessage('OTP verified successfully!', 'success');
                setActiveStep(2);
            }
        } catch (error) {
            showMessage(error.response?.data?.error || 'Invalid OTP. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Handle ID Card Upload
    const handleIdCardUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showMessage('Please upload an image file', 'error');
            return;
        }
        
        const previewUrl = URL.createObjectURL(file);
        setIdCardPreview(previewUrl);
        setIdCardImage(file);
    };

    const uploadIdCard = async () => {
        if (!idCardImage) {
            showMessage('Please select an image first', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('idCardImage', idCardImage);
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-id-card', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                setIdCardVerified(true);
                showMessage('ID Card uploaded and verified!', 'success');
                setActiveStep(3);
            }
        } catch (error) {
            showMessage('ID Card upload failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Start Camera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setUseCamera(true);
        } catch (err) {
            showMessage('Unable to access camera. Please upload a photo instead.', 'error');
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
        setUseCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            const imageData = canvasRef.current.toDataURL('image/jpeg');
            setFacePreview(imageData);
            
            fetch(imageData)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], 'face-photo.jpg', { type: 'image/jpeg' });
                    setFaceImage(file);
                });
            stopCamera();
        }
    };

    const handleFaceUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            showMessage('Please upload an image file', 'error');
            return;
        }
        
        const previewUrl = URL.createObjectURL(file);
        setFacePreview(previewUrl);
        setFaceImage(file);
    };

    const uploadFaceImage = async () => {
        if (!faceImage) {
            showMessage('Please capture or upload a face photo first', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('faceImage', faceImage);
        
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-face', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (response.data.success) {
                setFaceVerified(true);
                showMessage('Face image verified!', 'success');
                setActiveStep(4);
            }
        } catch (error) {
            showMessage('Face verification failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Step 4: Biometric
    const startBiometric = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-biometric', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setBiometricVerified(true);
                showMessage('Biometric verification successful!', 'success');
                setTimeout(() => {
                    if (onComplete) onComplete();
                    navigate('/voter/portal/profile');
                }, 1500);
            }
        } catch (error) {
            showMessage('Biometric verification failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="voter-portal">
            <VoterPortalHeader user={user} onLogout={handleLogout} />
            <div className="portal-main-layout">
                <VerticalSidebar />
                <div className="portal-content-area">
                    <div className="verification-page-container">
                        <div className="verification-header">
                            <h1>Identity Verification</h1>
                            <p>Complete all steps to verify your identity</p>
                            <div className="progress-steps">
                                <div className={`step-indicator ${activeStep >= 1 ? 'active' : ''} ${otpVerified ? 'completed' : ''}`}>
                                    <span className="step-number">1</span>
                                    <span className="step-label">OTP</span>
                                </div>
                                <div className={`step-indicator ${activeStep >= 2 ? 'active' : ''} ${idCardVerified ? 'completed' : ''}`}>
                                    <span className="step-number">2</span>
                                    <span className="step-label">ID Card</span>
                                </div>
                                <div className={`step-indicator ${activeStep >= 3 ? 'active' : ''} ${faceVerified ? 'completed' : ''}`}>
                                    <span className="step-number">3</span>
                                    <span className="step-label">Face</span>
                                </div>
                                <div className={`step-indicator ${activeStep >= 4 ? 'active' : ''} ${biometricVerified ? 'completed' : ''}`}>
                                    <span className="step-number">4</span>
                                    <span className="step-label">Biometric</span>
                                </div>
                            </div>
                        </div>

                        {message && (
                            <div className={`verification-message ${messageType === 'error' ? 'error' : 'success'}`}>
                                {message}
                            </div>
                        )}

                        <div className="verification-content">
                            {/* Step 1: OTP */}
                            {activeStep === 1 && (
                                <div className="step-container">
                                    <h2>Step 1: Email Verification</h2>
                                    <p>We'll send a one-time password to your registered email</p>
                                    {!otpSent ? (
                                        <button onClick={sendOTP} disabled={loading} className="verify-btn">
                                            {loading ? 'Sending...' : 'Send OTP'}
                                        </button>
                                    ) : (
                                        <div className="otp-container">
                                            <input
                                                type="text"
                                                placeholder="Enter 6-digit OTP"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                maxLength="6"
                                                className="otp-input"
                                            />
                                            <button onClick={verifyOTP} disabled={loading} className="verify-btn">
                                                {loading ? 'Verifying...' : 'Verify OTP'}
                                            </button>
                                            <button onClick={sendOTP} disabled={loading} className="resend-btn">
                                                Resend Code
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 2: ID Card */}
                            {activeStep === 2 && (
                                <div className="step-container">
                                    <h2>Step 2: National ID Card</h2>
                                    <p>Upload a clear photo of your National ID Card</p>
                                    <div className="upload-area">
                                        {!idCardPreview ? (
                                            <label className="upload-label">
                                                <input type="file" accept="image/*" onChange={handleIdCardUpload} hidden />
                                                <div className="upload-placeholder">
                                                    <span className="upload-icon">📄</span>
                                                    <span>Click to upload ID Card image</span>
                                                    <small>JPG, PNG accepted (Max 5MB)</small>
                                                </div>
                                            </label>
                                        ) : (
                                            <div className="preview-container">
                                                <img src={idCardPreview} alt="ID Card Preview" className="preview-image" />
                                                <button onClick={() => { setIdCardPreview(null); setIdCardImage(null); }} className="remove-btn">
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {idCardPreview && (
                                        <button onClick={uploadIdCard} disabled={loading} className="verify-btn">
                                            {loading ? 'Uploading...' : 'Upload & Verify ID Card'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Face */}
                            {activeStep === 3 && (
                                <div className="step-container">
                                    <h2>Step 3: Face Recognition</h2>
                                    <p>Take a photo using your camera or upload a passport-style photo</p>
                                    
                                    <div className="face-options">
                                        <button onClick={startCamera} className="camera-btn">📷 Use Camera</button>
                                        <label className="upload-photo-btn">
                                            📁 Upload Photo
                                            <input type="file" accept="image/*" onChange={handleFaceUpload} hidden />
                                        </label>
                                    </div>

                                    {useCamera && (
                                        <div className="camera-container">
                                            <video ref={videoRef} autoPlay playsInline className="camera-preview" />
                                            <canvas ref={canvasRef} style={{ display: 'none' }} />
                                            <div className="camera-buttons">
                                                <button onClick={capturePhoto} className="capture-btn">Capture Photo</button>
                                                <button onClick={stopCamera} className="cancel-btn">Cancel</button>
                                            </div>
                                        </div>
                                    )}

                                    {facePreview && (
                                        <div className="preview-container">
                                            <img src={facePreview} alt="Face Preview" className="preview-image" />
                                            <button onClick={() => { setFacePreview(null); setFaceImage(null); }} className="remove-btn">
                                                Remove
                                            </button>
                                        </div>
                                    )}

                                    {facePreview && (
                                        <button onClick={uploadFaceImage} disabled={loading} className="verify-btn">
                                            {loading ? 'Verifying...' : 'Verify Face'}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Step 4: Biometric */}
                            {activeStep === 4 && (
                                <div className="step-container">
                                    <h2>Step 4: Biometric Verification</h2>
                                    <p>Use your device's fingerprint scanner for final verification</p>
                                    <div className="biometric-area">
                                        <div className="biometric-icon">🖐️</div>
                                        <p>Place your finger on the scanner when ready</p>
                                        <button onClick={startBiometric} disabled={loading} className="verify-btn biometric-btn">
                                            {loading ? 'Processing...' : 'Start Biometric Scan'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="verification-footer">
                            <button onClick={() => navigate('/voter/portal/profile')} className="back-btn">
                                ← Back to Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerificationPage;