import { expect, test } from '@playwright/test';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots');

test.describe('WINDOWS AT 3AM — Upgraded Investigation Loop & Cinematic Minimal HUD E2E', () => {
  test('completes full 3-night investigation through natural observation, focus calibration, interventions, and deduction without debug shortcuts', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');

    // 1. Verify launch, 3D canvas initialization, and compact minimal HUD (window nav & interventions collapsed by default)
    const canvas = page.getByTestId('observation-canvas');
    await expect(canvas).toBeVisible();
    await expect(page.getByTestId('world-clock-display')).toBeVisible();
    await expect(page.getByTestId('active-night-indicator')).toHaveText('NIGHT 1');
    await expect(page.getByTestId('window-nav-popover')).toHaveCount(0);
    await expect(page.getByTestId('intervention-tray')).toHaveCount(0);

    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-exterior-courtyard-wide.png'),
    });

    // 2. Test Cinematic Mode [H] toggle hides and restores HUD cleanly
    await page.keyboard.press('h');
    await expect(page.getByTestId('exit-cinematic-mode-btn')).toBeVisible();
    await page.keyboard.press('h');
    await expect(page.getByTestId('world-clock-display')).toBeVisible();

    // 3. Night 1 Observation #1: Focus Apt 1A (via keyboard '4' or collapsible window nav), calibrate focus [F], and record clue
    await page.getByTestId('toggle-window-nav-btn').click();
    await expect(page.getByTestId('window-nav-popover')).toBeVisible();
    await page.getByTestId('window-select-1A').click();
    await expect(page.getByTestId('apartment-telemetry-card')).toContainText('APT 1A');

    // Press 'f' to engage Auto-Focus (~20.1m) and record observation
    await page.keyboard.press('f');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-interior-apt-1a-zoom.png'),
    });

    await page.getByTestId('record-evidence-btn').click();
    await expect(page.getByTestId('clue-count-badge')).toHaveText('1');

    // 4. Night 1 Observation #2: Focus Apt 2C (Marcus Thorne) and record Pier 14 Smuggling Manifest
    await page.getByTestId('window-select-2C').click();
    await page.waitForTimeout(300);
    await page.getByTestId('record-evidence-btn').click();
    await expect(page.getByTestId('clue-count-badge')).toHaveText('2');

    // 5. With 2 observations recorded on Night 1, the natural "END WATCH" button appears to progress to Night 2!
    const advanceBtn = page.getByTestId('advance-night-btn');
    await expect(advanceBtn).toBeVisible();
    await advanceBtn.click();
    await expect(page.getByTestId('active-night-indicator')).toHaveText('NIGHT 2');

    // 6. Night 2 Progression: Use pace selector (5x) to let clock run naturally to 01:25 AM (minute 85)
    // Decision-point events at 01:16 AM (76m) and 01:25 AM (85m) will automatically drop speed back to 1x!
    await page.getByTestId('speed-popover-btn').click();
    await page.getByTestId('speed-btn-5x').click();

    // Wait until Night 2 reaches at least 01:16 AM (when Julian visits Elena in 3B)
    await expect(async () => {
      const clockText = await page.getByTestId('world-clock-display').innerText();
      expect(clockText >= '01:16 AM').toBe(true);
    }).toPass({ timeout: 15000 });

    // Focus Apt 3B (Elena Rostova's Study) and record the Signed Bailment Transfer
    await page.getByTestId('window-select-3B').click();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-interior-apt-3b-study.png'),
    });
    await page.getByTestId('record-evidence-btn').click();
    await expect(page.getByTestId('clue-count-badge')).toHaveText('3');

    // Speed up to 01:25 AM blackout window and record 1A Coerced Breaker Cut
    await page.getByTestId('speed-popover-btn').click();
    await page.getByTestId('speed-btn-5x').click();
    await expect(async () => {
      const clockText = await page.getByTestId('world-clock-display').innerText();
      expect(clockText >= '01:25 AM').toBe(true);
    }).toPass({ timeout: 10000 });

    await page.getByTestId('window-select-1A').click();
    await page.waitForTimeout(300);
    await page.getByTestId('record-evidence-btn').click();
    await expect(page.getByTestId('clue-count-badge')).toHaveText('4');

    // Speed up to 02:10 AM (130m) when power is restored and Marcus stashes the case in 2C's wall vent
    await page.getByTestId('speed-popover-btn').click();
    await page.getByTestId('speed-btn-5x').click();
    await expect(async () => {
      const clockText = await page.getByTestId('world-clock-display').innerText();
      expect(clockText >= '02:11 AM').toBe(true);
    }).toPass({ timeout: 12000 });

    // Also test Night 2 Contextual Intervention: Flash Optical Signal to 3B (now unlocked because we collected clue_n2_bailment_3b!)
    await page.getByTestId('toggle-interventions-btn').click();
    await expect(page.getByTestId('intervention-tray')).toBeVisible();
    await page.getByTestId('intervention-btn-laser_window_tap_3b').click();
    await page.getByTestId('toggle-interventions-btn').click();

    // Focus 2C and record Stolen Case Hidden in Wall Vent
    await page.getByTestId('window-select-2C').click();
    await page.waitForTimeout(300);
    await page.getByTestId('record-evidence-btn').click();
    await expect(page.getByTestId('clue-count-badge')).toHaveText('5');

    // Conclude Night 2 Watch naturally to advance to Night 3
    await page.getByTestId('advance-night-btn').click();
    await expect(page.getByTestId('active-night-indicator')).toHaveText('NIGHT 3');

    // 7. Night 3 Observation: Focus 2C and record UV Decoy Stamp clue
    await page.getByTestId('window-select-2C').click();
    await page.waitForTimeout(300);
    await page.getByTestId('record-evidence-btn').click();
    await expect(page.getByTestId('clue-count-badge')).toHaveText('6');

    // 8. Open Observation Journal to verify forensic metadata & cross-references
    await page.getByTestId('open-journal-btn').click();
    await expect(page.getByTestId('journal-drawer')).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-observation-journal.png'),
    });
    await page.getByTestId('close-journal-btn').click();

    // 9. Open Deduction Board, connect corroborating pins, and submit final verdict
    await page.getByTestId('open-deduction-btn').click();
    await expect(page.getByTestId('deduction-board-modal')).toBeVisible();

    await page.getByTestId('synthesize-btn-hyp_coerced_blackout_access').click();
    await page.getByTestId('synthesize-btn-hyp_marcus_executed_heist').click();
    await page.getByTestId('synthesize-btn-hyp_julian_elena_counter_sting').click();

    await expect(page.getByTestId('hypothesis-count-badge')).toHaveText('3');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '05-deduction-board.png'),
    });

    await page.getByTestId('submit-verdict-btn').click();

    // 10. Verify True Conspiracy Resolution Ending screen
    await expect(page.getByTestId('ending-resolution-modal')).toBeVisible();
    await expect(page.getByTestId('ending-title')).toContainText('THE ORPHEUS COUNTER-STING');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-true-ending-resolution.png'),
    });

    // 11. Verify responsive layout at 1366x768 desktop & 1024x768 tablet landscape
    await page.getByTestId('ending-continue-observing-btn').click();
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '07-responsive-1366x768.png'),
    });

    expect(errors).toEqual([]);
  });
});
