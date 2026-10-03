# 周末出逃 · Weekend Trip

## [点击这里，在线体验「周末出逃」](https://zhanghengrui2026-stack.github.io/Weekend-Trip/)

**作品已部署，可直接体验，无需登录或安装。支持手机和电脑。**

在线作品地址：<https://zhanghengrui2026-stack.github.io/Weekend-Trip/>

面向大学生的「周末城市探索指南」交互原型。按兴趣、预算、天气与同行人数，从上海的城市灵感中安排一次轻松出游。

## 体验路径

选择偏好 → 生成行程 → 切换雨天方案 → 邀请搭子 → 打卡并分享攻略。

- **发现周末**：9 份示例灵感，支持兴趣、预算、时长、人数、天气场景筛选与收藏。
- **我的计划**：预算约束下的路线生成、站点替换、费用拆分、雨天室内方案、可还原行程的分享链接。
- **找个搭子**：发起组队、加入与退出示例队伍。
- **探索手账**：文字与照片打卡、本机保存、文字攻略分享。
- 支持手机与电脑；图片和样式随站点托管，无第三方字体或 JavaScript CDN 依赖。

## 演示边界

活动、费用、天气和队伍为演示内容，不代表实时活动、实际预订或真实多人同步。出发前请确认具体地点、营业时间、票价与预约要求。

收藏、行程、队伍和手账保存在当前浏览器。分享链接包含主动分享的行程或文字，不包含私人照片。

## 开发与部署

纯 HTML、CSS 和 JavaScript，无需安装依赖或构建。

```sh
python -m http.server 4173
```

打开 `http://localhost:4173/` 即可预览。

GitHub Pages 发布源：`main` 分支、根目录 `/`。`.nojekyll` 让站点直接发布静态文件。后续修改后推送到同一仓库和分支即可更新，请保留账号名与仓库名以保持评审链接不变。

## 摄影鸣谢

图片遵循 [Unsplash License](https://unsplash.com/license)，展厅与咖啡图片仅为氛围参考。

- [runda choo · 上海公园](https://unsplash.com/photos/city-park-with-lake-and-autumn-trees-IiYlRNj95aw)
- [adam roye · 艺术展厅](https://unsplash.com/photos/people-viewing-art-in-a-museum-gallery-fB8hHkIpps8)
- [Rizky Subagja · 咖啡与书](https://unsplash.com/photos/latte-croissant-and-book-on-cafe-table-1k7TnX5GAww)
