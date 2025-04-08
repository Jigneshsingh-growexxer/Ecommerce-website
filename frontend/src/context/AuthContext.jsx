import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import * as authService from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const decoded = jwtDecode(token);

          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            logout();
            return;
          }

          setUser({ id: decoded.id });
        } catch (error) {
          console.error("Failed to decode token:", error);
          logout(false); // Don't redirect on token error
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const register = async (userData) => {
    try {
      setLoading(true);
      const result = await authService.register(userData);
      navigate("/login");
      return result;
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const result = await authService.login(credentials);

      if (result.token) {
        const decoded = jwtDecode(result.token);
        setUser({ id: decoded.id });
        navigate("/");
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = (shouldRedirect = true) => {
    authService.logout();
    setUser(null);
    if (shouldRedirect) {
      navigate("/login");
    }
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      return await authService.forgotPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, password) => {
    try {
      setLoading(true);
      return await authService.resetPassword(token, password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        logout,
        forgotPassword,
        resetPassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
