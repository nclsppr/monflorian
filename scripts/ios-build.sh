#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/ios-generate.py --check
export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
mkdir -p build/ios
xcodebuild -project ios/MonFlorian.xcodeproj -scheme MonFlorian -configuration Debug -destination 'generic/platform=iOS Simulator' -derivedDataPath build/ios/DerivedData CODE_SIGNING_ALLOWED=NO build 2>&1 | tee build/ios/build.log
