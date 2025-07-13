# Variables
BUILD_DIR=ts-project/dist
SOURCE_FILE=$(BUILD_DIR)/main.js
TARGET_DIR=ktile/contents/code/

# Default target
all: build move install

# Build target
build:
	pushd ts-project && \
	yarn build && \
	popd

build-effect:
	pushd kwin4_effect_geometry_change && \
	make install && \
	popd

# Move target
move:
	cp ts-project/dist/main.js ktile/contents/code/main.js

install:
	kpackagetool6 --type=KWin/Script -i ktile/ || \
	kpackagetool6 --type=KWin/Script -u ktile/
