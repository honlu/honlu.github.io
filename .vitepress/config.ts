import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'en-US',
  dir: 'ltr',
  title: 'Andelu的空间',
  description: 'Andelu的空间,记录学习的点点滴滴,分享技术的快乐.',
  base: '/',
  cleanUrls: false,

  head: [],

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

    aside: {
      level: 2,
      label: '目录',
    },

    search: {
      provider: 'local',
    },
  },
})