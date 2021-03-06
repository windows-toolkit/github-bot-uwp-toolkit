# GitHub Bot for UWP Toolkit

Bot written in node.js and hosting on Azure Functions to manage issues and Pull Requests of UWP Community Toolkit repository

## List of functions

### noResponseFromCommunityOnIssues

This function detects issues without response.
It automatically send a message to a member of the team.

### inactiveIssues

This function detects inactive issues (a discussion has already started but no one started to work or closed the issue).

The first time (X days after the last message), an alert/message is sent.
The second time, another alert/message is sent.
And the third time, the issue is closed

### inactivePRs

This function detects inactive Pull Requests.

Send an alert every two weeks to the creator of the PR.

### unclosedIssuesInMergedPr

This function listens a GitHub webhook event when a PR is merged.
Then, using the `pull_request` it will detect the linked issues that are not closed and send a message with the id/number of issues left open.

### pendingUservoiceCreation

This function detects issues with `pending-uservoice-creation` label.

### autoLabelPRinProgress

This function listens a GitHub webhook event when a PR is created, closed, reopened or merged.
Then, it will detect the linked issues to this PR and update the `labels` of each of these issues by adding/removing the `PR in progress` label.

## How to use?

1. First, build the project using `tsc` command line.
    * Note: if you do not have `tsc` installed, execute `npm install -g typescript`
2. Fill the required environment variables to launch the bot (see next section)
3. Open the folder related to the function you want to execute
4. Execute `node index` command line to start the bot function

## Environment variables

These environment variables should be set to launch the bot.

| Variable | Description | Default value |
|-|-|-|
| GITHUB_BOT_LOGIN               | Login of the GitHub account of the bot | windowstoolkitbot |
| GITHUB_BOT_ACCESS_TOKEN           | Personal Access Token used to retrieve data from the GitHub API |  |
| GITHUB_BOT_TARGET_REPO_OWNER             | Target Repository owner | windows-toolkit |
| GITHUB_BOT_TARGET_REPO_NAME              | Target Repository name | WindowsCommunityToolkit |
| GITHUB_BOT_ACTIVATE_MUTATION      | Activate GitHub mutation calls | false |
| NUMBER_OF_DAYS_WITHOUT_ACTIVITY               | Number of days without activity to check on `inactiveIssues` function | 7 |
| NUMBER_OF_DAYS_WITHOUT_RESPONSE               | Number of days without response to check on `noResponseFromCommunityOnIssues` function | 7 |