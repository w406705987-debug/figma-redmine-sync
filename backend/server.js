/**
 * 主服务入口
 * 提供 API 代理、消息发送、记录存储功能
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const config = require('./config');

// 路由模块
const redmineRoutes = require('./routes/redmine');
const popoRoutes = require('./routes/popo');

// 设置文件路径
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');

const app = express();

// 中间件
app.use(cors({
  origin: '*', // Figma 插件需要跨域访问
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 请求日志
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    config: {
      redmineHost: config.redmine.host,
      project: config.redmine.project
    }
  });
});

// 注册路由
app.use('/api/redmine', redmineRoutes);
app.use('/api/popo', popoRoutes);

// 设置存储（用于保存 Figma URL 等配置）
app.get('/api/settings/figma-url', (req, res) => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      res.json(data);
    } else {
      res.json({});
    }
  } catch (e) {
    res.json({});
  }
});

app.post('/api/settings/figma-url', (req, res) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 审核员历史记录
const REVIEWERS_FILE = path.join(__dirname, 'data', 'reviewers.json');
// API Key 文件
const API_KEY_FILE = path.join(__dirname, 'data', 'api-key.json');

app.get('/api/settings/reviewers', (req, res) => {
  try {
    if (fs.existsSync(REVIEWERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(REVIEWERS_FILE, 'utf-8'));
      res.json(data);
    } else {
      res.json({ history: [] });
    }
  } catch (e) {
    res.json({ history: [] });
  }
});

app.post('/api/settings/reviewers', (req, res) => {
  try {
    // 读取现有数据
    let existing = { history: [], lastReviewer: '' };
    if (fs.existsSync(REVIEWERS_FILE)) {
      try {
        existing = JSON.parse(fs.readFileSync(REVIEWERS_FILE, 'utf-8'));
      } catch (e) {}
    }
    
    // 合并数据
    const newData = {
      history: req.body.history || existing.history || [],
      lastReviewer: req.body.lastReviewer || existing.lastReviewer || ''
    };
    
    fs.writeFileSync(REVIEWERS_FILE, JSON.stringify(newData, null, 2));
    console.log('已保存审核员数据:', newData);
    res.json({ success: true });
  } catch (e) {
    console.error('保存审核员失败:', e);
    res.status(500).json({ error: e.message });
  }
});

// API Key 管理
app.get('/api/settings/api-key', (req, res) => {
  try {
    if (fs.existsSync(API_KEY_FILE)) {
      const data = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf-8'));
      // 返回是否已配置，但不返回完整的 key（安全考虑）
      res.json({ 
        configured: !!data.apiKey,
        keyPreview: data.apiKey ? data.apiKey.substring(0, 8) + '...' : ''
      });
    } else {
      res.json({ configured: false });
    }
  } catch (e) {
    res.json({ configured: false });
  }
});

app.post('/api/settings/api-key', (req, res) => {
  try {
    const { apiKey, cookie } = req.body;
    
    // 读取现有数据
    let existing = {};
    if (fs.existsSync(API_KEY_FILE)) {
      try {
        existing = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf-8'));
      } catch (e) {}
    }
    
    // 更新数据（只更新提供的字段）
    if (apiKey) {
      existing.apiKey = apiKey;
      console.log('已保存 API Key:', apiKey.substring(0, 8) + '...');
    }
    if (cookie) {
      existing.cookie = cookie;
      console.log('已保存 Cookie:', cookie.substring(0, 20) + '...');
    }
    existing.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(API_KEY_FILE, JSON.stringify(existing, null, 2));
    res.json({ success: true });
  } catch (e) {
    console.error('保存认证信息失败:', e);
    res.status(500).json({ error: e.message });
  }
});

// Cookie 单独管理接口
app.get('/api/settings/cookie', (req, res) => {
  try {
    if (fs.existsSync(API_KEY_FILE)) {
      const data = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf-8'));
      res.json({ 
        configured: !!data.cookie,
        cookiePreview: data.cookie ? data.cookie.substring(0, 20) + '...' : ''
      });
    } else {
      res.json({ configured: false });
    }
  } catch (e) {
    res.json({ configured: false });
  }
});

app.post('/api/settings/cookie', (req, res) => {
  try {
    const { cookie } = req.body;
    if (!cookie) {
      return res.status(400).json({ error: '缺少 Cookie' });
    }
    
    // 读取现有数据
    let existing = {};
    if (fs.existsSync(API_KEY_FILE)) {
      try {
        existing = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf-8'));
      } catch (e) {}
    }
    
    existing.cookie = cookie;
    existing.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(API_KEY_FILE, JSON.stringify(existing, null, 2));
    console.log('已保存 Cookie:', cookie.substring(0, 20) + '...');
    res.json({ success: true });
  } catch (e) {
    console.error('保存 Cookie 失败:', e);
    res.status(500).json({ error: e.message });
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

// 启动服务
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🔗 Figma-易协作 同步服务已启动                           ║
║                                                           ║
║   本地地址: http://localhost:${PORT}                        ║
║   健康检查: http://localhost:${PORT}/health                 ║
║                                                           ║
║   易协作: ${config.redmine.host}                           
║   项目:   ${config.redmine.project}                        
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});