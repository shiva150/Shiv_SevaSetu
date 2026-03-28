import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { FindCare } from './pages/FindCare';
import { Learning } from './pages/Learning';
import { BecomeCaregiver } from './pages/BecomeCaregiver';
import { Admin } from './pages/Admin';
import { Profile } from './pages/Profile';
import { Bookings } from './pages/Bookings';
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
                <Route path="/" element={<Home />} />
                <Route path="/find-care" element={<FindCare />} />
                <Route path="/learning" element={<Learning />} />
                <Route path="/become-caregiver" element={<BecomeCaregiver />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/bookings" element={<Bookings />} />
              </Routes>
            </ErrorBoundary>
          </Layout>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
