# Lumberly

Lumber package takeoff tool for stick framing. Generates material lists for estimators to submit to lumber yards.

**Live at:** [lumberly.poschventures.com](https://lumberly.poschventures.com)

---

## Develop locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

---

## Build

```bash
npm run build
```

Output goes to `dist/`.

---

## Deploy to Cloudflare Pages

1. Push this repo to GitHub
2. In Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Select the repo
4. Build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. After deploy, add custom domain: **lumberly.poschventures.com**

---

## Project structure

- `src/App.tsx` – Main app
- `src/index.css` – Global styles
- `src/components/` – ProjectForm, MaterialList
- `src/utils/` – calculations, export
- `src/types.ts` – Shared types
- `index.html` – Entry HTML
