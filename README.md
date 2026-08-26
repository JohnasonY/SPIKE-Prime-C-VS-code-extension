# SPIKE Prime C for VS Code

Beginner-friendly VS Code commands for creating, building, uploading, and running SPIKE Prime C projects.

## Commands

- `SPIKE Prime: New Project`
- `SPIKE Prime: Build`
- `SPIKE Prime: Upload`
- `SPIKE Prime: Build and Run`
- `SPIKE Prime: Select Hub`

## First milestone

This first scaffold creates a JavaScript VS Code extension and a starter C project template. The template currently includes a placeholder `Makefile` so the extension workflow can be tested before wiring it to a real SPIKE-RT installation.

## Local development

1. Open this folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. In the new VS Code window, run `SPIKE Prime: New Project`.
4. Open the generated project folder.
5. Run `SPIKE Prime: Build`.

## Settings

- `spikePrimeC.makeCommand`: build command, default `make`
- `spikePrimeC.uploadCommand`: upload command, default `spike-upload`
- `spikePrimeC.outputFile`: firmware file passed to uploader, default `build/output.bin`
