// Figma Plugin - 易协作同步工具
figma.showUI(__html__, { width: 400, height: 620 });

// 获取文件信息
var fileKey = null;
var fileName = figma.root.name || '未命名文件';

// 尝试多种方式获取 fileKey
try {
  if (typeof figma.fileKey !== 'undefined' && figma.fileKey !== null) {
    fileKey = figma.fileKey;
  }
} catch(e) {
  console.log('获取 fileKey 失败:', e);
}

console.log('File Key:', fileKey);
console.log('File Name:', fileName);

// 构建文件 URL
function buildFileUrl(nodeId) {
  if (fileKey) {
    var url = 'https://www.figma.com/design/' + fileKey + '/' + encodeURIComponent(fileName);
    if (nodeId) {
      url += '?node-id=' + encodeURIComponent(nodeId);
    }
    return url;
  }
  return null;
}

// 获取当前选中的节点信息
function getSelectedNodeInfo() {
  var selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    return { 
      hasSelection: false, 
      message: '请先选中一个节点',
      fileKey: fileKey,
      fileName: fileName
    };
  }

  var node = selection[0];
  var nodeId = node.id;
  var figmaUrl = buildFileUrl(nodeId);
  
  return {
    hasSelection: true,
    id: nodeId,
    name: node.name,
    type: node.type,
    figmaUrl: figmaUrl,
    fileKey: fileKey,
    fileName: fileName
  };
}

// 获取当前文件的 Figma 链接
function getCurrentFileUrl() {
  return buildFileUrl(null);
}

// 给节点添加超链接
function setNodeHyperlink(nodeId, url) {
  var node = figma.getNodeById(nodeId);
  
  if (!node) {
    return { success: false, error: '找不到指定节点' };
  }

  if ('hyperlink' in node) {
    node.hyperlink = { type: 'URL', value: url };
    return { success: true, message: '超链接已添加' };
  } else {
    return { success: false, error: '该节点类型不支持超链接' };
  }
}

// 监听来自 UI 的消息
figma.ui.onmessage = function(msg) {
  var selectionInfo, fileUrl, result, nodeName;
  
  if (msg.type === 'get-selection') {
    selectionInfo = getSelectedNodeInfo();
    figma.ui.postMessage({ type: 'selection-result', data: selectionInfo });
  }
  
  else if (msg.type === 'get-file-url') {
    fileUrl = getCurrentFileUrl();
    figma.ui.postMessage({ type: 'file-url-result', data: { url: fileUrl, fileKey: fileKey, fileName: fileName } });
  }
  
  else if (msg.type === 'set-hyperlink') {
    result = setNodeHyperlink(msg.nodeId, msg.url);
    figma.ui.postMessage({ type: 'hyperlink-result', data: result });
    
    if (result.success) {
      var targetNode = figma.getNodeById(msg.nodeId);
      nodeName = targetNode ? targetNode.name : '节点';
      figma.notify('已为 "' + nodeName + '" 添加易协作链接');
    }
  }
  
  else if (msg.type === 'open-url') {
    // 在浏览器中打开链接
    figma.notify('请在浏览器中打开: ' + msg.url, { timeout: 5000 });
    // Figma 插件无法直接打开外部链接，通过 notify 提示用户
    // 用户可以复制链接后手动打开
  }
  
  else if (msg.type === 'start-server') {
    // Figma 插件沙箱环境无法直接启动本地进程
    // 提示用户手动启动
    figma.notify('⚠️ 请手动运行 start.bat 启动后端服务', { timeout: 5000 });
    figma.notify('路径: figma-redmine-sync/start.bat', { timeout: 8000 });
  }
  
  else if (msg.type === 'save-storage') {
    // 保存数据到 Figma clientStorage
    if (msg.data) {
      figma.clientStorage.setAsync('figma-redmine-sync', msg.data).then(function() {
        console.log('已保存到 clientStorage');
      }).catch(function(e) {
        console.log('clientStorage 保存失败:', e);
      });
    }
  }
  
  else if (msg.type === 'load-storage') {
    // 从 Figma clientStorage 加载数据
    figma.clientStorage.getAsync('figma-redmine-sync').then(function(data) {
      if (data) {
        figma.ui.postMessage({ type: 'storage-loaded', data: data });
      }
    }).catch(function(e) {
      console.log('clientStorage 加载失败:', e);
    });
  }
  
  else if (msg.type === 'notify') {
    figma.notify(msg.message, { timeout: msg.timeout || 3000 });
  }
  
  else if (msg.type === 'close') {
    figma.closePlugin();
  }
};

// 监听选择变化
figma.on('selectionchange', function() {
  var selectionInfo = getSelectedNodeInfo();
  figma.ui.postMessage({ type: 'selection-changed', data: selectionInfo });
});

// 插件启动时发送初始状态
var initialSelection = getSelectedNodeInfo();
var initialFileUrl = getCurrentFileUrl();

figma.ui.postMessage({ 
  type: 'init', 
  data: { 
    selection: initialSelection,
    fileUrl: initialFileUrl,
    fileName: fileName,
    fileKey: fileKey
  } 
});