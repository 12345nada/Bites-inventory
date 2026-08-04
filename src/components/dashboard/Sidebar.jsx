import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FiGrid,
  FiCalendar,
  FiBox,
  FiShoppingCart,
  FiUsers,
  FiHome,
  FiTruck,
  FiCornerUpLeft,
  FiFileText,
  FiSettings,
  FiChevronDown,
  FiMenu,
  FiX,
  FiLogOut,
} from "react-icons/fi";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useDialog,
} from "../../context/DialogContext";

const menuItems = [
  ["Dashboard", "Dashboard", FiGrid, "/dashboard", "dashboard"],
  ["Events", "Events", FiCalendar, "/events", "events"],
  ["Items", "Items", FiBox, "/items", "items"],
  ["Purchase", "Purchase", FiShoppingCart, "/purchase", "purchase"],
  ["Suppliers", "Suppliers", FiUsers, "/suppliers", "suppliers"],
  ["Warehouse", "Warehouse", FiHome, "/warehouse", "warehouse"],
  ["Staff", "Staff", FiUsers, "/staff", "staff"],
  ["Dispatch", "Dispatch", FiTruck, "/dispatch", "dispatch"],
  ["Returns", "Returns", FiCornerUpLeft, "/returns", "returns"],
  ["Reports", "Reports", FiFileText, "/reports", "reports"],
].map(
  ([
    title,
    moduleName,
    icon,
    path,
    pageName,
  ]) => ({
    title,
    moduleName,
    icon,
    path,
    pageName,
  })
);

menuItems.push({
  title: "Settings",
  anyOfModules: [
    "Settings",
    "Users / Role",
  ],
  icon: FiSettings,
  path: "/settings",
  pageName: "settings",
});

export default function Sidebar({
  activePage = "dashboard",
}) {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    profile,
    isAdmin,
    hasPermission,
    hasAnyPermission,
    signOut,
  } = useAuth();

  const {
    showAlert,
    showConfirm,
  } = useDialog();

  const userMenuRef =
    useRef(null);

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);

  const [
    isUserMenuOpen,
    setIsUserMenuOpen,
  ] = useState(false);

  const [
    signingOut,
    setSigningOut,
  ] = useState(false);

  const visibleMenuItems =
    menuItems.filter((item) => {
      if (isAdmin) {
        return true;
      }

      if (item.anyOfModules) {
        return hasAnyPermission(
          item.anyOfModules,
          "view"
        );
      }

      return hasPermission(
        item.moduleName,
        "view"
      );
    });

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  const handleNavigation = (
    path
  ) => {
    navigate(path);
    closeSidebar();
    closeUserMenu();
  };

  const handleLogout = async () => {
    closeUserMenu();

    const confirmed =
      await showConfirm({
        title: "Logout",
        message:
          "Are you sure you want to logout?",
        confirmText: "Logout",
        cancelText: "Cancel",
        type: "warning",
      });

    if (!confirmed) {
      return;
    }

    try {
      setSigningOut(true);

      const result =
        await signOut();

      if (!result?.success) {
        throw (
          result?.error ||
          new Error(
            "Could not logout."
          )
        );
      }

      navigate(
        "/login",
        {
          replace: true,
        }
      );
    } catch (error) {
      await showAlert({
        title: "Logout Failed",
        message:
          error.message ||
          "Could not logout.",
        type: "error",
      });
    } finally {
      setSigningOut(false);
    }
  };

  useEffect(() => {
    closeSidebar();
    closeUserMenu();
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        closeSidebar();
        closeUserMenu();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);

  useEffect(() => {
    const handleOutsideClick = (
      event
    ) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(
          event.target
        )
      ) {
        closeUserMenu();
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle(
      "dashboard-sidebar-is-open",
      isSidebarOpen
    );

    return () => {
      document.body.classList.remove(
        "dashboard-sidebar-is-open"
      );
    };
  }, [isSidebarOpen]);

  return (
    <>
      <button
        type="button"
        className="dashboard-mobile-menu-button"
        onClick={() =>
          setIsSidebarOpen(
            (current) =>
              !current
          )
        }
        aria-label={
          isSidebarOpen
            ? "Close sidebar"
            : "Open sidebar"
        }
        aria-expanded={
          isSidebarOpen
        }
      >
        {isSidebarOpen ? (
          <FiX />
        ) : (
          <FiMenu />
        )}
      </button>

      <button
        type="button"
        className={`dashboard-sidebar-overlay ${
          isSidebarOpen
            ? "show"
            : ""
        }`}
        onClick={
          closeSidebar
        }
        aria-label="Close sidebar"
      />

      <aside
        className={`dashboard-sidebar ${
          isSidebarOpen
            ? "mobile-open"
            : ""
        }`}
      >
        <div className="sidebar-top">
          <button
            type="button"
            className="dashboard-logo"
            onClick={() => {
              const firstPath =
                visibleMenuItems[0]
                  ?.path;

              if (firstPath) {
                handleNavigation(
                  firstPath
                );
              }
            }}
          >
            bites
          </button>

          <nav
            className="sidebar-nav"
            aria-label="Dashboard navigation"
          >
            <ul className="dashboard-menu">
              {visibleMenuItems.map(
                (item) => {
                  const Icon =
                    item.icon;

                  const isActive =
                    activePage ===
                    item.pageName;

                  return (
                    <li
                      key={
                        item.pageName
                      }
                      className={
                        isActive
                          ? "active"
                          : ""
                      }
                    >
                      <button
                        type="button"
                        className="dashboard-menu-button"
                        onClick={() =>
                          handleNavigation(
                            item.path
                          )
                        }
                        aria-current={
                          isActive
                            ? "page"
                            : undefined
                        }
                      >
                        <span className="dashboard-menu-icon">
                          <Icon />
                        </span>

                        <span className="dashboard-menu-text">
                          {
                            item.title
                          }
                        </span>
                      </button>
                    </li>
                  );
                }
              )}
            </ul>
          </nav>
        </div>

        <div
          className="dashboard-user-wrapper"
          ref={userMenuRef}
        >
          {isUserMenuOpen && (
            <div className="dashboard-user-menu">
              <button
                type="button"
                className="dashboard-user-logout"
                onClick={handleLogout}
                disabled={signingOut}
              >
                <FiLogOut />

                <span>
                  {signingOut
                    ? "Logging out..."
                    : "Logout"}
                </span>
              </button>
            </div>
          )}

          <button
            type="button"
            className={`dashboard-user ${
              isUserMenuOpen
                ? "menu-open"
                : ""
            }`}
            onClick={() =>
              setIsUserMenuOpen(
                (current) =>
                  !current
              )
            }
            aria-label="Open user menu"
            aria-expanded={
              isUserMenuOpen
            }
            disabled={signingOut}
          >
            <div className="dashboard-avatar">
              {profile?.avatar_url ? (
                <img
                  src={
                    profile.avatar_url
                  }
                  alt={
                    profile.full_name ||
                    "Profile"
                  }
                />
              ) : (
                profile?.full_name
                  ?.trim()
                  ?.charAt(0)
                  ?.toUpperCase() ||
                "U"
              )}
            </div>

            <div className="dashboard-user-info">
              <strong>
                {profile?.full_name ||
                  "User"}
              </strong>

              <small className="dashboard-user-role">
                {profile?.roles?.name ||
                  "No Role"}
              </small>

              <small className="dashboard-user-username">
                {profile?.username
                  ? `username:${profile.username}`
                  : "@username"}
              </small>
            </div>

            <FiChevronDown
              className={`user-arrow ${
                isUserMenuOpen
                  ? "open"
                  : ""
              }`}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
