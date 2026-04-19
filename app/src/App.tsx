import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router";
import { AuthProvider } from "./contexts/auth_context";
import { Spinner } from "@/components/ui/spinner";
import { Suspense, lazy } from "react";
const Home = lazy(() => import("./pages/home/home"));
const Dashboard = lazy(() => import("./pages/dashboard/dashboard"));
const Login = lazy(() => import("./pages/login/login"));
const Register = lazy(() => import("./pages/register/register"));
const ResetPassword = lazy(
	() => import("./pages/reset_password/reset_password"),
);

const ForgotPassword = lazy(
	() => import("./pages/forgot_password/forgot_password"),
);
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
						<Route path="/reset-password" element={<ResetPassword />} />
						<Route path="/forgot-password" element={<ForgotPassword />} />
					</Routes>
				</Suspense>
			</BrowserRouter>
		</AuthProvider>
	);
}

export default App;
