/**
 * Cloudflare Worker - 易协作 API 代理
 * 
 * 部署步骤：
 * 1. 登录 Cloudflare Dashboard: https://dash.cloudflare.com
 * 2. 左侧菜单点击 "Workers & Pages"
 * 3. 点击 "Create Application" -> "Create Worker"
 * 4. 给 Worker 起个名字，如 "redmine-proxy"
 * 5. 点击 "Deploy"
 * 6. 点击 "Edit Code"
 * 7. 把这个文件的内容全部复制进去，替换默认代码
 * 8. 点击 "Save and Deploy"
 * 9. 你会得到一个 URL，如: https://redmine-proxy.你的用户名.workers.dev
 */

export default {
  async fetch(request, env) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Redmine-Cookie',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    
    // 健康检查
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        message: '易协作代理服务运行中',
        usage: '请使用 /api/issues 端点'
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // API 端点：获取工单
    if (url.pathname === '/api/issues') {
      try {
        // 从请求头获取 Cookie
        const cookie = request.headers.get('X-Redmine-Cookie');
        if (!cookie) {
          return new Response(JSON.stringify({ 
            error: '缺少 Cookie',
            hint: '请在请求头中提供 X-Redmine-Cookie'
          }), {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        // 从 URL 参数获取配置
        const host = url.searchParams.get('host') || 'x20.pm.netease.com';
        const projectId = url.searchParams.get('project_id') || '7';

        // 构建请求到易协作
        const redmineUrl = `https://${host}/api/v6/issues`;
        const requestBody = {
          project_id: parseInt(projectId),
          set_filter: 1,
          mode: 'preview',
          filters: {
            assigned_to_id: { operator: '=', values: ['me'] },
            status_id: { operator: 'o', values: [] }
          }
        };

        const response = await fetch(redmineUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Cookie': `_my_redmine=${cookie}`
          },
          body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // 处理响应
        if (data.res_code === 1) {
          // 格式化工单数据
          const issues = (data.data?.list || []).map(issue => ({
            id: issue.id,
            subject: typeof issue.subject === 'object' ? issue.subject.value : issue.subject,
            status: issue.status || '未知',
            priority: issue.priority || 'P2-普通',
            tracker: issue.tracker || 'UI设计',
            assignedTo: typeof issue.assigned_to === 'object' ? issue.assigned_to.value : '',
            startDate: issue.start_date || '',
            dueDate: issue.due_date || ''
          }));

          return new Response(JSON.stringify({
            success: true,
            count: issues.length,
            issues: issues
          }), {
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        } else {
          return new Response(JSON.stringify({
            success: false,
            error: data.res_msg || '请求失败',
            hint: data.res_code === -1 ? 'Cookie 已过期，请重新获取' : ''
          }), {
            status: 401,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 404
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
