# 背书系统权限升级

## 风险原因

旧页面会依次尝试公开REST读写、匿名Firebase登录、匿名REST注册和PUT。只要Realtime Database规则允许公开或任意匿名账号写入，知道数据库地址的人就可能绕过页面直接修改背书记录。

## 新方案

- 页面删除公开PUT、匿名登录和匿名注册回退。
- 页面只使用Firebase Email/Password登录；密码只交给Firebase SDK，不写入源码和Git。
- 浏览器保留Firebase登录会话，后续打开页面不必重复输入。
- 页面会刷新ID Token并核验 `teacher=true`；普通账号或失效会话会立即退出，不会显示为可写会话。
- 数据库写入要求登录令牌带 `teacher=true` 自定义声明。
- 当前保留公开只读，供“木宁的世界管理”本机同步代理读取；下一阶段可改为令牌保护的只读云函数，再同时关闭公开读取。

## 上线顺序

1. 在 `recitation-sync` Firebase项目启用Email/Password登录，创建唯一教师账号。
2. 使用Admin SDK给该UID设置 `teacher=true` 自定义声明。
3. 先部署规则：`firebase deploy --only database`。
4. 用未登录REST PUT验证返回 `Permission denied`。
5. 用没有教师声明的测试账号登录，确认页面拒绝云端同步并立即退出。
6. 用教师账号登录201和401页面，分别修改一条测试记录并确认同步。
7. 清除测试记录后，才发布本分支的GitHub Pages页面。

提交前运行 `npm test`，必须通过两页脚本语法、危险旧路径、教师声明和数据库规则检查。

不得先发布页面再部署规则，也不得把教师密码、刷新令牌或服务账号JSON提交到仓库。
