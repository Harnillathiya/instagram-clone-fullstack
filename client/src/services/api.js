import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/users/login', credentials),
  register: (userData) => api.post('/users/register', userData),
};

// Users API calls
export const usersAPI = {
  getCurrentUser: () => api.get('/users/me'),
  getAllUsers: () => api.get('/users'),
  getUserById: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userData) => api.put('/users/me', userData),
  updateAvatar: (formData) => api.post('/users/me/avatar', formData),
};

// Messages API calls
export const messagesAPI = {
  getMessages: (userId) => api.get(`/messages/${userId}`),
  sendMessage: (messageData) => api.post('/messages', messageData),
  getChatMessages: (chatId) => api.get(`/messages/chat/${chatId}`),
  markMessagesAsRead: (userId) => api.put(`/messages/read/${userId}`),
  uploadImage: (formData) => api.post('/messages/upload-image', formData),
  getImage: (fileId) => api.get(`/messages/image/${fileId}`, { responseType: 'blob' }),
};

export default api; 