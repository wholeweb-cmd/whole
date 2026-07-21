# Product Requirements Document (PRD)

## Overview

Fellow is a conversational DeFi operating system built exclusively for Robinhood Chain.

Users interact with decentralized finance through natural language instead of navigating complex interfaces.

The first version (MVP) focuses on enabling users to perform the most common DeFi actions safely through conversation.

---

# Product Goals

The MVP should allow users to:

- Connect their wallet
- Understand their portfolio
- Swap any supported token
- Add liquidity
- Remove liquidity
- Claim LP fees
- View LP positions
- Ask questions about their assets
- Execute transactions through conversation

Every interaction should require user approval before execution.

---

# MVP Scope

## Included

### Authentication

- Wallet connection
- Wallet disconnection
- Session management

---

### Portfolio

Users can ask:

- Show my portfolio
- What's my balance?
- Show my LP positions
- Show my unclaimed fees

---

### Swap

Users can ask:

- Swap ETH to USDG
- Swap 100 USDG to ETH
- Swap all of this token into ETH
- Swap using this contract address

Requirements

- Best route selection
- Slippage estimation
- Price impact
- Estimated output
- Gas estimation

---

### Liquidity

Users can ask:

- Add liquidity to ETH/USDG
- Remove liquidity
- Increase my position
- Decrease my position

Requirements

- Pool discovery
- Recommended range
- Current APR
- Estimated fees
- Position preview

---

### Position Management

Users can:

- View positions
- View current range
- View earned fees
- View unrealized PnL
- View utilization

---

### Fee Management

Users can ask:

- Claim fees
- Claim every position
- Show pending rewards

---

### Analytics

Users can ask:

- Best pools today
- Highest APR pools
- Largest pools
- Most active pools
- Highest fee generating pools

---

### Transaction Review

Every blockchain action must generate a review screen.

The review screen includes:

- Action
- Assets
- Amount
- Expected output
- Estimated gas
- Slippage
- Network
- Warnings

Users must approve manually.

---

# Excluded From MVP

The following features are intentionally excluded.

- Bridge
- Lending
- Borrowing
- Staking
- Yield farming automation
- Limit orders
- Copy trading
- Social features
- Notifications
- Mobile application
- Multi-chain support

---

# Functional Requirements

## FR-001

Users must connect a wallet before executing any transaction.

---

## FR-002

Natural language must be the primary input.

---

## FR-003

Every intent must produce an execution plan.

---

## FR-004

Every execution plan must be human readable.

---

## FR-005

Every blockchain action requires wallet approval.

---

## FR-006

Users may cancel execution at any time before signing.

---

## FR-007

Failed transactions must return understandable error messages.

---

## FR-008

Conversation history should persist during the active session.

---

# Non-Functional Requirements

Performance

- Response time below 2 seconds for AI replies.
- Transaction preview under 3 seconds.

Security

- No private key storage.
- No custody.
- Read-only portfolio access until user signs.

Scalability

- Modular intent engine.
- Modular protocol adapters.
- Future multi-chain compatibility.

Reliability

- Retry failed RPC requests.
- Detect failed blockchain confirmations.

---

# Success Criteria

A user with no DeFi experience should be able to:

- Connect a wallet.
- Swap a token.
- Add liquidity.
- Claim fees.

Without reading documentation.

---

# Product Constraints

Fellow never:

- Holds user funds.
- Signs transactions.
- Stores private keys.
- Executes transactions without approval.

---

# Acceptance Criteria

The MVP is considered complete when users can successfully perform every supported action using only natural language.

The interface should assist the conversation, not replace it.

Users should feel like they are talking to a knowledgeable teammate rather than operating a complex financial application.