---
title: 二分搜索算法框架
date: 2026-08-31
category: Algorithms
tags: [算法, 二分查找, labuladong]
summary: 二分查找的统一模板：明确区间定义、注意边界细节，避免死循环。
---
> 二分查找的统一模板：明确区间定义、注意边界细节，避免死循环。

# 开篇碎碎念

整理自 *GoLabuladongAlgorithm* 仓库的 labuladong 算法小抄系列，原作者用 Python 写，这里整理的是 Go 版实现（部分保留了伪代码与图解）。建议先读「学习算法和刷题的框架思维」建立心智模型，再按顺序刷每道例题。

> 适合人群：想要形成算法解题套路、不再死记硬背题解的同学。
## 6、二分搜索算法框架

**前情提示：Go语言学习者。本文参考https://labuladong.gitee.io/algo，代码自己参考抒写，若有不妥之处，感谢指正**

**关于golang算法文章，为了便于下载和整理，都已开源放在：**

- https://github.com/honlu/GoLabuladongAlgorithm
- https://gitee.com/dreamzll/GoLabuladongAlgorithm
  方便就请分享，star！备注转载地址！欢迎一起学习和交流！

先给大家讲个笑话乐呵一下：

有一天阿东到图书馆借了 N 本书，出图书馆的时候，警报响了，于是保安把阿东拦下，要检查一下哪本书没有登记出借。阿东正准备把每一本书在报警器下过一下，以找出引发警报的书，但是保安露出不屑的眼神：你连二分查找都不会吗？于是保安把书分成两堆，让第一堆过一下报警器，报警器响；于是再把这堆书分成两堆…… 最终，检测了 logN 次之后，保安成功的找到了那本引起警报的书，露出了得意和嘲讽的笑容。于是阿东背着剩下的书走了。

从此，图书馆丢了 N - 1 本书。

二分查找并不简单，Knuth 大佬（发明 KMP 算法的那位）都说二分查找：**思路很简单，细节是魔鬼**。很多人喜欢拿整型溢出的 bug 说事儿，但是二分查找真正的坑根本就不是那个细节问题，而是在于到底要给 `mid` 加一还是减一，for 里到底用 ` target{
    // 搜索区间变为[left, mid - 1]
    right = mid - 1
}else{
    // 相等，收缩右侧边界
    right = mid - 1  
}
```

由于 while 的退出条件是 `left == right + 1`，所以当 `target` 比 `nums` 中所有元素都大时，会存在以下情况使得索引越界：

![img](https://gitee.com/labuladong/fucking-algorithm/raw/master/pictures/%E4%BA%8C%E5%88%86%E6%9F%A5%E6%89%BE/2.jpg)

因此，最后返回结果的代码应该检查越界情况：

```go
if left >= len(nums) || nums[left] != target{
    return -1
}
return left
```

至此，整个算法就写完了，完整代码如下：

```go
// 左侧边界的统一写法
func leftBound(nums []int, target int) int{
    left := 0
    right := len(nums) - 1 
    // 搜索区间[left, right]
    for left  target{
            // 搜索区间变为[left, mid - 1]
            right = mid - 1
        }else{
            // 相等，收缩右侧边界
            right = mid - 1  
        }
    }
    // 检查出界情况
    if left >= len(nums) || nums[left] != target{
		return -1
    }
    return left
}
```

这样就和第一种二分搜索算法统一了，都是两端都闭的「搜索区间」，而且最后返回的也是 `left` 变量的值。只要把住二分搜索的逻辑，两种形式大家看自己喜欢哪种记哪种吧。

### 三、寻找右侧边界的二分查找

类似寻找左侧边界的算法，这里也会提供两种写法，还是先写常见的左闭右开的写法，只有两处和搜索左侧边界不同，已标注：

```go
func rightBound(nums []int, target int) int{
    if len(nums) == 0{
        return -1
    }
    left := 0
    right := len(nums) 

    for left  target{
            // 搜索区间变为[left, mid - 1]
            right = mid - 1
        }else{
            // 相等。注意这里改成收缩左侧边界即可
            left = mid + 1  
        }
    }
    // 检查出界情况.注意这里检查right越界的情况，见下图
    if right  target{
            right = mid -1   
        }else{
            // 相等.直接返回
            return mid
        }
    }
    // 直接返回
    return -1
}

// 左侧边界的统一写法
func leftBound(nums []int, target int) int{
    left := 0
    right := len(nums) - 1 
    for left  target{
            right = mid - 1
        }else{
            // 相等，不返回，锁定左侧边界
            right = mid - 1  
        }
    }
    // 检查left出界情况
    if left >= len(nums) || nums[left] != target{
		return -1
    }
    return left
}

// 右侧统一写法
func rightBound(nums []int, target int) int{
    left := 0
    right := len(nums) - 1 
    for left  target{
            right = mid - 1
        }else{
            // 相等。不返回，锁定右侧边界
            left = mid + 1  
        }
    }
    // 检查right越界的情况
    if right < 0 || nums[right] != target{
		return -1
    }
    return right
}
```

如果以上内容你都能理解，那么恭喜你，二分查找算法的细节不过如此。

通过本文，你学会了：

1、分析二分查找代码时，不要出现 else，全部展开成 else if 方便理解。

2、注意「搜索区间」和 while 的终止条件，如果存在漏掉的元素，记得在最后检查。

3、如需定义左闭右开的「搜索区间」搜索左右边界，只要在 `nums[mid] == target` 时做修改即可，搜索右侧时需要减一。

4、如果将「搜索区间」全都统一成两端都闭，好记，只要稍改 `nums[mid] == target` 条件处的代码和返回的逻辑即可，**推荐拿小本本记下，作为二分搜索模板**。
