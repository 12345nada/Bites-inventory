import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiEye, FiEyeOff, FiLock } from "react-icons/fi";
import { supabase } from "../lib/supabase";
import Background from "../assets/images/Background2.png";
import MobileBackground from "../assets/images/registerMobile.png";
import "../styles/register.css";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrorMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.password.length < 6) {
      setErrorMessage("Password must contain at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) throw error;

      sessionStorage.removeItem("passwordRecoveryEmail");
      await supabase.auth.signOut();

      navigate("/login", {
        replace: true,
        state: { passwordReset: true },
      });
    } catch (error) {
      setErrorMessage(error.message || "Could not update password.");
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
          alt="Bites reset password background"
          className="register-background"
        />
      </picture>

      <div className="register-content login-content">
        <div className="register-card login-card recovery-card">
          <h2>Reset Password</h2>
          <p className="subtitle">
            Create a new password for your account
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="password">New Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="toggle-icon"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Repeat new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="toggle-icon"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
                  disabled={loading}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <p className="login-error-message" role="alert">
                {errorMessage}
              </p>
            )}

            <button type="submit" className="create-btn" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
              {!loading && <FiArrowRight />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}