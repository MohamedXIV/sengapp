"use client";
import { useEffect, useRef } from "react";
import type { RoomItem, LightPreset } from "./room-model";
import type { RoomScene } from "./room-scene";

export function RoomCanvas({ items, editing, light, onChange, onHover }: {
  items: RoomItem[]; editing: boolean; light: LightPreset;
  onChange(items: RoomItem[]): void; onHover(label: string | null): void;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const scene = useRef<RoomScene | null>(null);
  const callbacks = useRef({ onChange, onHover });

  const latestItems = useRef(items);
  const latestEditing = useRef(editing);
  const latestLight = useRef(light);

  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    let disposed = false;
    let game: import("phaser").Game | null = null;
    const onVisibility = () => {
      if (!game) return;
      const liveScene = scene.current;
      if (!liveScene) return;
      if (document.hidden) liveScene.scene.pause();
      else liveScene.scene.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    void Promise.all([import("phaser"), import("./room-scene")]).then(([{ default: Phaser }, { RoomScene }]) => {
      if (disposed) return;
      const room = new RoomScene(latestItems.current, {
        onChange: value => callbacks.current.onChange(value),
        onHover: value => callbacks.current.onHover(value),
      });
      scene.current = room;
      room.setEditMode(latestEditing.current);
      room.setLight(latestLight.current);
      game = new Phaser.Game({
        type: Phaser.AUTO, parent: element, width: 900, height: 620,
        transparent: true, antialias: true,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        fps: { target: 30 },
        scene: [room],
      });
    }).catch(error => {
      if (!disposed) {
        console.error("Room renderer failed to start", error);
        element.dataset.error = "true";
      }
    });
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      scene.current = null;
      game?.destroy(true);
      element.replaceChildren();
    };
  }, []);

  useEffect(() => { latestEditing.current = editing; scene.current?.setEditMode(editing); }, [editing]);
  useEffect(() => { latestLight.current = light; scene.current?.setLight(light); }, [light]);
  useEffect(() => { latestItems.current = items; scene.current?.setItems(items); }, [items]);
  useEffect(() => {
    callbacks.current = { onChange, onHover };
    scene.current?.setCallbacks(callbacks.current);
  }, [onChange, onHover]);

  return <div ref={mount} data-testid="cottage-canvas" role="img"
    aria-label="An isometric woodland cottage with individually movable furniture. Enable Edit room to rearrange."
    className="cottage-renderer relative aspect-[900/620] w-full max-w-[900px]" />;
}
