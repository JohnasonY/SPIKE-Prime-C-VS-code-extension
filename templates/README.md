# Templates

This folder contains starter project files that the extension copies when a user runs `SPIKE Prime: New Project`.

## Structure

- `basic-c/`: the default SPIKE Prime C project template.
- `basic-c/main.c`: starter C program for the hub.
- `basic-c/Makefile`: build entry point for the generated project.
- `basic-c/spike.json`: project metadata and hub port configuration.
- `basic-c/.vscode/tasks.json`: VS Code task definitions included in each generated project.

## How It Is Used

The `newProject` command in `extension.js` asks the user for a project name, then copies `templates/basic-c` into a new folder inside the currently open workspace.

The copy is recursive, so any files or folders added under `basic-c` become part of newly generated projects automatically.

## Editing Templates

Update files in `basic-c` when you want to change the default project created for users. Keep these files self-contained because they are copied into a different workspace and should not depend on paths inside this extension repository.

If you add another template later, update `extension.js` so the new project command can choose or reference it.
