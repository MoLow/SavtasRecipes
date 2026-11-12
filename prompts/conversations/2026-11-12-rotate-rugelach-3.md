# Rotate rugelach-3 scan (issue #150)

- Issue: rotate the recipe card image for `/en/recipe/rugelach-3` 90° clockwise.
- Slug `rugelach-3` is a deduplicated slug (third recipe with slug `rugelach`, in filename order) -> recipe `4ab10901-e269-40f2-b711-ac2e5b598a89`.
- Ran `pipeline/src/skills/rotate-cli.ts 4ab10901-e269-40f2-b711-ac2e5b598a89 90`, rotating `data/scans/4ab10901-...-0.jpg`.
