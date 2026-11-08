"use client";

import { ClassicShell } from "../classic/classic-shell";
import { CozyShell } from "../cozy/cozy-shell";
import { WorkspaceProvider, useWorkspace } from "../shared/workspace-state";

/** Isolated visual lab: a single state and component tree, two interchangeable shells. */
function WorkspaceSurface() {
  const { shell, appearance } = useWorkspace();
  return (
    <div
      data-sengapp-shadcn-blocks
      data-shell={shell}
      data-accent={appearance.accent}
      data-corners={appearance.corners}
      data-shadow={appearance.shadow}
      className="h-dvh min-h-0 w-full overflow-hidden bg-background text-foreground"
    >
      {shell === "classic" ? <ClassicShell /> : <CozyShell />}
    </div>
  );
}

export function VanillaMessenger() {
  return (
    <WorkspaceProvider>
      <WorkspaceSurface />
    </WorkspaceProvider>
  );
}
