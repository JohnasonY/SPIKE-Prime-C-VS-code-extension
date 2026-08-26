"use strict";

const fs = require("fs/promises");
const path = require("path");
const { spawn } = require("child_process");
const vscode = require("vscode");

let output;
let hubStatusItem;
let buildItem;
let runItem;

function activate(context) {
  output = vscode.window.createOutputChannel("SPIKE Prime C");

  hubStatusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  hubStatusItem.text = "$(circle-slash) SPIKE: No Hub";
  hubStatusItem.tooltip = "Select a SPIKE Prime Hub";
  hubStatusItem.command = "spikePrimeC.selectHub";
  hubStatusItem.show();

  buildItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
  buildItem.text = "$(tools) Build";
  buildItem.tooltip = "Build the current SPIKE Prime C project";
  buildItem.command = "spikePrimeC.build";
  buildItem.show();

  runItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 98);
  runItem.text = "$(play) Run";
  runItem.tooltip = "Build and run the current SPIKE Prime C project";
  runItem.command = "spikePrimeC.buildAndRun";
  runItem.show();

  context.subscriptions.push(
    output,
    hubStatusItem,
    buildItem,
    runItem,
    vscode.commands.registerCommand("spikePrimeC.newProject", newProject),
    vscode.commands.registerCommand("spikePrimeC.build", build),
    vscode.commands.registerCommand("spikePrimeC.upload", upload),
    vscode.commands.registerCommand("spikePrimeC.buildAndRun", buildAndRun),
    vscode.commands.registerCommand("spikePrimeC.selectHub", selectHub),
    vscode.commands.registerCommand("spikePrimeC.configureSpikeRt", configureSpikeRt),
    vscode.commands.registerCommand("spikePrimeC.openSpikeRtBuild", openSpikeRtBuild),
    vscode.window.registerTreeDataProvider("spikePrimeC.hub", new StaticTreeProvider(getHubItems)),
    vscode.window.registerTreeDataProvider("spikePrimeC.examples", new StaticTreeProvider(getExampleItems))
  );
}

function deactivate() {}

async function newProject() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage("Open an empty folder first, then run SPIKE Prime: New Project.");
    return;
  }

  const root = folders[0].uri.fsPath;
  const projectName = await vscode.window.showInputBox({
    title: "New SPIKE Prime C Project",
    prompt: "Project folder name",
    value: "spike-prime-project",
    validateInput(value) {
      if (!value.trim()) {
        return "Enter a project name.";
      }
      if (/[\\/:*?\"<>|]/.test(value)) {
        return "Avoid characters that cannot be used in folder names.";
      }
      return undefined;
    }
  });

  if (!projectName) {
    return;
  }

  const target = path.join(root, projectName);
  try {
    await copyTemplate(contextPath("templates", "basic-c"), target);
    await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(target), false);
    vscode.window.showInformationMessage(`Created SPIKE Prime C project: ${projectName}`);
  } catch (error) {
    showError("Could not create the SPIKE project.", error);
  }
}

async function build() {
  const cwd = getWorkspaceRoot();
  if (!cwd) {
    return false;
  }

  const makeCommand = getConfig("makeCommand");
  return runCommand(makeCommand, cwd, "Build complete.", "Build failed.");
}

async function upload() {
  const cwd = getWorkspaceRoot();
  if (!cwd) {
    return false;
  }

  const uploadCommand = getConfig("uploadCommand");
  const command = expandCommand(uploadCommand, cwd);

  if (getConfig("showDfuInstructions")) {
    const choice = await vscode.window.showWarningMessage(
      "Put the SPIKE Prime Hub in DFU mode: turn it off, hold the Bluetooth button, plug in USB, and keep holding until the light flashes.",
      { modal: true },
      "Upload Now"
    );

    if (choice !== "Upload Now") {
      return false;
    }
  }

  if (getConfig("uploadRunsInTerminal")) {
    runCommandInTerminal(command, cwd);
    return true;
  }

  return runCommand(command, cwd, "Upload complete.", "Upload failed.");
}

async function buildAndRun() {
  const built = await build();
  if (!built) {
    return;
  }

  await upload();
}

async function selectHub() {
  const selected = await vscode.window.showQuickPick(
    [
      {
        label: "USB Hub",
        description: "Use the connected SPIKE Prime Hub over USB"
      },
      {
        label: "Manual",
        description: "Keep using the configured upload command"
      }
    ],
    {
      title: "Select SPIKE Prime Hub"
    }
  );

  if (!selected) {
    return;
  }

  hubStatusItem.text = selected.label === "USB Hub" ? "$(pass-filled) SPIKE: USB Hub" : "$(debug-disconnect) SPIKE: Manual";
  vscode.window.showInformationMessage(`Selected ${selected.label}.`);
}

async function configureSpikeRt() {
  const selected = await vscode.window.showQuickPick(
    [
      {
        label: "macOS + Docker SPIKE-RT",
        description: "Build in Docker and upload from the SPIKE-RT build directory with deploy-dfu.sh"
      },
      {
        label: "Simple local make",
        description: "Use make for build and spike-upload for upload"
      }
    ],
    {
      title: "Configure SPIKE-RT Tools"
    }
  );

  if (!selected) {
    return;
  }

  const config = vscode.workspace.getConfiguration("spikePrimeC");

  if (selected.label === "macOS + Docker SPIKE-RT") {
    const spikeRtRoot = getConfig("spikeRtRoot");
    await config.update("makeCommand", `docker run --rm --platform linux/amd64 -v ${shellQuote(`${spikeRtRoot}:${spikeRtRoot}`)} -w "$(pwd)" ghcr.io/spike-rt/spike-rt:rich make`, vscode.ConfigurationTarget.Workspace);
    await config.update("uploadCommand", "PYTHON3=../../tools/python/bin/python3 sudo ../../scripts/deploy-dfu.sh asp.bin", vscode.ConfigurationTarget.Workspace);
    await config.update("outputFile", "asp.bin", vscode.ConfigurationTarget.Workspace);
    await config.update("uploadRunsInTerminal", true, vscode.ConfigurationTarget.Workspace);
    await config.update("showDfuInstructions", true, vscode.ConfigurationTarget.Workspace);
  } else {
    await config.update("makeCommand", "make", vscode.ConfigurationTarget.Workspace);
    await config.update("uploadCommand", "spike-upload ${outputFile}", vscode.ConfigurationTarget.Workspace);
    await config.update("outputFile", "build/output.bin", vscode.ConfigurationTarget.Workspace);
    await config.update("uploadRunsInTerminal", true, vscode.ConfigurationTarget.Workspace);
    await config.update("showDfuInstructions", false, vscode.ConfigurationTarget.Workspace);
  }

  vscode.window.showInformationMessage(`Configured ${selected.label}.`);
}

async function openSpikeRtBuild() {
  const spikeRtRoot = getConfig("spikeRtRoot");
  const buildRoot = path.join(spikeRtRoot, "build");

  let entries;
  try {
    entries = await fs.readdir(buildRoot, { withFileTypes: true });
  } catch (error) {
    showError(`Could not read SPIKE-RT build folder at ${buildRoot}.`, error);
    return;
  }

  const builds = entries
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("obj-primehub_") && entry.name !== "obj-primehub_kernel")
    .map((entry) => ({
      label: entry.name.replace("obj-primehub_", ""),
      description: path.join(buildRoot, entry.name),
      path: path.join(buildRoot, entry.name)
    }));

  if (builds.length === 0) {
    vscode.window.showWarningMessage(`No SPIKE-RT application build folders found in ${buildRoot}.`);
    return;
  }

  const selected = await vscode.window.showQuickPick(builds, {
    title: "Open SPIKE-RT Build Folder"
  });

  if (!selected) {
    return;
  }

  await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(selected.path), false);
}

function runCommand(command, cwd, successMessage, failureMessage) {
  return new Promise((resolve) => {
    const expandedCommand = expandCommand(command, cwd);
    output.clear();
    output.show(true);
    output.appendLine(`$ ${expandedCommand}`);
    output.appendLine("");

    const child = spawn(expandedCommand, {
      cwd,
      shell: true
    });

    let combined = "";

    child.stdout.on("data", (data) => {
      const text = data.toString();
      combined += text;
      output.append(text);
    });

    child.stderr.on("data", (data) => {
      const text = data.toString();
      combined += text;
      output.append(text);
    });

    child.on("error", (error) => {
      showError(failureMessage, error);
      resolve(false);
    });

    child.on("close", (code) => {
      output.appendLine("");
      if (code === 0) {
        vscode.window.showInformationMessage(successMessage);
        resolve(true);
        return;
      }

      output.appendLine("Helpful hints:");
      for (const hint of friendlyHints(combined)) {
        output.appendLine(`- ${hint}`);
      }

      vscode.window.showErrorMessage(`${failureMessage} Open the SPIKE Prime C output for details.`);
      resolve(false);
    });
  });
}

function runCommandInTerminal(command, cwd) {
  const terminal = vscode.window.createTerminal({
    name: "SPIKE Prime Upload",
    cwd
  });

  terminal.show();
  terminal.sendText(command);
}

function expandCommand(command, workspaceFolder) {
  const outputFile = getConfig("outputFile");
  return String(command)
    .replaceAll("${workspaceFolder}", shellQuote(workspaceFolder))
    .replaceAll("${outputFile}", shellQuote(outputFile));
}

function shellQuote(value) {
  const text = String(value);
  if (/^[A-Za-z0-9_./:-]+$/.test(text)) {
    return text;
  }

  return `'${text.replaceAll("'", "'\\''")}'`;
}

function friendlyHints(text) {
  const hints = [];
  const lower = text.toLowerCase();

  if (lower.includes("command not found") || lower.includes("not recognized")) {
    hints.push("The build or upload tool was not found. Check the SPIKE Prime C settings for the command path.");
  }
  if (lower.includes("no rule to make target") || lower.includes("no makefile")) {
    hints.push("This folder does not look like a SPIKE-RT project. Try SPIKE Prime: New Project first.");
  }
  if (lower.includes("undefined reference")) {
    hints.push("A function name may be misspelled, or a needed SPIKE library may not be linked.");
  }
  if (lower.includes("spike.h")) {
    hints.push("The SPIKE-RT headers were not found. Check that SPIKE-RT is installed and your Makefile points to it.");
  }
  if (lower.includes("permission denied")) {
    hints.push("The tool could not access a file or USB device. Check file permissions and reconnect the hub.");
  }

  return hints.length > 0 ? hints : ["Read the first compiler error above; later errors often come from the first one."];
}

function getWorkspaceRoot() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage("Open a SPIKE Prime project folder first.");
    return undefined;
  }

  return folders[0].uri.fsPath;
}

function getConfig(key) {
  return vscode.workspace.getConfiguration("spikePrimeC").get(key);
}

function contextPath(...parts) {
  return path.join(__dirname, ...parts);
}

async function copyTemplate(source, target) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      await copyTemplate(sourcePath, targetPath);
    } else {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

function showError(message, error) {
  const detail = error && error.message ? error.message : String(error);
  output.show(true);
  output.appendLine(`${message} ${detail}`);
  vscode.window.showErrorMessage(`${message} ${detail}`);
}

function getHubItems() {
  return [
    new TreeItem("Status: Not connected", "Select Hub to choose USB/manual upload mode.", vscode.TreeItemCollapsibleState.None),
    new TreeItem("Ports", "Configure motor and sensor ports in spike.json.", vscode.TreeItemCollapsibleState.Collapsed, [
      new TreeItem("A: Large Motor"),
      new TreeItem("B: Large Motor"),
      new TreeItem("C: Color Sensor"),
      new TreeItem("D: Distance Sensor")
    ])
  ];
}

function getExampleItems() {
  return [
    new TreeItem("Motor"),
    new TreeItem("LED Matrix"),
    new TreeItem("Distance Sensor"),
    new TreeItem("Line Follower")
  ];
}

class StaticTreeProvider {
  constructor(getItems) {
    this.getItems = getItems;
  }

  getTreeItem(element) {
    return element;
  }

  getChildren(element) {
    if (element) {
      return element.children || [];
    }

    return this.getItems();
  }
}

class TreeItem extends vscode.TreeItem {
  constructor(label, tooltip, collapsibleState = vscode.TreeItemCollapsibleState.None, children = []) {
    super(label, collapsibleState);
    this.tooltip = tooltip;
    this.children = children;
  }
}

module.exports = {
  activate,
  deactivate
};
