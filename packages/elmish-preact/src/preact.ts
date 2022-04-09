import { ComponentChild, render } from "preact";
import { Dispatch, View } from "@fun-ts/elmish";

export type PreactView<Model, Msg> = (
    // eslint-disable-next-line no-unused-vars
    dispatch: Dispatch<Msg>,
    // eslint-disable-next-line no-unused-vars
    model: Model
) => ComponentChild;

export const withPreactRenderer = (parent: HTMLElement) =>
    <Model, Msg>(view: PreactView<Model, Msg>): View<Model, Msg> =>
        (dispatch, model) =>
            render(view(dispatch, model), parent);
