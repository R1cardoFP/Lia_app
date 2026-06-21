import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.1.144:8000/api', 
});

export default api;