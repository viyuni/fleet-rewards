# @server/shared Real Database Test Todolist

## Done

- [x] Add a reusable concurrency helper for database integration tests.
- [x] Make `@server/shared#test` load `servers/shared/.env.test`.
- [x] Add `servers/shared/.env.test` with `DATABASE_URL`.
- [x] Test product stock cannot be over-consumed under concurrent decrements.
- [x] Test point account balance cannot be over-consumed under concurrent decrements.
- [x] Test point transaction uniqueness by `pointAccountId + idempotencyKey`.
- [x] Test stock movement uniqueness by `productId + sourceType + sourceId + type + idempotencyKey`.
- [x] Test point conversion cannot over-consume the source account under concurrency.
- [x] Test invalid point conversion rule shape is rejected.
- [x] Test repeated point conversion with the same nonce does not duplicate balance changes or transactions.
- [x] Test order creation concurrency: limited product stock and limited user points cannot be over-consumed by concurrent orders.
- [x] Test order creation idempotency at the database boundary: same create nonce does not create duplicate orders or duplicate point/stock changes.
- [x] Verify with `vpr @server/shared#test`.
- [x] Verify with `vpr @server/shared#typecheck`.

## Next P0

- [ ] Improve duplicate conversion behavior from "one succeeds, duplicates fail by unique constraint" to explicit idempotent return if that is the desired product behavior.
- [ ] Fix or redesign the skipped point conversion atomicity test. Current attempted target-account failure case hangs under the real database test runner.
- [ ] Add order creation atomicity test: order, point transaction, account balance, stock, and stock movement all roll back together on failure.

## Next P1

- [ ] Add point conversion validation tests for `fromAmount <= 0`.
- [ ] Add point conversion validation tests for non-multiple conversion amounts.
- [ ] Add point conversion validation tests for `minFromAmount` and `maxFromAmount`.
- [ ] Add point conversion availability tests for disabled, not-yet-started, and expired rules.
- [ ] Add point conversion account isolation test: user A conversion must not affect user B accounts.
- [ ] Add point conversion type isolation test: only the rule source type is consumed and only the rule target type is granted.
- [ ] Add refund idempotency test: repeated refund does not duplicate point refund or stock restore.
- [ ] Add refund state validation test: already refunded or invalid-status orders cannot be refunded.
- [ ] Add refund atomicity test: refund status, point refund, and stock restore roll back together on failure.

## Next P2

- [ ] Add admin point adjustment idempotency test for `adminId + nonce`.
- [ ] Add admin stock adjustment idempotency test for `productId + adminId + nonce`.
- [ ] Add point reversal uniqueness test: one `reversalOfTransactionId` can only be reversed once.
- [ ] Add reward grant idempotency test: same event and rule returns existing transaction without duplicate points.
- [ ] Add concurrent account creation test: `ensureAccountAndLock` creates one account for the same user and point type.

## Notes

- These tests should remain real database integration tests because the guarantees depend on transactions, row locks, conditional updates, and unique indexes.
- The current shared test command expects `servers/shared/.env.test` to provide `DATABASE_URL`.
- Current completed tests live in `servers/shared/src/modules/point/__tests__/point-concurrency.integration.test.ts`.
- Shared concurrency helpers live in `servers/shared/src/__tests__/helpers/concurrency.ts`.
