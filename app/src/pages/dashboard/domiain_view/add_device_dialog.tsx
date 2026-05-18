import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import { useEffect, useState } from "react";

export default function AddDeviceDialog({
	isOpen,
	onOpenChange,
	getPairingCode,
}) {
	const [codeInfo, setPairingCode] = useState(null);

	useEffect(() => {
		if (isOpen) {
			const fetchPairingCode = async () => {
				const [code, expiry] = await getPairingCode();
				setPairingCode({ code, expiry });
			};
			fetchPairingCode();
		}
	}, [isOpen]); // regenerate pairing code whenever the domain changes
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Pairing Code</DialogTitle>
				</DialogHeader>
				<h1 className="text-2xl font-bold">{codeInfo?.code}</h1>
				<p className="text-sm text-muted-foreground">
					This code will expire at{" "}
					{new Date(codeInfo?.expiry).toLocaleTimeString()}
				</p>
				<DialogFooter>Use this code to pair your device.</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
