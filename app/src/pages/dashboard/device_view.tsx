import { formatDistanceToNow } from "date-fns";
import { ArrowLeftIcon, EllipsisVerticalIcon, WifiIcon } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SOCKET_EVENTS } from "@/constants/api_routes";
import { CapabilityTypes } from "@/constants/capability_types";
import type {
	CapabilityType,
	CurrentDeviceState,
	DeviceCapabilities,
} from "@/types/models";
import { DashboardContext } from "../../contexts/dashboard_context";

export type CapabilityCardProps<T extends CapabilityType = CapabilityType> = {
	capability: DeviceCapabilities<T>;
	currentState?: CurrentDeviceState<T>;
};

export type MutableCapabilityCardProps<
	T extends CapabilityType = CapabilityType,
> = CapabilityCardProps<T> & {
	capabilityKey: string;
	handleCapabilityChange: (
		capability: string,
		value: number | string | boolean,
	) => void;
};
export default function DeviceView() {
	const dashboardContext = useContext(DashboardContext);
	if (!dashboardContext) return null;
	const {
		selectedDevice,
		setSelectedDevice,
		domainDevices,
		setDomainDevices,
		selectedDomain,
		socketRef,
	} = dashboardContext;

	if (!selectedDomain || !selectedDevice) return null;

	const device = domainDevices[selectedDomain]?.[selectedDevice];
	if (!device) return null;
	const capabilities = device.capabilities ?? {};
	const currentState = device.currentState ?? {};

	const handleCapabilityChange = (
		capability: string,
		value: number | string | boolean,
	) => {
		const dataObject = {
			deviceId: selectedDevice,
			domainId: selectedDomain,
			changes: {
				capability,
				value,
			},
		};
		socketRef.current?.emit(
			SOCKET_EVENTS.CLIENT_EMITTED.DEVICE_CONTROL.UPDATE,
			dataObject,
			({
				code,
				error,
				message,
			}: {
				code: number;
				error?: string;
				message?: string;
			}) => {
				switch (code) {
					case 400:
						toast.error("Bad request", { description: error });
						break;
					case 401:
						toast.error("Unauthorized", { description: error });
						break;
					case 200:
						toast.success("Device updated", {
							description: message,
						});
						break;
					case 500:
						toast.error("Server error", { description: error });
						break;
					default:
						toast.error("Unexpected error");
						break;
				}
			},
		);
		setDomainDevices((prev) => {
			const prevDevice = prev[selectedDomain][selectedDevice];
			// type is carried over from the capability definition since it never changes at runtime
			const capabilityType = prevDevice.capabilities[capability]?.type;
			return {
				...prev,
				[selectedDomain]: {
					...prev[selectedDomain],
					[selectedDevice]: {
						...prevDevice,
						currentState: {
							...prevDevice.currentState,
							[capability]: {
								type: capabilityType,
								value,
								timestamp: Date.now(),
							} as CurrentDeviceState,
						},
						online: true,
					},
				},
			};
		});
	};

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setSelectedDevice(null)}
				>
					<ArrowLeftIcon className="h-4 w-4" />
				</Button>
				<div>
					<h2 className="text-lg font-semibold">{device.name}</h2>
				</div>
				<Badge
					variant="outline"
					className="ml-auto flex items-center gap-1"
				>
					<WifiIcon className="h-3 w-3" />
					{device.online ? "Online" : "Offline"}
				</Badge>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{Object.keys(capabilities).map((key) => (
					<CapabilityCard
						handleCapabilityChange={handleCapabilityChange}
						key={key}
						capabilityKey={key}
						capability={capabilities[key]}
						currentState={currentState[key]}
					/>
				))}
			</div>
		</div>
	);
}

const CapabilityCard = ({
	capability,
	currentState,
	capabilityKey,
	handleCapabilityChange,
}: MutableCapabilityCardProps & { capabilityKey: string }) => {
	if (!capability) return null;
	let content: React.ReactNode;
	switch (capability.type) {
		case CapabilityTypes.BINARY:
			content = (
				<BinaryCapabilityCard
					capability={capability}
					currentState={
						currentState as CurrentDeviceState<
							typeof CapabilityTypes.BINARY
						>
					}
					capabilityKey={capabilityKey}
					handleCapabilityChange={handleCapabilityChange}
				/>
			);
			break;
		case CapabilityTypes.RANGE:
			content = (
				<RangeCapabilityCard
					capability={capability}
					currentState={
						currentState as CurrentDeviceState<
							typeof CapabilityTypes.RANGE
						>
					}
					handleCapabilityChange={handleCapabilityChange}
					capabilityKey={capabilityKey}
				/>
			);
			break;
		case CapabilityTypes.ENUM:
			content = (
				<EnumCapabilityCard
					capability={capability}
					currentState={
						currentState as CurrentDeviceState<
							typeof CapabilityTypes.ENUM
						>
					}
					handleCapabilityChange={handleCapabilityChange}
					capabilityKey={capabilityKey}
				/>
			);
			break;
		case CapabilityTypes.GAUGE:
			content = (
				<GaugeCapabilityCard
					capability={capability}
					currentState={
						currentState as CurrentDeviceState<
							typeof CapabilityTypes.GAUGE
						>
					}
				/>
			);
			break;
		case CapabilityTypes.COLOR:
			content = (
				<ColorCapabilityCard
					capability={capability}
					currentState={
						currentState as CurrentDeviceState<
							typeof CapabilityTypes.COLOR
						>
					}
					handleCapabilityChange={handleCapabilityChange}
					capabilityKey={capabilityKey}
				/>
			);
			break;
		default:
			return null;
	}
	return (
		<Card className="transition-shadow hover:shadow-md">
			{content}
			<CardFooter>
				<p className="text-xs text-muted-foreground">
					Last updated{" "}
					{formatDistanceToNow(
						currentState?.timestamp ?? Date.now(),
						{
							addSuffix: true,
						},
					)}
				</p>
			</CardFooter>
		</Card>
	);
};

const BinaryCapabilityCard = ({
	capability,
	currentState,
	handleCapabilityChange,
	capabilityKey,
}: MutableCapabilityCardProps<typeof CapabilityTypes.BINARY>) => {
	const raw = currentState?.value ?? currentState;
	const isOn = raw === true || raw === 1;
	return (
		<CardHeader>
			<div className="flex flex-col gap-1">
				<CardTitle className="text-sm font-medium">
					{capability.label}
				</CardTitle>
				<span
					className={`text-xs font-semibold ${isOn ? "text-green-500" : "text-muted-foreground"}`}
				>
					{isOn ? "ON" : "OFF"}
				</span>
			</div>
			<CardAction className="flex items-center gap-2">
				<Switch
					checked={isOn}
					onCheckedChange={(checked) =>
						handleCapabilityChange(capabilityKey, checked)
					}
				/>
				<Button variant="ghost" size="icon">
					<EllipsisVerticalIcon className="h-4 w-4" />
				</Button>
			</CardAction>
		</CardHeader>
	);
};

const RangeCapabilityCard = ({
	capability,
	currentState,
	handleCapabilityChange,
	capabilityKey,
}: MutableCapabilityCardProps<typeof CapabilityTypes.RANGE>) => {
	const [sliderConfig] = useState({
		min: capability.min ?? 0,
		max: capability.max ?? 100,
		step: capability.step ?? 1,
	});
	const [sliderValue, setSliderValue] = useState(
		currentState?.value ?? sliderConfig.min,
	);
	useEffect(() => {
		if (currentState?.value !== undefined)
			setSliderValue(currentState.value as number);
	}, [currentState?.value]);
	return (
		<>
			<CardHeader>
				<div className="flex flex-col gap-1">
					<CardTitle className="text-sm font-medium">
						{capability.label}
					</CardTitle>
					<span className="text-xs text-muted-foreground">
						{sliderValue} / {sliderConfig.max}
					</span>
				</div>
				<CardAction>
					<Button variant="ghost" size="icon">
						<EllipsisVerticalIcon className="h-4 w-4" />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="pt-0 pb-4">
				<Slider
					value={[sliderValue]}
					min={sliderConfig.min}
					max={sliderConfig.max}
					step={sliderConfig.step}
					className="w-full"
					onValueChange={(newValue) => setSliderValue(newValue[0])}
					onValueCommit={(newValue) =>
						handleCapabilityChange(capabilityKey, newValue[0])
					}
				/>
				<div className="flex justify-between text-xs text-muted-foreground mt-1">
					<span>{sliderConfig.min}</span>
					<span>{sliderConfig.max}</span>
				</div>
			</CardContent>
		</>
	);
};

const EnumCapabilityCard = ({
	capability,
	currentState,
	handleCapabilityChange,
	capabilityKey,
}: MutableCapabilityCardProps<typeof CapabilityTypes.ENUM>) => {
	const options: string[] = capability.enumValues ?? [];
	const [currentOption, setCurrentOption] = useState(
		currentState?.value ?? "",
	);
	useEffect(() => {
		if (currentState?.value !== undefined)
			setCurrentOption(currentState.value);
	}, [currentState?.value]);
	return (
		<>
			<CardHeader>
				<div className="flex flex-col gap-1">
					<CardTitle className="text-sm font-medium">
						{capability.label}
					</CardTitle>
					<span className="text-xs text-muted-foreground">
						{currentOption || "—"}
					</span>
				</div>
				<CardAction>
					<Button variant="ghost" size="icon">
						<EllipsisVerticalIcon className="h-4 w-4" />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="pt-0 pb-4">
				<Select
					value={String(currentOption)}
					onValueChange={setCurrentOption}
					onOpenChange={(open) => {
						if (!open) {
							handleCapabilityChange(
								capabilityKey,
								currentOption,
							);
						}
					}}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select…" />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{options.map((opt) => (
								<SelectItem key={opt} value={opt}>
									{opt}
								</SelectItem>
							))}
						</SelectGroup>
					</SelectContent>
				</Select>
			</CardContent>
		</>
	);
};
const GaugeCapabilityCard = ({
	capability,
	currentState,
}: CapabilityCardProps<typeof CapabilityTypes.GAUGE>) => {
	const min = capability.min ?? 0;
	const max = capability.max ?? 100;
	const value = currentState?.value ?? min; // for gauge types , it will only ever be a number
	const percent = ((value - min) / (max - min)) * 100; // find percentage between the min and max
	return (
		<>
			<CardHeader>
				<div className="flex flex-col gap-1 w-full">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm font-medium">
							{capability.label}
						</CardTitle>
						<Badge variant="secondary" className="text-xs">
							Read only
						</Badge>
					</div>
					<span className="text-2xl font-bold tabular-nums">
						{value}
						{capability.metric && (
							<span className="text-sm font-normal text-muted-foreground ml-1">
								{capability.metric}
							</span>
						)}
					</span>
				</div>
				<CardAction>
					<Button variant="ghost" size="icon">
						<EllipsisVerticalIcon className="h-4 w-4" />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="pt-0 pb-4">
				<Field className="w-full">
					<FieldLabel className="flex justify-between text-xs text-muted-foreground mb-1">
						<span>{min}</span>
						<span>{max}</span>
					</FieldLabel>
					<Progress value={percent} />
				</Field>
			</CardContent>
		</>
	);
};

const ColorCapabilityCard = ({
	capability,
	currentState,
	handleCapabilityChange,
	capabilityKey,
}: MutableCapabilityCardProps<typeof CapabilityTypes.COLOR>) => {
	const [currentColor, setCurrentColor] = useState(
		(currentState?.value as string) ?? "#ffffff",
	);
	useEffect(() => {
		if (currentState?.value !== undefined)
			setCurrentColor(currentState.value as string);
	}, [currentState?.value]);
	return (
		<>
			<CardHeader>
				<div className="flex flex-col gap-1">
					<CardTitle className="text-sm font-medium">
						{capability.label}
					</CardTitle>
				</div>
				<CardAction>
					<Button variant="ghost" size="icon">
						<EllipsisVerticalIcon className="h-4 w-4" />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className=" flex items-center justify-center">
				<HexColorPicker
					color={currentColor}
					onChange={setCurrentColor}
					onChangeEnd={(color) =>
						handleCapabilityChange(capabilityKey, color)
					}
				/>
				<InputGroup className="w-32 ml-4">
					<InputGroupAddon>Hex</InputGroupAddon>
					<InputGroupInput
						value={currentColor}
						onChange={(e) => setCurrentColor(e.target.value)}
						onBlur={() =>
							handleCapabilityChange(capabilityKey, currentColor)
						}
					/>
				</InputGroup>
			</CardContent>
		</>
	);
};
