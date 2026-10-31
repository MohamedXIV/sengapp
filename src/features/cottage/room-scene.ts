import Phaser from "phaser";
import { CATALOG, ROOM, type RoomItem, type FurnitureId, type LightPreset, toScreen, toCell, canPlace, updatePlacement } from "./room-model";
import { CAMERA, ROOM_BOUNDS, ROOM_CENTER, type CameraView, clampView, fitZoom, zoomAt } from "./room-camera";

const ASSETS = "/lab/cottage";
type Callbacks = {
  onChange(items: RoomItem[]): void;
  onHover(label: string | null): void;
  onViewChange(view: CameraView): void;
};

export class RoomScene extends Phaser.Scene {
  private items: RoomItem[];
  private callbacks: Callbacks;
  private editing = false;
  private light: LightPreset = "day";
  private objects = new Map<FurnitureId, Phaser.GameObjects.Image>();
  private nightShade?: Phaser.GameObjects.Rectangle;
  private lampGlow?: Phaser.GameObjects.Image;
  private dragging?: { id: FurnitureId; x: number; y: number };
  private glowTime = 0;
  private viewport: { width: number; height: number } = { width: ROOM.width, height: ROOM.height };
  private view: CameraView = { level: 1, ...ROOM_CENTER };
  private pointers = new Map<number, { x: number; y: number }>();
  private pinch: { midpoint: { x: number; y: number }; distance: number } | null = null;

  constructor(items: RoomItem[], callbacks: Callbacks) {
    super({ key: "cottage-room" });
    this.items = items.map(item => ({ ...item }));
    this.callbacks = callbacks;
  }

  preload() {
    this.load.svg("forest-shell", `${ASSETS}/forest-room.svg`, { width: ROOM_BOUNDS.width, height: ROOM_BOUNDS.height });
    for (const [id, size] of Object.entries(CATALOG)) {
      this.load.svg(`item-${id}`, `${ASSETS}/${id}.svg`, { width: size.width, height: size.height });
    }
    this.load.svg("lamp-glow", `${ASSETS}/lamp-glow.svg`, { width: 340, height: 340 });
  }

  create() {
    // Let the CSS stage show through the full-viewport transparent renderer.
    // A Camera background would otherwise paint the obvious rectangular seam.
    this.scale.on("resize", this.onViewportResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.onViewportResize, this);
    });
    this.fitViewport(this.scale.gameSize.width, this.scale.gameSize.height);
    this.add.image(ROOM_BOUNDS.x, ROOM_BOUNDS.y, "forest-shell")
      .setOrigin(0, 0).setDepth(-1000);
    for (const item of this.items) this.makeFurniture(item);

    this.nightShade = this.add.rectangle(ROOM.width / 2, ROOM.height / 2,
      ROOM.width, ROOM.height, 0x263759, 0).setDepth(1000);
    this.lampGlow = this.add.image(588, 318, "lamp-glow").setAlpha(0.1).setDepth(1001);
    this.lampGlow.setBlendMode(Phaser.BlendModes.ADD);

    this.input.on("dragstart", (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image) => {
      if (!this.editing) return;
      const id = gameObject.getData("itemId") as FurnitureId;
      const current = this.items.find(item => item.id === id);
      if (!current) return;
      this.dragging = { ...current };
      gameObject.setAlpha(.76);
      this.children.bringToTop(gameObject);
    });
    this.input.on("drag", (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, x: number, y: number) => {
      if (!this.editing || !this.dragging || gameObject.getData("itemId") !== this.dragging.id) return;
      const cell = toCell(x, y);
      if (!canPlace(this.items, this.dragging.id, cell.x, cell.y)) {
        gameObject.setTint(0xe88373);
        return;
      }
      gameObject.clearTint();
      const pos = toScreen(cell.x, cell.y);
      gameObject.setPosition(pos.x, pos.y);
    });
    this.input.on("dragend", (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Image, _dropped: boolean) => {
      if (!this.dragging || gameObject.getData("itemId") !== this.dragging.id) return;
      const start = this.dragging;
      const cell = toCell(gameObject.x, gameObject.y);
      this.items = updatePlacement(this.items, start.id, cell.x, cell.y);
      const actual = this.items.find(item => item.id === start.id)!;
      this.positionObject(gameObject, actual);
      gameObject.setAlpha(1).clearTint();
      this.dragging = undefined;
      this.callbacks.onChange(this.items.map(item => ({ ...item })));
    });
    this.setLight(this.light);
    this.input.addPointer(2);

    // Pan using one finger or a mouse drag. Two fingers pinch/translate.
    // While editing furniture, scene camera gestures are disabled.
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.editing) return;
      this.pointers.set(pointer.id, { x: pointer.x, y: pointer.y });
      this.pinch = null;
    });
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.editing || !pointer.isDown) return;
      const previous = this.pointers.get(pointer.id);
      if (!previous) return;
      this.pointers.set(pointer.id, { x: pointer.x, y: pointer.y });
      if (this.pointers.size >= 2) {
        const [a, b] = [...this.pointers.values()].slice(0, 2);
        if (!a || !b) return;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (this.pinch && this.pinch.distance > 1 && distance > 1) {
          this.applyView(zoomAt(this.view, this.view.level * distance / this.pinch.distance,
            this.viewport, this.pinch.midpoint, midpoint));
        }
        this.pinch = { distance, midpoint };
      } else {
        const zoom = fitZoom(this.viewport.width, this.viewport.height) * this.view.level;
        this.applyView({ ...this.view,
          x: this.view.x - (pointer.x - previous.x) / zoom,
          y: this.view.y - (pointer.y - previous.y) / zoom });
      }
    });
    const endPointer = (pointer: Phaser.Input.Pointer) => {
      this.pointers.delete(pointer.id);
      this.pinch = null;
    };
    this.input.on("pointerup", endPointer);
    this.input.on("pointerupoutside", endPointer);
    this.input.on("gameout", () => { this.pointers.clear(); this.pinch = null; });
    this.input.on("wheel", (pointer: Phaser.Input.Pointer, _over: unknown,
      _dx: number, dy: number) => {
      if (!dy) return;
      const factor = dy < 0 ? CAMERA.wheelFactor : 1 / CAMERA.wheelFactor;
      this.zoomBy(factor, { x: pointer.x, y: pointer.y });
    });
  }

  private onViewportResize(gameSize: Phaser.Structs.Size) {
    this.fitViewport(gameSize.width, gameSize.height);
  }

  private fitViewport(width: number, height: number) {
    if (width < 1 || height < 1) return;
    this.viewport = { width, height };
    this.cameras.main.setSize(width, height);
    this.applyView(this.view.level === CAMERA.minLevel
      ? { level: 1, ...ROOM_CENTER } : this.view);
  }

  private applyView(view: CameraView) {
    this.view = clampView(view, this.viewport.width, this.viewport.height);
    this.cameras.main.setZoom(fitZoom(this.viewport.width, this.viewport.height) * this.view.level);
    this.cameras.main.centerOn(this.view.x, this.view.y);
    this.callbacks.onViewChange({ ...this.view });
  }

  zoomBy(factor: number, anchor = { x: this.viewport.width / 2, y: this.viewport.height / 2 }) {
    if (!this.scene.isActive()) return;
    this.applyView(zoomAt(this.view, this.view.level * factor, this.viewport, anchor));
  }

  fitRoom() {
    if (!this.scene.isActive()) return;
    this.applyView({ level: 1, ...ROOM_CENTER });
  }

  private makeFurniture(item: RoomItem) {
    const pos = toScreen(item.x, item.y);
    const sprite = this.add.image(pos.x, pos.y, `item-${item.id}`).setOrigin(.5, 1);
    sprite.setData("itemId", item.id);
    sprite.setDepth(CATALOG[item.id].floor ? 0 : pos.y);
    sprite.setInteractive({ useHandCursor: true });
    this.input.setDraggable(sprite);
    sprite.on("pointerover", () => this.callbacks.onHover(CATALOG[item.id].name));
    sprite.on("pointerout", () => this.callbacks.onHover(null));
    sprite.on("pointerdown", () => {
      if (!this.editing) this.callbacks.onHover(`${CATALOG[item.id].name} · turn on Edit room to move`);
    });
    this.objects.set(item.id, sprite);
  }

  private positionObject(sprite: Phaser.GameObjects.Image, item: RoomItem) {
    const pos = toScreen(item.x, item.y);
    sprite.setPosition(pos.x, pos.y);
    sprite.setDepth(CATALOG[item.id].floor ? 0 : pos.y);
  }

  setCallbacks(callbacks: Callbacks) { this.callbacks = callbacks; }
  setEditMode(editing: boolean) {
    this.editing = editing;
    this.dragging = undefined;
    this.pointers.clear();
    this.pinch = null;
  }
  setLight(light: LightPreset) {
    this.light = light;
    this.nightShade?.setAlpha(light === "evening" ? .34 : 0);
    this.lampGlow?.setAlpha(light === "evening" ? .72 : .08);
  }
  setItems(items: RoomItem[]) {
    this.items = items.map(item => ({ ...item }));
    for (const item of this.items) {
      const sprite = this.objects.get(item.id);
      if (sprite) this.positionObject(sprite, item);
    }
  }
  override update(_time: number, delta: number) {
    if (!this.lampGlow || this.light !== "evening") return;
    this.glowTime += delta * .001;
    this.lampGlow.setAlpha(.7 + Math.sin(this.glowTime * 2.1) * .04);
  }
}
