import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Setting dir="rtl" for RTL (Arabic) language support
document.documentElement.dir = "rtl";

createRoot(document.getElementById("root")!).render(<App />);
