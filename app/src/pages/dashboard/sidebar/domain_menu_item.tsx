import { EllipsisVerticalIcon } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";

type DomainMenuItemProps = {
	id: string;
	name: string;
	isCurrent?: boolean;
	onSelect: () => void;
	setLeaveDomainId: React.Dispatch<React.SetStateAction<string | null>>;
	setSelectedInfoDomain: React.Dispatch<React.SetStateAction<string | null>>;
	setSelectedViewDetailsDomain: React.Dispatch<
		React.SetStateAction<string | null>
	>;
};
export default function DomainMenuItem({
	id,
	name,
	isCurrent = false,
	onSelect,
	setLeaveDomainId,
	setSelectedInfoDomain,
	setSelectedViewDetailsDomain,
}: DomainMenuItemProps) {
	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				onClick={onSelect}
				isActive={isCurrent}
				size="lg"
			>
				<span className="text-sm font-medium truncate w-full">
					{name}
				</span>
			</SidebarMenuButton>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<SidebarMenuAction>
						<EllipsisVerticalIcon />
					</SidebarMenuAction>
				</DropdownMenuTrigger>
				<DropdownMenuContent side="right" align="start">
					<DropdownMenuItem onClick={onSelect}>
						View Domain
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => setSelectedViewDetailsDomain(id)}
					>
						Domain Details
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setSelectedInfoDomain(id)}>
						Edit Domain
					</DropdownMenuItem>
					<DropdownMenuItem
						variant="destructive"
						onClick={() => setLeaveDomainId(id)}
					>
						Leave Domain
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</SidebarMenuItem>
	);
}
