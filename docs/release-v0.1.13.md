# VDO.Ninja Stream Deck v0.1.13

Improved action icons and reliability for VDO.Ninja controls on Stream Deck.

- Distinct generated icons for mic, camera, recording, guest activation, transfer, PTZ, mixer controls, and other commands. Inspector changes update key artwork immediately; stale image updates cannot overwrite newer icons.
- More reliable connection feedback: ignore stale responses after connection changes, handle malformed relay messages, and require fresh responses for inspector connection tests.
- Preserve momentary microphone press/release order and release held controls when their configuration or profile changes.
- Prevent queued dial input from leaking into a different control or undoing a reset; preserve newer settings when delayed responses finish.
- Clear pending dangerous-action confirmations when settings, profiles, or selected guests change.

Validation: 142 automated tests, TypeScript, dependency audit, bundled runtime integration covering all action types, and Elgato manifest/package validation passed locally. CI also runs the bundled runtime integration before publishing.

The connected Elgato devices and installed plugin were detected, but physical-button and OBS end-to-end operation of this build remain unverified. This plugin controls VDO.Ninja through its API; it does not replace OBS's native Stream Deck integration.

Download and open `ninja.vdo.streamdeck.streamDeckPlugin` to install/update. Requires Stream Deck 6.8 or later. The plugin remains beta and is not an Elgato Marketplace release.
