import { CHARACTERS, BY_ID } from "./data.js";
export const SAVE_KEY = "kirameki-post-v1";
export const COST = { 1: 300, 10: 2700 };
export const freshSave = () => ({
  version: 1,
  gems: 6000,
  total: 0,
  pity: 0,
  firstTen: true,
  collection: {},
  favorites: [],
  daily: "",
  restAt: 0,
  sound: false,
});
export const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};
export function validateSave(value) {
  if (!value || value.version !== 1) throw new Error("セーブ形式が違います");
  const s = { ...freshSave(), ...value };
  for (const key of ["gems", "total", "pity", "restAt"])
    if (!Number.isSafeInteger(s[key]) || s[key] < 0)
      throw new Error("不正なセーブデータ");
  if (
    s.pity > 49 ||
    typeof s.firstTen !== "boolean" ||
    typeof s.daily !== "string" ||
    typeof s.sound !== "boolean" ||
    !s.collection ||
    Array.isArray(s.collection) ||
    typeof s.collection !== "object"
  )
    throw new Error("不正なセーブデータ");
  const clean = {};
  for (const [id, c] of Object.entries(s.collection))
    if (BY_ID[id]) {
      if (
        !c ||
        !Number.isSafeInteger(c.count) ||
        c.count < 1 ||
        typeof c.holo !== "boolean"
      )
        throw new Error("不正なコレクション");
      clean[id] = { count: c.count, holo: c.holo };
    }
  s.collection = clean;
  s.favorites = Array.isArray(s.favorites)
    ? [...new Set(s.favorites.filter((id) => clean[id]))]
    : [];
  return s;
}
export function draw(save, count, random = Math.random) {
  if (!COST[count] || save.gems < COST[count])
    throw new Error("きらめきが足りません");
  const next = {
    ...save,
    collection: structuredClone(save.collection),
    gems: save.gems - COST[count],
  };
  const results = [];
  for (let i = 0; i < count; i++) {
    let rarity;
    const roll = random();
    const firstGuarantee =
      count === 10 &&
      save.firstTen &&
      i === 9 &&
      !results.some((r) => r.character.rarity === "SSR");
    if (next.pity === 49 || firstGuarantee) rarity = "SSR";
    else if (
      count === 10 &&
      i === 9 &&
      !results.some((r) => r.character.rarity !== "R")
    )
      rarity = roll < 0.03 ? "SSR" : "SR";
    else rarity = roll < 0.03 ? "SSR" : roll < 0.2 ? "SR" : "R";
    const pool = CHARACTERS.filter((c) => c.rarity === rarity);
    const character =
      rarity === "SSR"
        ? random() < 0.5
          ? pool[0]
          : pool[1 + Math.floor(random() * (pool.length - 1))]
        : pool[Math.floor(random() * pool.length)];
    const previous = next.collection[character.id];
    const holo = random() < 0.04;
    results.push({ character, isNew: !previous, holo, duplicate: !!previous });
    next.collection[character.id] = {
      count: (previous?.count || 0) + 1,
      holo: holo || previous?.holo || false,
    };
    if (previous) next.gems += 60;
    next.pity = rarity === "SSR" ? 0 : next.pity + 1;
    next.total++;
  }
  if (count === 10) next.firstTen = false;
  return { next, results };
}
export function affection(count) {
  return count >= 10 ? 5 : count >= 5 ? 4 : count >= 3 ? 3 : count >= 2 ? 2 : 1;
}
