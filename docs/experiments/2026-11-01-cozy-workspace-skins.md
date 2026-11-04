# Window material skins and People workspace — Draft P1.5 batch (1 Nov 2026)

**Scope:** staged on top of Draft PR #22, not a Production change.

- Real Contacts + Invitations are reusable React components in a dockable **Connections/People** window (same Convex queries/actions and Clerk gate, no fake data).
- "Message" in a contact's row invokes the existing authorized `openDirect` mutation, then selects the resulting canonical conversation in the *workspace's* Chats window. The existing direct `/chats` and `/connections` routes deliberately remain functional as low-power/no-WebGL fallback.
- Desktop Dockview and mobile touch windows get the same panel registry and shared navigation context; window layout is still per browser, no backend state change.
- A **Window Style** window offers three cohesive visual materials: warm Cozy, frosted Glass and textured Paper. Glass opacity is bounded 65–100%, blur 0–28 CSS pixels, all values validated before applying. Reset/default and local browser persistence work without a backend.
- Optional Mist/Rain are *static low-cost CSS decoration*, not physically simulated droplets, scrolling shader refraction or actual humidity. They have `pointer-events:none`, keep text in the DOM and obey reduced transparency/motion preferences.
- **Explicit limitation:** material preferences are saved on this **browser only**, not across accounts/devices. A reviewed Convex profile-scoped style schema and migration are a separate task, before this becomes a shipped account feature.
- Privacy: live contacts and conversations remain server-authorized. No content copied to Phaser textures/localStorage, browser-local state only stores non-sensitive material choices and positions.
- Later: visual consistency for profile/settings, a genuine low-power mode, A/B signed-in mobile tests, optional better rain shaders behind GPU/power gating.
