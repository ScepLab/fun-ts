import { Msg } from "./app";
import { navigation } from "@fun-ts/elmish";

// ============================================================================
// Navigation
// ============================================================================
export const { push, history } = navigation.elmishifyHistory<Msg>();
