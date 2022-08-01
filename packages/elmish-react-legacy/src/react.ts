import { Program, View, program } from "@fun-ts/elmish";

import { ReactElement } from "react";
import { pipe } from "fp-ts/function";
import { render } from "react-dom";

export type ReactView<Model, Msg> = View<Model, Msg, ReactElement>;

export const withReactSynchronous = (parent: HTMLElement) =>
    <Arg, Model, Msg>(prog: Program<Arg, Model, Msg, ReactElement>) => pipe(
        prog,
        program.withSetState<Model, Msg>((dispatch, model) => {
            render(prog.view(dispatch, model), parent);
        }),
    );
