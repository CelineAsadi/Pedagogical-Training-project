// Import necessary hooks and utilities from React, axios for HTTP requests, and react-router-dom for navigation
import { useState } from 'react'; // Import useState and useEffect from React
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom
import { axiosInstance } from '../lib/axios';

// Define a custom hook for managing login logic
const Login = ()=>{

   const handleClick = async()=>{
    await axiosInstance.post('auth/Login',{Email:"celine@email.com",password:"123456"})
   }

    return <div>
        <button onClick={handleClick}>button</button>
    </div>
};


export default Login;