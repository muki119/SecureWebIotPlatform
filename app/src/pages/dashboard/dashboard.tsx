import React from "react";
import DashboardSidebar from "./dashboard_sidebar";
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
				</SidebarInset>
			</SidebarProvider>
		</>
	);
}
