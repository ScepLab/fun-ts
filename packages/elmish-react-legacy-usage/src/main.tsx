import * as O from "fp-ts/Option";

import { debug, program } from "@fun-ts/elmish";
import { init, locationToMsg, update, view } from "./app";

import { history } from "./navigation";
import { navigation } from "@fun-ts/elmish-navigation-legacy";
import { pipe } from "fp-ts/function";
// FIXME it is possible to import "@fun-ts/elmish-react"
// although it is not in the package dependencies defined
import { withReactSynchronous } from "@fun-ts/elmish-react-legacy";

// FIXME the project can be transpiled but using the navigation failed
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
