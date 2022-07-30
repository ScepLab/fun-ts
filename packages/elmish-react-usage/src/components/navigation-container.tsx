import { FC } from "react";
import { Link } from "react-router-dom";

export const NavigationContainer: FC = () => (
    <nav style={{ display: "flex", gap: "10px" }}>
        <Link to="/home">{"Home"}</Link>
        <Link to="/first-page">{"First Page"}</Link>
        <Link to="/second-page">{"Second Page"}</Link>
    </nav>
);
