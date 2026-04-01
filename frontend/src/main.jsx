import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import GlobalAlertProvider from "./context/GlobalAlertProvider";
import { ToastProvider } from "./context/ToastContext";
import { SettingsProvider } from "./context/SettingsContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <SettingsProvider>
      <AuthProvider>
        <ToastProvider>
          <GlobalAlertProvider>
            <App />
          </GlobalAlertProvider>
        </ToastProvider>
      </AuthProvider>
    </SettingsProvider>
  </BrowserRouter>
);
