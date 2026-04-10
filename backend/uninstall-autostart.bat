@echo off
chcp 65001 >nul
echo ============================================
echo   Figma-易协作同步工具 - 取消开机自启动
echo ============================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"

:: 删除启动文件夹中的快捷方式
if exist "%STARTUP_FOLDER%\FigmaRedmineSync.lnk" (
    del "%STARTUP_FOLDER%\FigmaRedmineSync.lnk"
    echo ✅ 已取消开机自启动
) else (
    echo ⚠️ 未找到开机启动配置
)

echo.
pause
