import React, { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Footer from './components/Footer';
import Spinner from './components/Spinner';
import { PrivacyPolicy, TermsAndConditions, Contact } from './pages/LegalPages';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const WarrantyForm = lazy(() => import('./pages/WarrantyForm'));
const WarrantyDetail = lazy(() => import('./pages/WarrantyDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

const RouteTitle = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    const title = pathname === '/' ? 'Warranty tracking made simple' : pathname === '/dashboard' ? 'Dashboard' : pathname === '/login' ? 'Sign in' : pathname === '/register' ? 'Create account' : pathname === '/profile' ? 'Profile' : pathname === '/privacy' ? 'Privacy' : pathname === '/terms' ? 'Terms' : pathname === '/contact' ? 'Contact' : pathname.endsWith('/edit') ? 'Edit warranty' : pathname === '/warranties/new' ? 'Add warranty' : pathname.startsWith('/warranties/') ? 'Warranty details' : 'Page not found';
    document.title = `${title} | Warranty Tracker`;
  }, [pathname]);
  return null;
};

const PublicLayout = ({ bare = false }) => (
  <div className={`app-shell public-shell${bare ? ' public-shell--bare' : ''}`}>
    {!bare && <Navbar publicOnly />}
    <main className="app-main" id="main-content"><Outlet /></main>
    {!bare && <Footer />}
  </div>
);

const AppLayout = () => (
  <div className="app-shell app-layout">
    <Navbar />
    <main className="app-main" id="main-content"><Outlet /></main>
    <Footer />
  </div>
);

function App() {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <RouteTitle />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route element={<PublicLayout bare />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/warranties/new" element={<ProtectedRoute><WarrantyForm /></ProtectedRoute>} />
            <Route path="/warranties/:id" element={<ProtectedRoute><WarrantyDetail /></ProtectedRoute>} />
            <Route path="/warranties/:id/edit" element={<ProtectedRoute><WarrantyForm /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
