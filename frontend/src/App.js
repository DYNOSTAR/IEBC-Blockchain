import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import VoterLogin from './components/VoterLogin';
import VoterRegistration from './components/VoterRegistration';
import VoterPortal from './components/VoterPortal';
import AdminLogin from './components/AdminLogin';
import SuperAdminLogin from './components/SuperAdminLogin';
import ResultsPage from './components/ResultsPage';
import VoterVerification from './components/VoterVerification';


// Admin Imports
import AdminDashboard from './components/Admin/AdminDashboard';
import CountiesManagement from './components/Admin/pages/CountiesManagement';
import ConstituenciesManagement from './components/Admin/pages/ConstituenciesManagement';
import WardsManagement from './components/Admin/pages/WardsManagement';
import PollingStationsManagement from './components/Admin/pages/PollingStationsManagement';
import PoliticalPartiesManagement from './components/Admin/pages/PoliticalPartiesManagement';
import CandidatesManagement from './components/Admin/pages/CandidatesManagement';
import ElectionsManagement from './components/Admin/pages/ElectionsManagement';
import VotersManagement from './components/Admin/pages/VotersManagement';
import ReportsManagement from './components/Admin/pages/ReportsManagement';
import AuditLogs from './components/Admin/pages/AuditLogs';
import AdminProfile from './components/Admin/pages/AdminProfile';

// Super Admin Imports
import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard';
import SuperAdminAdmins from './components/SuperAdmin/SuperAdminAdmins';
import PresidentialCandidates from './components/SuperAdmin/PresidentialCandidates';
import SuperAdminStatistics from './components/SuperAdmin/SuperAdminStatistics';
import SuperAdminRegister from './components/SuperAdminRegister';
import AdminRegister from './components/AdminRegister';
import './styles/main.css';

const ProtectedRoute = ({ children, role }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    
    if (!token) {
        return <Navigate to="/login" />;
    }
    
    if (role && userRole !== role) {
        if (userRole === 'super_admin') {
            return <Navigate to="/super-admin/dashboard" />;
        } else if (userRole === 'admin') {
            return <Navigate to="/admin/dashboard" />;
        } else if (userRole === 'voter') {
            return <Navigate to="/portal" />;
        }
        return <Navigate to="/" />;
    }
    
    return children;
};

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<VoterLogin />} />
                <Route path="/register" element={<VoterRegistration />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/super-admin/login" element={<SuperAdminLogin />} />
                <Route path="/verify" element={<VoterVerification />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/super-admin/register" element={<SuperAdminRegister />} />
                <Route path="/admin/register" element={<AdminRegister />} />
                
                {/* Voter Portal Routes */}
                <Route 
                    path="/portal/*" 
                    element={
                        <ProtectedRoute role="voter">
                            <VoterPortal />
                        </ProtectedRoute>
                    } 
                />
                
                {/* Admin Routes */}
                <Route 
                    path="/admin/dashboard" 
                    element={
                        <ProtectedRoute role="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/profile" 
                    element={
                        <ProtectedRoute role="admin">
                            <AdminProfile />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/counties" 
                    element={
                        <ProtectedRoute role="admin">
                            <CountiesManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/constituencies" 
                    element={
                        <ProtectedRoute role="admin">
                            <ConstituenciesManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/wards" 
                    element={
                        <ProtectedRoute role="admin">
                            <WardsManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/polling-stations" 
                    element={
                        <ProtectedRoute role="admin">
                            <PollingStationsManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/parties" 
                    element={
                        <ProtectedRoute role="admin">
                            <PoliticalPartiesManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/candidates" 
                    element={
                        <ProtectedRoute role="admin">
                            <CandidatesManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/elections" 
                    element={
                        <ProtectedRoute role="admin">
                            <ElectionsManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/voters" 
                    element={
                        <ProtectedRoute role="admin">
                            <VotersManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/reports" 
                    element={
                        <ProtectedRoute role="admin">
                            <ReportsManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/audit-logs" 
                    element={
                        <ProtectedRoute role="admin">
                            <AuditLogs />
                        </ProtectedRoute>
                    } 
                />
                
                {/* Super Admin Routes */}
                <Route 
                    path="/super-admin/dashboard" 
                    element={
                        <ProtectedRoute role="super_admin">
                            <SuperAdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/super-admin/admins" 
                    element={
                        <ProtectedRoute role="super_admin">
                            <SuperAdminAdmins />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/super-admin/presidential-candidates" 
                    element={
                        <ProtectedRoute role="super_admin">
                            <PresidentialCandidates />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/super-admin/statistics" 
                    element={
                        <ProtectedRoute role="super_admin">
                            <SuperAdminStatistics />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/super-admin/counties" 
                    element={
                        <ProtectedRoute role="super_admin">
                            <CountiesManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/super-admin/parties" 
                    element={
                        <ProtectedRoute role="super_admin">
                            <PoliticalPartiesManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/super-admin/reports" 
                    element={
                        <ProtectedRoute role="super_admin">
                            <ReportsManagement />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/super-admin/audit-logs" 
                    element={
                        <ProtectedRoute role="super_admin">
                            <AuditLogs />
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </Router>
    );
}

export default App;