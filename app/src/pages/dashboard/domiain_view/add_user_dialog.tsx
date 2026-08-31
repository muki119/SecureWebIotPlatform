import { Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import useDebounce from "@/hooks/use-debounce";
export default function AddUserDialog({
	isOpen,
	onOpenChange,
	addUser,
	userSearch,
}) {
	const [inputValue, setInputValue] = useState("");
	const [results, setResults] = useState([]);

	const handleAddUser = async (id) => {
		const [success, message] = await addUser(id);
		if (success) {
			toast.success("User added successfully");
		} else {
			toast.error("Failed to add user", { description: message });
		}
	};

	const debouncedSearch = useDebounce((value: string) => {
		if (value.trim().length < 3) {
			setResults([]);
			return;
		}
		userSearch(value).then((res) => setResults(res ?? []));
	}, 300);

	const handleInputChange = (e) => {
		const value = e.target.value;
		setInputValue(value); // update display immediately
		debouncedSearch(value); // fire search after delay
	};

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add User</DialogTitle>
				</DialogHeader>
				<InputGroup className="max-w-xs">
					<InputGroupInput
						placeholder="Search by email..."
						value={inputValue}
						onChange={handleInputChange}
					/>
					<InputGroupAddon>
						<Search />
					</InputGroupAddon>
					<InputGroupAddon align="inline-end">
						{results.length} results
					</InputGroupAddon>
				</InputGroup>
				<p></p>
				<Table className="mt-4">
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{results.map((user) => (
							<TableRow
								key={user.id}
								onClick={() => handleAddUser(user.userId)}
								className="cursor-pointer hover:bg-gray-100"
							>
								<TableCell>{user.name}</TableCell>
								<TableCell>{user.email}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</DialogContent>
		</Dialog>
	);
}
