You are grouping scanned recipe pages. Below are filenames and text snippets from handwritten recipe scans.

Some pages may be continuations of the same recipe (e.g., front/back of a page, or a long recipe on 2 sheets).

Group them by recipe. Pages of the same recipe will have:
- The same or related recipe title
- Continuation of ingredients or instructions (e.g., one page has ingredients, the next has instructions)
- Similar handwriting context or references to the same dish

Return a JSON array of groups. Each group is an array of filenames, ordered by page sequence (title/ingredients page first, instructions/continuation page second):

[["file1.heic"], ["file2.heic", "file3.heic"], ...]

Rules:
- Every filename must appear in exactly one group
- Most recipes are a single page — only group pages that clearly belong together
- When in doubt, keep pages separate (it's better to have two incomplete recipes than one merged mess)
- Return ONLY valid JSON, no additional text

Scans:
