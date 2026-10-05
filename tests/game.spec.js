import { test, expect } from "@playwright/test";
import { BY_ID } from "../src/data.js";
import { freshSave, SAVE_KEY } from "../src/game.js";

test("10 letters, guaranteed SSR, collection filters, favorites and reload", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: /10回ひく/ }).click();
  await expect(page.getByRole("dialog", { name: "ガチャ結果" })).toBeVisible();
  await page.getByRole("button", { name: "手紙を開く", exact: true }).click();
  await expect(page.locator(".reveal-card")).toBeVisible();
  await page.getByRole("button", { name: "演出をスキップ" }).click();
  await expect(page.locator(".result-card")).toHaveCount(10);
  expect(await page.locator(".result-card.SSR").count()).toBeGreaterThanOrEqual(
    1,
  );
  await page.getByRole("button", { name: "コレクションを見る" }).click();
  await expect(page.locator(".collection-card")).toHaveCount(20);
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)),
    SAVE_KEY,
  );
  expect(saved.total).toBe(10);
  expect(saved.firstTen).toBe(false);
  const id = Object.keys(saved.collection)[0];
  const c = BY_ID[id];
  await page.getByRole("textbox", { name: "キャラクターを検索" }).fill(c.name);
  await expect(page.locator(".collection-card")).toHaveCount(1);
  await page.locator(".collection-card").click();
  await page.getByRole("button", { name: "お気に入りにする" }).click();
  await expect(
    page.getByRole("button", { name: "お気に入りに登録済み" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: /コレクション/ })
    .first()
    .click();
  await page.getByLabel("お気に入り", { exact: true }).check();
  await expect(page.locator(".collection-card")).toHaveCount(1);
  await page
    .getByRole("textbox", { name: "キャラクターを検索" })
    .fill("存在しない名前");
  await expect(page.getByText("まだ、見つかりませんでした。")).toBeVisible();
  expect(errors).toEqual([]);
});
test("daily reward is idempotent; recharge is free and has a cooldown", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "贈りもの", exact: true }).click();
  await page.getByRole("button", { name: "今日の贈りものを受け取る" }).click();
  await expect(
    page.getByRole("button", { name: /受け取り済み/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  await page.getByRole("button", { name: /所持きらめき/ }).click();
  await page.getByRole("button", { name: "ひとやすみして受け取る" }).click();
  await expect(
    page.getByRole("button", { name: /所持きらめき 10500/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: /所持きらめき/ }).click();
  await expect(
    page.getByRole("button", { name: /次のチャージまで/ }),
  ).toBeDisabled();
});
test("single draw, lack of currency, sound, export and import", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /1回ひく/ }).click();
  await page.getByRole("button", { name: "手紙を開く", exact: true }).click();
  await expect(page.locator(".reveal-card")).toBeVisible();
  await page.getByRole("button", { name: /出会いを振り返る/ }).click();
  await expect(page.locator(".result-card")).toHaveCount(1);
  await page.getByRole("button", { name: "ガチャに戻る" }).click();
  await page.getByRole("button", { name: "設定を開く" }).click();
  await page.getByRole("switch", { name: "サウンド" }).click();
  await expect(page.getByRole("switch")).toBeChecked();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "セーブデータを書き出す" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "kirameki-post-save.json",
  );
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "save.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify({ ...freshSave(), gems: 0 })),
    });
  await page.getByRole("button", { name: /1回ひく/ }).click();
  await expect(
    page.getByRole("dialog", { name: "ひとやすみ、しませんか。" }),
  ).toBeVisible();
});
test("mobile layout, rates dialog, keyboard focus and responsive collection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "提供割合・ガチャのルール" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => document.activeElement.closest("[role=dialog]") !== null,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /10回ひく/ }).click();
  await page.getByRole("button", { name: "演出をスキップ" }).click();
  await expect(page.locator(".result-card")).toHaveCount(10);
  expect(
    await page
      .locator(".gacha-overlay")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.getByRole("button", { name: "コレクションを見る" }).click();
  await page.getByRole("button", { name: "SSR", exact: true }).click();
  await expect(page.locator(".collection-card")).toHaveCount(4);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
