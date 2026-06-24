import axios from 'axios';

const api = axios.create({
  baseURL: 'http://IP/api', 
});

export default api;

