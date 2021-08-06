const vscode = require("vscode");
const path = require("path");
const nanoid = require("nanoid");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Current Panel
    let currentPanel;

    // Open the Git Go Webview Panel
    let openDisposable = vscode.commands.registerCommand("git-go.open", function () {
        // If the panel is already open, show it in the target column
        if (currentPanel) currentPanel.reveal(getCurrentActiveColumn);
        // Otherwise: Create new Panel
        else currentPanel = createGitGoPanel(context);
    });

    // Refresh Panel <- Debug Only
    let refreshDisposable = vscode.commands.registerCommand("git-go.refresh", function () {
        // Close the panel
        if (currentPanel) currentPanel.dispose();

        // Create a new one
        currentPanel = createGitGoPanel(context);

        // Open dev tools
        openDevTools();
    });

    context.subscriptions.push(openDisposable);
    context.subscriptions.push(refreshDisposable);
}

// Creates and returns the Git Go panel
function createGitGoPanel(context) {
    // Create Panel
    var newPanel = vscode.window.createWebviewPanel("react", "Git Go", getCurrentActiveColumn, {
        // Enable javascript in the webview
        enableScripts: true,

        // And restric the webview to only loading content from our build directory.
        localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "build"))],
    });

    // Set panel HTML content
    newPanel.webview.html = getWebviewContent(context.extensionPath);

    // Reset when the current panel is closed
    newPanel.onDidDispose(
        () => {
            newPanel = undefined;
        },
        null,
        context.subscriptions
    );

    return newPanel;
}

// Get the current active column
function getCurrentActiveColumn() {
    return vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;
}

// Open dev tools for the webview
function openDevTools() {
    setTimeout(() => {
        vscode.commands.executeCommand("workbench.action.webview.openDeveloperTools");
    }, 500);
}

// Get the initial html content
function getWebviewContent(extensionPath) {
    const manifest = require(path.join(extensionPath, "build", "asset-manifest.json"));
    const mainScript = manifest["files"]["main.js"];
    const mainStyle = manifest["files"]["main.css"];
    const scriptPathOnDisk = vscode.Uri.file(path.join(extensionPath, "build", mainScript));
    const scriptUri = scriptPathOnDisk.with({ scheme: "vscode-resource" });
    const stylePathOnDisk = vscode.Uri.file(path.join(extensionPath, "build", mainStyle));
    const styleUri = stylePathOnDisk.with({ scheme: "vscode-resource" });

    // Use a unique ID to whitelist which scripts can be run
    const uniqueId = getUniqueId();

    return `<!DOCTYPE html>
            <html lang="en">
                <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=0, shrink-to-fit=no" />
                    <meta name="theme-color" content="#000000" />
                    <meta name="description" content="Manage git projects with a simple UI." />
                    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${uniqueId}';style-src vscode-resource: 'unsafe-inline' http: https: data:;">
                    <link rel="stylesheet" type="text/css" href="${styleUri}">
                    <title>Git Go</title>
                    <base href="${vscode.Uri.file(path.join(extensionPath, "build")).with({ scheme: "vscode-resource" })}/">
                </head>
                <body>
                    <noscript>You need to enable JavaScript to run this app.</noscript>
                    <div id="root"></div>
                    <script nonce="${uniqueId}" src="${scriptUri}"></script>
                </body>
            </html>`;
}

// Get unique ID
function getUniqueId() {
    const generateID = nanoid.customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 32);
    return generateID();
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
