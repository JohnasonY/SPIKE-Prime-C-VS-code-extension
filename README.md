# SPIKE Prime C for VS Code

Beginner-friendly VS Code commands for creating, building, uploading, and running SPIKE Prime C projects.

## Commands

- `SPIKE Prime: New Project`
- `SPIKE Prime: Build`
- `SPIKE Prime: Upload`
- `SPIKE Prime: Build and Run`
- `SPIKE Prime: Select Hub`
- `SPIKE Prime: Configure SPIKE-RT Tools`
- `SPIKE Prime: Open SPIKE-RT Build Folder`

## First milestone

This scaffold creates a JavaScript VS Code extension and a starter C project template. The template includes a placeholder `Makefile` so the extension workflow can be tested before wiring it to a real SPIKE-RT installation.

## Local development

1. Open this folder in VS Code.
2. Press `F5` to launch an Extension Development Host.
3. In the new VS Code window, run `SPIKE Prime: New Project`.
4. Open the generated project folder.
5. Run `SPIKE Prime: Build`.

## Real SPIKE-RT setup

SPIKE-RT's documented Mac workflow builds inside Docker and flashes the hub from the host machine with PyUSB/libusb.

Before real upload on macOS:

1. Install Docker Desktop.
2. Install the SPIKE-RT source tree and submodules.
3. Pull the SPIKE-RT Docker image:

   ```bash
   docker pull ghcr.io/spike-rt/spike-rt:rich
   ```

4. Install libusb:

   ```bash
   brew install libusb
   ```

5. In the SPIKE-RT repo, create the Python environment expected by SPIKE-RT:

   ```bash
   python3 -m venv ./tools/python
   ./tools/python/bin/pip install pyusb
   ```

6. Open the actual SPIKE-RT application build directory in VS Code, for example `build/obj-primehub_<appname>`.
7. Run `SPIKE Prime: Configure SPIKE-RT Tools`.
8. Choose `macOS + Docker SPIKE-RT`.

For upload, put the hub in DFU mode first: turn the hub off, hold the Bluetooth button, plug in USB, and keep holding until the light flashes.

On this machine, the detected SPIKE-RT checkout is:

```text
/Users/jax/spike-rt
```

Known build folders include:

```text
/Users/jax/spike-rt/build/obj-primehub_motor
/Users/jax/spike-rt/build/obj-primehub_led
/Users/jax/spike-rt/build/obj-primehub_button
/Users/jax/spike-rt/build/obj-primehub_pybricks
```

To test a real upload path, run `SPIKE Prime: Open SPIKE-RT Build Folder`, choose `motor`, run `SPIKE Prime: Configure SPIKE-RT Tools`, choose `macOS + Docker SPIKE-RT`, put the hub in DFU mode, then run `SPIKE Prime: Upload`.

For Docker builds, the extension mounts the full SPIKE-RT checkout into the container. This is required because generated build folders reference files such as `/Users/jax/spike-rt/asp3/kernel/Makefile.kernel`.

## Settings

- `spikePrimeC.makeCommand`: build command, default `make`
- `spikePrimeC.uploadCommand`: upload command, default `spike-upload ${outputFile}`
- `spikePrimeC.outputFile`: firmware file used by upload commands, default `build/output.bin`
- `spikePrimeC.uploadRunsInTerminal`: run upload in a terminal, default `true`
- `spikePrimeC.showDfuInstructions`: show DFU reminder before upload, default `true`
- `spikePrimeC.spikeRtRoot`: local SPIKE-RT checkout, default `/Users/jax/spike-rt`

## References

- SPIKE-RT repository: https://github.com/spike-rt/spike-rt
- SPIKE-RT environment notes: https://github.com/spike-rt/spike-rt/blob/main/docs/ja/Env.md
- SPIKE-RT application development notes: https://github.com/spike-rt/spike-rt/blob/main/docs/ja/DevelopApp.md
