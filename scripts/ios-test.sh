#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/ios-generate.py --check
export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
mkdir -p build/ios
if [[ -n "${MONFLORIAN_IOS_SIMULATOR_ID:-}" ]]; then
    simulator_id="$MONFLORIAN_IOS_SIMULATOR_ID"
else
    simulator_id="$(xcrun simctl list devices available --json | python3 -c 'import json,sys; data=json.load(sys.stdin); phones=[d for r,ds in data["devices"].items() if "iOS" in r for d in ds if "iPhone" in d["name"] and d["isAvailable"]]; print(next((d["udid"] for d in phones if d["state"]=="Booted"), phones[0]["udid"] if phones else ""))')"
fi
if [[ -z "$simulator_id" ]]; then
    echo 'Aucun simulateur iPhone disponible. Installe un runtime iOS dans Xcode.' >&2
    exit 1
fi
result_path="build/ios/Tests-$(date -u +%Y%m%dT%H%M%SZ).xcresult"
test_arguments=(-project ios/MonFlorian.xcodeproj -scheme MonFlorian -configuration Debug -destination "platform=iOS Simulator,id=$simulator_id" -destination-timeout 60 -parallel-testing-enabled NO -derivedDataPath build/ios/DerivedData -resultBundlePath "$result_path" CODE_SIGNING_ALLOWED=NO)
if [[ "${MONFLORIAN_IOS_TEST_SCOPE:-all}" == "unit" ]]; then test_arguments+=('-only-testing:MonFlorianTests'); fi
xcodebuild "${test_arguments[@]}" test 2>&1 | tee build/ios/test.log
