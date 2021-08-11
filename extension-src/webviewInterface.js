const vscode = require("vscode");
const gitLog = require("git-log-parser");
const toArray = require("stream-to-array");
const spawnGit = require("./spawnGit");

class WebviewInterface {
    constructor(_currentPanel) {
        this.currentPanel = _currentPanel;
    }

    //  ###########################################################
    //      SEND & RECIEVE
    //  ###########################################################

    // Send message to webview
    sendMessage(message) {
        this.currentPanel.webview.postMessage(message);
    }

    // Recieve messages from the webview
    recieveMessage(message) {
        console.log(message);

        if (!("type" in message)) return;

        if (message.type === "getGitUserAndEmail") this.getGitUserAndEmail(message);
        else if (message.type === "setGitUserAndEmail") this.setGitUserAndEmail(message);
        else if (message.type === "initRepo") this.initRepo(message);
        else if (message.type === "cloneRepo") this.cloneRepo(message);
        else if (message.type === "stage") this.stage(message);
        else if (message.type === "unstage") this.unstage(message);
        else if (message.type === "discard") this.discard(message);
        else if (message.type === "commit") this.commit(message);
        else if (message.type === "branch") this.branch(message);
        else if (message.type === "checkout") this.checkout(message);
        else if (message.type === "merge") this.merge(message);
        else if (message.type === "getRemote") this.getRemote(message);
        else if (message.type === "setRemote") this.setRemote(message);
        else if (message.type === "fetch") this.fetch(message);
        else if (message.type === "push") this.push(message);
        else if (message.type === "pull") this.pull(message);
        else if (message.type === "rebase") this.rebase(message);
        else if (message.type === "reset") this.reset(message);
        else if (message.type === "stash") this.stash(message);
        else if (message.type === "listStash") this.listStash(message);
        else if (message.type === "popStash") this.popStash(message);
        else if (message.type === "dropStash") this.dropStash(message);
        else if (message.type === "getCommits") this.getCommits(message);
        else if (message.type === "getStagedFiles") this.getStagedFiles(message);
        else if (message.type === "getChangedFiles") this.getChangedFiles(message);
    }

    //  ###########################################################
    //      GIT CONFIGURATION
    //  ###########################################################

    // Get the git user name and email
    async getGitUserAndEmail() {
        const userName = await spawnGit(["config", "--global", "user.name"]);
        const email = await spawnGit(["config", "--global", "user.email"]);

        if (!userName.length || !email.length) this.sendMessage({ type: "userNotConfigured" });

        this.sendMessage({ type: "userAndEmail", user: userName[0], email: email[0] });
    }

    // Set the git user name and email
    async setGitUserAndEmail({ user, email }) {
        if (!user || !email) return;

        const nameResponse = await spawnGit(["config", "--global", "user.name", user]);
        const emailResponse = await spawnGit(["config", "--global", "user.email", email]);

        // ROJAS ADD THIS TO ALL CALLS
        if (nameResponse.length || emailResponse.length) this.sendMessage({ type: "error", message: "Error setting the name or email." });
    }

    //  ###########################################################
    //      INIT
    //  ###########################################################

    // Init a repositori in this directory
    async initRepo() {
        await spawnGit(["init"]);
    }

    // Clone a repository
    async cloneRepo({ url }) {
        if (!url) return;

        await spawnGit(["clone", url]);
    }

    //  ###########################################################
    //      STAGE & COMMIT
    //  ###########################################################

    // Stage the files
    async stage({ all, files }) {
        if (!all && !files.length) return;

        if (all) await spawnGit(["add", "-A"]);
        else await spawnGit(["add", ...files]);
    }

    // Unstage the files
    async unstage({ all, files }) {
        if (!all && !files.length) return;

        if (all) await spawnGit(["reset"]);
        else await spawnGit(["reset", ...files]);
    }

    // Discard changes to a file
    async discard({ all, files }) {
        if (!all && !files.length) return;

        if (all) await spawnGit(["checkout", "."]);
        else await spawnGit(["checkout", ...files]);
    }

    // Commit staged files
    async commit({ message }) {
        if (!message) return;

        await spawnGit(["commit", "-m", message]);
    }

    //  ###########################################################
    //      BRANCHES & MERGE
    //  ###########################################################

    // Create new branch
    async branch({ branchName, commitHash }) {
        if (!branchName || !commitHash) return;

        await spawnGit(["branch", branchName, commitHash]);
    }

    // Checkout branch
    async checkout({ branchName }) {
        if (!branchName) return;

        await spawnGit(["checkout", branchName]);
    }

    // Merge branch to current one
    async merge({ commitHash }) {
        if (!commitHash) return;

        await spawnGit(["merge", "--commit", "--ff", commitHash]);
    }

    //  ###########################################################
    //      UPDATE
    //  ###########################################################

    // Get the repo remote
    async getRemote() {
        const remote = await spawnGit(["config", "--get", "remote.origin.url"]);

        if (!remote.length) this.sendMessage({ type: "remoteNotConfigured" });

        this.sendMessage({ type: "remote", remote: remote[0] });
    }

    // Set the repo remote
    async setRemote({ url }) {
        if (!url) return;

        await spawnGit(["remote", "add", "origin", url]);
    }

    // Fetch from the remote
    async fetch() {
        const remote = await spawnGit(["config", "--get", "remote.origin.url"]);
        if (!remote.length) return this.sendMessage({ type: "remoteNotConfigured" });

        await spawnGit(["fetch", remote[0]]);
    }

    // Push branch to the remote
    async push({ branchName }) {
        if (!branchName) return;

        const remote = await spawnGit(["config", "--get", "remote.origin.url"]);
        if (!remote.length) return this.sendMessage({ type: "remoteNotConfigured" });

        await spawnGit(["push", remote[0], branchName]);
    }

    // Pull from the remote
    async pull() {
        const remote = await spawnGit(["config", "--get", "remote.origin.url"]);
        if (!remote.length) return this.sendMessage({ type: "remoteNotConfigured" });

        await spawnGit(["pull"]);
    }

    //  ###########################################################
    //      RESETS
    //  ###########################################################

    // Rebase onto another branch
    async rebsae({ branchName }) {
        if (!branchName) return;

        await spawnGit(["rebase", branchName]);
    }

    // Reset to an older commit
    async reset({ hash }) {
        if (!hash) return;

        await spawnGit(["reset", "--hard", hash]);
    }

    //  ###########################################################
    //      STASH
    //  ###########################################################

    async stash() {
        await spawnGit(["stash"]);
    }

    async listStash() {
        await spawnGit(["stash", "list"]);
    }

    async popStash() {
        await spawnGit(["stash", "pop"]);
    }

    async dropStash() {
        await spawnGit(["stash", "drop"]);
    }

    //  ###########################################################
    //      GET COMMITS
    //  ###########################################################

    // Get commits
    async getCommits({ maxCount, hash, lastFetchTime }) {
        if (!maxCount) maxCount = 50;

        const workspaceFolder = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length ? vscode.workspace.workspaceFolders[0].uri : undefined;

        // Get commits since the last time
        if (lastFetchTime) {
            var gitLogStream = gitLog.parse({ all: true, since: lastFetchTime }, { cwd: workspaceFolder.fsPath });
            var gitLogResult = await toArray(gitLogStream);
            return this.sendMessage({ type: "commits", commits: gitLogResult });
        }

        // Get commits after a certain one
        else if (hash) {
            gitLogStream = gitLog.parse({ "max-count": maxCount, all: true, hash }, { cwd: workspaceFolder.fsPath });
            gitLogResult = await toArray(gitLogStream);
            return this.sendMessage({ type: "commits", commits: gitLogResult });
        }

        // Get first commits
        else {
            gitLogStream = gitLog.parse({ "max-count": maxCount, all: true, hash }, { cwd: workspaceFolder.fsPath });
            gitLogResult = await toArray(gitLogStream);
            return this.sendMessage({ type: "commits", commits: gitLogResult });
        }
    }

    // Get staged files
    async getStagedFiles() {
        const stagedFiles = await spawnGit(["diff", "--name-only", "--staged"]);

        if (stagedFiles.length) this.sendMessage({ type: "stagedFiles", stagedFiles });
    }

    // Get changed files
    async getChangedFiles() {
        const changedFiles = await spawnGit(["diff", "--name-only"]);

        if (changedFiles.length) this.sendMessage({ type: "changedFiles", changedFiles });
    }
}

module.exports = WebviewInterface;
