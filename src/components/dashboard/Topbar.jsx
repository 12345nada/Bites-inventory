import { useEffect, useRef, useState } from "react";
import { FiBell, FiCheck, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

import {
  getCurrentUserId,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications,
} from "../../services/notificationService";

const formatNotificationTime = (createdAt) => {
  if (!createdAt) return "";

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? "day" : "days"} ago`;

  return new Date(createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Topbar({
  searchValue = "",
  onSearchChange,
}) {
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  useEffect(() => {
    let channel;

    const start = async () => {
      try {
        setLoading(true);
        setNotifications(await getNotifications());

        const userId = await getCurrentUserId();
        channel = subscribeToNotifications(userId, (newNotification) => {
          setNotifications((current) => [newNotification, ...current]);
        });
      } catch (error) {
        console.error("Notification error:", error);
      } finally {
        setLoading(false);
      }
    };

    start();

    return () => {
      channel?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        const updated = await markNotificationAsRead(notification.id);

        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? updated : item))
        );
      }

      setShowNotifications(false);
      if (notification.link) navigate(notification.link);
    } catch (error) {
      console.error("Could not read notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    try {
      setMarkingAll(true);
      await markAllNotificationsAsRead();
      setNotifications((current) =>
        current.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      console.error("Could not mark notifications:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-search">
        <FiSearch />
        <input
          type="text"
          placeholder="search anything..."
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
        />
      </div>

      <div className="dashboard-topbar-actions">
        <div className="notification-wrapper" ref={notificationRef}>
          <button
            type="button"
            className="dashboard-notification-button"
            onClick={() => setShowNotifications((current) => !current)}
            aria-label="Open notifications"
            aria-expanded={showNotifications}
          >
            <FiBell />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>

          {showNotifications && (
            <div className="dashboard-notification-dropdown">
              <div className="dashboard-notification-header">
                <div>
                  <h4>Notifications</h4>
                  <small>{unreadCount} new</small>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="mark-all-read-button"
                    onClick={handleMarkAllAsRead}
                    disabled={markingAll}
                  >
                    <FiCheck />
                    {markingAll ? "Saving..." : "Mark all read"}
                  </button>
                )}
              </div>

              <div className="dashboard-notification-list">
                {loading ? (
                  <div className="notification-empty-state">
                    Loading notifications...
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      className={`dashboard-notification-item ${
                        notification.isRead ? "read" : "unread"
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="notification-item-content">
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                        <small>
                          {formatNotificationTime(notification.createdAt)}
                        </small>
                      </div>

                      {!notification.isRead && (
                        <span className="notification-unread-indicator" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="notification-empty-state">
                    No notifications yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-profile" />
      </div>
    </header>
  );
}
