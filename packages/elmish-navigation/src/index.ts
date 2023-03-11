import { elmishifyHistory, program } from "./navigation";

export const navigation = { program, elmishifyHistory };
export type {
    InitWithLocation,
    LocationToMessage,
    Location
} from "./navigation";
