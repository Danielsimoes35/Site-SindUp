// Navegador real, ID fictício e tag/provedor interceptados: nenhum evento real no GA4.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const baseline = process.env.SINDIUP_ANALYTICS_BASELINE;
const output = process.env.SINDIUP_ANALYTICS_QA_OUTPUT;
const pages = ['/', '/politica-de-privacidade', '/termos-de-uso', '/exclusao-de-dados'];
const fakeId = 'G-ABC123DEF4';
const tagRequests = [], errors = [];
const realTag = process.env.SINDIUP_REAL_GA4_TAG ? fs.readFileSync(process.env.SINDIUP_REAL_GA4_TAG,'utf8') : '';
if (output) fs.mkdirSync(output, {recursive:true});

function server(directory) {
  const instance = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    let file = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!path.extname(file)) file += '.html';
    const target = path.resolve(directory, file);
    if (!target.startsWith(directory + path.sep) || !fs.existsSync(target)) {
      response.writeHead(404); response.end(); return;
    }
    const type = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp'}[path.extname(target)] || 'application/octet-stream';
    response.writeHead(200, {'Content-Type':type}); fs.createReadStream(target).pipe(response);
  });
  return new Promise(resolve => instance.listen(0, '127.0.0.1', () => resolve({instance,url:`http://127.0.0.1:${instance.address().port}`})));
}
async function fixture(browser, viewport, config = {measurementId:fakeId,debug:true}, preferences = {}) {
  const context = await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600});
  // Com a biblioteca oficial, intercepta também a coleta: não sai dado ao provedor.
  await context.route('https://**', route => route.fulfill({status:204}));
  await context.route('**/analytics-config.js', route => route.fulfill({contentType:'text/javascript',body:`window.SINDIUP_ANALYTICS_CONFIG=${JSON.stringify(config)};`}));
  await context.route('https://www.googletagmanager.com/gtag/js?*', route => {
    tagRequests.push(route.request().url());
    return route.fulfill({contentType:'text/javascript',body:realTag+'\nwindow.__qaGoogleTagLoaded=true;'});
  });
  // Ambos os lados usam as mesmas fontes de fallback para a comparação de pixels.
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({contentType:'text/css',body:''}));
  await context.route('https://wa.me/**', route => route.fulfill({contentType:'text/html',body:'<title>Contato QA</title>'}));
  await context.addInitScript(preferences => {
    if (preferences.dnt) Object.defineProperty(navigator,'doNotTrack',{get:()=> '1'});
    if (preferences.gpc) Object.defineProperty(navigator,'globalPrivacyControl',{get:()=> true});
  }, preferences);
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  return context;
}
async function commands(page) {
  return page.evaluate(() => (window.dataLayer || []).map(command => Array.from(command)));
}
async function events(page) { return (await commands(page)).filter(c=>c[0]==='event'); }
async function popupClick(page, selector, expectedButton) {
  await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
  await page.locator(selector).scrollIntoViewIfNeeded();
  const before = (await events(page)).length;
  let popup;
  try {
    [popup] = await Promise.all([page.waitForEvent('popup',{timeout:10000}),page.locator(selector).click({timeout:10000})]);
  } catch (error) {throw new Error(page.url()+' '+selector+': '+error.message);}
  await popup.waitForLoadState();
  assert(popup.url().startsWith('https://wa.me/5513996556915?text='), 'destino do WhatsApp alterado');
  const added = (await events(page)).slice(before);
  assert.equal(added.filter(e=>e[1]==='whatsapp_click').length,1);
  assert.equal(added[0][2].button_location,expectedButton);
  assert.equal(added.length, expectedButton==='hero' ? 2 : 1);
  if (expectedButton==='hero') assert.equal(added[1][1],'quero_conhecer_click');
  await popup.close();
}

(async () => {
  const current = await server(root), previous = baseline ? await server(path.resolve(baseline)) : null;
  const browser = await chromium.launch({headless:true,
    ...(process.env.SINDIUP_TEST_CHROMIUM ? {executablePath:process.env.SINDIUP_TEST_CHROMIUM}:{}),
    args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    if (baseline) {
      for (const url of pages) {
        const file = url==='/' ? 'index.html' : url.slice(1)+'.html';
        const original=fs.readFileSync(path.join(baseline,file),'utf8');
        const updated=fs.readFileSync(path.join(root,file),'utf8').replace('  <script defer src="/analytics-config.js"></script>\n  <script defer src="/analytics.js"></script>\n','');
        assert.equal(updated,original,'HTML fora da instalação alterado: '+file);
      }
      for (const file of ['styles.css','legal.css']) {
        assert(fs.readFileSync(path.join(root,file)).equals(fs.readFileSync(path.join(baseline,file))));
      }
    }
    for (const viewport of [{width:320,height:740},{width:390,height:844},{width:1366,height:900}]) {
      const context = await fixture(browser,viewport);
      const page = await context.newPage();
      for (const url of pages) {
        const count=tagRequests.length;
        const response=await page.goto(current.url+url+'?cpf=00000000000&telefone=13999999999&nome=SEGREDO#dado-privado',
          {referer:'https://example.com/SEGREDO?senha=SEGREDO'});
        assert.equal(response.status(),200);
        await page.waitForFunction(() => window.__qaGoogleTagLoaded);
        const data=await commands(page), config=data.find(c=>c[0]==='config');
        assert.equal(tagRequests.length,count+1);
        assert(tagRequests.at(-1).endsWith('id='+fakeId));
        assert.equal(config[1],fakeId);
        assert.equal(config[2].page_location,'https://sindiup.com.br'+url);
        assert.equal(config[2].page_referrer,'https://example.com');
        assert.equal(config[2].cookie_expires,0);
        assert.equal(config[2].allow_google_signals,false);
        assert.equal(config[2].allow_ad_personalization_signals,false);
        assert.equal(config[2].debug_mode,true);
        assert(!JSON.stringify(data).includes('SEGREDO'));
        assert(!JSON.stringify(data).includes('13999999999'));
        assert(!data.some(c=>c[0]==='event'&&c[1]==='page_view'),'page_view duplicado');
        const consent=data.find(c=>c[0]==='consent');
        assert.deepEqual(consent.slice(1),['default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'}]);
        assert(data.indexOf(consent)<data.indexOf(config));
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
        await popupClick(page,'.header-cta','cabecalho');
        const floatingVisible=await page.locator('.floating-whatsapp').isVisible();
        assert.equal(floatingVisible,viewport.width<600,'visibilidade original do botão flutuante');
        if(floatingVisible) await popupClick(page,'.floating-whatsapp','flutuante');
        await popupClick(page,'footer .footer-inner a','rodape');
        if (url==='/') {
          await popupClick(page,'.hero-actions .button-primary','hero');
          await popupClick(page,'.final-cta .button-whatsapp','contato');
          const before=(await events(page)).length;
          await page.locator('.hero-actions .text-link').click();
          assert.equal((await events(page)).at(-1)[1],'ver_solucoes_click');
          assert.equal((await events(page)).length,before+1);
          assert.equal(new URL(page.url()).hash,'#solucoes');
        } else {
          await popupClick(page,'.legal-contact-link','documento_legal');
        }
        // Declarações sensíveis em um formulário não entram no rastreamento.
        await page.evaluate(() => {
          const form=document.createElement('form');form.innerHTML='<input value="SEGREDO"><button type="button">Teste privado</button>';
          document.body.appendChild(form);form.querySelector('button').click();form.remove();
        });
        const all=JSON.stringify(await commands(page));
        assert(!all.includes('SEGREDO')&&!all.includes('wa.me')&&!all.includes('5513996556915'));
        // Reexecutar o arquivo não duplica tag, config nem handlers.
        const initial=(await commands(page)).filter(c=>c[0]==='config').length;
        await page.addScriptTag({url:current.url+'/analytics.js'});
        assert.equal((await commands(page)).filter(c=>c[0]==='config').length,initial);
        if (url==='/') await popupClick(page,'.header-cta','cabecalho');

        if (previous) {
          await page.goto(current.url+url); await page.evaluate(()=>document.querySelectorAll('img').forEach(image=>image.loading='eager'));
          await page.evaluate(()=>Promise.all(Array.from(document.images).map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.onload=resolve;image.onerror=resolve;}))));
          await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
          await page.mouse.move(0,0);
          const after=await page.screenshot({fullPage:true,animations:'disabled'});
          const old=await context.newPage();await old.goto(previous.url+url);
          await old.evaluate(()=>document.querySelectorAll('img').forEach(image=>image.loading='eager'));
          await old.evaluate(()=>Promise.all(Array.from(document.images).map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.onload=resolve;image.onerror=resolve;}))));
          await old.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
          await old.mouse.move(0,0);
          const before=await old.screenshot({fullPage:true,animations:'disabled'});
          if(output){const name=(url==='/'?'inicio':url.slice(1))+'-'+viewport.width;
            fs.writeFileSync(path.join(output,name+'-antes.png'),before);fs.writeFileSync(path.join(output,name+'-depois.png'),after);}
          assert(before.equals(after),'pixels alterados: '+url+' '+viewport.width);
          await old.close();
        }
      }
      for (const [hash,event] of [['solucoes','solucoes_click'],['beneficios','beneficios_click'],['como-funciona','como_funciona_click']]) {
        await page.goto(current.url+'/');await page.waitForFunction(()=>window.__qaGoogleTagLoaded);
        const mobile=viewport.width<600;
        if(mobile) await page.locator('.mobile-menu summary').click();
        const menu=mobile?'.mobile-menu nav':'.desktop-nav';
        await page.locator(`${menu} a[href="#${hash}"]`).click();
        assert.equal((await events(page)).at(-1)[1],event);
        assert.equal((await events(page)).at(-1)[2].button_location,mobile?'menu_mobile':'menu_desktop');
        assert.equal(new URL(page.url()).hash,'#'+hash);
        if(mobile) assert(!await page.locator('.mobile-menu').evaluate(el=>el.open));
      }
      console.log(`PASS ${viewport.width}px: páginas, seis eventos, origens, menus/links, dados minimizados, sem duplicação e pixels preservados.`);
      await context.close();
    }
    for (const test of [
      {id:''},{id:'G-XXXXXXXXXX'},{id:'UA-12345'},{id:'G-/script'},
      {id:fakeId,preferences:{dnt:true}},{id:fakeId,preferences:{gpc:true}}
    ]) {
      const context=await fixture(browser,{width:390,height:844},{measurementId:test.id},test.preferences||{});
      const page=await context.newPage(), count=tagRequests.length;
      await page.goto(current.url+'/');
      assert.equal(tagRequests.length,count);
      assert.equal((await commands(page)).length,0);
      await context.close();
    }
    assert.deepEqual(errors,[]);
    console.log('PASS: ID ausente/exemplo/inválido e preferências de privacidade bloqueiam a coleta; zero erros JavaScript. Nenhum dado enviado ao Google.'+(realTag?' Biblioteca oficial carregada.':''));
  } finally {
    await browser.close();current.instance.close();if(previous)previous.instance.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
