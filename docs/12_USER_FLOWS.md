# User Flows

## Overview

This document defines every user journey within Fellow.

Each flow represents a complete interaction from the user's perspective.

Every blockchain action follows the same high-level sequence:

1. User expresses intent.
2. Fellow understands the request.
3. Fellow prepares an execution plan.
4. Fellow presents a transaction review.
5. User approves the transaction.
6. Transaction is executed on Robinhood Chain.
7. Fellow updates the user's portfolio.

---

# Flow 1 — Connect Wallet

## Goal

Allow users to access Fellow using their wallet.

## Steps

1. User opens Fellow.
2. User clicks "Connect Wallet".
3. Wallet modal appears.
4. User selects wallet.
5. Wallet requests connection approval.
6. User approves.
7. Fellow stores wallet session.
8. Portfolio loads automatically.
9. Chat becomes available.

---

# Flow 2 — Portfolio Overview

## Goal

Allow users to quickly understand their assets.

## Example

User:

Show my portfolio.

## Fellow

Displays:

- Total Portfolio Value
- Token Balances
- LP Positions
- Unclaimed Fees
- Recent Activity

No transaction is created.

---

# Flow 3 — Token Swap

## Example

User:

Swap 500 USDG to ETH.

## Flow

1. Detect intent.
2. Validate wallet connection.
3. Validate balance.
4. Find best swap route.
5. Estimate output.
6. Estimate gas.
7. Estimate slippage.
8. Generate Action Card.
9. User reviews.
10. User signs.
11. Broadcast transaction.
12. Wait for confirmation.
13. Refresh portfolio.

---

# Flow 4 — Add Liquidity

## Example

User:

Add liquidity to ETH/USDG.

## Flow

1. Detect intent.
2. Find available pools.
3. Select best pool.
4. Recommend price range.
5. Calculate deposit ratio.
6. Estimate APR.
7. Estimate fees.
8. Generate Action Card.
9. User reviews.
10. User signs.
11. Add liquidity.
12. Update portfolio.

---

# Flow 5 — Remove Liquidity

## Example

Remove my ETH/USDG position.

## Flow

1. Detect position.
2. Display current position.
3. Estimate received assets.
4. Display earned fees.
5. Generate Action Card.
6. User signs.
7. Remove liquidity.
8. Refresh portfolio.

---

# Flow 6 — Claim Fees

## Example

Claim all my fees.

## Flow

1. Scan all positions.
2. Calculate claimable fees.
3. Generate summary.
4. Generate transaction.
5. User signs.
6. Claim fees.
7. Update portfolio.

---

# Flow 7 — Pool Discovery

## Example

Find the best ETH pool.

## Flow

1. Search supported pools.
2. Rank by TVL.
3. Rank by Volume.
4. Rank by APR.
5. Rank by Fees.
6. Display results.

No transaction required.

---

# Flow 8 — Position Details

## Example

Show my ETH/USDG position.

## Fellow Displays

- Position Value
- Current Range
- Current Price
- Utilization
- Earned Fees
- Unrealized PnL
- APR
- Health Status

No transaction required.

---

# Flow 9 — Analytics

## Example

Show highest APR pools today.

## Fellow Displays

- Pool List
- APR
- TVL
- Daily Volume
- Fees
- Liquidity
- Risk Level

No transaction required.

---

# Flow 10 — Failed Transaction

## Cases

- Insufficient Balance
- User Rejected Signature
- RPC Failure
- Slippage Exceeded
- Pool No Longer Available

## Fellow

Displays:

- Error Reason
- Suggested Solution
- Retry Button

---

# Flow 11 — Conversation Context

## Example

User:

Swap 500 USDG into ETH.

After completion:

Now add liquidity.

Fellow understands:

- Use received ETH
- Find matching pool
- Prepare LP transaction

No need for the user to repeat context.

---

# Universal Transaction Flow

Every blockchain transaction follows the same lifecycle.

User Intent

↓

Intent Detection

↓

Parameter Extraction

↓

Validation

↓

Execution Plan

↓

Action Card

↓

Transaction Review

↓

Wallet Signature

↓

Broadcast

↓

Confirmation

↓

Portfolio Refresh

↓

Conversation Continues