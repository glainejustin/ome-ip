# ome-ip

ome-ip is a powerful Userscript designed to enhance your experience on random video chat platforms. It provides real-time partner geolocation, gender and region filtering, automated protection against bans/reports, media stream manipulation (Fake Camera), and advanced blocking capabilities.

---

<img width="1837" height="2261" alt="531390679-663dc567-4c16-4d7f-9cb2-c7a44eb1a114" src="https://github.com/user-attachments/assets/b8c0affa-d004-4916-8cab-5afc6644bc96" />

---

## 🌟 Features

### 🎯 Partner Filters

* **Gender Filter:** A three-state cycle — `Off` → `Skip Women` → `Skip Men` — toggled from a status dot. When a partner carries a gender tag that matches the active mode, the script skips them automatically.
* **Tag Pills:** Tag any partner manually as `♀ Woman`, `♂ Man` or `? Unknown` from a pill row in the stats window. Tags are cached per IP, so they survive reconnects.
* **CSV Region Filter:** Skip partners by state or region name from a free-form comma-separated list, with optional country-ISO disambiguation.
* **Region Fence:** The precision state picker supports both **block** and **allow-list** modes.

### 🛡️ Core Protection & Privacy

* **IP Grabbing & Geolocation:** Instantly displays your partner's IP address, Country, Region, City, and ISP.
* **VPN/Relay Detection:** Automatically detects and warns you if a partner is using a Proxy or Turn Server (Relay IP).
* **Report Protection:** Intercepts WebSocket signals to block "Report" or "Ban" attempts from reaching the server. Includes an audio alert ("Report Detected").
* **Face Detection Bypass:** Tricks site algorithms into thinking a real face is visible, preventing "Black Screen" bans.
* **Anti-Bot & Fingerprint Spoofing:**
    * Spoofs Navigator properties (UserAgent, Hardware Concurrency, Device Memory).
    * Bypasses automated "human verification" checks (Variance tests, Scroll length).



### 🚫 Blocking & Automation

* **Country Blocker:** Automatically skip partners from specific countries. Includes a visual continent map selector.
* **IP Blocker:** Permanently block specific IPs. If you match with them again, the script auto-skips immediately.
* **Auto-Skip Logic:** Smart skipping algorithms for Ome.tv, OmegleApp, Umingle, and more.
* **Disconnect Monitor:** Automatically finds a new partner if the current one disconnects (Specific support for OmegleApp & OmegleWeb).

### 🎬 Media & Hardware Manipulation

* **Fake Camera:** Replace your webcam feed with a custom video loop — either a local file you pick or a remote `.mp4` URL. The output is always re-rendered through a canvas so downstream processing (jitter, label spoofing) composes cleanly.
* **Anti-Ban Jitter:** Adds subtle movement/noise to static video feeds to prevent "Static Image" bans. Works on a live camera too, not just the fake feed.
* **Device Spoofing:** Renames your hardware inputs in the browser (e.g., renames "Default Cam" to "Logitech C920").
* **Raw Audio Mode:** Disables echo cancellation and noise suppression for high-fidelity audio processing.
* **Thumbnail Capture:** Automatically captures and saves a screenshot of your partner's video stream after connection.

### 🛠️ Advanced Tools & UI

* **Draggable & Resizable UI:** A modern, dark-themed interface that can be moved, resized, or minimized.
* **Ghost Mode:** Makes the interface transparent to monitor stats without obstructing the view.
* **Map Integration:** Open a Google Maps window (Standard or Street View) centered on your partner's location.
* **Notes & History:** Keep a history of IPs encountered, save custom notes for specific users, and view past thumbnails.
* **Element Selector:** Visually select and hide (or blackout) annoying website elements (ads, banners, watermarks).
* **Developer Console:** Built-in log window to view raw WebRTC connection data and API errors.

---

## 🎯 Using the Partner Filters

The Gender and CSV filters are toggled from a status-dot panel; the tag pills live in the stats window instead. Both dots sit on the same row of the panel.

### Gender Filter

Click the **Gender dot** to cycle the mode. The dot turns green while a filter is active, and its tooltip names the current mode. The stats window shows a matching line such as `Gender Filter: Skip Women`.

A mode only fires when the partner **already has a gender tag**. Untagged partners are never skipped — the filter is a filter over tags, not a classifier. Tags can come from three places:

| Source | Default | Notes |
| --- | --- | --- |
| **Manual tag pills** | Always on | You tag the partner by hand. |
| **Name heuristic** | Opt-in | Parses the Ome.tv username. |
| **Thumbnail classifier** | Opt-in | Runs `face-api.js` over the webcam frame. |

Two things to know before enabling either heuristic:

* **Cached tags always win.** If you tagged an IP manually, neither heuristic will overwrite it.
* **The thumbnail classifier downloads models.** It lazily fetches `face-api.js` v1.7.12 and its model weights from `cdn.jsdelivr.net` the first time it runs, so the first classification needs a network round trip. If the load fails, the classifier disables itself for that session rather than retrying in a loop.

Both heuristics are off by default. Turn one on by setting its flag in `ome-ip.js` and reinstalling, or — for a single session — from the DevTools console *before* the next partner connects:

```js
unsafeWindow.ome_ip_state.useNameHeuristic = true
unsafeWindow.ome_ip_state.useThumbnailHeuristic = true
```

The filter is gated on the IP Grabber being enabled, and **partners on relay/VPN IPs are never gender-skipped** — the script exits before the filter runs rather than guessing at a proxied location.

### Tag Pills

Under the IP in the stats window is a `Tag:` row: a badge showing the current tag, three pills (`♀` Woman, `♂` Man, `?` Unknown) and a `✕` to clear. The active pill is filled, outlined with a glow and shows inverted text, so the stored tag is unambiguous at a glance.

Clicking a pill stores the tag against the current IP and persists it. If the tag you just applied matches your active gender mode, the script skips that partner immediately rather than waiting for the next connect.

Pills need a resolved IP — clicking before one exists raises a `No IP to tag yet` toast.

### CSV Region Filter

Toggle it from the **CSV dot**. The first time you enable it, the script prompts for a list; after that you can edit the same list in the region picker window, which shows a live `Tokens: N valid` count.

The list is comma-separated. Append a two-letter country code to disambiguate regions that share a name:

```
Kerala, IN, New York, US, Bavaria, Ontario, CA
```

Parsing rules, in order:

1. Newlines are stripped as you type, so a wrapped paste still parses.
2. Each entry is optionally split into `name, ISO`.
3. The name is lowercased and stripped of non-alphanumerics.
4. **Tokens shorter than 3 characters are discarded.** A typo-heavy paste can silently yield zero tokens.
5. Because of rule 4, the filter refuses to enable on an empty token set and tells you so instead of silently doing nothing.

Matching is a **substring test against the partner's normalised region** — the same normalisation the state fence uses, which drops the literal word `state` and all punctuation. `normRegion.indexOf(token)`. So `york` matches `New York`, and `kerala` matches `Kerala`. Where you supply an ISO hint, the partner's country must match it too, which is what keeps `Ontario, CA` from catching `Ontario, US`. Skips are reported as `Filtered Region (CSV): <region>, <ISO>`.

This filter is **skip-only**. For allow-list behaviour against the precision region database, use the Region Fence instead.

---

## 🎬 How the Fake Camera Works

`getUserMedia` is intercepted and resolved through one of three scenarios:

1. **Fake Cam enabled** — returns your video loop, always routed through the canvas processor.
2. **Real camera + Jitter enabled** — your genuine camera, but also routed through the processor so the anti-ban jitter applies.
3. **Everything else** — a normal passthrough stream, still carrying device-label spoofing when that is on.

The canvas defaults to 640×480 and is configurable. The video source is either a local file you pick (stored as a `data:` URL) or a remote URL you set.

**One caveat worth knowing:** Edge's Tracking Prevention can clear userscript storage, which wipes the saved `data:` URL. The script detects this on the next connect, shows a placeholder frame reading `Pick a video file to start fake cam`, and raises a toast telling you to re-pick your file, rather than handing the site a broken video element.

The related toggles — Jitter (`🛡️ Jitter`), device spoofing, raw audio and one-camera mode — all ship **disabled**, so the script is a no-op on the stream until you opt in.

---

## 📋 Supported Sites

The script is configured to run on the following platforms:

* Ome.tv
* OmegleApp.me
* Chatroulette.com
* Monkey.app
* Omegleweb.com
* Thundr.com
* Umingle.com
* Webcamtests.com (for testing)

---

## ⚙️ Installation Guide

### Prerequisites

You need a Userscript manager installed in your browser.

* **Chrome/Edge/Brave:** [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).
* **Firefox:** [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) or Tampermonkey.

### Install Steps

1. Click on your Userscript manager extension icon and select **"Create a new script"**.
2. Delete any default code in the editor.
3. Copy the entire contents of `ome-ip.js`.
4. Paste the code into the editor.
5. Press `Ctrl+S` or click **File > Save**.
6. Visit any supported site (e.g., [https://ome.tv/](https://ome.tv/)) and the overlay will appear automatically.

---

## 🔧 Recommended Browser Settings

To ensure all features (especially IP Grabbing and Fake Camera) work correctly, please configure your browser as follows:

1. **WebRTC must be ENABLED:**
    * Do *not* use extensions like "WebRTC Control" or "Disable WebRTC" that completely block IP leakage. This script *needs* to read the WebRTC candidates to fetch the IP.
    * If you use a VPN, ensure it allows WebRTC traffic (Split Tunneling might be required if the VPN blocks P2P).


2. **Autoplay Permissions:**
    * Allow the site to Autoplay video and audio. This ensures the "Fake Camera" video loads and plays correctly without user interaction.


3. **Ad Blockers:**
    * Some aggressive ad blockers may interfere with the IP geolocation API (`ipwho.is`). If stats say "Net Error," try whitelisting the chat site or the API domain.


4. **Hardware Acceleration:**
    * For the best performance with the "Anti-Ban Jitter" and "Fake Camera" overlays, ensure Hardware Acceleration is enabled in your browser settings.



---

## 🕹️ Controls & Shortcuts

* **Move Windows:** Click and drag the header or background of any window.
* **Resize Windows:** Drag the corners of the windows.
* **Ghost Mode:** Toggle the 👻 icon to make the UI transparent.
* **Lock UI:** Click the 🔓/🔒 icon in the top center to prevent accidental clicks on toggles.
* **Hide Watermarks:** Use the "Eye" 👁️ menu to toggle Dark Mode and hide site logos.

### Status Dots

* **Gender dot** — cycles `Off` → `Skip Women` → `Skip Men` → `Off`.
* **CSV dot** — toggles the CSV region filter (📝 while active, 📄 while off).
* **🎬 Fake Cam dot** — toggles the fake camera through a confirmation prompt.
* **🛡️ Jitter dot** — toggles anti-ban frame jitter.
* **Device Spoofing dot** — toggles hardware input renaming.

---

## 🧪 Development

The repository ships with a jsdom test suite covering the gender route table and the DOM flows that drive the dots and pills.

```bash
npm install
npm test     # 42 gender assertions + 13 DOM-flow assertions
npm run check  # syntax-check ome-ip.js
```

The DOM-flow tests extract function bodies straight out of `ome-ip.js` using an anchor-regex table rather than fixed line numbers, so they survive source growth. When a test reports `ANCHORS drifted`, the start regex for that block no longer matches and the table needs updating.

Releases are recorded in [CHANGELOG.md](CHANGELOG.md). The `@version` in `ome-ip.js` is what userscript managers compare to decide whether an installed copy is stale, so it has to move for anyone to actually receive a build — bumping it locally does nothing on its own.

---

## ⚠️ Disclaimer

*This tool is for educational purposes and research into WebRTC logic and browser security. The developer is not responsible for bans or account suspensions resulting from the use of this tool. Use responsibly.*

---

## 👨‍💻 Developer

Created by [EolnMsuk](https://github.com/EolnMsuk) → [AntiDarkSword](https://github.com/EolnMsuk/AntiDarkSword/)  
Donate: [BTC](https://www.blockchain.com/explorer/addresses/btc/bc1qm06lzkdfule3f7flf4u70xvjrp5n74lzxnnfks) or [Venmo](https://venmo.com/user/RustOnRails)

## 📄 License

Released under the [GNU General Public License v3.0](LICENSE).
