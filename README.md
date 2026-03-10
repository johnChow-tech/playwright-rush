# 🚀 80 小时 Playwright (TypeScript) 架构师冲刺大纲

## 第一阶段：基建与核心 API ——“脱离 AI，建立肌肉记忆”（10 小时）

*目标：完全不依赖 AI，闭卷手写出一个带有 API 加持的自动化脚本。*

* **Node.js 与 TS 纯手工脚手架 (2h)**
* 徒手 `npm init`，安装 `@playwright/test` 和 TypeScript 依赖。
* 手写 `playwright.config.ts`，配置 `baseURL`、`projects`（跨浏览器）和 `use`（全局 Trace/Video 配置）。


* **核心 API 与 Auto-waiting 陷阱 (5h)**
* 闭卷默写：精准的 Locator 策略（`getByRole`, `getByTestId` 等）、常用的 Actions 和 Assertions（`toHaveText`, `toBeVisible`）。
* **重点痛点**：深度理解 Playwright 的 Auto-waiting 机制什么时候会失效（例如某些动态渲染的组件），并学习使用 `page.waitForResponse()` 和 `page.waitForSelector()` 手动补位。


* **【新增】API 与 UI 混合测试 (3h)**
* 学习使用 `page.request` 上下文。
* **练习**：写一个脚本，先用 `page.request.post()` 调用后端接口直接在数据库创建一个商品，然后 UI 直接导航到购物车断言商品是否存在。体验这种“降维打击”般的执行速度。



## 第二阶段：工程化架构与 Fixtures ——“告别面条代码”（25 小时）

*目标：掌握现代自动化测试框架的核心灵魂。*

* **深度 Page Object Model (POM) 落地 (10h)**
* 设计 `BasePage` 基类（封装通用方法如 `Maps`, `clickButton`）。
* 设计具体的业务页面类（如 `LoginPage`, `CheckoutPage`）。
* **练习**：实现“状态感知”的 POM（例如 `LoginPage.login()` 方法内部判断，如果已登录则直接 `return`，否则执行登录步骤）。


* **Fixtures 魔法体系 (8h)**
* 深度学习 `test.extend`。理解 Playwright 是如何通过依赖注入（DI）管理生命周期的。
* **练习**：自定义一个业务 Fixture。让你的测试用例直接写出 `test('购买', async ({ app }) => { await app.cart.checkout(); })`，实现极致的用例层整洁度。


* **数据驱动测试 (Data-Driven Testing) (4h)**
* 通过 `fs` 模块读取本地的 JSON 或 CSV 文件。
* **练习**：使用 `for...of` 循环动态生成 10 个边缘场景的登录测试用例。


* **【新增】视觉回归测试 (Visual Regression) (3h)**
* 学习 `expect(page).toHaveScreenshot()`。
* **练习**：对一个复杂图表页面进行截图断言，并使用 `mask` 属性精准遮蔽页面上动态变化的元素（如时间戳、随机广告位）。



## 第三阶段：复杂场景与黑科技 ——“掌控浏览器底层”（15 小时）

*目标：解决业务中那些“自动化根本测不了”的硬骨头。*

* **状态保持与 Authentication (5h)**
* 精通 `storageState`。
* **练习**：实现一个全局的 `global.setup.ts`，在所有测试开始前只登录一次，保存 Cookie/Token 状态，后续所有用例直接复用，彻底消灭重复的 UI 登录时间。


* **网络拦截与 Mocking (5h)**
* 掌握 `page.route()` 和 `page.unroute()`。
* **练习 1**：拦截某个大体积视频/图片的请求直接 `route.abort()`，体验页面秒开的快感。
* **练习 2**：拦截关键 API 接口，强行 `route.fulfill()` 返回 `HTTP 500`，测试前端的错误兜底 UI 是否正确展示。


* **多上下文、多 Tab 与 iFrame (5h)**
* 处理隐蔽的 Shadow DOM 和恶心的嵌套 iFrame。
* **练习**：在一个测试里实例化两个 `browserContext`（代表用户 A 和用户 B），模拟两人同时在聊天窗口发消息的实时互动。



## 第四阶段：企业级实战落地 ——“打造你的开源代表作”（20 小时）

*目标：摒弃简单的爬虫，从零构建一个可以直接写进简历的、令面试官惊艳的完整测试框架。*

* **选型**：选择一个真实的开源项目（例如 [RealWorld/Conduit](https://www.google.com/search?q=https://github.com/gothinkster/realworld) 或电商前端）。
* **要求**：
1. **纯粹的架构**：全局使用 POM + Fixtures 模式。
2. **混合闭环**：包含纯 UI 测试、纯 API 测试、以及 API+UI 混合测试。
3. **强壮的容错**：在 `playwright.config.ts` 中配置极致的重试机制（Retries）和 Trace Viewer 收集规则（`on-first-retry`）。
4. **完美的报告**：集成原生的 HTML Report，甚至尝试集成更专业的 Allure Report，产出包含截图、视频和报错调用栈的高逼格产物。



## 第五阶段：持续集成与高级并发 ——“架构师的最后一公里”（10 小时）

*目标：让本地的框架走向云端，实现成百上千个用例的分秒级交付。*

* **GitHub Actions 无缝集成 (4h)**
* 编写 `.github/workflows/e2e.yml`，使用你之前学过的 Playwright 官方 Docker 镜像加速运行。


* **【核心】Playwright 分片并发 (Sharding) (6h)**
* **练习**：在 GitHub Actions 中配置 `strategy: matrix`。
* 将你的 100 个用例拆分成 5 台机器同时跑（使用 `--shard=${{ matrix.shard }}/5` 命令）。
* 学习使用 Playwright 的 `merge-reports` 功能，将这 5 台机器产出的零散测试报告，最终合并成一个统一的 HTML 报告并推送到 GitHub Pages 上展示。



---

### 🗡️ 冲刺守则

1. **关闭 AI 代码补全（Copilot / Cursor）**：至少在前 40 小时内，强迫自己去查阅官方文档（playwright.dev），遇到报错先看终端日志，逼迫大脑建立真正的神经连接。