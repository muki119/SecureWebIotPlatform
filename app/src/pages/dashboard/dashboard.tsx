import {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useNavigate } from "react-router";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";
import { API_ROUTES, SOCKET_EVENTS, SOCKET_URL } from "@/constants/api_routes";
import { AuthContext } from "@/contexts/auth_context";
import { AuthClientRequest } from "@/helpers/client_request";
import { decodeName } from "@/utilities/decode_name";
import { DashboardContext } from "../../contexts/dashboard_context";
import type {
	Domain,
	DomainDevices,
	Domains,
	ITransactionModel,
} from "../../types/models";
import DashboardSidebar from "./dashboard_sidebar";
import DeviceView from "./device_view";
import DomainView from "./domiain_view/domain_view";

export default function Dashboard() {
	const [domains, setDomains] = useState<Domains>({}); // going to do a key value where the key is the domain id and the value is the domain data
	const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
	const [domainDevices, setDomainDevices] = useState<DomainDevices>({});
	const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
	const [domainTransactions, setDomainTransactions] = useState<
		Record<string, ITransactionModel[]>
	>({});
	const navigate = useNavigate();
	const authContext = useContext(AuthContext);
	if (!authContext) throw new Error("AuthContext is not available");
	const { authState, dispatch, authClientRequest } = authContext;

	const logout = useCallback(async () => {
		await authClientRequest.current.logout(API_ROUTES.AUTH.LOGOUT.path);
		dispatch({ type: "LOGOUT" });
		navigate("/login");
	}, [authClientRequest, dispatch, navigate]);
	const socketRef = useRef<Socket | null>(null);
	const accessTokenRef = useRef(authState.accessToken);
	const domainsRef = useRef(domains);

	useEffect(() => {
		accessTokenRef.current = authState.accessToken;
	}, [authState.accessToken]);

	useEffect(() => {
		domainsRef.current = domains;
	}, [domains]);

	const isAdmin = useMemo(() => {
		if (!selectedDomain) return false;
		const domainInfo = domains[selectedDomain];
		if (!domainInfo) return false;
		return domainInfo?.role === "OWNER" || domainInfo?.role === "ADMIN";
	}, [domains, selectedDomain]);

	useEffect(() => {
		let cancelled = false;

		const socket = io(SOCKET_URL, {
			autoConnect: false,
			auth: (cb) => cb({ token: accessTokenRef.current }),
		});
		socketRef.current = socket;

		(async () => {
			if (accessTokenRef.current) {
				socket.connect();
				return;
			}
			const [token, err] = await authClientRequest.current.refresh();
			if (cancelled) return;
			if (err) {
				if (err === AuthClientRequest.ErrInvalidRefreshToken) {
					logout();
				}
				return;
			}
			accessTokenRef.current = token;
			socket.connect();
		})();

		socket.on("connect_error", (err) => {
			toast.error("Socket connection error", {
				description: err.message,
			});
		});

		socket.on("disconnect", async (reason) => {
			if (reason !== "io server disconnect") return;

			const MAX_ATTEMPTS = 5;
			const MAX_DELAY_MS = 3000;

			for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
				const delay = Math.min(250 * 2 ** attempt, MAX_DELAY_MS);
				await new Promise((resolve) => setTimeout(resolve, delay));
				if (cancelled) return;

				const [token, err] = await authClientRequest.current.refresh();
				if (cancelled) return;

				if (!err) {
					accessTokenRef.current = token;
					socket.connect();
					return;
				}

				if (err === AuthClientRequest.ErrInvalidRefreshToken) {
					logout();
					return;
				}
			}

			if (!cancelled) {
				toast.error("Lost connection to the server", {
					description: "Please refresh the page to reconnect.",
				});
			}
		});

		socket.on(
			SOCKET_EVENTS.SERVER_EMITTED.DEVICE.ADDED,
			({ domainId, device }) => {
				setDomainDevices((prev) => {
					if (!(domainId in prev)) return prev;
					return {
						...prev,
						[domainId]: {
							...prev[domainId],
							[device.id]: device,
						},
					};
				});
				toast.success(`Device ${device.name} added to domain `, {
					description:
						decodeName(domainsRef.current[domainId]?.name) ||
						domainId,
				});
			},
		);

		socket.on(
			SOCKET_EVENTS.SERVER_EMITTED.DEVICE.REMOVED,
			({ domainId, deviceId }) => {
				setDomainDevices((prev) => {
					if (!(domainId in prev)) return prev;
					const next = { ...prev[domainId] };
					delete next[deviceId];
					return { ...prev, [domainId]: next };
				});
			},
		);

		socket.on(
			SOCKET_EVENTS.SERVER_EMITTED.DEVICE.DEVICE_INFO_UPDATED,
			({ domainId, deviceId, changes }) => {
				setDomainDevices((prev) => {
					if (!(domainId in prev) || !(deviceId in prev[domainId]))
						return prev;
					return {
						...prev,
						[domainId]: {
							...prev[domainId],
							[deviceId]: {
								...prev[domainId][deviceId],
								...changes,
							},
						},
					};
				});
			},
		);

		socket.on(
			SOCKET_EVENTS.SERVER_EMITTED.DEVICE.UPDATED,
			({ domainId, deviceId, changes }) => {
				setDomainDevices((prev) => {
					if (!(domainId in prev) || !(deviceId in prev[domainId]))
						return prev;
					return {
						...prev,
						[domainId]: {
							...prev[domainId],
							[deviceId]: {
								...prev[domainId][deviceId],
								currentState: {
									...prev[domainId][deviceId].currentState,
									...changes,
								},
							},
						},
					};
				});
			},
		);

		socket.on(
			SOCKET_EVENTS.SERVER_EMITTED.DEVICE.TELEMETRY,
			({ domainId, deviceId, capability, value }) => {
				setDomainDevices((prev) => {
					if (!(domainId in prev) || !(deviceId in prev[domainId]))
						return prev;
					return {
						...prev,
						[domainId]: {
							...prev[domainId],
							[deviceId]: {
								...prev[domainId][deviceId],
								online: true,
								currentState: {
									...prev[domainId][deviceId].currentState,
									[capability]: {
										value,
										timestamp: Date.now(),
									},
								},
							},
						},
					};
				});
			},
		);

		socket.on(
			SOCKET_EVENTS.SERVER_EMITTED.DEVICE.STATUS,
			({ domainId, deviceId, online }) => {
				setDomainDevices((prev) => {
					if (!(domainId in prev) || !(deviceId in prev[domainId]))
						return prev;
					return {
						...prev,
						[domainId]: {
							...prev[domainId],
							[deviceId]: { ...prev[domainId][deviceId], online },
						},
					};
				});
			},
		);

		socket.on(
			SOCKET_EVENTS.SERVER_EMITTED.USER.JOINED_DOMAIN,
			async ({ domainId }) => {
				const [r, err] = await authClientRequest.current.get(
					API_ROUTES.DOMAIN.GET_USER_DOMAINS.path,
					{
						headers: {
							Authorization: AuthClientRequest.createAuthHeader(
								accessTokenRef.current,
							),
						},
					},
				);
				if (err === null && r?.status === 200) {
					const joined = r.data.find(
						(d: Domain) => d.id === domainId,
					);
					if (joined)
						setDomains((prev) => ({ ...prev, [domainId]: joined }));
				}
			},
		);

		socket.on(
			SOCKET_EVENTS.SERVER_EMITTED.USER.LEFT_DOMAIN,
			({ domainId }) => {
				// got removed :(
				toast("You have been removed from a domain", {
					description: ":(",
				});
				setDomains((prev) => {
					const next = { ...prev };
					delete next[domainId];
					return next;
				});
				setDomainDevices((prev) => {
					const next = { ...prev };
					delete next[domainId];
					return next;
				});
				setSelectedDomain((prev) => (prev === domainId ? null : prev));
			},
		);

		socket.on(
			SOCKET_EVENTS.SERVER_EMITTED.DOMAIN.DELETED,
			({ domainId }) => {
				toast("Domain has been deleted", {
					description:
						decodeName(domainsRef.current[domainId]?.name) ||
						domainId,
				});
				setDomains((prev) => {
					const next = { ...prev };
					delete next[domainId];
					return next;
				});
				setDomainDevices((prev) => {
					const next = { ...prev };
					delete next[domainId];
					return next;
				});
				setDomainTransactions((prev) => {
					const next = { ...prev };
					delete next[domainId];
					return next;
				});
				setSelectedDomain((prev) => (prev === domainId ? null : prev));
				setSelectedDevice(null);
			},
		);

		socket.on(
			SOCKET_EVENTS.SERVER_EMITTED.USER.ROLE_UPDATED,
			async ({ domainId, newRole }) => {
				setDomains((prev) => {
					if (!(domainId in prev)) return prev;
					return {
						...prev,
						[domainId]: { ...prev[domainId], role: newRole },
					};
				});
			},
		);

		return () => {
			cancelled = true;
			socket.removeAllListeners();
			socket.disconnect();
		};
	}, [authClientRequest, logout]);

	const fetchUser = useCallback(async () => {
		const [r, err] = await authClientRequest.current.get(
			API_ROUTES.PROFILE.GET_USER_PROFILE.path,
			{
				headers: {
					Authorization: AuthClientRequest.createAuthHeader(
						accessTokenRef.current,
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
	}, [authClientRequest, logout, authState.accessToken, dispatch]);

	const fetchDomains = useCallback(async () => {
		const [r, err] = await authClientRequest.current.get(
			API_ROUTES.DOMAIN.GET_USER_DOMAINS.path,
			{
				headers: {
					Authorization: AuthClientRequest.createAuthHeader(
						accessTokenRef.current,
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
			const domainsMap: Domains = {};
			domainsData.forEach((domain: Domain) => {
				domainsMap[domain.id] = domain;
			});
			setDomains(domainsMap);
		}
	}, [authClientRequest, logout]);

	useEffect(() => {
		(async () => {
			await fetchUser();
			await fetchDomains();
		})();
	}, [fetchUser, fetchDomains]);

	return (
		<DashboardContext.Provider
			value={{
				domains,
				setDomains,
				domainDevices,
				setDomainDevices,
				selectedDomain,
				setSelectedDomain,
				socketRef,
				logout,
				isAdmin,
				setSelectedDevice,
				selectedDevice,
				domainTransactions,
				setDomainTransactions,
			}}
		>
			<SidebarProvider>
				<DashboardSidebar />
				<SidebarInset>
					<header className="flex items-center gap-2 border-b p-4">
						<SidebarTrigger />
					</header>
					<main className="p-4">
						{selectedDevice ? (
							<DeviceView />
						) : selectedDomain ? (
							<DomainView />
						) : (
							<div className="text-center text-muted-foreground">
								Select a domain to view its devices
							</div>
						)}
					</main>
				</SidebarInset>
			</SidebarProvider>
		</DashboardContext.Provider>
	);
}
