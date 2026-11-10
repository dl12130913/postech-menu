# POSTECH 本周食堂

中韩双语食堂菜单，支持单日／整周对照、餐厅和午晚餐筛选、菜名搜索、浅色／深色主题。

**网站：[dl12130913.github.io/postech-menu](https://dl12130913.github.io/postech-menu/)**

## 本地预览

无需安装依赖。在项目目录运行 `python -m http.server 8080`，打开 <http://localhost:8080>。

## 每周更新

只修改 `menu-data.js`，不需要重复编辑页面：

- `updated`：实际核对菜单的日期。
- `restaurants`：供餐分类及已确认的营业时间。`meal` 为 `lunch`、`dinner` 或 `both`。
- `days`：日期（YYYY-MM-DD）、显示名称、各餐厅菜单。
- 每道菜记录 `ko`（韩文原名）、`zh`（中文）、`meal` 和 `price`（可留空）。
- 未公布菜单时省略对应分类或使用空的 `items`。不要根据没有菜单推断停业。
- 更新 `index.html` 的来源链接，保持可追溯。价格和热量沿用原始来源，未公布时不补猜。

页面按 **Asia/Seoul** 判断今天，默认显示今天的菜单。日期不在菜单周内时显示整周，并提示历史或未来菜单。可以分享 `#2026-11-10` 这样的单日链接，`#all` 显示整周。

菜名翻译不代表完整配料；当前未保留未经核验的“素食”标注。

## 发布到 GitHub Pages

1. 仓库 **Settings → Pages → Source** 选择 **GitHub Actions**。
2. 将本项目文件推送到 `main`，或在 Actions 手动运行 **Deploy menu to GitHub Pages**。
3. 成功后在 Pages 设置页检查实际网址。
4. 仓库首页右侧 **About → 齿轮 → Website** 填入网站地址，使访问入口显示在首页。

部署只上传网页所需的静态文件。若尚未启用 Pages，README 的链接不会自动开启网站。
