import { FC } from "react";
import { Link } from "react-router-dom";

type NavigationContainerProps = {
    onNavigate: (link: string) => void;
};

export const NavigationContainer: FC<NavigationContainerProps> = ({
    onNavigate
}) => <>
        <nav style={{ display: "flex", gap: "10px" }}>
            <Link to="/home">Home</Link>
            <Link to="/first-page">First Page</Link>
            <Link to="/second-page">Second Page</Link>
        </nav>
        <nav style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => onNavigate("/home")}>PUSH Home</button>
            <button onClick={() => onNavigate("/first-page")}>PUSH First Page</button>
            <button onClick={() => onNavigate("/second-page")}>PUSH Second Page</button>
        </nav>
    </>;
