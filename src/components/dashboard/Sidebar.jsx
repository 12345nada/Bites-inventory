import { useNavigate } from "react-router-dom";
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
} from "react-icons/fi";

const menuItems = [
  {
    title: "Dashboard",
    icon: <FiGrid />,
    path: "/",
    pageName: "dashboard",
  },
  {
    title: "Events",
    icon: <FiCalendar />,
    path: "/events",
    pageName: "events",
  },
  {
    title: "Items",
    icon: <FiBox />,
    path: "/items",
    pageName: "items",
  },
  {
    title: "Purchase",
    icon: <FiShoppingCart />,
    path: "/purchase",
    pageName: "purchase",
  },
  {
    title: "Suppliers",
    icon: <FiUsers />,
    path: "/suppliers",
    pageName: "suppliers",
  },
  {
    title: "Warehouse",
    icon: <FiHome />,
    path: "/warehouse",
    pageName: "warehouse",
  },

  {
  title: "Staff",
  icon: <FiUsers />,
  path: "/staff",
  pageName: "staff",
},
  {
    title: "Dispatch",
    icon: <FiTruck />,
    path: "/dispatch",
    pageName: "dispatch",
  },
  {
    title: "Returns",
    icon: <FiCornerUpLeft />,
    path: "/returns",
    pageName: "returns",
  },
  {
    title: "Reports",
    icon: <FiFileText />,
    path: "/reports",
    pageName: "reports",
  },
  {
    title: "Settings",
    icon: <FiSettings />,
    path: "/settings",
    pageName: "settings",
  },
];

export default function Sidebar({
  activePage = "dashboard",
}) {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleKeyboardNavigation = (
    event,
    path
  ) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      navigate(path);
    }
  };

  return (
    <aside className="dashboard-sidebar">
      <div className="sidebar-top">
        <div
          className="dashboard-logo"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) =>
            handleKeyboardNavigation(
              event,
              "/"
            )
          }
        >
          bites
        </div>

        <nav
          className="sidebar-nav"
          aria-label="Dashboard navigation"
        >
          <ul className="dashboard-menu">
            {menuItems.map((item) => {
              const isActive =
                activePage ===
                item.pageName;

              return (
                <li
                  key={item.title}
                  className={
                    isActive
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    handleNavigation(
                      item.path
                    )
                  }
                  onKeyDown={(event) =>
                    handleKeyboardNavigation(
                      event,
                      item.path
                    )
                  }
                  role="button"
                  tabIndex={0}
                  aria-current={
                    isActive
                      ? "page"
                      : undefined
                  }
                >
                  <span className="dashboard-menu-icon">
                    {item.icon}
                  </span>

                  <span className="dashboard-menu-text">
                    {item.title}
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <div className="dashboard-user">
        <div className="dashboard-avatar" />
        <div className="dashboard-user-info">
          <strong>
            Admin User
          </strong>
          <small>
            Administrator
          </small>
        </div>
        <FiChevronDown className="user-arrow" />
      </div>
    </aside>
  );
}