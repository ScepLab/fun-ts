import * as H from "history";
import * as cmd from "./cmd";

import { Init, Program } from "./program";

import { flow } from "fp-ts/function";

export type Location = H.Location;

const history = H.createHashHistory();

export const push = <Msg>(url: string) => cmd.ofSub<Msg>(() => {
    history.push(url);
});

export type ProgramWithNavigation<Arg, Model, Msg, ViewResult> =
    & Omit<Program<Arg, Model, Msg, ViewResult>, "init">
    & {
        init: (location: Location) => Init<Model, Msg, Arg>;
    };

export namespace program {
    export const withNavigation = <Msg>(
        locationToMessage: (location: Location) => Msg
    ) => <ChildArg, ChildModel, ChildViewResult>(
        child: ProgramWithNavigation<ChildArg, ChildModel, Msg, ChildViewResult>
    ): Program<ChildArg, ChildModel, Msg, ChildViewResult> => {
            return {
                init: child.init(history.location),
                update: child.update,
                view: child.view,
                setState: child.setState,

                subscribe: (initModel) => cmd.batch(
                    child.subscribe(initModel),
                    cmd.ofSub((dispatch) => {
                        history.listen(flow(
                            update => update.location,
                            locationToMessage,
                            dispatch,
                        ));
                    }),
                ),
            };
        };
}
