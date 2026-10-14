const { test, describe } = require('node:test');
const assert = require('node:assert');
const { calculateExpiryDate, computeWarrantyStatus } = require('../src/utils/dateUtils');

describe('Warranty Date Calculation Utils', () => {
  test('adds 1 year correctly to standard date', () => {
    const purchase = '2023-05-15';
    const expiry = calculateExpiryDate(purchase, 1, 'years');
    assert.strictEqual(expiry.getUTCFullYear(), 2024);
    assert.strictEqual(expiry.getUTCMonth(), 4);
    assert.strictEqual(expiry.getUTCDate(), 15);
  });

  test('adds 6 months correctly across year boundary', () => {
    const purchase = '2023-09-10';
    const expiry = calculateExpiryDate(purchase, 6, 'months');
    assert.strictEqual(expiry.getUTCFullYear(), 2024);
    assert.strictEqual(expiry.getUTCMonth(), 2);
    assert.strictEqual(expiry.getUTCDate(), 10);
  });

  test('handles month-end leap year: Jan 31 + 1 month in leap year (2024) -> Feb 29', () => {
    const purchase = '2024-01-31';
    const expiry = calculateExpiryDate(purchase, 1, 'months');
    assert.strictEqual(expiry.getUTCFullYear(), 2024);
    assert.strictEqual(expiry.getUTCMonth(), 1);
    assert.strictEqual(expiry.getUTCDate(), 29);
  });

  test('handles month-end non-leap year: Jan 31 + 1 month in non-leap year (2023) -> Feb 28', () => {
    const purchase = '2023-01-31';
    const expiry = calculateExpiryDate(purchase, 1, 'months');
    assert.strictEqual(expiry.getUTCFullYear(), 2023);
    assert.strictEqual(expiry.getUTCMonth(), 1);
    assert.strictEqual(expiry.getUTCDate(), 28);
  });

  test('handles 31 March + 1 month -> 30 April', () => {
    const purchase = '2023-03-31';
    const expiry = calculateExpiryDate(purchase, 1, 'months');
    assert.strictEqual(expiry.getUTCFullYear(), 2023);
    assert.strictEqual(expiry.getUTCMonth(), 3);
    assert.strictEqual(expiry.getUTCDate(), 30);
  });

  test('throws error for non-positive warranty period', () => {
    assert.throws(() => {
      calculateExpiryDate('2023-01-01', 0, 'months');
    }, /positive integer/);
    assert.throws(() => {
      calculateExpiryDate('2023-01-01', -5, 'years');
    }, /positive integer/);
  });
});

describe('Warranty Status Evaluation', () => {
  const fixedNow = new Date('2024-06-01T12:00:00Z');

  test('status is Active when more than 30 days remaining', () => {
    const futureDate = new Date('2024-07-15T12:00:00Z');
    const result = computeWarrantyStatus(futureDate, fixedNow);
    assert.strictEqual(result.status, 'Active');
    assert.ok(result.daysRemaining > 30);
  });

  test('status is Expiring Soon when 30 days or less remaining', () => {
    const soonDate = new Date('2024-06-20T12:00:00Z');
    const result = computeWarrantyStatus(soonDate, fixedNow);
    assert.strictEqual(result.status, 'Expiring Soon');
    assert.strictEqual(result.daysRemaining, 19);
  });

  test('status is Expired when expiry date has passed', () => {
    const pastDate = new Date('2024-05-30T12:00:00Z');
    const result = computeWarrantyStatus(pastDate, fixedNow);
    assert.strictEqual(result.status, 'Expired');
    assert.ok(result.daysRemaining < 0);
  });
});
