import { expect, type Page, test } from "@playwright/test";
import { HOW_TO_PLAY_SLIDES } from "../src/components/how-to-play/slides";
import { PageHelper } from "./helpers/PageHelper";

let helper: PageHelper;

const modal = (page: Page) => page.locator("#howToPlayModal");
const backButton = (page: Page) => page.locator("#howToPlayBack");
const nextButton = (page: Page) => page.locator("#howToPlayNext");
const dots = (page: Page) => page.locator(".how-to-play-dot");

const expectSlide = async (page: Page, index: number) => {
    const slide = HOW_TO_PLAY_SLIDES[index];
    const media = page.locator("#howToPlayMedia");

    await expect(page.locator("#howToPlayTitle")).toHaveText(slide.title);
    await expect(page.locator("#howToPlayDescription")).toHaveText(slide.description);
    await expect(media).toHaveAttribute("src", slide.media.src);
    await expect(media).toHaveJSProperty("tagName", slide.media.kind === "video" ? "VIDEO" : "IMG");
    await expect(dots(page).nth(index)).toHaveAttribute("aria-current", "true");
    await expect(page.locator('.how-to-play-dot[aria-current="true"]')).toHaveCount(1);
};

const openModal = async (page: Page) => {
    await page.locator("#howToPlayBtn").click();
    await expect(modal(page)).toBeVisible();
};

test.beforeEach(async ({ page }) => {
    helper = new PageHelper(page);
    await page.goto("/");
});

test("the How to Play button is hidden on the login screen", async ({ page }) => {
    await helper.expectScreen("Login");
    await expect(page.locator("#howToPlayBtn")).toBeHidden();
});

test("the How to Play row sits between the create/join controls and Your Games", async ({ page }) => {
    await helper.guestLogin();
    await expect(page.locator("#howToPlayBtn")).toBeVisible();

    // The games list rebuilds after its fetch, so wait for the layout to settle
    const topEdges = async () =>
        await Promise.all(
            ["#controls", "#howToPlayRow", "#games"].map(
                async (selector) => (await page.locator(selector).boundingBox())?.y ?? -1,
            ),
        );

    await expect
        .poll(async () => {
            const [controls, row, games] = await topEdges();
            return controls >= 0 && controls < row && row < games;
        })
        .toBe(true);
});

test("opening the modal shows the first slide", async ({ page }) => {
    await helper.guestLogin();
    await openModal(page);

    await expectSlide(page, 0);
    await expect(dots(page)).toHaveCount(HOW_TO_PLAY_SLIDES.length);
    await expect(backButton(page)).toBeDisabled();
    await expect(nextButton(page)).toBeEnabled();
});

test("next, back and the dots change the slide", async ({ page }) => {
    await helper.guestLogin();
    await openModal(page);

    await nextButton(page).click();
    await expectSlide(page, 1);

    await backButton(page).click();
    await expectSlide(page, 0);

    await dots(page).nth(4).click();
    await expectSlide(page, 4);
});

test("the arrow keys change the slide", async ({ page }) => {
    await helper.guestLogin();
    await openModal(page);

    await page.keyboard.press("ArrowRight");
    await expectSlide(page, 1);

    await page.keyboard.press("ArrowLeft");
    await expectSlide(page, 0);
});

test("next is disabled on the last slide", async ({ page }) => {
    await helper.guestLogin();
    await openModal(page);

    const last = HOW_TO_PLAY_SLIDES.length - 1;
    await dots(page).nth(last).click();

    await expectSlide(page, last);
    await expect(nextButton(page)).toBeDisabled();
    await expect(backButton(page)).toBeEnabled();
});

test("reopening the modal starts from the first slide", async ({ page }) => {
    await helper.guestLogin();
    await openModal(page);
    await dots(page).nth(3).click();
    await page.locator("#howToPlayClose").click();

    await openModal(page);

    await expectSlide(page, 0);
});

test("the close button, Escape and a backdrop click each close the modal", async ({ page }) => {
    await helper.guestLogin();

    await openModal(page);
    await page.locator("#howToPlayClose").click();
    await expect(modal(page)).toBeHidden();

    await openModal(page);
    await page.keyboard.press("Escape");
    await expect(modal(page)).toBeHidden();

    await openModal(page);
    await modal(page).click({ position: { x: 5, y: 5 } });
    await expect(modal(page)).toBeHidden();
});

test("a click inside the card does not close the modal", async ({ page }) => {
    await helper.guestLogin();
    await openModal(page);

    await page.locator("#howToPlayDescription").click();

    await expect(modal(page)).toBeVisible();
});

test("the How to Play button is hidden in a game", async ({ page }) => {
    await helper.guestLogin();
    await helper.createGame("Alice");

    await helper.expectScreen("Game");
    await expect(page.locator("#howToPlayBtn")).toBeHidden();
});
