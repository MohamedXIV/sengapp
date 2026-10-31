export const ROOM = {
  width: 900, height: 620, columns: 7, rows: 7,
  originX: 450, originY: 220, halfTileWidth: 48, halfTileHeight: 24,
} as const;

export type FurnitureId = "rug" | "sofa" | "desk" | "chair" | "plant" | "lamp" | "cat";
export type RoomItem = { id: FurnitureId; x: number; y: number };
export type LightPreset = "day" | "evening";
export const STORAGE = {
  furniture: "sengapp-lab-room-v1",
  windows: "sengapp-lab-dockview-v1",
  notes: "sengapp-lab-notes-v1",
} as const;

export const CATALOG: Record<FurnitureId, { name: string; width: number; height: number; floor?: boolean }> = {
  rug: { name: "Mossy rug", width: 212, height: 91, floor: true },
  sofa: { name: "Reading sofa", width: 176, height: 159 },
  desk: { name: "Writing desk", width: 190, height: 160 },
  chair: { name: "Soft chair", width: 125, height: 148 },
  plant: { name: "Window plant", width: 105, height: 142 },
  lamp: { name: "Little lamp", width: 91, height: 117 },
  cat: { name: "Sleepy friend", width: 107, height: 76 },
};

export const INITIAL_ITEMS: RoomItem[] = [
  { id: "rug", x: 3, y: 3 },
  { id: "sofa", x: 1, y: 2 },
  { id: "desk", x: 4, y: 1 },
  { id: "chair", x: 4, y: 3 },
  { id: "plant", x: 5, y: 1 },
  { id: "lamp", x: 2, y: 1 },
  { id: "cat", x: 2, y: 4 },
];

export function toScreen(x: number, y: number) {
  return {
    x: ROOM.originX + (x - y) * ROOM.halfTileWidth,
    y: ROOM.originY + (x + y) * ROOM.halfTileHeight,
  };
}

export function toCell(screenX: number, screenY: number) {
  const dx = (screenX - ROOM.originX) / ROOM.halfTileWidth;
  const dy = (screenY - ROOM.originY) / ROOM.halfTileHeight;
  return { x: Math.round((dy + dx) / 2), y: Math.round((dy - dx) / 2) };
}

export function inRoom(x: number, y: number) {
  return Number.isInteger(x) && Number.isInteger(y)
    && x >= 0 && y >= 0 && x < ROOM.columns && y < ROOM.rows;
}

export function canPlace(items: RoomItem[], draggedId: FurnitureId, x: number, y: number) {
  if (!inRoom(x, y)) return false;
  const item = CATALOG[draggedId];
  return item.floor || !items.some(other =>
    other.id !== draggedId && !CATALOG[other.id].floor && other.x === x && other.y === y);
}

export function updatePlacement(items: RoomItem[], id: FurnitureId, x: number, y: number): RoomItem[] {
  if (!canPlace(items, id, x, y)) return items;
  return items.map(item => item.id === id ? { ...item, x, y } : item);
}

export function parseRoom(raw: string | null): RoomItem[] {
  if (!raw) return INITIAL_ITEMS.map(item => ({ ...item }));
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length !== INITIAL_ITEMS.length) return INITIAL_ITEMS.map(item => ({ ...item }));
    const entries = value as Partial<RoomItem>[];
    const ids = new Set(entries.map(item => item.id));
    if (ids.size !== INITIAL_ITEMS.length) return INITIAL_ITEMS.map(item => ({ ...item }));
    for (const item of entries) {
      if (typeof item.id !== "string" || !(item.id in CATALOG) || !inRoom(item.x!, item.y!))
        return INITIAL_ITEMS.map(item => ({ ...item }));
    }
    for (const item of entries) {
      if (!CATALOG[item.id as FurnitureId].floor && entries.some(other =>
        other !== item && other.x === item.x && other.y === item.y
        && !CATALOG[other.id as FurnitureId].floor)) return INITIAL_ITEMS.map(i => ({ ...i }));
    }
    return entries as RoomItem[];
  } catch { return INITIAL_ITEMS.map(item => ({ ...item })); }
}
