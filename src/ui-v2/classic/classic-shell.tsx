"use client";

import { PaletteIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../vanilla/sidebar-08/app-sidebar";
import { AppearancePanel } from "../shared/appearance-panel";
import { SharedConversationPanel } from "../shared/conversation-panel";
import { ShellSwitcher } from "../shared/shell-switcher";
import { useWorkspace } from "../shared/workspace-state";

/** Standard app layout. Chat and Appearance are the same components as Cozy. */
export function ClassicShell() {
  const workspace = useWorkspace();
  return (
    <SidebarProvider className="h-dvh min-h-0" data-testid="classic-shell">
      <AppSidebar
        selectedId={workspace.selectedId}
        onChooseConversation={workspace.select}
        onNavigate={workspace.navigate}
        filter={workspace.filter}
      />
      <SidebarInset className="flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden bg-background">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-card px-3 sm:px-5">
          <SidebarTrigger className="-ms-1" aria-label="Toggle Sidebar" />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">Sengapp</span>
            <span className="hidden text-xs text-muted-foreground sm:block">A little closer</span>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Appearance settings" className="xl:hidden">
                <PaletteIcon className="size-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85dvh] overflow-y-auto p-0">
              <DialogHeader className="sr-only"><DialogTitle>Appearance settings</DialogTitle></DialogHeader>
              <AppearancePanel embedded />
            </DialogContent>
          </Dialog>
          <ShellSwitcher />
        </header>
        <main className="flex min-h-0 min-w-0 flex-1 gap-3 p-2 sm:p-4" data-testid="classic-content">
          <SharedConversationPanel className="min-w-0" />
          <aside className="hidden w-[280px] shrink-0 xl:block" aria-label="Appearance">
            <AppearancePanel />
          </aside>
        </main>
        <footer className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 text-xs text-muted-foreground">
          <span>Shared components · Classic shell</span>
          <Badge variant="outline">UI preview only</Badge>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
