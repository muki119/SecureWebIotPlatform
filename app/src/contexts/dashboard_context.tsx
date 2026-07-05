import type { ITransactionModel, DomainDevices, Domains } from "@/types/models";
import { createContext } from "react";
import type { Socket } from "socket.io-client";

export const DashboardContext = createContext<
	| {
			domains: Domains;
			setDomains: React.Dispatch<React.SetStateAction<Domains>>;
			domainDevices: DomainDevices;
			setDomainDevices: React.Dispatch<React.SetStateAction<DomainDevices>>;
			selectedDomain: string | null;
			setSelectedDomain: React.Dispatch<React.SetStateAction<string | null>>;
			socketRef: React.RefObject<Socket | null>;
			logout: () => void;
			isAdmin: boolean;
			setSelectedDevice: React.Dispatch<React.SetStateAction<string | null>>;
			selectedDevice: string | null;
			domainTransactions: Record<string, ITransactionModel[]>;
			setDomainTransactions: React.Dispatch<
				React.SetStateAction<Record<string, ITransactionModel[]>>
			>;
			// add more state and functions as needed
	  }
	| undefined
>(undefined);
