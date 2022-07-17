import { Program, View, program } from "@fun-ts/elmish";

import ReactDOM from "react-dom/client";
import { ReactElement } from "react";
import { pipe } from "fp-ts/function";

export type ReactView<Model, Msg> = View<Model, Msg, ReactElement>;

export const withReactSynchronous =
    (parent: HTMLElement) => {
        const root = ReactDOM.createRoot(parent);

        return <Arg, Model, Msg>(prog: Program<Arg, Model, Msg, ReactElement>) => pipe(
            prog,
            program.withSetState<Model, Msg>((dispatch, model) => {
                root.render(prog.view(dispatch, model));
            })
        );
    };
