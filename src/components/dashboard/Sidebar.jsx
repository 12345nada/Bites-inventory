import {
  useEffect,
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
} from "react-icons/fi";

import {
  useAuth,
} from "../../context/AuthContext";

const menuItems = [
  {
    title: "Dashboard",
    moduleName: "Dashboard",
    icon: FiGrid,
    path: "/dashboard",
    pageName: "dashboard",
  },
  {
    title: "Events",
    moduleName: "Events",
    icon: FiCalendar,
    path: "/events",
    pageName: "events",
  },
  {
    title: "Items",
    moduleName: "Items",
    icon: FiBox,
    path: "/items",
    pageName: "items",
  },
  {
    title: "Purchase",
    moduleName: "Purchase",
    icon: FiShoppingCart,
    path: "/purchase",
    pageName: "purchase",
  },
  {
    title: "Suppliers",
    moduleName: "Suppliers",
    icon: FiUsers,
    path: "/suppliers",
    pageName: "suppliers",
  },
  {
    title: "Warehouse",
    moduleName: "Warehouse",
    icon: FiHome,
    path: "/warehouse",
    pageName: "warehouse",
  },
  {
    title: "Staff",
    moduleName: "Staff",
    icon: FiUsers,
    path: "/staff",
    pageName: "staff",
  },
  {
    title: "Dispatch",
    moduleName: "Dispatch",
    icon: FiTruck,
    path: "/dispatch",
    pageName: "dispatch",
  },
  {
    title: "Returns",
    moduleName: "Returns",
    icon: FiCornerUpLeft,
    path: "/returns",
    pageName: "returns",
  },
  {
    title: "Reports",
    moduleName: "Reports",
    icon: FiFileText,
    path: "/reports",
    pageName: "reports",
  },
  {
    title: "Settings",
    anyOfModules: [
      "Settings",
      "Users / Role",
    ],
    icon: FiSettings,
    path: "/settings",
    pageName: "settings",
  },
];

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
  } = useAuth();

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);

  const visibleMenuItems =
    menuItems.filter(
      (item) => {
        if (isAdmin) {
          return true;
        }

        if (
          item.anyOfModules
        ) {
          return hasAnyPermission(
            item.anyOfModules,
            "view"
          );
        }

        return hasPermission(
          item.moduleName,
          "view"
        );
      }
    );

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleNavigation = (
    path
  ) => {
    navigate(path);
    closeSidebar();
  };

  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        closeSidebar();
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

        <div className="dashboard-user">
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

            <small>
              {profile?.roles?.name ||
                "No Role"}
            </small>
          </div>

          <FiChevronDown className="user-arrow" />
        </div>
      </aside>
    </>
  );
}