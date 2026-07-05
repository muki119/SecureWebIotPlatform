import {
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
	useMemo,
} from "react";
import { useNavigate } from "react-router";
import DashboardSidebar from "./dashboard_sidebar";
import { API_ROUTES, SOCKET_EVENTS, SOCKET_URL } from "@/constants/api_routes";
import DomainView from "./domiain_view/domain_view";
import { AuthClientRequest } from "@/helpers/client_request";
import { toast } from "sonner";
import { io, type Socket } from "socket.io-client";
import type {
	ITransactionModel,
	Domain,
	DomainDevices,
	Domains,
} from "../../types/models";
import DeviceView from "./device_view";
import {
	SidebarProvider,
	SidebarTrigger,
	SidebarInset,
} from "@/components/ui/sidebar";
import { AuthContext } from "@/contexts/auth_context";
import { DashboardContext } from "../../contexts/dashboard_context";
import { decodeName } from "@/utilities/decode_name";

export default function Dashboard() {
	const [domains, setDomains] = useState<Domains>({}); // going to do a key value where the key is the domain id and the value is the domain data
	const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
	const [domainDevices, setDomainDevices] = useState<DomainDevices>({});
	const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
	const [domainTransactions, setDomainTransactions] = useState<
		Record<string, ITransactionModel[]>
	>({});
	const navigate = useNavigate();
	const { authState, dispatch, authClientRequest } = useContext(AuthContext)!;
	const logout = async () => {
		dispatch({ type: "LOGOUT" });
		navigate("/login");
	};
	const socketRef = useRef<Socket | null>(null);
	const accessTokenRef = useRef(authState.accessToken);

	useEffect(() => {
		accessTokenRef.current = authState.accessToken;
	}, [authState.accessToken]);

	const isAdmin = useMemo(() => {
		if (!selectedDomain) return false;
		const domainInfo = domains[selectedDomain];
		if (!domainInfo) return false;
		return domainInfo?.role === "OWNER" || domainInfo?.role === "ADMIN";
	}, [domains, selectedDomain]);

	const initSocket = useCallback(() => {
		if (socketRef.current) {
			socketRef.current.removeAllListeners();
			socketRef.current.disconnect();
		}
		const newSocket = io(SOCKET_URL, {
			auth: { token: authState.accessToken },
		});
		socketRef.current = newSocket;
		return newSocket;
	}, [authState.accessToken]);

	const setupSocketListeners = useCallback(() => {
		const socket = socketRef.current;
		if (!socket) return;

		socket.on("connect", () => {});

		socket.on("connect_error", (err) => {
			if (err.message === "Authentication error: No token provided") {
				return; // just ignore since this is just the initial connection attempt before the token is set
			}
			toast.error("Socket connection error", { description: err.message });
		});

		socket.on("disconnect", async (reason) => {
			if (reason === "io server disconnect") {
				const [, err] = await authClientRequest.current.refresh();
				if (err) {
					logout();
					return;
				}
				initSocket();
				setupSocketListeners();
			} else {
				toast.error("Socket disconnected");
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
					description: decodeName(domains[domainId]?.name) || domainId,
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
					if (!(domainId in prev) || !(deviceId in prev[domainId])) return prev;
					return {
						...prev,
						[domainId]: {
							...prev[domainId],
							[deviceId]: { ...prev[domainId][deviceId], ...changes },
						},
					};
				});
			},
		);

		socket.on(
			SOCKET_EVENTS.SERVER_EMITTED.DEVICE.UPDATED,
			({ domainId, deviceId, changes }) => {
				setDomainDevices((prev) => {
					if (!(domainId in prev) || !(deviceId in prev[domainId])) return prev;
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
					if (!(domainId in prev) || !(deviceId in prev[domainId])) return prev;
					return {
						...prev,
						[domainId]: {
							...prev[domainId],
							[deviceId]: {
								...prev[domainId][deviceId],
								online: true,
								currentState: {
									...prev[domainId][deviceId].currentState,
									[capability]: { value, timestamp: Date.now() },
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
					if (!(domainId in prev) || !(deviceId in prev[domainId])) return prev;
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
								accessTokenRef.current!,
							),
						},
					},
				);
				if (err === null && r?.status === 200) {
					const joined = r.data.find((d: Domain) => d.id === domainId);
					if (joined) setDomains((prev) => ({ ...prev, [domainId]: joined }));
				}
			},
		);

		socket.on(SOCKET_EVENTS.SERVER_EMITTED.USER.LEFT_DOMAIN, ({ domainId }) => {
			// got removed :(
			toast("You have been removed from a domain", { description: ":(" });
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
		});

		socket.on(SOCKET_EVENTS.SERVER_EMITTED.DOMAIN.DELETED, ({ domainId }) => {
			toast("Domain has been deleted", {
				description: decodeName(domains[domainId]?.name) || domainId,
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
		});

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
	}, [socketRef, initSocket, authClientRequest, domains]);

	useEffect(() => {
		// this effect initializes the socket connection on mount and cleans up on unmount
		const newSocket = initSocket();
		setupSocketListeners();
		return () => {
			newSocket.removeAllListeners();
			newSocket.disconnect();
		};
	}, [authState.accessToken, initSocket, setupSocketListeners]);

	const fetchUser = async () => {
		const [r, err] = await authClientRequest.current.get(
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
		const [r, err] = await authClientRequest.current.get(
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
			const domainsMap: Domains = {};
			domainsData.forEach((domain: Domain) => {
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
