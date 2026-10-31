# Phenobasecd phenobase
bash ../fix-issues.sh
npm install
npm run build# Issue Effect
1 app/world/page.tsx imports unused worldSpots Silent today; breaks the moment you add ESLint
2 app/layout.tsx has no metadataBase, no openGraph, no twitter Social cards render blank; build warns
3 og-image.png referenced by README but never created 404s when shared{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out", ".next"]
}/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be editednode_modules/
.next/
out/
.DS_Store
*.log
.env*
!.env.examplenode_modules
.next
out
.git
.gitignore
.DS_Store
npm-debug.log*# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Try exact path, then .html, then directory index, then 404
  location / {
    try_files $uri $uri.html $uri/index.html $uri/ /404.html;
  }

  location /_next/static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location ~ \.html$ {
    add_header Cache-Control "public, max-age=0, must-revalidate";
  }
}services:
  phenobase:
    build: .
    ports:
      - "8080:80"
    restart: unless-stoppedcd phenobase
docker compose up --build
# open http://localhost:8080#!/usr/bin/env bash
# verify-phenobase.sh — sanity-check + small patches for the extracted PhenoBase tree.
# Usage: bash verify-phenobase.sh [--build] [dir]
set -uo pipefail

BUILD=0
DIR="."
for arg in "$@"; do
  case "$arg" in
    --build) BUILD=1 ;;
    *) DIR="$arg" ;;
  esac
done

cd "$DIR" || { echo "No such directory: $DIR"; exit 1; }
[ -f package.json ] || { echo "Run inside phenobase/ (no package.json found)"; exit 1; }

fail=0
ok()  { printf '  \033[32m✓\033[0m %s\n' "$1"; }
bad() { printf '  \033[31m✗\033[0m %s\n' "$1"; fail=$((fail+1)); }

check_file() {
  if [ -s "$1" ]; then ok "$1"; else bad "missing/empty: $1"; fi
}

echo "== Checking expected files =="
files=(
  README.md OUTREACH_PITCH.md package.json next.config.mjs
  app/layout.tsx app/page.tsx app/globals.css
  app/articles/page.tsx "app/articles/[slug]/page.tsx"
  app/basket/page.tsx app/breeder/page.tsx app/guide/page.tsx
  app/heritage/page.tsx app/lab/page.tsx
  app/legal/disclosure/page.tsx
  app/lineages/page.tsx "app/lineages/[slug]/page.tsx"
  app/strains/page.tsx "app/strains/[slug]/page.tsx"
  app/world/page.tsx
  components/AgeGate.tsx components/BreedingLab.tsx components/BuyLinks.tsx
  components/LineageStarMap.tsx components/StrainSearch.tsx components/WorldGlobe.tsx
  data/articles.ts data/heritage.ts data/lineages.ts data/registry.ts
  data/strains.ts data/worldAll.ts data/worldSpots.ts
  public/images/hero-starmap.png
)
for f in "${files[@]}"; do check_file "$f"; done

echo
echo "== Base64 heredoc leakage =="
if grep -RIn "<<'EOF_" --include='*.ts' --include='*.tsx' --include='*.md' --include='*.json' . >/dev/null 2>&1; then
  bad "base64 marker <<'EOF_ found inside a decoded file"
else
  ok "no heredoc markers in decoded files"
fi

echo
echo "== PNG signature =="
if head -c 8 public/images/hero-starmap.png | od -An -tx1 | grep -q "89 50 4e 47 0d 0a 1a 0a"; then
  ok "hero-starmap.png has valid PNG signature"
else
  bad "hero-starmap.png does not look like a PNG"
fi

echo
echo "== Applying small patches =="

# (a) import globals.css in layout — the real bug in the installer
if grep -q 'globals\.css' app/layout.tsx; then
  ok "layout already imports globals.css"
else
  { echo 'import "./globals.css";'; cat app/layout.tsx; } > app/layout.tsx.tmp \
    && mv app/layout.tsx.tmp app/layout.tsx
  ok "patched app/layout.tsx to import globals.css"
fi

# (b) og-image.png referenced by README but never generated
if [ ! -s public/images/og-image.png ]; then
  cp public/images/hero-starmap.png public/images/og-image.png
  ok "created public/images/og-image.png from hero"
else
  ok "og-image.png present"
fi

# (c) .gitignore
if [ -f .gitignore ]; then ok ".gitignore present"; else
  cat > .gitignore <<'EOF'
node_modules/
.next/
out/
.DS_Store
*.log
.env*
!.env.example
EOF
  ok "created .gitignore"
fi

# (d) tsconfig.json
if [ -f tsconfig.json ]; then ok "tsconfig.json present"; else
  cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out", ".next"]
}
EOF
  ok "created tsconfig.json"
fi

# (e) next-env.d.ts
if [ -f next-env.d.ts ]; then ok "next-env.d.ts present"; else
  cat > next-env.d.ts <<'EOF'
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
EOF
  ok "created next-env.d.ts"
fi

echo
if [ "$fail" -gt 0 ]; then
  echo "❌ $fail issue(s) found — review above before building."
else
  echo "✅ All structural checks passed."
fi

if [ "$BUILD" -eq 1 ]; then
  echo
  echo "== npm install + npm run build =="
  npm install
  npm run build
  echo "Build output in ./out"
fi

exit "$fail"#!/usr/bin/env bash
# fix-issues.sh — patches the three known post-install issues in PhenoBase.
# Usage: cd phenobase && bash ../fix-issues.sh
set -euo pipefail

[ -f package.json ] || { echo "Run from inside phenobase/ (no package.json here)"; exit 1; }

echo "== 1. Remove unused worldSpots import =="
if grep -q 'import { worldSpots } from "@/data/worldSpots";' app/world/page.tsx 2>/dev/null; then
  grep -v 'import { worldSpots } from "@/data/worldSpots";' \
    app/world/page.tsx > app/world/page.tsx.tmp
  mv app/world/page.tsx.tmp app/world/page.tsx
  echo "   ✓ removed"
else
  echo "   ✓ already clean"
fi

echo "== 2. Patch app/layout.tsx (globals.css + metadataBase + openGraph) =="
if grep -q 'metadataBase' app/layout.tsx 2>/dev/null; then
  echo "   ✓ already patched — skipping"
else
  cp app/layout.tsx app/layout.tsx.bak
  cat > app/layout.tsx <<'EOF'
import type { Metadata } from "next";
import "./globals.css";
import AgeGate from "@/components/AgeGate";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://phenobase.vercel.app"
  ),
  title: {
    default: "PhenoBase — Cannabis Strain Genetics, Lineages & Breeding",
    template: "%s | PhenoBase",
  },
  description:
    "Honest strain reviews, a 3D genetic star map, traceable lineage trees and a complete home breeding guide.",
  openGraph: {
    title: "PhenoBase — Cannabis Strain Genetics, Lineages & Breeding",
    description:
      "Honest strain reviews, a 3D genetic star map, traceable lineage trees and a complete home breeding guide.",
    images: [{ url: "/images/og-image.png", width: 1024, height: 1024 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PhenoBase — Cannabis Strain Genetics, Lineages & Breeding",
    description:
      "Honest strain reviews, a 3D genetic star map, traceable lineage trees and a complete home breeding guide.",
    images: ["/images/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AgeGate />
        <header>
          <a href="/">PhenoBase</a>
          <nav>
            <a href="/articles">Guides</a>
            <a href="/strains">Strains</a>
            <a href="/lineages">Star Map</a>
            <a href="/world">World Map</a>
            <a href="/heritage">Lost Lines</a>
            <a href="/basket">Basket</a>
            <a href="/lab">Breeding Lab</a>
            <a href="/breeder">Breed Your Own</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <p>
            <a href="/legal/disclosure">Affiliate Disclosure:</a> PhenoBase earns
            commissions from qualifying purchases. 21+ / check your local laws.
          </p>
        </footer>
      </body>
    </html>
  );
}
EOF
  echo "   ✓ patched (backup at app/layout.tsx.bak)"
fi

echo "== 3. Ensure og-image.png exists =="
if [ ! -s public/images/og-image.png ]; then
  cp public/images/hero-starmap.png public/images/og-image.png
  echo "   ✓ created from hero"
else
  echo "   ✓ already present"
fi

echo
echo "All fixes applied. Now run:"
echo "  npm install && npm run build"  import WorldGlobe from "@/components/WorldGlobe";
  import { allSpots } from "@/data/worldAll";
- import { worldSpots } from "@/data/worldSpots";  import type { Metadata } from "next";
+ import "./globals.css";
  import AgeGate from "@/components/AgeGate";

  export const metadata: Metadata = {
+   metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://phenobase.vercel.app"),
    title: { ... },
    description: "...",
+   openGraph: { images: [{ url: "/images/og-image.png", ... }], type: "website" },
+   twitter:   { card: "summary_large_image", images: ["/images/og-image.png"] },
  };# one-time, from inside phenobase/
git init
git add -A
git commit -m "PhenoBase initial"
gh repo create phenobase --public --source=. --push
# or: create the repo manually on github.com, then:
#   git remote add origin git@github.com:you/phenobase.git
#   git push -u origin main# PhenoBase

A cannabis genetics content and exploration platform - strain reviews, lineage visualization, heritage archives, and breeding tools built for the cannabis community.

## Features

- **20+ strain reviews** - detailed, honest reviews across popular genetics
- **Star Map** - interactive 3D lineage visualization tracing strain family trees (zero dependencies, pure canvas)
- **Cannabis Planet World Globe** - 30 locations mapped showing global cannabis culture
- **Lost Lines** - heritage archive of discontinued and historically significant genetics
- **Breeding Lab** - cross projector and personal breeding registry
- **Seed basket** - affiliate-based seed checkout (no direct payments handled)
- **Strain search** with 21+ age gate

## Tech Stack

- Next.js (static export)
- Deployed on Vercel
- Zero runtime dependencies for the 3D visualizations

## Getting Started

```bash
npm install
npm run build
```

## Disclaimer

Content is intended for adults 21+ (or of legal age in their jurisdiction) and is for informational purposes only. PhenoBase does not sell seeds directly; purchases occur through affiliated retailers where legal.

## License

All rights reserved.Cannabis genetics platform: 20+ strain reviews, 3D lineage Star Map, heritage archives, and a breeding lab. 21+ information only.# PhenoBase

<p align="center">
  <img src="public/hero.jpg" alt="PhenoBase" width="600" />
</p>

A cannabis genetics content and exploration platform - strain reviews, lineage visualization, heritage archives, and breeding tools built for the cannabis community.

## Features

- **20+ strain reviews** - detailed, honest reviews across popular genetics
- **Star Map** - interactive 3D lineage visualization tracing strain family trees (zero dependencies, pure canvas)
- **Cannabis Planet World Globe** - 30 locations mapped showing global cannabis culture
- **Lost Lines** - heritage archive of discontinued and historically significant genetics
- **Breeding Lab** - cross projector and personal breeding registry
- **Seed basket** - affiliate-based seed checkout (no direct payments handled)
- **Strain search** with 21+ age gate

## Tech Stack

- Next.js (static export)
- Deployed on Vercel
- Zero runtime dependencies for the 3D visualizations

## Getting Started

```bash
npm install
npm run build
```

## Roadmap

- [ ] In-depth strain and breeding registry (lineage, grow guides)
- [ ] Cannabinoid range data for every strain
- [ ] Flavor and terpene guide
- [ ] Live affiliate seed availability

## Disclaimer

Content is intended for adults 21+ (or of legal age in their jurisdiction) and is for informational purposes only. PhenoBase does not sell seeds directly; purchases occur through affiliated retailers where legal.

## License

All rights reserved.cannabis, strains, genetics, breeding, nextjs, strain-reviews, cannabis-community, terpeneMIT License

Copyright (c) 2026 jpwoodside15-jpg

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.node_modules/
.next/
out/
.env
.env.local
.env*.local
.vercel
*.log
.DS_Store
