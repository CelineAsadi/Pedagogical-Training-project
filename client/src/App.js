// import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
//kk
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Contact from './components/Contact';
import Forgetpassword from './components/Forgetpassword';
import MainPage from './components/MainPage';


function App() {
  return (
    // BrowserRouter component wraps the application to enable routing
    <BrowserRouter>
      <Routes>
        {/* Define routes for the application */}   
        <Route path="/" element={<Home />} /> {/* Route for the Home page */}    
        <Route path="/Login" element={<Login />} /> {/* Route for the Login page */}
         <Route path="/Signup" element={<Signup />} /> {/* Route for the Signup page */}
         <Route path="/Contact" element={<Contact />} /> {/* Route for the Contact page */}
         <Route path="/Forgetpassword" element={<Forgetpassword />} /> {/* Route for the Forgetpassword page */}
         <Route path="/MainPage" element={<MainPage />} /> {/* Route for the MainPage page */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;
