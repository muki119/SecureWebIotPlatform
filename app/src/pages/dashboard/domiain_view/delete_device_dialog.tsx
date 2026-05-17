import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";

export default function DeleteDeviceDialog({ isOpen, onOpenChange, device, onDelete }) {
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		setLoading(true);
		const success = await onDelete(device?.id);
		setLoading(false);
		if (success) {
			toast.success(`${device?.name} deleted`);
			onOpenChange(false);
		} else {
			toast.error("Failed to delete device");
		}
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete {device?.name}?</AlertDialogTitle>
					<AlertDialogDescription>
						This will permanently remove the device from this domain. It will
						need to be re-paired to rejoin.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={handleDelete} disabled={loading}>
						{loading ? "Deleting..." : "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
