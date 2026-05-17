import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function EditDeviceDialog({ isOpen, onOpenChange, device, onEdit }) {
	const [name, setName] = useState(device?.name ?? "");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (isOpen) setName(device?.name ?? "");
	}, [isOpen, device?.name]);

	const handleSubmit = async () => {
		if (!name.trim()) return;
		setLoading(true);
		const success = await onEdit(device.id, name.trim());
		setLoading(false);
		if (success) {
			toast.success("Device updated");
			onOpenChange(false);
		} else {
			toast.error("Failed to update device");
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Device</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="device-name">Name</Label>
					<Input
						id="device-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Device name"
						onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={loading || !name.trim()}>
						{loading ? "Saving..." : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
