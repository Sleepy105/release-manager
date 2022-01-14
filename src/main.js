var inquirer = require("inquirer");
const { Octokit } = require("@octokit/rest");
var parseArgs = require("minimist");
const fs = require("fs");

let argv = parseArgs(
    process.argv.slice(2),
    (opts = {
        string: ["owner", "repo", "help"],
        alias: {
            owner: ["o"],
            repo: ["r", "repository"],
            help: ["h"],
        },
    })
);

if (
    argv.help !== undefined ||
    typeof argv.owner !== "string" ||
    typeof argv.repo !== "string"
) {
    console.log("Usage:   release-manager --owner {owner} --repo {repo_name}");
    console.log("\nExample for 'https://github.com/Sleepy105/release-manager'");
    console.log("$ release-manager --o Sleepy105 --r release-manager");
    return;
}

function removeInstalledVersions(list) {
    list.forEach((versionName) => {
        fs.rm(versionName, { recursive: true, force: true }, (err) => {
            if (err) {
                console.log(err);
            }
        });
    });
}

function installNewVersions(list) {
    list.forEach((versionName) => {
        // Create folder
        fs.mkdirSync(versionName);
        // TODO: Download Assets
    });
}

async function main() {
    const selectVersions = {
        type: "checkbox",
        loop: false,
        message: "Select releases",
        name: "versions",
        choices: [],
    };

    const confirm = {
        type: "confirm",
        name: "confirm",
        message: "Do you confirm the following changes?",
        default: false,
    };

    let currentReleases = [];

    const octokit = new Octokit();
    const { data: releaseData } = await octokit.rest.repos.listReleases({
        owner: argv.owner,
        repo: argv.repo,
    });
    releaseData.forEach((release) => {
        let releaseName = release.name || release.tag_name;
        let exists = fs.existsSync(releaseName);
        if (exists) {
            currentReleases.push(releaseName);
        }

        selectVersions.choices.push({
            name: releaseName,
            checked: exists,
        });
    });

    const { versions: selectedReleases } = await inquirer.prompt(
        selectVersions
    );

    const currentReleasesSet = new Set(currentReleases);
    const selectedReleasesSet = new Set(selectedReleases);

    const toInstall = selectedReleases.filter(
        (v) => !currentReleasesSet.has(v)
    );
    const toRemove = currentReleases.filter((v) => !selectedReleasesSet.has(v));

    removeInstalledVersions(toRemove);
    installNewVersions(toInstall);
}

main();
