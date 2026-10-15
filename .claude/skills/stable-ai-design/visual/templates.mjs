// 传播物料模板：纯函数，输入字段与品牌值，输出 SVG 字符串；不依赖 DOM。
// 站点编辑器（site/assets/visual.js）、build-visual.mjs 与 Skill 的 render.mjs 共用这一份。
// 版式规则见同目录 README.md，这里按规则写死：
//   白字只压在渐变左侧 60% 内（右端橘黄上白字不足 3:1）；渐变上的其余文字用 ink；
//   Logo 只放白底，渐变底上放在白色圆角托板里（与深色主题的做法一致）；点阵只铺在渐变上。
//   图形底：Logo 的双环图形放大、从画面边缘出血，只放白底，不改色、不旋转、不压字；此时 Logo 改用独立字标，同一画面只有一个双环。

// ---------- 模板清单：字段顺序即编辑器顺序 ----------
// kind：line 单行；lines 多行（换行分隔，max 为最多行数）；image 可选图片（data URL）。
export const variants = { light: '白底', gradient: '渐变底', graphic: '图形底' };

export const templates = [
  {
    id: 'wechat-cover', name: '公众号头条封面', channel: 'wechat-cover',
    summary: '文章列表里的大图。白底版左文右渐变，带 Logo；渐变底版不放 Logo，由公众号名称标识；图形底版右侧放大双环图形。',
    fields: [
      { key: 'eyebrow', label: '栏目', kind: 'line', sample: 'LimiX 技术解读' },
      { key: 'title', label: '标题', kind: 'lines', max: 2, sample: 'LimiX 2.0 发布\n结构化数据基础模型' },
      { key: 'subtitle', label: '说明', kind: 'line', sample: '分类、回归与时序预测，免训练直接用' },
    ],
  },
  {
    id: 'wechat-thumb', name: '公众号小图', channel: 'wechat-thumb',
    summary: '与头条封面配对的 1:1 小图，只放短标题。',
    fields: [
      { key: 'title', label: '短标题', kind: 'lines', max: 2, sample: 'LimiX\n2.0 发布' },
    ],
  },
  {
    id: 'poster', name: '活动海报', channel: 'poster',
    summary: '研讨会、发布会、招聘宣讲等活动报名。主视觉区放标题，白底区放时间地点与二维码。',
    fields: [
      { key: 'eyebrow', label: '活动类型', kind: 'line', sample: 'LimiX 线上研讨会' },
      { key: 'title', label: '标题', kind: 'lines', max: 3, sample: '工业时序预测的\n免训练实践' },
      { key: 'subtitle', label: '说明', kind: 'lines', max: 2, sample: '从数据接入到上线，讲清 LimiX 在\n钢铁、电力场景的落地方法' },
      { key: 'info', label: '信息，每行写「标签｜内容」', kind: 'lines', max: 4, sample: '时间｜2026 年 10 月 16 日 14:00\n形式｜线上直播\n嘉宾｜稳准智能算法团队' },
      { key: 'cta', label: '行动', kind: 'line', sample: '扫码报名' },
      { key: 'note', label: '补充说明', kind: 'line', sample: '报名后发送直播链接' },
      { key: 'qr', label: '二维码', kind: 'image', optional: true },
    ],
  },
  {
    id: 'square', name: '数据方图', channel: 'square',
    summary: '一张图讲一个数：栏目、数值、一句解读和来源。',
    fields: [
      { key: 'eyebrow', label: '栏目', kind: 'line', sample: 'LimiX 时序预测' },
      { key: 'value', label: '数值', kind: 'line', sample: '+18.6%' },
      { key: 'caption', label: '解读', kind: 'lines', max: 2, sample: '高炉炉温 4 小时预测\n准确率提升' },
      { key: 'source', label: '来源', kind: 'line', sample: '示例数据，非真实客户结果' },
    ],
  },
];

/** 模板的示例字段，编辑器初值与站点缩略图用。 */
export const samples = id => Object.fromEntries(find(id).fields.filter(f => f.sample != null).map(f => [f.key, f.sample]));

function find(id) {
  const t = templates.find(t => t.id === id);
  if (!t) throw new Error(`没有模板 ${id}，可选：${templates.map(t => t.id).join(' / ')}`);
  return t;
}

// ---------- 文字测量：按字符类别估宽，只用于超宽提醒，不做自动换行 ----------
const em = ch => /[⺀-鿿豈-﫿！-～　-〿]/.test(ch) ? 1
  : /[0-9+\-]/.test(ch) ? 0.6 : ch === '%' ? 0.9 : /[.,:;'"|]/.test(ch) ? 0.3 : ch === ' ' ? 0.28
  : /[A-Z]/.test(ch) ? 0.66 : /[mw]/.test(ch) ? 0.8 : 0.52;
const measure = (text, size) => [...text].reduce((w, c) => w + em(c), 0) * size;
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const splitLines = v => String(v ?? '').split('\n').map(s => s.trim()).filter(Boolean);

/**
 * 渲染一张图。
 * brand：{ colors: { ink, white, primaryText, muted, border }, gradient: [[offset, color]…], font, logo / mark / wordmark / graphic: { href, width, height } }
 *   logo 横版组合，mark 小图形，wordmark 独立字标，graphic 大尺寸图形（图形底放大出血用）。
 * prefix：defs 的 id 前缀，同一页面放多张同模板的图时区分。
 * 返回 { svg, width, height, warnings }；warnings 为超宽、超行数、缺二维码等提醒，导出前应清空。
 */
export function render(id, { variant = 'light', fields = {}, brand, prefix = '' }) {
  const t = find(id);
  if (!variants[variant]) throw new Error(`没有底色 ${variant}，可选：${Object.keys(variants).join(' / ')}`);
  const f = { ...samples(id), ...fields };
  const warnings = [];
  const c = brand.colors;
  const u = `${prefix}${id}-${variant}`; // defs 的 id 前缀：同一页面内联多张图时不冲突
  const parts = [];

  // 文字块：lines 为数组，逐行出 <text>；超宽或超行数记提醒。
  const text = (lines, { x, y, size, lh = size * 1.3, weight = 400, fill, max, label, limit }) => {
    if (limit && lines.length > limit) warnings.push(`${label}最多 ${limit} 行，现在 ${lines.length} 行`);
    lines.slice(0, limit || lines.length).forEach((line, i) => {
      const w = measure(line, size);
      if (max && w > max) warnings.push(`${label}${lines.length > 1 ? `第 ${i + 1} 行` : ''}约 ${Math.round(w)}px，超出 ${max}px 的安全宽度，请缩短或换行`);
      parts.push(`<text x="${x}" y="${Math.round(y + i * lh)}" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`);
    });
    return y + (Math.min(lines.length, limit || lines.length) - 1) * lh; // 末行基线
  };
  const rect = (x, y, w, h, fill, extra = '') => parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${extra}/>`);
  const gradient = (x, y, w, h) => rect(x, y, w, h, `url(#${u}-g)`);
  // 点阵：只铺在渐变上，从左到右渐显；dot 为间距。
  const dots = (x, y, w, h, dot) => {
    parts.push(`<pattern id="${u}-p" width="${dot}" height="${dot}" patternUnits="userSpaceOnUse" x="${x}" y="${y}"><circle cx="${dot / 2}" cy="${dot / 2}" r="${Math.max(1.5, dot / 9)}" fill="${c.white}"/></pattern>`);
    rect(x, y, w, h, `url(#${u}-p)`, ` mask="url(#${u}-m)" opacity="0.45"`);
  };
  const image = (img, x, y, h) => {
    const w = Math.round(h * img.width / img.height * 10) / 10;
    parts.push(`<image xlink:href="${esc(img.href)}" x="${x}" y="${y}" width="${w}" height="${h}"/>`);
    return w;
  };
  // 渐变底上的 Logo：白色圆角托板，四周留白为 Logo 高度的 1/4 以上。
  const plate = (x, y, h, radius) => {
    const pad = Math.round(h * 0.3);
    const w = Math.round(h * brand.logo.width / brand.logo.height);
    rect(x, y, w + pad * 2, h + pad * 2, c.white, ` rx="${radius}"`);
    image(brand.logo, x + pad, y + pad, h);
  };
  // 图形底的大图形：左上角落在 (x, y)，高 h，超出画布的部分自然裁掉（出血）。
  const graphic = (x, y, h) => image(brand.graphic, x, y, h);
  const lines = key => splitLines(f[key]);

  let W, H;
  if (id === 'wechat-cover') {
    [W, H] = [900, 383];
    if (variant !== 'gradient') {
      rect(0, 0, W, H, c.white);
      if (variant === 'light') { gradient(600, 0, 300, H); dots(600, 0, 300, H, 18); image(brand.logo, 48, 40, 48); }
      else { graphic(620, -40, 470); image(brand.wordmark, 48, 40, 40); }
      text(lines('eyebrow'), { x: 48, y: 150, size: 18, weight: 600, fill: c.primaryText, max: 520, label: '栏目', limit: 1 });
      const end = text(lines('title'), { x: 48, y: 206, size: 42, lh: 54, weight: 600, fill: c.ink, max: 520, label: '标题', limit: 2 });
      text(lines('subtitle'), { x: 48, y: end + 48, size: 18, fill: c.muted, max: 520, label: '说明', limit: 1 });
    } else {
      gradient(0, 0, W, H); dots(495, 0, 405, H, 18);
      text(lines('eyebrow'), { x: 56, y: 124, size: 20, weight: 600, fill: c.ink, max: 600, label: '栏目', limit: 1 });
      const end = text(lines('title'), { x: 56, y: 186, size: 44, lh: 56, weight: 600, fill: c.white, max: 484, label: '标题（白字限左侧 60%）', limit: 2 });
      text(lines('subtitle'), { x: 56, y: end + 50, size: 20, fill: c.ink, max: 600, label: '说明', limit: 1 });
    }
  } else if (id === 'wechat-thumb') {
    [W, H] = [383, 383];
    if (variant === 'graphic') {
      rect(0, 0, W, H, c.white);
      graphic(150, 175, 300);
      text(lines('title'), { x: 40, y: 100, size: 48, lh: 60, weight: 600, fill: c.ink, max: 303, label: '短标题', limit: 2 });
    } else if (variant === 'light') {
      rect(0, 0, W, H, c.white);
      image(brand.mark, 40, 40, 56);
      text(lines('title'), { x: 40, y: 196, size: 48, lh: 60, weight: 600, fill: c.ink, max: 303, label: '短标题', limit: 2 });
      gradient(0, 315, W, 68); dots(0, 315, W, 68, 14);
    } else {
      gradient(0, 0, W, H); dots(150, 0, 233, H, 14);
      text(lines('title'), { x: 40, y: 190, size: 46, lh: 60, weight: 600, fill: c.white, max: 190, label: '短标题（白字限左侧 60%）', limit: 2 });
    }
  } else if (id === 'poster') {
    [W, H] = [1080, 1920];
    // light 与 graphic 都是白底：信息区的说明文字用说明灰；只有渐变底版全部用 ink。
    const light = variant !== 'gradient';
    rect(0, 0, W, H, c.white);
    let infoTop = 1204, infoStep = 88;
    if (variant === 'graphic') {
      // 图形在右上角出血，文字从图形下方开始，自上而下排。
      graphic(560, -160, 820);
      image(brand.wordmark, 96, 96, 64);
      text(lines('eyebrow'), { x: 96, y: 760, size: 34, weight: 600, fill: c.primaryText, max: 888, label: '活动类型', limit: 1 });
      const end = text(lines('title'), { x: 96, y: 870, size: 76, lh: 96, weight: 600, fill: c.ink, max: 888, label: '标题', limit: 3 });
      text(lines('subtitle'), { x: 96, y: end + 88, size: 32, lh: 48, fill: c.ink, max: 888, label: '说明', limit: 2 });
      [infoTop, infoStep] = [1260, 76];
    } else {
      const heroTop = light ? 240 : 0, heroBottom = light ? 1080 : H;
      gradient(0, heroTop, W, heroBottom - heroTop); dots(540, heroTop, 540, light ? 840 : 1540, 28);
      if (light) image(brand.logo, 96, 96, 88); else plate(96, 96, 76, 12);
      // 活动类型压在主视觉区顶部；标题与说明整体沉到底部，行数变化时从下往上排，主视觉区不留空洞。
      text(lines('eyebrow'), { x: 96, y: light ? 356 : 332, size: 34, weight: 600, fill: c.ink, max: 888, label: '活动类型', limit: 1 });
      const titleN = Math.min(Math.max(lines('title').length, 1), 3), subN = Math.min(lines('subtitle').length, 2);
      const subTop = (light ? 984 : 1000) - Math.max(subN - 1, 0) * 48;
      const titleTop = (subN ? subTop - 88 : subTop) - (titleN - 1) * 96;
      text(lines('title'), { x: 96, y: titleTop, size: 76, lh: 96, weight: 600, fill: c.white, max: 552, label: '标题（白字限左侧 60%）', limit: 3 });
      text(lines('subtitle'), { x: 96, y: subTop, size: 32, lh: 48, fill: c.ink, max: 888, label: '说明', limit: 2 });
    }
    // 信息行：标签｜内容；白底版标签用说明灰，渐变底版全部用 ink。
    const info = lines('info');
    if (info.length > 4) warnings.push(`信息最多 4 行，现在 ${info.length} 行`);
    info.slice(0, 4).forEach((row, i) => {
      const [label, ...rest] = row.split(/[｜|]/);
      const value = rest.join('｜').trim();
      const ry = infoTop + i * infoStep;
      if (!value) warnings.push(`信息第 ${i + 1} 行缺少「｜」，写成「标签｜内容」`);
      text([label.trim()], { x: 96, y: ry, size: 28, fill: light ? c.muted : c.ink, max: 120, label: `信息第 ${i + 1} 行标签` });
      if (value) text([value], { x: 240, y: ry, size: 34, weight: 500, fill: c.ink, max: 744, label: `信息第 ${i + 1} 行` });
    });
    rect(96, 1560, 888, 2, light ? c.border : c.ink, light ? '' : ' opacity="0.35"');
    text(lines('cta'), { x: 96, y: 1680, size: 44, weight: 600, fill: c.ink, max: 560, label: '行动', limit: 1 });
    text(lines('note'), { x: 96, y: 1736, size: 28, fill: light ? c.muted : c.ink, max: 560, label: '补充说明', limit: 1 });
    // 二维码：232px，白底托板；没有图时画虚线占位并提醒。
    const [qx, qy, qs] = [752, 1592, 232];
    if (!light) rect(qx - 16, qy - 16, qs + 32, qs + 32, c.white, ' rx="12"');
    if (f.qr) parts.push(`<image xlink:href="${esc(f.qr)}" x="${qx}" y="${qy}" width="${qs}" height="${qs}" preserveAspectRatio="xMidYMid meet"/>`);
    else {
      warnings.push('还没有放二维码');
      rect(qx, qy, qs, qs, c.white, ` stroke="${c.border}" stroke-width="2" stroke-dasharray="10 8"`);
      parts.push(`<text x="${qx + qs / 2}" y="${qy + qs / 2 + 10}" font-size="28" fill="${c.muted}" text-anchor="middle">二维码</text>`);
    }
  } else if (id === 'square') {
    [W, H] = [1080, 1080];
    const light = variant !== 'gradient';
    if (variant === 'graphic') {
      // 图形在右下角出血；解读与来源收窄到图形左侧，不压图形。
      rect(0, 0, W, H, c.white);
      graphic(560, 500, 780);
      image(brand.wordmark, 80, 80, 64);
      text(lines('eyebrow'), { x: 80, y: 290, size: 34, weight: 600, fill: c.primaryText, max: 920, label: '栏目', limit: 1 });
      text(lines('value'), { x: 72, y: 500, size: 200, weight: 600, fill: c.ink, max: 920, label: '数值', limit: 1 });
      text(lines('caption'), { x: 80, y: 600, size: 40, lh: 58, weight: 500, fill: c.ink, max: 460, label: '解读', limit: 2 });
      text(lines('source'), { x: 80, y: 984, size: 26, fill: c.muted, max: 460, label: '来源', limit: 1 });
    } else if (light) {
      rect(0, 0, W, H, c.white);
      gradient(0, 1000, W, 80); dots(0, 1000, W, 80, 24);
      image(brand.logo, 80, 80, 80);
    } else {
      gradient(0, 0, W, H); dots(560, 0, 520, H, 24);
      plate(80, 80, 68, 12);
    }
    if (variant !== 'graphic') {
      text(lines('eyebrow'), { x: 80, y: 400, size: 34, weight: 600, fill: light ? c.primaryText : c.ink, max: 920, label: '栏目', limit: 1 });
      light
        ? text(lines('value'), { x: 72, y: 600, size: 200, weight: 600, fill: c.ink, max: 920, label: '数值', limit: 1 })
        : text(lines('value'), { x: 72, y: 590, size: 150, weight: 600, fill: c.white, max: 568, label: '数值（白字限左侧 60%）', limit: 1 });
      text(lines('caption'), { x: 80, y: 700, size: 40, lh: 58, weight: 500, fill: c.ink, max: 920, label: '解读', limit: 2 });
      text(lines('source'), { x: 80, y: light ? 944 : 984, size: 26, fill: light ? c.muted : c.ink, max: 920, label: '来源', limit: 1 });
    }
    if (!lines('source').length) warnings.push('数值要写来源；示例或脱敏数据要标明');
  }

  const stops = brand.gradient.map(([o, color]) => `<stop offset="${o}" stop-color="${color}"/>`).join('');
  const defs = `<defs><linearGradient id="${u}-g" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient>`
    + `<linearGradient id="${u}-f" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>`
    + `<mask id="${u}-m" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#${u}-f)"/></mask></defs>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family='${brand.font.replaceAll("'", '"')}'>`
    + defs + parts.join('') + '</svg>';
  return { svg, width: W, height: H, warnings: [...new Set(warnings)] };
}
