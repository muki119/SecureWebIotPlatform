// this view is going to show the device controls
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { EllipsisVerticalIcon } from "lucide-react";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Slider } from "@/components/ui/slider";
import { Field, FieldLabel } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

export default function DeviceView() {
	// this is going to be a full view for a device
	// should show all the controls and readings for a device
	// top should show the read only readings
	// bellow should be either a grid or a list of controlls
	// tapping on any control or reading should magnify or open a thing to control it
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			<CapabilityCard type="binary" />
			<CapabilityCard type="range" />
			<CapabilityCard type="enum" />
			<CapabilityCard type="gauge" />
		</div>
	);
}

const CapabilityCard = ({ type }) => {
	// the cards are going to work as buttons but they display the current state of the control
	let cardContent;
	switch (type) {
		case "binary":
			cardContent = <BinaryCapabilityCard />;
			break;
		case "range":
			cardContent = (
				<RangeCapabilityCard
					name="Range Capability"
					currentState={75}
					capability={{ test: 123 }}
				/>
			);
			break;
		case "enum":
			cardContent = <EnumCapabilityCard />;
			break;
		case "gauge":
			cardContent = <GuageCapabilityCard />;
			break;
		default:
			return null;
	}
	return <Card>{cardContent}</Card>;
};

const BinaryCapabilityCard = () => {
	return (
		<>
			<CardHeader>
				<CardTitle>Capability Name</CardTitle>
				<Switch />
				<CardAction>
					<Button variant="ghost" size="icon">
						<EllipsisVerticalIcon />
					</Button>
				</CardAction>
			</CardHeader>
		</>
	);
};
const RangeCapabilityCard = ({ name, capability, currentState }) => {
	if (!currentState) return null;
	if (!capability) return null;
	return (
		<>
			<CardHeader>
				<CardTitle>Capability Name</CardTitle>
				<CardAction>
					{" "}
					<Button variant="ghost" size="icon">
						<EllipsisVerticalIcon />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<Slider
					defaultValue={[75]}
					max={100}
					step={1}
					className="mx-auto w-full max-w-xs"
				/>
			</CardContent>
		</>
	);
};
const EnumCapabilityCard = () => {
	return (
		<>
			<CardHeader>
				<CardTitle>Enum Name</CardTitle>
				<CardAction>
					{" "}
					<Button variant="ghost" size="icon">
						<EllipsisVerticalIcon />
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent>
				<Select defaultValue="banana">
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							<SelectItem value="apple">Apple</SelectItem>
							<SelectItem value="banana">Banana</SelectItem>
							<SelectItem value="blueberry">Blueberry</SelectItem>
							<SelectItem value="grapes">Grapes</SelectItem>
							<SelectItem value="pineapple">Pineapple</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
			</CardContent>
		</>
	);
};
const GuageCapabilityCard = () => {
	return (
		<>
			<CardHeader>
				<Field className="w-full max-w-sm">
					<FieldLabel htmlFor="progress-upload">
						<span>Gauge Name</span>
						<span className="ml-auto">66</span>
					</FieldLabel>
					<Progress value={66} id="progress-upload" />
				</Field>
				<CardAction>
					{" "}
					<Button variant="ghost" size="icon">
						<EllipsisVerticalIcon />
					</Button>
				</CardAction>
			</CardHeader>
		</>
	);
};
const ColorCapabilityCard = () => {};

const CapabilityDialog = () => {
	// this is going to be a dialog that opens when you click on a device control or reading
	// theres finite types of controls and readings (capabilitiy types) so i can just switch
	// this is actuallt going to be a switch that aggregates all the different types od capabilities
};
