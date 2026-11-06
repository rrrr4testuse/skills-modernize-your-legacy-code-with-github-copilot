# COBOL Account Management

## Purpose

This program is a small, menu-driven account balance application. The user can view the balance, credit the account, debit the account, or exit. The current implementation stores one balance in memory; it does not identify or maintain separate student accounts.

## Program Files

### `main.cob` - `MainProgram`

Provides the command-line menu and controls the application's main loop.

- Prompts for one of four choices: view balance, credit, debit, or exit.
- Calls `Operations` with an operation code: `TOTAL` and `DEBIT` are padded to the six-character field, while `CREDIT` fills it.
- Displays an error for choices outside 1-4 and continues prompting.
- Ends the loop and stops the program when the user selects 4.

### `operations.cob` - `Operations`

Implements the account actions and interacts with the user for credit and debit amounts.

- `TOTAL` (padded to six characters): reads and displays the current balance.
- `CREDIT`: accepts an amount, reads the current balance, adds the amount, writes the new balance, and displays it.
- `DEBIT` (padded to six characters): accepts an amount, reads the current balance, and subtracts and writes the amount only when the balance is sufficient. Otherwise, it displays an insufficient-funds message.

### `data.cob` - `DataProgram`

Owns the balance value and provides a read/write interface to `Operations`.

- `READ`: copies `STORAGE-BALANCE` to the caller's `BALANCE` field.
- `WRITE`: copies the caller's `BALANCE` field to `STORAGE-BALANCE`.
- Initializes the balance to `1000.00` when the program's working storage is initialized.

## Business Rules and Current Limits

- The application has a single balance, initially `1000.00`; no student identity or account selection is implemented.
- A debit is allowed only if the requested amount is less than or equal to the current balance. This prevents the balance from going below zero through the debit operation.
- A credit adds the entered amount to the current balance. There is no explicit validation for zero or negative amounts, nor is there a defined overdraft or maximum-balance policy for credits.
- Balance and amount fields use `PIC 9(6)V99`, representing up to six whole-number digits and two decimal places. The decimal point is implied in storage.
- The balance is held in COBOL working storage, not a file or database. It is not durable across a fresh program initialization or process restart.

Student-specific business rules, such as separate balances per student, student eligibility, or transaction limits, would need to be defined and added; none are present in these source files.

## Data Flow

```

## Node.js application

The COBOL flow is also implemented as a menu-driven Node.js command-line application in `src/accounting`.

- Run `npm install` and `npm start` from `src/accounting`, or launch **Run Accounting Application** from VS Code's Run and Debug view.
- Run `npm test` from `src/accounting` to execute the built-in Node.js test suite.
- The balance starts at `1000.00` for each process and remains in memory only. Amounts are represented as integer cents, limited to two decimal places and the COBOL field maximum of `999999.99`. Debits that exceed the current balance do not update it.
- The application uses Node.js built-in modules and has no third-party runtime dependencies.mermaid
sequenceDiagram
actor User
participant Main as MainProgram
participant Ops as Operations
participant Data as DataProgram
loop Until the user chooses Exit
Main->>User: Display menu
User-->>Main: Enter choice
alt Choice 1: View balance
Main->>Ops: CALL with TOTAL (six-character padded code)
Ops->>Data: READ balance
Data-->>Ops: Return balance
Ops-->>User: Display current balance
Ops-->>Main: Return from CALL
else Choice 2: Credit account
Main->>Ops: CALL with CREDIT
Ops->>User: Prompt for credit amount
User-->>Ops: Enter amount
Ops->>Data: READ balance
Data-->>Ops: Return balance
Ops->>Ops: Add amount to balance
Ops->>Data: WRITE updated balance
Data-->>Ops: Return from CALL
Ops-->>User: Display confirmation and new balance
Ops-->>Main: Return from CALL
else Choice 3: Debit account
Main->>Ops: CALL with DEBIT (six-character padded code)
Ops->>User: Prompt for debit amount
User-->>Ops: Enter amount
Ops->>Data: READ balance
Data-->>Ops: Return balance
alt Balance is sufficient
Ops->>Ops: Subtract amount from balance
Ops->>Data: WRITE updated balance
Data-->>Ops: Return from CALL
Ops-->>User: Display confirmation and new balance
else Insufficient funds
Ops-->>User: Display insufficient-funds message
end
Ops-->>Main: Return from CALL
else Choice 4: Exit
Main->>Main: Set continue flag to NO
else Invalid choice
Main-->>User: Display invalid-choice message
end
end
Main-->>User: Display goodbye message
Main->>Main: STOP RUN
```
