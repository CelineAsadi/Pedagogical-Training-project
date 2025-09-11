// import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';


import Login from './components/Login';




function App() {
  return (
    // BrowserRouter component wraps the application to enable routing
    <BrowserRouter>
      <Routes>
        {/* Define routes for the application */}       
        <Route path="/Login" element={<Login />} /> {/* Route for the Login page */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;