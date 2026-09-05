import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

import DesktopBackground from "../assets/images/Get_start.svg";
import MobileBackground from "../assets/images/Get_startedMobile.svg";

import "../styles/getStarted.css";

const GetStarted = () => {
  return (
    <div className="get-started-page">
      <picture className="get-started-picture">
        <source
          media="(max-width: 600px)"
          srcSet={MobileBackground}
        />

        <img
          src={DesktopBackground}
          alt="Bites inventory landing page"
          className="get-started-background"
        />
      </picture>

      <div className="get-started-actions">
        <Link
          to="/login"
          className="get-started-btn"
        >
          Sign In
          <FiArrowRight />
        </Link>
      </div>
    </div>
  );
};

export default GetStarted;