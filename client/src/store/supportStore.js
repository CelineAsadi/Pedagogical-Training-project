import { axiosInstance } from "../lib/axios";
import {create} from "zustand";
import toast from "react-hot-toast";
/**
 * Support Store (Zustand)
 * Handles user support / contact-us requests.
 * Used in:
 * - Contact Us 
 * Responsibilities:
 * - Send support message to backend
 * - Show success / error feedback to user
 */
export const supportStore = create((set,get)=>({
    contactUs: async(data)=>{
        try{
            const res = await axiosInstance.post('/supports/support',data);
            toast.success('your message was sent successfully');
            return true;
        } catch(err){
            console.log("Error in sending: ",err);
            toast.error(err.response.data.message);
        }
    },
}));