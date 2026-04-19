import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-muted">
			<Spinner className="size-10" />
		</div>
	);
}
