const vscode = require("vscode");
const path = require("path");
const nanoid = require("nanoid");
const { spawn } = require("child_process");
const byline = require("byline");

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
    // Current Panel
    let currentPanel;

    //  ###########################################################
    //      OPEN THE PANEL
    //  ###########################################################

    // Open the Git Go Webview Panel
    let openDisposable = vscode.commands.registerCommand("git-go.open", function () {
        // If the panel is already open, show it in the target column
        if (currentPanel) currentPanel.reveal(getCurrentActiveColumn);
        // Otherwise: Create new Panel
        else currentPanel = createGitGoPanel(context);
    });
    context.subscriptions.push(openDisposable);

    //  ###########################################################
    //      REFRESH PANEL
    //  ###########################################################

    // Refresh Panel <- Debug Only
    let refreshDisposable = vscode.commands.registerCommand("git-go.refresh", function () {
        // Close the panel
        if (currentPanel) currentPanel.dispose();

        // Create a new one
        currentPanel = createGitGoPanel(context);

        // Open dev tools
        openDevTools();
    });
    context.subscriptions.push(refreshDisposable);

    //  ###########################################################
    //      WATCH FOR CHANGES IN THE .GIT DIRECTORY
    //  ###########################################################

    // Get path for the watcher
    const workspaceFolder = vscode.workspace.workspaceFolders.length ? vscode.workspace.workspaceFolders[0].uri : undefined;

    // There is a git folder <- TODO
    if (workspaceFolder) {
        // Add watcher
        const gitObjectsPath = new vscode.RelativePattern(workspaceFolder, "**/.git/objects/**");
        let objectsWatcher = vscode.workspace.createFileSystemWatcher(gitObjectsPath, false, false, false);

        // On file created, changed or deleted
        objectsWatcher.onDidChange(() => parseGitFolder(workspaceFolder));
        objectsWatcher.onDidCreate(() => parseGitFolder(workspaceFolder));
        objectsWatcher.onDidDelete(() => parseGitFolder(workspaceFolder));

        console.log(await parseGitFolder(workspaceFolder));
    } else {
        console.log("No repository found in the current workspace.");
    }
}

// Reads the git objects and returns a json representation of them
function parseGitFolder(workspaceFolder) {
    // var repoPath = path.resolve(workspaceFolder.fsPath, ".git");

    return new Promise((resolve, reject) => {
        const gitParams = ["cat-file", "--batch-check", "--batch-all-objects"];
        const gitProcess = spawn("git", gitParams, { cwd: workspaceFolder.fsPath });

        // Handle error
        gitProcess.on("error", (error) => {
            console.log(error);
            reject(error);
        });

        // Parse data
        const parsedObjects = {
            objects: [],
            initialCommit: "",
            commits: [],
            trees: [],
            blobs: [],
            blobsInTree: [],
        };
        const streamByLine = byline(gitProcess.stdout);

        // Object priomises
        var objectPromises = [];

        // When reading a line -> Get all info
        streamByLine.on("data", (line) => {
            objectPromises.push(
                new Promise(async (resolve, reject) => {
                    const object = await parseGitObject(line.toString());

                    if (object) {
                        parsedObjects.objects.push(object);

                        // Save commits
                        if (object.type === "commit") {
                            parsedObjects.commits.push(object.hash);
                            if (!object.parent) parsedObjects.initialCommit = object.hash;
                        }

                        // Save trees
                        else if (object.type === "tree") parsedObjects.trees.push(object.hash);
                        // Save blobs
                        else if (object.type === "blob") parsedObjects.blobs.push(object.hash);
                    } else reject();

                    resolve();
                })
            );
        });

        streamByLine.on("error", (error) => {
            reject(error);
        });

        streamByLine.on("end", async () => {
            await Promise.all(objectPromises);
            resolve(parsedObjects);
        });
    });
}

// Parse git object
function parseGitObject(line) {
    return new Promise((resolve, reject) => {
        // Get the three parts
        const lineParts = line.split(" ");
        if (lineParts.length !== 3) reject();
        const hash = lineParts[0];
        const type = lineParts[1];
        const size = lineParts[2];

        // Get more info
        if (type === "commit") {
        } else if (type === "tree") {
        } else if (type === "blob") {
        }

        resolve({ hash, type, size });
    });
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
