import { ADTType, makeADT, ofType } from "@morphic-ts/adt";
import { ElmishResult, Init, Update, cmd } from "@fun-ts/elmish";
import { Route, HashRouter as Router, Routes } from "react-router-dom";

import { FirstPage } from "./pages/first-page";
import { HomePage } from "./pages/home-page";
import React from "react";
import { ReactView } from "@fun-ts/elmish-react";
import { SecondPage } from "./pages/second-page";
import { pipe } from "fp-ts/function";

// ============================================================================
// Model
// ============================================================================
export type Model = {
};

// ============================================================================
// Init
// ============================================================================
export const init: Init<Model, Msg> = (): ElmishResult<Model, Msg> => [
    {
    },
    []
];

// ============================================================================
// Msg
// ============================================================================
type TestMsg = { type: "Test"; };

const MsgAdt = makeADT("type")({
    Test: ofType<TestMsg>(),
});
export type Msg = ADTType<typeof MsgAdt>;

// ============================================================================
// Update
// ============================================================================
type UR = ElmishResult<Model, Msg>;
export const update: Update<Model, Msg> = (model, msg): UR => pipe(
    msg,
    MsgAdt.matchStrict({
        Test: (): UR => [{
            ...model,
        }, cmd.none],
    }),
);

// ============================================================================
// View
// ============================================================================
export const view: ReactView<Model, Msg> = (_dispatch, _model) => {
    return (
        <React.StrictMode>
            <Router>
                <Routes>
                    <Route path="/">
                        <Route index element={<HomePage />} />
                        <Route path="first-page" element={<FirstPage />} />
                        <Route path="second-page" element={<SecondPage />} />
                        <Route path="*" element={<HomePage />} />
                    </Route>
                </Routes>
            </Router>
        </React.StrictMode>
    );
};
