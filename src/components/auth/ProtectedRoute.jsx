import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

const MODULE_ROUTES = [
  ["Dashboard", "/dashboard"],
  ["Events", "/events"],
  ["Items", "/items"],
  ["Purchase", "/purchase"],
  ["Suppliers", "/suppliers"],
  ["Warehouse", "/warehouse"],
  ["Staff", "/staff"],
  ["Dispatch", "/dispatch"],
  ["Returns", "/returns"],
  ["Reports", "/reports"],
  ["Settings", "/settings"],
  ["Users / Role", "/settings"],
].map(([moduleName, path]) => ({
  moduleName,
  path,
}));

const ProtectedRoute = ({
  moduleName,
  anyOfModules = [],
  action = "view",
}) => {
  const {
    user,
    profile,
    loading,
    isAdmin,
    hasPermission,
    hasAnyPermission,
  } = useAuth();

  const location =
    useLocation();

  if (loading) {
    return (
      <div className="auth-loading-page">
        <div className="auth-loading-spinner" />
        <p>Loading your account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from:
            location.pathname,
        }}
      />
    );
  }

  if (!profile) {
    return (
      <div className="auth-access-page">
        <h2>Profile Not Found</h2>
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
        <h2>Account Inactive</h2>
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
        <h2>Role Not Assigned</h2>
        <p>
          No role has been assigned to
          your account.
        </p>
      </div>
    );
  }

  const hasAccess =
    anyOfModules.length > 0
      ? hasAnyPermission(
          anyOfModules,
          action
        )
      : moduleName
        ? hasPermission(
            moduleName,
            action
          )
        : true;

  if (!hasAccess) {
    const firstAllowedPath =
      isAdmin
        ? "/dashboard"
        : MODULE_ROUTES.find(
            (route) =>
              hasPermission(
                route.moduleName,
                "view"
              )
          )?.path;

    if (
      firstAllowedPath &&
      firstAllowedPath !==
        location.pathname
    ) {
      return (
        <Navigate
          to={firstAllowedPath}
          replace
        />
      );
    }

    return (
      <div className="auth-access-page">
        <h2>Access Denied</h2>
        <p>
          Your role does not have
          access to any page. Please
          contact the administrator.
        </p>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
