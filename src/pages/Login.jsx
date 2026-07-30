import React, { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
} from "react-icons/fi";

import Background from "../assets/images/Background2.png";
import "../styles/register.css";

const Login = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const savedUser = JSON.parse(
      localStorage.getItem("registeredUser")
    );

    if (!savedUser) {
      alert(
        "No account found. Please create an account first."
      );

      navigate("/register");
      return;
    }

    const enteredEmail = formData.email
      .trim()
      .toLowerCase();

    const isEmailCorrect =
      savedUser.email === enteredEmail;

    const isPasswordCorrect =
      savedUser.password === formData.password;

    if (
      !isEmailCorrect ||
      !isPasswordCorrect
    ) {
      alert("Incorrect email or password");
      return;
    }

    if (formData.rememberMe) {
      localStorage.setItem(
        "isLoggedIn",
        "true"
      );
    } else {
      sessionStorage.setItem(
        "isLoggedIn",
        "true"
      );
    }

    navigate("/dashboard");
  };

  return (
    <div className="register-page">
      <img
        src={Background}
        alt="Bites login background"
        className="register-background"
      />

      <div className="register-content login-content">
        <div className="register-card login-card">
          <h2>Welcome Back</h2>

          <p className="subtitle">
            Please sign in to your account
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="email">
                Email Address
              </label>

              <div className="input-wrapper">
                <FiMail className="input-icon" />

                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
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
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="toggle-icon"
                  onClick={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
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
              <label className="remember-me">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />

                <span>Remember me</span>
              </label>

              <Link to="/forgot-password">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="create-btn"
            >
              Sign In
              <FiArrowRight />
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <p className="signin-text">
              Don&apos;t have an account?
              <Link to="/register">
                Sign Up →
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;