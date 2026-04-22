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
import { AuthContext } from "@/contexts/auth_context";
import { Suspense, useCallback, useContext, useEffect } from "react";
import { API_ROUTES } from "@/constants/api_routes";
import { AuthClientRequest } from "@/helpers/client_request";
export default function DomainView({
	current,
	domainDevices,
	domains,
	setDomainDevices,
}) {
	// this is going to be the main content of the dashboard when a user clicks on a domain in the sidebar
	// should display all devices in domain in a grid fashion

	// this is going to dynamically render the devices , because fetching on dashboard render is killer
	const { authState, dispatch, authClientRequest } = useContext(AuthContext)!;
	useEffect(() => {
		const fetchDomainDevices = async () => {
			if (!current) return;
			if (current in domainDevices) return; // if theres already device data for the current domain then dont fetch again
			const [r, err] = await authClientRequest.get(
				API_ROUTES.DEVICE.GET_DOMAIN_DEVICES(current).path,
				{
					headers: {
						Authorization: AuthClientRequest.createAuthHeader(
							authState.accessToken!,
						),
					},
				},
			);
			if (err !== null) {
				console.error("Error fetching domain devices:", err);
				return;
			}
			if (r?.status === 200) {
				const devicesData = r.data;
				setDomainDevices((prev) => ({ ...prev, [current]: devicesData }));
			}
		};

		if (current) {
			fetchDomainDevices();
		}
	}, [current]);

	const renderDevices = useCallback(() => {
		if (!current || !(current in domainDevices)) {
			return <></>;
		}
		const devices = domainDevices[current];
		if (devices.length === 0) {
			return <p className="text-center">No devices found for this domain</p>;
		}
		return (
			<>
				{devices.map((device) => (
					<DomainDeviceCard
						key={device.id}
						name={device.name}
						description={device.description}
					/>
				))}
			</>
		);
	}, [domainDevices, current]);
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<Suspense fallback={<p>Loading devices...</p>}>
				<>{renderDevices()}</>
			</Suspense>
			<DomainDeviceCard
				name="Test Device"
				description="This is a test device"
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
