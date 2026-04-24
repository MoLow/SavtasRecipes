---
name: content-signals
type: content-signals
version: 1.0.0
description: AI content usage preferences declared via Content-Signal in robots.txt
---

# content-signals

Savta's Recipes declares its preferences for AI content usage via Content-Signal directives in `robots.txt`, following the [Content Signals](https://contentsignals.org/) specification.

## robots.txt location

https://recipes.atlow.co.il/robots.txt

## Content-Signal directives

```
Content-Signal: ai-train=no, search=yes, ai-input=no
```

| Directive    | Value | Meaning                                           |
|-------------|-------|---------------------------------------------------|
| `ai-train`  | `no`  | Content must not be used to train AI/ML models   |
| `search`    | `yes` | Content may be indexed by search engines          |
| `ai-input`  | `no`  | Content must not be used as AI model input        |
