---
title: Go 基础语法面试题（上）：变量、Slice、Map、函数
date: 2026-08-31
category: Golang
tags: [Go, 面试, 基础]
summary: Go 基础语法高频面试题（上半部分），覆盖变量与作用域、Slice 底层、Map 原理、函数与方法等。
---
> Go 基础语法高频面试题（上半部分），覆盖变量与作用域、Slice 底层、Map 原理、函数与方法等。

# 开篇碎碎念

整理自 *Go-Interview* 仓库的 Go基础 模块，目的是把网上常见的 Go 基础面试题按主题归类，方便复习和检索。每道题都尽量保留答案原文，并在题号前加上分类前缀（如「变量与作用域」「Slice 底层」「Map 原理」），便于查漏补缺。

> 适合人群：刚学完 Go 基础语法、准备找 Go 后端岗位面试的同学。
# 基础语法

### 1.使用值为 nil 的 slice、map会发生啥

允许对值为 nil 的 slice 添加元素，但对值为 nil 的 map 添加元素，则会造成运行时 panic。

```GO
// map 错误示例
func main() {
    var m map[string]int
    m["one"] = 1  // error: panic: assignment to entry in nil map
    // m := make(map[string]int)// map 的正确声明，分配了实际的内存,这样添加元素就不会错
}    

// slice 正确示例
func main() {
    var s []int
    s = append(s, 1)
}
```

### 2.访问 map 中的 key，需要注意啥

当访问 map 中不存在的 key 时，Go 则会返回元素对应数据类型的零值，比如 nil、’’ 、false 和 0，取值操作总有值返回，故**不能通过取出来的值，来判断 key 是不是在 map 中**。

检查 key 是否存在可以**用 map 直接访问，检查返回的第二个参数**即可。

```go
// 错误的 key 检测方式
func main() {
    x := map[string]string{"one": "2", "two": "", "three": "3"}
    if v := x["two"]; v == "" {
      	fmt.Println("key two is no entry") // 键 two 存不存在都会返回的空字符串
    }
}

// 正确示例
func main() {
    x := map[string]string{"one": "2", "two": "", "three": "3"}
    if _, ok := x["two"]; !ok {
      	fmt.Println("key two is no entry")
    }
}
```

### 3.string 类型的值可以修改吗

不能，**尝试使用索引遍历字符串，来更新字符串中的个别字符，是不允许的**。

string 类型的值是只读的二进制 byte slice，如果**真要修改字符串中的字符，将 string 转为 []byte 修改后，再转为 string 即可**。

```go
// 修改字符串的错误示例
func main() {
   x := "text"
   x[0] = "T"  // error: cannot assign to x[0]
   fmt.Println(x)
}

// 修改示例
func main() {
   x := "text"
   xBytes := []byte(x)
   xBytes[0] = 'T' // 注意此时的 T 是 rune 类型
   x = string(xBytes)
   fmt.Println(x) // Text
}
```

### 4.switch 中如何强制执行下一个 case 代码块

switch 语句中的 case 代码块会默认带上 break，但可以**使用 fallthrough 来强制执行下一个 case 代码**块。

```go
func main() {
   isSpace := func(char byte) bool {
    switch char {
    case ' ': // 空格符会直接 break，返回 false // 和其他语言不一样
      // fallthrough // 返回 true
    case '\t':
       return true
    }
    return false
	 }
   fmt.Println(isSpace('\t')) // true
   fmt.Println(isSpace(' ')) // false
}
```

### 5.如何从 panic 中恢复

在一个 **defer 延迟执行的函数中调用 recover** ，它便能捕捉/中断 panic。这是因为即使panic，也会继续执行完goroutine，而defer延迟执行的函数中含有recover，所以会恢复。

```go
// 错误的 recover 调用示例
func main() {
    recover() // 什么都不会捕捉
    panic("not good") // 发生 panic，主程序退出
    recover() // 不会被执行
    println("ok")
}

// 正确的 recover 调用示例
func main() {
    defer func() {
      fmt.Println("recovered: ", recover())
    }()
    panic("not good")
}
```

### 6.简短声明(:=)的变量需要注意啥

- 简短声明的变量**只能在函数内部使用**
- **struct 的变量字段不能使用 := 来赋值**
- 不能用简短声明方式来单独为一个变量重复声明， **:= 左侧至少有一个新变量**，才允许多变量的重复声明

### 7.range 迭代 map是有序的吗

无序的。Go 的运行时是有意打乱迭代顺序的，所以你得到的迭代结果可能不一致。但也并不总会打乱，得到连续相同的 5 个迭代结果也是可能的。

若**想有序遍历map,将 `Map` 中的 key 拿出来，放入 `slice` 中做排序.**

### 8.recover的执行时机

无，recover 必须在 defer 函数中运行。recover 捕获的是祖父级调用时的异常，直接调用时无效。

```go
func main() { // 无效
    recover()
    panic(1)
}
```

直接 defer 调用也是无效。

```go
func main() {
    defer recover() // 直接调用，无效
    panic(1)
}
```

defer 调用时多层嵌套依然无效。

```go
func main() {
    defer func() {  // 多层嵌套无效
        func() { recover() }()
    }()
    panic(1)
}
```

必须在 defer 函数中直接调用才有效。

```go
func main() {
    defer func() { // 执行中的函数调用，有效
        recover()
    }()
    panic(1)
}
```

### 9.闭包错误引用同一个变量问题怎么处理

在**每轮迭代中生成一个局部变量 i** 。如果没有 i := i 这行，将会打印同一个变量。

```go
func main() {
    for i := 0; i 

### 35.Golang Slice的扩容机制，有什么注意点

Go 中切片扩容的策略是这样的：

**首先判断，如果新申请容量大于 2 倍的旧容量，最终容量就是新申请的容量。否则判断，如果旧切片的长度小于 1024，则最终容量就是旧容量的两倍。**

**否则判断，如果旧切片长度大于等于 1024，则最终容量从旧容量开始循环增加原来的 1/4 , 直到最终容量大于等于新申请的容量。如果最终容量计算值溢出，则最终容量就是新申请容量。**

情况一：原数组还有容量可以扩容（实际容量没有填充完），这种情况下，扩容以后的数组还是指向原来的数组，对一个切片的操作可能影响多个指针指向相同地址的Slice。

情况二：原来数组的容量已经达到了最大值，再想扩容， Go 默认会先开一片内存区域，把原来的值拷贝过来，然后再执行 append() 操作。这种情况丝毫不影响原数组。

要复制一个Slice，最好使用Copy函数。

### 36.Golang Map底层实现

Golang 中 map 的底层实现是一个散列表，因此实现 map 的过程实际上就是实现散表的过程。
在这个散列表中，主要出现的结构体有两个，**一个叫hmap(a header for a go map)，一个叫bmap(a bucket for a Go map，通常叫其bucket)**。

hmap如下所示：

图中有很多字段，但是便于理解 map 的架构，你只需要关心的只有一个，就是标红的字段：buckets 数组。Golang 的 map 中用于存储的结构是 bucket数组。而 bucket(即bmap)的结构是怎样的呢？
bucket：

相比于 hmap，bucket 的结构显得简单一些，标橙的字段依然是“核心”，我们使用的 map 中的 key 和 value 就存储在这里。

“高位哈希值”数组记录的是当前 bucket 中 key 相关的”索引”，稍后会详细叙述。还有一个字段是一个指向扩容后的 bucket 的指针，使得 bucket 会形成一个链表结构。
整体的结构应该是这样的：

Golang 把求得的哈希值按照用途一分为二：高位和低位。低位用于寻找当前 key属于 hmap 中的哪个 bucket，而高位用于寻找 bucket 中的哪个 key。
需要特别指出的一点是：map中的key/value值都是存到同一个数组中的。这样做的好处是：在key和value的长度不同的时候，可以消除padding带来的空间浪费。

![null](https://topgoer.cn/uploads/blog/202104/attach_16778bc2077dd9d7.png)

Map 的扩容：当 Go 的 map 长度增长到大于加载因子所需的 map 长度时，Go 语言就会将产生一个新的 bucket 数组，然后把旧的 bucket 数组移到一个属性字段 oldbucket中。

注意：并不是立刻把旧的数组中的元素转义到新的 bucket 当中，而是，只有当访问到具体的某个 bucket 的时候，会把 bucket 中的数据转移到新的 bucket 中。

### 37.Golang的内存模型，为什么小对象多了会造成gc压力

通常**小对象过多会导致 GC 三色法消耗过多的GPU**。优化思路是，减少对象分配。

### 38.Data Race问题怎么解决？能不能不加锁解决这个问题

data race 译作数据竞争，比如不同的goroutine并发读写同一个变量，可能会发生数据竞争。

**同步访问共享数据**是处理**数据竞争**的一种有效的方法。

golang在 1.1 之后引入了竞争检测机制，可以使用 go run -race 或者 go build -race来进行静态检测。其在内部的实现是,开启多个协程执行同一个命令， 并且记录下每个变量的状态。

竞争检测器基于C/C++的ThreadSanitizer 运行时库，该库在Google内部代码基地和Chromium找到许多错误。这个技术在2012年九月集成到Go中，从那时开始，它已经在标准库中检测到42个竞争条件。现在，它已经是我们持续构建过程的一部分，当竞争条件出现时，它会继续捕捉到这些错误。

竞争检测器已经完全集成到Go工具链中，仅仅添加-race标志到命令行就使用了检测器。

```
$ go test -race mypkg    // 测试包
$ go run -race mysrc.go  // 编译和运行程序 $ go build -race mycmd 
// 构建程序 $ go install -race mypkg // 安装程序
```

要想解决数据竞争的问题**可以使用互斥锁sync.Mutex,解决数据竞争(Data race)**,也**可以使用管道解决,使用管道的效率要比互斥锁高**。

### 39.在 range 迭代 slice 时，你怎么修改值的

在 range 迭代中，得到的值其实是元素的一份值拷贝，更新拷贝并不会更改原来的元素，即是拷贝的地址并不是原有元素的地址。

```go
func main() {
    data := []int{1, 2, 3}
    for _, v := range data {
      	v *= 10  // data 中原有元素是不会被修改的
    }
    fmt.Println("data: ", data) // data:  [1 2 3]
}
```

**如果要修改原有元素的值，应该**使用索引直接访问。

```go
func main() {
    data := []int{1, 2, 3}
    for i, v := range data {
      	data[i] = v * 10 
    }
    fmt.Println("data: ", data) // data:  [10 20 30]
}
```

**如果你的集合保存的是指向值的指针，需稍作修改。依旧需要使用索引访问元素，不过可以使用 range 出来的元素直接更新原有值。**

```go
func main() {
    data := []*struct{ num int }{{1}, {2}, {3},}
    for _, v := range data {
      	v.num *= 10 // 直接使用指针更新
    }
    fmt.Println(data[0], data[1], data[2]) // &{10} &{20} &{30}
}
```

### 40.nil  和 nil interface 的区别

虽然 interface 看起来像指针类型，但它不是。interface 类型的变量只有在类型和值均为 nil 时才为 nil.如果你的 interface 变量的值是跟随其他变量变化的，与 nil 比较相等时小心。如果你的函数返回值类型是 interface，更要小心这个坑：

```go
func main() {
   var data *byte
   var in interface{}

   fmt.Println(data, data == nil) //  true
   fmt.Println(in, in == nil) //  true

   in = data
   fmt.Println(in, in == nil) //  false // data 值为 nil，但 in 值不为 nil
}

// 正确示例
func main() {
    doIt := func(arg int) interface{} {
        var result *struct{} = nil

        if arg > 0 {
          	result = &struct{}{}
        } else {
          	return nil // 明确指明返回 nil
        }

        return result
    }

    if res := doIt(-1); res != nil {
      	fmt.Println("Good result: ", res)
    } else {
      	fmt.Println("Bad result: ", res) // Bad result: 
    }
}
```

### 41.select可以用于什么【可看26】

常用语gorotine的完美退出。

golang 的 select 就是监听 IO 操作，当 IO 操作发生时，触发相应的动作每个case语句里必须是一个IO操作，确切的说，应该是一个面向channel的IO操作。

### 42. 指针数据坑

range到底有什么坑呢，我们先来运行一个例子吧。

```go
package main

import (
  "fmt"
)

type user struct {
  name string
  age uint64
}

func main()  {
  u := []user{
    {"asong",23},
    {"song",19},
    {"asong2020",18},
  }
  n := make([]*user,0,len(u))
  for _,v := range u{
    n = append(n, &v) 
  }
  fmt.Println(n)
  for _,v := range n{
    fmt.Println(v)
  }
}
```

这个例子的目的是，通过u这个slice构造成新的slice。我们预期应该是显示uslice的内容，但是运行结果如下：

```
[0xc0000a6040 0xc0000a6040 0xc0000a6040]
&{asong2020 18}
&{asong2020 18}
&{asong2020 18}
```

这里我们看到n这个slice打印出来的三个同样的数据，并且他们的内存地址相同。这是什么原因呢？先别着急，再来看这一段代码，我给他改正确他，对比之后我们再来分析，你们才会恍然大悟。

```go
package main

import (
  "fmt"
)

type user struct {
  name string
  age uint64
}

func main()  {
  u := []user{
    {"asong",23},
    {"song",19},
    {"asong2020",18},
  }
  n := make([]*user,0,len(u))
  for _,v := range u{
    o := v // 多了这一步！
    n = append(n, &o)
  }
  fmt.Println(n)
  for _,v := range n{
    fmt.Println(v)
  }
}
```

细心的你们看到，我改动了哪一部分代码了嘛？对，没错，我就加了一句话，他就成功了，我在for range里面引入了一个中间变量，每次迭代都重新声明一个变量o，赋值后再将v的地址添加n切片中，这样成功解决了刚才的问题。

现在来解释一下原因：在**for range中，变量v是用来保存迭代切片所得的值，因为v只被声明了一次，每次迭代的值都是赋值给v，该变量的内存地址始终未变，这样讲他的地址追加到新的切片中，该切片保存的都是同一个地址**，这肯定无法达到预期效果的。这里还需要注意一点，变量v的地址也并不是指向原来切片u[2]的，因我在使用range迭代的时候，变量v的数据是切片的拷贝数据，所以直接copy了结构体数据。

上面的问题**还有一种解决方法，直接引用数据的内存**，这个方法比较好，不需要开辟新的内存空间，看代码：

```go
......略
for k,_ := range u{
  n = append(n, &u[k])
}
......略
```

### 43. 是否会造成死循环

来看一段代码：

```go
func main() {
  v := []int{1, 2, 3}
  for i := range v {  // i 为索引。range会对最初的v拷贝，所以后面v变化和range的无关！
    v = append(v, i)
  }
}
```

这一段代码会造成死循环吗？答案：当然不会，**前面都说了range会对切片做拷贝，新增的数据并不在拷贝内容中，并不会发生死循环。**这种题一般会在面试中问，可以留意下的。

### 你不知道的range用法

#### delete

没看错，删除，在range迭代时，可以删除map中的数据，第一次见到这么使用的，我刚听到确实不太相信，所以我就去查了一下官方文档，确实有这个写法：

```go
for key := range m {
    if key.expired() {
        delete(m, key)
    }
}
```

看看官方的解释：

```
The iteration order over maps is not specified and is not guaranteed to be the same from one iteration to the next. If map entries that have not yet been reached are removed during iteration, the corresponding iteration values will not be produced. If map entries are created during iteration, that entry may be produced during the iteration or may be skipped. The choice may vary for each entry created and from one iteration to the next. If the map is nil, the number of iterations is 0.

翻译：
未指定`map`的迭代顺序，并且不能保证每次迭代之间都相同。 如果在迭代过程中删除了尚未到达的映射条目，则不会生成相应的迭代值。 如果映射条目是在迭代过程中创建的，则该条目可能在迭代过程中产生或可以被跳过。 对于创建的每个条目以及从一个迭代到下一个迭代，选择可能有所不同。 如果映射为nil，则迭代次数为0。
```

看这个代码：

```go
func main()  {
  d := map[string]string{
    "asong": "帅",
    "song": "太帅了",
  }
  for k := range d{
    if k == "asong"{
      delete(d,k)
    }
  }
  fmt.Println(d)
}

# 运行结果
map[song:太帅了]
```

从运行结果我们可以看出，key为asong的这位帅哥被从帅哥map中删掉了，哇哦，可气呀。这个方法，相信很多小伙伴都不知道，今天教给你们了，以后可以用起来了。

#### add

上面是删除，那肯定会有新增呀，直接看代码吧。

```go
func main()  {
  d := map[string]string{
    "asong": "帅",
    "song": "太帅了",
  }
  for k,v := range d{
    d[v] = k
    fmt.Println(d)
  }
}
```

这里我把打印放到了range里，你们思考一下，新增的元素，在遍历时能够遍历到呢。我们来验证一下。

```go
func main()  {
  var addTomap = func() {
    var t = map[string]string{
      "asong": "太帅",
      "song": "好帅",
      "asong1": "非常帅",
    }
    for k := range t {
      t["song2020"] = "真帅"
      fmt.Printf("%s%s ", k, t[k])
    }
  }
  for i := 0; i  doublecap {
    newcap = cap
  } else {
    // 原 slice 容量小于 1024 的时候，新 slice 容量按2倍扩容
    if old.cap  maxAlloc
    newcap = int(capmem)
    case et.size == sys.PtrSize:
    lenmem = uintptr(old.len) * sys.PtrSize
    newlenmem = uintptr(cap) * sys.PtrSize
    capmem = roundupsize(uintptr(newcap) * sys.PtrSize)
    overflow = uintptr(newcap) > maxAlloc/sys.PtrSize
    newcap = int(capmem / sys.PtrSize)
    case isPowerOfTwo(et.size):
    var shift uintptr
    if sys.PtrSize == 8 {
      // Mask shift for better code generation.
      shift = uintptr(sys.Ctz64(uint64(et.size))) & 63
    } else {
      shift = uintptr(sys.Ctz32(uint32(et.size))) & 31
    }
    lenmem = uintptr(old.len)  (maxAlloc >> shift)
    newcap = int(capmem >> shift)
    default:
    lenmem = uintptr(old.len) * et.size
    newlenmem = uintptr(cap) * et.size
    capmem, overflow = math.MulUintptr(et.size, uintptr(newcap))
    capmem = roundupsize(capmem)
    newcap = int(capmem / et.size)
  }
}
```

通过源代码可以总结切片扩容策略：

> 切片**在扩容时会进行内存对齐**，这个和内存分配策略相关。**进行内存对齐之后，新 slice 的容量是要 大于等于老 slice 容量的 2倍或者1.25倍，当原 slice 容量小于 1024 的时候，新 slice 容量变成原来的 2 倍；原 slice 容量超过 1024，新 slice 容量变成原来的1.25倍。**

### 48. 参数传递切片和切片指针有什么区别？

我们都知道切片底层就是一个结构体，里面有三个元素：

```go
type SliceHeader struct {
  Data uintptr
  Len  int
  Cap  int
}
```

分别表示切片底层数据的地址，切片长度，切片容量。

**当切片作为参数传递时，其实就是一个结构体的传递，因为Go语言参数传递只有值传递，传递一个切片就会浅拷贝原切片，但因为底层数据的地址没有变**，所以在函数内对切片的修改，也将会影响到函数外的切片，举例：

```go
func modifySlice(s []string)  {
  s[0] = "song"
  s[1] = "Golang"
  fmt.Println("out slice: ", s)
}

func main()  {
  s := []string{"asong", "Golang梦工厂"}
  modifySlice(s)
  fmt.Println("inner slice: ", s)
}
// 运行结果
out slice:  [song Golang]
inner slice:  [song Golang]
```

不过这也有一个特例，先看一个例子：

```go
func appendSlice(s []string)  {
  s = append(s, "快关注！！")
  fmt.Println("out slice: ", s)
}

func main()  {
  s := []string{"asong", "Golang梦工厂"}
  appendSlice(s)
  fmt.Println("inner slice: ", s)
}
// 运行结果
out slice:  [asong Golang梦工厂 快关注！！]
inner slice:  [asong Golang梦工厂]
```

因为切片发生了扩容，函数外的切片指向了一个新的底层数组，所以函数内外不会相互影响，因此可以得出一个结论，**当参数直接传递切片时，如果指向底层数组的指针被覆盖或者修改（copy、重分配、append触发扩容），此时函数内部对数据的修改将不再影响到外部的切片，代表长度的len和容量cap也均不会被修改。**

参数传递切片指针就很容易理解了，**如果你想修改切片中元素的值，并且更改切片的容量和底层数组，则应该按指针传递。**

### 49. range遍历切片有什么要注意的？

Go语言提供了range关键字用于for 循环中迭代数组(array)、切片(slice)、通道(channel)或集合(map)的元素，有两种使用方式：

```
for k,v := range _ { }
for k := range _ { }
```

**第一种是遍历下标和对应值，第二种是只遍历下标，使用range遍历切片时会先拷贝一份，然后在遍历拷贝数据**：

```go
s := []int{1, 2}
for k, v := range s {

}
会被编译器认为是
for_temp := s
len_temp := len(for_temp)
for index_temp := 0; index_temp < len_temp; index_temp++ {
  value_temp := for_temp[index_temp]
  _ = index_temp
  value := value_temp

}
```

不知道这个知识点的情况下很容易踩坑，例如下面这个例子：

```go
package main

import (
  "fmt"
)

type user struct {
  name string
  age uint64
}

func main()  {
  u := []user{
    {"asong",23},
    {"song",19},
    {"asong2020",18},
  }
  for _,v := range u{
    if v.age != 18{
      v.age = 20
    }
  }
  fmt.Println(u)
}
// 运行结果
[{asong 23} {song 19} {asong2020 18}]
```

因为使用range遍历切片u，变量v是拷贝切片中的数据，修改拷贝数据不会对原切片有影响。

##### 参考：[Golang 50题 笔记 - 格罗玛什·地狱咆哮 - 博客园 (cnblogs.com)](https://www.cnblogs.com/arvin-an/p/14666978.html)
