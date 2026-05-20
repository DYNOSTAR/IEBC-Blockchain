import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/verification-page.css';

const VerificationPage = ({ voter, onComplete }) => {
    const navigate = useNavigate();

    const [activeStep, setActiveStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    // Step 1: OTP
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);
    const [devOtp, setDevOtp] = useState(null);

    // Step 2: ID Card
    const [idCardImage, setIdCardImage] = useState(null);
    const [idCardPreview, setIdCardPreview] = useState(null);
    const [idCardVerified, setIdCardVerified] = useState(false);

    // Step 3: Face
    const [faceImage, setFaceImage] = useState(null);
    const [facePreview, setFacePreview] = useState(null);
    const [useCamera, setUseCamera] = useState(false);
    const [faceVerified, setFaceVerified] = useState(false);
    const [cameraStream, setCameraStream] = useState(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // Step 4: Biometric
    const [biometricVerified, setBiometricVerified] = useState(false);

    // Initialise from saved verification level when voter prop changes
    useEffect(() => {
        if (!voter) return;
        const level = voter.verificationLevel || 0;

        if (level >= 1) setOtpVerified(true);
        if (level >= 2) {
            setIdCardVerified(true);
            if (voter.idCardPath) {
                setIdCardPreview(`http://localhost:5000${voter.idCardPath}`);
            }
        }
        if (level >= 3) {
            setFaceVerified(true);
            if (voter.faceImagePath) {
                setFacePreview(`http://localhost:5000${voter.faceImagePath}`);
            }
        }
        if (level >= 4) setBiometricVerified(true);

        // Jump to the first incomplete step
        if (level === 0) setActiveStep(1);
        else if (level === 1) setActiveStep(2);
        else if (level === 2) setActiveStep(3);
        else setActiveStep(4);
    }, [voter]);

    // Stop camera stream when component unmounts
    useEffect(() => {
        return () => {
            if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
        };
    }, [cameraStream]);

    const showMessage = (msg, type = 'success') => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => { setMessage(''); setMessageType(''); }, 4000);
    };

    // ── Step 1: OTP ──────────────────────────────────────────────
    const sendOTP = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/send-otp', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setOtpSent(true);
                if (response.data.devHint) setDevOtp(response.data.devHint);
                showMessage('OTP sent! Check your email.', 'success');
            }
        } catch (error) {
            showMessage(error.response?.data?.error || 'Failed to send OTP', 'error');
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        if (!otpCode || otpCode.length !== 6) {
            showMessage('Please enter the 6-digit OTP', 'error');
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
                setDevOtp(null);
                showMessage('OTP verified!', 'success');
                setTimeout(() => setActiveStep(2), 800);
            }
        } catch (error) {
            showMessage(error.response?.data?.error || 'Invalid OTP. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: ID Card ──────────────────────────────────────────
    const handleIdCardUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showMessage('Please upload an image file', 'error'); return; }
        setIdCardPreview(URL.createObjectURL(file));
        setIdCardImage(file);
    };

    const uploadIdCard = async () => {
        if (!idCardImage) { showMessage('Please select an image first', 'error'); return; }
        const formData = new FormData();
        formData.append('idCardImage', idCardImage);
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-id-card', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                setIdCardVerified(true);
                showMessage('ID Card uploaded and saved!', 'success');
                setTimeout(() => setActiveStep(3), 800);
            }
        } catch (error) {
            showMessage(error.response?.data?.error || 'ID Card upload failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 3: Face ─────────────────────────────────────────────
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraStream(stream);
            if (videoRef.current) videoRef.current.srcObject = stream;
            setUseCamera(true);
        } catch {
            showMessage('Camera unavailable. Please upload a photo instead.', 'error');
        }
    };

    const stopCamera = () => {
        if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
        setUseCamera(false);
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width  = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setFacePreview(dataUrl);
        fetch(dataUrl).then(r => r.blob()).then(blob => {
            setFaceImage(new File([blob], 'face-photo.jpg', { type: 'image/jpeg' }));
        });
        stopCamera();
    };

    const handleFaceUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { showMessage('Please upload an image file', 'error'); return; }
        setFacePreview(URL.createObjectURL(file));
        setFaceImage(file);
    };

    const uploadFaceImage = async () => {
        if (!faceImage) { showMessage('Please capture or upload a face photo first', 'error'); return; }
        const formData = new FormData();
        formData.append('faceImage', faceImage);
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-face', formData, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            if (response.data.success) {
                setFaceVerified(true);
                showMessage('Face image saved!', 'success');
                setTimeout(() => setActiveStep(4), 800);
            }
        } catch (error) {
            showMessage(error.response?.data?.error || 'Face upload failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Step 4: Biometric ────────────────────────────────────────
    const startBiometric = async () => {
        setLoading(true);
        try {
            // Attempt WebAuthn platform authenticator (fingerprint / Face ID)
            if (window.PublicKeyCredential) {
                try {
                    const challenge = crypto.getRandomValues(new Uint8Array(32));
                    await navigator.credentials.create({
                        publicKey: {
                            challenge,
                            rp: { name: 'IEBC Voting System', id: window.location.hostname },
                            user: {
                                id: new Uint8Array(16),
                                name: voter?.email || 'voter',
                                displayName: `${voter?.firstName || ''} ${voter?.lastName || ''}`.trim()
                            },
                            pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
                            timeout: 60000,
                            authenticatorSelection: {
                                authenticatorAttachment: 'platform',
                                userVerification: 'required'
                            }
                        }
                    });
                    // WebAuthn credential created — continue to save on server
                } catch (webAuthnErr) {
                    // Device doesn't support it or user cancelled — fall through to simulation
                    console.info('WebAuthn not available, simulating biometric scan');
                    await new Promise(r => setTimeout(r, 2000));
                }
            } else {
                await new Promise(r => setTimeout(r, 2000));
            }

            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/api/voter/verify-biometric', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setBiometricVerified(true);
                showMessage('Biometric verification complete! You are now fully verified.', 'success');
                setTimeout(() => {
                    if (onComplete) onComplete();
                    navigate('/portal/profile');
                }, 1800);
            }
        } catch (error) {
            showMessage(error.response?.data?.error || 'Biometric verification failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ── Render ───────────────────────────────────────────────────
    return (
        <div className="verification-page-container">
            <div className="verification-header">
                <h1>Identity Verification</h1>
                <p>Complete all steps to verify your identity and unlock voting</p>

                <div className="progress-steps">
                    {[
                        { n: 1, label: 'OTP',       done: otpVerified },
                        { n: 2, label: 'ID Card',   done: idCardVerified },
                        { n: 3, label: 'Face',      done: faceVerified },
                        { n: 4, label: 'Biometric', done: biometricVerified }
                    ].map(({ n, label, done }) => (
                        <div
                            key={n}
                            className={`step-indicator ${activeStep >= n ? 'active' : ''} ${done ? 'completed' : ''}`}
                            onClick={() => done || activeStep >= n ? setActiveStep(n) : null}
                        >
                            <span className="step-number">{done ? '✓' : n}</span>
                            <span className="step-label">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {message && (
                <div className={`verification-message ${messageType === 'error' ? 'error' : 'success'}`}>
                    {message}
                </div>
            )}

            <div className="verification-content">

                {/* ── Step 1: OTP ── */}
                {activeStep === 1 && (
                    <div className="step-container">
                        <div className="step-icon">📧</div>
                        <h2>Step 1: Email Verification</h2>
                        <p>A one-time password will be sent to your registered email address.</p>

                        {!otpSent ? (
                            <button onClick={sendOTP} disabled={loading} className="verify-btn">
                                {loading ? 'Sending…' : 'Send OTP'}
                            </button>
                        ) : (
                            <div className="otp-container">
                                {devOtp && (
                                    <div className="dev-hint">
                                        <span>🛠 Dev mode — OTP:</span>
                                        <strong>{devOtp}</strong>
                                    </div>
                                )}
                                <input
                                    type="text"
                                    placeholder="Enter 6-digit OTP"
                                    value={otpCode}
                                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength="6"
                                    className="otp-input"
                                    autoFocus
                                />
                                <button onClick={verifyOTP} disabled={loading} className="verify-btn">
                                    {loading ? 'Verifying…' : 'Verify OTP'}
                                </button>
                                <button onClick={sendOTP} disabled={loading} className="resend-btn">
                                    Resend Code
                                </button>
                            </div>
                        )}

                        {otpVerified && (
                            <div className="step-complete">
                                ✓ Email verified — <button className="link-btn" onClick={() => setActiveStep(2)}>Continue to ID Card →</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 2: ID Card ── */}
                {activeStep === 2 && (
                    <div className="step-container">
                        <div className="step-icon">🪪</div>
                        <h2>Step 2: National ID Card</h2>
                        <p>Upload a clear, well-lit photo of your National ID Card.</p>

                        {idCardVerified ? (
                            <div className="step-complete">
                                <img src={idCardPreview} alt="ID Card" className="preview-image verified-preview" />
                                <p>✓ ID Card saved</p>
                                <button className="link-btn" onClick={() => setActiveStep(3)}>Continue to Face →</button>
                            </div>
                        ) : (
                            <div className="upload-area">
                                {!idCardPreview ? (
                                    <label className="upload-label">
                                        <input type="file" accept="image/*" onChange={handleIdCardUpload} hidden />
                                        <div className="upload-placeholder">
                                            <span className="upload-icon">📄</span>
                                            <span>Click to upload ID Card image</span>
                                            <small>JPG or PNG · Max 5 MB</small>
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
                                {idCardPreview && (
                                    <button onClick={uploadIdCard} disabled={loading} className="verify-btn">
                                        {loading ? 'Uploading…' : 'Upload & Save ID Card'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Step 3: Face ── */}
                {activeStep === 3 && (
                    <div className="step-container">
                        <div className="step-icon">🤳</div>
                        <h2>Step 3: Face Photo</h2>
                        <p>Take a selfie or upload a clear, recent passport-style photo.</p>

                        {faceVerified ? (
                            <div className="step-complete">
                                <img src={facePreview} alt="Face" className="preview-image verified-preview face-preview" />
                                <p>✓ Face photo saved</p>
                                <button className="link-btn" onClick={() => setActiveStep(4)}>Continue to Biometric →</button>
                            </div>
                        ) : (
                            <>
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
                                            <button onClick={capturePhoto} className="capture-btn">📸 Capture</button>
                                            <button onClick={stopCamera} className="cancel-btn">Cancel</button>
                                        </div>
                                    </div>
                                )}

                                {facePreview && !useCamera && (
                                    <div className="preview-container">
                                        <img src={facePreview} alt="Face Preview" className="preview-image face-preview" />
                                        <button onClick={() => { setFacePreview(null); setFaceImage(null); }} className="remove-btn">
                                            Remove
                                        </button>
                                    </div>
                                )}

                                {facePreview && !useCamera && (
                                    <button onClick={uploadFaceImage} disabled={loading} className="verify-btn">
                                        {loading ? 'Uploading…' : 'Save Face Photo'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ── Step 4: Biometric ── */}
                {activeStep === 4 && (
                    <div className="step-container">
                        <div className="step-icon">🖐️</div>
                        <h2>Step 4: Biometric Verification</h2>
                        <p>Use your device's fingerprint sensor or Face ID for final verification.</p>

                        {biometricVerified ? (
                            <div className="step-complete fully-verified">
                                <div className="verified-badge">✅</div>
                                <h3>Fully Verified!</h3>
                                <p>Your identity has been confirmed. You can now cast your vote.</p>
                            </div>
                        ) : (
                            <div className="biometric-area">
                                <div className="biometric-icon-large">🖐️</div>
                                <p>When you tap the button, your device will prompt for a fingerprint or Face ID scan.</p>
                                <p className="biometric-fallback-note">
                                    <small>If your device doesn't support biometrics, a simulated verification will be used.</small>
                                </p>
                                <button onClick={startBiometric} disabled={loading} className="verify-btn biometric-btn">
                                    {loading ? 'Scanning…' : 'Start Biometric Scan'}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="verification-footer">
                <button onClick={() => navigate('/portal/profile')} className="back-btn">
                    ← Back to Profile
                </button>
                {activeStep < 4 && (
                    <span className="step-progress-text">
                        Step {activeStep} of 4
                    </span>
                )}
            </div>
        </div>
    );
};

export default VerificationPage;
