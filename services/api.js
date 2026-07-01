import axios from 'axios';
import * as SecureStore from "expo-secure-store";

const API_URL = 'http://192.168.1.144:8000';


const api = axios.create({
  baseURL:`${API_URL}/api`,
  
 
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("authToken"); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; 
  }
  return config;
}, (error) => {
  
  return Promise.reject(error);
});

export { API_URL };
export default api;






