import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiMail, FiUser } from "react-icons/fi";
import { supabase } from "../lib/supabase";
import Background from "../assets/images/Background2.png";
import MobileBackground from "../assets/images/registerMobile.png";
import "../styles/register.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const username = formData.username.trim().toLowerCase();
    const email = formData.email.trim().toLowerCase();

    if (!username || !email) {
      setErrorMessage("Please enter your username and email.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke(
        "request-password-reset",
        { body: { username, email } }
      );

      if (error) {
        let message = error.message || "Could not send OTP.";
        try {
          const response = await error.context?.json?.();
          if (response?.error) message = response.error;
        } catch {}
        throw new Error(message);
      }

      sessionStorage.setItem("passwordRecoveryEmail", email);

      navigate("/verify-reset-otp", {
        replace: true,
        state: {
          message:
            data?.message ||
            "Check your email for the OTP.",
        },
      });
    } catch (error) {
      setErrorMessage(error.message || "Could not send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <picture className="register-picture">
        <source media="(max-width: 600px)" srcSet={MobileBackground} />
        <img
          src={Background}
          alt="Bites password recovery background"
          className="register-background"
        />
      </picture>

      <div className="register-content login-content">
        <div className="register-card login-card recovery-card">
          <h2>Forgot Password</h2>
          <p className="subtitle">
            Enter your username and real email to receive an OTP
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="username">Username</label>
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
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Real Email</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Enter your real email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {errorMessage && (
              <p className="login-error-message" role="alert">
                {errorMessage}
              </p>
            )}

            <button type="submit" className="create-btn" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
              {!loading && <FiArrowRight />}
            </button>

            <Link to="/login" className="recovery-back-link">
              <FiArrowLeft />
              Back to Sign In
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
