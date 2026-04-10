/**
 * POPO 消息路由
 */

const express = require('express');
const router = express.Router();
const popoService = require('../services/popoService');
const recordService = require('../services/recordService');

/**
 * POST /api/popo/send
 * 发送审核消息到 POPO 群
 */
router.post('/send', async (req, res) => {
  try {
    const { issueId, issueTitle, figmaUrl, customMessage } = req.body;
    
    // 参数验证
    if (!issueId || !issueTitle || !figmaUrl) {
      return res.status(400).json({ 
        error: '缺少必要参数',
        required: ['issueId', 'issueTitle', 'figmaUrl']
      });
    }

    let result;
    
    // 如果有自定义消息，直接发送自定义内容
    if (customMessage) {
      result = await popoService.sendCustomMessage(customMessage);
    } else {
      // 否则使用默认格式
      const issueUrl = `https://x20.pm.netease.com/issues/${issueId}`;
      result = await popoService.sendMessage({
        issueId,
        issueTitle,
        issueUrl,
        figmaUrl
      });
    }

    // 记录同步
    recordService.addRecord({
      issueId,
      issueTitle,
      figmaUrl,
      sentToPopo: true,
      action: 'popo_send'
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/popo/send-custom
 * 发送自定义消息
 */
router.post('/send-custom', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: '缺少 content 参数' });
    }
    const result = await popoService.sendCustomMessage(content);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/popo/test
 * 测试 POPO 机器人连接
 */
router.post('/test', async (req, res) => {
  try {
    const result = await popoService.sendCustomMessage('🔔 Figma-易协作同步工具 测试消息');
    res.json({ success: true, message: '测试消息已发送', result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
