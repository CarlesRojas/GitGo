const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const byline = require("byline");
const { spawn } = require("child_process");

class GitParser {
    constructor() {
        this.objectPromises = [];

        // Git folder
        this.workspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length ? vscode.workspace.workspaceFolders[0].uri : undefined;
        this.gitRepoExists = this.workspaceFolder && fs.existsSync(path.resolve(this.workspaceFolder.fsPath, ".git"));

        // Git Objects
        this.gitCommits = {};
        this.gitTrees = {};
        this.gitBlobs = {};

        // Event Subscribers
        this.commitSubscribers = [];
        this.treeSubscribers = [];
        this.blobSubscribers = [];
        this.branchSubscribers = [];

        // Get all hashes
        this.getAllHashes();
    }

    async parserReady() {
        await Promise.all(this.objectPromises);
        return;
    }

    //  ###########################################################
    //      GETTERS
    //  ###########################################################

    get workingDirectoryExists() {
        return this.workspaceFolder;
    }

    get gitProjectExists() {
        return this.gitRepoExists;
    }

    getAllHashes() {
        // Spawn git child process
        const gitParams = ["cat-file", "--batch-check", "--batch-all-objects", "--unordered"];
        const gitProcess = spawn("git", gitParams, { cwd: this.workspaceFolder.fsPath });
        const streamByLine = byline(gitProcess.stdout);

        // When reading a line -> Get all info
        streamByLine.on("data", (line) => {
            this.objectPromises.push(
                new Promise(async (resolve) => {
                    // Get the three parts
                    const objectParts = line.toString().replace("\t", " ").split(" ");
                    if (objectParts.length !== 3) return;
                    const hash = objectParts[0];
                    const type = objectParts[1];
                    const size = objectParts[2];

                    // Save
                    if (type === "commit") this.gitCommits[hash] = { type, size };
                    else if (type === "tree") this.gitTrees[hash] = { type, size };
                    else if (type === "blob") this.gitBlobs[hash] = { type, size };
                })
            );
        });

        // On line error
        streamByLine.on("error", (error) => {
            console.log(error);
        });

        // On no more lines to read
        streamByLine.on("end", async () => {});
    }

    async getAllCommits() {
        await this.parserReady();
        return this.gitCommits;
    }

    async getAllTrees() {
        await this.parserReady();
        return this.gitTrees;
    }

    async getAllBlobs() {
        await this.parserReady();
        return this.gitBlobs;
    }

    getStagedFiles() {}

    getObjectInfo(hash) {}

    //  ###########################################################
    //      EVENTS
    //  ###########################################################

    //      SUBSCRIBE
    //  ###########################################################

    subscribeToCommitChanges(func) {
        if (!this.commitSubscribers.length) this.#startCommitWatcher();
        this.commitSubscribers.push(func);
    }

    subscribeToTreeChanges(func) {
        if (!this.treeSubscribers.length) this.#startTreeWatcher();
        this.treeSubscribers.push(func);
    }

    subscribeToBlobChanges(func) {
        if (!this.blobSubscribers.length) this.#startBlobWatcher();
        this.blobSubscribers.push(func);
    }

    subscribeToBranchChanges(func) {
        if (!this.branchSubscribers.length) this.#startBranchWatcher();
        this.branchSubscribers.push(func);
    }

    //      UNSUBSCRIBE
    //  ###########################################################

    unsubscribeToCommitChanges(func) {
        for (var i = 0; i < this.commitSubscribers.length; i++) {
            if (this.commitSubscribers[i] === func) {
                this.commitSubscribers.splice(i, 1);
                break;
            }
        }

        if (!this.commitSubscribers.length) this.#stopCommitWatcher();
    }

    unsubscribeToTreeChanges(func) {
        for (var i = 0; i < this.treeSubscribers.length; i++) {
            if (this.treeSubscribers[i] === func) {
                this.treeSubscribers.splice(i, 1);
                break;
            }
        }

        if (!this.treeSubscribers.length) this.#stopTreeWatcher();
    }

    unsubscribeToBlobChanges(func) {
        for (var i = 0; i < this.blobSubscribers.length; i++) {
            if (this.blobSubscribers[i] === func) {
                this.blobSubscribers.splice(i, 1);
                break;
            }
        }

        if (!this.blobSubscribers.length) this.#stopBlobWatcher();
    }

    unsubscribeToBranchChanges(func) {
        for (var i = 0; i < this.branchSubscribers.length; i++) {
            if (this.branchSubscribers[i] === func) {
                this.branchSubscribers.splice(i, 1);
                break;
            }
        }

        if (!this.branchSubscribers.length) this.#stopBranchWatcher();
    }

    //      START WATCHERS
    //  ###########################################################

    #startCommitWatcher() {}
    #startTreeWatcher() {}
    #startBlobWatcher() {}
    #startBranchWatcher() {}

    //      STOP WATCHERS
    //  ###########################################################

    #stopCommitWatcher() {}
    #stopTreeWatcher() {}
    #stopBlobWatcher() {}
    #stopBranchWatcher() {}

    //      ON CHANGE EVENTS
    //  ###########################################################

    #onCommitChange() {}
    #onTreeChange() {}
    #onBlobChange() {}
    #onBranchChange() {}

    // export default class EventsPubSub {
    //     events = {};

    //     sub(eventName, func) {
    //         this.events[eventName] = this.events[eventName] || [];
    //         this.events[eventName].push(func);
    //     }

    //     unsub(eventName, func) {
    //         if (this.events[eventName])
    //             for (var i = 0; i < this.events[eventName].length; i++)
    //                 if (this.events[eventName][i] === func) {
    //                     this.events[eventName].splice(i, 1);
    //                     break;
    //                 }
    //     }

    //     emit(eventName, data) {
    //         if (this.events[eventName])
    //             this.events[eventName].forEach(function (func) {
    //                 func(data);
    //             });
    //     }
    // }
}

module.exports = GitParser;
