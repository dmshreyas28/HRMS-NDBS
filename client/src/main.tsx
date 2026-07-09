import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";
import App from "./App.tsx";
import { useToastStore } from "./store/toastStore";

window.alert = (message: any) => {
  const msgStr = String(message);
  let type: 'success' | 'error' | 'info' = 'info';
  const lower = msgStr.toLowerCase();
  if (lower.includes('success') || lower.includes('ok') || lower.includes('uploaded') || lower.includes('saved') || lower.includes('sent')) {
    type = 'success';
  } else if (lower.includes('failed') || lower.includes('error') || lower.includes('invalid') || lower.includes('required') || lower.includes('please')) {
    type = 'error';
  }
  useToastStore.getState().addToast(msgStr, type);
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0Provider
        domain={import.meta.env.VITE_AUTH0_DOMAIN}
        clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
        cacheLocation="localstorage"
        useRefreshTokens={true}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        }}
      >
        <App />
      </Auth0Provider>
    </BrowserRouter>
  </StrictMode>
);
