---
title: Go 并发：goroutine / channel / sync / GC
date: 2026-08-31
category: Golang
tags: [Go, 并发, goroutine, channel, sync, GC]
summary: Go 并发专题合集：从 goroutine 基础、channel 通信、sync 原语到 GC 调优，面试高频考点一网打尽。
---

# Go 并发

## 概述

Go 的并发能力由 goroutine、channel、sync 包和 runtime 调度器共同构成。这一专题按"心智模型 → 原语工具 → 运行时机制"的顺序组织，适合系统复习或面试突击。

## 目录

- [并发基础](/notes/golang/go-interview/concurrency.html) - goroutine、channel、select、context、GMP 模型
- [sync 包](/notes/golang/go-interview/sync.html) - Mutex、RWMutex、WaitGroup、Pool、Once
- [GC](/notes/golang/go-interview/gc.html) - 三色标记法、STW、GC 调优与演进

## 阅读顺序建议

1. 先看「并发基础」建立 goroutine / channel / GMP 的整体心智模型
2. 再看「sync 包」掌握常用并发原语的适用场景与陷阱
3. 最后看「GC」深入理解 runtime 层垃圾回收对并发程序的影响