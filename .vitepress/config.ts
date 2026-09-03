import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  dir: 'ltr',
  title: 'Andelu的空间',
  description: 'Andelu的空间,记录学习的点点滴滴,分享技术的快乐.',
  base: '/',
  cleanUrls: false,
  lastUpdated: true,

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],
  ],

  themeConfig: {
    logo: 'https://avatars.githubusercontent.com/u/28820135',

    nav: [
      { text: '首页', link: '/' },
      {
        text: '笔记',
        activeMatch: '/notes/',
        items: [
          { text: 'Algorithms', link: '/notes/algorithms/' },
          { text: 'Golang', link: '/notes/golang/' },
          { text: 'Database', link: '/notes/database/' },
          { text: 'Network', link: '/notes/network/' },
          { text: 'OS', link: '/notes/os/' },
          { text: 'System Design', link: '/notes/system-design/' },
        ],
      },
      {
        text: 'Blog',
        activeMatch: '/blog/',
        items: [
          { text: '技术', link: '/blog/tech/' },
          { text: '职业', link: '/blog/career/' },
          { text: '观点', link: '/blog/perspective/' },
          { text: '生活', link: '/blog/life/' },
        ],
      },
      { text: '关于', link: '/about' },
    ],

    sidebar: {
      '/notes/': [
        {
          text: 'Algorithms',
          items: [
            { text: '代码随想录', link: '/notes/algorithms/code_caprice/' },
            { text: 'CodeTop', link: '/notes/algorithms/code_top/' },
            { text: '高频算法', link: '/notes/algorithms/high_frequency/' },
            { text: 'Labuladong 框架', link: '/notes/algorithms/labuladong/' },
          ],
        },
        {
          text: 'Golang',
          items: [
            { text: 'Go笔记', link: '/notes/golang/' },
            { text: 'Go面试题', link: '/notes/golang/go-interview/' },
            { text: '并发', link: '/notes/golang/concurrency' },
            { text: '高级', link: '/notes/golang/advanced' },
            { text: 'runtime', link: '/notes/golang/runtime' },
          ],
        },
        {
          text: 'Database',
          items: [
            { text: 'DB 概览', link: '/notes/database/' },
            { text: 'MySQL', link: '/notes/database/mysql/' },
            { text: 'Redis', link: '/notes/database/redis/' },
          ],
        },
        {
          text: 'Network',
          items: [
            { text: 'Network 概览', link: '/notes/network/' },
            { text: '网络面试题', link: '/notes/network/network-interview/' },
          ],
        },
        {
          text: 'OS',
          items: [
            { text: 'OS 概览', link: '/notes/os/' },
            { text: '操作系统面试题', link: '/notes/os/os-interview/' },
          ],
        },
        {
          text: 'System Design',
          items: [
            { text: 'System Design', link: '/notes/system-design/' },
            { text: '系统架构设计师备考助手', link: '/notes/system-design/arch-exam-prep' },
          ],
        },
      ],
      '/blog/': [
        {
          text: 'Blog',
          items: [
            { text: '全部文章', link: '/blog/' },
            { text: '技术', link: '/blog/tech/' },
            { text: '职业', link: '/blog/career/' },
            { text: '观点', link: '/blog/perspective/' },
            { text: '生活', link: '/blog/life/' },
          ],
        },
      ],
    },

    outline: {
      level: 2,
      label: '本页目录',
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索文档',
          },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除搜索条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    lastUpdated: {
      text: '最后更新于',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    },

    editLink: {
      pattern: 'https://github.com/honlu/honlu.github.io/edit/master/:path',
      text: '在 GitHub 上编辑此页',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/honlu' },
    ],

    footer: {
      message: '基于 MIT 许可发布',
      copyright: 'Copyright © 2026 Andelu',
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题切换',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },
})