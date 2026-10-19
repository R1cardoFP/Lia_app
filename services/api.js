import axios from 'axios';
import * as SecureStore from "expo-secure-store";

const API_URL = 'http://192.168.1.38:8000';

const api = axios.create({
  baseURL:`${API_URL}/api`,
  timeout: 20000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("authToken"); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; 
  }
  return config;
}, (error) => {
  
  return Promise.reject(error);   php artisan serve --host=0.0.0.0 --port=8000
});

export { API_URL };
export default api;






