# Sengapp UI v2 — clean-room design checkpoint

## Decision

The previous PR #35 was rejected and closed without merge. It restyled the old presentation rather than creating a new visual language. None of its code is the design starting point.

This study starts directly from main on a distinct branch. It does not modify the home route, Classic shell, existing chat pages, profile, or production UI. The first checkpoint is a brand-new conversation reference at /ui-v2. All visible conversations and messages are local fixtures.

## Art direction

The owner's reference image is a warm, approachable, refined messenger with a carefully spaced column layout and subtle personality. Our interpretation is Warm Editorial Minimalism: calm warm neutrals, one botanical accent, editorial typography, intentional hierarchy, restrained shadows and few decorative surfaces. The reference is visual guidance, not a component library or a directive to imitate its scene artwork.

Visual quality is gated by human review, NOT by CI status.

## Non-negotiable boundaries

- Later retain: Clerk, Convex schema/mutations/queries/authz, message and connection domain rules, Phaser room scene logic, Dockview window behavior, and privacy rules.
- Never transfer: legacy app-shell JSX, old chats rendering components, old Appearance UI, old navigation markup, old CSS recipes, or glass/paper window skins.
- UI v2 lives in src/ui-v2 and owns all its visual styles and tokens. It currently imports only React, lucide-react and its own local mock data.
- The /ui-v2 route is a sample-data-only visual checkpoint, with no authentication, Convex calls or production writes.
- After visual signoff, extract display-only components with explicit props/callback contracts and add small authenticated adapters to existing domain/backend APIs.
- Keep ONE shared Design System and ONE set of feature presentation components for both Classic and Cozy. Experience shells organize them differently without diverging visually.
- Classic: collapsible navigation and chat list; optional details.
- Cozy: same messages, people and preferences inside dismissible/resizable windows; no nested second sidebar in windows.
- Mobile: prioritize one view at a time. Preserve navigation, chat selection and details without overlapping panels.
- Preferences: bounded accent/radius/shadow/density/light-dark values. No arbitrary CSS, no independent glass/paper appearance theme.
- Cover desktop/mobile, EN/AR RTL, light/dark, reduced motion, keyboard navigation, and long messages before release approval.
- No production route change or deletion of legacy code until the full replacement is visually approved.

## Checkpoint 1 implementation

src/ui-v2/studio provides a complete standalone reference conversation: filterable chat list, sample timeline, replies, quick reactions, editable local composer, optional details, hideable navigation, responsive mobile sections, and self-contained appearance controls with browser-local preferences.

The interactions simulate UI only. No real conversation is created and nothing is sent.

Next: human visual acceptance for the first reference screen; then Arabic/RTL and mobile design passes; then build actual shared presentation components and integrate the existing backend without importing legacy UI.

## Component policy — shadcn-first, not CSS-first

**Source-of-truth:** official shadcn/ui components and documented blocks. Never write a custom primitive when an official one fits. Use the installed shadcn Button, Input, Textarea, Badge, Dialog and add the upstream Avatar, Toggle, Toggle Group and Scroll Area. Any local adapter may compose a shadcn primitive, never reimplement its focus, keyboard, selection, dialog or scroll mechanics.

**Visual boundary:** shadcn controls provide accessibility/interaction; v2-only semantic tokens, art direction and application composition provide the look. No legacy screen, CSS block, profile component, or navigation markup is imported. The old shadcn install is a vendor-like component library, NOT permission to inherit its old visual styling.

Use the blocks sidebar-07/08/09 and dashboard-01 for layout patterns only. The final Classic/Cozy shells should adopt shadcn Sidebar, Sheet and appropriate official components *when shells are rebuilt*, instead of transplanting the old Classic shell into v2.

The demo has a floating Appearance Dialog, with shadcn focus management and keyboard Escape, and Scroll Area for message and conversation scrolling. All actions remain sample-data-only until product integration.


## Navigation revision: sidebar-08 composition, not a bespoke skin

The first UI v2 study used its own CSS-grid navigation. The owner rejected this approach in favor of using shadcn/ui's actual sidebar-08 components and behavior. This revision replaces the hand-built main navigation with the first-party SidebarProvider, Sidebar (variant="inset" and collapsible="offcanvas"), SidebarInset, SidebarTrigger, SidebarMenu groups, Collapsible menus, and DropdownMenu for the profile footer. The official primitive implementations are installed as local components; only their cn import paths are adjusted to match the project.

The standard offcanvas and mobile Sheet transitions are now owned by shadcn. The stage uses a full-viewport shell rather than trying to force a fixed shadcn sidebar inside a custom offset frame. The messenger-specific conversation list and bubble presentation remain styled as product content, separate from navigation primitives. Visual appearance is still subject to human review; CI alone is not approval.


## Portal theming and account menus

The desktop shadcn DropdownMenu had a transparent surface because the legacy global theme did not define the `--popover` channels. The mobile shadcn Sheet renders in a Radix Portal, outside the `.s2-root` subtree, so its inherited sidebar colors came from the legacy root rather than from UI v2. Fix both at the design-token boundary: CSS `body:has(.s2-root)` inherits the same UI v2 palette (including chosen accent/light/dark variants) for Radix portals while the route is mounted. Define the missing shadcn popover HSL channels, not a custom dropdown component. The mobile profile menu opens above the footer and respects collision padding and safe-area space. Keep upstream shadcn behavior unchanged. Browser tests assert solid popover surfaces, unified mobile/desktop colors, placement and menu actions.


## Messages + Composer (shadcn-first reference)

The timeline is a standalone component composed from official shadcn Card/CardContent, Avatar, Badge, ScrollArea, Separator, Toggle and DropdownMenu. Replies, quick reactions and message actions use their built-in accessible interactions. The Composer is standalone and uses the official InputGroup/InputGroupTextarea/InputGroupAddon/InputGroupButton and Popover. Only product-specific alignment, bubble palette and spacing are styled. Demo sends, edits, deletes, replies, reactions, emoji insertion and clipboard do not write to Convex. Mixed Arabic/English and longer fixture messages exercise text wrapping and bidi. Mobile Enter adds a newline; send is an explicit button press. No real attachments are available in the reference.
