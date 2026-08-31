import { CirclePlus, Group } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

import type { TAuthState } from "@/types/auth_state";

type DashboardIconSidebarProps = {
	createDomain: (domainName: string) => Promise<void>;
	createDomainSuccess: [boolean, string | null];
	authState: TAuthState;
	logout: () => void;
};
export default function DashboardIconSidebar({
	createDomain,
	createDomainSuccess,
	authState,
	logout,
}: DashboardIconSidebarProps) {
	// this is the initial sidebar , the right most one thats just icons
	return (
		<Sidebar
			collapsible="none"
			className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
		>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton></SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton size="default" asChild>
								<CreateDomainDialog
									createDomain={createDomain}
									createDomainSuccess={createDomainSuccess}
								/>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroup>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton isActive size="default" asChild>
									{/**This should be the default active button , this is the domains button that shows a list of the users domains */}
									<Group />
								</SidebarMenuButton>
							</SidebarMenuItem>
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<UserMenuItem authState={authState} logout={logout} />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}

const UserMenuItem = ({
	authState,
	logout,
}: {
	authState: TAuthState;
	logout: () => void;
}) => {
	const { isMobile } = useSidebar();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<SidebarMenuButton asChild>
					<Avatar>
						<AvatarFallback>
							{(authState.user?.name.charAt(0) ?? "").replaceAll(" ", "")}
						</AvatarFallback>
					</Avatar>
				</SidebarMenuButton>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				align="end"
				side={isMobile ? "top" : "right"}
				sideOffset={4}
			>
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem>Profile</DropdownMenuItem>
					<DropdownMenuItem>Settings</DropdownMenuItem>
					<DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const CreateDomainDialog = ({
	createDomain,
	createDomainSuccess,
}: {
	createDomain: (domainName: string) => Promise<void>;
	createDomainSuccess: [boolean, string | null];
}) => {
	const [domainName, setDomainName] = useState("");
	const [open, setOpen] = useState(false);
	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		await createDomain(domainName);
		setDomainName("");
		if (createDomainSuccess[0]) setOpen(false);
	};
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button size="icon">
					<CirclePlus data-icon="inline-start" strokeWidth={0.95} />
				</Button>
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Create Domain</DialogTitle>
						<DialogDescription>
							Enter the details for your new domain.
						</DialogDescription>
					</DialogHeader>

					<FieldGroup>
						<Field>
							<FieldLabel htmlFor="domainName">Domain Name</FieldLabel>
							<Input
								id="domainName"
								placeholder="My New Domain"
								value={domainName}
								onChange={(e) => setDomainName(e.target.value)}
							/>
							<FieldError>{createDomainSuccess[1]}</FieldError>
						</Field>
						<DialogFooter>
							<Field>
								<Button type="submit" className="w-full">
									Create Domain
								</Button>
							</Field>
						</DialogFooter>
					</FieldGroup>
				</form>
			</DialogContent>
		</Dialog>
	);
};
