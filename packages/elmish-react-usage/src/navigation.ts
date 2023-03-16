import { Msg } from "./app";
import { navigation } from "@fun-ts/elmish-navigation";

export const { push, history } = navigation.elmishifyHistory<Msg>();
