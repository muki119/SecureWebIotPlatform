import {
	Sidebar,
	SidebarGroup,
	SidebarHeader,
	SidebarGroupContent,
	SidebarContent,
	SidebarInput,
	useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";
import DomainMenuItem from "./domain_menu_item";

export default function DashboardSecondMenu({
	domains,
	selectedDomain,
	setSelectedDomain,
	setLeaveDomainId,
	setSelectedInfoDomain,
	setSelectedViewDetailsDomain,
	setSelectedDevice,
}) {
	const { state } = useSidebar();
	const [filter, setFilter] = useState("");

	return (
		<Sidebar
			collapsible="none"
			className={`flex-1 ${state === "expanded" ? "md:flex" : ""} w-1`}
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
				<SidebarGroup>
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
									onSelect={() => {
										setSelectedDomain(domain.id);
										setSelectedDevice(null);
									}}
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
}
