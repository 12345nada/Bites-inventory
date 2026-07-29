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

const menuItems = [
  {
    title: "Dashboard",
    icon: FiGrid,
    path: "/",
    pageName: "dashboard",
  },
  {
    title: "Events",
    icon: FiCalendar,
    path: "/events",
    pageName: "events",
  },
  {
    title: "Items",
    icon: FiBox,
    path: "/items",
    pageName: "items",
  },
  {
    title: "Purchase",
    icon: FiShoppingCart,
    path: "/purchase",
    pageName: "purchase",
  },
  {
    title: "Suppliers",
    icon: FiUsers,
    path: "/suppliers",
    pageName: "suppliers",
  },
  {
    title: "Warehouse",
    icon: FiHome,
    path: "/warehouse",
    pageName: "warehouse",
  },
  {
    title: "Staff",
    icon: FiUsers,
    path: "/staff",
    pageName: "staff",
  },
  {
    title: "Dispatch",
    icon: FiTruck,
    path: "/dispatch",
    pageName: "dispatch",
  },
  {
    title: "Returns",
    icon: FiCornerUpLeft,
    path: "/returns",
    pageName: "returns",
  },
  {
    title: "Reports",
    icon: FiFileText,
    path: "/reports",
    pageName: "reports",
  },
  {
    title: "Settings",
    icon: FiSettings,
    path: "/settings",
    pageName: "settings",
  },
];

export default function Sidebar({
  activePage = "dashboard",
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    closeSidebar();
  };

  useEffect(() => {
    closeSidebar();
  }, [location.pathname]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
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
          setIsSidebarOpen((current) => !current)
        }
        aria-label={
          isSidebarOpen
            ? "Close sidebar"
            : "Open sidebar"
        }
        aria-expanded={isSidebarOpen}
      >
        {isSidebarOpen ? <FiX /> : <FiMenu />}
      </button>

      <button
        type="button"
        className={`dashboard-sidebar-overlay ${
          isSidebarOpen ? "show" : ""
        }`}
        onClick={closeSidebar}
        aria-label="Close sidebar"
      />

      <aside
        className={`dashboard-sidebar ${
          isSidebarOpen ? "mobile-open" : ""
        }`}
      >
        <div className="sidebar-top">
          <button
            type="button"
            className="dashboard-logo"
            onClick={() =>
              handleNavigation("/")
            }
          >
            bites
          </button>

          <nav
            className="sidebar-nav"
            aria-label="Dashboard navigation"
          >
            <ul className="dashboard-menu">
              {menuItems.map((item) => {
                const Icon = item.icon;

                const isActive =
                  activePage === item.pageName;

                return (
                  <li
                    key={item.pageName}
                    className={
                      isActive ? "active" : ""
                    }
                  >
                    <button
                      type="button"
                      className="dashboard-menu-button"
                      onClick={() =>
                        handleNavigation(item.path)
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
                        {item.title}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="dashboard-user">
          <div className="dashboard-avatar" />

          <div className="dashboard-user-info">
            <strong>Admin User</strong>
            <small>Administrator</small>
          </div>

          <FiChevronDown className="user-arrow" />
        </div>
      </aside>
    </>
  );
}