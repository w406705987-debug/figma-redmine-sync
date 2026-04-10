@echo off
chcp 65001 >nul
echo ============================================
echo   Figma-易协作同步工具 - 开机自启动配置
echo ============================================
echo.

:: 获取当前目录
set "SCRIPT_DIR=%~dp0"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

:: 创建 VBS 启动脚本（静默启动，无黑窗口）
echo 正在创建静默启动脚本...
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.CurrentDirectory = "%SCRIPT_DIR%"
echo WshShell.Run "cmd /c node server.js", 0, False
) > "%SCRIPT_DIR%start-silent.vbs"

:: 创建快捷方式到启动文件夹
echo 正在添加到开机启动...
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%STARTUP_FOLDER%\FigmaRedmineSync.lnk'); $s.TargetPath = '%SCRIPT_DIR%start-silent.vbs'; $s.WorkingDirectory = '%SCRIPT_DIR%'; $s.Description = 'Figma-易协作同步服务'; $s.Save()"

if exist "%STARTUP_FOLDER%\FigmaRedmineSync.lnk" (
    echo.
    echo ✅ 配置成功！
    echo.
    echo 服务将在下次开机时自动启动。
    echo 启动文件夹: %STARTUP_FOLDER%
    echo.
    echo 如需取消开机自启动，运行: uninstall-autostart.bat
) else (
    echo.
    echo ❌ 配置失败，请手动操作：
    echo 1. 按 Win+R，输入 shell:startup
    echo 2. 将 start-silent.vbs 复制到打开的文件夹中
)

echo.
pause
