import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/CitizenDashboard';
import SubmitAppeal from './pages/SubmitAppeal';
import AppealStatus from './pages/AppealStatus';
import ViolationDetails from './pages/ViolationDetails';
import AdminDashboard from './pages/AdminDashboard';
import AppealReview from './pages/AppealReview';
import HowItWorks from './pages/HowItWorks';
import FAQ from './pages/FAQ';
import AppealProcess from './pages/AppealProcess';
import ViolationTypes from './pages/ViolationTypes';
import Guidelines from './pages/Guidelines';
import AppealStatusTracking from './pages/AppealStatusTracking';
import AdminAppeals from './pages/AdminAppeals';
import AdminProfile from './pages/AdminProfile';
import CitizenProfile from './pages/CitizenProfile';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<><Header /><LandingPage /></>} />
          <Route path="/login" element={<><Header /><LoginPage /></>} />
          <Route path="/register" element={<><Header /><RegisterPage /></>} />
          <Route path="/dashboard" element={<><Header /><CitizenDashboard /></>} />
          <Route path="/profile" element={<><Header /><CitizenProfile /></>} />
          <Route path="/submit-appeal" element={<><Header /><SubmitAppeal /></>} />
          <Route path="/submit-appeal/:violationId" element={<><Header /><SubmitAppeal /></>} />
          <Route path="/appeal-status/:id" element={<><Header /><AppealStatus /></>} />
          <Route path="/violation-details/:id" element={<><Header /><ViolationDetails /></>} />
          <Route path="/admin/dashboard" element={<><Header isAdmin={true} /><AdminDashboard /></>} />
          <Route path="/admin/appeals" element={<><Header isAdmin={true} /><AdminAppeals /></>} />
          <Route path="/admin/profile" element={<><Header isAdmin={true} /><AdminProfile /></>} />
          <Route path="/admin/appeal-review/:id" element={<><Header isAdmin={true} /><AppealReview /></>} />
          <Route path="/how-it-works" element={<><Header /><HowItWorks /></>} />
          <Route path="/faq" element={<><Header /><FAQ /></>} />
          <Route path="/appeal-process" element={<><Header /><AppealProcess /></>} />
          <Route path="/violation-types" element={<><Header /><ViolationTypes /></>} />
          <Route path="/guidelines" element={<><Header /><Guidelines /></>} />
          <Route path="/appeal-tracking" element={<><Header /><AppealStatusTracking /></>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

