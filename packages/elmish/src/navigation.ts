import * as H from "history";
import * as cmd from "./cmd";

import { ElmishResult, Program } from "./program";

import { Simplify } from "type-fest";
import { flow } from "fp-ts/function";

export type Location = H.Location;

export const elmishifyHistory = <Msg>(
    history: H.History = H.createHashHistory()
) => ({
    history,

    push: (url: string) => cmd.ofSub<Msg>(() => {
        history.push(url);
    }),
});

export type LocationToMessage<Msg> = (location: Location) => Msg;

type InitArgWithLocation = {
    location: Location;
};

export type InitWithLocation<
    Model,
    Msg,
    Arg extends InitArgWithLocation = InitArgWithLocation
    > = (args: Arg) => ElmishResult<Model, Msg>;

export namespace program {

    export const withNavigation = <Msg>(
        locationToMessage: (location: Location) => Msg,
        history: H.History,
    ) => <ChildArg extends InitArgWithLocation, ChildModel, ChildViewResult>(
        child: Program<ChildArg, ChildModel, Msg, ChildViewResult>
    ): Program<
        Simplify<Omit<ChildArg, "location">>,
        ChildModel,
        Msg,
        ChildViewResult
    > => ({
        update: child.update,
        view: child.view,
        setState: child.setState,

        // :( Type assertion
        init: (p) => child.init({ ...p, location: history.location } as ChildArg),

        subscribe: (initModel) => cmd.batch(
            child.subscribe(initModel),
            cmd.ofSub(dispatch => {
                history.listen(flow(
                    update => update.location,
                    locationToMessage,
                    dispatch,
                ));
            }),
        ),
    });

}
