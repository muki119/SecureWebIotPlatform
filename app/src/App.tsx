import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "./pages/home/home";
import Dashboard from "./pages/dashboard/dashboard";
import Login from "./pages/login/login";
import Register from "./pages/register/register";
import { AuthProvider } from "./contexts/auth_context";
import { Spinner } from "@/components/ui/spinner";
import { Suspense } from "react";
function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Suspense fallback={<Spinner />}>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/login" element={<Login />} />
						<Route path="/register" element={<Register />} />
					</Routes>
				</Suspense>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
