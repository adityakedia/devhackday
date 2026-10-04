import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import JourneyApp from "./JourneyApp";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {window.location.pathname === "/souvenirs" ? <App /> : <JourneyApp />}
  </StrictMode>,
);
