## [2.0.2](https://github.com/appium/appium-event-parser/compare/v2.0.1...v2.0.2) (2026-11-25)

### Miscellaneous Chores

* replace commander with util.parseArgs ([#11](https://github.com/appium/appium-event-parser/issues/11)) ([4876de9](https://github.com/appium/appium-event-parser/commit/4876de9d8456deb21b5b4afa79881a4753d34d4c))

## [2.0.1](https://github.com/appium/appium-event-parser/compare/v2.0.0...v2.0.1) (2026-11-16)

### Bug Fixes

* support real-device XCUITest event timings and single-timestamp timelines ([#7](https://github.com/appium/appium-event-parser/issues/7)) ([e20d55d](https://github.com/appium/appium-event-parser/commit/e20d55db4e233e60398066e8dc62a7d3782fa383))

## [2.0.0](https://github.com/appium/appium-event-parser/compare/v1.2.0...v2.0.0) (2026-11-12)

### ⚠ BREAKING CHANGES

* The package is now ESM only and exposes no programmatic API; only the appium-event-parser CLI is supported (deep imports such as appium-event-parser/timeline no longer resolve)
* Minimum supported Node.js is now ^22.22.2 || ^24.15.0 || >=26.0.0 (npm >=10)
* The CLI entry point moved to build/lib/cli.js
* The CLI now requires -i/--input and exits with code 1 when neither -t nor -s is given (it used to exit 0 silently)

### Features

* Port to TypeScript and align with the Appium repo shape ([#8](https://github.com/appium/appium-event-parser/issues/8)) ([3d58c3c](https://github.com/appium/appium-event-parser/commit/3d58c3c0a0a41bb6f9888587da7f17fa3b0691dc))
