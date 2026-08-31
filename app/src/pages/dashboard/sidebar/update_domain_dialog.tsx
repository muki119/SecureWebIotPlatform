import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
import type { TAuthState } from "@/types/auth_state";
import type { Domains } from "@/types/models";

type UpdateDomainDialogProps = {
	domains: Domains;
	selectedInfoDomain: string | null;
	setSelectedInfoDomain: React.Dispatch<React.SetStateAction<string | null>>;
	authState: TAuthState;
	updateDomainSuccess: [boolean, string | null];
	updateDomainName: (domainId: string, name: string) => Promise<void>;
};

export default function UpdateDomainDialog({
	domains,
	selectedInfoDomain,
	authState,
	setSelectedInfoDomain,
	updateDomainSuccess,
	updateDomainName,
}: UpdateDomainDialogProps) {
	const [domainDetails, setDomainDetails] = useState(
		selectedInfoDomain ? domains[selectedInfoDomain] : null,
	);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!domainDetails) return;
		setDomainDetails({ ...domainDetails, name: e.target.value });
	};

	useEffect(() => {
		if (!selectedInfoDomain) return;
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
								!!selectedInfoDomain &&
								(!isOwner ||
									domainDetails?.name === "" ||
									domainDetails?.name ===
										domains[selectedInfoDomain]?.name)
							}
							onClick={() => () => {
								if (!selectedInfoDomain || !domainDetails)
									return;
								updateDomainName(
									selectedInfoDomain,
									domainDetails?.name,
								);
							}}
						>
							Save
						</Button>
						<FieldError>
							{!successfulUpdate && updateMessage}
						</FieldError>
					</Field>
				</FieldGroup>
			</DialogContent>
		</Dialog>
	);
}
