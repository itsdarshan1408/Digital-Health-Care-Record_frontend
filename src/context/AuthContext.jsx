import { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light');

  // Initialize user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    const storedTheme = localStorage.getItem('theme') || 'light';

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }

    setTheme(storedTheme);
    document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting login for:', email);
      const { data } = await axiosInstance.post('/auth/login', { email, password });
      console.log('AuthContext: Login successful:', data);
      
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      return { success: true };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      console.error('AuthContext: Error response:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed',
      };
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      console.log('AuthContext: Attempting registration for:', { name, email });
      const { data } = await axiosInstance.post('/auth/register', { name, email, password });
      console.log('AuthContext: Registration successful:', data);
      
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('token', data.token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      return { success: true };
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      console.error('AuthContext: Error response:', error.response?.data);
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed',
      };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    delete axiosInstance.defaults.headers.common['Authorization'];
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  // Update user data
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    theme,
    toggleTheme,
    updateUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
