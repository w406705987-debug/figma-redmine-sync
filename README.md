# �‍💻 Figma 工作流提效工具

<div align="center">

**一站式 Figma + 易协作工作流解决方案**

[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](https://github.com/w406705987-debug/figma-redmine-sync/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Figma%20Plugin-orange.svg)](https://www.figma.com)

为设计师量身打造的 Figma 插件，将设计稿与易协作工单无缝连接，让协作更高效、提审更轻松！

[快速开始](#-快速开始) · [功能介绍](#-核心功能) · [使用指南](#-使用指南) · [更新日志](#-更新日志)

</div>

---

## ✨ 核心功能

### 🎯 工单管理
- **一键同步工单**：自动拉取你名下所有未关闭的易协作工单
- **智能多选筛选**：同时查看多个状态的工单（如「新建」+「UI设计中」）
- **筛选状态记忆**：插件重启后自动恢复上次的筛选条件
- **快速关联节点**：为 Figma 设计节点添加易协作工单链接，双向关联

### � 设计稿管理
- **自动截图生成**：复制审核内容时自动生成设计稿截图（后台无感知）
- **一键复制截图**：支持多种复制方式，适配不同浏览器环境
- **智能性能优化**：1% 分辨率 + JPG 格式，大文件也能秒速生成
- **Base64 内嵌存储**：截图随需求记录自动保存，无需管理本地文件

### � 提审日报
- **多方关联记录**：将 Figma 设计稿链接、易协作工单、审核内容一键打包
- **设计稿备注**：为每个 Figma 链接添加自定义备注（如"主界面 v2"）
- **快速跳转**：点击「前往」按钮直达 Figma 设计文件
- **审核内容复制**：一键复制格式化的审核内容，粘贴即用

### 🔐 安全认证
- **Cookie 自动认证**：无需 API Key，使用浏览器 Cookie 登录易协作
- **Figma Token 配置**：详细的图文引导，轻松完成配置
- **本地后端服务**：数据不经过第三方，安全可靠

---

## 🎬 功能演示

### 1️⃣ 工单同步与筛选
```
[我的工单] → 自动加载 → 多选筛选 → 状态记忆
```
- 支持同时选择「新建」「UI设计中」「代码开发」等多个状态
- 关闭插件后重新打开，筛选条件自动恢复

### 2️⃣ 多方关联工作流
```
选中 Figma 节点 → 关联易协作工单 → 复制审核内容 → 后台自动截图
```
- Figma 节点添加工单超链接
- 设计稿链接 + 工单信息 + 截图一次性准备完毕
- 提审时直接从「提审日报」页签查看和复制

### 3️⃣ 提审日报
```
[提审日报] → 查看所有需求记录 → 点击「前往」跳转 Figma → 复制审核内容
```
- 所有关联记录集中管理
- 支持为每个 Figma 链接添加备注
- 截图自动生成，随时查看

---

## 🚀 快速开始

### 📦 安装步骤

#### 第一步：下载安装包
访问 [GitHub 仓库](https://github.com/w406705987-debug/figma-redmine-sync) 下载最新版本

#### 第二步：安装后端服务
```bash
# 解压下载的 backend-v1.4.0.zip
# 双击运行 install.bat（仅首次需要）
install.bat

# 启动服务（安装后会开机自启）
start.bat
```

后端服务将在 `http://localhost:3000` 运行

#### 第三步：安装 Figma 插件
1. 打开 Figma 桌面版
2. 右键菜单 → `Plugins` → `Development` → `Import plugin from manifest`
3. 选择 `figma-plugin/manifest.json` 文件
4. 插件安装完成！

#### 第四步：配置认证
启动插件后，按照引导完成：
1. **易协作 Cookie 配置**（从浏览器开发者工具获取）
2. **Figma Token 配置**（用于生成设计稿截图）

详细配置步骤插件内有图文引导 📖

---

## 📚 使用指南

### 🔧 配置易协作 Cookie

1. 打开易协作网站并登录（如 `https://x20.pm.netease.com`）
2. 按 `F12` 打开开发者工具
3. 切换到 `Application` → `Cookies`
4. 复制 `_redmine_session` 的值
5. 粘贴到插件配置区域并保存

### 🎨 配置 Figma Token

1. 打开 Figma 主界面左上角的头像菜单
2. 点击 `Settings` → `Account` 页签
3. 找到 `Personal access tokens` 区域
4. 点击 `Create a new personal access token`
5. 输入描述（如"Redmine Sync"）并复制生成的 Token
6. 粘贴到插件配置区域并保存

### 📝 创建多方关联记录

#### 方式一：从 Figma 节点创建
1. 在 Figma 中选中一个设计节点
2. 切换到「多方关联」页签
3. 从工单列表中选择要关联的工单
4. 点击「关联到节点」按钮
5. 点击「复制审核内容」（自动后台生成截图）

#### 方式二：手动添加 Figma 链接
1. 切换到「多方关联」页签
2. 输入 Figma 设计稿链接
3. 点击「添加 Figma 链接」
4. 选择工单并复制审核内容

### � 使用多选筛选

1. 切换到「我的工单」页签
2. 点击顶部「筛选」按钮
3. 勾选多个状态（如「新建」+「UI设计中」）
4. 工单列表实时更新
5. 筛选条件自动记忆，重启插件后保持

### 📊 查看提审日报

1. 切换到「提审日报」页签
2. 查看所有已创建的需求记录
3. 点击「备注」按钮为 Figma 链接添加说明
4. 点击「前往」按钮直接跳转到 Figma 文件
5. 点击「复制」复制审核内容
6. 点击「查看截图」查看设计稿截图

---

## 🎯 典型工作流

### 场景一：UI 设计师日常提审
```
1. 完成设计 → 在 Figma 中选中关键节点
2. 打开插件 → 关联对应的易协作工单
3. 复制审核内容 → 自动生成截图
4. 粘贴到易协作 → 一键提审完成 ✅
```

### 场景二：批量查看设计进度
```
1. 打开插件 → 切换到「我的工单」
2. 多选「UI设计中」+「待验收」状态
3. 快速定位当前进行中的设计任务
4. 筛选条件自动保存，下次打开直接查看 ✅
```

### 场景三：周报/日报整理
```
1. 打开插件 → 切换到「提审日报」
2. 查看本周所有提审记录
3. 点击「前往」逐个查看设计稿
4. 批量复制审核内容整理到周报 ✅
```

---

## 🛠️ 技术架构

### 前端（Figma Plugin）
- **框架**：原生 JavaScript + Figma Plugin API
- **UI**：自定义 CSS + 深色主题适配
- **存储**：Figma `clientStorage` API（解决 iframe 安全限制）
- **通信**：`postMessage` 主线程-UI 双向通信

### 后端（Node.js）
- **框架**：Express.js
- **认证**：Cookie-based 易协作 API 调用
- **截图**：Figma REST API + Base64 编码
- **持久化**：本地 JSON 文件存储（`sync-records.json`）

### 核心技术亮点
- ✅ **零配置化**：安装后即用，Cookie 自动认证
- ✅ **高性能截图**：1% 分辨率 + JPG 格式，30s → 6s
- ✅ **安全存储**：使用 Figma 官方 `clientStorage` 替代 localStorage
- ✅ **智能筛选**：支持多选 + 状态记忆，用户体验极佳

---

## 📋 功能列表

### ✅ 已实现功能

#### 工单管理
- [x] 易协作工单同步
- [x] 工单列表展示（ID、标题、状态、优先级）
- [x] 单状态筛选
- [x] 多状态筛选（v1.4.0 新增）
- [x] 筛选状态记忆（v1.4.0 新增）
- [x] 工单详情查看
- [x] 快速跳转到易协作

#### 设计稿管理
- [x] Figma 节点关联工单
- [x] 为节点添加易协作超链接
- [x] 手动添加 Figma 设计稿链接
- [x] 自动生成设计稿截图（后台异步）
- [x] 多种截图复制方式（Clipboard API / Canvas / 浏览器标签）
- [x] 设计稿备注功能
- [x] 快速跳转到 Figma 文件

#### 提审日报
- [x] 多方关联记录管理
- [x] 审核内容一键复制
- [x] 需求记录列表展示
- [x] 截图查看与复制
- [x] 记录删除功能

#### 配置与认证
- [x] Cookie 认证配置引导
- [x] Figma Token 配置引导
- [x] 后端服务连接检测
- [x] 开机自启动（Windows）

### 🚧 未来规划
- [ ] 支持批量关联（多节点 → 多工单）
- [ ] 工单评论功能
- [ ] 更多筛选条件（优先级、负责人等）
- [ ] 导出提审日报为 Excel/PDF
- [ ] 支持其他项目管理工具（Jira、Tapd 等）

---

## 🐛 常见问题

### Q1: 插件无法连接后端服务
**A**: 检查以下几点：
1. 后端服务是否正在运行（查看任务管理器是否有 `node.exe`）
2. 重新运行 `start.bat` 启动服务
3. 检查端口 3000 是否被占用

### Q2: 工单列表为空
**A**: 
1. 确认已配置易协作 Cookie
2. 检查 Cookie 是否过期（重新登录易协作并更新 Cookie）
3. 确认你的账号下有未关闭的工单

### Q3: 截图生成失败
**A**:
1. 确认已配置 Figma Token
2. 检查 Token 是否有效（重新生成并更新）
3. 文件过大时需要等待 5-10 秒

### Q4: 筛选状态无法保存
**A**:
- v1.4.0 已修复此问题，请更新到最新版本
- 使用 Figma `clientStorage` 替代 localStorage，解决 iframe 安全限制

### Q5: 复制图片失败
**A**:
- 插件提供了多种复制方式
- 如果自动复制失败，会打开图片页面供手动右键复制
- 建议使用 Chrome 浏览器以获得最佳体验

---

## 📦 项目结构

```
figma-redmine-sync/
├── figma-plugin/              # Figma 插件前端
│   ├── code.js               # 主线程代码（节点操作、消息通信）
│   ├── manifest.json         # 插件配置文件
│   └── ui/
│       └── index.html        # 插件 UI（单文件应用）
├── backend/                   # Node.js 后端服务
│   ├── server.js             # Express 服务器入口
│   ├── services/             # 业务逻辑
│   │   ├── redmineService.js # 易协作 API 封装
│   │   ├── figmaService.js   # Figma API 封装
│   │   └── recordService.js  # 需求记录管理
│   ├── data/                 # 数据存储
│   │   └── sync-records.json # 多方关联记录
│   └── package.json          # 依赖配置
├── install.bat               # 一键安装脚本
├── start.bat                 # 启动脚本
├── VERSION.txt               # 版本号
└── README.md                 # 本文档
```

---

## � 更新日志

### v1.4.0 (2026-04-13)
**新增功能**
- ✨ 工单筛选支持多选（可同时选择多个状态）
- ✨ 筛选状态自动记忆（插件重启后保持）
- 🔧 使用 Figma `clientStorage` API 替代 localStorage
- 🐛 修复 iframe 环境下存储失败的问题

### v1.3.0 (2026-04-12)
**新增功能**
- ✨ 新增 Figma 设计稿备注功能
- ✨ 新增「前往」按钮快速跳转到 Figma
- 🎨 「需求记录」页签重命名为「提审日报」
- 🎨 优化文本大小和颜色（12px 白色文本）
- 🔧 自动截图改为后台异步生成（用户无感知）

### v1.2.0
**新增功能**
- ✨ 设计稿自动截图生成
- ✨ 多种截图复制方式（Clipboard API / Canvas / 浏览器标签）
- 🔧 截图性能优化（1% 分辨率 + JPG 格式）
- 🔧 Base64 内嵌存储（无需本地文件管理）

### v1.1.0
**新增功能**
- ✨ 多方关联记录管理
- ✨ 审核内容一键复制
- ✨ Cookie 认证配置引导
- ✨ Figma Token 配置引导

### v1.0.0
**初始版本**
- ✨ 基础工单同步功能
- ✨ Figma 节点关联工单
- ✨ 单状态筛选

[查看完整更新日志](RELEASE_NOTES_v1.4.0.md)

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发环境搭建
```bash
# 克隆仓库
git clone https://github.com/w406705987-debug/figma-redmine-sync.git

# 安装后端依赖
cd backend
npm install

# 启动后端服务
npm start

# 在 Figma 中导入插件
# Plugins → Development → Import plugin from manifest
# 选择 figma-plugin/manifest.json
```

### 提交规范
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议

---

## 📞 联系与支持

- **GitHub Issues**: https://github.com/w406705987-debug/figma-redmine-sync/issues
- **功能建议**: 欢迎在 Issues 中提出
- **Bug 反馈**: 请提供详细的复现步骤和错误截图

---

## 🙏 致谢

感谢以下开源项目：
- [Figma Plugin API](https://www.figma.com/plugin-docs/)
- [Express.js](https://expressjs.com/)
- [Axios](https://axios-http.com/)

---

<div align="center">

**让 Figma 工作流更高效！**

Made with ❤️ by Design Team

[⭐ Star](https://github.com/w406705987-debug/figma-redmine-sync) | [🐛 Report Bug](https://github.com/w406705987-debug/figma-redmine-sync/issues) | [� Request Feature](https://github.com/w406705987-debug/figma-redmine-sync/issues)

</div>