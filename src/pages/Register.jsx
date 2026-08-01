import React, {
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  FiUser,
  FiMail,
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

const Register = () => {
  const navigate = useNavigate();

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    formData,
    setFormData,
  ] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setFormError("");
    setSuccessMessage("");
  };

  const getPasswordStrength = (
    password
  ) => {
    if (password.length === 0) {
      return 0;
    }

    if (password.length < 6) {
      return 1;
    }

    if (password.length < 10) {
      return 2;
    }

    return 3;
  };

  const strength =
    getPasswordStrength(
      formData.password
    );

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setFormError("");
    setSuccessMessage("");

    const fullName =
      formData.fullName.trim();

    const email =
      formData.email
        .trim()
        .toLowerCase();

    if (!fullName) {
      setFormError(
        "Please enter your full name."
      );

      return;
    }

    if (
      formData.password.length < 6
    ) {
      setFormError(
        "Password must contain at least 6 characters."
      );

      return;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setFormError(
        "Passwords do not match."
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data,
        error,
      } = await supabase.auth.signUp({
        email,
        password:
          formData.password,

        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          "The account could not be created."
        );
      }

      setSuccessMessage(
        data.session
          ? "Account created successfully."
          : "Account created. Please check your email to confirm your account."
      );

      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      if (data.session) {
        await supabase.auth.signOut();
      }

      window.setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setFormError(
        error.message ||
          "Something went wrong while creating the account."
      );
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
          alt="Bites registration background"
          className="register-background"
        />
      </picture>

      <div className="register-content">
        <div className="register-card">
          <h2>Create Your Account</h2>

          <p className="subtitle">
            Fill in your details to get
            started
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="fullName">
                Full Name
              </label>

              <div className="input-wrapper">
                <FiUser className="input-icon" />

                <input
                  id="fullName"
                  type="text"
                  name="fullName"
                  placeholder="Enter your full name"
                  value={
                    formData.fullName
                  }
                  onChange={handleChange}
                  autoComplete="name"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

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
                  autoComplete="new-password"
                  minLength={6}
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

              <div className="password-strength">
                <div className="strength-bar">
                  <span
                    className={
                      strength >= 1
                        ? "active"
                        : ""
                    }
                  />

                  <span
                    className={
                      strength >= 2
                        ? "active"
                        : ""
                    }
                  />

                  <span
                    className={
                      strength >= 3
                        ? "active"
                        : ""
                    }
                  />
                </div>

                <small>
                  Password strength
                </small>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="input-wrapper">
                <FiLock className="input-icon" />

                <input
                  id="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={
                    formData
                      .confirmPassword
                  }
                  onChange={handleChange}
                  autoComplete="new-password"
                  minLength={6}
                  disabled={isSubmitting}
                  required
                />

                <button
                  type="button"
                  className="toggle-icon"
                  onClick={() =>
                    setShowConfirmPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}
                </button>
              </div>
            </div>

            {formError && (
              <p
                className="register-message register-error"
                role="alert"
              >
                {formError}
              </p>
            )}

            {successMessage && (
              <p
                className="register-message register-success"
                role="status"
              >
                {successMessage}
              </p>
            )}

            <button
              type="submit"
              className="create-btn"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Creating Account..."
                : "Create Account"}

              {!isSubmitting && (
                <FiArrowRight />
              )}
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <p className="signin-text">
              Already have an account?

              <Link to="/login">
                Sign In →
              </Link>
            </p>
          </form>
        </div>

        <p className="terms">
          By creating an account, you
          agree to our{" "}

          <a href="#">
            Terms of Service
          </a>

          {" "}and{" "}

          <a href="#">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Register;