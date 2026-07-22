# Intent Engine

## Overview

The Intent Engine is the intelligence layer of Fellow.

Its responsibility is to convert natural language into structured blockchain actions without compromising user control or security.

The Intent Engine never executes transactions.

It only understands user intent, prepares execution plans, and assists the user throughout the process.

---

# Objectives

The Intent Engine must:

- Understand natural language.
- Detect user intent.
- Extract structured parameters.
- Ask follow-up questions when necessary.
- Generate execution plans.
- Explain proposed actions.
- Never sign transactions.
- Never modify user assets without approval.

---

# Processing Pipeline

Every request follows the same lifecycle.

User Message

↓

Intent Detection

↓

Parameter Extraction

↓

Context Resolution

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

Execution

---

# Supported Intents

Current MVP

- Swap
- Add Liquidity
- Remove Liquidity
- Claim Fees
- Show Portfolio
- Show Positions
- Show Analytics
- Find Pools
- Help

Future

- Bridge
- Lending
- Borrow
- Repay
- Stake
- Vote
- Governance
- Automation

---

# Intent Classification

Example

User

Swap 500 USDG to ETH

↓

Intent

swap

Confidence

99%

Parameters

amount

500

token_in

USDG

token_out

ETH

---

User

Add liquidity to ETH/USDG

↓

Intent

add_liquidity

---

User

Show my portfolio

↓

Intent

portfolio

---

# Parameter Extraction

Each intent extracts structured parameters.

Swap

- amount
- token_in
- token_out

Liquidity

- token_pair
- amount
- preferred_range

Claim

- position
- all_positions

Portfolio

- wallet

Analytics

- filters

---

# Context Resolution

The engine remembers conversation context.

Example

User

Swap 500 USDG to ETH.

Later

Now swap the rest.

The engine understands that "the rest" refers to the remaining USDG balance.

---

Example

User

Add liquidity.

↓

AI

Which pool?

↓

User

ETH/USDG.

↓

Intent completed.

---

# Validation

Before an execution plan is created, the engine validates:

Wallet connected

Supported tokens

Supported protocol

Balance

Liquidity availability

Network

Missing parameters

---

# Missing Information

When required parameters are missing, Fellow asks concise follow-up questions.

Example

User

Swap ETH.

↓

Fellow

Which token would you like to receive?

---

User

Add liquidity.

↓

Fellow

Which token pair would you like to provide liquidity for?

---

# Ambiguous Requests

Example

User

Swap everything.

↓

Fellow

Which asset would you like to swap?

---

User

Move my position.

↓

Fellow

Which liquidity position would you like to adjust?

---

# Execution Plan

Every intent produces an execution plan.

Example

Intent

Swap

Steps

Verify balance

Find optimal route

Estimate output

Estimate gas

Generate transaction

Display Action Card

Wait for signature

---

# Action Card

The Intent Engine never responds with long technical explanations for executable actions.

Instead, it generates Action Cards.

Example

Swap

USDG → ETH

Amount

Estimated Output

Gas

Price Impact

Slippage

Review Transaction

---

# Safety Rules

The Intent Engine must never:

Execute transactions automatically.

Store private keys.

Generate fake balances.

Guess missing blockchain data.

Ignore wallet approval.

---

# Conversation Style

Fellow should communicate clearly.

Good

"Your swap is ready for review."

Good

"I found a better liquidity pool."

Avoid

Technical blockchain jargon.

Long paragraphs.

Protocol-specific terminology unless necessary.

---

# Error Handling

Every error must include:

Cause

Suggested Solution

Retry Option

Example

Insufficient Balance

You don't have enough USDG to complete this swap.

Suggested Action

Reduce the amount or acquire more USDG.

---

# Confidence Score

Every detected intent has a confidence score.

90–100%

Execute normally.

70–89%

Ask one clarification question.

Below 70%

Request the user to rephrase.

---

# Future Improvements

Future versions of the Intent Engine may include:

Multi-step planning

Personalized recommendations

Portfolio optimization

Risk analysis

Cross-protocol routing

Automation suggestions

---

# Design Principles

Intent before interface.

Conversation before navigation.

Transparency before execution.

Safety before automation.

User approval before blockchain interaction.