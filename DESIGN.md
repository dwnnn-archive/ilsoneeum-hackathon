---
name: "일손이음"
description: "청도 농촌 일자리의 조건을 살펴보고 시연 흐름으로 연결하는 모바일 우선 서비스."
colors:
  page: "#f7f7fa"
  paper: "#ffffff"
  ink: "#242326"
  muted: "#77767d"
  line: "#eeedf1"
  primary: "#b94e0c"
  primary-dark: "#963b08"
  primary-ink: "#783006"
  primary-tint: "#fff1e5"
  field-green: "#7eaa70"
  success: "#557a57"
  danger: "#a4352b"
typography:
  display:
    fontFamily: "Pretendard, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "clamp(36px, 4vw, 49px)"
    fontWeight: 800
    lineHeight: "1.3"
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Pretendard, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: "1.4"
  body:
    fontFamily: "Pretendard, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "1.7"
rounded:
  card: "16px"
  modal: "24px"
  control: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 20px"
    height: "46px"
  job-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "19px"
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "40px"
---

# Design System: 일손이음

## Overview

**Creative North Star: "청도의 들판으로 이어지는 일자리"**

The user-provided HTML and CSS establish a warm, approachable marketplace: a sunlit field illustration introduces Cheongdo, orange carries the main action, and rounded white job cards make short-term work easy to scan. The page leads with work discovery rather than impact claims. All listings and local interactions are visibly demonstrative.

**Key characteristics**
- Warm orange action color against a quiet light-gray ground.
- A simple CSS field scene as the signature home illustration.
- Rounded cards and compact, scannable work-condition metadata.
- A mobile bottom bar for switching between worker and farmer tasks.
- Optional AI assistance shown inside the relevant matching and posting flows.

## Colors

- **Primary orange** (#b94e0c): primary actions and important highlights.
- **Dark orange** (#963b08): hover and pressed action state.
- **Orange ink** (#783006): text on the pale orange tint.
- **Orange tint** (#fff1e5): secondary highlights and AI-assistance surfaces.
- **Ink** (#242326): headings and primary text.
- **Muted** (#77767d): secondary labels and supporting copy.
- **Page** (#f7f7fa): main background.
- **Paper** (#ffffff): cards, dialogs, and inputs.
- **Line** (#eeedf1): subtle dividers.
- **Field green** (#7eaa70): landscape illustration only.
- **Success** (#557a57) and **danger** (#a4352b): semantic state messages.

Color must not be the only way to distinguish sample, selected, loading, success, or error states.

## Typography

Use the Korean sans-serif system stack: `Pretendard`, `Apple SD Gothic Neo`, `Noto Sans KR`, `Malgun Gothic`, then `sans-serif`. Do not fetch web fonts at runtime. Headings use a bold, compact scale; work conditions use tabular numbers where practical. Body copy stays short and readable on narrow screens.

## Layout and components

- The desktop content is centered at approximately 1128–1180px, with a two-column home hero and three-column job grid.
- At 760px and below, the page becomes a one-column mobile experience with a safe-area-aware bottom tab bar.
- Job cards use a 16px radius, white surface, and soft interaction states. Primary buttons are warm orange; supporting actions use a light outline.
- Dialogs use native `<dialog>` elements and preserve keyboard focus.
- AI matching is placed above the worker's filters. AI drafting appears next to the farmer's description input. Both show provider status, loading, and recovery states.
- The field illustration is composed from CSS shapes; do not imply it is a photograph or verified local landscape.

## Responsible presentation

- Label sample listings and browser-only applications clearly.
- Never present invented counts as service impact, verified opportunities, or successful placements.
- AI suggestions are advisory. Keep all extracted conditions editable and require explicit farmer review before saving a demo listing.
- No real personal information should be entered or sent to AI providers.
