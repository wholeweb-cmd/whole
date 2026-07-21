# System Architecture

## Overview

Fellow is built using a modular architecture.

Each component has a single responsibility and communicates through clearly defined interfaces.

The system is designed to be scalable, maintainable, and extensible.

---

# High Level Architecture

+----------------------+
|      Frontend        |
+----------+-----------+
           |
           v
+----------------------+
|      API Server      |
+----------+-----------+
           |
           |
+----------+-----------+
|     Intent Engine    |
+----------+-----------+
           |
           |
+----------+-----------+
| Execution Planner    |
+----------+-----------+
           |
           |
+----------+-----------+
| Protocol Adapters    |
+----------+-----------+
           |
           |
+----------+-----------+
| Robinhood RPC Nodes  |
+----------------------+

---

# Frontend

Responsibilities

- Chat Interface
- Portfolio Dashboard
- Analytics
- Pool Explorer
- LP Management
- Transaction Review
- Wallet Connection

The frontend never talks directly to blockchain nodes.

Every request goes through the API.

---

# Backend API

Responsibilities

- Authentication
- Session Management
- Portfolio Queries
- Intent Requests
- Analytics
- Pool Discovery
- Execution Planning

The backend acts as the central coordinator.

---

# Intent Engine

Responsibilities

- Understand user intent
- Extract parameters
- Detect missing information
- Validate requests
- Generate structured output

Example

User

Swap 500 USDG into ETH

↓

Intent

Swap

↓

Parameters

Amount: 500

From: USDG

To: ETH

---

# Execution Planner

The Execution Planner converts intents into executable blockchain actions.

Responsibilities

- Validate balances
- Discover pools
- Calculate routes
- Estimate gas
- Estimate output
- Build transaction requests

No transaction is executed at this stage.

---

# Protocol Adapter Layer

Every protocol integration must use an adapter.

Current adapters

- Swap Adapter
- Liquidity Adapter
- Analytics Adapter
- Position Adapter

Future adapters

- Lending
- Bridge
- Staking

The Intent Engine never communicates directly with protocols.

---

# Blockchain Layer

Responsibilities

- Read blockchain state
- Broadcast transactions
- Monitor confirmations
- Read smart contracts
- Estimate gas

Supported Network

Robinhood Chain

---

# Wallet Layer

Responsibilities

- Connect wallet
- Request signatures
- Switch network
- Disconnect

Wallets never expose private keys to Fellow.

---

# Analytics Engine

Responsibilities

- Pool ranking
- APR calculation
- TVL calculation
- Historical volume
- LP performance
- Position profitability

Analytics are read-only.

---

# Portfolio Engine

Responsibilities

- Token balances
- LP positions
- Pending fees
- Historical performance

Portfolio data is refreshed after every successful transaction.

---

# Session Manager

Stores

- Connected wallet
- Conversation history
- Pending execution plan
- Temporary user preferences

Sessions never contain private keys.

---

# Security Layer

Security principles

- Wallet signature required
- Read-only by default
- No private key storage
- No asset custody
- User approval required
- Transaction simulation before execution

---

# Error Handling

Possible errors

- Wallet disconnected
- Unsupported token
- Pool unavailable
- RPC timeout
- Slippage exceeded
- Transaction reverted

Every error should return:

- Human-readable message
- Cause
- Suggested action

---

# Logging

System logs

- API requests
- Intent parsing
- Execution planning
- Transaction lifecycle
- RPC failures

Sensitive user information must never be logged.

---

# Scalability

The architecture must support:

- Multiple AI models
- Multiple RPC providers
- Multiple protocol adapters
- Horizontal API scaling
- Future multi-chain expansion

---

# Design Principles

- Modular
- Stateless APIs
- Intent-first architecture
- Conversation-first UX
- Security by default
- Human-readable execution
- Easy protocol integration