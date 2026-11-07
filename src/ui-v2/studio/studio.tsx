"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type CSSProperties } from "react";
import {
  ArrowLeft, Bell, Check, CheckCheck, ChevronRight, Heart, Leaf,
  MoreHorizontal, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Plus, Search, Send, Smile, Sparkles, UsersRound, X,
} from "lucide-react";
import { demoConversations, initialMessages, type DemoConversation, type DemoMessage } from "./studio-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar as ShadcnAvatar, AvatarFallback } from "@/components/ui/avatar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { SengappAppSidebar } from "./app-sidebar";

type Accent = "sage" | "clay" | "plum" | "ocean";
type Corners = "quiet" | "soft" | "round";
type Elevation = "flat" | "soft" | "lifted";
type Density = "comfortable" | "compact";
type ThemeMode = "light" | "dark";
type Filter = "all" | "unread" | "groups";
type MainSection = "chats" | "people" | "notes";
type Appearance = { accent: Accent; corners: Corners; elevation: Elevation; density: Density; mode: ThemeMode };

const DEFAULT_APPEARANCE: Appearance = {
  accent: "sage", corners: "soft", elevation: "soft", density: "comfortable", mode: "light",
};
const APPEARANCE_KEY = "sengapp-v2-clean-room-appearance";
const preferenceOptions = {
  accent: ["sage", "clay", "plum", "ocean"],
  corners: ["quiet", "soft", "round"],
  elevation: ["flat", "soft", "lifted"],
  density: ["comfortable", "compact"],
  mode: ["light", "dark"],
} as const;

function readAppearance(): Appearance | null {
  try {
    const stored = JSON.parse(window.localStorage.getItem(APPEARANCE_KEY) ?? "null");
    if (!stored || typeof stored !== "object") return null;
    for (const key of Object.keys(preferenceOptions) as Array<keyof Appearance>) {
      if (!(preferenceOptions[key] as readonly string[]).includes(stored[key])) return null;
    }
    return stored as Appearance;
  } catch {
    return null;
  }
}

function ConversationAvatar({ conversation, small = false }: { conversation: Pick<DemoConversation, "tone" | "initials">; small?: boolean }) {
  return <ShadcnAvatar className={"s2-avatar s2-tone-" + conversation.tone + (small ? " s2-avatar-small" : "")} aria-hidden="true">
    <AvatarFallback className="s2-avatar-fallback">{conversation.initials}</AvatarFallback>
  </ShadcnAvatar>;
}

function PersonAvatar({ name, small = false }: { name: string; small?: boolean }) {
  const tones: DemoConversation["tone"][] = ["clay", "blue", "plum", "sage", "peach"];
  const index = Math.abs(name.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0)) % tones.length;
  return <ShadcnAvatar className={"s2-avatar s2-person-avatar s2-tone-" + tones[index] + (small ? " s2-avatar-small" : "")} aria-hidden="true">
    <AvatarFallback className="s2-avatar-fallback">{name.substring(0, 1)}</AvatarFallback>
  </ShadcnAvatar>;
}

function Action({ label, onClick, children, active = false, className = "" }: {
  label: string; onClick: () => void; children: ReactNode; active?: boolean; className?: string;
}) {
  return <Button type="button" variant="ghost" size="icon" className={"s2-icon-button " + className} title={label} aria-label={label}
    aria-pressed={active} onClick={onClick}>{children}</Button>;
}

function ChoiceButtons<T extends string>({ legend, choices, value, onChange }: {
  legend: string; choices: readonly T[]; value: T; onChange: (next: T) => void;
}) {
  return <fieldset className="s2-choice-field">
    <legend>{legend}</legend>
    <ToggleGroup type="single" variant="outline" spacing={2} className="s2-choice-options" value={value}
      aria-label={legend} onValueChange={next => { if (next) onChange(next as T); }}>
      {choices.map(choice => <ToggleGroupItem value={choice} key={choice} className="s2-choice">
        {choice === value && <Check size={13} aria-hidden="true" />}
        <span>{choice.charAt(0).toUpperCase() + choice.slice(1)}</span>
      </ToggleGroupItem>)}
    </ToggleGroup>
  </fieldset>;
}

function AppearancePopout({ appearance, setAppearance }: {
  appearance: Appearance;
  setAppearance: (value: Appearance) => void;
}) {
  function change<K extends keyof Appearance>(key: K, value: Appearance[K]) {
    setAppearance({ ...appearance, [key]: value });
  }
  return <DialogContent className="s2-appearance-popout"
    data-mode={appearance.mode} data-accent={appearance.accent} data-corners={appearance.corners}
    data-elevation={appearance.elevation} data-density={appearance.density}>
    <DialogHeader className="s2-popout-header">
      <div><span className="s2-overline">MAKE IT YOURS</span><DialogTitle className="s2-popout-title">Appearance</DialogTitle></div>
    </DialogHeader>
    <DialogDescription className="s2-small-muted">
      Try the foundations before we connect any real account. Your choices stay in this browser.
    </DialogDescription>
    <ChoiceButtons legend="Accent color" choices={preferenceOptions.accent} value={appearance.accent} onChange={value => change("accent", value)}/>
    <ChoiceButtons legend="Corners" choices={preferenceOptions.corners} value={appearance.corners} onChange={value => change("corners", value)}/>
    <ChoiceButtons legend="Elevation" choices={preferenceOptions.elevation} value={appearance.elevation} onChange={value => change("elevation", value)}/>
    <ChoiceButtons legend="Density" choices={preferenceOptions.density} value={appearance.density} onChange={value => change("density", value)}/>
    <ChoiceButtons legend="Mode" choices={preferenceOptions.mode} value={appearance.mode} onChange={value => change("mode", value)}/>
    <Button type="button" variant="outline" className="s2-secondary-button s2-reset-button"
      onClick={() => setAppearance(DEFAULT_APPEARANCE)}>Reset appearance</Button>
  </DialogContent>;
}

function Overview({ section, onBack }: { section: MainSection; onBack: () => void }) {
  const isPeople = section === "people";
  return <div className="s2-overview">
    <span className="s2-overview-icon">{isPeople ? <UsersRound size={29}/> : <Leaf size={29}/>}</span>
    <span className="s2-overline">A SMALL, PERSONAL SPACE</span>
    <h2>{isPeople ? "Good people, close by." : "Little things worth keeping."}</h2>
    <p>{isPeople
      ? "Your connections will have a calm home of their own. For now, this reference focuses on conversations."
      : "Shared notes will live alongside your chats, never competing with them for attention."}</p>
    <Button variant="ghost" type="button" className="s2-primary-button" onClick={onBack}>Back to conversations <ChevronRight size={17}/></Button>
  </div>;
}

export function SengappStudio() {
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [listOpen, setListOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [section, setSection] = useState<MainSection>("chats");
  const [selectedId, setSelectedId] = useState("dev-team");
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState<DemoMessage | null>(null);
  const [threads, setThreads] = useState<Record<string, DemoMessage[]>>(initialMessages);
  const [reacted, setReacted] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const endOfThread = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = readAppearance();
    if (saved) queueMicrotask(() => setAppearance(saved));
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance)); } catch { /* browser storage can be blocked */ }
  }, [appearance]);
  useEffect(() => {
    if (mobileView === "thread") endOfThread.current?.scrollIntoView?.({ block: "nearest" });
  }, [mobileView, selectedId, threads]);

  const selected = demoConversations.find(conversation => conversation.id === selectedId) ?? demoConversations[0]!;
  const messages = threads[selected.id] ?? [];
  const visibleChats = useMemo(() => demoConversations.filter(conversation => {
    if (filter === "unread" && conversation.unread === 0) return false;
    if (filter === "groups" && conversation.kind !== "group") return false;
    const query = search.trim().toLowerCase();
    return !query || (conversation.name + " " + conversation.preview).toLowerCase().includes(query);
  }), [filter, search]);
  const unreadTotal = demoConversations.reduce((total, conversation) => total + conversation.unread, 0);

  function selectConversation(id: string) {
    setSelectedId(id);
    setReply(null);
    setDetailsOpen(false);
    setSection("chats");
    setMobileView("thread");
    setNotice(null);
  }

  function changeSection(next: MainSection) {
    setSection(next);
    setAppearanceOpen(false);
    setMobileView(next === "chats" ? "list" : "thread");
  }

  function sendMessage(event?: FormEvent) {
    event?.preventDefault();
    const value = draft.trim();
    if (!value) return;
    const message: DemoMessage = {
      id: "local-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      sender: "You", time: "Now", text: value, own: true,
      ...(reply ? { reply: { sender: reply.sender, text: (reply.text.split("\n")[0] ?? "") } } : {}),
    };
    setThreads(previous => ({ ...previous, [selectedId]: [...(previous[selectedId] ?? []), message] }));
    setDraft("");
    setReply(null);
    setNotice("Added to the local design demo — no message was sent.");
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) sendMessage(event);
  }

  function toggleReaction(messageId: string, emoji: string) {
    const key = selectedId + ":" + messageId + ":" + emoji;
    const had = reacted.includes(key);
    setReacted(previous => had ? previous.filter(value => value !== key) : [...previous, key]);
    setThreads(previous => ({
      ...previous,
      [selectedId]: (previous[selectedId] ?? []).map(message => {
        if (message.id !== messageId) return message;
        const reactions = [...(message.reactions ?? [])];
        const index = reactions.findIndex(item => item.emoji === emoji);
        if (index === -1) reactions.push({ emoji, count: 1 });
        else {
          const count = Math.max(0, reactions[index]!.count + (had ? -1 : 1));
          if (count === 0) reactions.splice(index, 1);
          else reactions[index] = { emoji, count };
        }
        return { ...message, reactions };
      }),
    }));
  }

  return <div className="s2-root" data-mode={appearance.mode} data-accent={appearance.accent}
    data-corners={appearance.corners} data-elevation={appearance.elevation}
    data-density={appearance.density} data-list-open={listOpen}
    data-details-open={detailsOpen} data-mobile-view={mobileView}>

    <SidebarProvider className="s2-stage" style={{ "--sidebar-width": "15.5rem" } as CSSProperties}>
      <SengappAppSidebar
        section={section} filter={filter} selectedId={selectedId}
        onSection={changeSection} onFilter={setFilter} onSelect={selectConversation}
        onAppearance={() => setAppearanceOpen(true)}
        onAbout={() => setNotice("Sengapp UI v2 is a design-only preview. No live messages or real accounts.")}
      />
      <SidebarInset className="s2-stage-inset">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
          <SidebarTrigger aria-label="Toggle Sidebar" />
          <Separator orientation="vertical" className="mx-1 h-4" />
          <Breadcrumb><BreadcrumbList><BreadcrumbItem>
            <BreadcrumbPage>{section === "chats" ? "Conversations" : section === "people" ? "People" : "Notes"}</BreadcrumbPage>
          </BreadcrumbItem></BreadcrumbList></Breadcrumb>
          <span role="status" className="ms-auto hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex"><Sparkles aria-hidden="true" className="size-3.5"/> UI v2 design study · Example conversations, not live messages</span>
        </header>
        <div className="s2-stage-body">
      <section className="s2-chat-list" aria-label="Conversations">
        <header className="s2-list-header">
          <div className="s2-heading-row"><div><span className="s2-overline">MESSAGES</span><h1>Conversations</h1></div>
            <Action label="Start new conversation (demo)" onClick={() => setNotice("Creating new conversations will be connected after visual approval.")} className="s2-add-button"><Plus size={20}/></Action>
          </div>
          <label className="s2-search"><Search size={17} aria-hidden="true"/><span className="s2-sr-only">Search conversations</span>
            <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a conversation…" />
          </label>
          
        </header>
        <ScrollArea className="s2-conversation-items"><div className="s2-conversation-padding">
          {visibleChats.map(conversation => <Button variant="ghost" type="button" key={conversation.id}
            className="s2-conversation" aria-current={selectedId === conversation.id && section === "chats" ? "true" : undefined}
            onClick={() => selectConversation(conversation.id)}>
            <ConversationAvatar conversation={conversation}/>
            <span className="s2-conversation-main">
              <span className="s2-conversation-top"><strong>{conversation.name}</strong><small>{conversation.time}</small></span>
              <span className="s2-conversation-bottom"><span>{conversation.preview}</span>{conversation.unread > 0 && <Badge className="s2-unread-count">{conversation.unread}</Badge>}</span>
            </span>
          </Button>)}
          {visibleChats.length === 0 && <p className="s2-no-results">Nothing here yet. Try another search.</p>}
        </div></ScrollArea>
        <div className="s2-list-footnote"><Heart size={13} aria-hidden="true"/> The good conversations live here.</div>
      </section>

      <main className="s2-thread">
        {section === "chats" ? <>
          <header className="s2-thread-header">
            <div className="s2-thread-leading">
              <Action label="Back to conversation list" className="s2-mobile-back" onClick={() => { setMobileView("list"); setDetailsOpen(false); }}><ArrowLeft size={20}/></Action>
              <Action label={listOpen ? "Hide conversation list" : "Show conversation list"} className="s2-desktop-action"
                onClick={() => setListOpen(value => !value)}>{listOpen ? <PanelLeftClose size={18}/> : <PanelLeftOpen size={18}/>}</Action>
              <ConversationAvatar conversation={selected} small/>
              <div className="s2-thread-identity"><strong>{selected.name}</strong><span>{selected.kind === "group" ? selected.members.length + " members" : "A private conversation"} <i aria-hidden="true">·</i> <em>Just us</em></span></div>
            </div>
            <div className="s2-thread-actions">
              <Action label={detailsOpen ? "Hide chat details" : "Show chat details"} active={detailsOpen}
                onClick={() => setDetailsOpen(value => !value)}>{detailsOpen ? <PanelRightClose size={19}/> : <PanelRightOpen size={19}/>}</Action>
              <Action label="More options" onClick={() => setNotice("More conversation actions arrive with the connected app.")}><MoreHorizontal size={20}/></Action>
            </div>
          </header>
          <ScrollArea className="s2-message-scroll" aria-label={"Messages in " + selected.name}><div className="s2-message-inner">
            <div className="s2-date-divider"><span>Friday, November 6</span></div>
            <div className="s2-messages">
              {messages.map(message => <div key={message.id} className={"s2-message " + (message.own ? "s2-message-own" : "")}>
                {!message.own && <PersonAvatar name={message.sender} small/>}
                <div className="s2-message-content">
                  {!message.own && <div className="s2-message-meta"><strong>{message.sender}</strong><time>{message.time}</time></div>}
                  <div className="s2-bubble">
                    {message.reply && <div className="s2-quoted"><strong>{message.reply.sender}</strong><span>{message.reply.text}</span></div>}
                    <p>{message.text}</p>
                  </div>
                  <div className="s2-message-trail">
                    {message.own && <span className="s2-own-time">{message.time} <CheckCheck size={13} aria-label="Seen in demo"/></span>}
                    {message.reactions?.map(reaction => {
                      const chosen = reacted.includes(selectedId + ":" + message.id + ":" + reaction.emoji);
                      return <Button variant="ghost" type="button" key={reaction.emoji} className="s2-reaction"
                        aria-pressed={chosen} aria-label={"React " + reaction.emoji + " to " + message.sender + "'s message"}
                        onClick={() => toggleReaction(message.id, reaction.emoji)}>{reaction.emoji}<span>{reaction.count}</span></Button>;
                    })}
                    <Button variant="ghost" type="button" className="s2-reply-action" onClick={() => setReply(message)}>Reply</Button>
                    <Button variant="ghost" type="button" className="s2-reply-action" aria-label={"Add heart reaction to " + message.sender + "'s message"}
                      onClick={() => toggleReaction(message.id, "💜")}><Smile size={15}/></Button>
                  </div>
                </div>
              </div>)}
              <div ref={endOfThread}/>
            </div>
          </div></ScrollArea>
          <div className="s2-composer-shell">
            {reply && <div className="s2-composer-reply"><span>Replying to <strong>{reply.sender}</strong><small>{(reply.text.split("\n")[0] ?? "")}</small></span>
              <Action label="Cancel reply" onClick={() => setReply(null)}><X size={16}/></Action></div>}
            <form className="s2-composer" onSubmit={sendMessage}>
              <Action label="Add a heart to your draft" onClick={() => setDraft(value => value + " 💜")}><Smile size={20}/></Action>
              <label className="s2-composer-field"><span className="s2-sr-only">Write a message</span>
                <Textarea rows={1} placeholder={"Write to " + selected.name + "…"} maxLength={3000} value={draft}
                  onChange={event => setDraft(event.target.value)} onKeyDown={handleComposerKeyDown}/></label>
              <Button variant="ghost" className="s2-send" type="submit" disabled={!draft.trim()} aria-label="Add message to local demo"><Send size={19}/></Button>
            </form>
            <p className="s2-composer-note">Design preview only · Nothing is sent to anyone</p>
          </div>
        </> : <Overview section={section} onBack={() => changeSection("chats")}/>}
      </main>

      {section === "chats" && detailsOpen && <aside className="s2-details" aria-label="Conversation details">
        <header className="s2-details-header"><strong>Details</strong><Action label="Close details" onClick={() => setDetailsOpen(false)}><X size={17}/></Action></header>
        <div className="s2-detail-intro"><ConversationAvatar conversation={selected}/><h2>{selected.name}</h2><p>{selected.kind === "group" ? selected.members.length + " members" : "Private chat"}</p></div>
        <p className="s2-detail-description">{selected.description}</p>
        <section className="s2-detail-section"><div className="s2-detail-section-heading"><h3>People</h3><span>{selected.members.length}</span></div>
          <div className="s2-member-list">{selected.members.map(member => <div className="s2-member" key={member}><PersonAvatar name={member} small/><span>{member}</span>{member === "You" && <small>you</small>}</div>)}</div>
        </section>
        <section className="s2-detail-section"><h3>Shared note</h3>
          <div className="s2-pinned-note"><Leaf size={18}/><span>{selected.pinned}</span></div>
        </section>
        <div className="s2-detail-bottom"><Bell size={15}/><span>Quiet by design. You choose what to see.</span></div>
      </aside>}

        </div>
      </SidebarInset>
    </SidebarProvider>
    <Dialog open={appearanceOpen} onOpenChange={setAppearanceOpen}>
      {appearanceOpen && <AppearancePopout appearance={appearance} setAppearance={setAppearance}/>}
    </Dialog>
    {notice && <div className="s2-notice" role="status">{notice}<Action label="Dismiss notice" onClick={() => setNotice(null)}><X size={15}/></Action></div>}
  </div>;
}
