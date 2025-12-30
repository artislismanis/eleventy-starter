# Simplified Per-Page Bundles with Overrides

## Goal

Maintain per-page customization capability (D3.js, Prism, etc.) while drastically simplifying the implementation.

## Philosophy

**Explicit over Automatic:**
- No auto-generation of empty files
- Page bundles are opt-in, not automatic
- Template explicitly declares what it needs
- Convention-based file discovery

## Architecture

### 1. Two-Tier Bundle System

**Tier 1: Global Bundle (Always Loaded)**
```
src/assets/
├── styles/main.scss              # Base styles, layout, common components
└── scripts/main.js               # Core functionality
```

**Tier 2: Page Bundles (Opt-In)**
```
src/assets/
├── styles/pages/
│   ├── data-viz.scss             # Only created when needed
│   └── code-demo.scss
└── scripts/pages/
    ├── data-viz.js               # Imports D3.js + chart code
    └── code-demo.js              # Imports Prism + demo logic
```

### 2. Template-Driven Loading

**In your template front matter:**

```yaml
---
title: "Data Visualization Demo"
pageBundle: data-viz              # Loads data-viz.css and data-viz.js
---
```

**Or for multiple bundles:**

```yaml
---
title: "Complex Page"
pageBundles:
  - code-highlighting
  - interactive-charts
---
```

**Base layout handles loading:**

```njk
{# layouts/base.njk #}
<!DOCTYPE html>
<html>
<head>
  {# Global bundle - always loaded #}
  <link rel="stylesheet" href="/assets/css/main.css">

  {# Page-specific bundles - conditional #}
  {% if pageBundle %}
    <link rel="stylesheet" href="/assets/css/{{ pageBundle }}.css">
  {% endif %}
  {% if pageBundles %}
    {% for bundle in pageBundles %}
      <link rel="stylesheet" href="/assets/css/{{ bundle }}.css">
    {% endfor %}
  {% endif %}
</head>
<body>
  {{ content | safe }}

  {# Global JS #}
  <script src="/assets/js/main.js" defer></script>

  {# Page-specific JS #}
  {% if pageBundle %}
    <script src="/assets/js/{{ pageBundle }}.js" defer></script>
  {% endif %}
  {% if pageBundles %}
    {% for bundle in pageBundles %}
      <script src="/assets/js/{{ bundle }}.js" defer></script>
    {% endfor %}
  {% endif %}
</body>
</html>
```

### 3. Creating Page Bundles (Manual, As Needed)

**Example: Data Visualization Page**

**Step 1: Create the page bundle files**

```scss
// src/assets/styles/pages/data-viz.scss
@use '../variables';

// Page-specific styles
.chart-container {
  height: 500px;
  margin: 2rem 0;
}

.tooltip {
  position: absolute;
  background: var(--color-bg-tooltip);
  padding: 0.5rem;
  border-radius: 4px;
  pointer-events: none;
}
```

```js
// src/assets/scripts/pages/data-viz.js

// Import D3.js only for this page
import * as d3 from 'd3';

// Your chart code
export function createBarChart(selector, data) {
  const svg = d3.select(selector)
    .append('svg')
    .attr('width', 800)
    .attr('height', 500);

  // ... chart logic
}

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.chart-container')) {
    createBarChart('.chart-container', window.chartData);
  }
});
```

**Step 2: Configure Vite to discover page bundles**

```js
// utils/get-page-bundles.mjs
import { globSync } from 'glob';
import path from 'path';

export function getPageBundleEntries() {
  const entries = {
    main: path.resolve(process.cwd(), 'src/assets/scripts/main.js'),
  };

  // Auto-discover page bundles from scripts/pages/*.js
  const pageBundles = globSync('src/assets/scripts/pages/*.js');

  pageBundles.forEach(file => {
    const name = path.basename(file, '.js');
    entries[name] = path.resolve(process.cwd(), file);
  });

  return entries;
}
```

```js
// eleventy.config.mjs
import { getPageBundleEntries } from './utils/get-page-bundles.mjs';

// Vite config
eleventyConfig.addPlugin(EleventyVitePlugin, {
  viteOptions: {
    build: {
      rollupOptions: {
        input: getPageBundleEntries(), // Discovers bundles automatically
      },
    },
  },
});
```

**Step 3: Use in your template**

```md
---
layout: base
title: "Sales Dashboard"
pageBundle: data-viz
---

# Sales Dashboard

<div class="chart-container" id="sales-chart"></div>

<script>
  // Data passed to the bundle
  window.chartData = {{ salesData | dump | safe }};
</script>
```

### 4. Common Page Bundles

**Code Highlighting Bundle**

```js
// src/assets/scripts/pages/code-highlighting.js
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';

document.addEventListener('DOMContentLoaded', () => {
  Prism.highlightAll();
});
```

```scss
// src/assets/styles/pages/code-highlighting.scss
@use '../vendor/prism';

// Custom code block styling
pre[class*="language-"] {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

**Usage:**
```yaml
---
layout: post
title: "JavaScript Tips"
pageBundle: code-highlighting
---
```

**Interactive Form Bundle**

```js
// src/assets/scripts/pages/contact-form.js
import { validateEmail, validatePhone } from '../utils/validation';

const form = document.querySelector('#contact-form');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  // Form logic
});
```

### 5. Component-Based Imports (Keep Your Smart Detection)

**Option A: Manual imports in page bundles**

```scss
// src/assets/styles/pages/about.scss
@use '../components/team-grid';
@use '../components/timeline';

.page-about {
  // Page-specific overrides
}
```

**Option B: Keep automatic detection (simplified)**

```js
// utils/scan-components.mjs
import { globSync } from 'glob';
import fs from 'fs';

export function getComponentsForPage(templatePath) {
  const content = fs.readFileSync(templatePath, 'utf-8');
  const components = new Set();

  const regex = /data-component=["']([^"']+)["']/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    components.add(match[1]);
  }

  return Array.from(components);
}
```

Generate one SCSS file per page that needs components:

```scss
// src/assets/styles/pages/about.scss (auto-generated)
// Components detected: team-grid, timeline
@use '../components/team-grid';
@use '../components/timeline';
```

But only generate when `data-component` is detected (not for every page).

### 6. Development Workflow

**Creating a new page with custom functionality:**

```bash
# 1. Create content
touch src/pages/my-viz-page.md

# 2. Create page bundle (only if needed)
touch src/assets/scripts/pages/my-viz.js
touch src/assets/styles/pages/my-viz.scss

# 3. Install dependencies (if needed)
npm install d3

# 4. Reference bundle in front matter
# (edit my-viz-page.md)

# 5. Build discovers it automatically
npm run dev
```

**No generation step needed.** Vite automatically picks up new files in `pages/` directory.

## Comparison: Before vs After

### Before (Current System)

**Pros:**
- Automatic component detection ✅
- Everything is generated ✅

**Cons:**
- 48 files generated for 8 pages ❌
- Three-layer system confusing ❌
- Files created even when empty ❌
- Hard to understand what's happening ❌

### After (Explicit Opt-In)

**Pros:**
- Only create files when needed ✅
- Explicit and understandable ✅
- Still supports per-page bundles ✅
- Component detection (optional) ✅
- Easy to see what each page loads ✅

**Cons:**
- Manual file creation (but only when needed) ⚠️
- Less "magical" (but more predictable) ⚠️

## Migration Strategy

### Phase 1: Add Explicit Loading to Templates

```diff
# src/pages/blog/data-visualization.md
---
layout: post
title: "Data Visualization"
+ pageBundle: data-viz
---
```

### Phase 2: Create Bundles for Pages That Need Them

```bash
# Move D3.js code to page bundle
mv src/assets/scripts/d3-charts.js src/assets/scripts/pages/data-viz.js

# Move Prism code to page bundle
mv src/assets/scripts/syntax-highlighting.js src/assets/scripts/pages/code-highlighting.js
```

### Phase 3: Update Vite Config

Replace `getDynamicEntries()` with `getPageBundleEntries()` (simpler version).

### Phase 4: Remove Auto-Generation

Delete `utils/generate-page-styles.mjs` and the `eleventy.before` hook.

### Phase 5: Clean Up

Remove `_generated/` and `_custom/` directories. Keep only files you actually use.

## Real-World Examples

**Blog post with code examples:**
```yaml
---
pageBundle: code-highlighting
---
```
Loads: Prism.js + syntax theme (~30KB)

**Data visualization article:**
```yaml
---
pageBundle: data-viz
---
```
Loads: D3.js + chart code (~150KB)

**Simple about page:**
```yaml
---
# No pageBundle specified
---
```
Loads: Only global bundle (~20KB)

**Complex demo page:**
```yaml
---
pageBundles:
  - code-highlighting
  - data-viz
  - interactive-forms
---
```
Loads: Multiple specialized bundles as needed

## Benefits

1. **Keep code splitting** - D3.js only loads where needed ✅
2. **Simpler mental model** - No auto-generation magic ✅
3. **Explicit dependencies** - Clear what each page needs ✅
4. **No wasted files** - Only create what you use ✅
5. **Easy to debug** - Follow the imports directly ✅
6. **Theme-package ready** - Clear separation of concerns ✅

## Recommendation

Start with this approach:

1. **Global bundle** for common styles/scripts
2. **Page bundles** created manually only when needed
3. **Template declares** what it needs via front matter
4. **Vite discovers** bundles automatically from directory
5. **Optional:** Keep component detection for common components

This gives you **flexibility without complexity**.
