import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const normalizePermissions = (
  permissionRows = []
) => {
  return permissionRows.reduce(
    (permissions, row) => {
      const moduleName =
        row.module_name;

      if (!moduleName) {
        return permissions;
      }

      permissions[
        normalizeKey(moduleName)
      ] = {
        view: Boolean(row.can_view),
        add: Boolean(row.can_add),
        edit: Boolean(row.can_edit),
        delete: Boolean(
          row.can_delete
        ),
      };

      return permissions;
    },
    {}
  );
};

export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] =
    useState(null);

  const [session, setSession] =
    useState(null);

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const getProfile = useCallback(
    async (userId) => {
      if (!userId) {
        setProfile(null);
        return null;
      }

      const { data, error } =
        await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            username,
            email,
            avatar_url,
            is_active,
            role_id,
            roles (
              id,
              name,
              description,
              is_system_admin,
              role_permissions (
                id,
                module_name,
                can_view,
                can_add,
                can_edit,
                can_delete
              )
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

      const normalizedProfile = {
        ...data,

        permissions:
          normalizePermissions(
            data.roles
              ?.role_permissions || []
          ),
      };

      setProfile(
        normalizedProfile
      );

      return normalizedProfile;
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const { data, error } =
          await supabase.auth
            .getSession();

        if (error) {
          throw error;
        }

        if (!isMounted) {
          return;
        }

        const currentSession =
          data.session;

        setSession(
          currentSession
        );

        setUser(
          currentSession?.user ??
            null
        );

        if (
          currentSession?.user
        ) {
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
    } = supabase.auth
      .onAuthStateChange(
        async (
          event,
          currentSession
        ) => {
          if (!isMounted) {
            return;
          }

          setSession(
            currentSession
          );

          setUser(
            currentSession?.user ??
              null
          );

          if (
            event ===
              "SIGNED_OUT" ||
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
  }, [getProfile]);

  const signOut = async () => {
    const { error } =
      await supabase.auth
        .signOut();

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

  const refreshProfile =
    useCallback(async () => {
      if (!user?.id) {
        return null;
      }

      return getProfile(
        user.id
      );
    }, [
      user?.id,
      getProfile,
    ]);

  const updateProfileAvatar =
    async (avatarUrl) => {
      if (!user?.id) {
        return {
          success: false,

          error: new Error(
            "No authenticated user."
          ),
        };
      }

      const { error } =
        await supabase
          .from("profiles")
          .update({
            avatar_url:
              avatarUrl,
          })
          .eq("id", user.id);

      if (error) {
        console.error(
          "Avatar update error:",
          error
        );

        return {
          success: false,
          error,
        };
      }

      const updatedProfile =
        await getProfile(
          user.id
        );

      return {
        success: true,
        error: null,
        profile:
          updatedProfile,
      };
    };

  const isAdmin = Boolean(
    profile?.roles
      ?.is_system_admin
  );

  const hasPermission =
    useCallback(
      (
        moduleName,
        action = "view"
      ) => {
        if (isAdmin) {
          return true;
        }

        const moduleKey =
          normalizeKey(
            moduleName
          );

        const actionKey =
          normalizeKey(
            action
          );

        if (
          !moduleKey ||
          !actionKey
        ) {
          return false;
        }

        return Boolean(
          profile?.permissions?.[
            moduleKey
          ]?.[actionKey]
        );
      },
      [
        isAdmin,
        profile?.permissions,
      ]
    );

  const hasAnyPermission =
    useCallback(
      (
        moduleNames = [],
        action = "view"
      ) => {
        if (isAdmin) {
          return true;
        }

        return moduleNames.some(
          (moduleName) =>
            hasPermission(
              moduleName,
              action
            )
        );
      },
      [
        isAdmin,
        hasPermission,
      ]
    );

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,

      isAuthenticated:
        Boolean(user),

      isAdmin,
      hasPermission,
      hasAnyPermission,
      signOut,
      refreshProfile,
      updateProfileAvatar,
    }),
    [
      user,
      session,
      profile,
      loading,
      isAdmin,
      hasPermission,
      hasAnyPermission,
      refreshProfile,
    ]
  );

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