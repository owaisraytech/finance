import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculate, round2, tierIndex } from '../src/calc.js';

const config = JSON.parse(readFileSync(new URL('../config.json', import.meta.url)));

test('spreadsheet default test case', () => {
  const r = calculate({ sale: 30000, dp: 0.25, cc: 0.10, termDays: 360, years: 5 }, config);
  assert.equal(round2(r.dueToday), 3000.00);
  assert.equal(round2(r.advance), 4500.00);
  assert.equal(round2(r.closingFee), 899.55);
  assert.equal(r.closingFeePct, 0.1999);
  assert.equal(r.processingFee, 599);
  assert.equal(round2(r.costOfAdvance), 5998.55);
  assert.equal(r.payments, 12);
  assert.equal(round2(r.trustlineMonthly), 499.88);
  assert.equal(round2(r.balance), 22500.00);
  assert.equal(round2(r.vidantaMonthly), 467.06);
  assert.equal(round2(r.phase1.amount), 966.94);
  assert.deepEqual([r.phase1.from, r.phase1.to], [1, 12]);
  assert.equal(round2(r.phase2.amount), 467.06);
  assert.deepEqual([r.phase2.from, r.phase2.to], [13, 60]);
});

test('tier boundaries', () => {
  const t = config.trustline.tiers;
  assert.equal(tierIndex(4999.99, t), 0);
  assert.equal(tierIndex(5000, t), 1);
  assert.equal(tierIndex(10000, t), 2);
  assert.equal(tierIndex(40000, t), 3);
});
