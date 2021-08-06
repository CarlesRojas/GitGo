const vscode = require("vscode");

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
    var newPanel = vscode.window.createWebviewPanel("gitgo", "Git Go", getCurrentActiveColumn, {
        enableScripts: true,
    });

    // Set panel HTML content
    newPanel.webview.html = getWebviewContent();

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

function getWebviewContent() {
    return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Git Go</title>
  </head>
  <body>
	  <p>Hello Git </p>
  </body>
  </html>`;
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};
