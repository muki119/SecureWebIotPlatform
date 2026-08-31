import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ROLES } from "@/constants/role_permissions";
import type { TAuthState } from "@/types/auth_state";
import type { Domains } from "@/types/models";
import { decodeName } from "@/utilities/decode_name";

type DomainDetailsDialogProps = {
	authState: TAuthState;
	selectedViewDetailsDomain: string | null;
	fetchDomainUsers: (domainId: string) => Promise<void>;
	setSelectedViewDetailsDomain: React.Dispatch<
		React.SetStateAction<string | null>
	>;
	domains: Domains;
	removeUser: (domainId: string, userId: string) => Promise<void>;
	updateUserRole: (
		domainId: string,
		userId: string,
		newRole: string,
	) => Promise<void>;
	updateDomainUserSuccess: [boolean, string | null];
	setUpdateDomainUserSuccess: React.Dispatch<
		React.SetStateAction<[boolean, string | null]>
	>;
	deleteDomain: (domainId: string) => Promise<void>;
	isAdmin: boolean;
};
export default function DomaindDetailsDialog({
	authState,
	selectedViewDetailsDomain, // the domainId of the selected domain
	fetchDomainUsers,
	setSelectedViewDetailsDomain,
	domains,
	removeUser,
	updateUserRole,
	updateDomainUserSuccess,
	setUpdateDomainUserSuccess,
	deleteDomain,
	isAdmin,
}: DomainDetailsDialogProps) {
	// get the domains object , the selected domain id and the set selected
	// going to display the domain basic info and all the users(paginated)
	// going to dynamically load the users of the domain
	// can remove users also - should either open a confirmation emergency dialog or just remove them
	const [userSearch, setUserSearch] = useState("");

	const filteredUsers = useMemo(() => {
		if (
			!selectedViewDetailsDomain ||
			!domains[selectedViewDetailsDomain]?.users
		)
			return [];
		return Object.values(domains[selectedViewDetailsDomain].users).filter(
			(user) =>
				user.name
					.toLowerCase()
					.includes(userSearch.replace(/\s/g, "").toLowerCase()) ||
				user.email
					.toLowerCase()
					.includes(userSearch.replace(/\s/g, "").toLowerCase()),
		);
	}, [userSearch, domains, selectedViewDetailsDomain]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		// purpose is to debounce at some point
		setUserSearch(e.target.value);
	};
	useEffect(() => {
		// if the domainid dosent have a users field then fetch the users and set it to the domain object
		// dependent on changes to the selecteddomain id
		if (
			selectedViewDetailsDomain &&
			!domains[selectedViewDetailsDomain]?.users
		) {
			fetchDomainUsers(selectedViewDetailsDomain);
		}
	}, [selectedViewDetailsDomain, fetchDomainUsers, domains]);

	return (
		// a dialog - at the top is the domain name and when it was created , then a paginated or infinite scroll list of users ,each user can be chosen to remove or change role - optional display probably needs getting roles of the user
		<Dialog
			open={selectedViewDetailsDomain !== null}
			onOpenChange={() => {
				setSelectedViewDetailsDomain(null);
				setUpdateDomainUserSuccess([false, null]);
			}}
		>
			<DialogContent className="sm:max-h-[80vh] min-w-2xl">
				<DialogHeader>
					<DialogTitle>Domain Info</DialogTitle>
					<DialogDescription>
						Domain Name:{" "}
						{selectedViewDetailsDomain &&
							decodeName(
								domains[selectedViewDetailsDomain]?.name,
							)}
					</DialogDescription>
				</DialogHeader>
				<div>
					{updateDomainUserSuccess[0] && (
						<span className="text-green-500">
							{updateDomainUserSuccess[1]}
						</span>
					)}
					{updateDomainUserSuccess[0] === false &&
						updateDomainUserSuccess[1] && (
							<span className="text-red-500">
								{updateDomainUserSuccess[1]}
							</span>
						)}
				</div>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead colSpan={5} className="text-center">
								<Input
									placeholder="Search users..."
									value={userSearch}
									onChange={handleChange}
								/>
							</TableHead>
						</TableRow>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Actions</TableHead>
							<TableHead>Date Joined</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredUsers.map((user) => (
							<TableRow key={user.userId}>
								<TableCell>{user.name}</TableCell>
								<TableCell>{user.email}</TableCell>

								<TableCell>
									<RoleSwitch
										currentRole={user.role}
										isAdmin={isAdmin}
										onChange={(newRole) =>
											selectedViewDetailsDomain &&
											updateUserRole(
												selectedViewDetailsDomain,
												user.userId,
												newRole,
											)
										}
									/>
								</TableCell>
								<TableCell>
									<ConfirmationPopover
										onConfirm={() =>
											selectedViewDetailsDomain &&
											removeUser(
												selectedViewDetailsDomain,
												user.userId,
											)
										}
										description="Are you sure you want to remove this user?"
										disabled={user.role === "OWNER"}
									>
										<Button
											variant="destructive"
											disabled={
												user.role === "OWNER" ||
												!isAdmin
											}
										>
											Remove
										</Button>
									</ConfirmationPopover>
								</TableCell>
								<TableCell>
									{new Date(
										user.dateJoined,
									).toLocaleDateString()}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				<DialogFooter>
					{selectedViewDetailsDomain && (
						<Field>
							<FieldLabel className="leading-7 not-first:mt-6 flex items-center justify-between">
								Created:{" "}
								{new Date(
									domains[selectedViewDetailsDomain]
										?.createdAt,
								).toLocaleDateString()}
								<ConfirmationPopover
									onConfirm={() =>
										deleteDomain(selectedViewDetailsDomain)
									}
									description="Are you sure you want to delete this domain? This action cannot be undone."
									disabled={
										domains[selectedViewDetailsDomain]
											?.ownerId !==
										authState?.user?.userId
									}
								>
									<Button
										variant="destructive"
										disabled={
											domains[selectedViewDetailsDomain]
												?.ownerId !==
											authState?.user?.userId
										}
									>
										Delete Domain
									</Button>
								</ConfirmationPopover>
							</FieldLabel>
						</Field>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

type RoleSwitchProps = {
	currentRole: string;
	onChange: (newRole: string) => void;
	isAdmin: boolean;
};

const RoleSwitch = ({ currentRole, onChange, isAdmin }: RoleSwitchProps) => {
	return (
		<Select
			value={currentRole}
			onValueChange={onChange}
			disabled={currentRole === "OWNER" || !isAdmin}
		>
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{Object.values(ROLES).map((role) => {
					if (currentRole === "OWNER" && role !== "OWNER")
						return null;
					if (currentRole !== "OWNER" && role === "OWNER")
						return null;
					return (
						<SelectItem key={role} value={role}>
							{role}
						</SelectItem>
					);
				})}
			</SelectContent>
		</Select>
	);
};

type ConfirmationPopoverProps = {
	onConfirm: () => void;
	children: React.ReactNode;
	description: string;
	disabled?: boolean;
};
const ConfirmationPopover = ({
	onConfirm,
	children,
	description,
	...props
}: ConfirmationPopoverProps) => {
	return (
		<Popover {...props}>
			<PopoverTrigger disabled={props.disabled}>
				{children}
			</PopoverTrigger>
			<PopoverContent>
				<PopoverHeader>Confirm Action</PopoverHeader>
				<PopoverDescription>{description}</PopoverDescription>
				<div className="flex justify-end space-x-2">
					<Button variant="destructive" onClick={onConfirm}>
						Confirm
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
};
