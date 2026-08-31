# Build this project with the real SPIKE-RT build system.

SPIKE_RT_ROOT ?= /Users/jax/spike-rt
APP_NAME ?= main
DOCKER_IMAGE ?= ghcr.io/spike-rt/spike-rt:rich
DOCKER_PLATFORM ?= linux/amd64
DOCKER_PROJECT_DIR ?= /work/spike-project

BUILD_ROOT := .spike-rt/build
APP_SRC_DIR := .spike-rt/app
KERNEL_BUILD_DIR := $(BUILD_ROOT)/obj-primehub_kernel
APP_BUILD_DIR := $(BUILD_ROOT)/obj-primehub_$(APP_NAME)
OUTPUT := $(APP_BUILD_DIR)/asp.bin
PYTHON3 ?= $(SPIKE_RT_ROOT)/tools/python/bin/python3

DOCKER_RUN = docker run --rm --platform $(DOCKER_PLATFORM) \
	-v "$(SPIKE_RT_ROOT):$(SPIKE_RT_ROOT)" \
	-v "$(CURDIR):$(DOCKER_PROJECT_DIR)" \
	-w "$(DOCKER_PROJECT_DIR)" \
	$(DOCKER_IMAGE)

.PHONY: all build configure clean upload deploy-dfu

all: build

build:
ifeq ($(IN_DOCKER),1)
	$(MAKE) $(OUTPUT)
else
	$(DOCKER_RUN) make IN_DOCKER=1 build
endif

$(OUTPUT): main.c $(APP_BUILD_DIR)/Makefile $(KERNEL_BUILD_DIR)/Makefile
	$(MAKE) -C "$(KERNEL_BUILD_DIR)" libkernel.a
	rm -f "$(APP_BUILD_DIR)/asp" "$(APP_BUILD_DIR)/asp.bin"
	$(MAKE) -C "$(APP_BUILD_DIR)"

configure: $(APP_BUILD_DIR)/Makefile $(KERNEL_BUILD_DIR)/Makefile

$(KERNEL_BUILD_DIR)/Makefile:
	@test -d "$(SPIKE_RT_ROOT)" || (echo "SPIKE_RT_ROOT not found: $(SPIKE_RT_ROOT)" && exit 1)
	mkdir -p "$(KERNEL_BUILD_DIR)"
	cd "$(KERNEL_BUILD_DIR)" && "$(SPIKE_RT_ROOT)/asp3/configure.rb" -T primehub_gcc -f -m "$(SPIKE_RT_ROOT)/common/kernel.mk"

$(APP_BUILD_DIR)/Makefile: main.c
	@test -d "$(SPIKE_RT_ROOT)" || (echo "SPIKE_RT_ROOT not found: $(SPIKE_RT_ROOT)" && exit 1)
	rm -rf "$(APP_SRC_DIR)"
	mkdir -p "$(APP_SRC_DIR)" "$(APP_BUILD_DIR)"
	cp main.c "$(APP_SRC_DIR)/$(APP_NAME).c"
	printf '%s\n' \
		'#ifndef SPIKE_APP_H' \
		'#define SPIKE_APP_H' \
		'#include <kernel.h>' \
		'#define MAIN_PRIORITY 5' \
		'#define STACK_SIZE 4096' \
		'#ifndef TOPPERS_MACRO_ONLY' \
		'extern void main_task(intptr_t exinf);' \
		'#endif' \
		'#endif' > "$(APP_SRC_DIR)/$(APP_NAME).h"
	printf '%s\n' \
		'INCLUDE("tecsgen.cfg");' \
		'#include "$(APP_NAME).h"' \
		'CRE_TSK(MAIN_TASK, { TA_ACT, 0, main_task, MAIN_PRIORITY, STACK_SIZE, NULL });' > "$(APP_SRC_DIR)/$(APP_NAME).cfg"
	cp "$(SPIKE_RT_ROOT)/sample/led/led.cdl" "$(APP_SRC_DIR)/$(APP_NAME).cdl"
	cd "$(APP_BUILD_DIR)" && "$(SPIKE_RT_ROOT)/asp3/configure.rb" -T primehub_gcc -L "../obj-primehub_kernel" -a "$(CURDIR)/$(APP_SRC_DIR)" -A "$(APP_NAME)" -m "$(SPIKE_RT_ROOT)/common/app.mk"

upload deploy-dfu: build
	PYTHON3="$(PYTHON3)" sudo "$(SPIKE_RT_ROOT)/scripts/deploy-dfu.sh" "$(OUTPUT)"

clean:
	rm -rf "$(CURDIR)/.spike-rt"
