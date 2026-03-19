# Duplicate Slug Handling

**Date:** 2026-03-19

## Summary

Fixed potential build failure when two recipes produce the same slug (e.g. two recipes both titled "Apple Cake"). `getAllRecipes()` now deduplicates slugs at load time by appending `-2`, `-3`, etc. to collisions. All downstream code (routing, search, static params) works without changes.

## Files Modified
- `website/lib/recipes.ts` — slug deduplication in `getAllRecipes()`
