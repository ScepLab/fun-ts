import { Msg } from "./app";
import { navigation } from "@fun-ts/elmish-navigation-legacy";

export const { push, history } = navigation.elmishifyHistory<Msg>();
