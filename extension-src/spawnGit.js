const vscode = require("vscode");
const byline = require("byline");
const { spawn } = require("child_process");

async function spawnGit(params) {
    return new Promise((resolve) => {
        // Workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length ? vscode.workspace.workspaceFolders[0].uri : undefined;

        // Spawn git child process
        const gitProcess = spawn("git", params, { cwd: workspaceFolder.fsPath });
        const streamByLine = byline(gitProcess.stdout);

        // Promises
        var promises = [];

        // Lines
        var lines = [];

        // When reading a line -> Get all info
        streamByLine.on("data", (line) => {
            promises.push(
                new Promise(async (resolve) => {
                    console.log(line.toString());
                    lines.push(line.toString().replace("\t", " "));
                    resolve();
                })
            );
        });

        // On line error
        streamByLine.on("error", (error) => {
            console.log(error);
        });

        // On no more lines to read
        streamByLine.on("end", async () => {
            await Promise.all(promises);
            resolve(lines);
        });
    });
}

module.exports = spawnGit;
