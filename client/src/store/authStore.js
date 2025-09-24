import {create} from "zustand";
import { axiosInstance } from "../lib/axios";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
export const authStore = create((set,get)=>({
    authUser:null,
    checkAuth: async()=>{
        try {
        const res = await axiosInstance.get("/auth/check");
        set({authUser:res.data});
        } catch(err) {
            console.log("Error in check authentication: ",err);
            set({authUser:null});
        }
    },

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

    ResetPassword : async(data)=>{
        try{
            await axiosInstance.post("/auth/Forgetpassword",data);
            toast.success('Password reset successfully');
            return true; // ✅ tell component that reset worked
        }catch(err){
            console.log('Error in reseting password', err);
            toast.error(err.response?.data?.message || "Reset failed");
            return false;
        }
    },
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

}));