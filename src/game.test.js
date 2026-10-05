import test from "node:test";
import assert from "node:assert/strict";
import { freshSave, draw, validateSave, affection } from "./game.js";
import { CHARACTERS } from "./data.js";

test("20 distinct adult characters with the expected rarity pools", () => {
  assert.equal(new Set(CHARACTERS.map((c) => c.id)).size, 20);
  assert.ok(CHARACTERS.every((c) => c.age >= 20));
  assert.deepEqual(
    ["SSR", "SR", "R"].map(
      (r) => CHARACTERS.filter((c) => c.rarity === r).length,
    ),
    [4, 6, 10],
  );
});
test("first ten pull guarantees SSR; duplicates reward gems and retain counts", () => {
  const before = freshSave();
  const { next, results } = draw(before, 10, () => 0.9);
  assert.equal(results.length, 10);
  assert.equal(results[9].character.rarity, "SSR");
  assert.equal(next.firstTen, false);
  assert.equal(next.total, 10);
  assert.equal(next.pity, 0);
  assert.equal(next.gems, 6000 - 2700 + 8 * 60);
  assert.equal(
    Object.values(next.collection).reduce((n, c) => n + c.count, 0),
    10,
  );
  assert.equal(before.gems, 6000);
  assert.deepEqual(before.collection, {});
});
test("subsequent ten pull has an SR floor without forcing extra SSR", () => {
  const { next, results } = draw(
    { ...freshSave(), firstTen: false },
    10,
    () => 0.9,
  );
  assert.equal(results[9].character.rarity, "SR");
  assert.equal(next.pity, 10);
});
test("50th pull pity works across batches and resets on SSR", () => {
  const { next, results } = draw(
    { ...freshSave(), firstTen: false, pity: 45 },
    10,
    () => 0.9,
  );
  assert.equal(results[4].character.rarity, "SSR");
  assert.equal(next.pity, 5);
  const single = draw({ ...freshSave(), pity: 49 }, 1, () => 0.9);
  assert.equal(single.results[0].character.rarity, "SSR");
  assert.equal(single.next.pity, 0);
});
test("insufficient currency and invalid counts are rejected without mutating the save", () => {
  const save = { ...freshSave(), gems: 299 };
  assert.throws(() => draw(save, 1));
  assert.equal(save.gems, 299);
  assert.throws(() => draw(freshSave(), 2));
});
test("rare roll, hologram preservation, and affection thresholds", () => {
  const first = draw(freshSave(), 1, () => 0);
  assert.equal(first.results[0].character.id, "hikari");
  assert.equal(first.results[0].holo, true);
  const values = [0, 0, 0.9];
  const second = draw(first.next, 1, () => values.shift());
  assert.equal(second.next.collection.hikari.holo, true);
  assert.equal(second.results[0].isNew, false);
  assert.equal(second.next.collection.hikari.count, 2);
  assert.deepEqual([1, 2, 3, 5, 10].map(affection), [1, 2, 3, 4, 5]);
});
test("save round trip and corrupted data validation", () => {
  const { next } = draw(freshSave(), 10, () => 0.8);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(next))), next);
  for (const bad of [
    null,
    {},
    { ...next, gems: -1 },
    { ...next, pity: 50 },
    { ...next, collection: { hikari: { count: 0, holo: false } } },
    { ...next, sound: "yes" },
  ])
    assert.throws(() => validateSave(bad));
});
test("base rates and conditional pickup proportions over deterministic 100,000 draws", () => {
  let seed = 4921;
  const rng = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const frequencies = { SSR: 0, SR: 0, R: 0, hikari: 0 };
  for (let i = 0; i < 100000; i++) {
    const c = draw(freshSave(), 1, rng).results[0].character;
    frequencies[c.rarity]++;
    if (c.id === "hikari") frequencies.hikari++;
  }
  assert.ok(Math.abs(frequencies.SSR / 100000 - 0.03) < 0.003);
  assert.ok(Math.abs(frequencies.SR / 100000 - 0.17) < 0.005);
  assert.ok(Math.abs(frequencies.R / 100000 - 0.8) < 0.005);
  assert.ok(Math.abs(frequencies.hikari / frequencies.SSR - 0.5) < 0.04);
});
