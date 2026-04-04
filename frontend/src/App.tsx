import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
// import TokenPage from './components/TokenPage'; // MVP: Tokens desactivados
import AdminDashboard from './components/AdminDashboard';
import MemberProfile from './components/MemberProfile';
import SwitchTrips from './components/SwitchTrips';

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
                <Routes>
                    {/* Public Landing Page */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/switchtrips" element={<SwitchTrips />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    {/* MVP: Tokens desactivados temporalmente */}
                    <Route path="/tokens" element={<Navigate to="/" replace />} />

                    {/* === PANEL DE SOCIO === */}
                    <Route path="/dashboard/socio" element={<MemberProfile />} />

                    {/* === PANEL DE ADMIN === */}
                    <Route path="/dashboard/admin" element={<AdminDashboard />} />

                    {/* Legacy aliases (backward compat) */}
                    <Route path="/perfil" element={<Navigate to="/dashboard/socio" replace />} />
                    <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />
                    <Route path="/dashboard" element={<Navigate to="/dashboard/socio" replace />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
