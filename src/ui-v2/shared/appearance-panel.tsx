"use client";

import { PaletteIcon, RotateCcwIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_APPEARANCE, useWorkspace, type Accent, type Corners, type Shadow,
} from "./workspace-state";

const COLORS: { id: Accent; label: string; color: string }[] = [
  { id: "sage", label: "Sage", color: "#768f80" },
  { id: "rose", label: "Rose", color: "#c58b79" },
  { id: "lavender", label: "Lavender", color: "#9a9fb9" },
  { id: "honey", label: "Honey", color: "#cdbb83" },
];
const RADII: { id: Corners; label: string }[] = [
  { id: "soft", label: "Subtle" }, { id: "balanced", label: "Balanced" }, { id: "round", label: "Round" },
];
const SHADOWS: { id: Shadow; label: string }[] = [
  { id: "none", label: "None" }, { id: "soft", label: "Soft" }, { id: "deep", label: "Deep" },
];

/** Shared token settings. Changes apply to both shells, not individual components. */
export function AppearancePanel({ embedded = false }: { embedded?: boolean }) {
  const { appearance, updateAppearance } = useWorkspace();
  return (
    <Card
      data-testid="shared-appearance-panel"
      className={embedded ? "flex h-full flex-col gap-0 overflow-auto rounded-none border-0 shadow-none" : "flex h-full flex-col gap-0 overflow-auto"}
    >
      <CardHeader className="px-5 py-5">
        <div className="flex items-center gap-2">
          <PaletteIcon className="size-4 text-muted-foreground" />
          <CardTitle>Appearance</CardTitle>
        </div>
        <CardDescription>One style for Classic and Cozy.</CardDescription>
        <Badge className="w-fit" variant="outline">Preview preferences</Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-7 px-5 pb-5 pt-2">
        <div className="space-y-3">
          <Label>Accent color</Label>
          <div role="group" aria-label="Accent color" className="flex flex-wrap gap-3">
            {COLORS.map(option => (
              <button
                type="button" key={option.id}
                aria-label={option.label + " accent"}
                aria-pressed={appearance.accent === option.id}
                onClick={() => updateAppearance({ accent: option.id })}
                className="flex size-9 items-center justify-center rounded-full border-2 border-transparent outline-offset-4 focus-visible:outline-2 focus-visible:outline-ring aria-pressed:border-foreground"
              >
                <span className="size-7 rounded-full" style={{ backgroundColor: option.color }} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Label>Corner radius</Label>
          <div role="group" aria-label="Corner radius" className="flex flex-wrap gap-2">
            {RADII.map(option => (
              <Button
                key={option.id} size="sm" type="button"
                variant={appearance.corners === option.id ? "secondary" : "outline"}
                aria-pressed={appearance.corners === option.id}
                onClick={() => updateAppearance({ corners: option.id })}
              >{option.label}</Button>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Label>Shadow depth</Label>
          <div role="group" aria-label="Shadow depth" className="flex flex-wrap gap-2">
            {SHADOWS.map(option => (
              <Button
                key={option.id} type="button" size="sm"
                variant={appearance.shadow === option.id ? "secondary" : "outline"}
                aria-pressed={appearance.shadow === option.id}
                onClick={() => updateAppearance({ shadow: option.id })}
              >{option.label}</Button>
            ))}
          </div>
        </div>
        <Button
          type="button" variant="ghost" size="sm" className="w-fit text-muted-foreground"
          onClick={() => updateAppearance(DEFAULT_APPEARANCE)}
        ><RotateCcwIcon className="size-4" /> Restore defaults</Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Colors, corners and elevation are shared across both shells.
          These are local UI v2 preferences, not account settings yet.
        </p>
      </CardContent>
    </Card>
  );
}
