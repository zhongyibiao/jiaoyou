# Project jiaoyou

## Hooks

When editing frontend files (js, jsx, ts, tsx), run ESLint automatically:
```json
{
  "on": "PostfixEdit",
  "match": "**/*.{js,jsx,ts,tsx}",
  "do": "npx eslint --fix {file}"
}
```