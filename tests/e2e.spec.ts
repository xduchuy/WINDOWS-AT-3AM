import { expect, test } from '@playwright/test';
import path from 'node:path';

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'docs/screenshots');

test.describe('WINDOWS AT 3AM — Playable Vertical Slice E2E Verification', () => {
  test('launches exterior scene, zooms into apartments, triggers intervention, collects clues, links deductions, and reaches True Ending', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');

    // 1. Verify 3D canvas & cinematic HUD load cleanly
    const canvas = page.getByTestId('observation-canvas');
    await expect(canvas).toBeVisible();
    await expect(page.getByTestId('world-clock-display')).toBeVisible();

    // Wait briefly for 3D scene & rain particles to render initial frames
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-exterior-courtyard-wide.png'),
    });

    // 2. Focus on Apartment 1A (Nora Lin) on Night 1 and record the Yellow Audit Extortion Note clue
    await page.getByTestId('window-select-1A').click();
    await expect(page.getByTestId('apartment-telemetry-card')).toContainText('APT 1A');
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '02-interior-apt-1a-zoom.png'),
    });

    await page.getByTestId('record-evidence-btn').click();
    await expect(page.getByTestId('clue-count-badge')).toHaveText('1');

    // 3. Focus on Apartment 2C (Marcus Thorne) on Night 1 and record the Pier 14 Manifest clue
    await page.getByTestId('window-select-2C').click();
    await page.getByTestId('record-evidence-btn').click();
    await expect(page.getByTestId('clue-count-badge')).toHaveText('2');

    // 4. Scrub to 01:20 AM (80m) on Night 1 and deploy Courtyard Payphone Intervention
    const scrubber = page.getByTestId('timeline-scrubber');
    await scrubber.fill('80');
    await scrubber.dispatchEvent('change');
    await page.getByTestId('intervention-btn-ring_courtyard_payphone').click();
    await page.waitForTimeout(400);

    // 5. Switch to Night 2, scrub to 01:30 AM (90m) during the 4A Blackout, and collect clues in 1A, 3B, and 2C
    await page.getByTestId('night-btn-2').click();
    await scrubber.fill('90');
    await scrubber.dispatchEvent('change');

    // Record 1A Forced Breaker Sabotage clue
    await page.getByTestId('window-select-1A').click();
    await page.getByTestId('record-evidence-btn').click();

    // Record 3B Signed Bailment Transfer of Authentic Violin
    await page.getByTestId('window-select-3B').click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '03-interior-apt-3b-study.png'),
    });
    await page.getByTestId('record-evidence-btn').click();

    // Scrub to 02:20 AM (140m) on Night 2 and record 2C Hidden Case in Wall Vent
    await scrubber.fill('140');
    await scrubber.dispatchEvent('change');
    await page.getByTestId('window-select-2C').click();
    await page.getByTestId('record-evidence-btn').click();

    // 6. Switch to Night 3, focus on 2C, and record UV Decoy Stamp clue
    await page.getByTestId('night-btn-3').click();
    await page.getByTestId('window-select-2C').click();
    await page.getByTestId('record-evidence-btn').click();

    // 7. Open Observation Journal to verify timestamped entries
    await page.getByTestId('open-journal-btn').click();
    await expect(page.getByTestId('journal-drawer')).toBeVisible();
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-observation-journal.png'),
    });
    await page.getByTestId('close-journal-btn').click();

    // 8. Open Deduction Board, synthesize the 3 verified hypotheses, and submit final verdict
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

    // 9. Verify True Conspiracy Resolution Ending screen
    await expect(page.getByTestId('ending-resolution-modal')).toBeVisible();
    await expect(page.getByTestId('ending-title')).toContainText('THE ORPHEUS COUNTER-STING');
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '06-true-ending-resolution.png'),
    });

    expect(errors).toEqual([]);
  });
});
