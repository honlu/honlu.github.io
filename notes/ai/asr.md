---
title: ASR 语音识别选型
date: 2026-09-21
category: Notes
tags: [AI, ASR, 语音识别]
summary: 语音识别开源方案的选型决策：FunASR、Faster-Whisper、Vosk 的适用场景对比。
---

# ASR 语音识别选型

## 选型决策

```text
主要是中文？
├── 是 → FunASR（Paraformer）✅ 首选
└── 否（多语言/英文）→ Faster-Whisper ✅ 首选

资源非常有限（树莓派/手机）？
└── Vosk

不想写代码，要图形界面？
└── Buzz / MacWhisper
```

## 参考

1. [FunASR 多语言离线文件转写软件包（2024）](https://developer.aliyun.com/article/1629970)
2. [FunASR GitHub 仓库](https://github.com/modelscope/FunASR)
