import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

import Background from "../assets/images/Get_start.png";
import "../styles/getStarted.css";

const GetStarted = () => {
  return (
    <div className="get-started-page">
      <img
        src={Background}
        alt="Bites inventory landing page"
        className="get-started-background"
      />

      <div className="get-started-actions">
        <Link to="/register" className="get-started-btn">
          Get Started
          <FiArrowRight />
        </Link>

        <Link to="/login" className="sign-in-btn">
          Sign In
          <FiArrowRight />
        </Link>
      </div>
    </div>
  );
};

export default GetStarted;