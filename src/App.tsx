import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { FindCare } from './pages/FindCare';
import { Learning } from './pages/Learning';
import { BecomeCaregiver } from './pages/BecomeCaregiver';
import { Admin } from './pages/Admin';
import { Profile } from './pages/Profile';
import { Bookings } from './pages/Bookings';
import { CaregiverSessions } from './pages/CaregiverSessions';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AuthProvider } from './components/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Layout>
            <ErrorBoundary>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/find-care" element={<FindCare />} />
                <Route path="/learning" element={<Learning />} />
                <Route path="/become-caregiver" element={<BecomeCaregiver />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes — require authentication */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <Bookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/caregiver/sessions"
                  element={
                    <ProtectedRoute role="caregiver">
                      <CaregiverSessions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute role="admin">
                      <Admin />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </Layout>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
