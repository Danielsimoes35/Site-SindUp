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
