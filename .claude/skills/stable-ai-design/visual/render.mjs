#!/usr/bin/env node
// 传播物料命令行：按模板出 SVG，可选用本机 Chrome 转 2 倍 PNG。
// 用法：node render.mjs <spec.json> [--out 目录] [--png]
//   spec.json：{ "template": "poster", "variant": "light", "name": "文件名", "fields": { "title": "第一行\n第二行", "qr": "qr.png" } }，也可以是数组。
// 品牌值来自同目录 brand.json（由设计系统 npm run build 生成）；Logo 与二维码转成 data URL 嵌进 SVG，文件可单独打开。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, templates } from './templates.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const specPath = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out');
if (!specPath) {
  console.error(`用法：node render.mjs <spec.json> [--out 目录] [--png]\n模板：${templates.map(t => `${t.id}（${t.name}，字段 ${t.fields.map(f => f.key).join(' / ')}）`).join('；')}`);
  process.exit(1);
}
const outDir = resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : '.');
const brandPath = join(here, 'brand.json');
if (!existsSync(brandPath)) throw new Error('缺少 brand.json：在设计系统仓库里运行 npm run build，并使用 skill/stable-ai-design/visual/ 下的 render.mjs');
const brand = JSON.parse(readFileSync(brandPath, 'utf8'));
const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml' };
const dataUrl = file => `data:${mime[extname(file).toLowerCase()] || 'application/octet-stream'};base64,${readFileSync(file).toString('base64')}`;
for (const key of Object.keys(brand)) if (brand[key]?.href) brand[key] = { ...brand[key], href: dataUrl(join(here, brand[key].href)) };

const specDir = dirname(resolve(specPath));
const specs = [JSON.parse(readFileSync(specPath, 'utf8'))].flat();
mkdirSync(outDir, { recursive: true });
const chrome = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
let warned = 0;

for (const spec of specs) {
  const fields = { ...spec.fields };
  if (fields.qr && !fields.qr.startsWith('data:')) fields.qr = dataUrl(resolve(specDir, fields.qr));
  const { svg, width, height, warnings } = render(spec.template, { variant: spec.variant || 'light', fields, brand });
  const name = spec.name || `${spec.template}-${spec.variant || 'light'}`;
  const svgFile = join(outDir, `${name}.svg`);
  writeFileSync(svgFile, svg);
  console.log(`${svgFile}（${width} × ${height}）`);
  for (const w of warnings) console.log(`  提醒：${w}`);
  warned += warnings.length;
  if (args.includes('--png')) {
    if (!chrome) { console.log('  未找到 Chrome，跳过 PNG；设置环境变量 CHROME 指向浏览器可执行文件，或用浏览器打开 SVG 另存。'); continue; }
    const pngFile = join(outDir, `${name}.png`);
    execFileSync(chrome, ['--headless', '--disable-gpu', '--hide-scrollbars', `--screenshot=${pngFile}`, `--window-size=${width},${height}`, `--force-device-scale-factor=${brand.scale || 2}`, `file://${svgFile}`], { stdio: 'ignore' });
    console.log(`${pngFile}（${width * (brand.scale || 2)} × ${height * (brand.scale || 2)}）`);
  }
}
if (warned) { console.log(`共 ${warned} 条提醒，处理后再发布。`); process.exitCode = 2; }
