@echo off
chcp 65001 >nul
title Figma-易协作同步工具 - 清理多余进程
color 0E

echo.
echo  ════════════════════════════════════════════════════════════
echo  🧹 清理多余的 Node.js 进程
echo  ════════════════════════════════════════════════════════════
echo.

:: 统计当前 node 进程数
for /f %%a in ('tasklist /fi "imagename eq node.exe" ^| find /c "node.exe"') do set NODE_COUNT=%%a

if %NODE_COUNT% EQU 0 (
    echo  ✓ 没有发现 Node.js 进程
) else (
    echo  发现 %NODE_COUNT% 个 Node.js 进程，正在清理...
    echo.
    
    :: 结束所有 node 进程
    taskkill /f /im node.exe >nul 2>&1
    
    timeout /t 1 /nobreak >nul
    
    echo  ✓ 已清理所有 Node.js 进程
)

echo.
echo  ════════════════════════════════════════════════════════════
echo  📝 更新启动脚本（防止重复启动）
echo  ════════════════════════════════════════════════════════════
echo.

set "SCRIPT_DIR=%~dp0backend\"

:: 创建带进程检测的 VBS 启动脚本
echo ' Figma-易协作同步服务 - 静默启动脚本> "%SCRIPT_DIR%start-silent.vbs"
echo Set WshShell = CreateObject^("WScript.Shell"^)>> "%SCRIPT_DIR%start-silent.vbs"
echo Set objWMIService = GetObject^("winmgmts:\\.\root\cimv2"^)>> "%SCRIPT_DIR%start-silent.vbs"
echo Set colProcesses = objWMIService.ExecQuery^("SELECT * FROM Win32_Process WHERE Name = 'node.exe'"^)>> "%SCRIPT_DIR%start-silent.vbs"
echo For Each objProcess in colProcesses>> "%SCRIPT_DIR%start-silent.vbs"
echo     If InStr^(objProcess.CommandLine, "server.js"^) ^> 0 Then>> "%SCRIPT_DIR%start-silent.vbs"
echo         WScript.Quit>> "%SCRIPT_DIR%start-silent.vbs"
echo     End If>> "%SCRIPT_DIR%start-silent.vbs"
echo Next>> "%SCRIPT_DIR%start-silent.vbs"
echo WshShell.CurrentDirectory = "%SCRIPT_DIR%">> "%SCRIPT_DIR%start-silent.vbs"
echo WshShell.Run "cmd /c node server.js", 0, False>> "%SCRIPT_DIR%start-silent.vbs"

echo  ✓ 启动脚本已更新！
echo.

echo  ════════════════════════════════════════════════════════════
echo  🚀 重新启动服务
echo  ════════════════════════════════════════════════════════════
echo.

cd /d "%SCRIPT_DIR%"
start "" wscript "start-silent.vbs"

timeout /t 2 /nobreak >nul

:: 验证服务启动
curl -s http://localhost:3000/health >nul 2>&1
if not errorlevel 1 (
    echo  ✓ 服务已启动（端口 3000）
) else (
    echo  ⚠ 服务启动中，请稍后检查...
)

echo.
echo  ════════════════════════════════════════════════════════════
echo  ✅ 完成！
echo.
echo  下次开机将只启动 1 个 Node.js 进程
echo  ════════════════════════════════════════════════════════════
echo.
pause
