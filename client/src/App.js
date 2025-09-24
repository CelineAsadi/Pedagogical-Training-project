// import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Contact from './components/Contact';
import Forgetpassword from './components/Forgetpassword';
import MainPage from './components/MainPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import Profile from './components/Profile';
import { authStore } from './store/authStore';
import { useEffect } from 'react';
import { Toaster } from "react-hot-toast";
import VirtualClassroom from './components/VirtualClassroom';


function App() {
  const { authUser, checkAuth } = authStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Debug: log authUser whenever App renders
  console.log("AuthUser:", authUser);

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={!authUser ? <Home /> : <Navigate to="/MainPage" replace />} 
          />
          <Route
            path="/Login"
            element={!authUser ? <Login /> : <Navigate to="/MainPage" replace />}
          />
          <Route
            path="/Signup"
            element={!authUser ? <Signup /> : <Navigate to="/MainPage" replace />}
          />
          <Route
            path="/Forgetpassword"
            element={!authUser ? <Forgetpassword /> : <Navigate to="/MainPage" replace />}
          />
          <Route path="/Contact" element={<Contact />} />
          <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />

          {/* Protected Routes */}
          <Route
            path="/MainPage"
            element={authUser ? <MainPage /> : <Navigate to="/" replace />}
          />
          <Route
            path="/Profile"
            element={authUser ? <Profile /> : <Navigate to="/" replace />}
          />
          
        <Route path="/classroom" element={<VirtualClassroom />} />

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;
