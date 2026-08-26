# Starter Makefile for a SPIKE-RT project.
# Update SPIKE_RT_ROOT to point at your local SPIKE-RT checkout.

SPIKE_RT_ROOT ?= ../spike-rt
APP_NAME := spike_app
BUILD_DIR := build
OUTPUT := $(BUILD_DIR)/output.bin

.PHONY: all clean upload deploy-dfu

all: $(OUTPUT)

$(OUTPUT): main.c
	@mkdir -p $(BUILD_DIR)
	@echo "Building $(APP_NAME) with SPIKE-RT..."
	@echo "TODO: Replace this placeholder with your SPIKE-RT build command."
	@echo "Placeholder firmware output for $(APP_NAME)" > $(OUTPUT)

upload: $(OUTPUT)
	spike-upload $(OUTPUT)

deploy-dfu:
	@echo "This starter project is not a real SPIKE-RT build directory yet."
	@echo "For real DFU upload, open build/obj-primehub_<appname> inside a SPIKE-RT checkout."

clean:
	rm -rf $(BUILD_DIR)
