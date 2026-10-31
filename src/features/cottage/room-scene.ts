import Phaser from "phaser";
import { CATALOG, ROOM, type RoomItem, type FurnitureId, type LightPreset, toScreen, toCell, canPlace, updatePlacement } from "./room-model";

const ASSETS = "/lab/cottage";
type Callbacks = { onChange(items: RoomItem[]): void; onHover(label: string | null): void };

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

  constructor(items: RoomItem[], callbacks: Callbacks) {
    super({ key: "cottage-room" });
    this.items = items.map(item => ({ ...item }));
    this.callbacks = callbacks;
  }

  preload() {
    this.load.svg("forest-shell", `${ASSETS}/forest-room.svg`, { width: ROOM.width, height: ROOM.height });
    for (const [id, size] of Object.entries(CATALOG)) {
      this.load.svg(`item-${id}`, `${ASSETS}/${id}.svg`, { width: size.width, height: size.height });
    }
    this.load.svg("lamp-glow", `${ASSETS}/lamp-glow.svg`, { width: 340, height: 340 });
  }

  create() {
    this.cameras.main.setBackgroundColor("#e4ece0");
    this.add.image(ROOM.width / 2, ROOM.height / 2, "forest-shell").setDepth(-1000);
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
    this.setLight("day");
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
  setEditMode(editing: boolean) { this.editing = editing; this.dragging = undefined; }
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
  update(_time: number, delta: number) {
    if (!this.lampGlow || this.light !== "evening") return;
    this.glowTime += delta * .001;
    this.lampGlow.setAlpha(.7 + Math.sin(this.glowTime * 2.1) * .04);
  }
}
