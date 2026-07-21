# Database Design

## Overview

Fellow stores only off-chain application data.

Blockchain data remains the source of truth for assets, balances, liquidity positions, and transaction history.

The database is used for sessions, conversations, analytics caching, and application metadata.

---

# Database Technology

Primary Database

PostgreSQL

Cache

Redis

ORM

Prisma

---

# Entity Relationship Diagram

User
 ├── Sessions
 ├── Conversations
 ├── Messages
 ├── Preferences

Wallet
 ├── User

Conversation
 ├── Messages

ExecutionPlan
 ├── Conversation

AnalyticsCache

Protocol

PoolCache

---

# User

Description

Represents an application user.

Fields

id

wallet_address

created_at

updated_at

---

# Session

Description

Represents an authenticated wallet session.

Fields

id

user_id

session_token

expires_at

created_at

last_active

---

# Conversation

Description

Stores conversation history.

Fields

id

user_id

title

created_at

updated_at

---

# Message

Description

Stores every message exchanged.

Fields

id

conversation_id

role

content

created_at

metadata

Role values

User

Assistant

System

---

# Execution Plan

Description

Stores generated execution plans before execution.

Fields

id

conversation_id

intent

status

parameters

estimated_gas

estimated_output

created_at

expires_at

Status

Pending

Approved

Cancelled

Expired

Executed

---

# Analytics Cache

Description

Temporary analytics cache.

Fields

id

cache_key

payload

expires_at

updated_at

---

# Pool Cache

Description

Cached liquidity pool information.

Fields

id

pool_address

protocol

token_a

token_b

apr

tvl

volume_24h

fees_24h

updated_at

---

# Protocol

Description

Supported protocol metadata.

Fields

id

name

version

status

website

---

# User Preferences

Description

Stores optional user settings.

Fields

id

user_id

language

theme

default_slippage

created_at

updated_at

---

# Audit Log

Description

Stores important application events.

Fields

id

event

wallet

metadata

created_at

Examples

Wallet Connected

Execution Created

Execution Cancelled

RPC Failure

Conversation Deleted

---

# Indexes

Wallet Address

Conversation ID

Session Token

Execution Status

Pool Address

Cache Key

---

# Cache Policy

Redis stores

Portfolio cache

Pool cache

Analytics cache

Intent cache

RPC responses

Conversation context

Cache expiration

Portfolio

30 seconds

Pools

60 seconds

Analytics

5 minutes

Intent Context

30 minutes

---

# Data Retention

Conversation History

Until user deletes.

Sessions

Automatically expire.

Execution Plans

30 days.

Analytics Cache

Automatically deleted after expiration.

Logs

90 days.

---

# Security

Sensitive data must never be stored.

Never store

Private Keys

Seed Phrases

Wallet Passwords

Signatures

Biometric Data

Raw RPC Credentials

---

# Design Principles

Blockchain is always the source of truth.

Database stores application state only.

Every entity should have a single responsibility.

Caching should improve performance without affecting correctness.

Sensitive information is never persisted.