import { FC } from "react";
import { NavigationContainer } from "../components/navigation-container";

export const FirstPage: FC = () => {
    return (
        <div>
            <NavigationContainer />
            <h1>{"First Page"}</h1>
            <h2>{"details"}</h2>
        </div>
    );
};
