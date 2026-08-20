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
  useTranslation,
} from "react-i18next";

import {
  supabase,
} from "../../lib/supabase";

import {
  compressImage,
} from "../../utils/imageCompression";

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
  createdAt,
  t,
  language
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
    return t("topbar.justNow");
  }

  const minutes =
    Math.floor(seconds / 60);

  if (minutes < 60) {
    return t(
      "topbar.minutesAgo",
      { count: minutes }
    );
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return t(
      "topbar.hoursAgo",
      { count: hours }
    );
  }

  const days =
    Math.floor(hours / 24);

  if (days < 7) {
    return t(
      "topbar.daysAgo",
      { count: days }
    );
  }

  return new Date(
    createdAt
  ).toLocaleDateString(
    language === "ar"
      ? "ar-EG"
      : "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};


const translateNotificationContent = (
  notification,
  t,
  language
) => {
  const title =
    notification?.title || "";
  const message =
    notification?.message || "";

  if (language !== "ar") {
    return { title, message };
  }

  const translatedTitle =
    title === "Upcoming Event"
      ? t("topbar.notificationContent.upcomingEvent")
      : title === "Low Stock Alert"
        ? t("topbar.notificationContent.lowStockAlert")
        : title;

  const lowStockMatch = message.match(
    /^(.+?) is low in (.+?)\. Available:\s*([\d.]+),\s*Minimum:\s*([\d.]+)\.?$/
  );

  if (lowStockMatch) {
    return {
      title: translatedTitle,
      message: t(
        "topbar.notificationContent.lowStockMessage",
        {
          item: lowStockMatch[1],
          warehouse:
            lowStockMatch[2] === "Alex Warehouse"
              ? t("warehouses.alex_warehouse")
              : lowStockMatch[2] === "Cairo Warehouse"
                ? t("warehouses.cairo_warehouse")
                : lowStockMatch[2],
          available: lowStockMatch[3],
          minimum: lowStockMatch[4],
        }
      ),
    };
  }

  const upcomingEventMatch =
    message.match(
      /^(.+?) is departing at (.+?) to (.+?)\.?$/
    );

  if (upcomingEventMatch) {
    return {
      title: translatedTitle,
      message: t(
        "topbar.notificationContent.upcomingEventMessage",
        {
          event: upcomingEventMatch[1],
          time: upcomingEventMatch[2],
          destination:
            upcomingEventMatch[3],
        }
      ),
    };
  }

  return {
    title: translatedTitle,
    message,
  };
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
    t,
    i18n,
  } = useTranslation();

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
          t("topbar.chooseValidImage")
        );
        return;
      }

      if (
        file.size >
        MAX_AVATAR_SIZE
      ) {
        alert(
          t("topbar.imageTooLarge")
        );
        return;
      }

      try {
        setUploadingAvatar(true);

        const compressedFile =
          await compressImage(file, {
            maxWidth: 1000,
            maxHeight: 1000,
            quality: 0.8,
          });

        const extension =
          getAvatarExtension(
            compressedFile
          );

        const filePath =
          `${user.id}/avatar-${Date.now()}.${extension}`;

        const {
          error: uploadError,
        } = await supabase.storage
          .from("avatars")
          .upload(
            filePath,
            compressedFile,
            {
              cacheControl: "3600",
              upsert: true,
              contentType:
                compressedFile.type,
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
            t("topbar.couldNotUploadImage")
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
          placeholder={t("topbar.searchAnything")}
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
            aria-label={t("topbar.openNotifications")}
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
                    {t("topbar.notifications")}
                  </h4>

                  <small>
                    {t(
                      "topbar.newNotifications",
                      { count: unreadCount }
                    )}
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
                      ? t("topbar.saving")
                      : t("topbar.markAllRead")}
                  </button>
                )}
              </div>

              <div className="dashboard-notification-list">
                {loading ? (
                  <div className="notification-empty-state">
                    {t("topbar.loadingNotifications")}
                  </div>
                ) : notifications.length >
                  0 ? (
                  notifications.map(
                    (
                      notification
                    ) => {
                      const translatedNotification =
                        translateNotificationContent(
                          notification,
                          t,
                          i18n.language
                        );

                      return (
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
                              translatedNotification.title
                            }
                          </strong>

                          <p>
                            {
                              translatedNotification.message
                            }
                          </p>

                          <small>
                            {formatNotificationTime(
                              notification.createdAt,
                              t,
                              i18n.language
                            )}
                          </small>
                        </div>

                        {!notification.isRead && (
                          <span className="notification-unread-indicator" />
                        )}
                      </button>
                      );
                    }
                  )
                ) : (
                  <div className="notification-empty-state">
                    {t("topbar.noNotifications")}
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
          aria-label={t("topbar.changeProfileImage")}
          title={t("topbar.changeProfileImage")}
        >
          {profile?.avatar_url ? (
            <img
              src={
                profile.avatar_url
              }
              alt={
                profile.full_name ||
                t("topbar.profile")
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