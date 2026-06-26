import axios from 'axios';
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: 'http://192.168.1.144:8000/api',
  //192.168.1.144 
  //10.232.157.217
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("authToken"); // Pega o token seguro
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Adiciona o token no header
  }
  return config;
}, (error) => {
  // Captura erro antes de enviar a requisição
  return Promise.reject(error);
});

export default api;






