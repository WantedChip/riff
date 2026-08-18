/**
 * Half-Life Franchise Website - Internationalization (i18n) Engine
 * Supported Languages: English (EN), French (FR), German (DE), Spanish (ES), Japanese (JA), Simplified Chinese (ZH)
 * Storage Key: hl_lang
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'hl_lang';
  const DEFAULT_LANG = 'en';
  const SUPPORTED_LANGS = ['en', 'fr', 'de', 'es', 'ja', 'zh'];

  // Complete 6-Language Dictionary
  const dictionary = {
    en: {
      lang: {
        en: 'English',
        fr: 'French',
        de: 'German',
        es: 'Spanish',
        ja: 'Japanese',
        zh: 'Simplified Chinese'
      },
      nav: {
        home: 'Home',
        alyx: 'Half-Life: Alyx',
        halflife: 'Half-Life',
        halflife2: 'Half-Life 2',
        episode1: 'Episode One',
        episode2: 'Episode Two',
        anniversary: '20th Anniversary',
        franchise: 'Franchise',
        buy_now: 'Buy Now'
      },
      hero: {
        tagline: 'The VR Flagship Entry',
        headline: 'Return to City 17 in Virtual Reality',
        synopsis: 'Set between the events of Half-Life and Half-Life 2, Alyx Vance fights an impossible battle against an alien race known as the Combine.',
        cta_primary: 'Explore Half-Life: Alyx',
        cta_steam: 'Wishlist on Steam',
        release_date: 'Released: March 23, 2020'
      },
      anniversary: {
        eyebrow: '20th Anniversary Update',
        headline: 'Celebrating Two Decades of Half-Life 2',
        description: "We've reunited the original team to create an in-depth documentary, integrated developer commentary, added Workshop support, and refined visual and physics fidelity.",
        feature_doc: 'Secret Tape Documentary',
        feature_commentary: 'Developer Commentary',
        feature_workshop: 'Steam Workshop Integration',
        feature_visuals: 'Enhanced Visual Fidelity'
      },
      catalog: {
        title: 'Franchise Catalog',
        subtitle: 'Experience the complete story of Gordon Freeman and Alyx Vance across the Half-Life saga.',
        hl1_title: 'Half-Life',
        hl1_tag: '1998 • Original Classic',
        hl1_desc: 'The award-winning debut that blended action and storytelling in the subterranean Black Mesa Research Facility.',
        hl2_title: 'Half-Life 2',
        hl2_tag: '2004 • Source Engine Era',
        hl2_desc: 'Pick up the crowbar of Gordon Freeman in a dystopian world overrun by the Combine, driven by revolutionary physics.',
        ep1_title: 'Half-Life 2: Episode One',
        ep1_tag: '2006 • The Aftermath',
        ep1_desc: 'Escape City 17 alongside Alyx Vance before the Citadel reactor reaches catastrophic critical meltdown.',
        ep2_title: 'Half-Life 2: Episode Two',
        ep2_tag: '2007 • Outlands Campaign',
        ep2_desc: 'Race into the White Forest countryside to deliver superweapon codes and face off against Combine Striders.'
      },
      ui: {
        select_language: 'Select Language',
        system_requirements: 'System Requirements',
        release_date: 'Release Date',
        developer: 'Developer',
        publisher: 'Publisher',
        genre: 'Genre',
        platforms: 'Platforms',
        read_more: 'Read Details',
        watch_trailer: 'Watch Trailer',
        buy_on_steam: 'Buy on Steam',
        learn_more: 'Learn More',
        overview: 'Overview',
        features: 'Key Features',
        media: 'Media & Screenshots',
        close: 'Close',
        back: 'Back to Home'
      },
      footer: {
        copyright: '© Valve Corporation. All rights reserved.',
        rights: 'Half-Life, the Lambda logo, Alyx Vance, Source, and Steam are trademarks and/or registered trademarks of Valve Corporation.',
        privacy: 'Privacy Policy',
        terms: 'Legal & Terms',
        valve_legal: 'Valve Legal Information',
        back_to_top: 'Back to Top',
        follow_us: 'Follow Half-Life'
      }
    },
    fr: {
      lang: {
        en: 'Anglais',
        fr: 'Français',
        de: 'Allemand',
        es: 'Espagnol',
        ja: 'Japonais',
        zh: 'Chinois Simplifié'
      },
      nav: {
        home: 'Accueil',
        alyx: 'Half-Life: Alyx',
        halflife: 'Half-Life',
        halflife2: 'Half-Life 2',
        episode1: 'Épisode 1',
        episode2: 'Épisode 2',
        anniversary: '20e Anniversaire',
        franchise: 'Franchise',
        buy_now: 'Acheter'
      },
      hero: {
        tagline: 'Le jeu VR phare',
        headline: 'Retournez à Cité 17 en Réalité Virtuelle',
        synopsis: 'Situé entre Half-Life et Half-Life 2, Alyx Vance mène un combat impossible contre une race extraterrestre appelée le Cartel.',
        cta_primary: 'Découvrir Half-Life: Alyx',
        cta_steam: 'Ajouter à la liste de souhaits',
        release_date: 'Sortie : 23 mars 2020'
      },
      anniversary: {
        eyebrow: 'Mise à jour du 20e Anniversaire',
        headline: 'Célébration de deux décennies de Half-Life 2',
        description: "Nous avons réuni l'équipe originale pour créer un documentaire approfondi, intégrer les commentaires des développeurs, ajouter le support du Workshop et affiner les graphismes et la physique.",
        feature_doc: 'Documentaire Secret Tape',
        feature_commentary: 'Commentaires des développeurs',
        feature_workshop: 'Intégration Steam Workshop',
        feature_visuals: 'Fidélité visuelle améliorée'
      },
      catalog: {
        title: 'Catalogue de la franchise',
        subtitle: "Découvrez l'histoire complète de Gordon Freeman et Alyx Vance à travers la saga Half-Life.",
        hl1_title: 'Half-Life',
        hl1_tag: '1998 • Classique original',
        hl1_desc: "Le premier jeu récompensé qui a mêlé action et narration dans le complexe de recherche de Black Mesa.",
        hl2_title: 'Half-Life 2',
        hl2_tag: '2004 • Ère du moteur Source',
        hl2_desc: 'Reprenez le pied-de-biche de Gordon Freeman dans un monde dystopique envahi par le Cartel, porté par une physique révolutionnaire.',
        ep1_title: 'Half-Life 2: Épisode 1',
        ep1_tag: '2006 • Les conséquences',
        ep1_desc: "Échappez-vous de Cité 17 avec Alyx Vance avant que le réacteur de la Citadelle n'entre en fusion critique.",
        ep2_title: 'Half-Life 2: Épisode 2',
        ep2_tag: '2007 • Campagne des terres extérieures',
        ep2_desc: "Foncez dans la campagne de White Forest pour livrer les codes d'une super-arme et affronter les Striders du Cartel."
      },
      ui: {
        select_language: 'Choisir la langue',
        system_requirements: 'Configuration requise',
        release_date: 'Date de sortie',
        developer: 'Développeur',
        publisher: 'Éditeur',
        genre: 'Genre',
        platforms: 'Plateformes',
        read_more: 'En savoir plus',
        watch_trailer: 'Voir la bande-annonce',
        buy_on_steam: 'Acheter sur Steam',
        learn_more: 'En savoir plus',
        overview: 'Aperçu',
        features: 'Caractéristiques principales',
        media: "Médias et captures d'écran",
        close: 'Fermer',
        back: "Retour à l'accueil"
      },
      footer: {
        copyright: '© Valve Corporation. Tous droits réservés.',
        rights: 'Half-Life, le logo Lambda, Alyx Vance, Source et Steam sont des marques déposées de Valve Corporation.',
        privacy: 'Politique de confidentialité',
        terms: 'Mentions légales',
        valve_legal: 'Informations légales Valve',
        back_to_top: 'Haut de page',
        follow_us: 'Suivre Half-Life'
      }
    },
    de: {
      lang: {
        en: 'Englisch',
        fr: 'Französisch',
        de: 'Deutsch',
        es: 'Spanisch',
        ja: 'Japanisch',
        zh: 'Vereinfachtes Chinesisch'
      },
      nav: {
        home: 'Startseite',
        alyx: 'Half-Life: Alyx',
        halflife: 'Half-Life',
        halflife2: 'Half-Life 2',
        episode1: 'Episode 1',
        episode2: 'Episode 2',
        anniversary: '20. Jahrestag',
        franchise: 'Franchise',
        buy_now: 'Jetzt Kaufen'
      },
      hero: {
        tagline: 'Das VR-Flaggschiff',
        headline: 'Rückkehr nach City 17 in Virtual Reality',
        synopsis: 'Zwischen den Ereignissen von Half-Life und Half-Life 2 kämpft Alyx Vance einen aussichtslosen Kampf gegen die außerirdische Combine.',
        cta_primary: 'Half-Life: Alyx erkunden',
        cta_steam: 'Auf die Wunschliste',
        release_date: 'Veröffentlicht: 23. März 2020'
      },
      anniversary: {
        eyebrow: 'Update zum 20. Jahrestag',
        headline: 'Zwei Jahrzehnte Half-Life 2 feiern',
        description: 'Wir haben das ursprüngliche Team wiedervereint, um eine ausführliche Dokumentation zu erstellen, Entwicklerkommentare zu integrieren, Workshop-Unterstützung hinzuzufügen und die Grafik- und Physiktreue zu verbessern.',
        feature_doc: 'Secret Tape Dokumentation',
        feature_commentary: 'Entwicklerkommentare',
        feature_workshop: 'Steam Workshop Integration',
        feature_visuals: 'Verbesserte visuelle Qualität'
      },
      catalog: {
        title: 'Franchise-Katalog',
        subtitle: 'Erleben Sie die gesamte Geschichte von Gordon Freeman und Alyx Vance in der Half-Life-Saga.',
        hl1_title: 'Half-Life',
        hl1_tag: '1998 • Original-Klassiker',
        hl1_desc: 'Das preisgekrönte Debüt, das Action und Storytelling im unterirdischen Black Mesa Research Facility verband.',
        hl2_title: 'Half-Life 2',
        hl2_tag: '2004 • Ära der Source-Engine',
        hl2_desc: 'Ergreifen Sie das Brecheisen von Gordon Freeman in einer dystopischen Welt, die von den Combine beherrscht wird.',
        ep1_title: 'Half-Life 2: Episode 1',
        ep1_tag: '2006 • Die Folgen',
        ep1_desc: 'Entkommen Sie City 17 zusammen mit Alyx Vance, bevor der Zitadelle-Reaktor eine katastrophale Schmelze erleidet.',
        ep2_title: 'Half-Life 2: Episode 2',
        ep2_tag: '2007 • Outlands-Kampagne',
        ep2_desc: 'Rasen Sie in das Umland von White Forest, um Superwaffencodes zu übermitteln und sich den Combine-Stridern zu stellen.'
      },
      ui: {
        select_language: 'Sprache auswählen',
        system_requirements: 'Systemanforderungen',
        release_date: 'Erscheinungsdatum',
        developer: 'Entwickler',
        publisher: 'Publisher',
        genre: 'Genre',
        platforms: 'Plattformen',
        read_more: 'Mehr erfahren',
        watch_trailer: 'Trailer ansehen',
        buy_on_steam: 'Auf Steam kaufen',
        learn_more: 'Mehr erfahren',
        overview: 'Übersicht',
        features: 'Hauptmerkmale',
        media: 'Medien & Screenshots',
        close: 'Schließen',
        back: 'Zurück zur Startseite'
      },
      footer: {
        copyright: '© Valve Corporation. Alle Rechte vorbehalten.',
        rights: 'Half-Life, das Lambda-Logo, Alyx Vance, Source und Steam sind Marken von Valve Corporation.',
        privacy: 'Datenschutzrichtlinie',
        terms: 'Rechtliches & Bedingungen',
        valve_legal: 'Valve Rechtliche Informationen',
        back_to_top: 'Nach oben',
        follow_us: 'Half-Life folgen'
      }
    },
    es: {
      lang: {
        en: 'Inglés',
        fr: 'Francés',
        de: 'Alemán',
        es: 'Español',
        ja: 'Japonés',
        zh: 'Chino Simplificado'
      },
      nav: {
        home: 'Inicio',
        alyx: 'Half-Life: Alyx',
        halflife: 'Half-Life',
        halflife2: 'Half-Life 2',
        episode1: 'Episodio 1',
        episode2: 'Episodio 2',
        anniversary: '20.º Aniversario',
        franchise: 'Franquicia',
        buy_now: 'Comprar Ahora'
      },
      hero: {
        tagline: 'La experiencia insignia en RV',
        headline: 'Regresa a Ciudad 17 en Realidad Virtual',
        synopsis: 'Ambientado entre Half-Life y Half-Life 2, Alyx Vance lucha en una batalla imposible contra la raza extraterrestre conocida como la Alianza.',
        cta_primary: 'Explorar Half-Life: Alyx',
        cta_steam: 'Añadir a la lista de deseados',
        release_date: 'Lanzamiento: 23 de marzo de 2020'
      },
      anniversary: {
        eyebrow: 'Actualización del 20.º Aniversario',
        headline: 'Celebrando dos décadas de Half-Life 2',
        description: 'Hemos reunido al equipo original para crear un documental detallado, integrar comentarios de los desarrolladores, añadir compatibilidad con Workshop y pulir los detalles visuales y de física.',
        feature_doc: 'Documental Secret Tape',
        feature_commentary: 'Comentarios de los desarrolladores',
        feature_workshop: 'Integración con Steam Workshop',
        feature_visuals: 'Fidelidad visual mejorada'
      },
      catalog: {
        title: 'Catálogo de la franquicia',
        subtitle: 'Experimenta la historia completa de Gordon Freeman y Alyx Vance a lo largo de la saga Half-Life.',
        hl1_title: 'Half-Life',
        hl1_tag: '1998 • Clásico original',
        hl1_desc: 'El galardonado debut que combinó acción y narrativa en las instalaciones de investigación de Black Mesa.',
        hl2_title: 'Half-Life 2',
        hl2_tag: '2004 • Era del motor Source',
        hl2_desc: 'Toma la palanca de Gordon Freeman en un mundo distópico dominado por la Alianza, impulsado por una física revolucionaria.',
        ep1_title: 'Half-Life 2: Episodio 1',
        ep1_tag: '2006 • Las secuelas',
        ep1_desc: 'Escapa de Ciudad 17 junto a Alyx Vance antes de que el reactor de la Ciudadela sufra una fusión nuclear desastrosa.',
        ep2_title: 'Half-Life 2: Episodio 2',
        ep2_tag: '2007 • Campaña de las Tierras Exteriores',
        ep2_desc: 'Corre hacia el campo de White Forest para entregar códigos de superarmas y enfrentarte a los Striders de la Alianza.'
      },
      ui: {
        select_language: 'Seleccionar idioma',
        system_requirements: 'Requisitos del sistema',
        release_date: 'Fecha de lanzamiento',
        developer: 'Desarrollador',
        publisher: 'Editor',
        genre: 'Género',
        platforms: 'Plataformas',
        read_more: 'Leer más',
        watch_trailer: 'Ver tráiler',
        buy_on_steam: 'Comprar en Steam',
        learn_more: 'Saber más',
        overview: 'Visión general',
        features: 'Características principales',
        media: 'Galería y capturas',
        close: 'Cerrar',
        back: 'Volver al inicio'
      },
      footer: {
        copyright: '© Valve Corporation. Todos los derechos reservados.',
        rights: 'Half-Life, el logotipo de Lambda, Alyx Vance, Source y Steam son marcas comerciales de Valve Corporation.',
        privacy: 'Política de privacidad',
        terms: 'Términos legales',
        valve_legal: 'Información legal de Valve',
        back_to_top: 'Volver arriba',
        follow_us: 'Seguir a Half-Life'
      }
    },
    ja: {
      lang: {
        en: '英語',
        fr: 'フランス語',
        de: 'ドイツ語',
        es: 'スペイン語',
        ja: '日本語',
        zh: '中国語（簡体字）'
      },
      nav: {
        home: 'ホーム',
        alyx: 'Half-Life: Alyx',
        halflife: 'Half-Life',
        halflife2: 'Half-Life 2',
        episode1: 'エピソード1',
        episode2: 'エピソード2',
        anniversary: '20周年記念',
        franchise: 'フランチャイズ',
        buy_now: '今すぐ購入'
      },
      hero: {
        tagline: 'フラッグシップVR作品',
        headline: 'バーチャルリアリティでシティ17へ帰還せよ',
        synopsis: '『Half-Life』と『Half-Life 2』の間の物語。アリックス・バンズはコンバインと呼ばれる異星人勢力との絶望的な戦いに挑む。',
        cta_primary: 'Half-Life: Alyx を詳しく見る',
        cta_steam: 'Steamでウィッシュリストに追加',
        release_date: 'リリース日: 2020年3月23日'
      },
      anniversary: {
        eyebrow: '20周年記念アップデート',
        headline: '『Half-Life 2』20周年を祝して',
        description: '開発チームが再集結。詳細なドキュメンタリー映像、開発者コメンタリー、Workshop対応、グラフィックおよび物理演算の向上を収録。',
        feature_doc: 'ドキュメンタリー映像',
        feature_commentary: '開発者コメンタリー',
        feature_workshop: 'Steam Workshop統合',
        feature_visuals: 'ビジュアル表現の強化'
      },
      catalog: {
        title: '作品カタログ',
        subtitle: 'ゴードン・フリーマンとアリックス・バンズが紡ぐ『Half-Life』の壮大な物語を体験しよう。',
        hl1_title: 'Half-Life',
        hl1_tag: '1998年 • 原点となる名作',
        hl1_desc: 'ブラック・メサ研究所を舞台に、アクションとストーリーテリングを融合させた金字塔的デビュー作。',
        hl2_title: 'Half-Life 2',
        hl2_tag: '2004年 • Sourceエンジン時代',
        hl2_desc: 'コンバインに支配されたディストピア。革新的な物理演算と共に、ゴードン・フリーマンのバールを再び手に取れ。',
        ep1_title: 'Half-Life 2: Episode One',
        ep1_tag: '2006年 • 崩壊の始まり',
        ep1_desc: '要塞シタデルの炉心融合が迫る中、アリックス・バンズと共にシティ17からの脱出を目指す。',
        ep2_title: 'Half-Life 2: Episode Two',
        ep2_tag: '2007年 • アウトランド編',
        ep2_desc: '超兵器の解読コードを届けるためホワイトフォレストへ急げ。ストライダーの大群との決戦が待つ。'
      },
      ui: {
        select_language: '言語を選択',
        system_requirements: 'システム要件',
        release_date: '発売日',
        developer: '開発元',
        publisher: 'パブリッシャー',
        genre: 'ジャンル',
        platforms: '対応プラットフォーム',
        read_more: '詳細を見る',
        watch_trailer: 'トレーラーを再生',
        buy_on_steam: 'Steamで購入',
        learn_more: '詳細',
        overview: '概要',
        features: '主な特徴',
        media: 'メディア＆スクリーンショット',
        close: '閉じる',
        back: 'ホームに戻る'
      },
      footer: {
        copyright: '© Valve Corporation. All rights reserved.',
        rights: 'Half-Life、Lambdaロゴ、Alyx Vance、Source、SteamはValve Corporationの商標または登録商標です。',
        privacy: 'プライバシーポリシー',
        terms: '利用規約',
        valve_legal: 'Valve 法的情報',
        back_to_top: 'ページ上部へ',
        follow_us: 'Half-Lifeをフォロー'
      }
    },
    zh: {
      lang: {
        en: '英语',
        fr: '法语',
        de: '德语',
        es: '西班牙语',
        ja: '日语',
        zh: '简体中文'
      },
      nav: {
        home: '首页',
        alyx: 'Half-Life: Alyx',
        halflife: 'Half-Life',
        halflife2: 'Half-Life 2',
        episode1: '第一章',
        episode2: '第二章',
        anniversary: '20周年纪念',
        franchise: '系列概览',
        buy_now: '立即购买'
      },
      hero: {
        tagline: '旗舰级 VR 巨作',
        headline: '在虚拟现实中重返 17 号城',
        synopsis: '故事介于《Half-Life》与《Half-Life 2》之间，爱丽克斯·凡斯带领人类抵抗外星势力“联合军”的残酷统治。',
        cta_primary: '探索 Half-Life: Alyx',
        cta_steam: '在 Steam 上添加至愿望单',
        release_date: '发行日期：2020 年 3 月 23 日'
      },
      anniversary: {
        eyebrow: '20 周年纪念更新',
        headline: '庆祝《Half-Life 2》问世 20 周年',
        description: '我们重聚了原班人马，制作了深入的纪录片，整合了开发者旁白，加入了 Workshop 支持，并全面提升了画面与物理细节。',
        feature_doc: 'Secret Tape 纪录片',
        feature_commentary: '开发者全程旁白',
        feature_workshop: 'Steam Workshop 创意工坊',
        feature_visuals: '画质与光影全面提升'
      },
      catalog: {
        title: '游戏系列目录',
        subtitle: '完整体验高登·弗里曼与爱丽克斯·凡斯贯穿《Half-Life》全系列的传奇史诗。',
        hl1_title: 'Half-Life (半条命)',
        hl1_tag: '1998年 • 经典开山之作',
        hl1_desc: '融合惊悚动作与沉浸式叙事的破天荒开山之作，讲述黑山研究所的维尔度危机。',
        hl2_title: 'Half-Life 2 (半条命 2)',
        hl2_tag: '2004年 • Source 引擎纪元',
        hl2_desc: '在重影枪与惊人物影引擎支持下，重拾高登·弗里曼的撬棍，反抗联合军对 17 号城的反乌托邦统治。',
        ep1_title: 'Half-Life 2: 第一章',
        ep1_tag: '2006年 • 绝地逃亡',
        ep1_desc: '在要塞核心即将引爆的前夕，与爱丽克斯·凡斯并肩作战，逃离陷入混乱的 17 号城。',
        ep2_title: 'Half-Life 2: 第二章',
        ep2_tag: '2007年 • 白森林决战',
        ep2_desc: '穿越白森林荒野，将关键代码送达反抗军基地，展开与三脚巨机（Strider）的终极阻击战。'
      },
      ui: {
        select_language: '选择语言',
        system_requirements: '系统配置需求',
        release_date: '发行日期',
        developer: '开发商',
        publisher: '发行商',
        genre: '游戏类型',
        platforms: '支持平台',
        read_more: '查看详情',
        watch_trailer: '观看预告片',
        buy_on_steam: '在 Steam 上购买',
        learn_more: '了解更多',
        overview: '内容概述',
        features: '核心特色',
        media: '媒体与游戏截图',
        close: '关闭',
        back: '返回首页'
      },
      footer: {
        copyright: '© Valve Corporation. 保留所有权利。',
        rights: 'Half-Life、Lambda 标志、Alyx Vance、Source 及 Steam 均为 Valve Corporation 的商标或注册商标。',
        privacy: '隐私政策',
        terms: '法律条款',
        valve_legal: 'Valve 法律信息',
        back_to_top: '返回顶部',
        follow_us: '关注 Half-Life'
      }
    }
  };

  /**
   * Safe key path resolver (e.g. "nav.home" -> obj.nav.home)
   */
  function getNestedValue(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((prev, curr) => (prev && prev[curr] !== undefined ? prev[curr] : undefined), obj);
  }

  /**
   * Automatic language detector following exact hierarchy:
   * 1. URL search param ?lang=code
   * 2. LocalStorage hl_lang
   * 3. Navigator language
   * 4. Default 'en'
   */
  function detectLanguage() {
    // 1. URL Query Parameter
    try {
      const searchStr = (typeof window !== 'undefined' && window.location && window.location.search)
        ? window.location.search
        : ((typeof location !== 'undefined' && location.search) ? location.search : '');

      if (searchStr) {
        let urlLang = null;
        if (typeof URLSearchParams !== 'undefined') {
          const urlParams = new URLSearchParams(searchStr);
          urlLang = urlParams.get('lang');
        }
        if (!urlLang) {
          const match = searchStr.match(/[?&]lang=([^&#]+)/i);
          urlLang = match ? decodeURIComponent(match[1]) : null;
        }
        if (urlLang) {
          const normalizedUrlLang = urlLang.toLowerCase().trim();
          if (SUPPORTED_LANGS.includes(normalizedUrlLang)) {
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, normalizedUrlLang);
              }
            } catch (e) {
              console.warn('[i18n] Failed to persist URL lang to localStorage:', e);
            }
            return normalizedUrlLang;
          }
        }
      }
    } catch (e) {
      console.warn('[i18n] URL search parameter check failed:', e);
    }

    // 2. LocalStorage Persistence
    try {
      if (typeof localStorage !== 'undefined') {
        const savedLang = localStorage.getItem(STORAGE_KEY);
        if (savedLang) {
          const normalizedSaved = savedLang.toLowerCase().trim();
          if (SUPPORTED_LANGS.includes(normalizedSaved)) {
            return normalizedSaved;
          }
        }
      }
    } catch (e) {
      console.warn('[i18n] LocalStorage read failed:', e);
    }

    // 3. Browser Navigator Language
    try {
      if (typeof navigator !== 'undefined') {
        const navLang = (navigator.language || navigator.userLanguage || '').toLowerCase().trim();
        const primaryTag = navLang.split('-')[0];
        if (SUPPORTED_LANGS.includes(primaryTag)) {
          return primaryTag;
        }
      }
    } catch (e) {
      console.warn('[i18n] Navigator language check failed:', e);
    }

    // 4. Default Fallback
    return DEFAULT_LANG;
  }

  /**
   * i18n Engine Core Object
   */
  const HL_i18n = {
    currentLang: detectLanguage(),
    supportedLangs: SUPPORTED_LANGS,
    dictionary: dictionary,

    /**
     * Translate key with optional fallback and parameter interpolation
     * @param {string} key - e.g. "nav.home"
     * @param {Object} [params] - e.g. { year: 2024 }
     * @returns {string}
     */
    t: function (key, params) {
      return this.getTranslation(key, params);
    },

    /**
     * Primary translation lookup
     */
    getTranslation: function (key, params) {
      const lang = this.currentLang || DEFAULT_LANG;
      let val = getNestedValue(this.dictionary[lang], key);

      // Fallback to English if missing in target language
      if (val === undefined && lang !== DEFAULT_LANG) {
        val = getNestedValue(this.dictionary[DEFAULT_LANG], key);
      }

      // Fallback to key if missing everywhere
      if (val === undefined) {
        console.warn(`[i18n] Missing key: "${key}" for lang: "${lang}"`);
        return key;
      }

      // Interpolate parameters {param}
      if (params && typeof params === 'object') {
        Object.keys(params).forEach(function (pKey) {
          val = val.replace(new RegExp(`\\{${pKey}\\}`, 'g'), params[pKey]);
        });
      }

      return val;
    },

    /**
     * Set active language, update storage, update HTML lang attribute, re-scan DOM, and dispatch event
     * @param {string} langCode 
     */
    setLanguage: function (langCode) {
      if (!langCode) return;
      const normalized = langCode.toLowerCase().trim();
      if (!SUPPORTED_LANGS.includes(normalized)) {
        console.error(`[i18n] Unsupported language code: "${langCode}"`);
        return;
      }

      this.currentLang = normalized;

      // Save to localStorage
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, normalized);
        }
      } catch (e) {
        console.warn('[i18n] LocalStorage write failed:', e);
      }

      // Set <html lang="...">
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('lang', normalized);
      }

      // Execute DOM translation update
      this.updateDOM();

      // Dispatch custom language change events
      const eventDetail = { detail: { lang: normalized } };
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hl:langchange', eventDetail));
        window.dispatchEvent(new CustomEvent('hl-language-changed', eventDetail));
      }
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('hl:langchange', eventDetail));
        document.dispatchEvent(new CustomEvent('hl-language-changed', eventDetail));
      }
    },

    /**
     * Returns current active language
     */
    getLanguage: function () {
      return this.currentLang;
    },

    /**
     * Scans DOM and updates elements with [data-i18n] or [data-i18n-attr]
     */
    updateDOM: function () {
      if (typeof document === 'undefined') return;
      const self = this;

      // 1. Text elements with data-i18n="key"
      const textElements = document.querySelectorAll('[data-i18n]');
      textElements.forEach(function (el) {
        const key = el.getAttribute('data-i18n');
        if (key) {
          const translation = self.t(key);
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = translation;
          } else {
            el.textContent = translation;
          }
        }
      });

      // 2. Attribute targets with data-i18n-attr="attrName:key,attr2:key2"
      const attrElements = document.querySelectorAll('[data-i18n-attr]');
      attrElements.forEach(function (el) {
        const spec = el.getAttribute('data-i18n-attr');
        if (spec) {
          const pairs = spec.split(',');
          pairs.forEach(function (pair) {
            const parts = pair.split(':');
            if (parts.length === 2) {
              const attrName = parts[0].trim();
              const key = parts[1].trim();
              const translation = self.t(key);
              el.setAttribute(attrName, translation);
            }
          });
        }
      });

      // 3. Sync Language Switcher Dropdown UI elements if present
      const currentLangCodeEls = document.querySelectorAll('.js-current-lang-code, .current-lang-label');
      currentLangCodeEls.forEach(function (el) {
        el.textContent = self.currentLang.toUpperCase();
      });

      const currentLangNameEls = document.querySelectorAll('.js-current-lang-name');
      currentLangNameEls.forEach(function (el) {
        if (self.dictionary[self.currentLang] && self.dictionary[self.currentLang].lang) {
          el.textContent = self.dictionary[self.currentLang].lang[self.currentLang];
        }
      });

      const langOptions = document.querySelectorAll('[data-lang], .lang-option');
      langOptions.forEach(function (opt) {
        const optLang = opt.getAttribute('data-lang');
        if (optLang === self.currentLang) {
          opt.classList.add('is-active', 'active', 'is-selected');
          opt.setAttribute('aria-selected', 'true');
        } else {
          opt.classList.remove('is-active', 'active', 'is-selected');
          opt.setAttribute('aria-selected', 'false');
        }
      });
    },

    /**
     * Bind click events to language switcher option elements
     */
    bindEvents: function () {
      if (typeof document === 'undefined') return;
      const self = this;
      document.addEventListener('click', function (e) {
        const langOption = e.target.closest('[data-lang]');
        if (langOption) {
          const targetLang = langOption.getAttribute('data-lang');
          if (targetLang && SUPPORTED_LANGS.includes(targetLang)) {
            e.preventDefault();
            self.setLanguage(targetLang);
          }
        }
      });
    },

    /**
     * Initialize i18n Engine
     */
    init: function () {
      const detected = detectLanguage();
      this.currentLang = detected;

      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('lang', detected);
      }

      this.updateDOM();
      this.bindEvents();

      console.log(`[i18n] Engine initialized with language: "${detected}"`);
    }
  };

  // Expose to window & global scope
  if (typeof window !== 'undefined') {
    window.HL_i18n = HL_i18n;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = HL_i18n;
  }

  // Auto-init on DOMContentLoaded or immediately if already loaded
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        HL_i18n.init();
      });
    } else {
      HL_i18n.init();
    }
  }
})();
