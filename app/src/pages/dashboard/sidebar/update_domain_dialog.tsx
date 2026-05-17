import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

export default function UpdateDomainDialog({
	domains,
	selectedInfoDomain,
	authState,
	setSelectedInfoDomain,
	updateDomainSuccess,
	updateDomainName,
	isAdmin,
}) {
	const [domainDetails, setDomainDetails] = useState(
		domains[selectedInfoDomain],
	);

	const handleChange = (e) => {
		setDomainDetails({ ...domainDetails, name: e.target.value });
	};

	useEffect(() => {
		setDomainDetails(domains[selectedInfoDomain]);
	}, [selectedInfoDomain, domains]);

	const isOwner = useMemo(() => {
		if (!domainDetails || !authState.user) return false;
		return domainDetails.ownerId === authState.user.userId;
	}, [domainDetails, authState.user]);

	const [successfulUpdate, updateMessage] = updateDomainSuccess;
	return (
		<Dialog
			open={selectedInfoDomain !== null}
			onOpenChange={() => setSelectedInfoDomain(null)}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Domain Information</DialogTitle>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel>Name</FieldLabel>
						<FieldGroup>
							<span className="text-green-500">
								{successfulUpdate && updateMessage}
							</span>
						</FieldGroup>
						<Input
							type="text"
							value={domainDetails?.name || ""}
							onChange={handleChange}
							readOnly={!isOwner}
							placeholder="Domain Name"
						/>
						<Button
							variant="outline"
							disabled={
								!isOwner ||
								domainDetails?.name === "" ||
								domainDetails?.name === domains[selectedInfoDomain]?.name
							}
							onClick={() =>
								updateDomainName(selectedInfoDomain, domainDetails?.name)
							}
						>
							Save
						</Button>
						<FieldError>{!successfulUpdate && updateMessage}</FieldError>
					</Field>
				</FieldGroup>
			</DialogContent>
		</Dialog>
	);
}
