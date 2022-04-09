import * as A from "fp-ts/ReadOnlyArray";

import { Dispatch, Subscription } from "./core";

import { pipe } from "fp-ts/function";

export type Cmd<A> = ReadonlyArray<Subscription<A>>;

export const none = [] as const;

export const ofMsg = <Msg extends unknown, T extends Msg>(
    msg: T
): [Subscription<Msg>] => [
        (dispatch: Dispatch<Msg>) => { dispatch(msg); }
    ];

export const ofSub = <Msg extends unknown, T extends Msg>(
    sub: Subscription<T>
): [Subscription<Msg>] => [sub];

export const batch = <Msg extends unknown>(
    ...cmds: Cmd<Msg>[]
): Cmd<Msg> => pipe(
    cmds,
    A.flatten
);
