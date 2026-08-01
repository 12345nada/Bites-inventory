import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] =
    useState(null);
  const [profile, setProfile] =
    useState(null);
  const [loading, setLoading] =
    useState(true);

  const getProfile = async (userId) => {
    if (!userId) {
      setProfile(null);
      return null;
    }

    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        is_active,
        role_id,
        roles (
          id,
          name,
          description,
          is_system_admin
        )
      `)
      .eq("id", userId)
      .single();

    if (error) {
      console.error(
        "Profile error:",
        error
      );

      setProfile(null);
      return null;
    }

    setProfile(data);
    return data;
  };

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const {
          data,
          error,
        } =
          await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!isMounted) return;

        const currentSession =
          data.session;

        setSession(currentSession);
        setUser(
          currentSession?.user ?? null
        );

        if (currentSession?.user) {
          await getProfile(
            currentSession.user.id
          );
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error(
          "Session error:",
          error
        );

        if (isMounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        async (
          event,
          currentSession
        ) => {
          if (!isMounted) return;

          setSession(currentSession);
          setUser(
            currentSession?.user ??
              null
          );

          if (
            event === "SIGNED_OUT" ||
            !currentSession?.user
          ) {
            setProfile(null);
            setLoading(false);
            return;
          }

          await getProfile(
            currentSession.user.id
          );

          setLoading(false);
        }
      );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Sign out error:",
        error
      );

      return {
        success: false,
        error,
      };
    }

    localStorage.removeItem(
      "bitesUserProfile"
    );

    setSession(null);
    setUser(null);
    setProfile(null);

    return {
      success: true,
      error: null,
    };
  };

  const refreshProfile = async () => {
    if (!user?.id) return null;

    return getProfile(user.id);
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: Boolean(
      profile?.roles
        ?.is_system_admin
    ),
    signOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
};