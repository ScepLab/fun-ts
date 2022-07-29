import { Program, program } from "@fun-ts/elmish";

import ReactDOM from "react-dom";
import { ReactElement } from "react";
import { pipe } from "fp-ts/function";

export const withReactSynchronous = (parent: HTMLElement) =>
    <Arg, Model, Msg>(prog: Program<Arg, Model, Msg, ReactElement>) => pipe(
        prog,
        program.withSetState<Model, Msg>((dispatch, model) => {
            ReactDOM.render(prog.view(dispatch, model), parent);
        }),
    );
