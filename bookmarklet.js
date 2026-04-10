// ========================================
// Figma-易协作同步 - 书签脚本
// ========================================
// 使用方法：
// 1. 复制下面的代码
// 2. 在浏览器创建新书签，把代码粘贴到"网址"栏
// 3. 在易协作工单列表页面点击这个书签
// 4. 工单数据会自动复制到剪贴板
// ========================================

javascript:(function(){
  try {
    // 获取页面上的工单数据
    var issues = [];
    
    // 方法1: 从页面表格中提取
    var rows = document.querySelectorAll('tr.issue, tr[data-issue-id], .issue-row, .list-item');
    
    if (rows.length > 0) {
      rows.forEach(function(row) {
        var id = row.getAttribute('data-issue-id') || row.getAttribute('data-id');
        if (!id) {
          var idEl = row.querySelector('.id a, .issue-id, [data-field="id"]');
          if (idEl) id = idEl.textContent.replace('#', '').trim();
        }
        
        var subject = '';
        var subjectEl = row.querySelector('.subject a, .issue-subject, [data-field="subject"]');
        if (subjectEl) subject = subjectEl.textContent.trim();
        
        var status = '';
        var statusEl = row.querySelector('.status, [data-field="status"]');
        if (statusEl) status = statusEl.textContent.trim();
        
        var assignedTo = '';
        var assignedEl = row.querySelector('.assigned_to, [data-field="assigned_to"]');
        if (assignedEl) assignedTo = assignedEl.textContent.trim();
        
        if (id) {
          issues.push({
            id: parseInt(id),
            subject: subject || '工单 #' + id,
            status: status || '未知',
            assignedTo: assignedTo
          });
        }
      });
    }
    
    // 方法2: 尝试从 Vue/React 状态中获取
    if (issues.length === 0 && window.__NUXT__) {
      var nuxtData = window.__NUXT__;
      // 尝试解析 Nuxt 数据
    }
    
    // 方法3: 从页面的 script 标签中查找数据
    if (issues.length === 0) {
      var scripts = document.querySelectorAll('script');
      scripts.forEach(function(script) {
        var text = script.textContent;
        if (text.includes('issues') && text.includes('subject')) {
          try {
            var match = text.match(/issues['":\s]*(\[[\s\S]*?\])/);
            if (match) {
              var parsed = JSON.parse(match[1]);
              issues = parsed;
            }
          } catch(e) {}
        }
      });
    }
    
    if (issues.length === 0) {
      alert('未能识别页面上的工单数据。\n\n请确保你在易协作的工单列表页面。\n\n如果问题持续，请联系开发者。');
      return;
    }
    
    // 格式化数据
    var data = {
      source: 'redmine-bookmarklet',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      issues: issues
    };
    
    // 复制到剪贴板
    var json = JSON.stringify(data, null, 2);
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(json).then(function() {
        alert('✅ 已复制 ' + issues.length + ' 个工单数据！\n\n请到 Figma 插件中点击"导入工单"按钮。');
      });
    } else {
      var textarea = document.createElement('textarea');
      textarea.value = json;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('✅ 已复制 ' + issues.length + ' 个工单数据！\n\n请到 Figma 插件中点击"导入工单"按钮。');
    }
    
  } catch(e) {
    alert('❌ 提取失败: ' + e.message);
  }
})();
