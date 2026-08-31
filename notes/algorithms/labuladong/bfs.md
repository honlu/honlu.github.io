---
title: BFS 算法套路框架
date: 2026-08-31
category: Algorithms
tags: [算法, BFS, labuladong]
summary: BFS 与 DFS 的核心区别，最小深度 / 打开转盘锁等典型 BFS 应用。
---
> BFS 与 DFS 的核心区别，最小深度 / 打开转盘锁等典型 BFS 应用。

# 开篇碎碎念

整理自 *GoLabuladongAlgorithm* 仓库的 labuladong 算法小抄系列，原作者用 Python 写，这里整理的是 Go 版实现（部分保留了伪代码与图解）。建议先读「学习算法和刷题的框架思维」建立心智模型，再按顺序刷每道例题。

> 适合人群：想要形成算法解题套路、不再死记硬背题解的同学。
## 4、BFS算法套路框架

**前情提示：Go语言学习者。本文参考https://labuladong.gitee.io/algo，代码自己参考抒写，若有不妥之处，感谢指正**

**关于golang算法文章，为了便于下载和整理，都已开源放在：**

- https://github.com/honlu/GoLabuladongAlgorithm
- https://gitee.com/dreamzll/GoLabuladongAlgorithm
方便就请分享，star！备注转载地址！欢迎一起学习和交流！

## 涉及题目

[Leetcode 111. 二叉树的最小深度（简单）](https://leetcode-cn.com/problems/minimum-depth-of-binary-tree)

[Leetcode 752. 打开转盘锁（中等）](https://leetcode-cn.com/problems/open-the-lock)

BFS广度有限搜索和DFS深度优先搜索算法是特别常用的两种算法，**其实 DFS 算法就是回溯算法**，上篇已经讲过。

BFS 的核心思想应该不难理解的，就是把一些问题抽象成图，从一个点开始，向四周开始扩散。一般来说，我们写 BFS 算法都是用「队列」这种数据结构，每次将一个节点周围的所有节点加入队列。

BFS 相对 DFS 的最主要的区别是：**BFS 找到的路径一定是最短的，但代价就是空间复杂度可能比 DFS 大很多**，至于为什  么，我们后面介绍了框架就很容易看出来了。

本文就由浅入深写两道 BFS 的典型题目，分别是「二叉树的最小高度」和「打开密码锁的最少步数」，手把手教你怎么写 BFS 算法。

## 一、算法框架

要说框架的话，我们先举例一下 BFS 出现的常见场景好吧，**问题的本质就是让你在一幅「图」中找到从起点 `start` 到终点 `target` 的最近距离，这个例子听起来很枯燥，但是 BFS 算法问题其实都是在干这个事儿**，把枯燥的本质搞清楚了，再去欣赏各种问题的包装才能胸有成竹嘛。

这个广义的描述可以有各种变体，比如走迷宫，有的格子是围墙不能走，从起点到终点的最短距离是多少？如果这个迷宫带「传送门」可以瞬间传送呢？

再比如说两个单词，要求你通过某些替换，把其中一个变成另一个，每次只能替换一个字符，最少要替换几次？

再比如说连连看游戏，两个方块消除的条件不仅仅是图案相同，还得保证两个方块之间的最短连线不能多于两个拐点。你玩连连看，点击两个坐标，游戏是如何判断它俩的最短连线有几个拐点的？

再比如……

这些问题都没啥神奇的，本质上就是一幅「图」，让你从一个起点，走到终点，问最短路径。这就是 BFS 的本质。

框架搞清楚了直接默写就好，记住下面代码就 OK 了：

```go
// 伪码
// 计算从起点start到终点target的最近距离
func BFS(start *Node, target *Node){
    var queue []*Node  //  核心数据结构
    var visited map[*Node]bool // 避免走回头路，在go中使用map来实现set，map中的key为唯一值，这与set的特性一致。
    queue = append(queue, start)  // 将起点加入队列
    visited[start] = true
    step := 0  // 记录扩散的步数

    for{
        if len(queue)==0{ // 在go中可以使用fo-if来实现while
			break
        }
        size := len(queue)
        // 将当前队列中的所有节点向四周扩散
        for i:=0; i  PS：这段代码当然有很多问题，但是我们做算法题肯定不是一蹴而就的，而是从简陋到完美的。不要完美主义，咱要慢慢来，好不。

**这段 BFS 代码已经能够穷举所有可能的密码组合了，但是显然不能完成题目，有如下问题需要解决**：

1、会走回头路。比如说我们从 `"0000"` 拨到 `"1000"`，但是等从队列拿出 `"1000"` 时，还会拨出一个 `"0000"`，这样的话会产生死循环。

2、没有终止条件，按照题目要求，我们找到 `target` 就应该结束并返回拨动的次数。

3、没有对 `deadends` 的处理，按道理这些「死亡密码」是不能出现的，也就是说你遇到这些密码的时候需要跳过。

如果你能够看懂上面那段代码，真得给你鼓掌，只要按照 BFS 框架在对应的位置稍作修改即可修复这些问题：

```go
func openLock(deadends []string, target string) int {
	// 记录需要跳过的死亡密码
	deads := map[string]bool{}
	for _, s := range deadends {
		deads[s] = true
	}
	// 记录已经穷举过的密码，防止走回头路
	visited := map[string]bool{}
	var queue []string //  核心数据结构
	queue = append(queue, "0000") // 将起点加入队列
	step := 0                     // 记录扩散的步数

	for {
		if len(queue) == 0 { // 在go中可以使用fo-if来实现while
			break
		}
		size := len(queue)
		// 将当前队列中的所有节点向四周扩散
		for i := 0; i  0 && len(queue2) > 0 {
		// 在遍历的过程中不能修改哈希集合，用temp存储queue1的扩散结果
        temp := map[string]bool{}
        // 将queue1中的所有节点向周围扩散
        for cur, _ := range queue1{
            // 判断是否到达终点
            if deads[cur] == true{
				continue
            }
            if queue2[cur] == true{
				return step
            }
            visited[cur] = true
            // 将一个节点的相邻节点加入结合
            for j := 0; j  0 && len(queue2) > 0 {
    if len(queue1) > len(queue2){
        tempForSwap := map[string]bool{}
        tempForSwap = queue1
        queue1 = queue2
        queue2 = tempForSwap
    }
}
//....
```

为什么这是一个优化呢？

因为按照 BFS 的逻辑，队列（集合）中的元素越多，扩散之后新的队列（集合）中的元素就越多；在双向 BFS 算法中，如果我们每次都选择一个较小的集合进行扩散，那么占用的空间增长速度就会慢一些，效率就会高一些。

不过话说回来，**无论传统 BFS 还是双向 BFS，无论做不做优化，从 Big O 衡量标准来看，时间复杂度都是一样的**，只能说双向 BFS 是一种 trick，算法运行的速度会相对快一点，掌握不掌握其实都无所谓。最关键的是把 BFS 通用框架记下来，反正所有 BFS 算法都可以用它套出解法。
