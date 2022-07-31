import { ADTType, makeADT, ofType } from "@morphic-ts/adt";
import { ElmishResult, InitWithLocation, Location, LocationToMessage, Update, cmd } from "@fun-ts/elmish";
import { Route, unstable_HistoryRouter as Router, Routes, } from "react-router-dom";

import { FirstPage } from "./pages/first-page";
import { HomePage } from "./pages/home-page";
import React from "react";
import { ReactView } from "@fun-ts/elmish-react";
import { SecondPage } from "./pages/second-page";
import { history } from "./navigation";
import { pipe } from "fp-ts/function";

// ============================================================================
// Model
// ============================================================================
export type Model = {
    currentLocation: Location;
};

// ============================================================================
// Init
// ============================================================================
export const init: InitWithLocation<Model, Msg, { location: Location; }> = ({
    location
}): ElmishResult<Model, Msg> => [
        {
            currentLocation: location
        },
        []
    ];

// ============================================================================
// Msg
// ============================================================================
type TestMsg = { type: "Test"; };
type UrlChangedMsg = { type: "UrlChanged", location: Location; };

const MsgAdt = makeADT("type")({
    Test: ofType<TestMsg>(),
    UrlChanged: ofType<UrlChangedMsg>(),
});
export type Msg = ADTType<typeof MsgAdt>;

// ============================================================================
// Location
// ============================================================================
export const locationToMsg: LocationToMessage<Msg> = location => (
    MsgAdt.of.UrlChanged({ location })
);

// ============================================================================
// Update
// ============================================================================
type UR = ElmishResult<Model, Msg>;
export const update: Update<Model, Msg> = (model, msg): UR => pipe(
    msg,
    MsgAdt.matchStrict({
        Test: (): UR => [
            {
                ...model,
            },
            cmd.none
        ],

        UrlChanged: (msg): UR => [
            {
                ...model,
                currentLocation: msg.location
            },
            cmd.none
        ]
    }),
);

// ============================================================================
// View
// ============================================================================
export const view: ReactView<Model, Msg> = (_dispatch, model) => {
    return (
        <React.StrictMode>
            <Router history={history}>
                <Routes>
                    <Route path="/">
                        <Route index element={<HomePage />} />
                        <Route path="first-page" element={<FirstPage />} />
                        <Route path="second-page" element={<SecondPage />} />
                        <Route path="*" element={<HomePage />} />
                    </Route>
                </Routes>
            </Router>
            <pre>{JSON.stringify(model.currentLocation, null, 4)}</pre>
        </React.StrictMode>
    );
};
