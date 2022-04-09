/* eslint-disable no-unused-vars */
import { Cmd } from "./cmd";

export type Init<Model, Msg> = UpdateResult<Model, Msg>;
export type Subscription<Msg> = (dispatch: Dispatch<Msg>) => void;
export type Update<Model, Msg> = (
    model: Model,
    msg: Msg
) => UpdateResult<Model, Msg>;
export type View<Model, Msg> = (
    dispatch: Dispatch<Msg>,
    model: Model
) => void;

export type Program<Model, Msg> = {
    init: Init<Model, Msg>;
    update: Update<Model, Msg>;
    view: View<Model, Msg>;
    subscription?: Subscription<Msg>;
};

export type UpdateResult<Model, Msg> = [Model, Cmd<Msg>];
export type Dispatch<Msg> = (msg: Msg) => void;

const runAsync: (cb: VoidFunction) => void =
    typeof queueMicrotask === "undefined" ?
        (tick => (t: VoidFunction) => { tick.then(t); })(Promise.resolve()) :
        queueMicrotask;

export const run = <Model, Msg>(program: Program<Model, Msg>) => {
    const { init, update, view, subscription } = program;
    let currentState: Model;

    runEffects(init);

    subscription && subscription(dispatch);

    function dispatch(msg: Msg) {
        runEffects(update(currentState, msg));
    }

    function runEffects([updatedState, cmd]: UpdateResult<Model, Msg>) {
        currentState = updatedState;

        cmd.forEach(sub => runAsync(() => sub(dispatch)));

        view(dispatch, updatedState);
    }
};
