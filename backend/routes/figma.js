/**
 * Figma API 路由
 * 用于获取 Figma 文件截图
 */

const express = require('express');
const router = express.Router();
const figmaService = require('../services/figmaService');
const recordService = require('../services/recordService');

/**
 * GET /api/figma/token
 * 检查 Figma Token 是否已配置
 */
router.get('/token', (req, res) => {
  const token = figmaService.getToken();
  res.json({
    configured: !!token,
    preview: token ? token.substring(0, 10) + '...' : ''
  });
});

/**
 * POST /api/figma/token
 * 保存 Figma Token
 */
router.post('/token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, error: '缺少 token 参数' });
  }
  
  const result = figmaService.saveToken(token);
  res.json(result);
});

/**
 * POST /api/figma/screenshot
 * 获取 Figma 截图
 * Body: { figmaUrl: string, scale?: number, save?: boolean, recordId?: string }
 */
router.post('/screenshot', async (req, res) => {
  try {
    const { figmaUrl, scale = 1, save = false, recordId = null } = req.body;
    
    if (!figmaUrl) {
      return res.status(400).json({ success: false, error: '缺少 figmaUrl 参数' });
    }

    // 解析 URL
    const { fileKey, nodeId } = figmaService.parseUrl(figmaUrl);
    
    if (!fileKey) {
      return res.status(400).json({ success: false, error: '无法解析 Figma URL' });
    }

    console.log(`截图请求: fileKey=${fileKey}, nodeId=${nodeId}, scale=${scale}, save=${save}`);

    // 如果没有节点 ID，先获取文件信息
    let targetNodeId = nodeId;
    let fileName = '';
    
    if (!targetNodeId) {
      const fileInfo = await figmaService.getFileInfo(fileKey);
      if (!fileInfo.success) {
        return res.json(fileInfo);
      }
      targetNodeId = fileInfo.firstPageId;
      fileName = fileInfo.fileName;
      console.log(`使用第一页: ${fileInfo.firstPageName} (${targetNodeId})`);
    }

    // 获取图片 URL
    const imageResult = await figmaService.getImageUrl(fileKey, targetNodeId, { scale });
    
    if (!imageResult.success) {
      return res.json(imageResult);
    }

    // 下载图片并转为 Base64
    const downloadResult = await figmaService.downloadImageAsBase64(imageResult.imageUrl);
    
    if (!downloadResult.success) {
      return res.json(downloadResult);
    }

    // 如果需要保存到记录中
    if (save && recordId) {
      recordService.updateRecordScreenshot(parseInt(recordId), downloadResult.base64);
    }

    res.json({
      success: true,
      imageUrl: imageResult.imageUrl,
      base64: downloadResult.base64,
      mimeType: downloadResult.mimeType,
      fileName
    });

  } catch (error) {
    console.error('截图失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/figma/file-info
 * 获取 Figma 文件信息
 */
router.post('/file-info', async (req, res) => {
  try {
    const { figmaUrl } = req.body;
    
    if (!figmaUrl) {
      return res.status(400).json({ success: false, error: '缺少 figmaUrl 参数' });
    }

    const { fileKey } = figmaService.parseUrl(figmaUrl);
    
    if (!fileKey) {
      return res.status(400).json({ success: false, error: '无法解析 Figma URL' });
    }

    const result = await figmaService.getFileInfo(fileKey);
    res.json(result);

  } catch (error) {
    console.error('获取文件信息失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/figma/screenshot/:path
 * 读取已保存的截图
 */
router.get('/screenshot/:path(*)', (req, res) => {
  try {
    const result = figmaService.getScreenshot(req.params.path);
    
    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('读取截图失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
