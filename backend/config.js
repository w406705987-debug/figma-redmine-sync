/**
 * 配置文件 - 存储易协作和POPO的配置信息
 * 请根据实际情况修改以下配置
 */

module.exports = {
  // 易协作配置
  redmine: {
    // 实际的易协作实例地址
    host: 'x20.pm.netease.com',
    // 你的项目代码
    project: 'X20-MARVEL',
    
    // MCP API Key（用于 MCP 服务认证，如果后续需要）
    mcpApiKey: 'gk_018d2461c68e4fa5a3026d750d6d15fe',
    
    // Cookie 认证（备用方案）
    cookie: process.env.REDMINE_COOKIE || ''
  },

  // POPO 机器人配置
  popo: {
    hookUrl: 'https://open.popo.netease.com/open-apis/robots/v1/hook/gJ3Y1q7YAXDSPF1SQsTaFBSnOg8VYG4oPGk6yldZjHfAtJQA66NEWLIxhOSRJZEExJuWYh4WizxNARfedvJDZCmxTRISXhTM',
    secret: '5ZESKs0jDqKlWTMyUP9DoVPOIYEHtMEcHUQyxALcjzIGKIVNG5KNAuyNBHKM2jTT',
    // 审核员列表
    reviewers: [
      { name: '囧雪', email: 'wangzhongxue@corp.netease.com' }
    ]
  },

  // 本地服务配置
  server: {
    port: 3000
  },

  // 你的工单数据（从 MCP 获取后缓存在这里）
  // 这个会在运行时更新
  cachedIssues: []
};