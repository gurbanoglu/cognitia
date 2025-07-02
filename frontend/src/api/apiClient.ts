import axios from 'axios';
import { getCookie } from './getCookie';

// Base URL configured for your backend API
const apiClient = axios.create({
  /* The purpose of baseURL is to define a common root
     URL for all HTTP requests made through that Axios
     instance.

     This way only the relative path in the individual
     API calls need to be specified rather than the full
     URL. */
  baseURL: 'http://localhost:8000/',
  headers: {
    'Content-Type': 'application/json'
  },
  // A ten second timeout.
  timeout: 10000,
  // Axios to send cookies and authentication
  // information in cross-origin requests.
  withCredentials: true
});

// Request interceptor to add auth token dynamically
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    const csrfToken = getCookie('csrftoken'); // assumes standard cookie name

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method || '')) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized errors globally (e.g., redirect to login)
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;