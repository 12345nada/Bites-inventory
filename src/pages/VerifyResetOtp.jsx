import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowRight, FiKey } from "react-icons/fi";
import { supabase } from "../lib/supabase";
import Background from "../assets/images/Background2.png";
import MobileBackground from "../assets/images/registerMobile.png";
import "../styles/register.css";

export default function VerifyResetOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const email =
    sessionStorage.getItem("passwordRecoveryEmail") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const token = otp.trim();

    if (!email || !token) {
      setErrorMessage(
        "The recovery request is missing. Please request a new OTP."
      );
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "recovery",
      });

      if (error) throw error;

      navigate("/reset-password", { replace: true });
    } catch (error) {
      setErrorMessage(
        error.message || "The OTP is invalid or expired."
      );
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
          alt="Bites OTP verification background"
          className="register-background"
        />
      </picture>

      <div className="register-content login-content">
        <div className="register-card login-card recovery-card">
          <h2>Verify OTP</h2>
          <p className="subtitle">
            {location.state?.message ||
              "Enter the OTP sent to your email"}
          </p>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="otp">OTP Code</label>
              <div className="input-wrapper">
                <FiKey className="input-icon" />
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  name="otp"
                  placeholder="Enter the OTP"
                  value={otp}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, ""));
                    setErrorMessage("");
                  }}
                  autoComplete="one-time-code"
                  disabled={loading}
                  maxLength={8}
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
              {loading ? "Verifying..." : "Verify OTP"}
              {!loading && <FiArrowRight />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
