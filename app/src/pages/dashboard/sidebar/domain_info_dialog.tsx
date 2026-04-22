import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useContext, useEffect, useMemo, useState } from "react";

import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ROLES } from "@/constants/role_permissions";

import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

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
}) {
	// get the domains object , the selected domain id and the set selected
	// going to display the domain basic info and all the users(paginated)
	// going to dynamically load the users of the domain
	// can remove users also - should either open a confirmation emergency dialog or just remove them
	const [userSearch, setUserSearch] = useState("");

	const filteredUsers = useMemo(() => {
		if (!domains[selectedViewDetailsDomain]?.users) return [];
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

	const handleChange = (e) => {
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
	}, [selectedViewDetailsDomain]);

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
						Domain Name: {domains[selectedViewDetailsDomain]?.name}
					</DialogDescription>
				</DialogHeader>
				<div>
					{updateDomainUserSuccess[0] && (
						<span className="text-green-500">{updateDomainUserSuccess[1]}</span>
					)}
					{updateDomainUserSuccess[0] === false &&
						updateDomainUserSuccess[1] && (
							<span className="text-red-500">{updateDomainUserSuccess[1]}</span>
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
										onChange={(newRole) =>
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
											removeUser(selectedViewDetailsDomain, user.userId)
										}
										description="Are you sure you want to remove this user?"
										disabled={user.role === "OWNER"}
									>
										<Button
											variant="destructive"
											disabled={user.role === "OWNER"}
										>
											Remove
										</Button>
									</ConfirmationPopover>
								</TableCell>
								<TableCell>
									{new Date(user.dateJoined).toLocaleDateString()}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
				<DialogFooter>
					<Field>
						<FieldLabel className="leading-7 [&:not(:first-child)]:mt-6 flex items-center justify-between">
							Created:{" "}
							{new Date(
								domains[selectedViewDetailsDomain]?.createdAt,
							).toLocaleDateString()}
							<ConfirmationPopover
								onConfirm={() => deleteDomain(selectedViewDetailsDomain)}
								description="Are you sure you want to delete this domain? This action cannot be undone."
								disabled={
									domains[selectedViewDetailsDomain]?.ownerId !==
									authState?.user?.userId
								}
							>
								<Button
									variant="destructive"
									disabled={
										domains[selectedViewDetailsDomain]?.ownerId !==
										authState?.user?.userId
									}
								>
									Delete Domain
								</Button>
							</ConfirmationPopover>
						</FieldLabel>
					</Field>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

const RoleSwitch = ({ currentRole, onChange }) => {
	return (
		<Select
			value={currentRole}
			onValueChange={onChange}
			disabled={currentRole === "OWNER"}
		>
			<SelectTrigger>
				<SelectValue />
			</SelectTrigger>
			<SelectContent>
				{Object.values(ROLES).map((role) => {
					if (currentRole === "OWNER" && role !== "OWNER") return null;
					if (currentRole !== "OWNER" && role === "OWNER") return null;
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

const ConfirmationPopover = ({
	onConfirm,
	children,
	description,
	...props
}) => {
	return (
		<Popover {...props}>
			<PopoverTrigger disabled={props.disabled}>{children}</PopoverTrigger>
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
