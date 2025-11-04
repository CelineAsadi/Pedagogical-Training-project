//import { data } from "react-router-dom";
import { axiosInstance } from "../lib/axios";
import {create} from "zustand";
import toast from "react-hot-toast";

export const supportStore = create((set,get)=>({
    contactUs: async(data)=>{
        try{
            const res = await axiosInstance.post('/supports/support',data);
            toast.success('your message was sent successfully');
        } catch(err){
            console.log("Error in sending: ",err);
            toast.error(err.response.data.message);
        }
    },
}));