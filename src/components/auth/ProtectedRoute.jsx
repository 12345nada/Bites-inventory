import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

const ProtectedRoute = () => {
  const {
    user,
    profile,
    loading,
  } = useAuth();

  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-page">
        <div className="auth-loading-spinner" />

        <p>
          Loading your account...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (!profile) {
    return (
      <div className="auth-access-page">
        <h2>
          Profile Not Found
        </h2>

        <p>
          Your employee profile could
          not be found. Please contact
          the administrator.
        </p>
      </div>
    );
  }

  if (!profile.is_active) {
    return (
      <div className="auth-access-page">
        <h2>
          Account Inactive
        </h2>

        <p>
          Your account is inactive.
          Please contact the
          administrator.
        </p>
      </div>
    );
  }

  if (
    !profile.role_id ||
    !profile.roles
  ) {
    return (
      <div className="auth-access-page">
        <h2>
          Role Not Assigned
        </h2>

        <p>
          No role has been assigned to
          your account.
        </p>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;