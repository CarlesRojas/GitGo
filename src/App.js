import React, { useEffect } from "react";

export default function App() {
    const vscode = window.acquireVsCodeApi();

    vscode.postMessage({
        command: "cmd",
        text: "text",
    });

    const recieveMessage = (message) => {
        console.log(message.data);
    };

    useEffect(() => {
        window.addEventListener("message", recieveMessage);
        return () => {
            window.removeEventListener("message", recieveMessage);
        };
    }, []);

    return <div className="App">Hello React App</div>;
}
