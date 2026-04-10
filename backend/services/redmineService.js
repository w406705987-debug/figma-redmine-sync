/**
 * 易协作 API 服务封装
 * 支持账号密码登录认证方式
 * 
 * 认证流程：
 * 1. 用户输入易协作账号（邮箱前缀）和密码
 * 2. 后端使用 HTTP Basic Auth 调用 RPC API
 * 3. 获取工单数据并缓存
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config');

const ISSUES_CACHE_FILE = path.join(__dirname, '../data/issues-cache.json');
const SYNC_QUEUE_FILE = path.join(__dirname, '../data/sync-queue.json');
const API_KEY_FILE = path.join(__dirname, '../data/api-key.json');
const CREDENTIALS_FILE = path.join(__dirname, '../data/credentials.json');

class RedmineService {
  constructor() {
    this.host = config.redmine.host;
    this.project = config.redmine.project;
    this.projectId = this.loadProjectId(); // 从配置文件加载，默认 7
  }

  /**
   * 从配置文件加载项目 ID
   */
  loadProjectId() {
    try {
      if (fs.existsSync(API_KEY_FILE)) {
        const data = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf-8'));
        if (data.projectId) {
          console.log(`已加载项目 ID: ${data.projectId}`);
          return data.projectId;
        }
      }
    } catch (e) {
      console.error('加载项目 ID 失败:', e.message);
    }
    return 7; // 默认值
  }

  /**
   * 设置项目 ID
   */
  setProjectId(projectId) {
    this.projectId = projectId;
    console.log(`项目 ID 已更新为: ${projectId}`);
  }

  /**
   * 获取当前项目 ID
   */
  getProjectId() {
    return this.projectId;
  }

  // ========== 认证管理 ==========

  /**
   * 获取保存的账号密码
   */
  getCredentials() {
    try {
      if (fs.existsSync(CREDENTIALS_FILE)) {
        const data = JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
        if (data.username && data.password) {
          return data;
        }
      }
    } catch (e) {
      console.error('读取凭据失败:', e.message);
    }
    return null;
  }

  /**
   * 保存账号密码
   */
  saveCredentials(username, password) {
    try {
      const data = {
        username,
        password,
        savedAt: new Date().toISOString()
      };
      fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (e) {
      console.error('保存凭据失败:', e.message);
      return { success: false, error: e.message };
    }
  }

  /**
   * 检查是否已配置凭据
   */
  hasCredentials() {
    return !!this.getCredentials();
  }

  /**
   * 清除凭据（用于退出登录）
   */
  clearCredentials() {
    try {
      // 清除凭据文件
      const CREDENTIALS_FILE = path.join(__dirname, '../data/credentials.json');
      if (fs.existsSync(CREDENTIALS_FILE)) {
        fs.unlinkSync(CREDENTIALS_FILE);
      }
      // 清除本地缓存
      this.issueCache = [];
      console.log('已清除凭据和缓存');
    } catch (e) {
      console.error('清除凭据失败:', e);
    }
  }

  /**
   * 获取保存的 API Key（向后兼容）
   */
  getApiKey() {
    try {
      if (fs.existsSync(API_KEY_FILE)) {
        const data = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf-8'));
        return data.apiKey || null;
      }
    } catch (e) {}
    return null;
  }

  /**
   * 检查是否已配置 API Key（向后兼容）
   */
  hasApiKey() {
    return this.hasCredentials() || !!this.getApiKey();
  }

  /**
   * 获取保存的 Cookie（向后兼容）
   */
  getCookie() {
    try {
      if (fs.existsSync(API_KEY_FILE)) {
        const data = JSON.parse(fs.readFileSync(API_KEY_FILE, 'utf-8'));
        return data.cookie || null;
      }
    } catch (e) {}
    return null;
  }

  // ========== 工单缓存管理 ==========

  /**
   * 从缓存文件读取工单列表
   */
  getIssuesFromCache() {
    try {
      if (fs.existsSync(ISSUES_CACHE_FILE)) {
        const data = JSON.parse(fs.readFileSync(ISSUES_CACHE_FILE, 'utf-8'));
        return data;
      }
    } catch (error) {
      console.error('读取缓存失败:', error.message);
    }
    return { issues: [], lastUpdated: null };
  }

  /**
   * 获取工单列表（从缓存）
   */
  async getMyIssues() {
    const cache = this.getIssuesFromCache();
    return {
      issues: cache.issues,
      total_count: cache.issues.length,
      lastUpdated: cache.lastUpdated,
      source: 'cache'
    };
  }

  /**
   * 通过工单号获取工单（先查缓存，没有则创建临时工单）
   */
  async getIssue(issueId) {
    const cache = this.getIssuesFromCache();
    const issue = cache.issues.find(i => i.id === parseInt(issueId));
    
    if (issue) {
      return { issue };
    }
    
    // 如果缓存中没有，返回一个基础信息
    return {
      issue: {
        id: parseInt(issueId),
        subject: `工单 #${issueId}`,
        status: '未知',
        fromManualInput: true
      }
    };
  }

  /**
   * 添加工单到缓存（手动添加）
   */
  addIssueToCache(issue) {
    try {
      const cache = this.getIssuesFromCache();
      
      const existingIndex = cache.issues.findIndex(i => i.id === issue.id);
      if (existingIndex >= 0) {
        cache.issues[existingIndex] = { ...cache.issues[existingIndex], ...issue };
      } else {
        cache.issues.unshift(issue);
      }
      
      cache.lastUpdated = new Date().toISOString();
      fs.writeFileSync(ISSUES_CACHE_FILE, JSON.stringify(cache, null, 2));
      
      return { success: true, issue };
    } catch (error) {
      console.error('添加工单到缓存失败:', error.message);
      throw error;
    }
  }

  /**
   * 从缓存中删除工单
   */
  deleteIssueFromCache(issueId) {
    try {
      const cache = this.getIssuesFromCache();
      
      const initialLength = cache.issues.length;
      cache.issues = cache.issues.filter(i => i.id !== issueId);
      
      if (cache.issues.length === initialLength) {
        return { success: false, error: '工单不存在' };
      }
      
      cache.lastUpdated = new Date().toISOString();
      fs.writeFileSync(ISSUES_CACHE_FILE, JSON.stringify(cache, null, 2));
      
      return { success: true, deletedId: issueId };
    } catch (error) {
      console.error('删除工单失败:', error.message);
      throw error;
    }
  }

  /**
   * 构建工单URL
   */
  getIssueUrl(issueId) {
    return `https://${this.host}/issues/${issueId}`;
  }

  /**
   * 更新缓存中的全部工单
   */
  updateCache(issues) {
    try {
      const cache = {
        lastUpdated: new Date().toISOString(),
        project: this.project,
        host: this.host,
        issues: issues
      };
      fs.writeFileSync(ISSUES_CACHE_FILE, JSON.stringify(cache, null, 2));
      return { success: true, count: issues.length };
    } catch (error) {
      console.error('更新缓存失败:', error.message);
      throw error;
    }
  }

  // ========== 工单同步 ==========

  /**
   * 从易协作同步工单（主入口）
   * 
   * 优先级：
   * 1. 账号密码认证（推荐）
   * 2. Cookie 认证（向后兼容）
   */
  async syncFromRedmine() {
    // 首先尝试账号密码认证
    const credentials = this.getCredentials();
    if (credentials) {
      return this.syncWithCredentials(credentials.username, credentials.password);
    }

    // 尝试 Cookie 认证（向后兼容）
    const cookie = this.getCookie();
    if (cookie) {
      return this.syncWithCookie(cookie);
    }

    // 没有任何认证信息
    return {
      success: false,
      needCredentials: true,
      message: '请先配置易协作账号密码',
      hint: '在插件设置中输入你的易协作账号（邮箱前缀）和密码'
    };
  }

  /**
   * 使用账号密码同步工单（RPC API）
   * 
   * 调用网易易协作 RPC API: /api/rpc
   * action_type: get_issues_v6
   */
  async syncWithCredentials(username, password) {
    try {
      console.log('========================================');
      console.log('开始使用账号密码从易协作同步工单...');
      console.log(`用户: ${username}`);
      console.log(`Host: ${this.host}, Project ID: ${this.projectId}`);
      console.log('========================================');
      
      // 网易易协作 RPC API
      const rpcUrl = `https://${this.host}/api/rpc`;
      
      // 构建 RPC 请求体
      const requestBody = {
        action_type: 'get_issues_v6',
        project_id: this.projectId,
        set_filter: 1,
        filter_mode: 'simple',
        filters: {
          assigned_to_id: { operator: '=', values: ['me'] },
          status_id: { operator: 'o', values: [] }  // o = open (打开状态)
        },
        c: ['tracker', 'status', 'priority', 'subject', 'assigned_to', 'due_date', 'done_ratio'],
        per_page: 100,
        page: 1
      };

      console.log('请求 URL:', rpcUrl);
      console.log('请求体:', JSON.stringify(requestBody, null, 2));
      
      // 构建 Basic Auth
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      
      const response = await axios.post(rpcUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Basic ${auth}`,
          'X-Redmine-API-Format': 'json'
        },
        timeout: 30000
      });

      console.log('响应状态:', response.status);
      console.log('响应 res_code:', response.data.res_code);

      // 检查响应
      if (response.data.res_code !== 1) {
        console.error('API 返回错误:', response.data);
        if (response.data.res_code === -1) {
          return { 
            success: false, 
            needCredentials: true,
            error: '账号或密码错误',
            message: response.data.res_msg || '认证失败'
          };
        }
        return { success: false, error: response.data.res_msg || '未知错误' };
      }

      // 解析工单数据
      const issues = response.data.data?.list || response.data.data?.issues || [];
      console.log(`从易协作获取到 ${issues.length} 个工单`);

      // 转换格式并保存到缓存
      const formattedIssues = this.formatIssues(issues);
      this.updateCache(formattedIssues);

      console.log('========================================');
      console.log(`✓ 同步完成! 共 ${formattedIssues.length} 个工单`);
      console.log('========================================');

      return {
        success: true,
        count: formattedIssues.length,
        message: `成功同步 ${formattedIssues.length} 个工单`,
        issues: formattedIssues
      };
    } catch (error) {
      console.error('同步工单失败:', error.message);
      
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
        
        if (error.response.status === 401) {
          return { 
            success: false, 
            needCredentials: true,
            error: '账号或密码错误',
            message: '认证失败，请检查账号密码'
          };
        }
        return { 
          success: false, 
          error: `易协作返回错误: ${error.response.status}`,
          message: error.response.data?.res_msg || error.message
        };
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * 使用 Cookie 同步工单
   * 拉取所有项目中指派给当前用户的未关闭工单
   */
  async syncWithCookie(cookie) {
    try {
      console.log('开始使用 Cookie 从易协作同步工单...');
      console.log('查询范围: 所有项目 | 指派人: 当前用户 | 状态: 未关闭');
      
      const baseUrl = `https://${this.host}/api/v6/issues`;
      
      // 不限制项目，拉取所有指派给当前用户的未关闭工单
      const requestBody = {
        set_filter: 1,
        mode: 'preview',
        per_page: 100,
        filters: {
          assigned_to_id: { operator: '=', values: ['me'] },
          status_id: { operator: 'o', values: [] }  // o = open (打开/未关闭)
        }
      };

      const response = await axios.post(baseUrl, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cookie': `_my_redmine=${cookie}`
        },
        timeout: 30000
      });

      if (response.data.res_code !== 1) {
        if (response.data.res_code === -1) {
          return { 
            success: false, 
            needCookie: true,
            error: 'Cookie 已过期，请重新获取或使用账号密码登录'
          };
        }
        return { success: false, error: response.data.res_msg || '未知错误' };
      }

      const issues = response.data.data?.list || [];
      const formattedIssues = this.formatIssues(issues);
      this.updateCache(formattedIssues);

      return {
        success: true,
        count: formattedIssues.length,
        message: `成功同步 ${formattedIssues.length} 个工单`
      };
    } catch (error) {
      console.error('Cookie 同步失败:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * 格式化工单数据
   */
  formatIssues(issues) {
    return issues.map(issue => {
      // 处理 v6 格式的字段（可能是对象）
      const subject = typeof issue.subject === 'object' 
        ? issue.subject.value 
        : issue.subject;
      
      const assignedTo = typeof issue.assigned_to === 'object'
        ? issue.assigned_to.value
        : (issue.assigned_to || '');

      const status = typeof issue.status === 'object'
        ? issue.status.value
        : (issue.status || '未知');

      const priority = typeof issue.priority === 'object'
        ? issue.priority.value
        : (issue.priority || 'P2-普通');

      const tracker = typeof issue.tracker === 'object'
        ? issue.tracker.value
        : (issue.tracker || 'UI设计');

      return {
        id: issue.id,
        subject: subject || `工单 #${issue.id}`,
        status: status,
        priority: priority,
        project: this.project,
        tracker: tracker,
        assignedTo: assignedTo,
        startDate: issue.start_date || '',
        dueDate: issue.due_date || '',
        doneRatio: issue.done_ratio || 0,
        updatedOn: new Date().toISOString()
      };
    });
  }

  // ========== 工单同步到易协作 ==========

  /**
   * 更新工单备注（添加 Figma 链接）
   */
  async updateIssueNotes(issueId, figmaUrl) {
    try {
      const timestamp = new Date().toLocaleString('zh-CN');
      const notes = `【交互文档链接】\n${figmaUrl}\n\n同步时间: ${timestamp}`;
      
      // 读取现有队列
      let queue = [];
      if (fs.existsSync(SYNC_QUEUE_FILE)) {
        try {
          queue = JSON.parse(fs.readFileSync(SYNC_QUEUE_FILE, 'utf-8'));
        } catch (e) {
          queue = [];
        }
      }
      
      // 添加到队列
      const syncItem = {
        issueId: parseInt(issueId),
        figmaUrl,
        notes,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      queue.push(syncItem);
      fs.writeFileSync(SYNC_QUEUE_FILE, JSON.stringify(queue, null, 2));
      
      // 更新本地缓存
      const cache = this.getIssuesFromCache();
      const issueIndex = cache.issues.findIndex(i => i.id === parseInt(issueId));
      if (issueIndex >= 0) {
        cache.issues[issueIndex].figmaUrl = figmaUrl;
        cache.issues[issueIndex].syncedAt = new Date().toISOString();
        fs.writeFileSync(ISSUES_CACHE_FILE, JSON.stringify(cache, null, 2));
      }
      
      return {
        success: true,
        message: `Figma 链接已记录到工单 #${issueId}`,
        issueId: parseInt(issueId),
        figmaUrl,
        notes
      };
    } catch (error) {
      console.error('更新工单备注失败:', error);
      throw error;
    }
  }

  /**
   * 获取待同步队列
   */
  getSyncQueue() {
    if (fs.existsSync(SYNC_QUEUE_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(SYNC_QUEUE_FILE, 'utf-8'));
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  /**
   * 清空同步队列
   */
  clearSyncQueue() {
    fs.writeFileSync(SYNC_QUEUE_FILE, JSON.stringify([], null, 2));
    return { success: true };
  }
}

module.exports = new RedmineService();