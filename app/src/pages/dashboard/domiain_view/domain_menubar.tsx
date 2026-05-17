import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { useState } from "react";
export default function DomainMenuBar({
	setAddDeviceDialogOpen,
	setAddUserDialogOpen,
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
			</CardContent>
		</Card>
	);
}
