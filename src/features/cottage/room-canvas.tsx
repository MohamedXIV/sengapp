"use client";
import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { CAMERA, WORLD_BOUNDS, type CameraView } from "./room-camera";
import type { RoomItem, LightPreset } from "./room-model";
import type { RoomScene } from "./room-scene";

export type RoomCanvasHandle = { zoomIn(): void; zoomOut(): void; fit(): void; fitWorld(): void };

export function RoomCanvas({ items, editing, light, onChange, onHover, onViewChange, ref }: {
  items: RoomItem[]; editing: boolean; light: LightPreset;
  onChange(items: RoomItem[]): void; onHover(label: string | null): void;
  onViewChange(view: CameraView): void;
  ref?: Ref<RoomCanvasHandle>;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const scene = useRef<RoomScene | null>(null);
  const callbacks = useRef({ onChange, onHover, onViewChange });

  const latestItems = useRef(items);
  const latestEditing = useRef(editing);
  const latestLight = useRef(light);

  useImperativeHandle(ref, () => ({
    zoomIn: () => scene.current?.zoomBy(CAMERA.buttonFactor),
    zoomOut: () => scene.current?.zoomBy(1 / CAMERA.buttonFactor),
    fit: () => scene.current?.fitRoom(),
    fitWorld: () => scene.current?.fitWorld(),
  }), []);

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
        onViewChange: view => callbacks.current.onViewChange(view),
      });
      scene.current = room;
      room.setEditMode(latestEditing.current);
      room.setLight(latestLight.current);
      game = new Phaser.Game({
        type: Phaser.AUTO, parent: element,
        width: WORLD_BOUNDS.width, height: WORLD_BOUNDS.height,
        transparent: true, backgroundColor: "rgba(0,0,0,0)", antialias: true,
        scale: { mode: Phaser.Scale.RESIZE },
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
    callbacks.current = { onChange, onHover, onViewChange };
    scene.current?.setCallbacks(callbacks.current);
  }, [onChange, onHover, onViewChange]);

  return <div ref={mount} data-testid="cottage-canvas" role="img"
    aria-label="An isometric woodland cottage with individually movable furniture. Enable Edit room to rearrange."
    className="cottage-renderer absolute inset-0" data-world-aspect={WORLD_BOUNDS.aspect} />;
}
