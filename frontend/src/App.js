import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import VoterLogin from './components/VoterLogin';
import AdminLogin from './components/AdminLogin';
import VotingDashboard from './components/VotingDashboard';
import AdminDashboard from './components/AdminDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    
    if (!token) {
        return <Navigate to="/login" />;
    }
    
    if (role && userRole !== role) {
        return <Navigate to="/" />;
    }
    
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<VoterLogin />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route 
                    path="/voting" 
                    element={
                        <ProtectedRoute role="voter">
                            <VotingDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/dashboard" 
                    element={
                        <ProtectedRoute role="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </Router>
    );
}

export default App;