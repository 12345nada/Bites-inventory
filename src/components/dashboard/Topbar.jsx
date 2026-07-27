import { useEffect, useRef, useState } from "react";

import {
  FiBell,
  FiSearch,
} from "react-icons/fi";

const notifications = [
  {
    id: 1,
    title: "New Event",
    message: "Family Event has been added.",
    time: "2 min ago",
  },
  {
    id: 2,
    title: "Dispatch Completed",
    message: "Event items were dispatched successfully.",
    time: "20 min ago",
  },
  {
    id: 3,
    title: "Low Stock",
    message: "Chair stock is running low.",
    time: "1 hour ago",
  },
];

export default function Topbar({
  searchValue,
  onSearchChange,
}) {
  const [showNotifications, setShowNotifications] =
    useState(false);

  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-search">
        <FiSearch />

        <input
          type="text"
          placeholder="search anything..."
          value={searchValue}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
        />
      </div>

      <div className="dashboard-topbar-actions">
        <div
          className="notification-wrapper"
          ref={notificationRef}
        >
          <button
            type="button"
            className="dashboard-notification-button"
            onClick={() =>
              setShowNotifications((current) => !current)
            }
            aria-label="Open notifications"
          >
            <FiBell />
            <span />
          </button>

          {showNotifications && (
            <div className="dashboard-notification-dropdown">
              <div className="dashboard-notification-header">
                <h4>Notifications</h4>
                <small>{notifications.length} new</small>
              </div>

              {notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className="dashboard-notification-item"
                >
                  <strong>{notification.title}</strong>

                  <p>{notification.message}</p>

                  <small>{notification.time}</small>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-profile" />
      </div>
    </header>
  );
}