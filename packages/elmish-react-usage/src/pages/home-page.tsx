import { FC } from "react";
import { NavigationContainer } from "../components/navigation-container";

export const HomePage: FC = () => {
    return (
        <div>
            <NavigationContainer />
            <h1>{"Home Page"}</h1>
        </div>
    );
};
