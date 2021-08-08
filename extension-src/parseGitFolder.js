const byline = require("byline");
const { spawn } = require("child_process");

// Reads the git objects and returns a json representation of them
function parseGitFolder(workspaceFolder) {
    return new Promise((resolve, reject) => {
        // Spawn git child process
        const gitParams = ["cat-file", "--batch-check", "--batch-all-objects"];
        const gitProcess = spawn("git", gitParams, { cwd: workspaceFolder.fsPath });
        const streamByLine = byline(gitProcess.stdout);

        // Parse data
        const parsedObjects = {
            commits: {},
            trees: {},
            blobs: {},
            initialCommit: "",
        };

        // Object promises
        var objectPromises = [];

        // When reading a line -> Get all info
        streamByLine.on("data", (line) => {
            objectPromises.push(
                new Promise(async (resolve) => {
                    const object = await parseGitObject(line.toString(), workspaceFolder);

                    // If object exists -> Save it
                    if (object) {
                        // Save commits, trees & blobs
                        if (object.type === "commit") parsedObjects.commits[object.hash] = object;
                        else if (object.type === "tree") parsedObjects.trees[object.hash] = object;
                        else if (object.type === "blob") parsedObjects.blobs[object.hash] = object;

                        // Save initial commit
                        if (object.type === "commit" && !("parent" in object)) parsedObjects.initialCommit = object.hash;
                    }

                    resolve();
                })
            );
        });

        // On line error
        streamByLine.on("error", (error) => {
            reject(error);
        });

        // On no more lines to read
        streamByLine.on("end", async () => {
            await Promise.all(objectPromises);
            resolve(parsedObjects);
        });
    });
}

// Parse git object
function parseGitObject(line, workspaceFolder) {
    return new Promise(async (resolve) => {
        // Get the three parts
        const objectParts = line.split(" ");
        if (objectParts.length !== 3) resolve(null);
        const hash = objectParts[0];
        const type = objectParts[1];
        const size = objectParts[2];

        // Spawn git child process
        const gitParams = ["cat-file", "-p", hash];
        const gitProcess = spawn("git", gitParams, { cwd: workspaceFolder.fsPath });
        const streamByLine = byline(gitProcess.stdout);

        // Parsed info
        const parsedInfo = type === "commit" ? { hash, type, size } : type === "tree" ? { hash, type, size, trees: [], blobs: [] } : { hash, type, size };

        // When reading a line -> Get all info
        streamByLine.on("data", (line) => {
            // Parse commit
            if (type === "commit") {
                // Split the line
                const lineParts = line.toString().split(" ");
                if (!lineParts.length) return;

                // Save te info
                if (lineParts[0] === "tree" && lineParts.length > 1) parsedInfo.tree = lineParts[1];
                else if (lineParts[0] === "parent" && lineParts.length >= 2) parsedInfo.parent = lineParts[1];
                else if (lineParts[0] === "author" && lineParts.length >= 5) {
                    parsedInfo.author = lineParts[1];
                    parsedInfo.authorEmail = lineParts[2].replace("<", "").replace(">", "");
                    parsedInfo.timestamp = lineParts[3];
                    parsedInfo.timezone = lineParts[4];
                } else if (lineParts[0] === "committer" && lineParts.length >= 3) {
                    parsedInfo.committer = lineParts[1];
                    parsedInfo.committerEmail = lineParts[2].replace("<", "").replace(">", "");
                } else parsedInfo.message = line.toString();
            }

            // Parse tree
            else if (type === "tree") {
                // Split the line
                const lineParts = line.toString().replace("\t", " ").split(" ");
                if (lineParts.length < 4) return;

                var newChildren = {};
                newChildren.code = lineParts[0];
                newChildren.hash = lineParts[2];
                newChildren.name = lineParts[3];

                // Save te info
                if (lineParts[1] === "tree") parsedInfo.trees.push(newChildren);
                else if (lineParts[1] === "blob") parsedInfo.blobs.push(newChildren);
            }

            // Parse blob
            else if (type === "blob") parsedInfo.contents = line.toString();
        });

        // On line error
        streamByLine.on("error", (error) => {
            resolve(null);
        });

        // On no more lines to read
        streamByLine.on("end", async () => {
            resolve(parsedInfo);
        });
    });
}

module.exports = {
    parseGitFolder,
};
