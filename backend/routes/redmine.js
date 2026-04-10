/**
 * 易协作 API 路由
 * 支持账号密码登录认证
 */

const express = require('express');
const router = express.Router();
const redmineService = require('../services/redmineService');
const recordService = require('../services/recordService');
const fs = require('fs');
const path = require('path');

const API_KEY_FILE = path.join(__dirname, '../data/api-key.json');

/**
 * GET /api/redmine/issues
 * 获取工单列表（从本地缓存）
 */
router.get('/issues', async (req, res) => {
  try {
    // 检查是否已配置凭据
    if (!redmineService.hasCredentials() && !redmineService.hasApiKey()) {
      return res.json({ 
        issues: [], 
        needCredentials: true,
        message: '请先配置易协作账号密码'
      });
    }
    
    const result = await redmineService.getMyIssues();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/redmine/issues/:id
 * 获取工单详情
 */
router.get('/issues/:id', async (req, res) => {
  try {
    const result = await redmineService.getIssue(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/redmine/issues/:id
 * 从缓存中删除工单
 */
router.delete('/issues/:id', async (req, res) => {
  try {
    const issueId = parseInt(req.params.id);
    const result = redmineService.deleteIssueFromCache(issueId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/redmine/issues
 * 手动添加工单到缓存
 */
router.post('/issues', async (req, res) => {
  try {
    const { id, subject } = req.body;
    if (!id) {
      return res.status(400).json({ error: '缺少工单 ID' });
    }
    
    const issue = {
      id: parseInt(id),
      subject: subject || `工单 #${id}`,
      status: '手动添加',
      addedAt: new Date().toISOString()
    };
    
    const result = redmineService.addIssueToCache(issue);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/redmine/issues/:id/sync
 * 同步 Figma 链接到易协作工单（添加到备注/notes）
 */
router.post('/issues/:id/sync', async (req, res) => {
  try {
    const { figmaUrl } = req.body;
    const issueId = req.params.id;
    
    if (!figmaUrl) {
      return res.status(400).json({ error: '缺少 figmaUrl 参数' });
    }

    const result = await redmineService.updateIssueNotes(issueId, figmaUrl);
    
    if (result.success) {
      recordService.addRecord({
        issueId: parseInt(issueId),
        figmaUrl: figmaUrl,
        action: 'sync_to_redmine',
        syncedAt: new Date().toISOString()
      });
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('同步到易协作失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/redmine/cache
 * 更新工单缓存（批量）
 */
router.put('/cache', async (req, res) => {
  try {
    const { issues } = req.body;
    if (!Array.isArray(issues)) {
      return res.status(400).json({ error: 'issues 必须是数组' });
    }
    const result = redmineService.updateCache(issues);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/redmine/issue-url/:id
 * 获取工单URL
 */
router.get('/issue-url/:id', (req, res) => {
  const url = redmineService.getIssueUrl(req.params.id);
  res.json({ url });
});

/**
 * GET /api/redmine/sync
 * 从易协作同步工单
 */
router.get('/sync', async (req, res) => {
  try {
    const result = await redmineService.syncFromRedmine();
    res.json(result);
  } catch (error) {
    console.error('同步工单失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/redmine/credentials
 * 保存易协作账号密码
 */
router.post('/credentials', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: '账号和密码不能为空' 
      });
    }
    
    // 保存凭据
    const result = redmineService.saveCredentials(username, password);
    
    if (result.success) {
      // 立即尝试同步以验证凭据
      console.log('凭据已保存，开始验证...');
      const syncResult = await redmineService.syncWithCredentials(username, password);
      
      if (syncResult.success) {
        res.json({
          success: true,
          message: `登录成功！已同步 ${syncResult.count} 个工单`,
          count: syncResult.count
        });
      } else {
        // 凭据验证失败，删除保存的凭据
        const credentialsFile = path.join(__dirname, '../data/credentials.json');
        if (fs.existsSync(credentialsFile)) {
          fs.unlinkSync(credentialsFile);
        }
        res.json({
          success: false,
          error: syncResult.error || '账号或密码错误',
          message: syncResult.message
        });
      }
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('保存凭据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/redmine/credentials/status
 * 检查凭据配置状态
 */
router.get('/credentials/status', (req, res) => {
  const hasCredentials = redmineService.hasCredentials();
  const credentials = redmineService.getCredentials();
  
  res.json({
    configured: hasCredentials,
    username: credentials ? credentials.username : null,
    savedAt: credentials ? credentials.savedAt : null
  });
});

/**
 * DELETE /api/redmine/credentials
 * 删除保存的凭据
 */
router.delete('/credentials', (req, res) => {
  try {
    const credentialsFile = path.join(__dirname, '../data/credentials.json');
    if (fs.existsSync(credentialsFile)) {
      fs.unlinkSync(credentialsFile);
    }
    res.json({ success: true, message: '凭据已删除' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/redmine/api-key
 * 保存 Cookie 和项目 ID
 */
router.post('/api-key', async (req, res) => {
  try {
    const { apiKey, cookie, projectId } = req.body;
    
    // 读取现有数据
    let data = {};
    if (fs.existsSync(API_KEY_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf-8'));
      } catch (e) {
        data = {};
      }
    }
    
    // 更新数据
    if (apiKey !== undefined) data.apiKey = apiKey;
    if (cookie !== undefined) data.cookie = cookie;
    if (projectId !== undefined) data.projectId = projectId;
    data.updatedAt = new Date().toISOString();
    
    // 保存
    fs.writeFileSync(API_KEY_FILE, JSON.stringify(data, null, 2));
    
    // 同时更新 redmineService 的项目 ID
    if (projectId) {
      redmineService.setProjectId(projectId);
    }
    
    res.json({ 
      success: true, 
      message: '配置已保存' 
    });
  } catch (error) {
    console.error('保存配置失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/redmine/logout
 * 退出登录，清除 cookie 配置
 */
router.post('/logout', (req, res) => {
  try {
    // 读取现有数据
    let data = {};
    if (fs.existsSync(API_KEY_FILE)) {
      try {
        data = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf-8'));
      } catch (e) {
        data = {};
      }
    }
    
    // 清除 cookie
    delete data.cookie;
    data.updatedAt = new Date().toISOString();
    
    // 保存
    fs.writeFileSync(API_KEY_FILE, JSON.stringify(data, null, 2));
    
    // 清除 redmineService 中的凭据
    redmineService.clearCredentials();
    
    res.json({ 
      success: true, 
      message: '已退出登录' 
    });
  } catch (error) {
    console.error('退出登录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/redmine/config
 * 获取当前配置（项目 ID 等）
 */
router.get('/config', (req, res) => {
  try {
    let data = {};
    if (fs.existsSync(API_KEY_FILE)) {
      data = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf-8'));
    }
    res.json({
      projectId: data.projectId || null,
      hasCookie: !!data.cookie,
      updatedAt: data.updatedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;