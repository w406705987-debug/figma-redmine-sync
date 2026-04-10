/**
 * POPO 机器人服务封装
 * 只使用关键词验证，不使用签名
 */

const axios = require('axios');
const config = require('../config');

class PopoService {
  constructor() {
    this.hookUrl = config.popo.hookUrl;
    this.reviewers = config.popo.reviewers;
  }

  /**
   * 构建@提醒的审核员字符串
   */
  buildMentionString() {
    return this.reviewers.map(r => '@' + r.name).join(' ');
  }

  /**
   * 格式化消息内容（包含安全关键词"审核"）
   */
  formatMessage(data) {
    const { issueId, issueTitle, issueUrl, figmaUrl } = data;
    const mentions = this.buildMentionString();
    
    // 确保消息包含"审核"关键词
    return mentions + '\n【交互文档提审】\n\n【易协作单号】\n#' + issueId + ' ' + issueTitle + '\n' + issueUrl + '\n\n【交互文档链接】\n' + figmaUrl + '\n\n请审核';
  }

  /**
   * 发送消息到 POPO 群
   */
  async sendMessage(data) {
    try {
      const message = this.formatMessage(data);

      console.log('===== POPO 发送 =====');
      console.log('URL:', this.hookUrl);
      console.log('Message:', message);

      const response = await axios.post(
        this.hookUrl,
        { message: message },
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log('POPO 响应:', JSON.stringify(response.data));
      
      if (response.data.errcode === 0) {
        return {
          success: true,
          message: '消息已发送到审核群',
          response: response.data
        };
      } else {
        return {
          success: false,
          error: response.data.errmsg || '发送失败',
          response: response.data
        };
      }
    } catch (error) {
      console.error('POPO 消息发送异常:', error.message);
      if (error.response) {
        console.error('Response:', error.response.data);
        return {
          success: false,
          error: error.response.data.errmsg || error.message,
          response: error.response.data
        };
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * 发送自定义消息（需包含"审核"关键词）
   */
  async sendCustomMessage(content) {
    try {
      // 确保包含审核关键词
      const messageWithKeyword = content.includes('审核') ? content : content + '\n请审核';

      const response = await axios.post(
        this.hookUrl,
        { message: messageWithKeyword },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.errcode === 0) {
        return { success: true, response: response.data };
      } else {
        return { success: false, error: response.data.errmsg || '发送失败' };
      }
    } catch (error) {
      console.error('POPO 自定义消息发送失败:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PopoService();