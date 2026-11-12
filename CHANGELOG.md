## [2.0.0](https://github.com/appium/appium-event-parser/compare/v1.2.0...v2.0.0) (2026-11-12)

### ⚠ BREAKING CHANGES

* The package is now ESM only and exposes no programmatic API; only the appium-event-parser CLI is supported (deep imports such as appium-event-parser/timeline no longer resolve)
* Minimum supported Node.js is now ^22.22.2 || ^24.15.0 || >=26.0.0 (npm >=10)
* The CLI entry point moved to build/lib/cli.js
* The CLI now requires -i/--input and exits with code 1 when neither -t nor -s is given (it used to exit 0 silently)

### Features

* Port to TypeScript and align with the Appium repo shape ([#8](https://github.com/appium/appium-event-parser/issues/8)) ([3d58c3c](https://github.com/appium/appium-event-parser/commit/3d58c3c0a0a41bb6f9888587da7f17fa3b0691dc))
