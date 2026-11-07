/** Standalone fixtures: never fetches or sends production data. */
export type Conversation = {
  id: string; name: string; initials: string; people: string; unread: number;
};
export type MessageData = {
  id: string; sender: string; time: string; text: string; mine?: boolean;
};

export const conversations: Conversation[] = [
  { id: "team", name: "Dev Team", initials: "DT", people: "6 members", unread: 3 },
  { id: "sara", name: "Sara Ali", initials: "SA", people: "Direct message", unread: 2 },
  { id: "friends", name: "Design Friends", initials: "DF", people: "3 members", unread: 0 },
];

export const sampleMessages: Record<string, MessageData[]> = {
  team: [
    { id: "t1", sender: "Aya", time: "10:14 AM", text: "Morning team! ☀️\nThe new build is ready for review." },
    { id: "t2", sender: "Khaled", time: "10:27 AM", text: "Awesome! Can you share the changes?" },
    { id: "t3", sender: "You", time: "10:42 AM", text: "We are testing the vanilla shadcn chat components first.", mine: true },
    { id: "t4", sender: "Aya", time: "11:03 AM", text: "Great. No extra layers this time 🌿" },
  ],
  sara: [
    { id: "s1", sender: "Sara", time: "2:40 PM", text: "How does the new layout feel?" },
    { id: "s2", sender: "You", time: "2:43 PM", text: "Much cleaner when the components keep their defaults.", mine: true },
  ],
  friends: [
    { id: "f1", sender: "Mina", time: "Yesterday", text: "هل الرسائل العربية والإنجليزية ظاهرة بشكل طبيعي؟" },
    { id: "f2", sender: "Sara", time: "Yesterday", text: "Here is a longer example to check how the original Bubble handles wrapping, multiple sentences, and a normal conversation without adding a separate visual system on top of the library." },
    { id: "f3", sender: "You", time: "Yesterday", text: "واضحة جدًا 🌱", mine: true },
  ],
};
