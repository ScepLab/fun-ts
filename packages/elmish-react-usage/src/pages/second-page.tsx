import { FC } from "react";
import { NavigationContainer } from "../components/navigation-container";

export const SecondPage: FC = () => {
    return (
        <div>
            <NavigationContainer />
            <h1>{"Second Page"}</h1>
            <h2>{"details"}</h2>
        </div>
    );
};
