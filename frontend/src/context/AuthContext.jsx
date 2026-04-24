/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useMemo } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [role, setRole] = useState(localStorage.getItem("userRole") || "candidate");

  // ── Writable display name override (so edits in Profile propagate instantly) ──
  const [displayName, setDisplayName] = useState(
    localStorage.getItem("customDisplayName") || null
  );

  // ── Sync Clerk JWT token ────────────────────────────────────────────────────
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

  // Persist the custom display name override to localStorage
  useEffect(() => {
    if (displayName !== null) {
      localStorage.setItem("customDisplayName", displayName);
      localStorage.setItem("userName", displayName); // keep legacy key in sync
    }
  }, [displayName]);

  // ── Derive identity: customDisplayName > Clerk > localStorage fallback ─────
  const userName = useMemo(() => {
    // If the user has explicitly set a display name in their profile, use it
    if (displayName) return displayName;

    // Otherwise derive from Clerk
    if (userLoaded && user) {
      const clerkName =
        user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
        "";
      if (clerkName) {
        localStorage.setItem("userName", clerkName);
        return clerkName;
      }
    }
    return localStorage.getItem("userName") || "Learner";
  }, [displayName, userLoaded, user]);

  const userEmail = useMemo(() => {
    if (userLoaded && user) {
      const clerkEmail = user.primaryEmailAddress?.emailAddress || "";
      if (clerkEmail) {
        localStorage.setItem("userEmail", clerkEmail);
        return clerkEmail;
      }
    }
    return localStorage.getItem("userEmail") || "";
  }, [userLoaded, user]);

  // Clear the custom name override on logout
  const handleSetToken = (t) => {
    if (!t) {
      setDisplayName(null);
      localStorage.removeItem("customDisplayName");
    }
    setToken(t);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        setToken: handleSetToken,
        role,
        setRole,
        user,
        userName,
        userEmail,
        setDisplayName, // expose so Profile can push updates instantly
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
