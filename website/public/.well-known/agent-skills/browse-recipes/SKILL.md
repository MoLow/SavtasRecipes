---
name: browse-recipes
type: openapi
version: 1.0.0
description: Browse Savta's bilingual recipe collection via REST API
---

# browse-recipes

Browse and search Savta's bilingual (English/Hebrew) recipe collection via a REST API described by an OpenAPI 3.1 specification.

## OpenAPI Specification

https://recipes.atlow.co.il/openapi.json

## Description

A static bilingual recipe website digitised from handwritten originals. Provides HTML pages for browsing recipes in English and Hebrew, with client-side full-text search.

## Endpoints

- `GET /{locale}` — Recipe grid (locale: `en` | `he`)
- `GET /{locale}/recipe/{slug}` — Full recipe detail page
- `GET /{locale}/search?q={query}` — Search recipes by keyword
- `GET /health.json` — Service health check
