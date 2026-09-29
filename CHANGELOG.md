# Changelog

All notable changes to ome-ip are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Userscript managers update an installed copy when the published `@version` rises, so the version number in `ome-ip.js` is the release signal — bumping it without publishing does nothing for existing installs.

Release tags (`v3.0.0` onward) are published on the fork. The bare `1.2`–`3.4` tags are inherited from the original upstream history and do not correspond to the `@version` in those builds — see [Earlier versions](#earlier-versions).

---

## [Unreleased]

Nothing yet.

---

## [3.0.2] - 2026-09-29

### Fixed

- **The CSV status dot never received its amber styling.** The block was chained as `else if (type === "csv")` onto `if (iconSpan)`, but `createToggleDot` always renders an icon span — so the branch was unreachable and every build showed the stock red/green dot the amber treatment was meant to replace. It is now a sibling `if`, and it also drives `boxShadow`: without that the dot kept the default red/green glow beside an amber fill.
- **CSV dot refresh was coupled to the gender dot.** The whole CSV block sat nested inside `if (genderFilterDot)`, so CSV styling, icon and tooltip silently depended on the gender dot existing on the page. The two are independent controls and are now un-nested.

### Tests

- Two regression tests covering the above, both driving the real `updateStatusDots()`: one asserting the CSV dot's fill, border and glow are amber and its tooltip reports the live token count, one asserting the dot still refreshes with no gender dot present. Both fail against the pre-fix code.

---

## [3.0.1] - 2026-09-29

### Fixed

- **The gender status dot was unreadable.** All three modes shared `dotIcon: '?'`, so the dot looked identical whether the filter was off, skipping women or skipping men — the active mode was recoverable only from the tooltip, which defeats the point of a status dot. The modes now render `⊘`, `♀` and `♂`. `updateStatusDots()` was already re-driving the icon and title on every call; the data was the only broken half.
- **README correction.** The Gender Filter section claimed the dot turns green when a filter is active. It turns gold (`#FFD700`) when active and red when off.

### Tests

- New regression test driving the **real** `updateStatusDots()` across all three modes, asserting the specific glyph rendered rather than merely that the three differ. The harness previously eval'd that function but never called it, which is why the shared-icon bug went unnoticed.
- The test harness now stubs the module-level flags `updateStatusDots()` reads (`isIPGrabbingEnabled`, `geoFenceMode`, `blockedRegionsCache` and friends) and imports `FAKE_CONFIG` into its eval scope, so the function is actually callable.

---

## [3.0.0] - 2026-09-29

The largest release to date. Adds a partner-filtering layer, reroutes the media pipeline, and corrects the project's licensing metadata.

> **Why `3.0.0`:** two different version schemes collide in this history, and only one of them reaches users.
>
> - The **git tags** run `1.2`, `2.0`, `2.1`, `2.2`, `3.0`, `3.1`, `3.2`, `3.3`, `3.4`. But every one of those tagged commits carries `@version 2.0` in the script metadata (`1.2` carries `1.0`) — the tag names and the script header disagree by several versions.
> - **Userscript managers compare the `@version` field, not the git tag.** So the effective highest version ever published is the `2.13` from the repository's initial commit, which the author subsequently renumbered downward to `2.0`. A hypothetical `2.3` release would have been **invisible** to anyone still running that `2.13` build, because `13 > 3` per version segment.
> - `3.0.0` sits above every `@version` ever published, so all existing installs receive this build.

To avoid reusing the existing `3.0`–`3.4` tag names, tag this release `v3.0.0`.

### Added

- **Gender filter** with a three-state cycle (`Off` → `Skip Women` → `Skip Men`) driven from a status dot. Only fires for partners that already carry a tag, and never for partners on relay/VPN IPs.
- **`GENDER` single source of truth** for mode, tag code, icon, colour, skip-reason and label routing, so the status dot, settings dropdown, tag pills and skip logic can no longer drift apart.
- **Tag pills** for manually tagging a partner `♀ Woman`, `♂ Man` or `? Unknown`, cached per IP with an active-state indicator and a clear (`✕`) control. Applying a tag that matches the active mode skips that partner immediately.
- **CSV region filter** with comma-separated entries and optional country-ISO disambiguation, a live valid-token count, and substring matching against the normalised partner region.
- **Name heuristic** for inferring gender from the Ome.tv username (opt-in, off by default).
- **Thumbnail gender classifier** using `face-api.js` v1.7.12 over the live webcam frame (opt-in, off by default). Loads its models lazily from `cdn.jsdelivr.net` and disables itself for the session if the load fails.
- **Allow-list mode** for the precision region fence, alongside the existing block mode.
- **jsdom test suite** — 42 gender assertions plus 13 DOM-flow assertions covering the dot cycles, pill persistence and the three `getUserMedia` scenarios. Wired to `npm test`.
- `package.json` with the test and syntax-check scripts, plus `.gitignore` and `.gitattributes`.

### Changed

- **Fake camera output is always routed through the canvas processor**, so jitter and label spoofing compose cleanly with the fake feed instead of bypassing it.
- **Anti-ban jitter now applies to a real camera**, not only to a video loop. `getUserMedia` resolves through one of three explicit scenarios: fake cam, real camera + jitter, or plain passthrough — the last still carrying device-label spoofing when enabled.
- **Media and stream toggles now ship disabled by default**, so the script leaves your stream untouched until you opt in.
- **`@license` corrected from `MIT` to `GPL-3.0`**, matching the `LICENSE` file. The repo is copyleft, so the previous header misdescribed the terms under which the code was actually offered.
- **README rewritten** to document the gender filter, tag pills, CSV filter and fake-camera pipeline, including the opt-in status of both heuristics and the Edge storage caveat.

### Fixed

- **Edge Tracking Prevention wiping the saved video file.** When userscript storage is cleared, the saved `data:` URL vanishes and the script previously risked handing the site a broken video element. It now detects the empty URL, renders a `Pick a video file to start fake cam` placeholder frame and raises a toast asking you to re-pick the file.
- **CSV filter race condition.** The region fence now guards on `currentIP === ipSnapshot` so a slow geolocation response cannot skip a partner who has already been replaced.
- **CSV filter silently doing nothing.** Enabling with zero valid tokens now refuses to turn on and tells you, instead of leaving an apparently-active filter that skips nobody. The same guard applies from both the status dot and the region picker.
- **Region name normalisation** drops the literal word `state` and punctuation before matching, so a token like `york` matches `New York`.
- **Test portability.** The gender smoke test hardcoded a `D:/ome-ip/ome-ip.js` path and failed on every machine but the original; it now resolves relative to the file.

### Repository

- Line endings normalised to LF via `.gitattributes`. The previous blob stored CRLF while working copies were LF, so `core.autocrlf` rewrote every line and any diff of `ome-ip.js` appeared as a whole-file rewrite rather than real hunks.
- `node_modules`, backup snapshots and one-off patch scripts are now ignored.

---

## Earlier versions

Versions before `3.0.0` were not tracked in a changelog, and the repository's tags do not map cleanly onto `@version` values:

| Tag | Commit date | `@version` in that build |
| --- | --- | --- |
| `1.2` | 2025-12-22 | `1.0` |
| `2.0` – `2.2` | 2025-12-27 | `2.0` |
| `3.0` – `3.1` | 2026-01-01 | `2.0` |
| `3.2` – `3.3` | 2026-01-02 | `2.0` |
| `3.4` | 2026-01-03 | `2.0` |

The initial commit carried `@version 2.13`, which was later renumbered down to `1.0`. If you are upgrading from a tagged build, check the `@version` in your installed copy rather than trusting the tag name — and note that an install sitting on `2.13` will not pick up anything numbered below `2.13`.

[Unreleased]: https://github.com/glainejustin/ome-ip/compare/v3.0.2...HEAD
[3.0.2]: https://github.com/glainejustin/ome-ip/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/glainejustin/ome-ip/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/glainejustin/ome-ip/compare/20b9472...v3.0.0
