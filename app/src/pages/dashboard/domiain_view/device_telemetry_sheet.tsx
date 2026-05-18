import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { useContext, useState, useEffect } from "react";
import { DashboardContext } from "../../../contexts/dashboard_context";
import { AuthContext } from "@/contexts/auth_context";
import { API_ROUTES } from "@/constants/api_routes";
import { AuthClientRequest } from "@/helpers/client_request";
import { format } from "date-fns";

const telemetryChartConfig: ChartConfig = {
	avg: { label: "Avg", color: "hsl(var(--chart-1))" },
	min: { label: "Min", color: "hsl(var(--chart-2))" },
	max: { label: "Max", color: "hsl(var(--chart-3))" },
};

export default function DeviceTelemetrySheet({ isOpen, onOpenChange }) {
	const { domainDevices, selectedDomain } = useContext(DashboardContext)!;
	const { authState, authClientRequest } = useContext(AuthContext)!;

	const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
	const [selectedCapability, setSelectedCapability] = useState<string | null>(
		null,
	);
	const [interval, setInterval] = useState("WEEK");
	const [data, setData] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	const devices = selectedDomain
		? Object.values(domainDevices[selectedDomain] ?? {})
		: [];
	const selectedDevice = selectedDeviceId
		? domainDevices[selectedDomain!]?.[selectedDeviceId]
		: null;
	const capabilities = selectedDevice?.capabilities
		? Object.entries(selectedDevice.capabilities)
		: [];
	const capabilityType =
		selectedDevice?.capabilities?.[selectedCapability!]?.type;
	const isNumeric = capabilityType === "RANGE" || capabilityType === "GAUGE";

	useEffect(() => {
		if (!selectedDeviceId || !selectedCapability) return;
		const fetchTelemetry = async () => {
			setLoading(true);
			const [r] = await authClientRequest.get(
				API_ROUTES.DEVICE.GET_DEVICE_TELEMETRY(selectedDeviceId).path,
				{
					params: {
						capability: selectedCapability,
						interval,
						from: new Date().toISOString(),
					},
					headers: {
						Authorization: AuthClientRequest.createAuthHeader(
							authState.accessToken!,
						),
					},
				},
			);
			setLoading(false);
			if (r?.status === 200) setData(r.data.telemetry ?? []);
			else setData([]);
		};
		fetchTelemetry();
	}, [
		selectedDeviceId,
		selectedCapability,
		interval,
		authClientRequest,
		authState.accessToken,
	]);

	const formatPeriod = (id: string) => {
		try {
			const d = new Date(id);
			if (interval === "DAY") return format(d, "HH:mm");
			if (interval === "WEEK") return format(d, "EEE dd MMM");
			return format(d, "dd MMM");
		} catch {
			return id;
		}
	};

	const handleDeviceChange = (value: string) => {
		setSelectedDeviceId(value);
		setSelectedCapability(null);
		setData([]);
	};

	const handleCapabilityChange = (value: string) => {
		setSelectedCapability(value);
		setData([]);
	};

	const chartData = data.map((row) => ({
		period: formatPeriod(row._id),
		avg: row.avg != null ? parseFloat(row.avg.toFixed(2)) : null,
		min: row.min != null ? parseFloat(row.min.toFixed(2)) : null,
		max: row.max != null ? parseFloat(row.max.toFixed(2)) : null,
	}));

	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col">
				<SheetHeader>
					<SheetTitle>Telemetry History</SheetTitle>
					<SheetDescription>
						Aggregated sensor readings for this domain.
					</SheetDescription>
				</SheetHeader>

				<div className="flex flex-col gap-4 py-4 overflow-y-auto flex-1">
					<div className="flex gap-2 flex-wrap">
						<Select
							value={selectedDeviceId ?? ""}
							onValueChange={handleDeviceChange}
						>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Device" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{devices.map((d: any) => (
										<SelectItem key={d.id} value={d.id}>
											{d.name}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>

						<Select
							value={selectedCapability ?? ""}
							onValueChange={handleCapabilityChange}
							disabled={!selectedDeviceId}
						>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Capability" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{capabilities.map(([key, cap]: [string, any]) => (
										<SelectItem key={key} value={key}>
											{cap.label ?? key}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>

						<Select value={interval} onValueChange={setInterval}>
							<SelectTrigger className="w-36">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="DAY">Today</SelectItem>
								<SelectItem value="WEEK">This Week</SelectItem>
								<SelectItem value="MONTH">This Month</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{loading && (
						<p className="text-sm text-muted-foreground">Loading...</p>
					)}

					{!loading && !selectedCapability && (
						<p className="text-sm text-muted-foreground">
							Select a device and capability to view history.
						</p>
					)}

					{!loading && selectedCapability && data.length === 0 && (
						<p className="text-sm text-muted-foreground">
							No data for this period.
						</p>
					)}

					{!loading && data.length > 0 && isNumeric && (
						<ChartContainer
							config={telemetryChartConfig}
							className="aspect-auto h-64 w-full"
						>
							<LineChart data={chartData} margin={{ left: 8, right: 8 }}>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="period"
									tick={{ fontSize: 11 }}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									tick={{ fontSize: 11 }}
									tickLine={false}
									axisLine={false}
									width={36}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Line
									dataKey="avg"
									stroke="var(--color-avg)"
									dot={false}
									strokeWidth={2}
									connectNulls
								/>
								<Line
									dataKey="min"
									stroke="var(--color-min)"
									dot={false}
									strokeWidth={1.5}
									strokeDasharray="4 2"
									connectNulls
								/>
								<Line
									dataKey="max"
									stroke="var(--color-max)"
									dot={false}
									strokeWidth={1.5}
									strokeDasharray="4 2"
									connectNulls
								/>
							</LineChart>
						</ChartContainer>
					)}

					{!loading && data.length > 0 && !isNumeric && (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Period</TableHead>
									<TableHead>Last Value</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.map((row, i) => (
									<TableRow key={i}>
										<TableCell className="text-xs text-muted-foreground">
											{formatPeriod(row._id)}
										</TableCell>
										<TableCell>{String(row.last)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
