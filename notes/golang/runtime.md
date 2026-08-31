---
title: Go Runtime：调度、内存与 GC
date: 2026-08-31
category: Golang
tags: [Go, runtime, GMP, GC, 调度]
summary: Go runtime 专题，覆盖 GMP 调度模型、内存分配、垃圾回收等运行时机制。
---

# Go Runtime

## 概述

Go 程序运行时由 runtime 调度，包括 goroutine 调度（GMP 模型）、内存分配、垃圾回收（GC）等核心机制。这一专题适合需要理解 Go 程序底层行为、排查性能或调优 GC 的同学。

## 目录

- [Go GC](/notes/golang/go-interview/gc.html) - 三色标记法、STW、GC 调优与演进
- [Go 并发基础](/notes/golang/go-interview/concurrency.html) - goroutine、channel、select、context、GMP 模型