(() => {
  'use strict';

  const config = window.SINDIUP_ANALYTICS_CONFIG || {};
  const id = typeof config.measurementId === 'string' ? config.measurementId.trim() : '';
  if (!/^G-[A-Z0-9]{6,20}$/.test(id) || id === 'G-XXXXXXXXXX' || window.__sindiupGa4Initialized) return;
  if (navigator.globalPrivacyControl || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

  // Somente caminhos e títulos públicos conhecidos; nunca query strings ou texto digitado.
  const pages = {
    '/': ['/', 'SindiUp | Tecnologia simples. Gestão tranquila.'],
    '/index.html': ['/', 'SindiUp | Tecnologia simples. Gestão tranquila.'],
    '/politica-de-privacidade': ['/politica-de-privacidade', 'Política de Privacidade | SindiUp'],
    '/politica-de-privacidade.html': ['/politica-de-privacidade', 'Política de Privacidade | SindiUp'],
    '/termos-de-uso': ['/termos-de-uso', 'Termos de Uso | SindiUp'],
    '/termos-de-uso.html': ['/termos-de-uso', 'Termos de Uso | SindiUp'],
    '/exclusao-de-dados': ['/exclusao-de-dados', 'Exclusão de Dados | SindiUp'],
    '/exclusao-de-dados.html': ['/exclusao-de-dados', 'Exclusão de Dados | SindiUp']
  };
  const path = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
  const page = pages[path];
  if (!page) return;

  let referrer = '';
  try {
    const source = new URL(document.referrer);
    if (source.protocol === 'https:' || source.protocol === 'http:') referrer = source.origin;
  } catch (_) { /* Ausência de referenciador é normal. */ }

  window.__sindiupGa4Initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  const gtag = window.gtag;
  gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', false);
  gtag('js', new Date());
  gtag('config', id, {
    page_location: 'https://sindiup.com.br' + page[0],
    page_title: page[1],
    page_referrer: referrer,
    cookie_expires: 0,
    cookie_domain: 'none',
    cookie_flags: 'SameSite=Lax;Secure',
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    ...(config.debug === true ? { debug_mode: true } : {})
  });

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  tag.referrerPolicy = 'no-referrer';
  document.head.appendChild(tag);

  const events = {
    '#solucoes': 'solucoes_click',
    '#beneficios': 'beneficios_click',
    '#como-funciona': 'como_funciona_click'
  };
  function buttonLocation(link) {
    if (link.closest('.mobile-menu')) return 'menu_mobile';
    if (link.closest('.desktop-nav')) return 'menu_desktop';
    if (link.closest('.hero-actions')) return 'hero';
    if (link.matches('.floating-whatsapp')) return 'flutuante';
    if (link.closest('footer')) return 'rodape';
    if (link.closest('.site-header')) return 'cabecalho';
    if (link.closest('.final-cta')) return 'contato';
    if (link.matches('.legal-contact-link')) return 'documento_legal';
    return 'conteudo';
  }
  function event(name, link, button) {
    gtag('event', name, {
      page_path: page[0],
      button_location: buttonLocation(link),
      button_name: button,
      transport_type: 'beacon'
    });
  }
  document.addEventListener('click', e => {
    const link = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!link) return;
    let destination;
    try { destination = new URL(link.href, location.href); } catch (_) { return; }

    if (destination.hostname === 'wa.me' || destination.hostname === 'api.whatsapp.com') {
      const hero = Boolean(link.closest('.hero-actions'));
      event('whatsapp_click', link, hero ? 'quero_conhecer' : 'whatsapp');
      if (hero) event('quero_conhecer_click', link, 'quero_conhecer');
      return;
    }
    if (destination.origin !== location.origin || !['/', '/index.html'].includes(destination.pathname)) return;
    if (destination.hash === '#solucoes' && link.matches('.hero-actions .text-link')) {
      event('ver_solucoes_click', link, 'ver_solucoes');
    } else if (events[destination.hash]) {
      event(events[destination.hash], link, destination.hash.slice(1));
    }
    // O rastreamento não cancela cliques, navegação, abertura de abas ou menus.
  }, { capture: true, passive: true });
})();
