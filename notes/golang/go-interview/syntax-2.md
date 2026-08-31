---
title: Go 基础语法面试题（下）：指针、接口、错误处理、并发基础
date: 2026-08-31
category: Golang
tags: [Go, 面试, 基础]
summary: Go 基础语法高频面试题（下半部分），覆盖 := 与 = 区别、指针、接口、defer、错误处理等。
---
> Go 基础语法高频面试题（下半部分），覆盖 := 与 = 区别、指针、接口、defer、错误处理等。

# 开篇碎碎念

整理自 *Go-Interview* 仓库的 Go基础 模块，目的是把网上常见的 Go 基础面试题按主题归类，方便复习和检索。每道题都尽量保留答案原文，并在题号前加上分类前缀（如「变量与作用域」「Slice 底层」「Map 原理」），便于查漏补缺。

> 适合人群：刚学完 Go 基础语法、准备找 Go 后端岗位面试的同学。
## 1. `=` 和 `:=` 的区别？

## 答案

`:=` 声明+赋值

`=` 仅赋值

```
var foo int
foo = 10
// 等价于
foo := 10
```

## 2 指针的作用？

## 答案

指针用来保存变量的地址。

例如

```
var x =  5
var p *int = &x
fmt.Printf("x = %d",  *p) // x 可以用 *p 访问
```
`*` 运算符，也称为解引用运算符，用于访问地址中的值。`＆`运算符，也称为地址运算符，用于返回变量的地址。

## 3 Go 允许多个返回值吗？

## 答案

允许

```
func swap(x, y string) (string, string) {
   return y, x
}

func main() {
   a, b := swap("A", "B")
   fmt.Println(a, b) // B A
}
```

## 4 Go 有异常类型吗？

## 答案

Go 没有异常类型，只有错误类型（Error），通常使用返回值来表示异常状态。

```
f, err := os.Open("test.txt")
if err != nil {
    log.Fatal(err)
}
```

## 5 什么是协程（Goroutine）

## 答案

Goroutine 是与其他函数或方法同时运行的函数或方法。 Goroutines 可以被认为是轻量级的线程。 与线程相比，创建 Goroutine 的开销很小。 Go应用程序同时运行数千个 Goroutine 是非常常见的做法。

## 6 如何高效地拼接字符串

## 答案

Go 语言中，字符串是只读的，也就意味着每次修改操作都会创建一个新的字符串。如果需要拼接多次，应使用 `strings.Builder`，最小化内存拷贝次数。

```
var str strings.Builder
for i := 0; i  `stu_name`, ID -> `stu_id`，忽略 Age 字段。很方便地实现了 Go 结构体与不同规范的 json 文本之间的转换。

## 13 如何判断 2 个字符串切片（slice) 是相等的？

## 答案

go 语言中可以使用反射 `reflect.DeepEqual(a, b)` 判断 a、b 两个切片是否相等，但是通常不推荐这么做，使用反射非常影响性能。

通常采用的方式如下，遍历比较切片中的每一个元素（注意处理越界的情况）。

```
func StringSliceEqualBCE(a, b []string) bool {
    if len(a) != len(b) {
        return false
    }

    if (a == nil) != (b == nil) {
        return false
    }

    b = b[:len(a)]
    for i, v := range a {
        if v != b[i] {
            return false
        }
    }

    return true
}
```

## 14 字符串打印时，`%v` 和 `%+v` 的区别

## 答案

`%v` 和 `%+v` 都可以用来打印 struct 的值，区别在于 `%v` 仅打印各个字段的值，`%+v` 还会打印各个字段的名称。

```
type Stu struct {
	Name string
}

func main() {
	fmt.Printf("%v\n", Stu{"Tom"}) // {Tom}
	fmt.Printf("%+v\n", Stu{"Tom"}) // {Name:Tom}
}
```

但如果结构体定义了 `String()` 方法，`%v` 和 `%+v` 都会调用 `String()` 覆盖默认值。

## 15 Go 语言中如何表示枚举值(enums)

## 答案

通常使用常量(const) 来表示枚举值。

```
type StuType int32

const (
	Type1 StuType = iota
	Type2
	Type3
	Type4
)

func main() {
	fmt.Println(Type1, Type2, Type3, Type4) // 0, 1, 2, 3
}
```

参考 What is an idiomatic way of representing enums in Go? - StackOverflow

## 16 空 struct{} 的用途

## 答案

使用空结构体 struct{} 可以节省内存，一般作为占位符使用，表明这里并不需要一个值。

```
fmt.Println(unsafe.Sizeof(struct{}{})) // 0
```

比如使用 map 表示集合时，只关注 key，value 可以使用 struct{} 作为占位符。如果使用其他类型作为占位符，例如 int，bool，不仅浪费了内存，而且容易引起歧义。

```
type Set map[string]struct{}

func main() {
	set := make(Set)

	for _, item := range []string{"A", "A", "B", "C"} {
		set[item] = struct{}{}
	}
	fmt.Println(len(set)) // 3
	if _, ok := set["A"]; ok {
		fmt.Println("A exists") // A exists
	}
}
```

再比如，使用信道(channel)控制并发时，我们只是需要一个信号，但并不需要传递值，这个时候，也可以使用 struct{} 代替。

```
func main() {
	ch := make(chan struct{}, 1)
	go func() {
		<-ch
		// do something
	}()
	ch <- struct{}{}
	// ...
}
```

再比如，声明只包含方法的结构体。

```
type Lamp struct{}

func (l Lamp) On() {
        println("On")

}
func (l Lamp) Off() {
        println("Off")
}
```

------

#### 来源：[Go 语言笔试面试题(基础语法) | 极客面试 | 极客兔兔 (geektutu.com)](https://geektutu.com/post/qa-golang-1.html)
