import * as ROA from "fp-ts/ReadonlyArray";
import * as T from "fp-ts/Task";
import * as TE from "fp-ts/TaskEither";

import { FunctionN, flow, pipe } from "fp-ts/function";

export type Dispatch<Msg> = (msg: Msg) => void;

export type Subscription<Msg> = (dispatch: Dispatch<Msg>) => void;

export type Cmd<A> = ReadonlyArray<Subscription<A>>;

export const none = [] as const;

export const ofMsg = <Msg extends unknown>(msg: Msg): Cmd<Msg> => [
    (dispatch: Dispatch<Msg>) => { dispatch(msg); }
];

export const ofSub = <Msg extends unknown>(sub: Subscription<Msg>): Cmd<Msg> => [
    sub
];

export const batch = <Msg extends unknown>(...cmds: Cmd<Msg>[]): Cmd<Msg> => pipe(
    cmds,
    ROA.flatten
);

export const map = <MsgA, MsgB>(map: FunctionN<[msg: MsgA], MsgB>) =>
    (cmd: Cmd<MsgA>): Cmd<MsgB> => pipe(
        cmd,
        ROA.map(sub => (dispatch: Dispatch<MsgB>) => sub(flow(map, dispatch)))
        //    \_/    |\______________________/    |   \_________________/||
        //     |     |          |                 |            |         ||
        //     |     |          |                 | 3. dispatch fn, that ||
        //     |     |          |                 |   takes old msg as   ||
        //     |     |          |                 |   param, maps it to  ||
        //     |     |          |                 |   new msg and calls  ||
        //     |     |          |                 |   dispatch with new  ||
        //     |     |          |                 |   msg                ||
        //     |     |          |                  \____________________/ |
        //     |     |          |                            |            |
        //     |     |   2.a accept a               2.b and call old      |
        //     |     |       new dispatch               sub with dispatch |
        //     |     |                                  that maps msg     |
        //     |      \__________________________________________________/
        //  1.an old                         |
        //     sub...         1.b ...returning a mapped subscription
    );

export namespace OfTaskEither {
    export const either = <MsgA, MsgE, E, A>(
        onError: (e: E) => MsgE,
        onSuccess: (a: A) => MsgA,
    ) => (
        te: TE.TaskEither<E, A>
    ): Cmd<MsgA | MsgE> => {
            const bind: Subscription<MsgA | MsgE> = dispatch => pipe(
                te,
                TE.bimap(
                    flow(onError, dispatch),
                    flow(onSuccess, dispatch),
                )
            )();

            return [bind];
        };

    export const perform = <Msg extends unknown, E, A>(
        onSuccess: (a: A) => Msg
    ) => (
        te: TE.TaskEither<E, A>
    ): Cmd<Msg> => {
            const bind: Subscription<Msg> = dispatch => pipe(
                te,
                TE.map(flow(onSuccess, dispatch))
            )();

            return [bind];
        };

    export const attempt = <Msg extends unknown, E, A>(
        onError: (e: E) => Msg
    ) => (
        te: TE.TaskEither<E, A>
    ): Cmd<Msg> => {
            const bind: Subscription<Msg> = dispatch => pipe(
                te,
                TE.mapLeft(flow(onError, dispatch))
            )();

            return [bind];
        };
}

export namespace OfTask {
    export const perform = <Msg extends unknown, A>(
        onSuccess: (a: A) => Msg
    ) => (
        t: T.Task<A>
    ): Cmd<Msg> => {
            const bind: Subscription<Msg> = dispatch => pipe(
                t,
                T.map(flow(onSuccess, dispatch))
            )();

            return [bind];
        };
}
