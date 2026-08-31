---
title: 滑动窗口算法框架
date: 2026-08-31
category: Algorithms
tags: [算法, 滑动窗口, labuladong]
summary: 滑动窗口的核心是「如何扩张 / 收缩窗口」，最小覆盖子串等高频套路。
---
> 滑动窗口的核心是「如何扩张 / 收缩窗口」，最小覆盖子串等高频套路。

# 开篇碎碎念

整理自 *GoLabuladongAlgorithm* 仓库的 labuladong 算法小抄系列，原作者用 Python 写，这里整理的是 Go 版实现（部分保留了伪代码与图解）。建议先读「学习算法和刷题的框架思维」建立心智模型，再按顺序刷每道例题。

> 适合人群：想要形成算法解题套路、不再死记硬背题解的同学。
## 7、滑动窗口算法框架

**前情提示：Go语言学习者。本文参考https://labuladong.gitee.io/algo，代码自己参考抒写，若有不妥之处，感谢指正**

**关于golang算法文章，为了便于下载和整理，都已开源放在：**

- https://github.com/honlu/GoLabuladongAlgorithm
- https://gitee.com/dreamzll/GoLabuladongAlgorithm

方便的话，请分享，star！备注转载地址！欢迎一起学习和交流！

### 涉及题目

[Leetcode 76. 最小覆盖子串](https://leetcode-cn.com/problems/minimum-window-substring/)

[Leetcode 567.字符串的排列](https://leetcode-cn.com/problems/permutation-in-string)

[Leetcode 438.找到字符串中所有字母异位词](https://leetcode-cn.com/problems/find-all-anagrams-in-a-string)

[Leetcode 3.无重复字符的最长子串](https://leetcode-cn.com/problems/longest-substring-without-repeating-characters)

鉴于前文 [二分搜索框架详解] 的那首《二分搜索升天词》很受好评，并在民间广为流传，成为安睡助眠的一剂良方，今天在滑动窗口算法框架中，我再次编写一首小诗来歌颂滑动窗口算法的伟大：

[![img](https://labuladong.gitee.io/algo/images/slidingwindow/poem.png)](https://labuladong.gitee.io/algo/images/slidingwindow/poem.png)

关于双指针的快慢指针和左右指针的用法，可以参见前文 **双指针技巧套路框架**，本文就解决一类最难掌握的双指针技巧：滑动窗口技巧。总结出一套框架，可以保你闭着眼睛都能写出正确的解法。

说起滑动窗口算法，很多读者都会头疼。这个算法技巧的思路非常简单，就是维护一个窗口，不断滑动，然后更新答案么。LeetCode 上有起码 10 道运用滑动窗口算法的题目，难度都是中等和困难。该算法的大致逻辑如下：

```go
left := 0
right := 0
for right  PS：使用 Java 的读者要尤其警惕语言特性的陷阱。Java 的 Integer，String 等类型判定相等应该用 `equals` 方法而不能直接用等号 `==`，这是 Java包装类的一个隐晦细节。所以在左移窗口更新数据的时候，不能直接改写为 `window.get(d) == need.get(d)`，而要用 `window.get(d).equals(need.get(d))`，之后的题目代码同理。

需要注意的是，当我们发现某个字符在 `window` 的数量满足了 `need` 的需要，就要更新 `valid`，表示有一个字符已经满足要求。而且，你能发现，两次对窗口内数据的更新操作是完全对称的。

当 `valid == need.size()` 时，说明 `T` 中所有字符已经被覆盖，已经得到一个可行的覆盖子串，现在应该开始收缩窗口了，以便得到「最小覆盖子串」。

移动 `left` 收缩窗口时，窗口内的字符都是可行解，所以应该在收缩窗口的阶段进行最小覆盖子串的更新，以便从可行解中找到长度最短的最终结果。

至此，应该可以完全理解这套框架了，滑动窗口算法又不难，就是细节问题让人烦得很。**以后遇到滑动窗口算法，你就按照这框架写代码，保准没有 bug，还省事儿**。

下面就直接利用这套框架秒杀几道题吧，你基本上一眼就能看出思路了。

### 二、字符串排列

LeetCode 567 题，Permutation in String，难度 Medium：

[![img](https://labuladong.gitee.io/algo/images/slidingwindow/title2.png)](https://labuladong.gitee.io/algo/images/slidingwindow/title2.png)

注意哦，输入的 `s1` 是可以包含重复字符的，所以这个题难度不小。

这种题目，是明显的滑动窗口算法，**相当给你一个 `S` 和一个 `T`，请问你 `S` 中是否存在一个子串，包含 `T` 中所有字符且不包含其他字符**？

首先，先复制粘贴之前的算法框架代码，然后明确刚才提出的 4 个问题，即可写出这道题的答案：

```go
// 滑动窗口算法框架——判断s中是否存在t的排列
func checkInclusion(t string, s string) bool{
    need, window := map[byte]int{}, map[byte]int{} // go中无char.还有注意不能只声明，不创建
    for i:=0;i= len(t){
            // 在这里判断是否找到合法的字串【关键】
            if valid == len(need){
                return true
            }
            // d是将一处窗口的字符
            d := s[left]
            // 左移窗口
            left++
            // 进行窗口内数据的一系列更新【关键】
            if need[d]!=0{
                if window[d] == need[d]{
                    valid--
                }
                window[d]--
            }
        }
    }
    // 未找到符合条件的子串
    return false
}
```

对于这道题的解法代码，基本上和最小覆盖子串一模一样，只需要改变两个地方：

1、本题移动 `left` 缩小窗口的时机是窗口大小大于 `t.size()` 时，应为排列嘛，显然长度应该是一样的。

2、当发现 `valid == need.size()` 时，就说明窗口中就是一个合法的排列，所以立即返回 `true`。

至于如何处理窗口的扩大和缩小，和最小覆盖子串完全相同。

### 三、找所有字母异位词

这是 LeetCode 第 438 题，Find All Anagrams in a String，难度 Medium：

[![img](https://labuladong.gitee.io/algo/images/slidingwindow/title3.png)](https://labuladong.gitee.io/algo/images/slidingwindow/title3.png)

呵呵，这个所谓的字母异位词，不就是排列吗，搞个高端的说法就能糊弄人了吗？**相当于，输入一个串 `S`，一个串 `T`，找到 `S` 中所有 `T` 的排列，返回它们的起始索引**。

直接默写一下框架，明确刚才讲的 4 个问题，即可秒杀这道题：

```go
// 滑动窗口算法框架——找所有字母异位词
func findAnagrams(s string, t string) []int{
    need, window := map[byte]int{}, map[byte]int{} // go中无char.还有注意不能只声明，不创建
    for i:=0;i= len(t){
            // 窗口符合条件时，将起始索引加入res【重要】
            if valid == len(need){
                res = append(res, left)
            }
            // d是将一处窗口的字符
            d := s[left]
            // 左移窗口
            left++
            // 进行窗口内数据的一系列更新【重要】
            if need[d]!=0{
                if window[d] == need[d]{
                    valid--
                }
                window[d]--
            }
        }
    }
    return res
}
```

跟寻找字符串的排列一样，只是找到一个合法异位词（排列）之后将起始索引加入 `res` 即可。

### 四、最长无重复子串

这是 LeetCode 第 3 题，Longest Substring Without Repeating Characters，难度 Medium：

[![img](https://labuladong.gitee.io/algo/images/slidingwindow/title4.png)](https://labuladong.gitee.io/algo/images/slidingwindow/title4.png)

这个题终于有了点新意，不是一套框架就出答案，不过反而更简单了，稍微改一改框架就行了：

```go
// 滑动窗口算法框架——最长无重复子串
func lengthOfLongestSubstring(s string) int{
    window := map[byte]int{} // go中无char.还有注意不能只声明，不创建
    left := 0
    right := 0
    res := 0  // 记录结果
    for right 1{
            // d是将一处窗口的字符
            d := s[left]
            // 左移窗口
            left++
            // 进行窗口内数据的一系列更新【重要】
            window[d]--
        }
        // 在这里更新答案[重要]
        if res < right-left{
            res = right -left
        }
    }
    return res
}
```

这就是变简单了，连 `need` 和 `valid` 都不需要，而且更新窗口内数据也只需要简单的更新计数器 `window` 即可。

当 `window[c]` 值大于 1 时，说明窗口中存在重复字符，不符合条件，就该移动 `left` 缩小窗口了嘛。

唯一需要注意的是，在哪里更新结果 `res` 呢？我们要的是最长无重复子串，哪一个阶段可以保证窗口中的字符串是没有重复的呢？

这里和之前不一样，要在收缩窗口完成后更新 `res`，因为窗口收缩的 while 条件是存在重复元素，换句话说收缩完成后一定保证窗口中没有重复嘛。

### 五、最后总结

建议背诵并默写这套框架，顺便背诵一下文章开头的那首诗。以后就再也不怕子串、子数组问题了好吧。
