#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd -P)"
if [[ -z "${DEVELOPER_DIR:-}" && -d /Applications/Xcode.app/Contents/Developer ]]; then
  export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
fi
mkdir -p "${ROOT}/build/ios/photo-contract"
xcrun swiftc "${ROOT}/ios/MonFlorian/PhotoPreparer.swift" \
  "${ROOT}/ios/Tests/PhotoContract/main.swift" \
  -o "${ROOT}/build/ios/photo-contract/verify-photo"
"${ROOT}/build/ios/photo-contract/verify-photo" \
  "${ROOT}/assets/brand/florian-v2-original.png" \
  "${ROOT}/build/ios/photo-contract/prepared.png"
cd "${ROOT}"
node --input-type=module <<'JS'
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { decodePhoto } from './app/core.mjs';
const bytes = readFileSync('build/ios/photo-contract/prepared.png');
const result = decodePhoto(`data:image/png;base64,${bytes.toString('base64')}`);
assert.equal(result.mimeType, 'image/png');
console.log(JSON.stringify({event: 'native_photo_accepted_by_shared_api', bytes: bytes.length, width: result.width, height: result.height}));
JS
