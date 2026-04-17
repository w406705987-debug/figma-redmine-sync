@echo off
chcp 65001 >nul
title Figma-易协作同步工具 安装向导
color 0A

echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║                                                           ║
echo  ║     🔗 Figma-易协作同步工具 - 安装向导                    ║
echo  ║                                                           ║
echo  ║     本向导将帮助你完成首次配置：                          ║
echo  ║       1. 安装依赖                                         ║
echo  ║       2. 配置开机自启动                                   ║
echo  ║       3. 启动服务                                         ║
echo  ║                                                           ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.

:: 检查 Node.js 是否安装
where node >nul 2>&1
if errorlevel 1 (
    echo  ❌ 未检测到 Node.js！
    echo.
    echo  请先安装 Node.js：
    echo  下载地址: https://nodejs.org/
    echo.
    echo  安装完成后，重新运行此脚本。
    echo.
    pause
    exit /b 1
)

:: 显示 Node.js 版本
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo  ✓ 检测到 Node.js %NODE_VERSION%
echo.

:: 进入 backend 目录
cd /d "%~dp0backend"

:: 步骤1：安装依赖
echo  ════════════════════════════════════════════════════════════
echo  步骤 1/3：安装依赖
echo  ════════════════════════════════════════════════════════════
echo.

if exist "node_modules" (
    echo  ✓ 依赖已安装，跳过...
) else (
    echo  正在安装依赖（npm install）...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo  ❌ 依赖安装失败！
        pause
        exit /b 1
    )
    echo.
    echo  ✓ 依赖安装完成！
)
echo.

:: 步骤2：配置开机自启动
echo  ════════════════════════════════════════════════════════════
echo  步骤 2/3：配置开机自启动
echo  ════════════════════════════════════════════════════════════
echo.

set "SCRIPT_DIR=%~dp0backend\"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

:: 创建 VBS 启动脚本（带进程检测，避免重复启动）
(
echo ' Figma-易协作同步服务 - 静默启动脚本
echo ' 启动前检查是否已有进程在运行
echo.
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo Set objWMIService = GetObject^("winmgmts:\\.\root\cimv2"^)
echo.
echo ' 检查是否已有 node server.js 在运行
echo Set colProcesses = objWMIService.ExecQuery^("SELECT * FROM Win32_Process WHERE Name = 'node.exe'"^)
echo.
echo For Each objProcess in colProcesses
echo     If InStr^(objProcess.CommandLine, "server.js"^) ^> 0 Then
echo         ' 已有服务在运行，直接退出
echo         WScript.Quit
echo     End If
echo Next
echo.
echo ' 没有运行，启动服务
echo WshShell.CurrentDirectory = "%SCRIPT_DIR%"
echo WshShell.Run "cmd /c node server.js", 0, False
) > "%SCRIPT_DIR%start-silent.vbs"

:: 创建快捷方式到启动文件夹
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTUP_FOLDER%\FigmaRedmineSync.lnk'); $s.TargetPath = '%SCRIPT_DIR%start-silent.vbs'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'Figma-易协作同步服务'; $s.Save()" >nul 2>&1

if exist "%STARTUP_FOLDER%\FigmaRedmineSync.lnk" (
    echo  ✓ 开机自启动已配置！
    echo    服务将在每次开机时自动在后台运行
) else (
    echo  ⚠ 自动配置失败，你可以手动操作：
    echo    按 Win+R，输入 shell:startup
    echo    将 backend\start-silent.vbs 复制到打开的文件夹
)
echo.

:: 步骤3：启动服务
echo  ════════════════════════════════════════════════════════════
echo  步骤 3/3：启动服务
echo  ════════════════════════════════════════════════════════════
echo.

:: 检查是否已在运行
curl -s http://localhost:3000/health >nul 2>&1
if not errorlevel 1 (
    echo  ✓ 服务已在运行！
) else (
    echo  正在启动服务...
    start "" wscript "%SCRIPT_DIR%start-silent.vbs"
    
    :: 等待服务启动
    timeout /t 3 /nobreak >nul
    
    curl -s http://localhost:3000/health >nul 2>&1
    if not errorlevel 1 (
        echo  ✓ 服务启动成功！
    ) else (
        echo  ⚠ 服务启动中，请稍后检查...
    )
)
echo.

:: 完成
echo.
echo  ╔═══════════════════════════════════════════════════════════╗
echo  ║                                                           ║
echo  ║     ✅ 安装完成！                                         ║
echo  ║                                                           ║
echo  ╚═══════════════════════════════════════════════════════════╝
echo.
echo  ════════════════════════════════════════════════════════════
echo  📌 步骤 A：在 Figma 中安装插件
echo  ════════════════════════════════════════════════════════════
echo.
echo     1. 打开 Figma 桌面版，进入任意设计文件
echo     2. 右键 → Plugins → Development → Import plugin from manifest...
echo     3. 选择文件：figma-plugin\manifest.json
echo.
echo  ════════════════════════════════════════════════════════════
echo  📌 步骤 B：获取 Cookie（只需配置一次）
echo  ════════════════════════════════════════════════════════════
echo.
echo     接下来会打开易协作网站，请按以下步骤操作：
echo.
echo     ┌─────────────────────────────────────────────────────┐
echo     │                                                     │
echo     │  1. 登录易协作（任意项目页面都可以）                │
echo     │                                                     │
echo     │  2. 按 F12 打开开发者工具                          │
echo     │     （或右键 → 检查）                              │
echo     │                                                     │
echo     │  3. 点击顶部的 Application 标签                    │
echo     │     （如果看不到，点击 ＞＞ 展开更多）              │
echo     │                                                     │
echo     │  4. 左侧找到 Cookies → x20.pm.netease.com          │
echo     │                                                     │
echo     │  5. 在右侧列表找到 _my_redmine                     │
echo     │     双击 Value 列的值，Ctrl+C 复制                 │
echo     │                                                     │
echo     │  6. 打开 Figma 插件，粘贴 Cookie，点击保存         │
echo     │                                                     │
echo     │  💡 配置后会自动拉取所有指派给你的未关闭工单       │
echo     │                                                     │
echo     └─────────────────────────────────────────────────────┘
echo.
echo  ════════════════════════════════════════════════════════════
echo  🎉 完成后，每次开机服务会自动运行，打开插件即可使用！
echo  ════════════════════════════════════════════════════════════
echo.
echo  按任意键打开易协作网站...
pause >nul
start "" "https://x20.pm.netease.com"

echo.
echo  ════════════════════════════════════════════════════════════
echo  💡 快捷键提示：
echo.
echo     F12          打开开发者工具
echo     Ctrl+C       复制选中的内容
echo     Ctrl+V       粘贴到 Figma 插件
echo  ════════════════════════════════════════════════════════════
echo.
pause
