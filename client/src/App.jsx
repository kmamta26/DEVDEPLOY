import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ProjectsPage from './pages/ProjectsPage';
import GithubPage from './pages/GithubPage';
import AWSPage from './pages/AWSPage';
import DashboardLayout from './components/DashboardLayout';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('devdeploy_token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const PublicRoute = ({ children }) => {
    const token = localStorage.getItem('devdeploy_token');
    if (token) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
};

function App() {
    return (
        <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            
            <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="upload" element={<UploadPage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="github" element={<GithubPage />} />
                <Route path="aws" element={<AWSPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}

export default App;
