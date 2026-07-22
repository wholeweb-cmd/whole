# API Specification

## Overview

Fellow exposes a REST API that serves the frontend and AI services.

All responses use JSON.

Base URL

/api/v1

---

# Authentication

Authentication uses wallet signatures.

No username or password exists.

Every authenticated request includes:

Authorization: Bearer <session_token>

---

# Health

GET /health

Description

Returns API health status.

Response

{
  "status": "ok"
}

---

# Session

## Connect Wallet

POST /session/connect

Request

{
  "wallet":"0x..."
}

Response

{
  "session":"..."
}

---

## Disconnect

POST /session/disconnect

Response

{
  "success": true
}

---

# User

GET /user

Returns

- Wallet
- Preferences
- Session Information

---

# Portfolio

GET /portfolio

Returns

- Total Value
- Token Balances
- LP Positions
- Pending Fees

Example

{
  "totalValue": 15230,
  "tokens": [],
  "positions": [],
  "fees": []
}

---

# Chat

POST /chat

Request

{
  "message":"Swap 500 USDG to ETH"
}

Response

{
  "intent":"swap",
  "reply":"I prepared a swap transaction.",
  "executionPlanId":"..."
}

---

# Intent

POST /intent/parse

Description

Converts natural language into structured intent.

Example Request

{
  "message":"Add liquidity to ETH/USDG"
}

Response

{
  "intent":"add_liquidity",
  "parameters":{
      ...
  }
}

---

# Execution Plan

POST /execution/create

Creates execution plan.

Response

{
    "executionPlanId":"..."
}

---

GET /execution/{id}

Returns execution plan.

---

DELETE /execution/{id}

Cancels execution.

---

# Swap

POST /swap/preview

Returns

- Route
- Output
- Gas
- Price Impact
- Slippage

Example

{
  "route":[],
  "estimatedOutput":"",
  "gas":"",
  "priceImpact":""
}

---

POST /swap/execute

Creates blockchain transaction.

No transaction is broadcast until wallet signs.

---

# Liquidity

POST /liquidity/preview

Returns

Recommended Pool

APR

TVL

Price Range

Estimated Deposit

Estimated Fees

---

POST /liquidity/add

Creates add liquidity transaction.

---

POST /liquidity/remove

Creates remove liquidity transaction.

---

GET /positions

Returns all LP positions.

---

GET /positions/{id}

Returns detailed position.

---

# Fees

GET /fees

Returns claimable fees.

---

POST /fees/claim

Creates claim transaction.

---

# Pools

GET /pools

Returns all supported pools.

Filters

Pair

TVL

APR

Volume

Protocol

---

GET /pools/{address}

Returns detailed pool information.

---

# Analytics

GET /analytics

Returns

TVL

Volume

Fees

APR

Top Pools

Trending Pools

---

GET /analytics/trending

Returns trending pools.

---

GET /analytics/top-apr

Returns highest APR pools.

---

# Protocols

GET /protocols

Returns all integrated protocols.

---

# Conversation

GET /conversation

Returns conversation history.

---

POST /conversation/clear

Deletes current conversation.

---

# Preferences

GET /preferences

Returns user settings.

---

PATCH /preferences

Updates

Theme

Language

Default Slippage

---

# Errors

Standard Response

{
  "error": {
      "code":"INVALID_TOKEN",
      "message":"Unsupported token."
  }
}

---

# HTTP Status Codes

200 OK

201 Created

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

429 Rate Limited

500 Internal Server Error

503 RPC Unavailable

---

# API Principles

Every blockchain action begins with a preview.

Every transaction requires wallet approval.

No endpoint executes transactions automatically.

Responses must be deterministic.

Errors must be human-readable.