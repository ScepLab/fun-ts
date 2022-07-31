import * as O from "fp-ts/Option";

import { debug, navigation, program } from "@fun-ts/elmish";
import { init, locationToMsg, update, view } from "./app";

import { history } from "./navigation";
import { pipe } from "fp-ts/function";
import { withReactSynchronous } from "@fun-ts/elmish-react";

pipe(
    program.makeProgram({
        init,
        update,
        view,
    }),
    navigation.program.withNavigation(
        locationToMsg,
        history
    ),

    p => import.meta.env.DEV ?
        pipe(
            p,
            debug.withConsoleDebug,
        ) :
        p,

    O.of,
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
