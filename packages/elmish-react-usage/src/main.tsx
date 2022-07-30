import * as O from "fp-ts/Option";

import { debug, program } from "@fun-ts/elmish";
import { init, update, view } from "./app";

import { pipe } from "fp-ts/function";
import { withReactSynchronous } from "@fun-ts/elmish-react";

pipe(
    program.makeProgram({
        init,
        update,
        view,
    }),
    O.of,
    O.map(p => import.meta.env.DEV ?
        pipe(
            p,
            debug.withConsoleDebug,
        ) :
        p,
    ),
    O.bindTo("program"),
    O.bind(
        "root",
        () => pipe(
            document.getElementById("root"),
            O.fromNullable,
            O.map(withReactSynchronous),
        )
    ),
    O.map(({ program, root }) => root(program)),
    O.map(program.run),
);
