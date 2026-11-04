# Account-synced Window Materials — technical slice, 1 November 2026

**Base:** Draft PR #24 (Profile and Appearance panel integration). **No Production merge.**

Window materials are no longer inherently browser-only when authenticated. Added an *optional*, closed and bounded `profiles.windowStyle` value and an authenticated `profiles.updateWindowStyle` mutation. No arbitrary CSS, shader source or user-target ID can cross the mutation. Existing profiles require no migration and legacy visual preferences remain intact.

The live sliders still preview only in React. An explicit **Save to my account** button is shown to active signed-in members. It performs **one** mutation for the accepted selection, rather than a write on each pointer move. Rejected mutations retain local style and display an error. Loading another browser/device hydrates from the saved account field. Guest windows preserve a local-only style and cannot invoke the mutation.

A static backend-availability guard ensures the public `/lab/cottage` prototype keeps working **without configured Clerk/Convex**. Each device keeps an account-keyed local draft, so separate signed-in members are not assigned each other's visual choices.

**Not covered:** real signed-in cross-browser A/B Preview testing, account switching under simultaneous sessions, real GPU power of CSS blur / optional rain. Existing 16 moderate npm advisories and parent-first Draft merge gates remain open.
