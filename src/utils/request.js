
const config = require('../../config')

// api 请求地址
var baseURL = config.api_path;

/** 后端 API 根地址（与 config.api_path 一致，用于拼接后端托管资源） */
export const BASE_API_URL = (baseURL || '').replace(/\/$/, '');

/**
 * 将接口返回的资源路径转为浏览器可访问的完整 URL。
 * <ul>
 *   <li>{@code /planpath/*} — 前端 public 静态目录，不走后端</li>
 *   <li>{@code http(s)://} — 已是绝对地址，原样返回</li>
 *   <li>其它相对路径 — 拼到 {@link BASE_API_URL}</li>
 * </ul>
 */
export function resolveMediaUrl(path) {
  if (!path) {
    return '';
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (path.startsWith('/planpath/')) {
    const pub = process.env.BASE_URL || '/';
    const root = pub.endsWith('/') ? pub.slice(0, -1) : pub;
    return root + path;
  }
  const base = BASE_API_URL;
  const p = path.startsWith('/') ? path : '/' + path;
  return base + p;
}

export default baseURL;
