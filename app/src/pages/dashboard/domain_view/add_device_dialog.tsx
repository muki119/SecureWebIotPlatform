import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

type AddDeviceDialogProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	getPairingCode: () => Promise<[string, string] | null>;
};
export default function AddDeviceDialog({
	isOpen,
	onOpenChange,
	getPairingCode,
}: AddDeviceDialogProps) {
	const [codeInfo, setPairingCode] = useState<{
		code: string;
		expiry: string;
	} | null>(null);

	useEffect(() => {
		if (isOpen) {
			const fetchPairingCode = async () => {
				const result = await getPairingCode();
				if (result) {
					const [code, expiry] = result;
					setPairingCode({ code, expiry });
				}
			};
			fetchPairingCode();
		}
	}, [isOpen, getPairingCode]); // regenerate pairing code whenever the domain changes
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Pairing Code</DialogTitle>
				</DialogHeader>
				<h1 className="text-2xl font-bold">{codeInfo?.code}</h1>
				<p className="text-sm text-muted-foreground">
					This code will expire at{" "}
					{codeInfo
						? new Date(codeInfo.expiry).toLocaleTimeString()
						: ""}
				</p>
				<DialogFooter>Use this code to pair your device.</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
