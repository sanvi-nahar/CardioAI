import { createContext, useContext, useEffect, useState } from "react";
import { loginUser as apiLogin, registerUser as apiRegister, getProfile } from "../api/api";
import { createSocketConnection } from "../socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  const userRole = user?.role || null;
  const isAdmin = userRole === 'admin';
  const isDoctor = userRole === 'doctor';
  const isNurse = userRole === 'nurse';

  const hasPermission = (requiredRoles) => {
    if (!userRole) return false;
    return requiredRoles.includes(userRole);
  };

  const canAccess = (resource) => {
    const permissions = {
      dashboard: ['admin', 'doctor', 'nurse'],
      patients: ['admin', 'doctor'],
      'add-patient': ['admin', 'doctor'],
      alerts: ['admin', 'doctor', 'nurse'],
      settings: ['admin'],
      profile: ['admin', 'doctor', 'nurse'],
      'patient-detail': ['admin', 'doctor', 'nurse'],
    };
    return permissions[resource]?.includes(userRole) || false;
  };

  // Persistent Login via global API fetch
  useEffect(() => {
    const checkUser = async () => {
      if (token) {
        try {
          const profile = await getProfile();
          setUser(profile);
          setSocket(createSocketConnection(token));
        } catch (error) {
          console.error("Failed to fetch user, token might be expired", error);
          logout();
        }
      }
      setLoading(false);
    };
    checkUser();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [token]);

  const login = async (credentials) => {
    const data = await apiLogin(credentials);
    const resolvedUser = data.user;

    setToken(resolvedUser.token);
    setUser(resolvedUser);
    localStorage.setItem("token", resolvedUser.token);

    if (socket) socket.disconnect();
    const newSocket = createSocketConnection(resolvedUser.token);
    setSocket(newSocket);

    return resolvedUser;
  };

  const register = async (credentials) => {
    const data = await apiRegister(credentials);
    return data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      loading, 
      socket, 
      login, 
      register, 
      logout,
      userRole,
      isAdmin,
      isDoctor,
      isNurse,
      hasPermission,
      canAccess
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
