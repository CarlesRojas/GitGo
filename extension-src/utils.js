const vscode = require("vscode");
const nanoid = require("nanoid");
const { existsSync } = require("fs");
const { join } = require("path");

const validatePath = (resolvedPath) => {
    if (!existsSync(resolvedPath)) throw new Error({ id: 410, message: `The path ${resolvedPath} was not found` });
    if (!existsSync(join(resolvedPath, ".git"))) throw new Error({ id: 410, message: `The directory ${resolvedPath} does not appear to be the root of a git repository.` });
};

// Get unique ID
function getUniqueId() {
    const generateID = nanoid.customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 32);
    return generateID();
}

// Open dev tools for the webview
function openDevTools() {
    setTimeout(() => {
        vscode.commands.executeCommand("workbench.action.webview.openDeveloperTools");
    }, 500);
}

// Get the current active column
function getCurrentActiveColumn() {
    return vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
}

module.exports = {
    validatePath,
    getUniqueId,
    openDevTools,
    getCurrentActiveColumn,
};
