import { Spinner } from "@/components/ui/spinner";

export default function Loading({ asChild = false }: { asChild?: boolean }) {
	return (
		<>
			{asChild ? (
				<div className="w-full h-full flex items-center justify-center">
					<Spinner className="size-10" />
				</div>
			) : (
				<div className="min-h-screen flex items-center justify-center bg-muted">
					<Spinner className="size-10" />
				</div>
			)}
		</>
	);
}
