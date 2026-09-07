import { renderToString } from "react-dom/server";
import { App } from "./main.jsx";
export { guides } from "./guides.js";
export function render(pathname) {
  return renderToString(<App pathname={pathname} />);
}
