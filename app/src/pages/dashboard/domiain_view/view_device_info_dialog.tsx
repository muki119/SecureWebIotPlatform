import { formatDistanceToNow } from "date-fns";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { DeviceManagementInfo } from "@/types/models";

type ViewDeviceInfoDialogProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	device: DeviceManagementInfo | null;
};
export default function ViewDeviceInfoDialog({
	isOpen,
	onOpenChange,
	device,
}: ViewDeviceInfoDialogProps) {
	if (!device) return null;
	if (!device.createdAt) throw new Error("Device createdAt is undefined");
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Device Info</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<span className="text-xs text-muted-foreground uppercase tracking-wide">
							Name
						</span>
						<span className="text-sm font-medium">
							{device.name}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs text-muted-foreground uppercase tracking-wide">
							Onboarded
						</span>
						<span className="text-sm font-medium">
							{new Date(device.createdAt).toLocaleDateString(
								undefined,
								{
									year: "numeric",
									month: "long",
									day: "numeric",
								},
							)}
						</span>
						<span className="text-xs text-muted-foreground">
							{formatDistanceToNow(new Date(device.createdAt), {
								addSuffix: true,
							})}
						</span>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
