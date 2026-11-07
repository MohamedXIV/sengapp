/** Design-reference fixtures only. No production messages are fetched or sent here. */
export type DemoConversation = {
  id: string;
  name: string;
  kind: "group" | "direct";
  preview: string;
  time: string;
  unread: number;
  tone: "sage" | "plum" | "clay" | "blue" | "peach";
  initials: string;
  members: string[];
  description: string;
  pinned: string;
};

export type DemoReaction = { emoji: string; count: number };
export type DemoMessage = {
  id: string;
  sender: string;
  time: string;
  text: string;
  own?: boolean;
  reply?: { sender: string; text: string };
  reactions?: DemoReaction[];
};

export const demoConversations: DemoConversation[] = [
  {
    id: "dev-team", name: "Dev Team", kind: "group", initials: "DT", tone: "plum",
    preview: "Aya: Pushed the updates! 🎉", time: "3:34 PM", unread: 3,
    members: ["Aya", "Khaled", "Sara", "Youssef", "Mina", "You"],
    description: "A little space for building things together. Ideas, progress, and the small wins in between.",
    pinned: "Release notes · Friday review",
  },
  {
    id: "sara", name: "Sara Ali", kind: "direct", initials: "SA", tone: "clay",
    preview: "Can you review the design?", time: "2:58 PM", unread: 2,
    members: ["Sara", "You"],
    description: "Your private conversation with Sara.", pinned: "Weekend sketch ideas",
  },
  {
    id: "garden", name: "The Garden", kind: "group", initials: "✿", tone: "sage",
    preview: "The seedlings are ready 🌱", time: "11:20 AM", unread: 0,
    members: ["Aya", "Mina", "You"],
    description: "Where the quieter conversations grow.", pinned: "Our little weekend plan",
  },
  {
    id: "youssef", name: "Youssef", kind: "direct", initials: "YO", tone: "blue",
    preview: "Sounds good! 👍", time: "Yesterday", unread: 0,
    members: ["Youssef", "You"],
    description: "Your private conversation with Youssef.", pinned: "A place to catch up",
  },
  {
    id: "design", name: "Design Friends", kind: "group", initials: "DF", tone: "peach",
    preview: "New sketches uploaded ✨", time: "Yesterday", unread: 0,
    members: ["Sara", "Mina", "You"],
    description: "Sharing good ideas without the noise.", pinned: "Moodboard · Soft & personal",
  },
  {
    id: "family", name: "Family", kind: "group", initials: "♥", tone: "clay",
    preview: "Dinner on Friday? 🍲", time: "Nov 4", unread: 0,
    members: ["You", "Mum", "Omar", "Nour"],
    description: "The people who feel like home.", pinned: "Friday dinner",
  },
];

export const initialMessages: Record<string, DemoMessage[]> = {
  "dev-team": [
    { id: "d1", sender: "Aya", time: "10:14 AM", text: "Morning team! ☀️\nThe new build is ready for review.", reactions: [{ emoji: "❤️", count: 4 }, { emoji: "🚀", count: 2 }] },
    { id: "d2", sender: "Khaled", time: "10:27 AM", text: "Awesome! Can you share the changes from this iteration?" },
    { id: "d3", sender: "You", time: "10:42 AM", own: true, text: "Here’s a quick summary:\n• Better message performance\n• Polished composer and reactions\n• A few tricky edge cases fixed" },
    { id: "d4", sender: "Aya", time: "11:03 AM", text: "This looks so good! The new reactions feel super smooth and on-brand. 💜",
      reply: { sender: "You", text: "Polished composer and reactions" }, reactions: [{ emoji: "💜", count: 5 }, { emoji: "👏", count: 2 }] },
    { id: "d5", sender: "You", time: "3:34 PM", own: true, text: "Pushed the updates! 🎉\nThe preview is ready to explore." },
  ],
  sara: [
    { id: "s1", sender: "Sara", time: "2:40 PM", text: "I put together some ideas for the new chat layout." },
    { id: "s2", sender: "You", own: true, time: "2:43 PM", text: "Love the calmer direction. The messages finally have room to breathe." },
    { id: "s3", sender: "Sara", time: "2:58 PM", text: "Can you review the design when you have a moment? 🌷" },
  ],
  garden: [
    { id: "g1", sender: "Mina", time: "11:05 AM", text: "The seedlings are ready! 🌱" },
    { id: "g2", sender: "You", own: true, time: "11:20 AM", text: "I'll bring the little watering can." },
  ],
  youssef: [
    { id: "y1", sender: "Youssef", time: "Yesterday", text: "Want to try the new demo together?" },
    { id: "y2", sender: "You", own: true, time: "Yesterday", text: "Of course!" },
    { id: "y3", sender: "Youssef", time: "Yesterday", text: "Sounds good! 👍" },
  ],
  design: [
    { id: "a1", sender: "Mina", time: "Yesterday", text: "New sketches uploaded ✨\nI kept the layout simple this time." },
    { id: "a2", sender: "You", own: true, time: "Yesterday", text: "The little details make all the difference." },
    { id: "a3", sender: "Sara", time: "Yesterday", text: "تفتكر نخفف الحدود والظلال شوية؟ خلّي المحادثة هي البطل، والباقي هادي 🌿" },
    { id: "a4", sender: "Mina", time: "Yesterday", text: "We should test longer messages too. A thoughtful design has to feel calm when a conversation becomes detailed, when someone shares a few paragraphs, and when English and Arabic appear in the same thread. Nothing should be clipped or squeezed into an awkward fixed-width box." },
  ],
  family: [
    { id: "f1", sender: "Nour", time: "Nov 4", text: "Dinner on Friday? 🍲" },
    { id: "f2", sender: "You", own: true, time: "Nov 4", text: "Count me in!" },
  ],
};
