# Core Concepts

## Introduction

This document defines the language used throughout the Fellow platform.

Every designer, engineer, AI model, and contributor should use these definitions consistently.

These concepts are the foundation of the product.

---

# Intent

An Intent represents what the user wants to accomplish.

Users never describe blockchain operations.

Users describe goals.

Examples:

- Swap ETH to USDG
- Add liquidity
- Claim all fees
- Show my portfolio
- Find the best pool

An Intent is always written from the user's perspective.

---

# Intent Engine

The Intent Engine converts natural language into executable actions.

Responsibilities:

- Detect user intent
- Extract parameters
- Validate requests
- Build execution plans
- Return understandable responses

The Intent Engine never signs transactions.

---

# Parameters

Parameters are structured values extracted from an intent.

Example

User

Swap 200 ETH into USDG

Extracted Parameters

Action:
Swap

Token In:
ETH

Token Out:
USDG

Amount:
200

Network:
Robinhood Chain

---

# Execution Plan

An Execution Plan is the structured description of what Fellow intends to do.

It exists before any blockchain interaction.

Example

Execution Plan

1. Verify wallet connection
2. Check balance
3. Find optimal swap route
4. Estimate gas
5. Estimate output
6. Build transaction
7. Present review
8. Wait for approval

Nothing happens on-chain before an Execution Plan exists.

---

# Action Card

Action Cards are interactive UI components generated from an Execution Plan.

They summarize the intended transaction.

Example

Swap

ETH → USDG

Amount

Estimated Output

Price Impact

Gas Estimate

Slippage

Review Button

Action Cards replace long AI responses whenever a transaction is involved.

---

# Conversation

A Conversation is the continuous interaction between the user and Fellow.

A Conversation may contain:

Questions

Portfolio requests

Analytics

Transaction requests

Follow-up questions

Every conversation maintains context.

Example

User

Swap 100 ETH into USDG

Later

Now swap the rest

Fellow understands "the rest" using conversation context.

---

# Session

A Session begins when the wallet connects.

A Session ends when the wallet disconnects or expires.

The session stores:

Conversation history

Current wallet

Temporary execution context

Pending execution plans

No sensitive wallet credentials are stored.

---

# Transaction Review

Every blockchain action must generate a Transaction Review.

It includes:

Action

Assets

Amounts

Network

Estimated Gas

Slippage

Warnings

Protocol

Approval Button

Users always review before signing.

---

# Wallet Ownership

Wallet ownership always belongs to the user.

Fellow:

Never stores private keys.

Never signs transactions.

Never transfers assets without approval.

The wallet remains the single source of authorization.

---

# Protocol Adapter

A Protocol Adapter connects Fellow to external DeFi protocols.

Examples:

Swap Adapter

Liquidity Adapter

Analytics Adapter

Pool Adapter

Every protocol integration should be implemented through an adapter.

The Intent Engine never communicates directly with smart contracts.

---

# Pool

A Pool represents an on-chain liquidity pool.

Information includes:

Pool Address

Token Pair

TVL

Volume

APR

Fee Tier

Liquidity

Supported Actions

Pool data should be protocol independent.

---

# Position

A Position represents a user's liquidity allocation.

A Position contains:

Pool

Tokens

Current Range

Current Value

Earned Fees

PnL

Status

Health

Users interact with Positions instead of raw smart contract data.

---

# Portfolio

A Portfolio represents everything owned by the connected wallet.

It includes:

Tokens

Liquidity Positions

Pending Fees

Historical Performance

Portfolio analytics should always remain read-only until execution is requested.

---

# Protocol

A Protocol is an external decentralized application integrated with Fellow.

Examples:

DEX

Liquidity Manager

Analytics Provider

Future integrations should not affect the user experience.

Users interact only with Fellow.

---

# Execution

Execution begins only after:

An Execution Plan exists.

A Transaction Review is displayed.

The wallet signs the transaction.

Execution is the only stage where blockchain state changes.

---

# Principles

Every concept follows five universal principles.

Intent before interface.

Conversation before navigation.

Review before execution.

Wallet ownership always.

Transparency over automation.