"use client";

import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        // Default options
        duration: 4000,
        style: {
          background: "#fff",
          color: "#363636",
          borderRadius: "8px",
          padding: "16px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        },
        // Success toast
        success: {
          duration: 3000,
          iconTheme: {
            primary: "#2E6F40",
            secondary: "#fff",
          },
          style: {
            background: "#CFFFDC",
            color: "#2E6F40",
          },
        },
        // Error toast
        error: {
          duration: 4000,
          iconTheme: {
            primary: "#EF4444",
            secondary: "#fff",
          },
          style: {
            background: "#FEE2E2",
            color: "#991B1B",
          },
        },
        // Loading toast
        loading: {
          iconTheme: {
            primary: "#68BA7F",
            secondary: "#fff",
          },
        },
      }}
    />
  );
}
