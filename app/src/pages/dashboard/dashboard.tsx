import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import DashboardSidebar from "./dashboard_sidebar";
import { API_ROUTES } from "@/constants/api_routes";
import DomainView from "./domiain_view/domain_view";
import { AuthClientRequest } from "@/helpers/client_request";
import { toast } from "sonner";
import DeviceView from "./device_view";
import {
	SidebarProvider,
	SidebarTrigger,
	SidebarInset,
} from "@/components/ui/sidebar";
import { AuthContext } from "@/contexts/auth_context";

export default function Dashboard() {
	const [domains, setDomains] = useState({}); // going to do a key value where the key is the domain id and the value is the domain data
	const [selectedDomain, setSelectedDomain] = useState(null);
	const [domainDevices, setDomainDevices] = useState({});
	const navigate = useNavigate();
	const { authState, dispatch, authClientRequest } = useContext(AuthContext)!;
	const logout = async () => {
		dispatch({ type: "LOGOUT" });
		navigate("/login");
	};

	const fetchUser = async () => {
		const [r, err] = await authClientRequest.get(
			API_ROUTES.PROFILE.GET_USER_PROFILE.path,
			{
				headers: {
					Authorization: AuthClientRequest.createAuthHeader(
						authState.accessToken!,
					),
				},
			},
		);
		if (err !== null) {
			if (
				err === AuthClientRequest.ErrUnauthorized ||
				err === AuthClientRequest.ErrInvalidRefreshToken
			) {
				logout();
				return;
			}
			if (err === AuthClientRequest.ErrServerError) {
				toast.error("Server error while fetching user information", {
					description: "Please try again later",
				});
			}
		}
		if (r?.status === 200) {
			const userData = r.data;
			dispatch({
				type: "SET_USER",
				payload: { accessToken: authState.accessToken, user: userData },
			});
		}
	};
	const fetchDomains = async () => {
		const [r, err] = await authClientRequest.get(
			API_ROUTES.DOMAIN.GET_USER_DOMAINS.path,
			{
				headers: {
					Authorization: AuthClientRequest.createAuthHeader(
						authState.accessToken!,
					),
				},
			},
		);
		if (err !== null) {
			if (
				err === AuthClientRequest.ErrUnauthorized ||
				err === AuthClientRequest.ErrInvalidRefreshToken
			) {
				logout();
				return;
			}
			if (err === AuthClientRequest.ErrServerError) {
				toast.error("Server error while fetching domains", {
					description: "Please try again later",
				});
			}
		}

		if (r?.status === 200) {
			const domainsData = r.data;
			const domainsMap = {};
			domainsData.forEach((domain) => {
				domainsMap[domain.id] = domain;
			});
			setDomains(domainsMap);
		}
	};

	useEffect(() => {
		fetchDomains();
		fetchUser();
	}, []);

	return (
		<>
			<SidebarProvider>
				<DashboardSidebar
					domains={domains}
					selectedDomain={selectedDomain}
					setSelectedDomain={setSelectedDomain}
					logout={logout}
					setDomains={setDomains}
				/>
				<SidebarInset>
					<header className="flex items-center gap-2 border-b p-4">
						<SidebarTrigger />
					</header>
					<main className="p-4">
						<DomainView
							current={selectedDomain}
							domains={domains}
							domainDevices={domainDevices}
							setDomainDevices={setDomainDevices}
						/>
					</main>
				</SidebarInset>
			</SidebarProvider>
		</>
	);
}
