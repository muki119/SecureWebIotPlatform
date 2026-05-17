import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { EllipsisVerticalIcon, WifiIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { AuthContext } from "@/contexts/auth_context";
import {
	Suspense,
	useCallback,
	useContext,
	useEffect,
	useState,
	useRef,
	use,
} from "react";
import { API_ROUTES } from "@/constants/api_routes";
import { AuthClientRequest } from "@/helpers/client_request";
import DomainMenuBar from "./domain_menubar";
import { toast } from "sonner";
import { DashboardContext } from "../../../contexts/dashboard_context";
import AddDeviceDialog from "./add_device_dialog";
import AddUserDialog from "./add_user_dialog";
import EditDeviceDialog from "./edit_device_dialog";
import DeleteDeviceDialog from "./delete_device_dialog";
import ViewDeviceInfoDialog from "./view_device_info_dialog";

export default function DomainView() {
	const { authState, authClientRequest } = useContext(AuthContext)!;
	const {
		selectedDomain: current,
		domainDevices,
		setDomainDevices,
		logout,
		isAdmin,
		setSelectedDevice,
	} = useContext(DashboardContext)!;

	const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
	const [isAddDeviceDialogOpen, setIsAddDeviceDialogOpen] = useState(false);
	const [editingDevice, setEditingDevice] = useState(null);
	const [deletingDevice, setDeletingDevice] = useState(null);
	const [viewingDevice, setViewingDevice] = useState(null);

	useEffect(() => {
		const fetchDomainDevices = async () => {
			if (!current) return;
			if (current in domainDevices) return; // if theres already device data for the current domain then dont fetch again
			const [r, err] = await authClientRequest.get(
				API_ROUTES.DEVICE.GET_DOMAIN_DEVICES(current).path,
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
				const devicesData = r.data;
				const devicesMap = {};
				devicesData.forEach((device) => {
					devicesMap[device.id] = device;
				});
				setDomainDevices((prev) => ({ ...prev, [current]: devicesMap }));
			}
		};

		if (current) {
			fetchDomainDevices();
		}
	}, [
		authClientRequest,
		authState.accessToken,
		current,
		domainDevices,
		logout,
		setDomainDevices,
	]);

	const getPairingCode = useCallback(async () => {
		if (!current) return null;

		const [r, err] = await authClientRequest.post(
			API_ROUTES.DEVICE.CREATE_PAIRING_CODE(current).path,
			null,
			{
				headers: {
					Authorization: AuthClientRequest.createAuthHeader(
						authState.accessToken!,
					),
				},
			},
		);
		if (err) {
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
		}
		if (r?.status === 201) {
			const { pairingCode, expiry } = r.data;
			return [pairingCode, expiry];
		}
	}, [authClientRequest, authState.accessToken, current, logout]);

	const addUser = useCallback(
		async (id) => {
			if (!current) return;
			const [r, err] = await authClientRequest.post(
				API_ROUTES.DOMAIN.ADD_USER(current).path,
				{ id },
				{
					headers: {
						Authorization: AuthClientRequest.createAuthHeader(
							authState.accessToken!,
						),
					},
				},
			);
			if (err) {
				if (err !== null) {
					if (
						err === AuthClientRequest.ErrUnauthorized ||
						err === AuthClientRequest.ErrInvalidRefreshToken
					) {
						logout();
						return;
					}
					if (err === AuthClientRequest.ErrServerError) {
						toast.error("Server error while adding user to domain", {
							description: "Please try again later",
						});
					}
				}
				return [false, "Failed to add user to domain"];
			}
			if (r?.status === 200) {
				return [true, null];
			}
			if (r?.status === 400) {
				return [false, r.data.message || "Failed to add user to domain"];
			}
			return [false, "Failed to add user to domain"];
		},
		[authClientRequest, authState.accessToken, current, logout],
	);

	const userSearch = useCallback(
		async (email) => {
			const [r, err] = await authClientRequest.get(
				API_ROUTES.PROFILE.SEARCH_USERS.path,
				{
					params: { email },
					headers: {
						Authorization: AuthClientRequest.createAuthHeader(
							authState.accessToken!,
						),
					},
				},
			);
			if (err) {
				if (err !== null) {
					if (
						err === AuthClientRequest.ErrUnauthorized ||
						err === AuthClientRequest.ErrInvalidRefreshToken
					) {
						logout();
						return;
					}
					if (err === AuthClientRequest.ErrServerError) {
						toast.error("Server error while searching for users", {
							description: "Please try again later",
						});
					}
				}
				return [];
			}
			if (r?.status === 200) {
				return r.data;
			}
			return [];
		},
		[authClientRequest, authState.accessToken, logout],
	);

	const deleteDevice = useCallback(
		async (deviceId) => {
			if (!current) return false;
			const [r, err] = await authClientRequest.delete(
				API_ROUTES.DEVICE.DELETE_DEVICE(deviceId).path,
				{
					headers: {
						Authorization: AuthClientRequest.createAuthHeader(
							authState.accessToken!,
						),
					},
				},
			);
			if (err) {
				if (err !== null) {
					if (
						err === AuthClientRequest.ErrUnauthorized ||
						err === AuthClientRequest.ErrInvalidRefreshToken
					) {
						logout();
						return false;
					}
					if (err === AuthClientRequest.ErrServerError) {
						toast.error("Server error while deleting device", {
							description: "Please try again later",
						});
					}
				}
				return false;
			}
			if (r?.status === 204) {
				setDomainDevices((prev) => {
					const updatedDevices = { ...prev[current] };
					delete updatedDevices[deviceId];
					return { ...prev, [current]: updatedDevices };
				});
				return true;
			}
			return false;
		},
		[
			authClientRequest,
			authState.accessToken,
			current,
			logout,
			setDomainDevices,
		],
	);

	const editDevice = useCallback(
		async (deviceId, name) => {
			if (!current) return false;
			const [r, err] = await authClientRequest.patch(
				API_ROUTES.DEVICE.UPDATE_DEVICE(deviceId).path,
				{ changes: [{ field: "name", value: name }] },
				{
					headers: {
						Authorization: AuthClientRequest.createAuthHeader(
							authState.accessToken!,
						),
					},
				},
			);
			if (err) {
				if (err !== null) {
					if (
						err === AuthClientRequest.ErrUnauthorized ||
						err === AuthClientRequest.ErrInvalidRefreshToken
					) {
						logout();
						return false;
					}
					if (err === AuthClientRequest.ErrServerError) {
						toast.error("Server error while editing device", {
							description: "Please try again later",
						});
					}
				}
				return false;
			}
			if (r?.status === 200) {
				const updatedDevice = r.data;
				setDomainDevices((prev) => ({
					...prev,
					[current]: {
						...prev[current],
						[deviceId]: {
							...prev[current][deviceId],
							name: updatedDevice.name,
							description: updatedDevice.description,
						},
					},
				}));
				return true;
			}
			return false;
		},
		[
			authClientRequest,
			authState.accessToken,
			current,
			logout,
			setDomainDevices,
		],
	);

	const renderDevices = useCallback(() => {
		if (!current || !(current in domainDevices)) {
			return <></>;
		}
		const devices = domainDevices[current];
		if (Object.keys(devices).length === 0) {
			return (
				<div className="flex flex-col items-center justify-center col-span-full">
					<p className="text-center">No devices found for this domain</p>
				</div>
			);
		}
		return (
			<>
				{Object.values(devices).map((device) => (
					<DomainDeviceCard
						key={device.id}
						name={device.name}
						description={device.description}
						onViewControls={() => setSelectedDevice(device.id)}
						isOnline={device.online}
						isAdmin={isAdmin}
						onEdit={() =>
							setEditingDevice({ id: device.id, name: device.name })
						}
						onDelete={() =>
							setDeletingDevice({ id: device.id, name: device.name })
						}
						onViewInfo={() =>
							setViewingDevice({
								id: device.id,
								name: device.name,
								createdAt: device.createdAt,
							})
						}
					/>
				))}
			</>
		);
	}, [current, domainDevices, isAdmin, setSelectedDevice]);
	return (
		<>
			{isAdmin && (
				<>
					<AddDeviceDialog
						isOpen={isAddDeviceDialogOpen}
						onOpenChange={setIsAddDeviceDialogOpen}
						getPairingCode={getPairingCode}
					/>
					<AddUserDialog
						isOpen={isAddUserDialogOpen}
						onOpenChange={setIsAddUserDialogOpen}
						addUser={addUser}
						userSearch={userSearch}
					/>
					<DomainMenuBar
						setAddDeviceDialogOpen={setIsAddDeviceDialogOpen}
						setAddUserDialogOpen={setIsAddUserDialogOpen}
					/>
				</>
			)}
			<EditDeviceDialog
				isOpen={!!editingDevice}
				onOpenChange={(open) => !open && setEditingDevice(null)}
				device={editingDevice}
				onEdit={editDevice}
			/>
			<DeleteDeviceDialog
				isOpen={!!deletingDevice}
				onOpenChange={(open) => !open && setDeletingDevice(null)}
				device={deletingDevice}
				onDelete={deleteDevice}
			/>
			<ViewDeviceInfoDialog
				isOpen={!!viewingDevice}
				onOpenChange={(open) => !open && setViewingDevice(null)}
				device={viewingDevice}
			/>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
				<Suspense fallback={<p>Loading devices...</p>}>
					<>{renderDevices()}</>
				</Suspense>
			</div>
		</>
	);
}

const DomainDeviceCard = ({
	name,
	description,
	onViewControls,
	isOnline,
	isAdmin,
	onEdit,
	onDelete,
	onViewInfo,
}) => {
	return (
		<>
			<DropdownMenu>
				<Card>
					<CardHeader>
						<CardTitle>{name}</CardTitle>
						<CardDescription>{description}</CardDescription>
						<CardAction>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon">
									<EllipsisVerticalIcon />
								</Button>
							</DropdownMenuTrigger>
						</CardAction>
					</CardHeader>
					<CardFooter>
						<Button variant="outline" onClick={onViewControls}>
							View Controls
						</Button>
						<Badge
							variant="outline"
							className="ml-auto flex items-center gap-1"
						>
							<WifiIcon className="h-3 w-3" />
							{isOnline ? "Online" : "Offline"}
						</Badge>
					</CardFooter>
				</Card>
				<DropdownMenuContent>
					<DropdownMenuItem onClick={onViewInfo}>
						View Device Info
					</DropdownMenuItem>
					{isAdmin && (
						<>
							<DropdownMenuItem onClick={onEdit}>Edit Device</DropdownMenuItem>
							<DropdownMenuItem onClick={onDelete} className="text-destructive">
								Delete Device
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
};
