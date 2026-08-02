import React, {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  FiUser,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
} from "react-icons/fi";

import {
  supabase,
} from "../lib/supabase";

import Background from "../assets/images/Background2.png";
import MobileBackground from "../assets/images/registerMobile.png";

import "../styles/register.css";

const MODULE_ROUTES = [
  {
    moduleName: "Dashboard",
    path: "/dashboard",
  },
  {
    moduleName: "Events",
    path: "/events",
  },
  {
    moduleName: "Items",
    path: "/items",
  },
  {
    moduleName: "Purchase",
    path: "/purchase",
  },
  {
    moduleName: "Suppliers",
    path: "/suppliers",
  },
  {
    moduleName: "Warehouse",
    path: "/warehouse",
  },
  {
    moduleName: "Staff",
    path: "/staff",
  },
  {
    moduleName: "Dispatch",
    path: "/dispatch",
  },
  {
    moduleName: "Returns",
    path: "/returns",
  },
  {
    moduleName: "Reports",
    path: "/reports",
  },
  {
    moduleName: "Settings",
    path: "/settings",
  },
  {
    moduleName: "Users / Role",
    path: "/settings",
  },
];

const getFirstAllowedRoute = (
  profile
) => {
  if (
    profile?.roles
      ?.is_system_admin
  ) {
    return "/dashboard";
  }

  const permissions =
    profile?.roles
      ?.role_permissions || [];

  const allowedModules =
    new Set(
      permissions
        .filter(
          (permission) =>
            permission.can_view
        )
        .map(
          (permission) =>
            permission.module_name
        )
    );

  return (
    MODULE_ROUTES.find(
      (route) =>
        allowedModules.has(
          route.moduleName
        )
    )?.path || null
  );
};

const Login = () => {
  const navigate = useNavigate();

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    formData,
    setFormData,
  ] = useState({
    username: "",
    password: "",
  });

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );

    setErrorMessage("");
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setIsSubmitting(true);

    const loginValue =
      formData.username
        .trim()
        .toLowerCase();

    const email =
      loginValue.includes("@")
        ? loginValue
        : `${loginValue}@bites-inventory.app`;

    try {
      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth
          .signInWithPassword({
            email,
            password:
              formData.password,
          });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error(
          "Unable to sign in."
        );
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
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
        .eq(
          "id",
          authData.user.id
        )
        .single();

      if (profileError) {
        await supabase.auth
          .signOut({
            scope: "local",
          });

        throw new Error(
          "Your employee profile was not found. Please contact the administrator."
        );
      }

      if (!profile.is_active) {
        await supabase.auth
          .signOut({
            scope: "local",
          });

        throw new Error(
          "Your account is inactive. Please contact the administrator."
        );
      }

      if (
        !profile.role_id ||
        !profile.roles
      ) {
        await supabase.auth
          .signOut({
            scope: "local",
          });

        throw new Error(
          "No role has been assigned to your account."
        );
      }

      const firstAllowedRoute =
        getFirstAllowedRoute(
          profile
        );

      if (!firstAllowedRoute) {
        await supabase.auth
          .signOut({
            scope: "local",
          });

        throw new Error(
          "Your role does not have access to any page. Please contact the administrator."
        );
      }

      localStorage.setItem(
        "bitesUserProfile",
        JSON.stringify({
          id: profile.id,
          fullName:
            profile.full_name,
          username:
            profile.username,
          email: profile.email,
          role:
            profile.roles.name,
          isAdmin:
            profile.roles
              .is_system_admin,
        })
      );

      navigate(
        firstAllowedRoute,
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      let message =
        error.message ||
        "Incorrect username or password.";

      if (
        message
          .toLowerCase()
          .includes(
            "invalid login credentials"
          )
      ) {
        message =
          "Incorrect username or password.";
      }

      if (
        message
          .toLowerCase()
          .includes(
            "email not confirmed"
          )
      ) {
        message =
          "Please confirm your email before signing in.";
      }

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <picture className="register-picture">
        <source
          media="(max-width: 600px)"
          srcSet={MobileBackground}
        />

        <img
          src={Background}
          alt="Bites login background"
          className="register-background"
        />
      </picture>

      <div className="register-content login-content">
        <div className="register-card login-card">
          <h2>Welcome Back</h2>

          <p className="subtitle">
            Please sign in to your
            account
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">
                Username
              </label>

              <div className="input-wrapper">
                <FiUser className="input-icon" />

                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">
                Password
              </label>

              <div className="input-wrapper">
                <FiLock className="input-icon" />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter your password"
                  value={
                    formData.password
                  }
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  required
                />

                <button
                  type="button"
                  className="toggle-icon"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}
                </button>
              </div>
            </div>

            <div className="remember-forgot">
              <span />

              <Link to="/forgot-password">
                Forgot Password?
              </Link>
            </div>

            {errorMessage && (
              <p
                className="login-error-message"
                role="alert"
              >
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="create-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Signing In..."
                : "Sign In"}

              {!isSubmitting && (
                <FiArrowRight />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
