import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "./main.jsx";

hydrateRoot(document.getElementById("root"), <StrictMode><App pathname={window.location.pathname} /></StrictMode>);
