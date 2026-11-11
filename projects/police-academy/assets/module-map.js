/* One source of truth for the responsive module map and its standalone SVG export. */
(() => {
  'use strict';
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const palette = [
    {ink:'#315f96',line:'#9ebce1',paper:'#edf4ff'},
    {ink:'#287d69',line:'#91c8b5',paper:'#eaf7f0'},
    {ink:'#926a21',line:'#dfc381',paper:'#fff6df'},
    {ink:'#855787',line:'#c8a9cd',paper:'#f7eef8'}
  ];
  const moduleColors = {analytics:'#294d6b',retrieval:'#446d68',court:'#96733c',exams:'#7e3043',knowledge:'#66587b'};
  const labels = {
    en:{order:'Read in order',module:'MODULE',caption:'Activity structure / design explanation'},
    fr:{order:'Ordre de lecture',module:'MODULE',caption:'Structure de l’activité / explication de la conception'},
    zh:{order:'按顺序阅读',module:'教学模块',caption:'教学活动结构 / 设计说明'}
  };
  const locale = language => language === 'zh-CN' ? 'zh' : labels[language] ? language : 'en';
  const number = index => String(index + 1).padStart(2,'0');
  let serial = 0;

  function html(module, language = 'en') {
    const lang = locale(language), words = labels[lang], id = `module-map-${++serial}`;
    const steps = module.steps.map((step,index) => {
      const tone = palette[index % palette.length];
      const direction = 'right';
      const arrowId = `${id}-arrow-${index+1}`;
      const connector = index < module.steps.length-1 ? `<svg class="module-map-link module-map-link-${direction}" data-from="${index+1}" data-to="${index+2}" data-direction="${direction}" viewBox="0 0 28 24" aria-hidden="true" focusable="false"><defs><marker id="${arrowId}" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" fill="none" stroke="${tone.ink}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></marker></defs><path d="M2 12H24" fill="none" stroke="${tone.ink}" stroke-width="2.3" stroke-linecap="round" marker-end="url(#${arrowId})"/></svg>` : '';
      return `<li class="module-map-step" data-step="${index+1}" style="--branch-ink:${tone.ink};--branch-line:${tone.line};--branch-paper:${tone.paper}"><span class="module-map-step-number" aria-hidden="true">${number(index)}</span><p>${escape(step)}</p>${connector}</li>`;
    }).join('');
    return `<section class="module-map" aria-labelledby="${id}-label" style="--map-hub:${moduleColors[module.id] || moduleColors.analytics}"><div class="module-map-body"><div class="module-map-hub"><span>${words.module}</span><p id="${id}-label">${escape(module.label)}</p></div><div class="module-map-flow" role="region" aria-label="${escape(words.caption)}" tabindex="0"><ol class="module-map-steps" role="list">${steps}</ol></div></div></section>`;
  }

  // Estimate line width in ems so mixed Chinese/Latin text stays inside its card.
  function wrap(value, maxWidth, language, keepLatinWords = false) {
    const tokens = language === 'zh' ? (keepLatinWords ? value.match(/[A-Za-z]+|./gu) || [] : Array.from(value)) : value.split(/\s+/);
    const width = text => Array.from(text).reduce((sum,char) => sum + (/[^\u0000-\u00ff]/.test(char) ? 1 : /[MW@]/.test(char) ? .84 : /[il.,'’ ]/.test(char) ? .3 : .57),0);
    const result = [];let line = '';
    for (const token of tokens) {
      const candidate = line + (line && language !== 'zh' ? ' ' : '') + token;
      if (line && width(candidate) > maxWidth) {result.push(line);line=token;} else {line=candidate;}
    }
    if (line) result.push(line);
    return result;
  }
  function textLines(x,y,values,attributes,lineHeight) {
    return `<text x="${x}" y="${y}" ${attributes}>${values.map((value,index) => `<tspan x="${x}" dy="${index ? lineHeight : 0}">${escape(value)}</tspan>`).join('')}</text>`;
  }

  function svg(module, language = 'en') {
    const lang = locale(language), words = labels[lang], id = `module-map-figure-${++serial}`;
    const size = lang === 'zh' ? 18 : 17, lineHeight = 25;
    const wrapped = module.steps.map(step => {
      const rows = wrap(step, 162/size, lang, lang === 'zh' && module.id === 'analytics');
      if (lang === 'zh') {
        // Let closing punctuation hang into the right padding instead of starting a new line.
        for (let i = 1; i < rows.length; i++) {
          const punctuation = rows[i].match(/^[，。！？；：、）】》”’]/u)?.[0];
          if (punctuation) {rows[i-1] += punctuation; rows[i] = rows[i].slice(punctuation.length);}
        }
        return rows.filter(Boolean);
      }
      return rows;
    });
    const cardHeight = Math.max(136, Math.max(...wrapped.map(lines => lines.length))*lineHeight + 75);
    const hubColor = moduleColors[module.id] || moduleColors.analytics;
    const hubLines = wrap(module.label, 324/21, lang), hubHeight = Math.max(78,hubLines.length*25+42), hubTop = 52;
    const top = hubTop+hubHeight+26, left = 24, cardWidth = 210, gap = 32, width = 984;
    const height = top + cardHeight + 28, hubLeft = (width-340)/2, hubCenter = width/2;
    const connectors = palette.slice(0,3).map((tone,index) => `<path class="module-map-link" data-from="${index+1}" data-to="${index+2}" data-direction="right" d="M${left+index*(cardWidth+gap)+cardWidth+4} ${top+cardHeight/2}H${left+(index+1)*(cardWidth+gap)-5}" fill="none" stroke="${tone.ink}" stroke-width="2.7" stroke-linecap="round" marker-end="url(#${id}-arrow-${index+1})"/>`).join('');
    const markers = palette.slice(0,3).map((tone,index) => `<marker id="${id}-arrow-${index+1}" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="${tone.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></marker>`).join('');
    const nodes = module.steps.map((step,index) => {
      const x = left+index*(cardWidth+gap), y = top, tone=palette[index];
      return `<g><rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" rx="22" fill="${tone.paper}" stroke="${tone.line}" stroke-width="1.5"/><rect x="${x+20}" y="${y+18}" width="40" height="30" rx="10" fill="${tone.ink}"/><text x="${x+40}" y="${y+39}" text-anchor="middle" fill="#ffffff" font-size="15" font-family="Consolas,monospace" font-weight="600">${number(index)}</text>${textLines(x+24,y+78,wrapped[index],`font-size="${size}" fill="#293b4b"`,lineHeight)}</g>`;
    }).join('');
    const fonts = lang === 'zh' ? '"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",sans-serif' : '"Segoe UI","Microsoft YaHei",sans-serif';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${id}-title ${id}-desc" lang="${lang==='zh'?'zh-CN':lang}"><title id="${id}-title">${escape(module.label)}</title><desc id="${id}-desc">${escape(words.order)}: ${module.steps.map((step,index) => `${number(index)}. ${escape(step)}`).join(' ')}</desc><style>text{font-family:${fonts}}</style><defs>${markers}</defs><rect width="${width}" height="${height}" rx="22" fill="#fffdf8"/><text x="24" y="28" fill="#6f746e" font-size="15">${escape(words.caption)}</text><rect x="${hubLeft}" y="${hubTop}" width="340" height="${hubHeight}" rx="22" fill="${hubColor}"/><text x="${hubCenter}" y="${hubTop+24}" text-anchor="middle" fill="#e8e6df" font-size="12" letter-spacing="1">${words.module}</text>${textLines(hubCenter,hubTop+51,hubLines,'text-anchor="middle" fill="#ffffff" font-size="21" font-weight="600"',25)}${connectors}${nodes}</svg>`;
  }

  window.SOLUTION_MODULE_MAP = {html, svg};
})();
