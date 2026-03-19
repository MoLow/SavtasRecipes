# Search Dropdown Keyboard Navigation

**Date:** 2026-03-19

## Summary

Added arrow key navigation to the search dropdown in `SearchInput` component.

## Changes

- **Arrow Down/Up** cycles through results (wraps around at edges)
- **Enter** navigates to the highlighted result, "All results" link, or falls back to search page
- **Mouse hover** syncs the active highlight with keyboard state
- Active index resets when query changes or dropdown closes
- Added ARIA attributes: `role="combobox"`, `role="listbox"`, `role="option"`, `aria-selected`, `aria-activedescendant`
- Active item scrolls into view automatically

## Files Modified
- `website/components/SearchInput.tsx`
