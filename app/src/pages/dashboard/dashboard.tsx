import React from "react";
import DashboardSidebar from "./dashboard_sidebar";
import DomainView from "./domain_view";
import DeviceView from "./device_view";
import {
	SidebarProvider,
	SidebarTrigger,
	SidebarInset,
} from "@/components/ui/sidebar";

export default function Dashboard() {
	return (
		<>
			<SidebarProvider>
				<DashboardSidebar />
				<SidebarInset>
					<header className="flex items-center gap-2 border-b p-4">
						<SidebarTrigger />
					</header>
					<main className="p-4">
						<DomainView />
					</main>
				</SidebarInset>
			</SidebarProvider>
		</>
	);
}
