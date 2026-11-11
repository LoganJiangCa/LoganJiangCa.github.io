/* A compact homepage overview; the complete architecture remains on its own page. */
(() => {
  'use strict';
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const labels = {
    en:{lab:'Information Laboratory',cooperation:'Designated School–Enterprise Partnership Laboratory',database:'Underlying database',platform:'Big Data Practical Training Platform',overview:'Information laboratory: platform overview'},
    fr:{lab:'Laboratoire d’information',cooperation:'Laboratoire de partenariat école–entreprise désigné',database:'Base de données sous-jacente',platform:'Plateforme de formation pratique au big data',overview:'Laboratoire d’information : aperçu de la plateforme'},
    zh:{lab:'信息实验室',cooperation:'挂牌校企合作实验室',database:'底层数据库',platform:'大数据实战训练平台',overview:'信息实验室平台架构概览'}
  };
  const colors = {
    analytics:{ink:'#294d6b',paper:'#edf4ff',line:'#adc3df'},
    retrieval:{ink:'#446d68',paper:'#eaf7f0',line:'#a7cebe'},
    court:{ink:'#8c6933',paper:'#fff6df',line:'#dfc88f'},
    exams:{ink:'#7e3043',paper:'#faedf0',line:'#d4aab5'},
    knowledge:{ink:'#66587b',paper:'#f2eef7',line:'#c6b8d6'}
  };

  function overview(copy, words) {
    const modules = copy.modules.map(module => {
      const tone = colors[module.id];
      return `<li class="home-lab-module" data-module="${escape(module.id)}" style="--home-module-ink:${tone.ink};--home-module-paper:${tone.paper};--home-module-line:${tone.line}">${escape(module.label)}</li>`;
    }).join('');
    return `<div class="home-architecture home-architecture-lab" role="group" aria-label="${escape(words.overview)}"><header class="home-lab-heading"><p>${escape(words.lab)}</p></header><div class="home-lab-layout"><section class="home-lab-cooperation" aria-label="${escape(words.cooperation)}"><h3>${escape(words.cooperation)}</h3></section><section class="home-lab-platform" aria-label="${escape(words.platform)}"><h3>${escape(words.platform)}</h3><ul class="home-lab-modules" role="list">${modules}</ul></section><section class="home-lab-database" aria-label="${escape(words.database)}"><h3>${escape(words.database)}</h3></section></div></div>`;
  }

  function html(copy, language = 'en') {
    const lang = language === 'zh-CN' ? 'zh' : labels[language] ? language : 'en';
    return overview(copy, labels[lang]);
  }

  window.SOLUTION_HOME_ARCHITECTURE = {html};
})();
