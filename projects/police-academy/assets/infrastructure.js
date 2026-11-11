(function () {
  'use strict';

  // Quantities and selected configurations follow the Word equipment schedule.
  // Its topology picture uses different server labels; see note() below.
  var renderSequence = 0;
  var copy = {
    en: {
      title: 'Proposed hardware & campus connectivity',
      subtitle: 'Hardware configuration · campus intranet deployment · B/S architecture',
      campus: 'CAMPUS INTRANET',
      compute: 'Computing & storage servers',
      app: 'Application servers',
      perUnit: 'Per unit · 4 × 32 GB DDR4 RAM',
      disks: '6 × 4 TB SATA disks',
      serverUnit: 'units',
      network: 'Campus network connection',
      networkSub: 'Browser access to platform services',
      peers: 'Other campus systems',
      peersSub: 'Authorized API connections',
      students: 'Student workstations',
      studentsSub: 'Standard teaching computers',
      display: 'Indoor full-color LED cloud display',
      displaySub: '100-inch · shared classroom display',
      displayUnit: 'sets',
      displayCount: '2',
      studentSource: 'Project configuration update',
      displaySource: 'Project configuration update',
      source: 'Source: original equipment schedule; teaching computers and displays updated from project specifications.',
      status: 'Proposal schematic · equipment quantities are specified, not verified as installed.',
      desc: 'Campus-intranet hardware schematic. Three computing and storage servers and two application servers connect through the campus network to sixty student workstations and two 100-inch indoor full-color LED cloud displays. Authorized APIs can connect other campus systems. Teaching computers and displays follow project configuration updates. The original topology and equipment schedule use different server-role labels.',
      row: 'Equipment schedule · row ',
      serverSpec: 'Per unit: 2 × E5-2678 v3 CPUs; 4 × 32 GB DDR4 RAM; 6 × 4 TB SATA disks; dual-port 10 GbE.',
      studentSpec: 'Standard teaching computers; graphics card with 4 GB VRAM + 3.0 GHz CPU;',
      displaySpec: '100-inch',
      note: 'Current configuration: 3 computing/storage servers, 2 application servers, 60 student workstations and 2 sets of 100-inch indoor full-color LED cloud displays. Teaching computers use graphics cards with 4 GB VRAM and 3.0 GHz CPUs. The original topology labels 3 computing servers and 2 storage servers; the server roles require confirmation. The schedule specifies 4 × 32 GB RAM and 6 × 4 TB disks per server; a separate minimum requirement specifies at least 2 × 32G RAM and 20T storage. Both are retained separately. The schematic shows a proposed configuration, rather than verified installation, acceptance or measured performance.'
    },
    fr: {
      title: 'Matériel proposé et connexions du campus',
      subtitle: 'Configuration du matériel · intranet du campus · architecture B/S',
      campus: 'INTRANET DU CAMPUS',
      compute: 'Serveurs de calcul et de stockage',
      app: 'Serveurs applicatifs',
      perUnit: 'Par unité · 4 × 32 Go de RAM DDR4',
      disks: '6 disques SATA de 4 To',
      serverUnit: 'unités',
      network: 'Connexion au réseau du campus',
      networkSub: 'Accès aux services par navigateur',
      peers: 'Autres systèmes du campus',
      peersSub: 'API soumises à autorisation',
      students: 'Postes de travail étudiants',
      studentsSub: 'Ordinateurs pédagogiques courants',
      display: 'Écran LED infonuagique intérieur',
      displaySub: '100 pouces · en couleurs · partagé',
      displayUnit: 'ensembles',
      displayCount: '2',
      studentSource: 'Configuration complémentaire du projet',
      displaySource: 'Configuration complémentaire du projet',
      source: 'Source : bordereau d’origine ; ordinateurs et écrans actualisés selon la configuration complémentaire du projet.',
      status: 'Schéma de proposition · quantités prévues, installation non vérifiée.',
      desc: 'Schéma du matériel sur l’intranet du campus. Trois serveurs de calcul et de stockage et deux serveurs applicatifs sont reliés à soixante postes étudiants et à deux ensembles d’écrans infonuagiques LED intérieurs en couleurs de 100 pouces. Des API autorisées peuvent relier les autres systèmes du campus. Les ordinateurs et écrans suivent la configuration complémentaire du projet. Les rôles des serveurs diffèrent entre la topologie d’origine et le bordereau.',
      row: 'Bordereau des équipements · ligne ',
      serverSpec: 'Par unité : 2 processeurs E5-2678 v3 ; RAM DDR4 4 × 32 Go ; 6 disques SATA de 4 To ; carte 10 GbE à deux ports.',
      studentSpec: 'Ordinateurs pédagogiques courants ; carte graphique avec 4 Go de mémoire vidéo + processeur de 3,0 GHz ;',
      displaySpec: '100 pouces',
      note: 'Configuration actuelle : 3 serveurs de calcul/stockage, 2 serveurs applicatifs, 60 postes étudiants et 2 ensembles d’écrans infonuagiques LED intérieurs en couleurs de 100 pouces. Les ordinateurs disposent d’une carte graphique avec 4 Go de mémoire vidéo et d’un processeur de 3,0 GHz. La topologie d’origine indique 3 serveurs de calcul et 2 serveurs de stockage ; leurs rôles restent à confirmer. Le bordereau prévoit 4 × 32 Go de RAM et 6 disques de 4 To par serveur ; l’exigence minimale distincte prévoit au moins 2 × 32G de RAM et 20T de stockage. Ces deux indications sont conservées séparément. Le schéma représente la configuration proposée, sans attester l’installation, la réception ni les performances mesurées.'
    },
    zh: {
      title: '硬件配置与校园网连接方案',
      subtitle: '硬件设备配置 · 校园内网部署 · B/S 架构',
      campus: '校园内网',
      compute: '计算及存储服务器',
      app: '应用服务器',
      perUnit: '每台 · 4 × 32GB DDR4 内存',
      disks: '6 块 4TB SATA 硬盘',
      serverUnit: '台',
      network: '校园网连接',
      networkSub: '通过浏览器访问平台服务',
      peers: '校内其他系统',
      peersSub: '经授权的 API 接口连接',
      students: '学生工作站',
      studentsSub: '教学用常规电脑',
      display: 'LED 室内全彩云屏',
      displaySub: '100寸 · 课堂共享展示',
      displayUnit: '套',
      displayCount: '2',
      studentSource: '项目补充配置',
      displaySource: '项目补充配置',
      source: '来源：原设备清单；教学电脑与云屏按项目补充配置更新。',
      status: '方案示意 · 设备数量为文档配置，非已核验的实装清单。',
      desc: '校园内网硬件方案示意。3 台计算及存储服务器、2 台应用服务器通过校园网连接 60 台学生工作站和 2 套 100寸 LED 室内全彩云屏，经授权的 API 可连接校内其他系统。教学电脑与云屏按项目补充配置更新；原拓扑图与设备清单的服务器角色标注不一致。',
      row: '设备清单 · 第 ',
      rowEnd: ' 行',
      serverSpec: '每台：2 颗 E5-2678 v3 CPU；4 × 32GB DDR4 内存；6 块 4TB SATA 硬盘；双口万兆网卡。',
      studentSpec: '教学用常规电脑；4G显存显卡+3.0GHZ CPU；',
      displaySpec: '100寸',
      note: '当前中文配置：计算及存储服务器 3 台、应用服务器 2 台、学生工作站 60 台、100寸 LED 室内全彩云屏 2 套。教学电脑配置为4G显存显卡+3.0GHZ CPU。原文拓扑图则标注“计算服务器 3 台、存储服务器 2 台”，服务器角色口径需进一步确认。清单选配为每台 4 × 32GB 内存、6 块 4TB 硬盘；另一处最低要求为不少于 2 × 32G 内存和 20T 存储，两者分别保留。本图展示方案配置，不代表实际安装验收或实测性能。'
    }
  };

  function localeCopy(locale) {
    return copy[locale === 'zh-CN' ? 'zh' : locale] || copy.en;
  }

  function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character];
    });
  }

  function textLine(x, y, value, className) {
    return '<text x="' + x + '" y="' + y + '" class="' + className + '">' + escapeXml(value) + '</text>';
  }

  function serverIcon(x, y) {
    var rows = '';
    for (var i = 0; i < 3; i += 1) {
      rows += '<rect x="' + x + '" y="' + (y + i * 19) + '" width="44" height="13" rx="3" class="infra-icon-fill"/>';
      rows += '<circle cx="' + (x + 34) + '" cy="' + (y + i * 19 + 6.5) + '" r="2" class="infra-gold-fill"/>';
    }
    return '<g aria-hidden="true">' + rows + '</g>';
  }

  function screenIcon(x, y, wide) {
    var width = wide ? 54 : 44;
    return '<g aria-hidden="true"><rect x="' + x + '" y="' + y + '" width="' + width + '" height="34" rx="4" class="infra-icon-outline"/><path d="M' + (x + width / 2) + ' ' + (y + 35) + 'v10m-13 0h26" class="infra-icon-stroke"/></g>';
  }

  function quantityBadge(x, y, count, unit) {
    return '<g><rect x="' + x + '" y="' + y + '" width="85" height="62" rx="12" class="infra-badge"/>' +
      textLine(x + 42.5, y + 30, count, 'infra-quantity') +
      textLine(x + 42.5, y + 49, unit, 'infra-unit') + '</g>';
  }

  function serverCard(x, y, title, count, c) {
    return '<g><rect x="' + x + '" y="' + y + '" width="548" height="150" rx="15" class="infra-card"/>' +
      serverIcon(x + 23, y + 40) +
      textLine(x + 86, y + 37, title, 'infra-card-title') +
      textLine(x + 86, y + 76, c.perUnit, 'infra-detail') +
      textLine(x + 86, y + 104, c.disks, 'infra-detail') +
      quantityBadge(x + 440, y + 47, count, c.serverUnit) + '</g>';
  }

  function hardware(locale) {
    var c = localeCopy(locale);
    var namespace = 'infra-' + (++renderSequence);
    var titleId = namespace + '-title';
    var descId = namespace + '-desc';
    var arrowId = namespace + '-arrow';
    var content = '';

    content += '<rect x="1" y="1" width="1278" height="748" rx="18" class="infra-page"/>';
    content += '<path d="M42 32h5v47h-5z" class="infra-burgundy-fill"/>';
    content += textLine(64, 49, c.title, 'infra-title');
    content += textLine(64, 80, c.subtitle, 'infra-subtitle');
    content += '<rect x="30" y="115" width="1220" height="550" rx="18" class="infra-campus"/>';
    content += textLine(54, 147, c.campus, 'infra-campus-label');

    // Connectors denote relationships only. No network appliance count is implied.
    content += '<g class="infra-links" marker-end="url(#' + arrowId + ')"><path d="M328 325v34h312v30"/><path d="M952 325v34H640v30"/><path d="M640 482v26H328v25"/><path d="M640 482v26h312v25"/></g>';
    content += '<path d="M870 435h34" class="infra-api-link" marker-end="url(#' + arrowId + ')"/>';

    content += serverCard(54, 175, c.compute, '3', c);
    content += serverCard(678, 175, c.app, '2', c);

    content += '<g><rect x="410" y="389" width="460" height="93" rx="16" class="infra-network"/>';
    content += textLine(640, 426, c.network, 'infra-network-title');
    content += textLine(640, 455, c.networkSub, 'infra-network-detail') + '</g>';

    content += '<g><rect x="904" y="394" width="306" height="82" rx="13" class="infra-peer"/>';
    content += textLine(1057, 426, c.peers, 'infra-peer-title');
    content += textLine(1057, 452, c.peersSub, 'infra-peer-detail') + '</g>';

    content += '<g><rect x="54" y="533" width="548" height="108" rx="15" class="infra-card"/>';
    content += screenIcon(77, 564, false);
    content += textLine(140, 573, c.students, 'infra-card-title');
    content += textLine(140, 607, c.studentsSub, 'infra-detail');
    content += quantityBadge(494, 556, '60', c.serverUnit) + '</g>';

    content += '<g><rect x="678" y="533" width="548" height="108" rx="15" class="infra-card"/>';
    content += screenIcon(699, 564, true);
    content += textLine(764, 573, c.display, 'infra-card-title');
    content += textLine(764, 607, c.displaySub, 'infra-detail');
    content += quantityBadge(1118, 556, c.displayCount || '1', c.displayUnit) + '</g>';

    content += textLine(42, 704, c.status, 'infra-status');
    content += textLine(42, 731, c.source, 'infra-source');

    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 750" role="img" aria-labelledby="' + titleId + ' ' + descId + '" data-infra="hardware" style="display:block;width:100%;height:auto;font-family:inherit">' +
      '<title id="' + titleId + '">' + escapeXml(c.title) + '</title><desc id="' + descId + '">' + escapeXml(c.desc) + '</desc>' +
      '<defs><marker id="' + arrowId + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1l7 4-7 4" fill="none" stroke="var(--academy-gold, #a3844a)" stroke-width="1.5"/></marker></defs>' +
      '<style>' +
      '[data-infra] text{font-family:inherit;fill:var(--academy-navy,#20334b)}' +
      '[data-infra] .infra-page{fill:var(--academy-paper,#fffdf8);stroke:var(--academy-line,#ded6c9)}' +
      '[data-infra] .infra-campus{fill:var(--academy-wash,#f3f0e8);stroke:var(--academy-line,#ded6c9);stroke-dasharray:7 5}' +
      '[data-infra] .infra-card{fill:var(--academy-paper,#fffdf8);stroke:var(--academy-line,#ded6c9)}' +
      '[data-infra] .infra-title{font-size:27px;font-weight:700}' +
      '[data-infra] .infra-subtitle{font-size:17px;fill:var(--academy-muted,#637080)}' +
      '[data-infra] .infra-campus-label{font-size:16px;font-weight:700;letter-spacing:1px;fill:var(--academy-burgundy,#7f273f)}' +
      '[data-infra] .infra-card-title{font-size:19px;font-weight:700}' +
      '[data-infra] .infra-detail{font-size:17px;fill:var(--academy-muted,#637080)}' +
      '[data-infra] .infra-badge{fill:var(--academy-wash,#f3f0e8)}' +
      '[data-infra] .infra-quantity{font-size:28px;font-weight:750;text-anchor:middle;fill:var(--academy-burgundy,#7f273f)}' +
      '[data-infra] .infra-unit{font-size:14px;text-anchor:middle;fill:var(--academy-muted,#637080)}' +
      '[data-infra] .infra-network{fill:var(--academy-navy,#20334b)}' +
      '[data-infra] .infra-network-title{font-size:21px;font-weight:700;text-anchor:middle;fill:var(--academy-paper,#fffdf8)}' +
      '[data-infra] .infra-network-detail{font-size:17px;text-anchor:middle;fill:var(--academy-soft-white,#e7e9eb)}' +
      '[data-infra] .infra-peer{fill:none;stroke:var(--academy-gold,#a3844a);stroke-dasharray:5 4}' +
      '[data-infra] .infra-peer-title{font-size:18px;font-weight:650;text-anchor:middle}' +
      '[data-infra] .infra-peer-detail{font-size:16px;text-anchor:middle;fill:var(--academy-muted,#637080)}' +
      '[data-infra] .infra-status{font-size:17px;font-weight:650;fill:var(--academy-burgundy,#7f273f)}' +
      '[data-infra] .infra-source{font-size:15px;fill:var(--academy-muted,#637080)}' +
      '[data-infra] .infra-links,[data-infra] .infra-api-link{fill:none;stroke:var(--academy-gold,#a3844a);stroke-width:2.5;stroke-linejoin:round}' +
      '[data-infra] .infra-api-link{stroke-dasharray:5 4}' +
      '[data-infra] .infra-icon-fill{fill:var(--academy-navy,#20334b)}' +
      '[data-infra] .infra-gold-fill{fill:var(--academy-gold,#a3844a)}' +
      '[data-infra] .infra-burgundy-fill{fill:var(--academy-burgundy,#7f273f)}' +
      '[data-infra] .infra-icon-outline{fill:none;stroke:var(--academy-navy,#20334b);stroke-width:2.5}' +
      '[data-infra] .infra-icon-stroke{fill:none;stroke:var(--academy-navy,#20334b);stroke-width:2.5;stroke-linecap:round}' +
      '</style>' + content + '</svg>';
  }

  function inventory(locale) {
    var c = localeCopy(locale);
    function source(row) { return c.row + row + (c.rowEnd || ''); }
    return [
      { item: c.compute, quantity: '3 ' + c.serverUnit, spec: c.serverSpec, source: source(10) },
      { item: c.app, quantity: '2 ' + c.serverUnit, spec: c.serverSpec, source: source(11) },
      { item: c.students, quantity: '60 ' + c.serverUnit, spec: c.studentSpec, source: c.studentSource || source(12) },
      { item: c.display, quantity: (c.displayCount || '1') + ' ' + c.displayUnit, spec: c.displaySpec, source: c.displaySource || source(13) }
    ];
  }

  window.SOLUTION_INFRA = {
    hardware: hardware,
    inventory: inventory,
    note: function (locale) { return localeCopy(locale).note; }
  };
}());
