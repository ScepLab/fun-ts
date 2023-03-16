import { ADTType, makeADT, ofType } from "@morphic-ts/adt";
import { ElmishResult, Update, cmd } from "@fun-ts/elmish";
import { InitWithLocation, Location, LocationToMessage } from "@fun-ts/elmish-navigation-legacy";
import { Route, HashRouter as Router } from "react-router-dom";

import { FirstPage } from "./pages/first-page";
import { HomePage } from "./pages/home-page";
import { NavigationContainer } from "./components/navigation-container";
import React from "react";
import { ReactView } from "@fun-ts/elmish-react-legacy";
import { SecondPage } from "./pages/second-page";
import { pipe } from "fp-ts/function";
import { push } from "./navigation";

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
type NavigationRequestedMsg = { type: "NavigationRequested", url: string; };

const MsgAdt = makeADT("type")({
    Test: ofType<TestMsg>(),
    UrlChanged: ofType<UrlChangedMsg>(),
    NavigationRequested: ofType<NavigationRequestedMsg>()
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
        ],

        NavigationRequested: (msg): UR => [
            {
                ...model,
            },
            push(msg.url)
        ]
    }),
);

// ============================================================================
// View
// ============================================================================
export const view: ReactView<Model, Msg> = (dispatch, model) => (
    <React.StrictMode>
        {/* FIXME no history possible yet */}
        <Router>
            <NavigationContainer onNavigate={(url) => {
                dispatch(MsgAdt.as.NavigationRequested({ url }));
            }} />
            <Route path="/">
                <Route path="/first-page">
                    <FirstPage />
                </Route>
                <Route path="/second-page">
                    <SecondPage />
                </Route>
                <Route path="*">
                    <HomePage />
                </Route>
            </Route>
        </Router>
        <pre>
            {JSON.stringify(model.currentLocation, null, 4)}
        </pre>
    </React.StrictMode>
);
