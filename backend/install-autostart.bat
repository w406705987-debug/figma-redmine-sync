@echo off
chcp 65001 >nul
echo ============================================
echo   Figma-易协作同步工具 - 开机自启动配置
echo ============================================
echo.

:: 获取当前目录
set "SCRIPT_DIR=%~dp0"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

:: 创建 VBS 启动脚本（静默启动，无黑窗口，带进程检测防止重复启动）
echo 正在创建静默启动脚本...
(
echo ' Figma-易协作同步服务 静默启动脚本
echo ' 会先检查是否已有服务运行，避免重复启动
echo.
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo Set objWMI = GetObject^("winmgmts:\\.\root\cimv2"^)
echo.
echo Set colProcesses = objWMI.ExecQuery^("SELECT * FROM Win32_Process WHERE Name = 'node.exe'"^)
echo.
echo nodeCount = 0
echo For Each objProcess in colProcesses
echo     cmdLine = objProcess.CommandLine
echo     If InStr^(cmdLine, "server.js"^) ^> 0 Then
echo         nodeCount = nodeCount + 1
echo     End If
echo Next
echo.
echo If nodeCount ^> 0 Then
echo     WScript.Quit
echo End If
echo.
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