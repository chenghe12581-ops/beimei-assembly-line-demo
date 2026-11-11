/**
 * 静态资源基础路径。
 *
 * Vite base 为 './' 时 import.meta.env.BASE_URL 也是 './'，相对地址会随浏览器
 * 当前路由（如 /生产执行/理料区视图）解析，导致 GitHub Pages 等子路径部署下
 * public 资源 404。因此生产环境改为取当前 JS bundle 所在目录作为绝对基地址，
 * 与当前页面路由无关；开发模式下 public 资源始终挂在服务根路径，直接用 '/'。
 */
function resolveAssetBase(): string {
  if (import.meta.env.DEV) return '/';
  if (typeof document !== 'undefined') {
    const bundleScript = document.querySelector<HTMLScriptElement>('script[src*="/assets/index-"]');
    if (bundleScript?.src) {
      const src = bundleScript.src;
      // public 资源挂在站点根，而 bundle 在 /assets/ 子目录，需回退一级。
      const assetsDirIndex = src.lastIndexOf('/assets/');
      if (assetsDirIndex >= 0) return src.slice(0, assetsDirIndex + 1);
      return src.slice(0, src.lastIndexOf('/') + 1);
    }
  }
  return import.meta.env.BASE_URL;
}

export const ASSET_BASE: string = resolveAssetBase();
