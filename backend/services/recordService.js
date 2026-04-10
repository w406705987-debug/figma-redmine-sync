/**
 * 同步记录服务
 * 负责存储和管理同步记录，用于日报生成
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/sync-records.json');

class RecordService {
  constructor() {
    this.ensureDataFile();
  }

  /**
   * 确保数据文件存在
   */
  ensureDataFile() {
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({ records: [] }, null, 2));
    }
  }

  /**
   * 读取所有记录
   */
  getAllRecords() {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data).records;
    } catch (error) {
      console.error('读取记录失败:', error.message);
      return [];
    }
  }

  /**
   * 添加同步记录
   * @param {Object} record - 记录数据
   */
  addRecord(record) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      const newRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('zh-CN'),
        time: new Date().toLocaleTimeString('zh-CN'),
        ...record
      };
      data.records.unshift(newRecord); // 最新的在前面
      
      // 限制最多保留50条记录
      if (data.records.length > 50) {
        data.records = data.records.slice(0, 50);
      }
      
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      return newRecord;
    } catch (error) {
      console.error('添加记录失败:', error.message);
      throw error;
    }
  }

  /**
   * 获取今日记录
   */
  getTodayRecords() {
    const today = new Date().toLocaleDateString('zh-CN');
    return this.getAllRecords().filter(r => r.date === today);
  }

  /**
   * 获取指定日期的记录
   * @param {string} date - 日期字符串 (如 "2024/1/15")
   */
  getRecordsByDate(date) {
    return this.getAllRecords().filter(r => r.date === date);
  }

  /**
   * 生成日报格式
   * @param {string} date - 可选，指定日期
   */
  generateDailyReport(date) {
    const records = date ? this.getRecordsByDate(date) : this.getTodayRecords();
    
    if (records.length === 0) {
      return '今日暂无同步记录';
    }

    let report = `📝 工作日报 (${date || new Date().toLocaleDateString('zh-CN')})\n\n`;
    report += '设计稿同步记录：\n';
    report += '─'.repeat(30) + '\n';

    records.forEach((record, index) => {
      report += `${index + 1}. #${record.issueId} ${record.issueTitle}\n`;
      report += `   🔗 Figma: ${record.figmaUrl}\n`;
      report += `   ⏰ 时间: ${record.time}\n`;
      if (record.sentToPopo) {
        report += `   ✅ 已发送审核\n`;
      }
      report += '\n';
    });

    return report;
  }

  /**
   * 清空所有记录
   */
  clearAllRecords() {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ records: [] }, null, 2));
    return { success: true, message: '记录已清空' };
  }

  /**
   * 删除指定记录
   * @param {number} recordId - 记录ID
   */
  deleteRecord(recordId) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      data.records = data.records.filter(r => r.id !== recordId);
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (error) {
      console.error('删除记录失败:', error.message);
      throw error;
    }
  }
}

module.exports = new RecordService();
