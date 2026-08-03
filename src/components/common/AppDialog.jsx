import {
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import "../../styles/appDialog.css";

const dialogIcons = {
  info: <FiInfo />,
  success: <FiCheckCircle />,
  warning: <FiAlertTriangle />,
  danger: <FiAlertTriangle />,
  error: <FiXCircle />,
};

export default function AppDialog({
  open,
  mode = "alert",
  title = "Notice",
  message = "",
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) {
    return null;
  }

  const handleOverlayClick = () => {
    if (mode === "confirm") {
      onCancel?.();
    }
  };

  return (
    <div
      className="app-dialog-overlay"
      onMouseDown={handleOverlayClick}
    >
      <div
        className="app-dialog"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <button
          type="button"
          className="app-dialog-close"
          onClick={
            mode === "confirm"
              ? onCancel
              : onConfirm
          }
          aria-label="Close popup"
        >
          <FiX />
        </button>

        <div
          className={`app-dialog-icon ${type}`}
        >
          {dialogIcons[type] ||
            dialogIcons.info}
        </div>

        <h2>{title}</h2>

        <p>{message}</p>

        <div className="app-dialog-actions">
          {mode === "confirm" && (
            <button
              type="button"
              className="app-dialog-cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            className={`app-dialog-confirm ${type}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}