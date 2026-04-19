import {
	SidebarInset,
	SidebarProvider,
	Sidebar,
	SidebarGroup,
	SidebarHeader,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarFooter,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
	SidebarContent,
	SidebarMenuAction,
	SidebarInput,
	useSidebar,
} from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, CirclePlus, Group, EllipsisVerticalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function DashboardSidebar({ ...props }) {
	return (
		<Sidebar
			collapsible="icon"
			variant="sidebar"
			className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
			{...props}
		>
			<DashboardIconSidebar />
			<DashboardSecondMenu />
		</Sidebar>
	);
}

const DashboardIconSidebar = () => {
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
								<Button>
									<CirclePlus data-icon="inline-start" strokeWidth={0.95} />
								</Button>
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
						<UserMenuItem />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
};

const DashboardSecondMenu = () => {
	const { state } = useSidebar();
	return (
		<Sidebar
			collapsible="none"
			className={`hidden flex-1 ${state === "expanded" ? "md:flex" : ""}`}
		>
			<SidebarHeader className="gap-3.5 border-b">
				<div className="flex w-full items-center justify-between">
					<div className="text-base font-medium text-foreground">Domains</div>
				</div>
				<SidebarInput placeholder="Type to search..." />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup className="">
					<SidebarGroupContent>
						<DomainMenuItem isCurrent={true} id="1" name="Domain 1" />
						<DomainMenuItem id="2" name="Domain 2" />
						<DomainMenuItem id="3" name="Domain 3" />
						<DomainMenuItem id="4" name="Domain 4" />
						<DomainMenuItem id="5" name="Domain 5" />
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
};

const DomainMenuItem = ({
	id,
	name,
	changeCurrentDomain = null,
	isCurrent = false,
}) => {
	// basically will be a menu item that when clicked will change the current domain in the main dashboard content to the domain that was clicked
	//

	return (
		<DropdownMenu>
			<SidebarMenuItem className="w-full flex items-center justify-center align-middle">
				<SidebarMenuButton isActive={isCurrent} className="w-full" size="lg">
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
				<DropdownMenuItem>View Domain</DropdownMenuItem>
				<DropdownMenuItem>Edit Domain</DropdownMenuItem>{" "}
				{/* this is where you can see domain details , edit domain users ,transfer ownership and delete domain */}
				<DropdownMenuItem>Leave Domain</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

const UserMenuItem = () => {
	const { isMobile } = useSidebar();
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<SidebarMenuButton className="justify-center" size="default" asChild>
					<Avatar className="rounded-full">
						<AvatarFallback>
							<User size={64} />
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
					<DropdownMenuItem>Logout</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
