import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  FiBell,
  FiCamera,
  FiCheck,
  FiSearch,
} from "react-icons/fi";

import {
  useNavigate,
} from "react-router-dom";

import {
  supabase,
} from "../../lib/supabase";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  getCurrentUserId,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotifications,
  unsubscribeFromNotifications,
} from "../../services/notificationService";

const MAX_AVATAR_SIZE =
  5 * 1024 * 1024;

const allowedAvatarTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const formatNotificationTime = (
  createdAt
) => {
  if (!createdAt) {
    return "";
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (
        Date.now() -
        new Date(
          createdAt
        ).getTime()
      ) / 1000
    )
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} ${
      hours === 1
        ? "hour"
        : "hours"
    } ago`;
  }

  const days =
    Math.floor(hours / 24);

  if (days < 7) {
    return `${days} ${
      days === 1
        ? "day"
        : "days"
    } ago`;
  }

  return new Date(
    createdAt
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

const getAvatarExtension = (
  file
) => {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase();

  if (
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "png" ||
    extension === "webp"
  ) {
    return extension === "jpeg"
      ? "jpg"
      : extension;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
};

export default function Topbar({
  searchValue = "",
  onSearchChange,
}) {
  const navigate =
    useNavigate();

  const {
    user,
    profile,
    updateProfileAvatar,
  } = useAuth();

  const notificationRef =
    useRef(null);

  const avatarInputRef =
    useRef(null);

  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    markingAll,
    setMarkingAll,
  ] = useState(false);

  const [
    uploadingAvatar,
    setUploadingAvatar,
  ] = useState(false);

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.isRead
    ).length;

  useEffect(() => {
    let channel = null;
    let isCancelled = false;

    const startNotifications =
      async () => {
        try {
          setLoading(true);

          const loadedNotifications =
            await getNotifications();

          if (isCancelled) {
            return;
          }

          setNotifications(
            loadedNotifications
          );

          const userId =
            await getCurrentUserId();

          if (
            isCancelled ||
            !userId
          ) {
            return;
          }

          channel =
            subscribeToNotifications(
              userId,
              (
                newNotification
              ) => {
                if (isCancelled) {
                  return;
                }

                setNotifications(
                  (
                    currentNotifications
                  ) => {
                    const alreadyExists =
                      currentNotifications.some(
                        (
                          notification
                        ) =>
                          notification.id ===
                          newNotification.id
                      );

                    if (alreadyExists) {
                      return currentNotifications;
                    }

                    return [
                      newNotification,
                      ...currentNotifications,
                    ];
                  }
                );
              }
            );
        } catch (error) {
          if (!isCancelled) {
            console.error(
              "Notification error:",
              error
            );
          }
        } finally {
          if (!isCancelled) {
            setLoading(false);
          }
        }
      };

    startNotifications();

    return () => {
      isCancelled = true;

      if (channel) {
        unsubscribeFromNotifications(
          channel
        ).catch((error) => {
          console.error(
            "Notification cleanup error:",
            error
          );
        });
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (
      event
    ) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target
        )
      ) {
        setShowNotifications(
          false
        );
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

  const handleAvatarButtonClick =
    () => {
      if (uploadingAvatar) {
        return;
      }

      avatarInputRef.current?.click();
    };

  const handleAvatarChange =
    async (event) => {
      const file =
        event.target.files?.[0];

      event.target.value = "";

      if (!file || !user?.id) {
        return;
      }

      if (
        !allowedAvatarTypes.includes(
          file.type
        )
      ) {
        alert(
          "Please choose a JPG, PNG or WEBP image."
        );
        return;
      }

      if (
        file.size >
        MAX_AVATAR_SIZE
      ) {
        alert(
          "The profile image must be 5 MB or smaller."
        );
        return;
      }

      const extension =
        getAvatarExtension(file);

      const filePath =
        `${user.id}/avatar-${Date.now()}.${extension}`;

      try {
        setUploadingAvatar(true);

        const {
          error: uploadError,
        } = await supabase.storage
          .from("avatars")
          .upload(
            filePath,
            file,
            {
              cacheControl: "3600",
              upsert: true,
              contentType:
                file.type,
            }
          );

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: publicUrlData,
        } = supabase.storage
          .from("avatars")
          .getPublicUrl(
            filePath
          );

        const avatarUrl =
          `${publicUrlData.publicUrl}?v=${Date.now()}`;

        const result =
          await updateProfileAvatar(
            avatarUrl
          );

        if (!result.success) {
          await supabase.storage
            .from("avatars")
            .remove([filePath]);

          throw result.error;
        }
      } catch (error) {
        console.error(
          "Avatar upload error:",
          error
        );

        alert(
          error.message ||
            "Could not upload the profile image."
        );
      } finally {
        setUploadingAvatar(false);
      }
    };

  const handleNotificationClick =
    async (
      notification
    ) => {
      try {
        let updatedNotification =
          notification;

        if (!notification.isRead) {
          updatedNotification =
            await markNotificationAsRead(
              notification.id
            );

          setNotifications(
            (
              currentNotifications
            ) =>
              currentNotifications.map(
                (item) =>
                  item.id ===
                  notification.id
                    ? updatedNotification
                    : item
              )
          );
        }

        setShowNotifications(
          false
        );

        if (
          updatedNotification.link
        ) {
          navigate(
            updatedNotification.link
          );
        }
      } catch (error) {
        console.error(
          "Could not read notification:",
          error
        );
      }
    };

  const handleMarkAllAsRead =
    async () => {
      if (
        unreadCount === 0 ||
        markingAll
      ) {
        return;
      }

      try {
        setMarkingAll(true);

        await markAllNotificationsAsRead();

        setNotifications(
          (
            currentNotifications
          ) =>
            currentNotifications.map(
              (notification) => ({
                ...notification,
                isRead: true,
              })
            )
        );
      } catch (error) {
        console.error(
          "Could not mark notifications:",
          error
        );
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
          onChange={(event) =>
            onSearchChange?.(
              event.target.value
            )
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
              setShowNotifications(
                (current) =>
                  !current
              )
            }
            aria-label="Open notifications"
            aria-expanded={
              showNotifications
            }
          >
            <FiBell />

            {unreadCount > 0 && (
              <span className="notification-dot" />
            )}
          </button>

          {showNotifications && (
            <div className="dashboard-notification-dropdown">
              <div className="dashboard-notification-header">
                <div>
                  <h4>
                    Notifications
                  </h4>

                  <small>
                    {unreadCount} new
                  </small>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="mark-all-read-button"
                    onClick={
                      handleMarkAllAsRead
                    }
                    disabled={
                      markingAll
                    }
                  >
                    <FiCheck />

                    {markingAll
                      ? "Saving..."
                      : "Mark all read"}
                  </button>
                )}
              </div>

              <div className="dashboard-notification-list">
                {loading ? (
                  <div className="notification-empty-state">
                    Loading notifications...
                  </div>
                ) : notifications.length >
                  0 ? (
                  notifications.map(
                    (
                      notification
                    ) => (
                      <button
                        type="button"
                        key={
                          notification.id
                        }
                        className={`dashboard-notification-item ${
                          notification.isRead
                            ? "read"
                            : "unread"
                        }`}
                        onClick={() =>
                          handleNotificationClick(
                            notification
                          )
                        }
                      >
                        <div className="notification-item-content">
                          <strong>
                            {
                              notification.title
                            }
                          </strong>

                          <p>
                            {
                              notification.message
                            }
                          </p>

                          <small>
                            {formatNotificationTime(
                              notification.createdAt
                            )}
                          </small>
                        </div>

                        {!notification.isRead && (
                          <span className="notification-unread-indicator" />
                        )}
                      </button>
                    )
                  )
                ) : (
                  <div className="notification-empty-state">
                    No notifications yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <input
          ref={avatarInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="dashboard-avatar-input"
          onChange={
            handleAvatarChange
          }
        />

        <button
          type="button"
          className={`dashboard-profile-button ${
            uploadingAvatar
              ? "uploading"
              : ""
          }`}
          onClick={
            handleAvatarButtonClick
          }
          disabled={
            uploadingAvatar
          }
          aria-label="Change profile image"
          title="Change profile image"
        >
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
            <span className="dashboard-profile-fallback">
              {profile?.full_name
                ?.trim()
                ?.charAt(0)
                ?.toUpperCase() ||
                "A"}
            </span>
          )}

          <span className="dashboard-profile-camera">
            <FiCamera />
          </span>

          {uploadingAvatar && (
            <span className="dashboard-profile-loading" />
          )}
        </button>
      </div>
    </header>
  );
}