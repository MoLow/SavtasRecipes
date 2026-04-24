---
name: markdown-negotiation
type: markdown
version: 1.0.0
description: Get any page as Markdown by sending Accept: text/markdown
---

# markdown-negotiation

Savta's Recipes supports HTTP content negotiation. Send `Accept: text/markdown` with any request to receive Markdown instead of HTML.

## How it works

- Add `Accept: text/markdown` to your request headers
- The server returns the page content as Markdown (`Content-Type: text/markdown; charset=utf-8`)
- HTML remains the default for browsers; the `Vary: Accept` response header signals caches correctly

## Endpoints with Markdown support

- `GET /` — Site index (links to language versions)
- `GET /en` — English recipe index
- `GET /he` — Hebrew recipe index
- `GET /en/recipe/{slug}` — English recipe detail
- `GET /he/recipe/{slug}` — Hebrew recipe detail

## Example

```http
GET /en/recipe/chocolate-cake HTTP/1.1
Host: recipes.atlow.co.il
Accept: text/markdown
```

```http
HTTP/1.1 200 OK
Content-Type: text/markdown; charset=utf-8
Vary: Accept
```
