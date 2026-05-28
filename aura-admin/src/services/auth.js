import axios from 'axios';

const API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api/auth';
const ANALYTICS_URL = import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:5000/api/analytics';
export const getMetrics = async () => {
  try {
    const res = await axios.get(`${ANALYTICS_URL}/metrics`);
    return res.data;
  } catch (error) {
    console.error(error);
    throw 'Failed to load metrics';
  }
};

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/login`, { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Login failed';
  }
};

export const signup = async (username, email, password) => {
  try {
    const response = await axios.post(`${API_URL}/signup`, { username, email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Signup failed';
  }
};

export const verifyToken = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/verify`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Token verification failed';
  }
};

export const getNotifications = async (userId, token) => {
  try {
    const response = await axios.get(`${API_URL}/notifications/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to fetch notifications';
  }
};

export const markNotificationRead = async (notificationId, token) => {
  try {
    const response = await axios.put(
      `${API_URL}/notifications/${notificationId}/read`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data?.error || 'Failed to mark notification as read';
  }
};