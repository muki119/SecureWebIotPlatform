import {
	Sidebar,
	SidebarGroup,
	SidebarHeader,
	SidebarGroupContent,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarContent,
	SidebarMenuAction,
	SidebarInput,
	useSidebar,
} from "@/components/ui/sidebar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { toast } from "sonner";

import { EllipsisVerticalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_ROUTES } from "@/constants/api_routes";
import { AuthContext } from "@/contexts/auth_context";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import DashboardIconSidebar from "./sidebar/dahsboard_icon_sidebar";
import { AuthClientRequest } from "@/helpers/client_request";
import {
	Field,
	FieldContent,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import DomaindDetailsDialog from "./sidebar/domain_info_dialog";

export default function DashboardSidebar({
	domains,
	setDomains,
	selectedDomain,
	setSelectedDomain,
	logout,
	...props
}) {
	const navigate = useNavigate();
	const { authState, authClientRequest, dispatch } = useContext(AuthContext)!;
	const [createDomainSuccess, setCreateDomainSuccess] = useState<
		[boolean, string | null]
	>([false, null]);
	const [leaveDomainSuccess, setLeaveDomainSuccess] = useState<
		[boolean, string | null]
	>([false, null]);
	const [leaveDomainId, setLeaveDomainId] = useState(null);
	const [selectedInfoDomain, setSelectedInfoDomain] = useState(null);
	const [updateDomainSuccess, setUpdateDomainSuccess] = useState<
		[boolean, string | null]
	>([false, null]);

	const [updateDomainUserSuccess, setUpdateDomainUserSuccess] = useState<
		[boolean, string | null]
	>([false, null]);

	const [selectedViewDetailsDomain, setSelectedViewDetailsDomain] =
		useState(null); // for viewing domain details and users

	const createDomain = async (domainName) => {
		try {
			if (!domainName) {
				setCreateDomainSuccess([false, "Domain name is required"]);
				return;
			}
			const [r, err] = await authClientRequest.post(
				API_ROUTES.DOMAIN.CREATE_DOMAIN.path,
				{
					name: domainName,
				},
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
					toast.error("Server error while creating domain", {
						description: "Please try again later",
					});
				}
				setCreateDomainSuccess([false, err]);
				return;
			}
			if (r?.status === 201) {
				const newDomain = r.data.domain;
				setDomains((prev) => ({ [newDomain.id]: newDomain, ...prev }));
				setCreateDomainSuccess([true, "Domain created successfully"]);
			}
			if (r?.status === 400) {
				setCreateDomainSuccess([false, r.data]);
			}
		} catch (error) {
			/// create a toast for error
			toast.error("Error creating domain");
		}
	};

	const leaveDomain = async (domainId) => {
		try {
			if (!domainId) {
				setLeaveDomainSuccess([false, "Domain id is required"]);
				return;
			}
			const [r, err] = await authClientRequest.post(
				API_ROUTES.DOMAIN.LEAVE_DOMAIN(domainId).path,
				null,
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
					toast.error("Server error while fetching domain users", {
						description: "Please try again later",
					});
					return;
				}
				toast.error("Error leaving domain");
				return;
			}
			if (r?.status === 200) {
				/// close the alerr dialog and create a success toast
				setDomains((prev) => {
					const newDomains = { ...prev };
					delete newDomains[domainId];
					return newDomains;
				});
				setLeaveDomainSuccess([true, "Left domain successfully"]);
				setLeaveDomainId(null);
			}
			if (r?.status === 400) {
				setLeaveDomainSuccess([false, r.data.message]);
			}
		} catch (error) {
			// create a toast for error
			toast.error("Error leaving domain");
		}
	};

	const updateDomainName = async (domainId, domainName) => {
		try {
			if (!domainId || !domainName) {
				// create a toast for error
				return;
			}
			setUpdateDomainSuccess([false, null]);
			const [r, err] = await authClientRequest.patch(
				API_ROUTES.DOMAIN.UPDATE_DOMAIN(domainId).path,
				{
					changes: [{ field: "name", value: domainName }],
				},
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
					toast.error("Server error while fetching domain users", {
						description: "Please try again later",
					});
				}
				// create a toast for error
				return;
			}
			if (r?.status === 200) {
				const newDomain = r.data;
				setDomains((prev) => ({
					...prev,
					[domainId]: { ...prev[domainId], ...newDomain },
				}));
				setUpdateDomainSuccess([true, "Domain name updated successfully"]);
			}
			if (r?.status === 400) {
				setUpdateDomainSuccess([false, r.data.message]);
			}
		} catch (error) {
			// create a toast for error
			toast.error("Error updating domain name");
		}
	};

	const removeUser = async (domainId, userId) => {
		try {
			if (!domainId) {
				// create a toast for error
				return;
			}
			if (!userId) {
				return;
			}

			if (userId === authState?.user?.userId) {
				// error toast
				return;
			}
			const [r, err] = await authClientRequest.delete(
				API_ROUTES.DOMAIN.DELETE_USER(domainId, userId).path,
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
					toast.error("Server error while fetching domain users", {
						description: "Please try again later",
					});
				}
			}
			if (r?.status === 200) {
				setDomains((prev) => {
					const newUsers = { ...prev[domainId].users };
					delete newUsers[userId];
					return {
						...prev,
						[domainId]: { ...prev[domainId], users: newUsers },
					};
				});
				setUpdateDomainUserSuccess([true, r.data.message]);
			}
		} catch (error) {
			// Probably a toast for error
			toast.error("Error fetching domain users");
		}
	};

	const updateUserRole = async (
		domainId: string,
		userId: string,
		newRole: string,
	) => {
		try {
			if (!domainId) {
				// create a toast for error
				return;
			}
			if (!userId) {
				return;
			}
			if (!newRole) {
				return;
			}
			if (newRole === "OWNER") {
				// create a toast for error
				return;
			}
			setUpdateDomainUserSuccess([false, null]);
			const [r, err] = await authClientRequest.patch(
				API_ROUTES.DOMAIN.UPDATE_USER_ROLE(domainId, userId).path,
				{
					role: newRole.toUpperCase(),
				},
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
					toast.error("Server error while fetching domain users", {
						description: "Please try again later",
					});
				}
			}
			if (r?.status === 400) {
				setUpdateDomainUserSuccess([false, r.data.message]);
				return;
			}
			if (r?.status === 200) {
				const successMessage = r.data.message;
				setUpdateDomainUserSuccess([true, successMessage]);
				setDomains((prev) => ({
					...prev,
					[domainId]: {
						...prev[domainId],
						users: {
							...prev[domainId].users,
							[userId]: {
								...prev[domainId].users[userId],
								role: newRole.toUpperCase(),
							},
						},
					},
				}));
			}
		} catch (error) {
			// Probably a toast for error
			toast.error("Error updating user role");
		}
	};

	const fetchDomainUsers = async (domainId) => {
		try {
			if (!domainId) {
				// create a toast for error
				return;
			}
			const [r, err] = await authClientRequest.get(
				API_ROUTES.DOMAIN.GET_DOMAIN_USERS(domainId).path,
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
					toast.error("Server error while fetching domain users", {
						description: "Please try again later",
					});
				}
			}
			if (r?.status === 200) {
				const usersData = r.data;
				const usersObject = {};
				usersData.forEach((user) => {
					usersObject[user.userId] = user;
				});

				setDomains((prev) => ({
					...prev,
					[domainId]: { ...prev[domainId], users: usersObject },
				}));
			}
		} catch (error) {
			// Probably a toast for error
			toast.error("Error fetching domain users");
		}
	};

	const deleteDomain = async (domainId) => {
		try {
			if (!domainId) {
				// create a toast for error
				return;
			}
			const [r, err] = await authClientRequest.delete(
				API_ROUTES.DOMAIN.DELETE_DOMAIN(domainId).path,
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
					toast.error("Server error while deleting domain", {
						description: "Please try again later",
					});
				}
			}
			if (r?.status === 200) {
				setSelectedViewDetailsDomain(null);
				setDomains((prev) => {
					const newDomains = { ...prev };
					delete newDomains[domainId];
					return newDomains;
				});
				toast.success("Domain deleted successfully");
			}
		} catch (error) {
			//toast
			toast.error("Error deleting domain");
			return;
		}
	};

	return (
		<>
			<LeaveDomainAlertDialog
				domainId={leaveDomainId}
				leaveDomain={leaveDomain}
				setLeaveDomainId={setLeaveDomainId}
				leaveDomainSuccess={leaveDomainSuccess}
			/>
			<UpdateDomainDialog
				domains={domains}
				selectedInfoDomain={selectedInfoDomain}
				setSelectedInfoDomain={setSelectedInfoDomain}
				authState={authState}
				updateDomainSuccess={updateDomainSuccess}
				updateDomainName={updateDomainName}
			/>
			<DomaindDetailsDialog
				deleteDomain={deleteDomain}
				authState={authState}
				selectedViewDetailsDomain={selectedViewDetailsDomain}
				fetchDomainUsers={fetchDomainUsers}
				setSelectedViewDetailsDomain={setSelectedViewDetailsDomain}
				domains={domains}
				removeUser={removeUser}
				updateUserRole={updateUserRole}
				updateDomainUserSuccess={updateDomainUserSuccess}
				setUpdateDomainUserSuccess={setUpdateDomainUserSuccess}
			/>
			<Sidebar
				collapsible="icon"
				variant="sidebar"
				className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
				{...props}
			>
				<DashboardIconSidebar
					createDomain={createDomain}
					createDomainSuccess={createDomainSuccess}
					authState={authState}
					logout={logout}
				/>
				<DashboardSecondMenu
					{...{
						authState,
						domains,
						selectedDomain,
						setSelectedDomain,
						leaveDomain,
						setLeaveDomainId,
						setSelectedInfoDomain,
						fetchDomainUsers,
						setSelectedViewDetailsDomain,
					}}
				/>
			</Sidebar>
		</>
	);
}

const UpdateDomainDialog = ({
	domains,
	selectedInfoDomain,
	authState,
	setSelectedInfoDomain,
	updateDomainSuccess,
	updateDomainName,
}) => {
	const [domainDetails, setDomainDetails] = useState(
		domains[selectedInfoDomain],
	);

	const handleChange = (e) => {
		setDomainDetails({ ...domainDetails, name: e.target.value });
	};

	useEffect(() => {
		setDomainDetails(domains[selectedInfoDomain]);
	}, [selectedInfoDomain, domains]);

	const isOwner = useMemo(() => {
		if (!domainDetails || !authState.user) return false;
		return domainDetails.ownerId === authState.user.userId;
	}, [domainDetails, authState.user]);
	const [successfulUpdate, updateMessage] = updateDomainSuccess;
	return (
		<Dialog
			open={selectedInfoDomain !== null}
			onOpenChange={() => setSelectedInfoDomain(null)}
		>
			{" "}
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Domain Information</DialogTitle>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel>Name</FieldLabel>
						<FieldGroup>
							<span className="text-green-500">
								{successfulUpdate && updateMessage}
							</span>
						</FieldGroup>
						<Input
							type="text"
							value={domainDetails?.name || ""}
							onChange={handleChange}
							readOnly={!isOwner}
							placeholder="Domain Name"
						/>
						<Button
							variant="outline"
							disabled={
								!isOwner ||
								domainDetails?.name === "" ||
								domainDetails?.name === domains[selectedInfoDomain]?.name
							}
							onClick={() =>
								updateDomainName(selectedInfoDomain, domainDetails?.name)
							}
						>
							Save
						</Button>
						<FieldError>{!successfulUpdate && updateMessage}</FieldError>
					</Field>
				</FieldGroup>
			</DialogContent>
		</Dialog>
	);
};

const LeaveDomainAlertDialog = ({
	domainId,
	leaveDomain,
	setLeaveDomainId,
	leaveDomainSuccess,
}) => {
	return (
		<AlertDialog open={domainId !== null}>
			{" "}
			<AlertDialogTrigger asChild></AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Leave Domain</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to leave this domain?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<FieldGroup>
						<Field>
							<AlertDialogCancel onClick={() => setLeaveDomainId(null)}>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction onClick={() => leaveDomain(domainId)}>
								Leave
							</AlertDialogAction>
						</Field>
						<Field>
							<FieldContent>
								<FieldError>{leaveDomainSuccess[1]}</FieldError>
							</FieldContent>
						</Field>
					</FieldGroup>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

const DashboardSecondMenu = ({
	domains,
	selectedDomain,
	setSelectedDomain,
	setLeaveDomainId,
	setSelectedInfoDomain,
	setSelectedViewDetailsDomain,
}) => {
	const { state } = useSidebar();
	const [filter, setFilter] = useState("");
	return (
		<Sidebar
			collapsible="none"
			className={` flex-1 ${state === "expanded" ? "md:flex" : ""}`}
		>
			<SidebarHeader className="gap-3.5 border-b">
				<div className="flex w-full items-center justify-between">
					<div className="text-base font-medium text-foreground">Domains</div>
				</div>
				<SidebarInput
					placeholder="Type to search..."
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
				/>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup className="">
					<SidebarGroupContent>
						{Object.values(domains)
							.filter((domain) =>
								domain.name.toLowerCase().includes(filter.toLowerCase()),
							)
							.map((domain) => (
								<DomainMenuItem
									key={domain.id}
									isCurrent={selectedDomain === domain.id}
									id={domain.id}
									name={domain.name}
									onSelect={() => setSelectedDomain(domain.id)}
									setLeaveDomainId={setLeaveDomainId}
									setSelectedInfoDomain={setSelectedInfoDomain}
									setSelectedViewDetailsDomain={setSelectedViewDetailsDomain}
								/>
							))}
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
};

const DomainMenuItem = ({
	id,
	name,
	isCurrent = false,
	onSelect,
	setLeaveDomainId,
	setSelectedInfoDomain,
	setSelectedViewDetailsDomain,
}) => {
	// basically will be a menu item that when clicked will change the current domain in the main dashboard content to the domain that was clicked
	//

	return (
		<DropdownMenu>
			<SidebarMenuItem className="w-full flex items-center justify-center align-middle">
				<SidebarMenuButton
					onClick={onSelect}
					isActive={isCurrent}
					className="w-full"
					size="lg"
				>
					<div>
						<div className="text-sm font-medium">{name}</div>
						<div className="text-xs text-muted-foreground">{"wefw"}</div>
					</div>
					<SidebarMenuAction asChild className="ml-auto">
						<DropdownMenuTrigger>
							<Button variant="ghost" size="icon">
								<EllipsisVerticalIcon />
							</Button>
						</DropdownMenuTrigger>
					</SidebarMenuAction>
				</SidebarMenuButton>
			</SidebarMenuItem>
			<DropdownMenuContent>
				<DropdownMenuItem onClick={onSelect}>View Domain</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setSelectedViewDetailsDomain(id)}>
					Domain Details
				</DropdownMenuItem>
				{/* this is where you can see domain details , edit domain users ,transfer ownership and delete domain */}
				<DropdownMenuItem onClick={() => setSelectedInfoDomain(id)}>
					Edit Domain
				</DropdownMenuItem>
				{/* this is where you can see domain details , edit domain users ,transfer ownership and delete domain */}
				<DropdownMenuItem onClick={() => setLeaveDomainId(id)}>
					Leave Domain
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
