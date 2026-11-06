'use strict';

const readline = require('node:readline');

const MAX_BALANCE_CENTS = 99_999_999;

class Account {
  #balanceCents = 100_000;

  get balanceCents() {
    return this.#balanceCents;
  }

  credit(amountCents) {
    if (
      !Number.isSafeInteger(amountCents) ||
      amountCents < 0 ||
      amountCents > MAX_BALANCE_CENTS ||
      this.#balanceCents + amountCents > MAX_BALANCE_CENTS
    ) {
      return false;
    }

    this.#balanceCents += amountCents;
    return true;
  }

  debit(amountCents) {
    if (
      !Number.isSafeInteger(amountCents) ||
      amountCents < 0 ||
      amountCents > MAX_BALANCE_CENTS ||
      amountCents > this.#balanceCents
    ) {
      return false;
    }

    this.#balanceCents -= amountCents;
    return true;
  }
}

function parseAmount(value) {
  const match = /^\d+(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const [wholePart, fractionalPart = ''] = value.trim().split('.');
  const cents = Number(wholePart) * 100 + Number(fractionalPart.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= MAX_BALANCE_CENTS ? cents : null;
}

function formatBalance(cents) {
  const dollars = Math.floor(cents / 100).toString().padStart(6, '0');
  const remainder = (cents % 100).toString().padStart(2, '0');
  return `${dollars}.${remainder}`;
}

async function run(input = process.stdin, output = process.stdout) {
  const lines = readline.createInterface({ input, crlfDelay: Infinity })[Symbol.asyncIterator]();
  const account = new Account();
  let running = true;

  const writeLine = (text = '') => output.write(`${text}\n`);
  const readInput = async (prompt) => {
    output.write(prompt);
    const result = await lines.next();
    return result.done ? null : result.value.trim();
  };

  while (running) {
    writeLine('--------------------------------');
    writeLine('Account Management System');
    writeLine('1. View Balance');
    writeLine('2. Credit Account');
    writeLine('3. Debit Account');
    writeLine('4. Exit');
    writeLine('--------------------------------');

    const choice = await readInput('Enter your choice (1-4): ');
    if (choice === null || choice === '4') {
      running = false;
    } else if (choice === '1') {
      writeLine(`Current balance: ${formatBalance(account.balanceCents)}`);
    } else if (choice === '2' || choice === '3') {
      const operation = choice === '2' ? 'credit' : 'debit';
      const amountInput = await readInput(`Enter ${operation} amount: `);
      if (amountInput === null) {
        running = false;
        continue;
      }

      const amountCents = parseAmount(amountInput);
      if (amountCents === null) {
        writeLine('Invalid amount. Enter a value from 0.00 to 999999.99 with at most two decimal places.');
      } else if (choice === '2') {
        if (account.credit(amountCents)) {
          writeLine(`Amount credited. New balance: ${formatBalance(account.balanceCents)}`);
        } else {
          writeLine('Credit would exceed the maximum balance of 999999.99.');
        }
      } else if (account.debit(amountCents)) {
        writeLine(`Amount debited. New balance: ${formatBalance(account.balanceCents)}`);
      } else {
        writeLine('Insufficient funds for this debit.');
      }
    } else {
      writeLine('Invalid choice, please select 1-4.');
    }
  }

  writeLine('Exiting the program. Goodbye!');
}

if (require.main === module) {
  run().catch((error) => {
    console.error('Unable to run the accounting application:', error);
    process.exitCode = 1;
  });
}

module.exports = { Account, formatBalance, parseAmount, run };
