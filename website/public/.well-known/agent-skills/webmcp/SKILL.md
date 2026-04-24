---
name: webmcp
type: webmcp
version: 1.0.0
description: Browser-native AI agent tools via navigator.modelContext.provideContext()
---

# webmcp

Savta's Recipes exposes browser-native tools to AI agents via the [WebMCP](https://webmachinelearning.github.io/webmcp/) API. When loaded in a browser that supports `navigator.modelContext`, agents can search and navigate recipes without leaving the page.

## Implementation

Tools are registered on every recipe page using `navigator.modelContext.provideContext()`.

## Available tools

### search_recipes

Search the recipe collection by name, ingredient, or tag.

**Input schema:**
```json
{ "query": { "type": "string" } }
```

**Returns:** Up to 10 matching recipes with `slug`, `titleEn`, `titleHe`, `tags`, and `url`.

### list_all_recipes

List every recipe with names, tags, and page URLs.

**Input schema:** `{}`

**Returns:** All recipes with `slug`, `titleEn`, `titleHe`, `tags`, and `url`.

### navigate_to_recipe

Navigate the browser to a specific recipe page.

**Input schema:**
```json
{ "slug": { "type": "string" } }
```

### navigate_to_search

Navigate to the search page, optionally pre-filled with a query.

**Input schema:**
```json
{ "query": { "type": "string" } }
```
