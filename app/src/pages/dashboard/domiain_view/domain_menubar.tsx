import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export default function DomainMenuBar({
	setAddDeviceDialogOpen,
	setAddUserDialogOpen,
	setIsDomainTransactionsDialogOpen,
}) {
	return (
		<Card className="w-full mb-2">
			<CardContent>
				<Button
					variant="outline"
					className="mr-2"
					onClick={() => setAddUserDialogOpen(true)}
				>
					Add User
				</Button>
				<Button
					variant="outline"
					className="mr-2"
					onClick={() => setAddDeviceDialogOpen(true)}
				>
					Add Device
				</Button>
				<Button
					variant="outline"
					className="mr-2"
					onClick={() => setIsDomainTransactionsDialogOpen(true)}
				>
					View Ledger
				</Button>
			</CardContent>
		</Card>
	);
}
