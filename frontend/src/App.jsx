import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ResumesPage from './pages/ResumesPage';
import ResumeDetailPage from './pages/ResumeDetailPage';
import InterviewPage from './pages/InterviewPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import ResumeBuilderPage from './pages/ResumeBuilderPage';
import LearningPlanPage from './pages/LearningPlanPage';


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/resumes"   element={<ProtectedRoute><ResumesPage /></ProtectedRoute>} />
          <Route path="/resumes/:id" element={<ProtectedRoute><ResumeDetailPage /></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/builder" element={<ProtectedRoute><ResumeBuilderPage /></ProtectedRoute>} />
          <Route path="/learning" element={<ProtectedRoute><LearningPlanPage /></ProtectedRoute>} />

          <Route path="*" element={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
              <div className="text-center">
                <p className="text-6xl font-bold text-slate-200 mb-4">404</p>
                <p className="text-slate-500 mb-6">Page not found</p>
                <a href="/dashboard" className="btn-primary btn-lg inline-flex">Go Home</a>
              </div>
            </div>
          } />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.07)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;