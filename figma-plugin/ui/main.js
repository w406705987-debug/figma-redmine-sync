/**
 * Figma 插件 UI 交互逻辑
 */

// 配置
const API_BASE = 'http://localhost:3000';

// 状态
let state = {
  serverOnline: false,
  issues: [],
  selectedIssue: null,
  currentSelection: null,
  currentFileUrl: '',
  records: []
};

// DOM 元素
const elements = {
  serverStatus: document.getElementById('serverStatus'),
  issueCount: document.getElementById('issueCount'),
  manualIssueInput: document.getElementById('manualIssueInput'),
  addIssueBtn: document.getElementById('addIssueBtn'),
  searchInput: document.getElementById('searchInput'),
  issueList: document.getElementById('issueList'),
  selectionInfo: document.getElementById('selectionInfo'),
  linkToNodeBtn: document.getElementById('linkToNodeBtn'),
  copyFigmaUrlBtn: document.getElementById('copyFigmaUrlBtn'),
  sendToPopoBtn: document.getElementById('sendToPopoBtn'),
  recordList: document.getElementById('recordList'),
  exportReportBtn: document.getElementById('exportReportBtn'),
  toast: document.getElementById('toast')
};

// ==================== API 调用 ====================

async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    if (response.ok) {
      state.serverOnline = true;
      updateServerStatus(true);
      return true;
    }
  } catch (e) {
    state.serverOnline = false;
    updateServerStatus(false);
  }
  return false;
}

async function fetchIssues() {
  if (!state.serverOnline) {
    showToast('本地服务未启动', 'error');
    return;
  }

  elements.issueList.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/api/redmine/issues`);
    const data = await response.json();
    
    if (data.issues && data.issues.length > 0) {
      state.issues = data.issues;
      elements.issueCount.textContent = `(${data.issues.length}个)`;
      renderIssueList(data.issues);
    } else {
      elements.issueList.innerHTML = '<p class="empty-state">暂无工单，请输入工单号添加</p>';
      elements.issueCount.textContent = '';
    }
  } catch (e) {
    console.error('获取工单失败:', e);
    elements.issueList.innerHTML = '<p class="empty-state">获取失败，请检查服务</p>';
    showToast('获取工单失败', 'error');
  }
}

async function addIssueManually() {
  const input = elements.manualIssueInput.value.trim();
  if (!input) {
    showToast('请输入工单号', 'error');
    return;
  }

  // 提取数字（支持输入 #447596 或 447596）
  const match = input.match(/\d+/);
  if (!match) {
    showToast('请输入有效的工单号', 'error');
    return;
  }

  const issueId = parseInt(match[0]);

  try {
    const response = await fetch(`${API_BASE}/api/redmine/issues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: issueId })
    });

    if (response.ok) {
      showToast(`已添加工单 #${issueId}`, 'success');
      elements.manualIssueInput.value = '';
      fetchIssues();
    } else {
      throw new Error('添加失败');
    }
  } catch (e) {
    console.error('添加工单失败:', e);
    showToast('添加失败', 'error');
  }
}

async function syncToRedmine() {
  if (!state.selectedIssue || !state.currentSelection?.figmaUrl) {
    showToast('请先选择工单和 Figma 节点', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/redmine/issues/${state.selectedIssue.id}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ figmaUrl: state.currentSelection.figmaUrl })
    });

    if (response.ok) {
      showToast('已同步到易协作', 'success');
      // 添加本地记录
      addRecord({
        issueId: state.selectedIssue.id,
        issueTitle: state.selectedIssue.subject,
        figmaUrl: state.currentSelection.figmaUrl,
        action: 'sync'
      });
    } else {
      throw new Error('同步失败');
    }
  } catch (e) {
    console.error('同步失败:', e);
    showToast('同步失败', 'error');
  }
}

async function sendToPopo() {
  if (!state.selectedIssue || !state.currentSelection?.figmaUrl) {
    showToast('请先选择工单和 Figma 节点', 'error');
    return;
  }

  try {
    const issueUrl = `https://x20.pm.netease.com/issues/${state.selectedIssue.id}`;
    
    const response = await fetch(`${API_BASE}/api/popo/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issueId: state.selectedIssue.id,
        issueTitle: state.selectedIssue.subject,
        issueUrl: issueUrl,
        figmaUrl: state.currentSelection.figmaUrl
      })
    });

    if (response.ok) {
      showToast('已发送到 POPO 审核群', 'success');
      // 添加记录
      addRecord({
        issueId: state.selectedIssue.id,
        issueTitle: state.selectedIssue.subject,
        issueUrl: issueUrl,
        figmaUrl: state.currentSelection.figmaUrl,
        sentToPopo: true
      });
      // 刷新记录
      fetchRecords();
    } else {
      throw new Error('发送失败');
    }
  } catch (e) {
    console.error('发送失败:', e);
    showToast('发送失败', 'error');
  }
}

async function fetchRecords() {
  try {
    const response = await fetch(`${API_BASE}/api/records/today`);
    const data = await response.json();
    state.records = data.records || [];
    renderRecordList();
  } catch (e) {
    console.error('获取记录失败:', e);
  }
}

async function addRecord(record) {
  try {
    await fetch(`${API_BASE}/api/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    fetchRecords();
  } catch (e) {
    console.error('添加记录失败:', e);
  }
}

async function exportReport() {
  try {
    const response = await fetch(`${API_BASE}/api/records/report`);
    const data = await response.json();
    
    // 复制到剪贴板
    await navigator.clipboard.writeText(data.report);
    showToast('日报已复制到剪贴板', 'success');
  } catch (e) {
    console.error('导出日报失败:', e);
    showToast('导出失败', 'error');
  }
}

// ==================== UI 渲染 ====================

function updateServerStatus(online) {
  const dot = elements.serverStatus.querySelector('.status-dot');
  const text = elements.serverStatus.querySelector('span:last-child');
  
  if (online) {
    dot.className = 'status-dot online';
    text.textContent = '服务已连接';
  } else {
    dot.className = 'status-dot offline';
    text.textContent = '服务未启动';
  }
}

function renderIssueList(issues) {
  if (!issues || issues.length === 0) {
    elements.issueList.innerHTML = '<p class="empty-state">暂无工单</p>';
    return;
  }

  elements.issueList.innerHTML = issues.map(issue => `
    <div class="issue-item ${state.selectedIssue?.id === issue.id ? 'selected' : ''}" 
         data-id="${issue.id}">
      <input type="radio" name="issue" ${state.selectedIssue?.id === issue.id ? 'checked' : ''}>
      <span class="issue-id">#${issue.id}</span>
      <span class="issue-title" title="${issue.subject}">${issue.subject}</span>
    </div>
  `).join('');

  // 绑定点击事件
  elements.issueList.querySelectorAll('.issue-item').forEach(item => {
    item.addEventListener('click', () => {
      const issueId = parseInt(item.dataset.id);
      state.selectedIssue = issues.find(i => i.id === issueId);
      renderIssueList(issues);
      updateButtonStates();
    });
  });
}

function updateSelectionInfo(selection) {
  state.currentSelection = selection;
  
  if (!selection || !selection.hasSelection) {
    elements.selectionInfo.innerHTML = '<p class="empty-state">请在 Figma 中选中一个节点</p>';
  } else {
    elements.selectionInfo.innerHTML = `
      <div class="node-name">${selection.name}</div>
      <span class="node-type">${selection.type}</span>
      <div class="node-url">${selection.figmaUrl}</div>
    `;
  }
  
  updateButtonStates();
}

function renderRecordList() {
  if (!state.records || state.records.length === 0) {
    elements.recordList.innerHTML = '<p class="empty-state">暂无记录</p>';
    return;
  }

  elements.recordList.innerHTML = state.records.map(record => `
    <div class="record-item">
      <div class="record-time">${record.time}</div>
      <div class="record-issue">#${record.issueId} ${record.issueTitle}</div>
      ${record.sentToPopo ? '<span style="color:#22c55e">✅ 已发送审核</span>' : ''}
    </div>
  `).join('');
}

function updateButtonStates() {
  const hasIssue = !!state.selectedIssue;
  const hasSelection = state.currentSelection?.hasSelection;
  
  elements.linkToNodeBtn.disabled = !hasIssue || !hasSelection;
  elements.sendToPopoBtn.disabled = !hasIssue || !hasSelection;
}

function showToast(message, type = '') {
  elements.toast.textContent = message;
  elements.toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    elements.toast.className = 'toast';
  }, 3000);
}

// ==================== 事件绑定 ====================

// 添加工单按钮
elements.addIssueBtn.addEventListener('click', addIssueManually);

// 输入框回车添加
elements.manualIssueInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addIssueManually();
  }
});

// 搜索
let searchTimeout;
elements.searchInput.addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const keyword = e.target.value.trim().toLowerCase();
    if (keyword) {
      const filtered = state.issues.filter(issue => 
        issue.subject.toLowerCase().includes(keyword) ||
        issue.id.toString().includes(keyword)
      );
      renderIssueList(filtered);
    } else {
      renderIssueList(state.issues);
    }
  }, 300);
});

// 关联到选中节点
elements.linkToNodeBtn.addEventListener('click', () => {
  if (!state.selectedIssue || !state.currentSelection?.id) return;
  
  const issueUrl = `https://x20.pm.netease.com/issues/${state.selectedIssue.id}`;
  
  parent.postMessage({
    pluginMessage: {
      type: 'set-hyperlink',
      nodeId: state.currentSelection.id,
      url: issueUrl
    }
  }, '*');

  // 记录操作
  addRecord({
    issueId: state.selectedIssue.id,
    issueTitle: state.selectedIssue.subject,
    figmaUrl: state.currentSelection.figmaUrl,
    action: 'link_node'
  });
});

// 复制 Figma 链接
elements.copyFigmaUrlBtn.addEventListener('click', async () => {
  const url = state.currentSelection?.figmaUrl || state.currentFileUrl;
  if (url) {
    await navigator.clipboard.writeText(url);
    showToast('链接已复制', 'success');
  }
});

// 同步到易协作
elements.syncToRedmineBtn.addEventListener('click', syncToRedmine);

// 发送到 POPO
elements.sendToPopoBtn.addEventListener('click', sendToPopo);

// 导出日报
elements.exportReportBtn.addEventListener('click', exportReport);

// ==================== Figma 消息监听 ====================

window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  if (!msg) return;

  switch (msg.type) {
    case 'init':
      state.currentFileUrl = msg.data.fileUrl;
      updateSelectionInfo(msg.data.selection);
      break;

    case 'selection-changed':
    case 'selection-result':
      updateSelectionInfo(msg.data);
      break;

    case 'hyperlink-result':
      if (msg.data.success) {
        showToast('已添加易协作链接', 'success');
      } else {
        showToast(msg.data.error || '添加失败', 'error');
      }
      break;
  }
};

// ==================== 初始化 ====================

async function init() {
  // 检查服务状态
  const online = await checkServer();
  
  if (online) {
    // 获取工单列表
    fetchIssues();
    // 获取今日记录
    fetchRecords();
  }
}

init();