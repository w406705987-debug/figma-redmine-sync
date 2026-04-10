# 🔗 Figma-易协作同步工具

一款连接 Figma 设计稿与易协作工单的效率工具，支持一键同步链接、发送审核消息到 POPO 群、自动记录用于日报。

## ✨ 功能特性

- 📋 **实时同步工单** - 从易协作拉取指派给你的工单
- 🔗 **关联设计** - 在 Figma 节点上添加易协作工单链接
- 📤 **同步到易协作** - 将 Figma 设计稿链接同步到工单
- 📝 **审核消息** - 一键复制审核内容发送到 POPO 群
- 🚀 **开机自启** - 配置后自动在后台运行，无需每次手动启动

## 🚀 快速开始

### 一键安装（推荐）

**双击 `install.bat`** 即可完成所有配置！

安装向导会自动：
1. ✅ 安装 npm 依赖
2. ✅ 配置开机自启动（后台静默运行）
3. ✅ 启动服务
4. ✅ 打开易协作网站获取 Cookie

安装完成后，**每次开机服务会自动运行**，无需任何手动操作。

---

### 手动安装

如果一键安装失败，可以手动执行：

```bash
cd backend
npm install                    # 安装依赖（仅首次）
```

然后双击 `backend\install-autostart.bat` 配置开机自启动。

### 管理脚本

| 脚本 | 位置 | 功能 |
|------|------|------|
| `install.bat` | 根目录 | **一键安装向导**（推荐） |
| `start.bat` | backend | 手动启动服务（显示窗口） |
| `stop.bat` | backend | 停止后台服务 |
| `install-autostart.bat` | backend | 配置开机自启动 |
| `uninstall-autostart.bat` | backend | 取消开机自启动 |

### 安装 Figma 插件

1. 打开 Figma 桌面版
2. 进入任意设计文件
3. 右键 → Plugins → Development → Import plugin from manifest...
4. 选择 `figma-plugin/manifest.json` 文件
5. 插件安装完成！

### 5. 配置认证

首次使用需要配置易协作认证：

1. 打开 https://x20.pm.netease.com 并登录
2. 按 **F12** 打开开发者工具
3. 切换到 **Application** → **Cookies**
4. 找到 `_my_redmine`，复制其值
5. 在 Figma 插件中粘贴并保存

> 💡 Cookie 只需配置一次，会保存在本地。过期后重新配置即可。

### 6. 使用插件

1. 在 Figma 中：右键 → Plugins → Development → Figma-易协作同步工具
2. 点击 🔄 按钮从易协作同步工单
3. 选中工单，粘贴 Figma 设计稿链接
4. 点击「关联到节点」或「同步到易协作」

## 📁 项目结构

```
figma-redmine-sync/
├── backend/                    # 本地 Node.js 服务
│   ├── server.js              # 服务入口
│   ├── config.js              # 配置文件
│   ├── routes/                # API 路由
│   ├── services/              # 业务服务
│   ├── data/                  # 数据存储
│   │   ├── api-key.json       # Cookie 配置
│   │   ├── issues-cache.json  # 工单缓存
│   │   └── sync-records.json  # 同步记录
│   ├── start.bat              # 启动脚本
│   ├── stop.bat               # 停止脚本
│   ├── install-autostart.bat  # 配置开机自启
│   └── uninstall-autostart.bat # 取消开机自启
├── figma-plugin/              # Figma 插件
│   ├── manifest.json          # 插件配置
│   ├── code.js               # 插件逻辑
│   └── ui/                   # 插件 UI
└── README.md
```

## 🔧 配置说明

### 易协作配置 (`backend/config.js`)

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `redmine.host` | 易协作实例地址 | `x20.pm.netease.com` |
| `redmine.project` | 项目代码 | `X20-MARVEL` |

## 📡 API 接口

本地服务提供以下 API：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/api/redmine/issues` | GET | 获取工单列表（从缓存） |
| `/api/redmine/sync` | GET | 从易协作同步工单 |
| `/api/redmine/issues` | POST | 手动添加工单 |
| `/api/redmine/api-key` | POST | 保存 Cookie |
| `/api/records/today` | GET | 获取今日同步记录 |

## ❓ 常见问题

### Q: 插件显示"服务未启动"？
A: 双击 `start.bat` 启动本地服务。如果已配置开机自启，重启电脑即可。

### Q: Cookie 过期了怎么办？
A: 重新从浏览器获取 `_my_redmine` Cookie，在插件中点击「重新配置」粘贴新值。

### Q: 如何查看服务是否在运行？
A: 访问 http://localhost:3000/health ，如果返回 `{"status":"ok"}` 说明服务正常。

### Q: 如何停止后台服务？
A: 双击 `stop.bat`，或在任务管理器中结束 `node.exe` 进程。

## 📄 License

MIT