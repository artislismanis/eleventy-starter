# Practical Example: Simplified Per-Page Bundles

## Scenario

You're building a blog with:
- Regular blog posts (just text and images)
- Technical posts with code examples (need Prism)
- Data visualization posts (need D3.js)
- Contact page with form validation

## File Structure

```
src/
├── pages/
│   ├── blog/
│   │   ├── regular-post.md         # No special bundles
│   │   ├── code-tutorial.md        # Needs code-highlighting
│   │   └── data-story.md           # Needs data-viz
│   ├── contact.md                  # Needs contact-form
│   └── about.md                    # No special bundles
├── assets/
│   ├── styles/
│   │   ├── main.scss              # Global: 20KB
│   │   └── pages/
│   │       ├── code-highlighting.scss   # 5KB
│   │       ├── data-viz.scss            # 3KB
│   │       └── contact-form.scss        # 2KB
│   └── scripts/
│       ├── main.js                # Global: 15KB
│       └── pages/
│           ├── code-highlighting.js     # Prism: 30KB
│           ├── data-viz.js              # D3: 150KB
│           └── contact-form.js          # Validation: 5KB
```

**Result:**
- Regular pages: 35KB (global only)
- Code tutorial: 70KB (global + Prism)
- Data viz: 188KB (global + D3)
- Contact: 42KB (global + validation)

Compare to loading everything globally: **200KB+ on every page**

## Implementation

### 1. Global Bundle (main.scss)

```scss
// src/assets/styles/main.scss
// Loaded on every page - keep it lean

@use 'variables';
@use 'base';
@use 'layout';

// Common components used everywhere
@use 'components/header';
@use 'components/footer';
@use 'components/button';

// Post styles (used on most pages)
@use 'posts';
```

### 2. Page Bundle: Code Highlighting

**Template:**
```markdown
---
layout: post
title: "JavaScript Tips and Tricks"
pageBundle: code-highlighting
tags: post
---

# JavaScript Tips

Here's a cool trick:

```js
const doubled = arr.map(x => x * 2);
```
```

**SCSS:**
```scss
// src/assets/styles/pages/code-highlighting.scss
@use '../vendor/prism';

// Customizations
pre[class*="language-"] {
  margin: 2rem 0;
  border-radius: 8px;
  font-size: 0.9rem;

  // Add copy button styling
  position: relative;

  .copy-button {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
}

// Line highlighting
.line-highlight {
  background: rgba(255, 255, 100, 0.1);
  border-left: 3px solid #ff0;
}
```

**JavaScript:**
```js
// src/assets/scripts/pages/code-highlighting.js
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-css';
import 'prismjs/plugins/line-highlight/prism-line-highlight';
import 'prismjs/plugins/line-numbers/prism-line-numbers';

// Add copy buttons to code blocks
function addCopyButtons() {
  document.querySelectorAll('pre[class*="language-"]').forEach(pre => {
    const button = document.createElement('button');
    button.className = 'copy-button';
    button.textContent = 'Copy';

    button.addEventListener('click', async () => {
      const code = pre.querySelector('code').textContent;
      await navigator.clipboard.writeText(code);
      button.textContent = 'Copied!';
      setTimeout(() => button.textContent = 'Copy', 2000);
    });

    pre.appendChild(button);
  });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  Prism.highlightAll();
  addCopyButtons();
});
```

### 3. Page Bundle: Data Visualization

**Template:**
```markdown
---
layout: post
title: "Sales Data Analysis"
pageBundle: data-viz
chartData: /data/sales-2024.json
---

# Sales Analysis

<div class="chart-container" id="sales-chart"
     data-chart-type="bar"
     data-chart-source="{{ chartData }}">
</div>
```

**SCSS:**
```scss
// src/assets/styles/pages/data-viz.scss
.chart-container {
  min-height: 400px;
  margin: 2rem 0;
  background: var(--color-bg-surface);
  border-radius: 8px;
  padding: 1rem;

  svg {
    width: 100%;
    height: auto;
  }
}

.chart-tooltip {
  position: absolute;
  background: var(--color-bg-tooltip);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 0.5rem;
  pointer-events: none;
  font-size: 0.875rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  .tooltip-label {
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .tooltip-value {
    color: var(--color-text-secondary);
  }
}

.chart-legend {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 2px;
    }
  }
}
```

**JavaScript:**
```js
// src/assets/scripts/pages/data-viz.js
import * as d3 from 'd3';

class ChartManager {
  constructor(container) {
    this.container = d3.select(container);
    this.chartType = container.dataset.chartType || 'bar';
    this.dataSource = container.dataset.chartSource;
  }

  async init() {
    const data = await d3.json(this.dataSource);

    switch(this.chartType) {
      case 'bar':
        this.createBarChart(data);
        break;
      case 'line':
        this.createLineChart(data);
        break;
      case 'pie':
        this.createPieChart(data);
        break;
    }
  }

  createBarChart(data) {
    const margin = {top: 20, right: 20, bottom: 30, left: 40};
    const width = this.container.node().offsetWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = this.container.append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
      .range([0, width])
      .padding(0.1)
      .domain(data.map(d => d.label));

    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(data, d => d.value)]);

    // Bars
    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.label))
      .attr('width', x.bandwidth())
      .attr('y', d => y(d.value))
      .attr('height', d => height - y(d.value))
      .attr('fill', 'steelblue')
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip());

    // Axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));
  }

  showTooltip(event, data) {
    const tooltip = d3.select('body').append('div')
      .attr('class', 'chart-tooltip')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .html(`
        <div class="tooltip-label">${data.label}</div>
        <div class="tooltip-value">${data.value.toLocaleString()}</div>
      `);
  }

  hideTooltip() {
    d3.selectAll('.chart-tooltip').remove();
  }
}

// Auto-initialize charts
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.chart-container').forEach(container => {
    new ChartManager(container).init();
  });
});
```

### 4. Page Bundle: Contact Form

**Template:**
```markdown
---
layout: page
title: "Contact"
pageBundle: contact-form
---

<form id="contact-form" class="contact-form">
  <div class="form-group">
    <label for="name">Name</label>
    <input type="text" id="name" name="name" required>
    <span class="error"></span>
  </div>

  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" required>
    <span class="error"></span>
  </div>

  <button type="submit">Send</button>
</form>
```

**JavaScript:**
```js
// src/assets/scripts/pages/contact-form.js

class ContactForm {
  constructor(form) {
    this.form = form;
    this.submitButton = form.querySelector('button[type="submit"]');
    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Real-time validation
    this.form.querySelectorAll('input').forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
    });
  }

  validateField(input) {
    const errorSpan = input.parentElement.querySelector('.error');

    if (!input.validity.valid) {
      errorSpan.textContent = input.validationMessage;
      input.classList.add('invalid');
      return false;
    }

    errorSpan.textContent = '';
    input.classList.remove('invalid');
    return true;
  }

  async handleSubmit(e) {
    e.preventDefault();

    // Validate all fields
    const inputs = Array.from(this.form.querySelectorAll('input'));
    const allValid = inputs.every(input => this.validateField(input));

    if (!allValid) return;

    // Submit
    this.submitButton.disabled = true;
    this.submitButton.textContent = 'Sending...';

    try {
      const formData = new FormData(this.form);
      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        this.showSuccess();
        this.form.reset();
      } else {
        this.showError('Failed to send. Please try again.');
      }
    } catch (error) {
      this.showError('Network error. Please try again.');
    } finally {
      this.submitButton.disabled = false;
      this.submitButton.textContent = 'Send';
    }
  }

  showSuccess() {
    // Show success message
  }

  showError(message) {
    // Show error message
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#contact-form');
  if (form) new ContactForm(form);
});
```

### 5. Vite Discovery

```js
// utils/get-page-bundles.mjs
import { globSync } from 'glob';
import path from 'path';

export function getPageBundleEntries() {
  const entries = {
    // Main bundle - always included
    main: path.resolve(process.cwd(), 'src/assets/scripts/main.js'),
  };

  // Discover page bundles from scripts/pages/*.js
  const pageBundles = globSync('src/assets/scripts/pages/*.js');

  pageBundles.forEach(file => {
    const name = path.basename(file, '.js');
    entries[name] = path.resolve(process.cwd(), file);
  });

  console.log('📦 Discovered bundles:', Object.keys(entries));

  return entries;
}
```

**Output:**
```
📦 Discovered bundles: [
  'main',
  'code-highlighting',
  'data-viz',
  'contact-form'
]
```

### 6. Base Layout (Updated)

```njk
{# src/_includes/base.njk #}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }} - {{ site.title }}</title>

  {# Global styles - always loaded #}
  <link rel="stylesheet" href="/assets/css/main.css">

  {# Page-specific bundles - conditional loading #}
  {% if pageBundle %}
    <link rel="stylesheet" href="/assets/css/{{ pageBundle }}.css">
  {% endif %}
  {% if pageBundles %}
    {% for bundle in pageBundles %}
      <link rel="stylesheet" href="/assets/css/{{ bundle }}.css">
    {% endfor %}
  {% endif %}
</head>
<body class="page-{{ page.fileSlug }}">
  {% include "partials/header.njk" %}

  <main>
    {{ content | safe }}
  </main>

  {% include "partials/footer.njk" %}

  {# Global JavaScript #}
  <script src="/assets/js/main.js" defer></script>

  {# Page-specific JavaScript #}
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

## Benefits in Practice

**Regular blog post:**
- Loads: main.css (20KB) + main.js (15KB) = **35KB**
- Fast, lightweight

**Code tutorial:**
- Loads: main (35KB) + code-highlighting (35KB) = **70KB**
- Only loads Prism when needed

**Data visualization:**
- Loads: main (35KB) + data-viz (153KB) = **188KB**
- D3.js only on pages that use it

**Contact page:**
- Loads: main (35KB) + contact-form (7KB) = **42KB**
- Form validation only where needed

## Developer Experience

**Adding a new viz page:**

1. Create content with front matter:
   ```yaml
   pageBundle: data-viz
   ```

2. That's it! The bundle is auto-discovered and loaded.

**Creating a new bundle type:**

1. Create the files:
   ```bash
   touch src/assets/scripts/pages/my-feature.js
   touch src/assets/styles/pages/my-feature.scss
   ```

2. Vite automatically discovers them on next build

3. Use in template:
   ```yaml
   pageBundle: my-feature
   ```

**No build scripts to modify. No generation step. Just create files and reference them.**

## Summary

This approach gives you:

✅ **Per-page customization** - D3, Prism, etc. only where needed
✅ **Simple mental model** - Explicit opt-in via front matter
✅ **Auto-discovery** - Vite finds bundles automatically
✅ **No wasted files** - Create only what you use
✅ **Code splitting** - Optimal bundle sizes
✅ **Easy debugging** - Clear dependency chain

**vs. current approach:**
- No three-layer generation system
- No empty file creation
- No complex build hooks
- Same flexibility, 90% less complexity
