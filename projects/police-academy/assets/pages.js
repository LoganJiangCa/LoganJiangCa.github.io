/* Shared labels and language-preserving links for the document pages. */
(() => {
  'use strict';
  const labels = {
    en: {
      home: 'Project home', contribution: 'My work & contribution', outcome: 'Project results', architecture: 'Platform architecture',
      background: 'Background & project value', hardware: 'Hardware & floor plans', modules: 'Five modules', journey: 'Training journey', value: 'Project value',
      contextTitle: 'Background, project value & economic benefits', contextKicker: 'Project context & value', contextBackground: 'Construction background', contextValue: 'Project value & economic benefits',
      homeIntro: 'My work and contribution, project results, and a platform overview.', homeArchitectureTitle: 'Platform at a glance', homeArchitectureIntro: 'Three components, five practical training modules.', fullArchitecture: 'View full platform architecture', contents: 'ON THIS PAGE', reading: 'CONTINUE THE CASE STUDY',
      previous: 'Previous page', next: 'Next page', homeLink: 'Back to project home', pagination: 'Page sequence', skip: 'Skip to page content', equipmentSchedule: 'Hardware equipment specifications',
      sequence: 'Explore the project', complete: 'You have reached the end of the case study.'
    },
    fr: {
      home: 'Accueil du projet', contribution: 'Mon travail et ma contribution', outcome: 'Résultats du projet', architecture: 'Architecture de la plateforme',
      background: 'Contexte et valeur du projet', hardware: 'Matériel et plans', modules: 'Cinq modules', journey: 'Parcours pédagogique', value: 'Valeur du projet',
      contextTitle: 'Contexte, valeur du projet et retombées économiques', contextKicker: 'Contexte et valeur du projet', contextBackground: 'Contexte de construction', contextValue: 'Valeur et retombées économiques',
      homeIntro: 'Mon travail et ma contribution, les résultats du projet et un aperçu de la plateforme.', homeArchitectureTitle: 'La plateforme en un coup d’œil', homeArchitectureIntro: 'Trois composantes, cinq modules de formation pratique.', fullArchitecture: 'Voir l’architecture complète', contents: 'SUR CETTE PAGE', reading: 'POURSUIVRE L’ÉTUDE DE CAS',
      previous: 'Page précédente', next: 'Page suivante', homeLink: 'Retour à l’accueil du projet', pagination: 'Parcours des pages', skip: 'Aller au contenu de la page', equipmentSchedule: 'Configuration du matériel',
      sequence: 'Explorer le projet', complete: 'Vous avez atteint la fin de l’étude de cas.'
    },
    zh: {
      home: '项目主页', contribution: '我的工作与贡献', outcome: '项目结果', architecture: '平台架构',
      background: '建设背景与价值效益', hardware: '硬件与平面图', modules: '五大模块', journey: '教学流程', value: '项目价值与经济效益',
      contextTitle: '建设背景、项目价值与经济效益', contextKicker: '建设动因与项目价值', contextBackground: '建设背景', contextValue: '项目价值与经济效益',
      homeIntro: '我的工作与贡献、项目结果，以及平台架构概览。', homeArchitectureTitle: '平台架构概览', homeArchitectureIntro: '三个组成部分，五个实战训练模块。', fullArchitecture: '查看完整平台架构', contents: '本页内容', reading: '继续了解项目',
      previous: '上一页', next: '下一页', homeLink: '返回项目主页', pagination: '按顺序浏览页面', skip: '跳转至页面正文', equipmentSchedule: '硬件设备配置清单',
      sequence: '依次浏览项目', complete: '已浏览至项目最后一页。'
    }
  };
  const language = new URLSearchParams(window.location.search).get('lang');
  window.SOLUTION_NAVIGATION = {
    language: Object.hasOwn(labels, language) ? language : 'en',
    render(language) {
      const text = labels[language];
      document.querySelectorAll('[data-view]').forEach(element => {
        if (text[element.dataset.view]) element.textContent = text[element.dataset.view];
      });
      document.querySelectorAll('[data-page-link]').forEach(link => {
        const [file, hash] = link.dataset.pageLink.split('#');
        link.setAttribute('href', `${file}?lang=${language}${hash ? '#' + hash : ''}`);
      });
      document.querySelector('.skip-link').textContent = text.skip;
      document.querySelector('.home-contents')?.setAttribute('aria-label', text.contents);
      document.querySelectorAll('[data-page-pagination]').forEach(nav => nav.setAttribute('aria-label', text.pagination));
      document.title = `${text[document.body.dataset.page]} · ${window.SOLUTION_CASE_STUDY[language].title} · Logan Jiang`;
      // Updating the query keeps a refreshed page in the selected language.
      // File previews can restrict history changes; their links still retain it.
      try {
        const current = new URL(window.location.href);
        current.searchParams.set('lang', language);
        window.history.replaceState(null, '', current.href);
      } catch (_) { /* Direct file previews may disallow replaceState. */ }
    }
  };
})();
