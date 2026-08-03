import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import AppDialog from "../components/common/AppDialog";

const DialogContext = createContext(null);

export function DialogProvider({
  children,
}) {
  const [dialog, setDialog] =
    useState(null);

  const resolverRef = useRef(null);

  const closeDialog = useCallback(
    (result) => {
      resolverRef.current?.(result);
      resolverRef.current = null;
      setDialog(null);
    },
    []
  );

  const showAlert = useCallback(
    ({
      title = "Notice",
      message = "",
      type = "info",
      confirmText = "OK",
    }) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;

        setDialog({
          mode: "alert",
          title,
          message,
          type,
          confirmText,
        });
      }),
    []
  );

  const showConfirm = useCallback(
    ({
      title = "Confirm Action",
      message = "",
      type = "warning",
      confirmText = "Confirm",
      cancelText = "Cancel",
    }) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;

        setDialog({
          mode: "confirm",
          title,
          message,
          type,
          confirmText,
          cancelText,
        });
      }),
    []
  );

  return (
    <DialogContext.Provider
      value={{
        showAlert,
        showConfirm,
      }}
    >
      {children}

      <AppDialog
        open={Boolean(dialog)}
        {...dialog}
        onConfirm={() =>
          closeDialog(true)
        }
        onCancel={() =>
          closeDialog(false)
        }
      />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context =
    useContext(DialogContext);

  if (!context) {
    throw new Error(
      "useDialog must be used inside DialogProvider."
    );
  }

  return context;
}