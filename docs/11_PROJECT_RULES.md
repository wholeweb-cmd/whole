# Project Rules

## Overview

This document defines the mandatory rules that govern the development of Fellow.

Every contributor, engineer, designer, AI model, and future team member must follow these rules.

These rules take priority over implementation preferences.

---

# Product Rules

## Rule 001

Conversation is the primary interface.

Users should accomplish tasks by expressing intent in natural language.

---

## Rule 002

Every blockchain action begins with user intent.

No transaction starts from clicking random buttons.

---

## Rule 003

Every executable action must generate an Action Card.

Long paragraphs should never replace executable UI.

---

## Rule 004

Every transaction requires explicit wallet approval.

No automatic execution.

Ever.

---

## Rule 005

Users always own their assets.

Fellow never holds custody.

---

## Rule 006

Users always control their wallet.

Private keys are never requested or stored.

---

## Rule 007

Blockchain is the source of truth.

Application databases are used only for application state and caching.

---

## Rule 008

The UI must prioritize clarity over decoration.

Visual simplicity is more important than visual complexity.

---

## Rule 009

Every feature must be understandable without documentation.

If users need documentation to use a feature, the UX should be improved.

---

## Rule 010

Errors must explain:

- What happened
- Why it happened
- How to fix it

Never display raw blockchain errors.

---

# Engineering Rules

## Rule 011

Every module must have a single responsibility.

---

## Rule 012

No duplicated business logic.

---

## Rule 013

Every external dependency must have a clear purpose.

---

## Rule 014

Every API endpoint must validate input.

Never trust client-side data.

---

## Rule 015

Every blockchain transaction must be simulated before execution whenever possible.

---

## Rule 016

Sensitive information must never be logged.

Never log:

- Private Keys
- Seed Phrases
- Wallet Signatures
- Access Tokens

---

## Rule 017

Every pull request must preserve backwards compatibility unless explicitly approved.

---

## Rule 018

Security has higher priority than convenience.

---

# AI Rules

## Rule 019

The Intent Engine never executes blockchain transactions.

It only prepares execution plans.

---

## Rule 020

AI must ask for clarification when confidence is low.

Never guess user intent.

---

## Rule 021

AI responses should be concise.

Avoid unnecessary explanations.

---

## Rule 022

AI should prefer Action Cards over long text when a transaction can be executed.

---

## Rule 023

AI recommendations must be based on available blockchain data.

Never fabricate analytics.

---

## Rule 024

AI must never claim a transaction has completed until blockchain confirmation is received.

---

# Design Rules

## Rule 025

Dark mode is the default experience.

---

## Rule 026

Every primary action must be visually obvious.

---

## Rule 027

Every screen must have a clear purpose.

Avoid clutter.

---

## Rule 028

Animations must support usability.

Never animate for decoration alone.

---

## Rule 029

Responsive layouts are required.

Desktop, tablet, and mobile must all be supported.

---

# Performance Rules

## Rule 030

Application startup should feel instant.

---

## Rule 031

API responses should be fast.

Target response time:

Under 500ms whenever possible.

---

## Rule 032

Conversation responses should feel natural.

Target AI response:

Under 2 seconds.

---

# Documentation Rules

## Rule 033

Every major feature requires documentation before implementation.

---

## Rule 034

Documentation is part of the product.

Outdated documentation is considered a bug.

---

## Rule 035

Architecture changes must be reflected in documentation before code is merged.

---

# Long-Term Principles

- Simplicity over complexity.
- Transparency over automation.
- Security over convenience.
- Conversation over navigation.
- User ownership above everything.