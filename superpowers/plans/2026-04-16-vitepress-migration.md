---
title: 2026-04-16-vitepress-migration
date: 2026-04-16
---

# VitePress Migration Implementation Plan ​

**For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 迁移从 VuePress 1.x 到 VitePress，采用深色主题优先设计，内容类型分为 Posts（算法）和 Docs（笔记）两大类

**Architecture:** 基于 VitePress 默认主题定制，通过 CSS 变量实现深色模式，使用 frontmatter 支持分类和标签，导航和侧边栏在 config.ts 中配置

**Tech Stack:** VitePress ^1.x, TypeScript, CSS

## File Structure ​
```
docs/
├── .vitepress/
│   ├── config.ts          # 主配置文件
│   ├── styles/
│   │   └── index.css      # 自定义样式
│   └── dist/              # 构建输出
├── posts/                 # 算法文章（新建）
│   ├── index.md           # 文章列表页
│   ├── code_caprice/
│   │   ├── index.md
│   │   └── LC27.md
│   ├── code_top/
│   │   └── index.md
│   └── high_frequency/
│       └── index.md
├── docs/                  # 笔记文档（从 notes/ 迁移）
│   ├── index.md
│   ├── go/
│   │   ├── index.md
│   │   ├── readme.md
│   │   ├── 并发.md
│   │   ├── 高级.md
│   │   └── runtime.md
│   ├── db/
│   │   └── index.md
│   ├── network/
│   │   └── index.md
│   ├── os/
│   │   └── index.md
│   └── system_design/
│       └── index.md
├── about.md               # 关于页面（从 about/README.md 迁移）
├── index.md               # 主页
└── algorithm/             # 旧内容（可删除）
```
## Task 1: 初始化 VitePress 结构 ​

**Files:**
- 
Create: `docs/.vitepress/config.ts`
- 
Create: `docs/.vitepress/styles/index.css`
- 
Create: `docs/index.md`
- 
Modify: `package.json`
- 
[ ] **Step 1: 更新 package.json 依赖**
json```
{
  "devDependencies": {
    "vitepress": "^1.6.0"
  }
}
```
运行: `npm install vitepress`
- [ ] **Step 2: 创建基础 config.ts**typescript```
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Andelu的空间',
  description: 'Andelu的空间,记录学习的点点滴滴,分享技术的快乐.',
  srcDir: '.',
  head: [
    ['link', { rel: 'icon', href: '/assets/img/star.png' }],
  ],
  themeConfig: {
    logo: '/assets/img/logo.png',
    nav: [],
    sidebar: [],
    search: {
      provider: 'local'
    }
  }
})
```- [ ] **Step 3: 创建基础 index.css**css```
:root {
  --vp-c-brand-1: #3b9;
  --vp-c-brand-2: #428bca;
  --vp-c-bg: #1a1a1a;
  --vp-c-bg-soft: #242424;
}

.dark {
  --vp-c-bg: #1a1a1a;
  --vp-c-bg-soft: #242424;
}
```- [ ] **Step 4: 创建主页 index.md**markdown```
---
layout: home

hero:
  name: "Andelu的空间"
  text: "一个用来交流、思考、汇总的空间"
  actions:
    - theme: brand
      text: 关于我
      link: /about
    - theme: alt
      text: 算法 Posts
      link: /posts
    - theme: alt
      text: 笔记 Docs
      link: /docs/go

features:
  - title: 交流
    details: 以独有个体，身处六度空间链接交流。
  - title: 思考
    details: 生活千变万化，深处其中自由思考，随风变化。
  - title: 汇总
    details: 居安思危，梳理内容，坚定脚步。
---
```- [ ] **Step 5: 运行 dev server 验证**
运行: `npm run docs:dev` 预期: VitePress 开发服务器启动，无报错

## Task 2: 配置导航栏 (Nav) ​

**Files:**
- 
Modify: `docs/.vitepress/config.ts`
- 
[ ] **Step 1: 更新 config.ts 添加 nav 配置**
typescript```
import { defineConfig } from 'vitepress'

export default defineConfig({
  // ... existing config
  themeConfig: {
    logo: '/assets/img/logo.png',
    nav: [
      { text: '首页', link: '/' },
      {
        text: 'Posts',
        link: '/posts/',
        activeMatch: '/posts/'
      },
      {
        text: 'Docs',
        link: '/docs/',
        activeMatch: '/docs/'
      },
      { text: '关于', link: '/about' }
    ],
    sidebar: {
      '/posts/': [
        {
          text: '算法',
          items: [
            { text: '代码随想录', link: '/posts/code_caprice/' },
            { text: 'CodeTop', link: '/posts/code_top/' },
            { text: '高频算法', link: '/posts/high_frequency/' }
          ]
        }
      ],
      '/docs/': [
        {
          text: 'Go',
          items: [
            { text: 'Go笔记', link: '/docs/go/' },
            { text: '并发', link: '/docs/go/并发' },
            { text: '高级', link: '/docs/go/高级' },
            { text: 'runtime', link: '/docs/go/runtime' }
          ]
        },
        {
          text: '数据库',
          items: [
            { text: 'DB', link: '/docs/db/' }
          ]
        },
        {
          text: '网络',
          items: [
            { text: 'Network', link: '/docs/network/' }
          ]
        },
        {
          text: '操作系统',
          items: [
            { text: 'OS', link: '/docs/os/' }
          ]
        },
        {
          text: '系统设计',
          items: [
            { text: 'System Design', link: '/docs/system_design/' }
          ]
        }
      ]
    },
    search: {
      provider: 'local'
    }
  }
})
```- [ ] **Step 2: 验证导航显示正确**
运行: `npm run docs:dev` 验证: 导航栏显示 首页、Posts、Docs、关于，Dropdown 正常工作

## Task 3: 创建 Posts 页面结构 ​

**Files:**
- 
Create: `docs/posts/index.md`
- 
Create: `docs/posts/code_caprice/index.md`
- 
Create: `docs/posts/code_top/index.md`
- 
Create: `docs/posts/high_frequency/index.md`
- 
[ ] **Step 1: 创建 posts/index.md**
markdown```
---
layout: page
title: 算法 Posts
---

# 算法 Posts

::: tip
这里整理了算法相关的内容，包括代码随想录、CodeTop、高频算法等系列。
:::

## 系列

- [代码随想录](/posts/code_caprice/) - 代码随想录算法系列
- [CodeTop](/posts/code_top/) - CodeTop 高频算法
- [高频算法](/posts/high_frequency/) - 面试高频算法真题
```- [ ] **Step 2: 创建各 series 的 index.md**markdown```
---
layout: page
title: 代码随想录
---

# 代码随想录

代码随想录算法系列笔记。
```
(类似结构创建 code_top/index.md 和 high_frequency/index.md)
- [ ] **Step 3: 验证页面可访问**
运行: `npm run docs:dev` 访问: /posts/, /posts/code_caprice/, /posts/code_top/, /posts/high_frequency/

## Task 4: 迁移算法文章 (code_caprice) ​

**Files:**
- 
Create: `docs/posts/code_caprice/LC27.md` (从 docs/algorithm/code_caprice/LC27.md 迁移)
- 
[ ] **Step 1: 创建 LC27.md 带头matter**
markdown```
---
title: "LC27. 移除元素"
date: 2023-01-03
updated: 2024-07-13
category: code_caprice
tags: [双指针, 代码随想录]
---

## LC27.  移除元素

首次时间：2023-1-3
更新时间：2024年7月13日17:56:56

代码随想录：双指针系列

题目link: <https://leetcode.cn/problems/remove-element/>

问题question:
  给你一个数组 nums 和一个值 val，你需要 原地 移除所有数值等于 val 的元素，并返回移除后数组的新长度。

... (rest of content)
```- [ ] **Step 2: 验证文章渲染正确**
访问: /posts/code_caprice/LC27/

## Task 5: 迁移算法文章 (code_top 和 high_frequency) ​

**Files:**
- 
Create: `docs/posts/code_top/` (从 docs/algorithm/code_top/ 迁移)
- 
Create: `docs/posts/high_frequency/` (从 docs/algorithm/high_frequency/ 迁移)
- 
[ ] **Step 1: 迁移 code_top 内容**

为每个 markdown 文件添加 frontmatter:
markdown```
---
title: "文件标题"
date: (根据实际情况填写)
category: code_top
tags: [CodeTop]
---
```- [ ] **Step 2: 迁移 high_frequency 内容**
为每个 markdown 文件添加 frontmatter:
markdown```
---
title: "文件标题"
date: (根据实际情况填写)
category: high_frequency
tags: [高频算法]
---
```- [ ] **Step 3: 创建 code_top/index.md 和 high_frequency/index.md**markdown```
---
layout: page
title: CodeTop
---

# CodeTop

CodeTop 高频算法系列笔记。
```
## Task 6: 创建 Docs 笔记结构 ​

**Files:**
- 
Create: `docs/docs/index.md`
- 
Create: `docs/docs/go/index.md`
- 
Create: `docs/docs/go/readme.md`
- 
Create: `docs/docs/go/并发.md`
- 
Create: `docs/docs/go/高级.md`
- 
Create: `docs/docs/go/runtime.md`
- 
Create: `docs/docs/db/index.md`
- 
Create: `docs/docs/network/index.md`
- 
Create: `docs/docs/os/index.md`
- 
Create: `docs/docs/system_design/index.md`
- 
[ ] **Step 1: 创建 docs/index.md**
markdown```
---
layout: page
title: 笔记 Docs
---

# 笔记 Docs

::: tip
这里整理了技术笔记，包括 Go、数据库、网络、操作系统、系统设计等内容。
:::
```- [ ] **Step 2: 迁移 Go 笔记**
从 docs/notes/go/ 迁移所有内容到 docs/docs/go/，保持文件名和内容不变
- 
[ ] **Step 3: 迁移其他笔记**
- 
docs/notes/db/ → docs/docs/db/
- 
docs/notes/network/ → docs/docs/network/
- 
docs/notes/os/ → docs/docs/os/
- 
docs/notes/system_design/ → docs/docs/system_design/
- 
[ ] **Step 4: 验证 Docs 导航**

运行: `npm run docs:dev` 验证: 侧边栏显示 Go、DB、Network、OS、System Design 各 section

## Task 7: 迁移 About 页面 ​

**Files:**
- 
Create: `docs/about.md` (从 docs/about/README.md 迁移)
- 
[ ] **Step 1: 迁移 about 内容**
markdown```
---
layout: page
title: 关于
---

# 关于我

你好，我是andelu, 目前就职于一家互联网公司...

(迁移原有内容)
```- [ ] **Step 2: 验证页面**
访问: /about/

## Task 8: 配置深色主题和样式 ​

**Files:**
- 
Modify: `docs/.vitepress/styles/index.css`
- 
[ ] **Step 1: 更新 CSS 实现深色主题**
css```
:root {
  --vp-c-brand-1: #3b9;
  --vp-c-brand-2: #428bca;
  --vp-c-bg: #ffffff;
  --vp-c-bg-soft: #f5f5f5;
}

.dark {
  --vp-c-bg: #1a1a1a;
  --vp-c-bg-soft: #242424;
  --vp-c-text-1: #e0e0e0;
  --vp-c-text-2: #b0b0b0;
}

.vp-doc h1, .vp-doc h2, .vp-doc h3 {
  font-weight: 600;
}
```- [ ] **Step 2: 验证深色模式切换**
运行 dev server，点击主题切换按钮，确认深色/浅色切换正常

## Task 9: 更新构建和部署脚本 ​

**Files:**
- 
Modify: `docs/deploy.sh` (或 package.json scripts)
- 
[ ] **Step 1: 更新 package.json scripts**
json```
{
  "scripts": {
    "docs:dev": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "docs:preview": "vitepress preview docs",
    "deploy": "bash deploy.sh"
  }
}
```- [ ] **Step 2: 检查 deploy.sh 是否需要更新**
阅读现有 deploy.sh，根据 VitePress 输出目录 (docs/.vitepress/dist) 更新路径
- [ ] **Step 3: 测试完整构建**
运行: `npm run docs:build` 预期: 构建成功，输出到 docs/.vitepress/dist/

## Task 10: 清理旧文件 ​

**Files:**
- 
Delete: `docs/algorithm/` (旧算法内容，已迁移)
- 
Delete: `docs/notes/` (旧笔记内容，已迁移)
- 
Delete: `docs/about/` (已迁移)
- 
Delete: `docs/.vuepress/` (旧 VuePress 配置)
- 
Delete: `node_modules/vuepress*` (旧依赖)
- 
[ ] **Step 1: 删除旧目录**
bash```
rm -rf docs/algorithm docs/notes docs/about docs/.vuepress
```- [ ] **Step 2: 更新 .gitignore**
添加: `.vitepress/cache/`, `.vitepress/dist/`
- [ ] **Step 3: 提交清理**bash```
git add -A
git commit -m "chore: remove old VuePress files after migration"
```
## Self-Review Checklist ​
- [ ] Spec coverage: 所有 design spec 中的要求都有对应的 task- [ ] Placeholder scan: 无 TBD、TODO、fill in later 等占位符- [ ] Type consistency: config.ts 中使用正确的 TypeScript 类型- [ ] Migration mapping: 所有旧路径都映射到新路径- [ ] Frontmatter: 算法文章都添加了 date、category、tags
