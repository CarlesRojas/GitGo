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

        switch (message.type) {
            case "getGitUserAndEmail":
                this.getGitUserAndEmail(message);
                break;

            case "setGitUserAndEmail":
                this.setGitUserAndEmail(message);
                break;

            default:
                break;
        }
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

        await spawnGit(["config", "--global", "user.name", user]);
        await spawnGit(["config", "--global", "user.email", email]);
    }
}

module.exports = WebviewInterface;
