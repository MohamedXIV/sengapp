# Sengapp — Chat UI polish round 2

## Scope
Visual-only improvements on the existing P1.2 branch; no changes to Convex data, auth, or permission rules.

- More spacious chat-first thread with a scroll-contained history and an always-visible composer.
- Group member controls moved to a shadcn Sheet with direction-aware positioning and retained role protections.
- Message timeline groups consecutive messages, separates days, labels group senders and uses theme tokens.
- Multiline composer: Enter sends, Shift+Enter adds a line, failure retry preserves nonce.
- Conversation list with compact identity treatments, search, dates, and improved empty state.
- English/colloquial Arabic labels; RTL, mobile, focus and reduced-motion should be reviewed.

## Acceptance
- Verify composer and scroll behavior on phone/desktop, in both directions; check loading older pages without jumping.
- Check both direct/group conversations, no accidental changes to message delivery or persistence.
- Confirm group panel controls remain accessible by keyboard/screen readers and can be dismissed.
- Await exact-head CI and Vercel Preview; don't merge ahead of P0/P1.1/P1.2.

No Production changes.
