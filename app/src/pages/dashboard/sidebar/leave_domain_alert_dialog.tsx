import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Field,
	FieldContent,
	FieldError,
	FieldGroup,
} from "@/components/ui/field";

type LeaveDomainAlertDialogProps = {
	domainId: string | null;
	leaveDomain: (domainId: string) => void;
	setLeaveDomainId: React.Dispatch<React.SetStateAction<string | null>>;
	leaveDomainSuccess: [boolean, string | null];
};
export default function LeaveDomainAlertDialog({
	domainId,
	leaveDomain,
	setLeaveDomainId,
	leaveDomainSuccess,
}: LeaveDomainAlertDialogProps) {
	return (
		<AlertDialog open={domainId !== null}>
			<AlertDialogTrigger asChild></AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Leave Domain</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to leave this domain?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<FieldGroup>
						<Field>
							<AlertDialogCancel onClick={() => setLeaveDomainId(null)}>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => domainId && leaveDomain(domainId)}
							>
								Leave
							</AlertDialogAction>
						</Field>
						<Field>
							<FieldContent>
								<FieldError>{leaveDomainSuccess[1]}</FieldError>
							</FieldContent>
						</Field>
					</FieldGroup>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
