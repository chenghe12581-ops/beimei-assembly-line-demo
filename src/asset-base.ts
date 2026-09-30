/** 静态资源基础路径：Vite base 为 './' 时随当前页面路径解析，兼容 GitHub Pages 仓库子路径部署。 */
export const ASSET_BASE: string = import.meta.env.BASE_URL;
