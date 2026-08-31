---
title: Go GC 面试题：三色标记法、STW、内存回收
date: 2026-08-31
category: Golang
tags: [Go, GC, 面试]
summary: Go 垃圾回收面试题，覆盖 GC 算法演进、三色标记法、STW、GC 调优等。
---
> Go 垃圾回收面试题，覆盖 GC 算法演进、三色标记法、STW、GC 调优等。

# 开篇碎碎念

整理自 *Go-Interview* 仓库的 Go并发 模块，重点是 goroutine / channel / sync 包 / GC 这四大块。每道题尽量附上「答案」和「代码示例」，建议按顺序阅读，先建立心智模型，再回头刷面试题。

> 适合人群：刚学完 GMP 模型、准备 Go 高级岗位面试的同学。
# **GC 的认识**

## **1. 什么是 GC，有什么作用？**

`GC`，全称 `GarbageCollection`，即**垃圾回收，是一种自动内存管理的机制**。

**当程序向操作系统申请的内存不再需要时，垃圾回收主动将其回收并供其他代码进行内存申请时候复用，或者将其归还给操作系统**，这种针对内存级别资源的自动回收过程，即为垃圾回收。而负责垃圾回收的程序组件，即为垃圾回收器。

垃圾回收其实一个完美的 “Simplicity is Complicated” 的例子。一方面，程序员受益于 GC，无需操心、也不再需要对内存进行手动的申请和释放操作，GC 在程序运行时自动释放残留的内存。另一方面，GC 对程序员几乎不可见，仅在程序需要进行特殊优化时，通过提供可调控的 API，对 GC 的运行时机、运行开销进行把控的时候才得以现身。

通常，**垃圾回收器的执行过程被划分为两个半独立的组件：**

- **赋值器（Mutator）：这一名称本质上是在指代用户态的代码。因为对垃圾回收器而言，用户态的代码仅仅只是在修改对象之间的引用关系，也就是在对象图（对象之间引用关系的一个有向图）上进行操作。**
- **回收器（Collector）：负责执行垃圾回收的代码。**

## **2. 根对象到底是什么？**

根对象在垃圾回收的术语中又叫做根集合，它**是垃圾回收器在标记过程时最先检查的对象**，包括：

1. 全局变量：程序在编译期就能确定的那些存在于程序整个生命周期的变量。
2. 执行栈：每个 goroutine 都包含自己的执行栈，这些执行栈上包含栈上的变量及指向分配的堆内存区块的指针。
3. 寄存器：寄存器的值可能表示一个指针，参与计算的这些指针可能指向某些赋值器分配的堆内存区块。

## **3. 常见的 GC 实现方式有哪些？**Go 语言的 GC 使用的是什么？

所有的 GC 算法其存在形式可以归结为追踪（Tracing）和引用计数（Reference Counting）这两种形式的混合运用。

- 追踪式 GC

从根对象出发，根据对象之间的引用信息，一步步推进直到扫描完毕整个堆并确定需要保留的对象，从而回收所有可回收的对象。Go、 Java、V8 对 JavaScript 的实现等均为追踪式 GC。

- 引用计数式 GC

每个对象自身包含一个被引用的计数器，当计数器归零时自动得到回收。因为此方法缺陷较多，在追求高性能时通常不被应用。Python、Objective-C 等均为引用计数式 GC。

目前比较常见的 GC 实现方式包括：

- 追踪式，分为多种不同类型，例如：
- 标记清扫：从根对象出发，将确定存活的对象进行标记，并清扫可以回收的对象。
- 标记整理：为了解决内存碎片问题而提出，在标记过程中，将对象尽可能整理到一块连续的内存上。
- 增量式：将标记与清扫的过程分批执行，每次执行很小的部分，从而增量的推进垃圾回收，达到近似实时、几乎无停顿的目的。
- 增量整理：在增量式的基础上，增加对对象的整理过程。
- 分代式：将对象根据存活时间的长短进行分类，存活时间小于某个值的为年轻代，存活时间大于某个值的为老年代，永远不会参与回收的对象为永久代。并根据分代假设（如果一个对象存活时间不长则倾向于被回收，如果一个对象已经存活很长时间则倾向于存活更长时间）对对象进行回收。
- 引用计数：根据对象自身的引用计数来回收，当引用计数归零时立即回收。

关于各类方法的详细介绍及其实现不在本文中详细讨论。对于 Go 而言，Go 的 GC 目前使用的是无分代（对象没有代际之分）、不整理（回收过程中不对对象进行移动与整理）、并发（与用户代码并发执行）的三色标记清扫算法。原因在于：

1. 对象整理的优势是解决内存碎片问题以及“允许”使用顺序内存分配器。但 Go 运行时的分配算法基于 tcmalloc，基本上没有碎片问题。并且顺序内存分配器在多线程的场景下并不适用。Go 使用的是基于 tcmalloc 的现代内存分配算法，对对象进行整理不会带来实质性的性能提升。
2. 分代 GC 依赖分代假设，即 GC 将主要的回收目标放在新创建的对象上（存活时间短，更倾向于被回收），而非频繁检查所有对象。但 Go 的编译器会通过**逃逸分析**将大部分新生对象存储在栈上（栈直接被回收），只有那些需要长期存在的对象才会被分配到需要进行垃圾回收的堆中。也就是说，分代 GC 回收的那些存活时间短的对象在 Go 中是直接被分配到栈上，当 goroutine 死亡后栈也会被直接回收，不需要 GC 的参与，进而分代假设并没有带来直接优势。并且 Go 的垃圾回收器与用户代码并发执行，使得 STW 的时间与对象的代际、对象的 size 没有关系。Go 团队更关注于如何更好地让 GC 与用户代码并发执行（使用适当的 CPU 来执行垃圾回收），而非减少停顿时间这一单一目标上。

## **4. 三色标记法是什么？**

理解**三色标记法**的关键是理解对象的**三色抽象**以及**波面（wavefront）推进**这两个概念。三色抽象只是一种描述追踪式回收器的方法，在实践中并没有实际含义，它的重要作用在于从逻辑上严密推导标记清理这种垃圾回收方法的正确性。也就是说，当我们谈及三色标记法时，通常指标记清扫的垃圾回收。

从垃圾回收器的视角来看，三色抽象规定了三种不同类型的对象，并用不同的颜色相称：

- 白色对象（可能死亡）：未被回收器访问到的对象。在回收开始阶段，所有对象均为白色，当回收结束后，白色对象均不可达。
- 灰色对象（波面）：已被回收器访问到的对象，但回收器需要对其中的一个或多个指针进行扫描，因为他们可能还指向白色对象。
- 黑色对象（确定存活）：已被回收器访问到的对象，其中所有字段都已被扫描，黑色对象中任何一个指针都不可能直接指向白色对象。

这样三种不变性所定义的回收过程其实是一个**波面**不断前进的过程，这个波面同时也是黑色对象和白色对象的边界，灰色对象就是这个波面。

当垃圾回收开始时，只有白色对象。随着标记过程开始进行时，灰色对象开始出现（着色），这时候波面便开始扩大。当一个对象的所有子节点均完成扫描时，会被着色为黑色。当整个堆遍历完成时，只剩下黑色和白色对象，这时的黑色对象为可达对象，即存活；而白色对象为不可达对象，即死亡。这个过程可以视为以灰色对象为波面，将黑色对象和白色对象分离，使波面不断向前推进，直到所有可达的灰色对象都变为黑色对象为止的过程。如下图所示：

![图片](https://mmbiz.qpic.cn/mmbiz_png/ASQrEXvmx63jU0ezFJwDpEqS2onywT318w0CXBdAP8Eiarz73oqUSCJC6AX9RGNwQ4nFVYxDicpRwqXz9Sw4S89Q/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

图中展示了根对象、可达对象、不可达对象，黑、灰、白对象以及波面之间的关系。

## **5. STW 是什么意思？**

`STW` 是 `StoptheWorld` 的缩写，即万物静止，是指在垃圾回收过程中为了保证实现的正确性、防止无止境的内存增长等问题而不可避免的需要停止赋值器进一步操作对象图的一段过程。

在这个过程中整个用户代码被停止或者放缓执行， `STW` 越长，对用户代码造成的影响（例如延迟）就越大，早期 Go 对垃圾回收器的实现中 `STW` 长达几百毫秒，对时间敏感的实时通信等应用程序会造成巨大的影响。我们来看一个例子：

```GO
package main
import (  
  "runtime" 
  "time")
func main() {  
  go func() {   
    for {   
    }  
  }()
  time.Sleep(time.Millisecond)
  runtime.GC()  
  println("OK")
}
```

上面的这个程序在 Go 1.14 以前永远都不会输出 `OK`，其罪魁祸首是 STW 无限制的被延长。

尽管 STW 如今已经优化到了半毫秒级别以下，但这个程序被卡死原因在于仍然是 STW 导致的。原因在于，GC 在进入 STW 时，需要等待让所有的用户态代码停止，但是 `for{}` 所在的 goroutine 永远都不会被中断，从而停留在 STW 阶段。实际实践中也是如此，当程序的某个 goroutine 长时间得不到停止，强行拖慢 STW，这种情况下造成的影响（卡死）是非常可怕的。好在自 Go 1.14 之后，这类 goroutine 能够被异步地抢占，从而使得 STW 的时间如同普通程序那样，不会超过半个毫秒，程序也不会因为仅仅等待一个 goroutine 的停止而停顿在 STW 阶段。

## **6. 如何观察 Go GC？**

我们以下面的程序为例，先使用四种不同的方式来介绍如何观察 GC，并在后面的问题中通过几个详细的例子再来讨论如何优化 GC。

```go
package main
func allocate() {  
  _ = make([]byte, 16->2 MB, 5 MB goal, 12 P
scvg: 8 KB released
scvg: inuse: 3, idle: 60, sys: 63, released: 57, consumed: 6 (MB)
gc 2 @0.001s 2%: 0.018+1.1+0.029 ms clock, 0.22+0.047/0.074/0.048+0.34 ms cpu, 4->7->3 MB, 5 MB goal, 12 P
scvg: inuse: 3, idle: 60, sys: 63, released: 56, consumed: 7 (MB)
gc 3 @0.003s 2%: 0.018+0.59+0.011 ms clock, 0.22+0.073/0.008/0.042+0.13 ms cpu, 5->6->1 MB, 6 MB goal, 12 P
scvg: 8 KB released
scvg: inuse: 2, idle: 61, sys: 63, released: 56, consumed: 7 (MB)
gc 4 @0.003s 4%: 0.019+0.70+0.054 ms clock, 0.23+0.051/0.047/0.085+0.65 ms cpu, 4->6->2 MB, 5 MB goal, 12 P
scvg: 8 KB released
scvg: inuse: 3, idle: 60, sys: 63, released: 56, consumed: 7 (MB)
scvg: 8 KB released
scvg: inuse: 4, idle: 59, sys: 63, released: 56, consumed: 7 (MB)
gc 5 @0.004s 12%: 0.021+0.26+0.49 ms clock, 0.26+0.046/0.037/0.11+5.8 ms cpu, 4->7->3 MB, 5 MB goal, 12 P
scvg: inuse: 5, idle: 58, sys: 63, released: 56, consumed: 7 (MB)
gc 6 @0.005s 12%: 0.020+0.17+0.004 ms clock, 0.25+0.080/0.070/0.053+0.051 ms cpu, 5->6->1 MB, 6 MB goal, 12 P
scvg: 8 KB released
scvg: inuse: 1, idle: 62, sys: 63, released: 56, consumed: 7 (MB)
```

在这个日志中可以观察到两类不同的信息：

```
gc 1 @0.000s 2%: 0.009+0.23+0.004 ms clock, 0.11+0.083/0.019/0.14+0.049 ms cpu, 4->6->2 MB, 5 MB goal, 12 P
gc 2 @0.001s 2%: 0.018+1.1+0.029 ms clock, 0.22+0.047/0.074/0.048+0.34 ms cpu, 4->7->3 MB, 5 MB goal, 12 P
...
```

以及：

```
scvg: 8 KB released
scvg: inuse: 3, idle: 60, sys: 63, released: 57, consumed: 6 (MB)
scvg: inuse: 3, idle: 60, sys: 63, released: 56, consumed: 7 (MB)
...
```

对于用户代码向运行时申请内存产生的垃圾回收：

```
gc 2 @0.001s 2%: 0.018+1.1+0.029 ms clock, 0.22+0.047/0.074/0.048+0.34 ms cpu, 4->7->3 MB, 5 MB goal, 12 P
```

含义由下表所示：

| 字段  | 含义                                           |
| :---- | :--------------------------------------------- |
| gc 2  | 第二个 GC 周期                                 |
| 0.001 | 程序开始后的 0.001 秒                          |
| 2%    | 该 GC 周期中 CPU 的使用率                      |
| 0.018 | 标记开始时， STW 所花费的时间（wall clock）    |
| 1.1   | 标记过程中，并发标记所花费的时间（wall clock） |
| 0.029 | 标记终止时， STW 所花费的时间（wall clock）    |
| 0.22  | 标记开始时， STW 所花费的时间（cpu time）      |
| 0.047 | 标记过程中，标记辅助所花费的时间（cpu time）   |
| 0.074 | 标记过程中，并发标记所花费的时间（cpu time）   |
| 0.048 | 标记过程中，GC 空闲的时间（cpu time）          |
| 0.34  | 标记终止时， STW 所花费的时间（cpu time）      |
| 4     | 标记开始时，堆的大小的实际值                   |
| 7     | 标记结束时，堆的大小的实际值                   |
| 3     | 标记结束时，标记为存活的对象大小               |
| 5     | 标记结束时，堆的大小的预测值                   |
| 12    | P 的数量                                       |

> wall clock 是指开始执行到完成所经历的实际时间，包括其他程序和本程序所消耗的时间；cpu time 是指特定程序使用 CPU 的时间；他们存在以下关系：
>
> - wall clock  - wall clock ≈ cpu time: 未并行执行
> - wall clock > cpu time: 多核优势不明显

对于运行时向操作系统申请内存产生的垃圾回收（向操作系统归还多余的内存）：

```
scvg: 8 KB released
scvg: inuse: 3, idle: 60, sys: 63, released: 57, consumed: 6 (MB)
```

含义由下表所示：

| 字段          | 含义                                                         |
| :------------ | :----------------------------------------------------------- |
| 8 KB released | 向操作系统归还了 8 KB 内存                                   |
| 3             | 已经分配给用户代码、正在使用的总内存大小 (MB)。MB used or partially used spans |
| 60            | 空闲以及等待归还给操作系统的总内存大小（MB）。MB spans pending scavenging |
| 63            | 通知操作系统中保留的内存大小（MB）MB mapped from the system  |
| 57            | 已经归还给操作系统的（或者说还未正式申请）的内存大小（MB）。MB released to the system |
| 6             | 已经从操作系统中申请的内存大小（MB）。MB allocated from the system |

### **方式2：** `go tool trace`

`go tool trace` 的主要功能是将统计而来的信息以一种可视化的方式展示给用户。要使用此工具，可以通过调用 trace API：

```go
package main
func main() {
  f, _ := os.Create("trace.out")  
  defer f.Close() 
  trace.Start(f)  
  defer trace.Stop()  
  (...)
}
```

并通过：

```
$ go tool trace trace.out
2019/12/30 15:50:33 Parsing trace...
2019/12/30 15:50:38 Splitting trace...
2019/12/30 15:50:45 Opening browser. Trace viewer is listening on http://127.0.0.1:51839
```

命令来启动可视化界面：

![图片](https://mmbiz.qpic.cn/mmbiz_png/ASQrEXvmx63jU0ezFJwDpEqS2onywT316M9K59bG0ar8iariaWQNSibR2ZoNya7H8UwTqGNqk6HJ9Rny4nQNghHHA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

选择第一个链接可以获得如下图示：

![图片](https://mmbiz.qpic.cn/mmbiz_png/ASQrEXvmx63jU0ezFJwDpEqS2onywT31Wx5DcsxHX2f2cHpfvTTFbI36ia66Y7aUeSPV2GbGhHe0QscQjViase8w/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

右上角的问号可以打开帮助菜单，主要使用方式包括：

- w/s 键可以用于放大或者缩小视图
- a/d 键可以用于左右移动

### **方式3：** `debug.ReadGCStats`

此方式可以通过代码的方式来直接实现对感兴趣指标的监控，例如我们希望每隔一秒钟监控一次 GC 的状态：

```
func printGCStats() {  t := time.NewTicker(time.Second)  s := debug.GCStats{}  for {    select {    case Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/Licensed to The Apache Software Foundation, http://www.apache.org/
Benchmarking 127.0.0.1 (be patient)Completed 100 requestsCompleted 200 requestsCompleted 300 requestsCompleted 400 requestsCompleted 500 requestsFinished 500 requests

Server Software:        Server Hostname:        127.0.0.1Server Port:            8080
Document Path:          /example2Document Length:        14 bytes
Concurrency Level:      100Time taken for tests:   0.987 secondsComplete requests:      500Failed requests:        0Total transferred:      65500 bytesHTML transferred:       7000 bytesRequests per second:    506.63 [#/sec] (mean)Time per request:       197.382 [ms] (mean)Time per request:       1.974 [ms] (mean, across all concurrent requests)Transfer rate:          64.81 [Kbytes/sec] received
Connection Times (ms)              min  mean[+/-sd] median   maxConnect:        0    1   1.1      0       7Processing:    13  179  77.5    170     456Waiting:       10  168  78.8    162     455Total:         14  180  77.3    171     458
Percentage of the requests served within a certain time (ms)  50%    171  66%    203  75%    222  80%    239  90%    281  95%    335  98%    365  99%    400 100%    458 (longest request)
```

![图片](https://mmbiz.qpic.cn/mmbiz_png/ASQrEXvmx63jU0ezFJwDpEqS2onywT31SFF1gW9wPSPK2TcmjkTFhl1uCkPXrvLO0Zttku33yGgLibQ0icRXwckw/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

GC 反复被触发，一个显而易见的原因就是内存分配过多。我们可以通过 `go tool pprof` 来查看究竟是谁分配了大量内存（使用 web 指令来使用浏览器打开统计信息的可视化图形）：

```
$ go tool pprof http://127.0.0.1:6060/debug/pprof/heapFetching profile over HTTP from http://localhost:6060/debug/pprof/heapSaved profile in /Users/changkun/pprof/pprof.alloc_objects.alloc_space.inuse_objects.inuse_space.003.pb.gzType: inuse_spaceTime: Jan 1, 2020 at 11:15pm (CET)Entering interactive mode (type "help" for commands, "o" for options)(pprof) web(pprof)
```

![图片](https://mmbiz.qpic.cn/mmbiz_png/ASQrEXvmx63jU0ezFJwDpEqS2onywT31X8Uj8MIMyolFicXRZYKJSvnsicVbOeLJkqgoflibfWRBNolGVicjv3NdOQ/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

可见 `newBuf` 产生的申请的内存过多，现在我们使用 sync.Pool 来复用 `newBuf` 所产生的对象：

```
package main
import (  "fmt"  "net/http"  _ "net/http/pprof"  "sync")
// 使用 sync.Pool 复用需要的 bufvar bufPool = sync.Pool{  New: func() interface{} {    return make([]byte, 10Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/Licensed to The Apache Software Foundation, http://www.apache.org/
Benchmarking 127.0.0.1 (be patient)Completed 100 requestsCompleted 200 requestsCompleted 300 requestsCompleted 400 requestsCompleted 500 requestsFinished 500 requests

Server Software:        Server Hostname:        127.0.0.1Server Port:            8080
Document Path:          /example2Document Length:        14 bytes
Concurrency Level:      100Time taken for tests:   0.427 secondsComplete requests:      500Failed requests:        0Total transferred:      65500 bytesHTML transferred:       7000 bytesRequests per second:    1171.32 [#/sec] (mean)Time per request:       85.374 [ms] (mean)Time per request:       0.854 [ms] (mean, across all concurrent requests)Transfer rate:          149.85 [Kbytes/sec] received
Connection Times (ms)              min  mean[+/-sd] median   maxConnect:        0    1   1.4      1       9Processing:     5   75  48.2     66     211Waiting:        5   72  46.8     63     207Total:          5   77  48.2     67     211
Percentage of the requests served within a certain time (ms)  50%     67  66%     89  75%    107  80%    122  90%    148  95%    167  98%    196  99%    204 100%    211 (longest request)
```

但从 `Requestsper second` 每秒请求数来看，从原来的 506.63 变为 1171.32 得到了近乎一倍的提升。从 trace 的结果来看，GC 也没有频繁的被触发从而长期消耗 CPU 使用率：

![图片](https://mmbiz.qpic.cn/mmbiz_png/ASQrEXvmx63jU0ezFJwDpEqS2onywT317ylP8OdsLKwooQiadAJPu1uEGgnnkc8JAQZ2AUicicPiaKrgp9ETSHTlaA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

sync.Pool 是内存复用的一个最为显著的例子，从语言层面上还有很多类似的例子，例如在例 1 中， `concat` 函数可以预先分配一定长度的缓存，而后再通过 append 的方式将字符串存储到缓存中：

```
func concat() {  wg := sync.WaitGroup{}  for n := 0; n Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/Licensed to The Apache Software Foundation, http://www.apache.org/
Benchmarking 127.0.0.1 (be patient)Completed 100 requestsCompleted 200 requestsCompleted 300 requestsCompleted 400 requestsCompleted 500 requestsFinished 500 requests

Server Software:        Server Hostname:        127.0.0.1Server Port:            8080
Document Path:          /example2Document Length:        14 bytes
Concurrency Level:      100Time taken for tests:   0.923 secondsComplete requests:      500Failed requests:        0Total transferred:      65500 bytesHTML transferred:       7000 bytesRequests per second:    541.61 [#/sec] (mean)Time per request:       184.636 [ms] (mean)Time per request:       1.846 [ms] (mean, across all concurrent requests)Transfer rate:          69.29 [Kbytes/sec] received
Connection Times (ms)              min  mean[+/-sd] median   maxConnect:        0    1   1.8      0      20Processing:     9  171 210.4     66     859Waiting:        5  158 199.6     62     813Total:          9  173 210.6     68     860
Percentage of the requests served within a certain time (ms)  50%     68  66%    133  75%    198  80%    292  90%    566  95%    696  98%    723  99%    743 100%    860 (longest request)
```

可以看到，压测的结果得到了一定幅度的改善（ `Requestsper second` 从原来的 506.63 提高为了 541.61），

并且 GC 的执行频率明显降低：

![图片](https://mmbiz.qpic.cn/mmbiz_png/ASQrEXvmx63jU0ezFJwDpEqS2onywT31NSNehj5negcQwDIb2icrY6AoicakEG4uqOib3Yq4XLdSOU1xIW9cPElag/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

在实际实践中可表现为需要紧急处理一些由 GC 带来的瓶颈时，人为将 GOGC 调大，加钱加内存，扛过这一段峰值流量时期。

当然，这种做法其实是治标不治本，并没有从根本上解决内存分配过于频繁的问题，极端情况下，反而会由于 GOGC 太大而导致回收不及时而耗费更多的时间来清理产生的垃圾，这对时间不算敏感的应用还好，但对实时性要求较高的程序来说就是致命的打击了。

因此这时更妥当的做法仍然是，定位问题的所在，并从代码层面上进行优化。

### **小结**

通过上面的三个例子我们可以看到在 GC 调优过程中 `go tool pprof` 和 `go tool trace` 的强大作用是帮助我们快速定位 GC 导致瓶颈的具体位置，但这些例子中仅仅覆盖了其功能的很小一部分，我们也没有必要完整覆盖所有的功能，因为总是可以通过http pprof 官方文档、runtime pprof官方文档以及trace 官方文档来举一反三。

现在我们来总结一下前面三个例子中的优化情况：

1. 控制内存分配的速度，限制 goroutine 的数量，从而提高赋值器对 CPU 的利用率。
2. 减少并复用内存，例如使用 sync.Pool 来复用需要频繁创建临时对象，例如提前分配足够的内存来降低多余的拷贝。
3. 需要时，增大 GOGC 的值，降低 GC 的运行频率。

这三种情况几乎涵盖了 GC 调优中的核心思路，虽然从语言上还有很多小技巧可说，但我们并不会在这里事无巨细的进行总结。实际情况也是千变万化，我们更应该着重于培养具体问题具体分析的能力。

当然，我们还应该谨记 **过早优化是万恶之源**这一警语，在没有遇到应用的真正瓶颈时，将宝贵的时间分配在开发中其他优先级更高的任务上。

## **15. Go 的垃圾回收器有哪些相关的 API？****其作用分别是什么？**

在 Go 中存在数量极少的与 GC 相关的 API，它们是

- runtime.GC：手动触发 GC
- runtime.ReadMemStats：读取内存相关的统计信息，其中包含部分 GC 相关的统计信息
- debug.FreeOSMemory：手动将内存归还给操作系统
- debug.ReadGCStats：读取关于 GC 的相关统计信息
- debug.SetGCPercent：设置 GOGC 调步变量
- debug.SetMaxHeap（尚未发布）：设置 Go 程序堆的上限值

------

# **GC 的历史及演进** 

## **16. Go 历史各个版本在 GC 方面的改进？**

Go 1：串行三色标记清扫

Go 1.3：并行清扫，标记过程需要 STW，停顿时间在约几百毫秒

Go 1.5：并发标记清扫，停顿时间在一百毫秒以内

Go 1.6：使用 bitmap 来记录回收内存的位置，大幅优化垃圾回收器自身消耗的内存，停顿时间在十毫秒以内

Go 1.7：停顿时间控制在两毫秒以内

Go 1.8：混合写屏障，停顿时间在半个毫秒左右

Go 1.9：彻底移除了栈的重扫描过程

Go 1.12：整合了两个阶段的 Mark Termination，但引入了一个严重的 GC Bug 至今未修（见问题 20），尚无该 Bug 对 GC 性能影响的报告

Go 1.13：着手解决向操作系统归还内存的，提出了新的 Scavenger

Go 1.14：替代了仅存活了一个版本的 scavenger，全新的页分配器，优化分配内存过程的速率与现有的扩展性问题，并引入了异步抢占，解决了由于密集循环导致的 STW 时间过长的问题

可以用下图直观地说明 GC 的演进历史：

![图片](https://mmbiz.qpic.cn/mmbiz_png/ASQrEXvmx63jU0ezFJwDpEqS2onywT31YDibhsPzbrlI9v7ujYJ8S9ibACV5GOheGeMvVpjcHV7LOeqY6QfbAPlg/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

在 Go 1 刚发布时的版本中，甚至没有将 Mark-Sweep 的过程并行化，当需要进行垃圾回收时，所有的代码都必须进入 STW 的状态。而到了 Go 1.1 时，官方迅速地将清扫过程进行了并行化的处理，即仅在标记阶段进入 STW。

这一想法很自然，因为并行化导致算法结果不一致的情况仅仅发生在标记阶段，而当时的垃圾回收器没有针对并行结果的一致性进行任何优化，因此才需要在标记阶段进入 STW。对于 Scavenger 而言，早期的版本中会有一个单独的线程来定期将多余的内存归还给操作系统。

![图片](https://mmbiz.qpic.cn/mmbiz_png/ASQrEXvmx63jU0ezFJwDpEqS2onywT31iasBCEauMWmV9PPq5FgkZZDXvY0t2DFHLr6nzXhUyEywWWvegNNgeVw/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

而到了 Go 1.5 后，Go 团队花费了相当大的力气，通过引入写屏障的机制来保证算法的一致性，才得以将整个 GC 控制在很小的 STW 内，而到了 1.8 时，由于新的混合屏障的出现，消除了对栈本身的重新扫描，STW 的时间进一步缩减。

从这个时候开始，Scavenger 已经从独立线程中移除，并合并至系统监控这个独立的线程中，并周期性地向操作系统归还内存，但仍然会有内存溢出这种比较极端的情况出现，因为程序可能在短时间内应对突发性的内存申请需求时，内存还没来得及归还操作系统，导致堆不断向操作系统申请内存，从而出现内存溢出。

![图片](https://mmbiz.qpic.cn/mmbiz_png/ASQrEXvmx63jU0ezFJwDpEqS2onywT31EoTzOEcncd6xBRRzhQDmmQa4lWZlncz26tG14041Qvjw6pp9hXNiauA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

到了 Go 1.13，定期归还操作系统的问题得以解决，Go 团队开始将周期性的 Scavenger 转化为可被调度的 goroutine，并将其与用户代码并发执行。而到了 Go 1.14，这一向操作系统归还内存的操作时间进一步得到缩减。

## **17. Go GC 在演化过程中还存在哪些其他设计？****为什么没有被采用？**

### **并发栈重扫**

正如我们前面所说，允许灰色赋值器存在的垃圾回收器需要引入重扫过程来保证算法的正确性，除了引入混合屏障来消除重扫这一过程外，有另一种做法可以提高重扫过程的性能，那就是将重扫的过程并发执行。然而这一方案并没有得以实现，原因很简单：实现过程相比引入混合屏障而言十分复杂，而且引入混合屏障能够消除重扫这一过程，将简化垃圾回收的步骤。

### **ROC**

ROC 的全称是面向请求的回收器（Request Oriented Collector），它其实也是分代 GC 的一种重新叙述。它提出了一个请求假设（Request Hypothesis）：与一个完整请求、休眠 goroutine 所关联的对象比其他对象更容易死亡。这个假设听起来非常符合直觉，但在实现上，由于垃圾回收器必须确保是否有 goroutine 私有指针被写入公共对象，因此写屏障必须一直打开，这也就产生了该方法的致命缺点：昂贵的写屏障及其带来的缓存未命中，这也是这一设计最终没有被采用的主要原因。

### **传统分代 GC**

在发现 ROC 性能不行之后，作为备选方案，Go 团队还尝试了实现传统的分代式 GC。但最终同样发现分代假设并不适用于 Go 的运行栈机制，年轻代对象在栈上就已经死亡，扫描本就该回收的执行栈并没有为由于分代假设带来明显的性能提升。这也是这一设计最终没有被采用的主要原因。

## **18. 目前提供 GC 的语言以及不提供 GC 的语言有哪些？****GC 和 No GC 各自的优缺点是什么？**

从原理上而言，所有的语言都能够自行实现 GC。从语言诞生之初就提供 GC 的语言，例如：

- Python
- JavaScript
- Java
- Objective-C
- Swift

而不以 GC 为目标，被直接设计为手动管理内存、但可以自行实现 GC 的语言有：

- C
- C++

也有一些语言可以在编译期，依靠编译器插入清理代码的方式，实现精准的清理，例如：

- Rust

垃圾回收使程序员无需手动处理内存释放，从而能够消除一些需要手动管理内存才会出现的运行时错误：

1. 在仍然有指向内存区块的指针的情况下释放这块内存时，会产生悬挂指针，从而后续可能错误的访问已经用于他用的内存区域。
2. 多重释放同一块申请的内存区域可能导致不可知的内存损坏。

当然，垃圾回收也会伴随一些缺陷，这也就造就了没有 GC 的一些优势：

1. 没有额外的性能开销
2. 精准的手动内存管理，极致的利用机器的性能

## **19. Go 对比 Java、V8 中 JavaScript 的 GC 性能如何？**

无论是 Java 还是 JavaScript 中的 GC 均为分代式 GC。分代式 GC 的一个核心假设就是分代假说：将对象依据存活时间分配到不同的区域，每次回收只回收其中的一个区域。

### **V8 的 GC**

在 V8 中主要将内存分为新生代和老生代。新生代中的对象为存活时间较短的对象，老生代中的对象为存活时间较长、常驻内存、占用内存较大的对象：

1. 新生代中的对象主要通过副垃圾回收器进行回收。该回收过程是一种采用复制的方式实现的垃圾回收算法，它将堆内存一分为二，这两个空间中只有一个处于使用中，另一个则处于闲置状态。处于使用状态的空间称为 From 空间，处于闲置的空间称为 To 空间。分配对象时，先是在 From 空间中进行分配，当开始垃圾回收时，会检查 From 空间中的存活对象，并将这些存活对象复制到 To 空间中，而非存活对象占用的空间被释放。完成复制后，From 空间和 To 空间的角色互换。也就是通过将存活对象在两个空间中进行复制。
2. 老生代则由主垃圾回收器负责。它实现的是标记清扫过程，但略有不同之处在于它还会在清扫完成后对内存碎片进行整理，进而是一种标记整理的回收器。

### **Java 的 GC**

Java 的 GC 称之为 G1，并将整个堆分为年轻代、老年代和永久代。包括四种不同的收集操作，从上往下的这几个阶段会选择性地执行，触发条件是用户的配置和实际代码行为的预测。

1. 年轻代收集周期：只对年轻代对象进行收集与清理
2. 老年代收集周期：只对老年代对象进行收集与清理
3. 混合式收集周期：同时对年轻代和老年代进行收集与清理
4. 完整 GC 周期：完整的对整个堆进行收集与清理

在回收过程中，G1 会对停顿时间进行预测，竭尽所能地调整 GC 的策略从而达到用户代码通过系统参数（ `-XX:MaxGCPauseMillis`）所配置的对停顿时间的要求。

这四个周期的执行成本逐渐上升，优化得当的程序可以完全避免完整 GC 周期。

### **性能比较**

在 Go、Java 和 V8 JavaScript 之间比较 GC 的性能本质上是一个不切实际的问题。如前面所说，垃圾回收器的设计权衡了很多方面的因素，同时还受语言自身设计的影响，因为语言的设计也直接影响了程序员编写代码的形式，也就自然影响了产生垃圾的方式。

但总的来说，他们三者对垃圾回收的实现都需要 STW，并均已达到了用户代码几乎无法感知到的状态（据 Go GC 作者 Austin 宣称 STW 小于 100 微秒）。当然，随着 STW 的减少，垃圾回收器会增加 CPU 的使用率，这也是程序员在编写代码时需要手动进行优化的部分，即充分考虑内存分配的必要性，减少过多申请内存带给垃圾回收器的压力。

## **20. 目前 Go 语言的 GC 还存在哪些问题？**

尽管 Go 团队宣称 STW 停顿时间得以优化到 100 微秒级别，但这本质上是一种取舍。原本的 STW 某种意义上来说其实转移到了可能导致用户代码停顿的几个位置；除此之外，由于运行时调度器的实现方式，同样对 GC 存在一定程度的影响。

目前 Go 中的 GC 仍然存在以下问题：

### **1. Mark Assist 停顿时间过长**

```
package main
import (  "fmt"  "os"  "runtime"  "runtime/trace"  "time")
const (  windowSize = 200000  msgCount   = 1000000)
var (  best    time.Duration = time.Second  bestAt  time.Time  worst   time.Duration  worstAt time.Time
  start = time.Now())
func main() {  f, _ := os.Create("trace.out")  defer f.Close()  trace.Start(f)  defer trace.Stop()
  for i := 0; i  worst {    worst = elapsed    worstAt = end  }  if elapsed < best {    best = elapsed    bestAt = end  }}
func newMsg(n int) []byte {  m := make([]byte, 1024)  for i := range m {    m[i] = byte(n)  }  return m}
```

运行此程序我们可以得到类似下面的结果：

```
$ go run main.go
Best send delay 330ns at 773.037956ms, worst send delay: 7.127915ms at 579.835487ms. Wall clock: 831.066632ms Best send delay 331ns at 873.672966ms, worst send delay: 6.731947ms at 1.023969626s. Wall clock: 1.515295559s Best send delay 330ns at 1.812141567s, worst send delay: 5.34028ms at 2.193858359s. Wall clock: 2.199921749s Best send delay 338ns at 2.722161771s, worst send delay: 7.479482ms at 2.665355216s. Wall clock: 2.920174197s Best send delay 337ns at 3.173649445s, worst send delay: 6.989577ms at 3.361716121s. Wall clock: 3.615079348s 
```

![图片](https://mmbiz.qpic.cn/mmbiz_png/ASQrEXvmx63jU0ezFJwDpEqS2onywT3157obNDNzSJkHYc1h1cBmwRL34xNxxcicP1en9QvKqHxGNw7KX4JUnpA/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

在这个结果中，第一次的最坏延迟时间高达 7.12 毫秒，发生在程序运行 578 毫秒左右。通过 `go tool trace` 可以发现，这个时间段中，Mark Assist 执行了 7112312ns，约为 7.127915ms；可见，此时最坏情况下，标记辅助拖慢了用户代码的执行，是造成 7 毫秒延迟的原因。

### **2. Sweep 停顿时间过长**

同样还是刚才的例子，如果我们仔细观察 Mark Assist 后发生的 Sweep 阶段，竟然对用户代码的影响长达约 30ms，根据调用栈信息可以看到，该 Sweep 过程发生在内存分配阶段：

![图片](https://mmbiz.qpic.cn/mmbiz_png/ASQrEXvmx63jU0ezFJwDpEqS2onywT31FjoxRxkiafZk30icXicibfNLL9YKmeuDWibmiaevqsdRibRhCibicSz63GWISQQ/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

### **3. 由于 GC 算法的不正确性导致 GC 周期被迫重新执行**

此问题很难复现，但是一个已知的问题，根据 Go 团队的描述，能够在 1334 次构建中发生一次，我们可以计算出其触发概率约为 0.0007496251874。虽然发生概率很低，但一旦发生，GC 需要被重新执行，非常不幸。

### **4. 创建大量 Goroutine 后导致 GC 消耗更多的 CPU**

这个问题可以通过以下程序进行验证：

```
func BenchmarkGCLargeGs(b *testing.B) {  wg := sync.WaitGroup{}
  for ng := 100; ng <= 1000000; ng *= 10 {    b.Run(fmt.Sprintf("#g-%d", ng), func(b *testing.B) {      // 创建大量 goroutine，由于每次创建的 goroutine 会休眠      // 从而运行时不会复用正在休眠的 goroutine，进而不断创建新的 g      wg.Add(ng)      for i := 0; i < ng; i++ {        go func() {          time.Sleep(100 * time.Millisecond)          wg.Done()        }()      }      wg.Wait()
      // 现运行一次 GC 来提供一致的内存环境      runtime.GC()
      // 记录运行 b.N 次 GC 需要的时间      b.ResetTimer()      for i := 0; i < b.N; i++ {        runtime.GC()      }    })
  }}
```

其结果可以通过如下指令来获得：

```
$ go test -bench=BenchmarkGCLargeGs -run=^$ -count=5 -v . | tee 4.txt$ benchstat 4.txtname                     time/opGCLargeGs/#g-100-12       192µs ± 5%GCLargeGs/#g-1000-12      331µs ± 1%GCLargeGs/#g-10000-12    1.22ms ± 1%GCLargeGs/#g-100000-12   10.9ms ± 3%GCLargeGs/#g-1000000-12  32.5ms ± 4%
```

这种情况通常发生于峰值流量后，大量 goroutine 由于任务等待被休眠，从而运行时不断创建新的 goroutine，旧的 goroutine 由于休眠未被销毁且得不到复用，导致 GC 需要扫描的执行栈越来越多，进而完成 GC 所需的时间越来越长。一个解决办法是使用 goroutine 池来限制创建的 goroutine 数量。

# **总结**

GC 是一个复杂的系统工程，本文讨论的二十个问题尽管已经展现了一个相对全面的 Go GC。但它们仍然只是 GC 这一宏观问题的一些较为重要的部分，还有非常多的细枝末节、研究进展无法在有限的篇幅内完整讨论。

从 Go 诞生之初，Go 团队就一直在对 GC 的表现进行实验与优化，但仍然有诸多未解决的问题，我们不妨对 GC 未来的改进拭目以待。

### 来源：[Go GC 20 问 (qq.com)](https://mp.weixin.qq.com/s/o2oMMh0PF5ZSoYD0XOBY2Q)
