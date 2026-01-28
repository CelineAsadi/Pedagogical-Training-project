import {create} from "zustand";
import { axiosInstance } from "../lib/axios";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
/**
 * Authentication Store (Zustand)
 * This store manages:
 * - User authentication state
 * - Login / Logout / Signup flows
 * - Email verification & password reset
 * - Profile updates
 * It communicates with the backend via Axios
 * and provides global auth state to the client.
 */
export const authStore = create((set,get)=>({
    authUser:null,
     /**
   * Checks if the user is already authenticated
   * (used on app load / refresh).
   */
    checkAuth: async()=>{
        try {
        const res = await axiosInstance.get("/auth/check");
        set({authUser:res.data});
        } catch(err) {
            console.log("Error in check authentication: ",err);
            set({authUser:null});
        }
    },
    //Logs in a user with email & password.
    login: async(data)=>{
    try{
        const res = await axiosInstance.post('/auth/Login',data);
        set({authUser: res.data});
        toast.success("Logged in succesfully");
    } catch(err){
        console.log("Error in Login: ",err);
        const message = err.response?.data?.message || "Login failed";
        toast.error(message);
        set({authUser:null});
    }
},
//Logs out the current user and clears auth state.
    logout: async()=>{
        try{
            const res = await axiosInstance.post('/auth/Logout');
            set({authUser: null});
            toast.success("Logged out succesfully");
         }  catch(err){
             console.log("Error in logout: ",err);
             toast.error(err.response.data.message);
            } 
    },
    //Registers a new user.
    signup: async(data)=>{
        try{
        const res = await axiosInstance.post('/auth/Signup',data);
        set({authUser:res.data});
        toast.success("Signed up succesfully");
        } catch(err) {
            console.log("Error in Signing up: ",err);
            toast.error(err.response.data.message);
        }
    },
    /**
   * Sends a verification code to the user's email
   * (used for password reset).
   */
   VerifyEmail: async(data)=>{
        try{
            await axiosInstance.post("/auth/Forgetpassword",data);
            toast.success('Verification code was sent');
            return true;
        }catch(err){
            console.log('Error in sending code: ',err);
            toast.error(err.response?.data?.message || "Failed to send code");
            return false;
        }
    },
    //Resets the user's password using a verification code.
    ResetPassword : async(data)=>{
        try{
            await axiosInstance.post("/auth/Forgetpassword",data);
            toast.success('Password reset successfully');
            return true;
        }catch(err){
            console.log('Error in reseting password', err);
            toast.error(err.response?.data?.message || "Reset failed");
            return false;
        }
    },
    //Updates the user's profile details.
    updateProfile: async (data)=> {
  try {
    const res = await axiosInstance.put("/auth/Profile", data);
    set({authUser: res.data });
    toast.success("Profile updated successfully");
  } catch(err) {
    console.log("error in update updateProfile:", err);
    toast.error(err.response?.data?.message || "Failed to updateProfile");
  }
},
//Verifies a new email address before updating it.
verifyNewEmail: async(data) => {
  try {
    const res = await axiosInstance.post("/auth/verify-email-update", data);
    toast.success(res.data.message);
    return true;
  } catch(err) {
    console.log("Error in verifyNewEmail:", err);
    toast.error(err.response?.data?.message || "Failed to verify email");
    return false;
  }
},
}));