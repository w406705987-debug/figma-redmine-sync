/**
 * Figma API 服务
 * 用于获取 Figma 文件截图
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '..', 'data', 'api-key.json');

class FigmaService {
  constructor() {
    this.baseUrl = 'https://api.figma.com/v1';
  }

  /**
   * 获取 Figma Token
   */
  getToken() {
    try {
      if (fs.existsSync(TOKEN_FILE)) {
        const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
        return data.figmaToken || null;
      }
    } catch (e) {
      console.error('读取 Figma Token 失败:', e.message);
    }
    return null;
  }

  /**
   * 保存 Figma Token
   */
  saveToken(token) {
    try {
      let data = {};
      if (fs.existsSync(TOKEN_FILE)) {
        data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
      }
      data.figmaToken = token;
      data.figmaTokenUpdatedAt = new Date().toISOString();
      fs.writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (e) {
      console.error('保存 Figma Token 失败:', e.message);
      return { success: false, error: e.message };
    }
  }

  /**
   * 从 Figma URL 中解析文件 ID 和节点 ID
   * 支持格式：
   * - https://www.figma.com/file/ABC123/FileName?node-id=123-456
   * - https://www.figma.com/design/ABC123/FileName?node-id=123-456
   */
  parseUrl(url) {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // 查找 file 或 design 后面的文件 ID
      let fileKey = null;
      for (let i = 0; i < pathParts.length; i++) {
        if (pathParts[i] === 'file' || pathParts[i] === 'design') {
          fileKey = pathParts[i + 1];
          break;
        }
      }

      // 获取节点 ID
      let nodeId = urlObj.searchParams.get('node-id');
      
      // 节点 ID 格式转换：123-456 -> 123:456
      if (nodeId) {
        nodeId = nodeId.replace(/-/g, ':');
      }

      return { fileKey, nodeId };
    } catch (e) {
      console.error('解析 Figma URL 失败:', e.message);
      return { fileKey: null, nodeId: null };
    }
  }

  /**
   * 获取文件/节点的截图 URL
   * @param {string} fileKey - Figma 文件 ID
   * @param {string} nodeId - 节点 ID（可选，不传则获取第一页）
   * @param {object} options - 选项 { format: 'png'|'jpg'|'svg', scale: 1-4 }
   */
  async getImageUrl(fileKey, nodeId = null, options = {}) {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: '请先配置 Figma Token', needToken: true };
    }

    const format = options.format || 'png';
    const scale = options.scale || 1;

    try {
      let url = `${this.baseUrl}/images/${fileKey}`;
      let params = { format, scale };
      
      if (nodeId) {
        params.ids = nodeId;
      }

      console.log(`获取 Figma 截图: fileKey=${fileKey}, nodeId=${nodeId}`);

      const response = await axios.get(url, {
        params,
        headers: {
          'X-Figma-Token': token
        },
        timeout: 30000
      });

      if (response.data.err) {
        return { success: false, error: response.data.err };
      }

      // 获取图片 URL
      const images = response.data.images;
      const imageUrl = nodeId ? images[nodeId] : Object.values(images)[0];

      if (!imageUrl) {
        return { success: false, error: '无法获取图片，请检查链接是否正确' };
      }

      return { success: true, imageUrl };
    } catch (e) {
      console.error('获取 Figma 截图失败:', e.message);
      
      if (e.response?.status === 403) {
        return { success: false, error: 'Token 无效或已过期，请重新配置', needToken: true };
      }
      if (e.response?.status === 404) {
        return { success: false, error: '文件不存在或无权访问' };
      }
      
      return { success: false, error: e.message };
    }
  }

  /**
   * 获取文件信息（用于获取第一页的节点ID）
   */
  async getFileInfo(fileKey) {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: '请先配置 Figma Token', needToken: true };
    }

    try {
      const response = await axios.get(`${this.baseUrl}/files/${fileKey}?depth=1`, {
        headers: {
          'X-Figma-Token': token
        },
        timeout: 30000
      });

      const document = response.data.document;
      const firstPage = document.children?.[0];

      return {
        success: true,
        fileName: response.data.name,
        firstPageId: firstPage?.id,
        firstPageName: firstPage?.name
      };
    } catch (e) {
      console.error('获取 Figma 文件信息失败:', e.message);
      return { success: false, error: e.message };
    }
  }

  /**
   * 下载图片并返回 Base64
   */
  async downloadImageAsBase64(imageUrl) {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 60000
      });

      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      const mimeType = response.headers['content-type'] || 'image/png';
      
      return {
        success: true,
        base64: `data:${mimeType};base64,${base64}`,
        mimeType
      };
    } catch (e) {
      console.error('下载图片失败:', e.message);
      return { success: false, error: e.message };
    }
  }
}

module.exports = new FigmaService();
