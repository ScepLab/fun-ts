import * as H from "history";

import { ElmishResult, Program, cmd } from "@fun-ts/elmish";
import type { History, Location } from "history/index";

import { Except } from "type-fest";
import { flow } from "fp-ts/function";

/**
 * Error TS2742 occurs when TypeScript is unable to infer the type of a
 * variable without referencing another variable or module,
 * typically caused by conflicting modules with the same package ID.
 * https://github.com/microsoft/TypeScript/issues/47663#issuecomment-1287942723
 * This types has do be exported manually because of the referred issue.
 */
export type { Location, History };

export const elmishifyHistory = <Msg>(
    history: History = H.createHashHistory()
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
        history: History,
    ) => <ChildArg extends InitArgWithLocation, ChildModel, ChildViewResult>(
        child: Program<ChildArg, ChildModel, Msg, ChildViewResult>
    ): Program<
        Except<ChildArg, "location">,
        ChildModel,
        Msg,
        ChildViewResult
    > => ({
        update: child.update,
        view: child.view,
        setState: child.setState,

        // :( Type assertion
        init: p => child.init({
            ...p,
            location: history.location
        } as ChildArg),

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
