"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "../vanilla/sidebar-08/app-sidebar";
import { AppearanceDrawer, AppearanceToggle } from "../shared/appearance-drawer";
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
          <AppearanceToggle />
          <ShellSwitcher />
        </header>
        <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden" data-testid="classic-content">
          <div className="flex min-h-0 min-w-0 flex-1 p-2 sm:p-4">
            <SharedConversationPanel className="min-w-0" />
          </div>
          <AppearanceDrawer />
        </main>
        <footer className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 text-xs text-muted-foreground">
          <span>Shared components · Classic shell</span>
          <Badge variant="outline">UI preview only</Badge>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
