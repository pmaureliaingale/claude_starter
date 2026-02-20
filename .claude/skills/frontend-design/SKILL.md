---
name: frontend-design
description: Use when making UI/UX decisions, designing component structure, discussing layout, or reviewing frontend code. Applies consistent design principles. ALWAYS use this skill when creating or editing any UI.
---

# Frontend Design

> Remove or replace this skill if this project is not frontend-focused.

## Core Principles

- **Mobile-first** — design for small screens first, enhance for larger ones
- **Accessible by default** — proper ARIA labels, keyboard navigation, focus management, sufficient color contrast
- **Progressive disclosure** — show what the user needs now, not everything at once
- **Ship less JavaScript** — prefer server rendering where possible; client-side only when necessary

## Layout Rules

- Pages that are not full-width must be **centered** — never hug the left edge
- Consistent spacing — pick a scale and stick to it (don't mix utility classes and magic numbers)
- Responsive breakpoints: mobile → tablet → desktop

## Component Guidelines

### When to create a new component
- Extract when a piece of UI is used in more than one place
- Extract when a component exceeds ~200 lines
- Extract when a unit of UI has its own clearly defined responsibility

### Reuse over duplication
If a pattern appears more than once, create a shared component. We do not want duplicate UI code.

## Loading, Error & Empty States

Every async piece of UI needs three states:
1. **Loading** — use Skeleton components, not spinners where possible (less jarring)
2. **Error** — clear message + recovery action (retry, go back, contact support)
3. **Empty** — explain why it's empty and what to do next (don't just show nothing)

## Forms

- Show inline validation errors — not alerts or toasts for validation
- Disable submit button while submitting
- Show success/error feedback after submission
- Never clear a form on error — preserve the user's input

## Interaction Patterns

- Destructive actions (delete, cancel) require confirmation
- Long operations show progress feedback
- Toast notifications for background operations (saved, updated, deleted)

## Accessibility Checklist

- [ ] All interactive elements are keyboard-accessible
- [ ] All images have `alt` text (or `alt=""` if decorative)
- [ ] Form inputs have associated labels
- [ ] Color is not the only way information is conveyed
- [ ] Focus is managed correctly in modals and dialogs
