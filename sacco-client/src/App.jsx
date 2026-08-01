import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ExecutiveDashboard from './pages/executive/ExecutiveDashboard'
import MemberDashboard from './pages/member/MemberDashboard'
import Landing from './pages/Landing'
import Questionnaire from './pages/auth/Questionnaire'
import logoutIcon from './assets/icons8-logout-50.png';

// The interceptor component
function RootRedirect() {
  // It crashes right here if useAuth isn't imported at the very top of this file
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  const executiveRoles = ['Chairperson', 'Treasurer', 'Secretary'];
  const isExecutive = executiveRoles.includes(user.role) || user.role === 0;
  
  return isExecutive ? <Navigate to="/executive" replace /> : <Navigate to="/member" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Member routes */}
          <Route path="/member" element={
            <ProtectedRoute>
              <MemberDashboard />
            </ProtectedRoute>
          } />

          {/* Executive routes */}
          <Route path="/executive" element={
            <ProtectedRoute executiveOnly>
              <ExecutiveDashboard />
            </ProtectedRoute>
          } />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/" element={<Landing />} />
          <Route path="/questionnaire/:memberId" element={<Questionnaire />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}