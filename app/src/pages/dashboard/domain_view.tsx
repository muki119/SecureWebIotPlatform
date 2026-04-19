import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { EllipsisVerticalIcon } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
export default function DomainView() {
	// this is going to be the main content of the dashboard when a user clicks on a domain in the sidebar
	// should display all devices in domain in a grid fashion
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<DomainDeviceCard
				name="Device 1"
				description="Device description goes here"
			/>
			<DomainDeviceCard
				name="Device 2"
				description="Device description goes here"
			/>
			<DomainDeviceCard
				name="Device 3"
				description="Device description goes here"
			/>
			<DomainDeviceCard
				name="Device 4"
				description="Device description goes here"
			/>
			<DomainDeviceCard
				name="Device 5"
				description="Device description goes here"
			/>
			<DomainDeviceCard
				name="Device 6"
				description="Device description goes here"
			/>
		</div>
	);
}

const DomainDeviceCard = ({ name, description }) => {
	return (
		<>
			<DropdownMenu>
				<Card>
					<CardHeader>
						<CardTitle>{name}</CardTitle>
						<CardDescription>{description}</CardDescription>
						<CardAction>
							<DropdownMenuTrigger>
								<Button variant="ghost" size="icon">
									<EllipsisVerticalIcon />
								</Button>
							</DropdownMenuTrigger>
						</CardAction>
					</CardHeader>
					<CardContent>
						<p>Device details and status information goes here.</p>
					</CardContent>
					<CardFooter>
						<Button variant="outline">View Controls</Button>
					</CardFooter>
				</Card>
				<DropdownMenuContent>
					<DropdownMenuItem>View Device Info</DropdownMenuItem>
					<DropdownMenuItem>Edit Device</DropdownMenuItem>
					<DropdownMenuItem>Delete Device</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</>
	);
};
