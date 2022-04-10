import { ComponentChild, render } from "preact";

import { core } from "@fun-ts/elmish";

export type PreactView<Model, Msg> = (
    // eslint-disable-next-line no-unused-vars
    dispatch: core.Dispatch<Msg>,
    // eslint-disable-next-line no-unused-vars
    model: Model
) => ComponentChild;

export const withPreactRenderer = (parent: HTMLElement) =>
    <Model, Msg>(view: PreactView<Model, Msg>): core.View<Model, Msg> =>
        (dispatch, model) =>
            render(view(dispatch, model), parent);
