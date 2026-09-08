#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/ios-generate.py --check
export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"
mkdir -p build/ios
if [[ -n "${MONFLORIAN_IOS_SIMULATOR_ID:-}" ]]; then
    simulator_id="$MONFLORIAN_IOS_SIMULATOR_ID"
else
    simulator_id="$(python3 - <<'PYTHON'
import json
import subprocess
import sys

def simctl(*arguments):
    return subprocess.check_output(["xcrun", "simctl", *arguments], text=True)

def runtime_version(identifier):
    try:
        return tuple(int(part) for part in identifier.split(".iOS-", 1)[1].split("-"))
    except (IndexError, ValueError):
        return ()

devices = json.loads(simctl("list", "devices", "available", "--json"))["devices"]
available = [(runtime, device) for runtime, entries in devices.items() if runtime_version(runtime) >= (18,)
             for device in entries if device.get("isAvailable")]
available.sort(key=lambda pair: runtime_version(pair[0]), reverse=True)
owned = [(runtime, device) for runtime, device in available if device["name"] in
         {"Mon Florian", "Mon Florian QA", "Mon Florian Tests"}]
if owned:
    newest = runtime_version(owned[0][0])
    candidates = [device for runtime, device in owned if runtime_version(runtime) == newest]
    print(next((device["udid"] for device in candidates if device["state"] == "Booted"), candidates[0]["udid"]))
else:
    phones = [(runtime, device) for runtime, device in available
              if "iPhone" in device.get("deviceTypeIdentifier", device["name"])]
    if not phones:
        sys.exit("Aucun runtime iPhone iOS 18 ou plus récent disponible pour créer Mon Florian Tests.")
    runtime, sample = phones[0]
    device_type = sample.get("deviceTypeIdentifier")
    if not device_type:
        types = json.loads(simctl("list", "devicetypes", "--json"))["devicetypes"]
        device_type = next((item["identifier"] for item in types if item["name"] == sample["name"]), None)
    if not device_type:
        sys.exit("Le type du simulateur iPhone disponible ne peut pas être déterminé.")
    print(simctl("create", "Mon Florian Tests", device_type, runtime).strip())
PYTHON
)"
fi
if [[ -z "$simulator_id" ]]; then
    echo 'Aucun simulateur iPhone disponible. Installe un runtime iOS dans Xcode.' >&2
    exit 1
fi
result_path="build/ios/Tests-$(date -u +%Y%m%dT%H%M%SZ).xcresult"
test_arguments=(-project ios/MonFlorian.xcodeproj -scheme MonFlorian -configuration Debug -destination "platform=iOS Simulator,id=$simulator_id" -destination-timeout 60 -parallel-testing-enabled NO -derivedDataPath build/ios/DerivedData -resultBundlePath "$result_path" CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=-)
if [[ "${MONFLORIAN_IOS_TEST_SCOPE:-all}" == "unit" ]]; then test_arguments+=('-only-testing:MonFlorianTests'); fi
xcodebuild "${test_arguments[@]}" test 2>&1 | tee build/ios/test.log
