#!/usr/bin/env python3
"""Génère le projet Xcode et ses ressources depuis les sources canoniques."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import struct
import zlib

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true', help='Vérifier la dérive sans modifier de fichier.')
args = parser.parse_args()
outputs = {}

def put(path, value):
    outputs[ROOT / path] = value.encode() if isinstance(value, str) else value

def json_text(value):
    return json.dumps(value, ensure_ascii=False, indent=2) + '\n'

def node_json(source):
    return subprocess.check_output(['node', '--input-type=module', '-e', source], cwd=ROOT)

put('ios/MonFlorian/Resources/japan-10-days.json', node_json('import { publicJapanExample } from "./app/public-travel-guide.mjs"; process.stdout.write(JSON.stringify(publicJapanExample(), null, 2)+"\\n");'))
put('ios/MonFlorian/Resources/guides.json', node_json('import { guides } from "./app/v2/src/guides.js"; process.stdout.write(JSON.stringify(guides, null, 2)+"\\n");'))
example = json.loads(outputs[ROOT / 'ios/MonFlorian/Resources/japan-10-days.json'])
for key, asset in example['imageAssets'].items():
    put(f'ios/MonFlorian/Resources/{key}.webp', (ROOT / 'app/public' / asset['src'].lstrip('/')).read_bytes())
for name, source in [('wordmark', 'monflorian-wordmark.png'), ('florian', 'florian-v2-original.png')]:
    put(f'ios/MonFlorian/Resources/{name}.png', (ROOT / 'assets/brand' / source).read_bytes())
put('ios/MonFlorian/Assets.xcassets/Contents.json', json_text({'info': {'author': 'xcode', 'version': 1}}))
put('ios/MonFlorian/Assets.xcassets/Paper.colorset/Contents.json', json_text({'colors': [
    {'idiom': 'universal', 'color': {'color-space': 'srgb', 'components': {'alpha': '1.000', 'red': '1.000', 'green': '0.973', 'blue': '0.922'}}},
    {'idiom': 'universal', 'appearances': [{'appearance': 'luminosity', 'value': 'dark'}], 'color': {'color-space': 'srgb', 'components': {'alpha': '1.000', 'red': '0.055', 'green': '0.071', 'blue': '0.100'}}}
], 'info': {'author': 'xcode', 'version': 1}}))

put('ios/MonFlorian/Assets.xcassets/ActionBlue.colorset/Contents.json', json_text({'colors': [
    {'idiom': 'universal', 'color': {'color-space': 'srgb', 'components': {'alpha': '1.000', 'red': '0.043', 'green': '0.310', 'blue': '0.847'}}},
    {'idiom': 'universal', 'appearances': [{'appearance': 'luminosity', 'value': 'dark'}], 'color': {'color-space': 'srgb', 'components': {'alpha': '1.000', 'red': '0.620', 'green': '0.863', 'blue': '1.000'}}}
], 'info': {'author': 'xcode', 'version': 1}}))

def app_icon_from_portrait(source):
    # PNG RGBA8 decoder + deterministic resize/composite. No platform dependency.
    offset = 8; compressed = bytearray()
    while offset < len(source):
        size = struct.unpack('>I', source[offset:offset + 4])[0]
        kind = source[offset + 4:offset + 8]; payload = source[offset + 8:offset + 8 + size]
        if kind == b'IHDR':
            width, height, depth, color, compression, filtering, interlace = struct.unpack('>IIBBBBB', payload)
            if (depth, color, compression, filtering, interlace) != (8, 6, 0, 0, 0):
                raise ValueError('Le portrait canonique doit rester un PNG RGBA8 non entrelacé.')
        elif kind == b'IDAT': compressed.extend(payload)
        offset += size + 12
    raw = zlib.decompress(compressed); stride = width * 4; rows = []; previous = bytearray(stride)
    for y in range(height):
        start = y * (stride + 1); filter_type = raw[start]; row = bytearray(raw[start + 1:start + 1 + stride])
        for x in range(stride):
            a = row[x - 4] if x >= 4 else 0; b = previous[x]; c = previous[x - 4] if x >= 4 else 0
            if filter_type == 1: prediction = a
            elif filter_type == 2: prediction = b
            elif filter_type == 3: prediction = (a + b) // 2
            elif filter_type == 4:
                estimate = a + b - c; distances = (abs(estimate - a), abs(estimate - b), abs(estimate - c))
                prediction = (a, b, c)[distances.index(min(distances))]
            elif filter_type == 0: prediction = 0
            else: raise ValueError('Filtre PNG inconnu.')
            row[x] = (row[x] + prediction) & 255
        rows.append(row); previous = row
    target = 1024; pixels = bytearray(); background = (255, 248, 235)
    for y in range(target):
        pixels.append(0); source_y = min(height - 1, y * height // target); row = rows[source_y]
        for x in range(target):
            sx = min(width - 1, x * width // target) * 4; alpha = row[sx + 3]
            pixels.extend((row[sx + c] * alpha + background[c] * (255 - alpha) + 127) // 255 for c in range(3))
    def chunk(kind, data): return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', target, target, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(pixels, 9)) + chunk(b'IEND', b'')

put('ios/MonFlorian/Assets.xcassets/AppIcon.appiconset/AppIcon.png', app_icon_from_portrait((ROOT / 'assets/brand/florian-v2-original.png').read_bytes()))
put('ios/MonFlorian/Assets.xcassets/AppIcon.appiconset/Contents.json', json_text({'images': [{'filename': 'AppIcon.png', 'idiom': 'universal', 'platform': 'ios', 'size': '1024x1024'}], 'info': {'author': 'xcode', 'version': 1}}))

def uid(value):
    return hashlib.sha256(value.encode()).hexdigest()[:24].upper()

def quote(value):
    return json.dumps(str(value))

objects = {}
def obj(key, body):
    objects[uid(key)] = body
    return uid(key)

def group(name, children):
    return obj('group:' + name, '{ isa = PBXGroup; children = (' + ', '.join(children) + '); name = ' + quote(name) + '; sourceTree = "<group>"; }')

all_target_keys = ['MonFlorian', 'MonFlorianTests', 'MonFlorianUITests']
product_ids = {}
for target in all_target_keys:
    ext = 'app' if target == 'MonFlorian' else 'xctest'
    kind = 'wrapper.application' if ext == 'app' else 'wrapper.cfbundle'
    product_ids[target] = obj('product:' + target, '{ isa = PBXFileReference; explicitFileType = ' + kind + '; includeInIndex = 0; path = ' + quote(target + '.' + ext) + '; sourceTree = BUILT_PRODUCTS_DIR; }')
source_groups = []
for target in all_target_keys:
    sources = sorted((ROOT / 'ios' / target).rglob('*.swift'))
    refs = []; source_build = []; resource_build = []
    paths = [(str(path.relative_to(ROOT / 'ios')), 'sourcecode.swift', True) for path in sources]
    if target == 'MonFlorian':
        resources = sorted(str(path.relative_to(ROOT / 'ios')) for path in outputs if '/Resources/' in str(path))
        paths += [(path, 'file', False) for path in resources]
        paths += [('MonFlorian/Assets.xcassets', 'folder.assetcatalog', False), ('MonFlorian/PrivacyInfo.xcprivacy', 'text.xml', False)]
    for path, filetype, is_source in paths:
        ref = obj('file:' + path, '{ isa = PBXFileReference; lastKnownFileType = ' + filetype + '; path = ' + quote(path) + '; sourceTree = SOURCE_ROOT; }')
        refs.append(ref)
        build = obj('build:' + path, '{ isa = PBXBuildFile; fileRef = ' + ref + '; }')
        (source_build if is_source else resource_build).append(build)
    source_groups.append(group(target, refs))
    phases = []
    for name, isa, files in [('Sources', 'PBXSourcesBuildPhase', source_build), ('Frameworks', 'PBXFrameworksBuildPhase', []), ('Resources', 'PBXResourcesBuildPhase', resource_build)]:
        phases.append(obj(f'phase:{target}:{name}', '{ isa = ' + isa + '; buildActionMask = 2147483647; files = (' + ', '.join(files) + '); runOnlyForDeploymentPostprocessing = 0; }'))
    configs = []
    for config in ['Debug', 'Release']:
        settings = {
            'PRODUCT_NAME': '$(TARGET_NAME)', 'PRODUCT_BUNDLE_IDENTIFIER': 'com.monflorian.ios' + ('' if target == 'MonFlorian' else '.' + target),
            'SWIFT_VERSION': '6.0', 'IPHONEOS_DEPLOYMENT_TARGET': '18.0', 'TARGETED_DEVICE_FAMILY': '1,2',
            'GENERATE_INFOPLIST_FILE': 'YES', 'CODE_SIGN_STYLE': 'Automatic', 'CURRENT_PROJECT_VERSION': '1', 'MARKETING_VERSION': '0.1.0',
            'SWIFT_STRICT_CONCURRENCY': 'complete', 'SWIFT_OPTIMIZATION_LEVEL': '-Onone' if config == 'Debug' else '-O',
            'SWIFT_ACTIVE_COMPILATION_CONDITIONS': 'DEBUG' if config == 'Debug' else '',
            'LD_RUNPATH_SEARCH_PATHS': '$(inherited) @executable_path/Frameworks @loader_path/Frameworks',
            'SUPPORTED_PLATFORMS': 'iphoneos iphonesimulator', 'SUPPORTS_MACCATALYST': 'NO'
        }
        if target == 'MonFlorian':
            settings.update({'INFOPLIST_KEY_CFBundleDisplayName': 'Mon Florian', 'INFOPLIST_KEY_LSApplicationCategoryType': 'public.app-category.travel',
                'INFOPLIST_KEY_UIApplicationSceneManifest_Generation': 'YES', 'INFOPLIST_KEY_UILaunchScreen_Generation': 'YES',
                'INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone': 'UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight',
                'INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad': 'UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight',
                'ENABLE_PREVIEWS': 'YES', 'ASSETCATALOG_COMPILER_APPICON_NAME': 'AppIcon'})
        elif target == 'MonFlorianTests':
            settings.update({'TEST_HOST': '$(BUILT_PRODUCTS_DIR)/MonFlorian.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/MonFlorian', 'BUNDLE_LOADER': '$(TEST_HOST)'})
        else:
            settings.update({'TEST_TARGET_NAME': 'MonFlorian'})
        configs.append(obj(f'config:{target}:{config}', '{ isa = XCBuildConfiguration; buildSettings = { ' + ' '.join(f'{key} = {quote(value)};' for key, value in settings.items()) + ' }; name = ' + config + '; }'))
    config_list = obj('configs:' + target, '{ isa = XCConfigurationList; buildConfigurations = (' + ', '.join(configs) + '); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release; }')
    dependencies = []
    if target != 'MonFlorian':
        proxy = obj('proxy:' + target, '{ isa = PBXContainerItemProxy; containerPortal = ' + uid('project') + '; proxyType = 1; remoteGlobalIDString = ' + uid('target:MonFlorian') + '; remoteInfo = MonFlorian; }')
        dependencies.append(obj('dependency:' + target, '{ isa = PBXTargetDependency; target = ' + uid('target:MonFlorian') + '; targetProxy = ' + proxy + '; }'))
    product_type = 'com.apple.product-type.application' if target == 'MonFlorian' else 'com.apple.product-type.bundle.' + ('unit-test' if target == 'MonFlorianTests' else 'ui-testing')
    obj('target:' + target, '{ isa = PBXNativeTarget; buildConfigurationList = ' + config_list + '; buildPhases = (' + ', '.join(phases) + '); buildRules = (); dependencies = (' + ', '.join(dependencies) + '); name = ' + target + '; productName = ' + target + '; productReference = ' + product_ids[target] + '; productType = ' + quote(product_type) + '; }')
main_group = group('Mon Florian', source_groups + [group('Products', list(product_ids.values()))])
project_configs = []
for config in ['Debug', 'Release']:
    project_configs.append(obj('projectconfig:' + config, '{ isa = XCBuildConfiguration; buildSettings = { SDKROOT = iphoneos; CLANG_ENABLE_MODULES = YES; CLANG_ENABLE_OBJC_ARC = YES; ENABLE_TESTABILITY = YES; DEBUG_INFORMATION_FORMAT = dwarf; }; name = ' + config + '; }'))
project_config_list = obj('projectconfigs', '{ isa = XCConfigurationList; buildConfigurations = (' + ', '.join(project_configs) + '); defaultConfigurationIsVisible = 0; defaultConfigurationName = Release; }')
obj('project', '{ isa = PBXProject; attributes = { BuildIndependentTargetsInParallel = YES; LastUpgradeCheck = 2660; }; buildConfigurationList = ' + project_config_list + '; compatibilityVersion = "Xcode 16.0"; developmentRegion = fr; hasScannedForEncodings = 0; knownRegions = (fr, en, Base); mainGroup = ' + main_group + '; productRefGroup = ' + uid('group:Products') + '; projectDirPath = ""; projectRoot = ""; targets = (' + ', '.join(uid('target:' + t) for t in all_target_keys) + '); }')
pbx = '// !$*UTF8*$!\n{\n archiveVersion = 1;\n classes = {};\n objectVersion = 60;\n objects = {\n' + '\n'.join(f'  {key} = {body};' for key, body in sorted(objects.items())) + '\n };\n rootObject = ' + uid('project') + ';\n}\n'
put('ios/MonFlorian.xcodeproj/project.pbxproj', pbx)
def buildable(target):
    return f'<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{uid("target:" + target)}" BuildableName="{target}.{ "app" if target == "MonFlorian" else "xctest"}" BlueprintName="{target}" ReferencedContainer="container:MonFlorian.xcodeproj"/>'
scheme = f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="2660" version="1.7">
 <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">{buildable('MonFlorian')}</BuildActionEntry></BuildActionEntries></BuildAction>
 <TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES"><Testables>{''.join('<TestableReference skipped="NO">' + buildable(t) + '</TestableReference>' for t in all_target_keys[1:])}</Testables></TestAction>
 <LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" allowLocationSimulation="YES"><BuildableProductRunnable runnableDebuggingMode="0">{buildable('MonFlorian')}</BuildableProductRunnable></LaunchAction>
 <ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"><BuildableProductRunnable runnableDebuggingMode="0">{buildable('MonFlorian')}</BuildableProductRunnable></ProfileAction>
 <AnalyzeAction buildConfiguration="Debug"/><ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>
'''
put('ios/MonFlorian.xcodeproj/xcshareddata/xcschemes/MonFlorian.xcscheme', scheme)
changed = []
for path, content in outputs.items():
    if not path.exists() or path.read_bytes() != content:
        changed.append(str(path.relative_to(ROOT)))
        if not args.check:
            path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(content)
if args.check and changed:
    print('Ressources iOS à régénérer :\n' + '\n'.join(changed), file=sys.stderr); sys.exit(1)
print(f'iOS : {len(outputs)} fichiers canoniques {"vérifiés" if args.check else "générés"}.')
