import { FunctionN, pipe } from "fp-ts/function";
import { Init, Program, Update } from "./program";

const augment = <Args extends unknown[], TReturn>(
    pre: (...a: Args) => void,
    post: (a: TReturn) => void,
) => (f: FunctionN<Args, TReturn>) => {
    return (...args: Args) => {
        pre(...args);
        const res = f(...args);
        post(res);
        return res;
    };
};

const augmentUpdate = <Model, Msg>(
    update: Update<Model, Msg>
): Update<Model, Msg> => pipe(
    update,
    augment(
        (model, msg) => console.debug("Before Update", { model, msg }),
        ([model, commands]) => console.debug("After Update", { model, commands })
    )
);

const augmentInit = <Model, Msg, Args>(
    init: Init<Model, Msg, Args>
): Init<Model, Msg, Args> => pipe(
    init,
    augment(
        (arg) => console.debug("Init with", { arg }),
        ([model, commands]) => console.debug("After Init", { model, commands })
    )
);

export const withConsoleDebug = <Arg, Model, Msg, View>(
    program: Program<Arg, Model, Msg, View>
) => ({
    ...program,
    init: augmentInit(program.init),
    update: augmentUpdate(program.update),
});
