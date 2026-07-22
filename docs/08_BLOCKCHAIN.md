# Blockchain Architecture

## Overview

Fellow interacts with Robinhood Chain through secure blockchain integrations.

The blockchain is the source of truth for all on-chain assets, balances, positions, and transactions.

Fellow never stores or controls user assets.

---

# Supported Network

Primary Network

Robinhood Chain

Future Expansion

Additional EVM-compatible networks may be supported through protocol adapters.

---

# Wallet Integration

Supported Wallet Standards

- WalletConnect
- Injected EVM Wallets
- Future Embedded Wallet Support

Responsibilities

- Connect Wallet
- Disconnect Wallet
- Switch Network
- Sign Messages
- Sign Transactions

Private keys never leave the wallet.

---

# Blockchain Reads

Read-only operations include:

- Token balances
- Native balance
- ERC-20 balances
- LP positions
- Pool information
- Pending fees
- Transaction history
- Current block
- Gas price

These operations never require a wallet signature.

---

# Blockchain Writes

Write operations include:

- Token swap
- Add liquidity
- Remove liquidity
- Claim fees
- Token approval
- Position updates

Every write operation requires explicit wallet approval.

---

# Transaction Lifecycle

1. User submits a request.
2. Intent Engine creates an execution plan.
3. Required blockchain data is fetched.
4. Transaction payload is built.
5. User reviews the transaction.
6. Wallet requests signature.
7. Signed transaction is broadcast.
8. Transaction hash is returned.
9. Confirmation is monitored.
10. Portfolio is refreshed.

---

# Token Approvals

Before interacting with ERC-20 tokens, Fellow checks allowance.

If allowance is insufficient:

1. Build approval transaction.
2. User signs approval.
3. Wait for confirmation.
4. Continue with requested transaction.

Approval transactions are never hidden from the user.

---

# Swap Flow

Responsibilities

- Discover supported pools.
- Find optimal route.
- Estimate output.
- Estimate gas.
- Calculate price impact.
- Build transaction.

The blockchain transaction is created only after user confirmation.

---

# Liquidity Flow

Responsibilities

- Discover available pools.
- Estimate deposit ratio.
- Recommend price range.
- Build add liquidity transaction.
- Build remove liquidity transaction.

All calculations are displayed before execution.

---

# Position Management

Each position includes:

- Position ID
- Pool
- Token Pair
- Liquidity
- Current Value
- Current Range
- Unclaimed Fees
- APR
- Unrealized PnL

Position data is always read from the blockchain.

---

# Gas Estimation

Before every transaction, Fellow estimates:

- Network Gas Price
- Estimated Gas Limit
- Estimated Total Cost

Users always see gas estimates before signing.

---

# Transaction Monitoring

Transaction States

- Pending
- Confirming
- Confirmed
- Failed
- Cancelled

Fellow continuously monitors transaction status and updates the interface accordingly.

---

# RPC Providers

The system should support multiple RPC endpoints.

Responsibilities

- Failover
- Retry logic
- Health monitoring
- Load balancing

The application should automatically switch to a healthy RPC provider if one becomes unavailable.

---

# Smart Contract Interaction

Fellow interacts only with audited protocol contracts.

The application never deploys contracts on behalf of users during the MVP.

All contract interactions must be deterministic and verifiable.

---

# Security Principles

- Never request private keys.
- Never request seed phrases.
- Never bypass wallet confirmation.
- Never modify transaction data after user review.
- Never broadcast unsigned transactions.

---

# Error Handling

Possible blockchain errors

- RPC unavailable
- Transaction reverted
- Gas estimation failed
- Token approval failed
- Pool unavailable
- Unsupported token
- Network mismatch

Each error must include:

- Error description
- Suggested solution
- Retry option

---

# Future Expansion

Future blockchain capabilities may include:

- Multi-chain support
- Cross-chain routing
- Automated rebalancing
- Smart account integration
- Account abstraction
- Intent settlement networks

---

# Design Principles

Blockchain is the single source of truth.

Every write operation requires user approval.

Every transaction must be transparent.

Every blockchain interaction must be deterministic.

Security always takes priority over convenience.