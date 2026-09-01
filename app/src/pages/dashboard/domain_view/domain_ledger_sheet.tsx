import { format, formatDistanceToNow } from "date-fns";
import { useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { API_ROUTES } from "@/constants/api_routes";
import { AuthContext } from "@/contexts/auth_context";
import { AuthClientRequest } from "@/helpers/client_request";
import Loading from "@/pages/loading/loading";
import type { ITransactionModel } from "@/types/models";
import { DashboardContext } from "../../../contexts/dashboard_context";

const PAGE_SIZE = 100;

const operationTypeVariant: Record<
	string,
	"default" | "secondary" | "destructive"
> = {
	// enum for operation type to variants for the badge
	CREATE: "default",
	UPDATE: "secondary",
	DELETE: "destructive",
};

type DomainLedgerSheetProps = {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export default function DomainLedgerSheet({
	isOpen,
	onOpenChange,
}: DomainLedgerSheetProps) {
	const dashboardContext = useContext(DashboardContext);
	if (!dashboardContext) throw new Error("DashboardContext is undefined");
	const { selectedDomain, logout } = dashboardContext;
	const authContext = useContext(AuthContext);
	if (!authContext) throw new Error("AuthContext is undefined");
	const { authState, authClientRequest } = authContext;

	const [entries, setEntries] = useState<ITransactionModel[]>([]);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [oldestDate, setOldestDate] = useState<string | null>(null); // oldest record date for pagination

	// Reset when domain changes or sheet opens
	useEffect(() => {
		setEntries([]);
		setOldestDate(null);
		setHasMore(true);
	}, []);

	const getTransactionsPage = useCallback(
		async (from: string) => {
			if (!selectedDomain) return;
			setLoading(true);
			try {
				const [response, err] = await authClientRequest.current.get(
					API_ROUTES.LEDGER.DOMAIN_LEDGER(selectedDomain).path,
					{
						params: { from },
						headers: {
							Authorization: AuthClientRequest.createAuthHeader(
								authState.accessToken,
							),
						},
					},
				);
				if (err !== null) {
					if (
						err === AuthClientRequest.ErrUnauthorized ||
						err === AuthClientRequest.ErrInvalidRefreshToken
					) {
						logout();
						return;
					}
					toast.error("Failed to load ledger", {
						description: "Please try again later",
					});
					return;
				}
				const page: ITransactionModel[] = response?.data ?? [];
				setEntries((prev) => [...prev, ...page]);
				setHasMore(page.length === PAGE_SIZE);
				if (page.length > 0) {
					// oldest record is last because API returns DESC
					const oldest = page[page.length - 1];
					setOldestDate(
						new Date(oldest.opperationTimestamp).toISOString(),
					);
				}
			} finally {
				setLoading(false);
			}
		},
		[selectedDomain, authClientRequest, authState.accessToken, logout],
	);

	// Initial load when sheet opens
	useEffect(() => {
		if (isOpen && selectedDomain && entries.length === 0 && !loading) {
			getTransactionsPage(new Date().toISOString());
		}
	}, [isOpen, selectedDomain, loading, getTransactionsPage, entries.length]);

	const handleLoadMore = () => {
		if (oldestDate) getTransactionsPage(oldestDate);
	};

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-full sm:max-w-2xl flex flex-col"
			>
				<SheetHeader>
					<SheetTitle>Domain Ledger</SheetTitle>
					<SheetDescription>
						Audit log of all actions taken in this domain.
					</SheetDescription>
				</SheetHeader>

				<div className="flex flex-col gap-4 py-4 overflow-y-auto flex-1">
					{entries.length === 0 && !loading && (
						<p className="text-sm text-muted-foreground">
							No entries found.
						</p>
					)}

					{entries.length > 0 && (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Type</TableHead>
									<TableHead>Target</TableHead>
									<TableHead>When</TableHead>
									<TableHead>Opperation Values</TableHead>
									<TableHead>Initiator</TableHead>
									<TableHead>Target Entity</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{entries.map((entry) => (
									<TableRow key={entry.id}>
										<TableCell>
											<Badge
												variant={
													operationTypeVariant[
														entry.opperationType
													] ?? "secondary"
												}
											>
												{entry.opperationType}
											</Badge>
										</TableCell>
										<TableCell className="text-sm">
											<span>
												{entry.opperationTarget}
											</span>
										</TableCell>
										<TableCell
											className="text-xs text-muted-foreground whitespace-nowrap"
											title={format(
												new Date(
													entry.opperationTimestamp,
												),
												"PPpp",
											)}
										>
											{formatDistanceToNow(
												new Date(
													entry.opperationTimestamp,
												),
												{
													addSuffix: true,
												},
											)}
										</TableCell>
										<TableCell>
											{JSON.stringify(entry.value)}
										</TableCell>
										<TableCell>
											{entry.initiatorId}
										</TableCell>
										<TableCell>{entry.targetId}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}

					{loading && <Loading />}

					{!loading && hasMore && entries.length > 0 && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleLoadMore}
							className="self-center"
						>
							Load more
						</Button>
					)}

					{!loading && !hasMore && entries.length > 0 && (
						<p className="text-sm text-muted-foreground text-center">
							No more entries.
						</p>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
