'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const { Account, formatBalance, parseAmount } = require('../index');

const application = path.join(__dirname, '..', 'index.js');

function runApplication(input) {
  const result = spawnSync(process.execPath, [application], {
    encoding: 'utf8',
    input,
  });

  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

test('COB-001 initializes the balance to 1000.00', () => {
  const output = runApplication('1\n4\n');

  assert.match(output, /Current balance: 001000\.00/);
  assert.equal((output.match(/Account Management System/g) || []).length, 2);
});

test('COB-002 views the current balance and returns to the menu', () => {
  const output = runApplication('1\n4\n');

  assert.match(output, /Current balance: 001000\.00/);
  assert.equal((output.match(/Enter your choice \(1-4\): /g) || []).length, 2);
});

test('COB-003 credits a whole-dollar amount and retains it for a balance inquiry', () => {
  const output = runApplication('2\n50\n1\n4\n');

  assert.match(output, /Amount credited\. New balance: 001050\.00/);
  assert.match(output, /Current balance: 001050\.00/);
});

test('COB-004 credits an amount containing cents', () => {
  const output = runApplication('2\n25.50\n1\n4\n');

  assert.match(output, /Amount credited\. New balance: 001025\.50/);
  assert.match(output, /Current balance: 001025\.50/);
});

test('COB-005 debits less than the current balance', () => {
  const output = runApplication('3\n100\n1\n4\n');

  assert.match(output, /Amount debited\. New balance: 000900\.00/);
  assert.match(output, /Current balance: 000900\.00/);
});

test('COB-006 allows a debit equal to the current balance', () => {
  const output = runApplication('3\n1000\n1\n4\n');

  assert.match(output, /Amount debited\. New balance: 000000\.00/);
  assert.match(output, /Current balance: 000000\.00/);
});

test('COB-007 rejects a debit greater than the balance without changing it', () => {
  const output = runApplication('3\n1000.01\n1\n4\n');

  assert.match(output, /Insufficient funds for this debit\./);
  assert.match(output, /Current balance: 001000\.00/);
  assert.doesNotMatch(output, /Amount debited\./);
});

test('COB-008 debits an amount containing cents', () => {
  const output = runApplication('3\n10.25\n1\n4\n');

  assert.match(output, /Amount debited\. New balance: 000989\.75/);
  assert.match(output, /Current balance: 000989\.75/);
});

test('COB-009 reports an invalid menu choice and continues', () => {
  const output = runApplication('5\n1\n4\n');

  assert.match(output, /Invalid choice, please select 1-4\./);
  assert.match(output, /Current balance: 001000\.00/);
  assert.match(output, /Exiting the program\. Goodbye!/);
  assert.equal((output.match(/Account Management System/g) || []).length, 3);
});

test('COB-010 exits with a goodbye message and does not show the menu again', () => {
  const output = runApplication('4\n');

  assert.match(output, /Exiting the program\. Goodbye!/);
  assert.equal((output.match(/Account Management System/g) || []).length, 1);
});

test('COB-011 accepts a zero credit without changing the balance', () => {
  const output = runApplication('2\n0\n1\n4\n');

  assert.match(output, /Amount credited\. New balance: 001000\.00/);
  assert.match(output, /Current balance: 001000\.00/);
});

test('COB-012 accepts a zero debit without changing the balance', () => {
  const output = runApplication('3\n0\n1\n4\n');

  assert.match(output, /Amount debited\. New balance: 001000\.00/);
  assert.match(output, /Current balance: 001000\.00/);
});

test('COB-013 characterizes negative credit input as rejected without a balance change', () => {
  const output = runApplication('2\n-10.00\n1\n4\n');

  assert.match(output, /Invalid amount\./);
  assert.match(output, /Current balance: 001000\.00/);
  assert.doesNotMatch(output, /Amount credited\./);
});

test('COB-014 characterizes negative debit input as rejected without a balance change', () => {
  const output = runApplication('3\n-10.00\n1\n4\n');

  assert.match(output, /Invalid amount\./);
  assert.match(output, /Current balance: 001000\.00/);
  assert.doesNotMatch(output, /Amount debited\./);
});

test('COB-015 resets the in-memory balance when a fresh process starts', () => {
  const firstProcess = runApplication('2\n50\n1\n4\n');
  const freshProcess = runApplication('1\n4\n');

  assert.match(firstProcess, /Current balance: 001050\.00/);
  assert.match(freshProcess, /Current balance: 001000\.00/);
});

test('amount parsing preserves cents and rejects invalid precision and range', () => {
  assert.equal(parseAmount('25'), 2_500);
  assert.equal(parseAmount('25.5'), 2_550);
  assert.equal(parseAmount('25.50'), 2_550);
  assert.equal(parseAmount('0'), 0);
  assert.equal(parseAmount('-1.00'), null);
  assert.equal(parseAmount('1.001'), null);
  assert.equal(parseAmount('1000000.00'), null);
  assert.equal(parseAmount('abc'), null);
});

test('account arithmetic uses exact cents and rejects out-of-range updates', () => {
  const account = new Account();

  assert.equal(account.balanceCents, 100_000);
  assert.equal(formatBalance(account.balanceCents), '001000.00');
  assert.equal(account.credit(2_550), true);
  assert.equal(account.debit(1_025), true);
  assert.equal(account.balanceCents, 101_525);
  assert.equal(account.debit(101_525), true);
  assert.equal(account.debit(1), false);
  assert.equal(account.credit(-1), false);
  assert.equal(account.debit(Number.NaN), false);
  assert.equal(account.credit(99_999_999), true);
  assert.equal(account.credit(1), false);
  assert.equal(account.balanceCents, 99_999_999);
});
