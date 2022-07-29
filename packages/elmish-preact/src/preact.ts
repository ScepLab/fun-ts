import { ComponentChild, render } from "preact";
import { Program, View, program } from "@fun-ts/elmish";

import { pipe } from "fp-ts/function";

export type PreactView<Model, Msg> = View<Model, Msg, ComponentChild>;

export const withPreactSynchronous = (parent: HTMLElement) =>
    <Arg, Model, Msg>(prog: Program<Arg, Model, Msg, ComponentChild>) =>
        pipe(
            prog,
            program.withSetState<Model, Msg>((dispatch, model) => {
                render(prog.view(dispatch, model), parent);
            }),
        );
