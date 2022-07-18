import { makeADT, ofType } from "@morphic-ts/adt";

type RemoteResultNotLoaded = { type: "NotLoaded"; };
type RemoteResultLoading<L> = { type: "Loading"; } & L;
type RemoteResultFailure<E> = { type: "Failure"; } & E;
type RemoteResultLoaded<T> = { type: "Loaded"; } & T;

const makeADTUsingType = makeADT("type");

export const makeRemoteResultADT = <
    TLoaded extends Record<string, unknown> | {} = {},
    TError extends Record<string, unknown> | {} = {},
    TLoading extends Record<string, unknown> | {} = {}
>() => makeADTUsingType({
    NotLoaded: ofType<RemoteResultNotLoaded>(),
    Loading: ofType<RemoteResultLoading<TLoading>>(),
    Failure: ofType<RemoteResultFailure<TError>>(),
    Loaded: ofType<RemoteResultLoaded<TLoaded>>(),
});
