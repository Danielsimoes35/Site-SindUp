# SindiUp — site de apresentação

Site estático (HTML + CSS), sem instalação e sem build. Funciona direto no GitHub Pages
e já está configurado para o domínio **sindiup.com.br**.

## Estrutura

```
index.html      página única (Soluções, Benefícios, Como funciona, contato)
styles.css      estilos
assets/         logomarca, ícones e imagem de compartilhamento (WhatsApp/redes)
favicon.ico     ícone da aba do navegador
robots.txt      liberação para buscadores
sitemap.xml     mapa do site para o Google
CNAME           domínio do site (sindiup.com.br)
.nojekyll       faz o GitHub Pages servir os arquivos como estão
```

## 1. Publicar no GitHub Pages

1. No GitHub, crie um repositório público (ex.: `sindiup-site`).
2. Envie **o conteúdo desta pasta** para a raiz do repositório
   (*Add file → Upload files*, ou pelo git — comandos abaixo).
3. Em **Settings → Pages**, em *Build and deployment*, escolha
   *Deploy from a branch*, branch `main`, pasta `/ (root)`, e salve.

```bash
git init -b main
git add .
git commit -m "Site SindiUp"
git remote add origin https://github.com/SEU-USUARIO/sindiup-site.git
git push -u origin main
```

## 2. Apontar o domínio sindiup.com.br

No painel onde o DNS do domínio é gerenciado (no Registro.br, costuma ser
*Editar zona*, modo avançado), remova registros antigos de `@` e `www` que
existirem e crie:

| Tipo  | Nome  | Valor                     |
|-------|-------|---------------------------|
| A     | `@`   | `185.199.108.153`         |
| A     | `@`   | `185.199.109.153`         |
| A     | `@`   | `185.199.110.153`         |
| A     | `@`   | `185.199.111.153`         |
| CNAME | `www` | `SEU-USUARIO.github.io`   |

(Opcional, para IPv6: quatro registros AAAA em `@` com
`2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` e
`2606:50c0:8003::153`.)

Depois, em **Settings → Pages → Custom domain**, confirme `sindiup.com.br`
(o arquivo `CNAME` deste projeto já traz o domínio) e aguarde o GitHub validar o DNS.
Quando o certificado for emitido (de alguns minutos até cerca de 1 hora após a
propagação do DNS), marque **Enforce HTTPS**.

Com o apex e o `www` configurados, o GitHub redireciona automaticamente
`www.sindiup.com.br` para `sindiup.com.br`.

Para conferir o DNS pelo terminal:

```bash
dig sindiup.com.br +noall +answer -t A
```

Segurança (recomendado): em *Settings do seu perfil → Pages → Add a domain*,
verifique o domínio para que ninguém mais possa usá-lo no GitHub Pages.

## Alterações comuns

- **Número do WhatsApp / mensagem:** procure por `wa.me/` no `index.html`
  (o link aparece em vários botões; troque em todos).
- **Textos:** edite direto no `index.html`.
- **Cores:** variáveis no início do `styles.css` (`--navy`, `--gold`, ...).
- **Logo:** substitua os arquivos em `assets/` mantendo os mesmos nomes
  (`sindiup-brand.webp` é a logo horizontal; `sindiup-icon-256.webp` é o ícone).
  Se mudar a logo, atualize também `og-image.png` (1200×630), `favicon.ico`,
  `favicon-32.png` e `apple-touch-icon.png`.

## Depois de publicar

1. Abra `https://sindiup.com.br` no celular e no computador.
2. Envie o link para você mesmo no WhatsApp e confira se a prévia
   (logo e título) aparece. Se o WhatsApp mostrar uma prévia antiga,
   é cache: ele atualiza depois de algum tempo.
3. Opcional: cadastre o site no Google Search Console e envie o
   `https://sindiup.com.br/sitemap.xml` para o Google indexar mais rápido.


## Páginas legais

- `/politica-de-privacidade` → `politica-de-privacidade.html`
- `/termos-de-uso` → `termos-de-uso.html`
- `/exclusao-de-dados` → `exclusao-de-dados.html`

As páginas contêm HTML estático, são públicas e independem de login ou JavaScript.
O GitHub Pages atende as URLs sem extensão diretamente; não é necessário um
roteador da aplicação. Seus estilos estão em `legal.css`; `styles.css` contém
apenas a adição dos links legais ao rodapé compartilhado. O sitemap inclui as
três URLs canônicas.

O contato de privacidade usa o WhatsApp oficial já divulgado no site:
`https://wa.me/5513996556915`. Ao atualizar o contato, revise também as páginas legais.
Não adicione dados societários, prazos ou garantias técnicas sem confirmação.

Após uma publicação, confira as três URLs em HTTPS, sem sessão autenticada:
resposta HTTP 200, conteúdo completo, recursos carregados, links do rodapé,
menu e ausência de rolagem horizontal em telas de 320 px, 390 px e desktop.
A página de exclusão é uma URL de instruções para o titular, não um endpoint de
callback de exclusão automática de dados.


### Tipografia e redação dos documentos legais

Os três documentos usam cláusulas e parágrafos com numeração explícita em HTML.
O texto dos parágrafos é justificado, com hifenização em português e tamanhos
de 20 px no mobile e 22 px no desktop. A fonte prioritária é Segoe UI,
com fontes nativas do sistema como alternativa quando ela não está instalada.
Os estilos são exclusivos das páginas legais; os estilos globais e a página
inicial não são alterados. A fonte Italiana não é carregada por essas páginas.

Ao revisar o conteúdo, preserve os direitos dos titulares, o isolamento dos
condomínios, a autorização opcional de WhatsApp exclusiva de Encomendas e os
canais reais de atendimento. A coleta e o fornecimento dos dados dos moradores,
inclusive os números de WhatsApp, são de responsabilidade do contratante.
Cabe a ele obter e manter a comprovação da autorização para mensagens fora da
plataforma, sem depender de aceite manual do morador no SindiUp, e comunicar
atualizações e revogações. O simples cadastro do número não autoriza envios.
Condições de terceiros e requisitos legais não
constituem garantia de entrega de mensagens ou de disponibilidade ininterrupta.
