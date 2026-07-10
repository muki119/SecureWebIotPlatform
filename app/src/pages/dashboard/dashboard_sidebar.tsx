import { Sidebar } from "@/components/ui/sidebar";
import { API_ROUTES } from "@/constants/api_routes";
import { AuthContext } from "@/contexts/auth_context";
import { AuthClientRequest } from "@/helpers/client_request";
import type { Role, User } from "@/types/models";
import { useContext, useState } from "react";
import { toast } from "sonner";
import { DashboardContext } from "../../contexts/dashboard_context";

import DashboardIconSidebar from "./sidebar/dahsboard_icon_sidebar";
import DashboardSecondMenu from "./sidebar/dashboard_second_menu";
import DomaindDetailsDialog from "./sidebar/domain_info_dialog";
import LeaveDomainAlertDialog from "./sidebar/leave_domain_alert_dialog";
import UpdateDomainDialog from "./sidebar/update_domain_dialog";

export default function DashboardSidebar() {
	const { authState, authClientRequest } = useContext(AuthContext)!;
	const {
		domains,
		setDomains,
		selectedDomain,
		setSelectedDomain,
		logout,
		isAdmin,
		setSelectedDevice,
	} = useContext(DashboardContext)!;
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
		useState(null);

	const createDomain = async (domainName: string) => {
		try {
			if (!domainName) {
				setCreateDomainSuccess([false, "Domain name is required"]);
				return;
			}
			const [r, err] = await authClientRequest.current.post(
				API_ROUTES.DOMAIN.CREATE_DOMAIN.path,
				{ name: domainName },
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
		} catch (e) {
			console.log(e);
			toast.error("Error creating domain");
		}
	};

	const leaveDomain = async (domainId: string) => {
		try {
			if (!domainId) {
				setLeaveDomainSuccess([false, "Domain id is required"]);
				return;
			}
			const [r, err] = await authClientRequest.current.post(
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
					toast.error("Server error while leaving domain", {
						description: "Please try again later",
					});
					return;
				}
				toast.error("Error leaving domain");
				return;
			}
			if (r?.status === 200) {
				setDomains((prev) => {
					const next = { ...prev };
					delete next[domainId];
					return next;
				});
				setSelectedDomain(null);
				setSelectedDevice(null);
				setLeaveDomainSuccess([true, "Left domain successfully"]);
				setLeaveDomainId(null);
			}
			if (r?.status === 400) {
				setLeaveDomainSuccess([false, r.data.message]);
			}
		} catch {
			toast.error("Error leaving domain");
		}
	};

	const updateDomainName = async (domainId: string, domainName: string) => {
		try {
			if (!domainId || !domainName) return;
			setUpdateDomainSuccess([false, null]);
			const [r, err] = await authClientRequest.current.patch(
				API_ROUTES.DOMAIN.UPDATE_DOMAIN(domainId).path,
				{ changes: [{ field: "name", value: domainName }] },
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
					toast.error("Server error while updating domain", {
						description: "Please try again later",
					});
				}
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
		} catch {
			toast.error("Error updating domain name");
		}
	};

	const removeUser = async (domainId: string, userId: string) => {
		try {
			if (!domainId || !userId) return;
			if (userId === authState?.user?.userId) return;
			const [r, err] = await authClientRequest.current.delete(
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
					toast.error("Server error while removing user", {
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
		} catch {
			toast.error("Error removing user");
		}
	};

	const updateUserRole = async (
		domainId: string,
		userId: string,
		newRole: string,
	) => {
		try {
			if (!domainId || !userId || !newRole || newRole === "OWNER") return;
			setUpdateDomainUserSuccess([false, null]);
			const [r, err] = await authClientRequest.current.patch(
				API_ROUTES.DOMAIN.UPDATE_USER_ROLE(domainId, userId).path,
				{ role: newRole.toUpperCase() },
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
					toast.error("Server error while updating role", {
						description: "Please try again later",
					});
				}
			}
			if (r?.status === 400) {
				setUpdateDomainUserSuccess([false, r.data.message]);
				return;
			}
			if (r?.status === 200) {
				setUpdateDomainUserSuccess([true, r.data.message]);
				setDomains((prev) => ({
					...prev,
					[domainId]: {
						...prev[domainId],
						users: {
							...prev[domainId].users,
							[userId]: {
								...prev[domainId].users[userId],
								role: newRole.toUpperCase() as Role,
							},
						},
					},
				}));
			}
		} catch {
			toast.error("Error updating user role");
		}
	};

	const fetchDomainUsers = async (domainId: string) => {
		try {
			if (!domainId) return;
			const [r, err] = await authClientRequest.current.get(
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
				const usersObject: Record<string, User> = {};
				r.data.forEach((user: User) => {
					usersObject[user.userId] = user;
				});
				setDomains((prev) => ({
					...prev,
					[domainId]: { ...prev[domainId], users: usersObject },
				}));
			}
		} catch {
			toast.error("Error fetching domain users");
		}
	};

	const deleteDomain = async (domainId: string) => {
		try {
			if (!domainId) return;
			const [r, err] = await authClientRequest.current.delete(
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
				setSelectedDomain(null);
				setSelectedDevice(null);
				setDomains((prev) => {
					const next = { ...prev };
					delete next[domainId];
					return next;
				});
				toast.success("Domain deleted successfully");
			}
		} catch {
			toast.error("Error deleting domain");
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
				isAdmin={isAdmin}
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
				isAdmin={isAdmin}
			/>
			<Sidebar
				collapsible="icon"
				variant="sidebar"
				className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
			>
				<DashboardIconSidebar
					createDomain={createDomain}
					createDomainSuccess={createDomainSuccess}
					authState={authState}
					logout={logout}
				/>
				<DashboardSecondMenu
					domains={domains}
					selectedDomain={selectedDomain}
					setSelectedDomain={setSelectedDomain}
					setLeaveDomainId={setLeaveDomainId}
					setSelectedInfoDomain={setSelectedInfoDomain}
					setSelectedViewDetailsDomain={setSelectedViewDetailsDomain}
					setSelectedDevice={setSelectedDevice}
				/>
			</Sidebar>
		</>
	);
}
