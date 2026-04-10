// Figma Plugin - 易协作同步工具
figma.showUI(__html__, { width: 400, height: 720 });

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

// 给节点添加超链接（异步版本）
async function setNodeHyperlink(nodeId, url) {
  try {
    var node = await figma.getNodeByIdAsync(nodeId);
    
    if (!node) {
      return { success: false, error: '找不到指定节点' };
    }

    if ('hyperlink' in node) {
      node.hyperlink = { type: 'URL', value: url };
      return { success: true, message: '超链接已添加', nodeName: node.name };
    } else {
      return { success: false, error: '该节点类型不支持超链接' };
    }
  } catch (e) {
    console.log('setNodeHyperlink error:', e);
    return { success: false, error: e.message || '设置超链接失败' };
  }
}

// 根据 nodeId 获取节点所在的页面名称（异步版本）
async function getPageInfoByNodeId(nodeId) {
  // nodeId 格式通常是 "pageId:nodeId" 或直接 "nodeId"
  // 先尝试解析，看是否能找到对应页面
  var pageName = figma.currentPage.name; // 默认使用当前页面名
  var nodeName = '';
  
  try {
    // 尝试直接获取节点（使用异步方法）
    var node = await figma.getNodeByIdAsync(nodeId);
    if (node) {
      nodeName = node.name;
      // 向上查找直到找到 PageNode
      var current = node;
      while (current && current.type !== 'PAGE') {
        current = current.parent;
      }
      if (current && current.type === 'PAGE') {
        pageName = current.name;
      }
    } else {
      // 如果找不到节点，可能是其他页面的节点
      // 遍历所有页面查找
      var pages = figma.root.children;
      for (var i = 0; i < pages.length; i++) {
        var page = pages[i];
        // nodeId 可能包含页面前缀
        if (nodeId.indexOf(page.id) === 0 || nodeId.indexOf(page.id.replace(':', '-')) === 0) {
          pageName = page.name;
          break;
        }
      }
    }
  } catch(e) {
    console.log('获取页面信息失败:', e);
  }
  
  return {
    pageName: pageName,
    nodeName: nodeName
  };
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
    setNodeHyperlink(msg.nodeId, msg.url).then(function(result) {
      figma.ui.postMessage({ type: 'hyperlink-result', data: result });
      
      if (result.success) {
        var nodeName = result.nodeName || '节点';
        figma.notify('已为 "' + nodeName + '" 添加易协作链接');
      }
    }).catch(function(e) {
      console.log('set-hyperlink error:', e);
      figma.ui.postMessage({ type: 'hyperlink-result', data: { success: false, error: e.message || '设置超链接失败' } });
    });
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
  
  else if (msg.type === 'get-page-info') {
    // 根据 nodeId 获取节点所在的页面名称（异步）
    getPageInfoByNodeId(msg.nodeId).then(function(pageInfo) {
      figma.ui.postMessage({ 
        type: 'page-info-result', 
        data: {
          linkIndex: msg.linkIndex,
          pageName: pageInfo.pageName,
          nodeName: pageInfo.nodeName
        }
      });
    }).catch(function(e) {
      console.log('get-page-info error:', e);
      figma.ui.postMessage({ 
        type: 'page-info-result', 
        data: {
          linkIndex: msg.linkIndex,
          pageName: figma.currentPage.name,
          nodeName: ''
        }
      });
    });
  }
  
  else if (msg.type === 'resize') {
    // 动态调整插件窗口大小
    var newHeight = Math.min(Math.max(msg.height, 430), 900); // 限制在 430-900 之间
    figma.ui.resize(400, newHeight);
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