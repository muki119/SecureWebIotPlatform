import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle,
	CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EllipsisVerticalIcon, ArrowLeftIcon, WifiIcon } from "lucide-react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Slider } from "@/components/ui/slider";
import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { DashboardContext } from "../../contexts/dashboard_context";
import { useContext, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { HexColorPicker } from "react-colorful";
import { SOCKET_EVENTS } from "@/constants/api_routes";
import { toast } from "sonner";

const CAPABILITY_TYPES = {
	BINARY: "BINARY",
	RANGE: "RANGE",
	ENUM: "ENUM",
	GAUGE: "GAUGE",
	COLOR: "COLOR",
};

export default function DeviceView() {
	const {
		selectedDevice,
		setSelectedDevice,
		domainDevices,
		setDomainDevices,
		selectedDomain,
		socketRef,
	} = useContext(DashboardContext)!;

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
			({ code, error, message }) => {
				switch (code) {
					case 400:
						toast.error("Bad request", { description: error });
						break;
					case 401:
						toast.error("Unauthorized", { description: error });
						break;
					case 200:
						toast.success("Device updated", { description: message });
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
			return {
				...prev,
				[selectedDomain]: {
					...prev[selectedDomain],
					[selectedDevice]: {
						...prev[selectedDomain][selectedDevice],
						currentState: {
							...prev[selectedDomain][selectedDevice].currentState,
							[capability]: { value, timestamp: Date.now() },
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
					{device.description && (
						<p className="text-sm text-muted-foreground">
							{device.description}
						</p>
					)}
				</div>
				<Badge variant="outline" className="ml-auto flex items-center gap-1">
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
}: {
	capability: any;
	currentState: any;
	capabilityKey: string;
	handleCapabilityChange: (
		capability: string,
		value: number | string | boolean,
	) => void;
}) => {
	if (!capability) return null;
	let content;
	switch (capability.type) {
		case CAPABILITY_TYPES.BINARY:
			content = (
				<BinaryCapabilityCard
					capability={capability}
					currentState={currentState}
					capabilityKey={capabilityKey}
					handleCapabilityChange={handleCapabilityChange}
				/>
			);
			break;
		case CAPABILITY_TYPES.RANGE:
			content = (
				<RangeCapabilityCard
					capability={capability}
					currentState={currentState}
					handleCapabilityChange={handleCapabilityChange}
					capabilityKey={capabilityKey}
				/>
			);
			break;
		case CAPABILITY_TYPES.ENUM:
			content = (
				<EnumCapabilityCard
					capability={capability}
					currentState={currentState}
					handleCapabilityChange={handleCapabilityChange}
					capabilityKey={capabilityKey}
				/>
			);
			break;
		case CAPABILITY_TYPES.GAUGE:
			content = (
				<GaugeCapabilityCard
					capability={capability}
					currentState={currentState}
					handleCapabilityChange={handleCapabilityChange}
				/>
			);
			break;
		case CAPABILITY_TYPES.COLOR:
			content = (
				<ColorCapabilityCard
					capability={capability}
					currentState={currentState}
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
					{formatDistanceToNow(currentState?.timestamp ?? Date.now(), {
						addSuffix: true,
					})}
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
}) => {
	const raw = currentState?.value ?? currentState;
	const isOn = raw === true || raw === 1 || raw === "true";
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
}) => {
	const min = capability.min ?? 0;
	const max = capability.max ?? 100;
	const step = capability.step ?? 1;
	const value = currentState?.value ?? min;
	const [sliderValue, setSliderValue] = useState(value);
	return (
		<>
			<CardHeader>
				<div className="flex flex-col gap-1">
					<CardTitle className="text-sm font-medium">
						{capability.label}
					</CardTitle>
					<span className="text-xs text-muted-foreground">
						{sliderValue} / {max}
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
					min={min}
					max={max}
					step={step}
					className="w-full"
					onValueChange={(newValue) => setSliderValue(newValue[0])}
					onValueCommit={(newValue) =>
						handleCapabilityChange(capabilityKey, newValue[0])
					}
				/>
				<div className="flex justify-between text-xs text-muted-foreground mt-1">
					<span>{min}</span>
					<span>{max}</span>
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
}) => {
	const options: string[] = capability.enumValues ?? [];
	const [currentOption, setCurrentOption] = useState(currentState?.value ?? "");
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
					value={currentOption}
					onValueChange={setCurrentOption}
					onOpenChange={(open) => {
						if (!open) {
							handleCapabilityChange(capabilityKey, currentOption);
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

const GaugeCapabilityCard = ({ capability, currentState }) => {
	const min = capability.min ?? 0;
	const max = capability.max ?? 100;
	const value = currentState?.value ?? min;
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
}) => {
	const [currentColor, setCurrentColor] = useState(
		currentState?.value ?? "#ffffff",
	);
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
					onChangeEnd={(color) => handleCapabilityChange(capabilityKey, color)}
				/>
				<InputGroup className="w-32 ml-4">
					<InputGroupAddon>Hex</InputGroupAddon>
					<InputGroupInput
						value={currentColor}
						onChange={(e) => setCurrentColor(e.target.value)}
						onBlur={() => handleCapabilityChange(capabilityKey, currentColor)}
					/>
				</InputGroup>
			</CardContent>
		</>
	);
};
