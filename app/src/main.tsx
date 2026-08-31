import { createRoot } from "react-dom/client";
import "./index.css";
import axios from "axios";
import App from "./App.tsx";

axios.defaults.withCredentials = true;

const root = document.getElementById("root");
if (!root) {
	throw new Error("Root element not found");
}
createRoot(root).render(<App />);
