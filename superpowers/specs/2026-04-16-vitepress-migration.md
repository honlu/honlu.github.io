---
title: 2026-04-16-vitepress-migration
date: 2026-04-16
---

# VitePress Migration Design ​

## Overview ​

Migrate from VuePress 1.x to VitePress with a full redesign inspired by Stellar theme aesthetics (dark mode first, blog + wiki hybrid structure).

## Goals ​
- Performance: Faster dev server and build via Vite- Features: Modern VitePress features (built-in search, Shiki highlighting, dark mode)- Structure: Content-type based organization (Posts for algorithms, Docs for notes)- Design: Dark mode first, clean modern developer-focused aesthetic
## Site Structure ​
```
/                       → Homepage (hero + recent posts)
├── posts/              → Algorithm posts listing
│   ├── code_caprice/   → 代码随想录 series
│   ├── code_top/       → CodeTop series
│   └── high_frequency/ → 高频算法 series
├── docs/               → Wiki/Docs home
│   ├── go/             → Go notes
│   ├── db/             → Database notes
│   ├── network/        → Network notes
│   ├── os/             → OS notes
│   └── system_design/  → System design notes
└── about/              → About page
```
## Visual Design ​

### Theme ​
- Dark mode as primary theme- VitePress default theme customized with CSS variables- Inspired by Stellar's clean, minimal aesthetic
### Color Palette ​
- Background: Deep dark (#1a1a1a or similar)- Accent: Cyan/blue (#3b9, #428bca)- Text: Light gray for readability- Code blocks: Enhanced syntax highlighting via Shiki
### Typography ​
- Sans-serif for body text- Monospace for code (JetBrains Mono or system monospace)
## Features ​

### Posts System (Algorithm Content) ​
- Timeline view for algorithm posts- Category support via frontmatter- Tag support- Sort by date (newest first)- Each post has: title, date, category, solutions, code
### Docs System (Reference Content) ​
- Clean wiki-style navigation- Collapsible sidebar- Go, DB, Network, OS, System Design sections
### Navigation ​
- Top navbar: Home, Posts, Docs, About- Posts dropdown: Code Caprice, Code Top, High Frequency- Docs dropdown: Go, DB, Network, OS, System Design
### Additional Features ​
- Local search (VitePress built-in)- Dark/Light theme toggle- Last updated timestamps- Code copy button- Back to top
## Content Migration ​

### Algorithm Posts (17 files → posts/) ​
Original PathNew Pathdocs/algorithm/code_caprice/LC27.mddocs/posts/code_caprice/LC27.mddocs/algorithm/code_top/docs/posts/code_top/docs/algorithm/high_frequency/docs/posts/high_frequency/
Frontmatter additions:
yaml```
---
title: "LC27. 移除元素"
date: 2023-01-03
updated: 2024-07-13
category: code_caprice
tags: [双指针, 代码随想录]
---
```
### Notes (docs/ → docs/) ​
OriginalNewdocs/notes/go/docs/docs/go/docs/notes/db/docs/docs/db/docs/notes/network/docs/docs/network/docs/notes/os/docs/docs/os/docs/notes/system_design/docs/docs/system_design/
### About ​
OriginalNewdocs/about/README.mddocs/about.md
## Technical Implementation ​

### Dependencies ​
- vitepress: ^1.x (latest stable)- Remove: vuepress, vuepress-plugin-auto-sidebar
### Configuration ​
- Single `.vitepress/config.ts` with type-safe config- Custom CSS in `.vitepress/styles/`- Nav and sidebar in config file
### Build & Deploy ​
- `npm run docs:dev` — Development server- `npm run docs:build` — Production build- Output to `docs/.vitepress/dist/`- Deploy script updates for new structure
## Migration Sequence ​
- Initialize VitePress structure- Create base config and theme- Set up navigation (nav, sidebar)- Migrate algorithm posts with frontmatter- Migrate docs content- Migrate about page- Update package.json scripts- Test build and deploy
## Out of Scope ​
- Comments system (can add later with gitalk/utterances)- Timeline/social features (Stellar-specific)- Multi-author support- Dynamic data components
