import { createContext, useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("userRole") || "candidate");

  useEffect(() => {
    const syncToken = async () => {
      if (isLoaded && isSignedIn) {
        const t = await getToken();
        setToken(t);
      } else if (isLoaded && !isSignedIn) {
        setToken(null);
      }
    };
    syncToken();

    // keep token somewhat fresh
    const intervalId = setInterval(syncToken, 50 * 1000);
    return () => clearInterval(intervalId);
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (role) localStorage.setItem("userRole", role);
  }, [role]);

  return (
    <AuthContext.Provider value={{ token, setToken, role, setRole, user }}>
      {children}
    </AuthContext.Provider>
  );
};
