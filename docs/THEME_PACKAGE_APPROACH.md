# Eleventy Theme Package Approach

## Goal

Separate the **template/theme** from **content** to enable:
- Reusable themes across multiple blogs
- Easy theme updates (`npm update`)
- Focus on content, not build configuration
- Community theme ecosystem

## Architecture

### Package Structure

```
eleventy-theme-simple-blog/              # Published as npm package
├── lib/
│   ├── index.js                         # Main export
│   ├── config.js                        # Eleventy configuration factory
│   ├── filters.js                       # Nunjucks filters
│   ├── transforms.js                    # HTML transforms
│   └── shortcodes.js                    # Nunjucks shortcodes
├── layouts/
│   ├── base.njk
│   ├── post.njk
│   └── home.njk
├── includes/
│   └── partials/
│       └── postslist.njk
├── styles/
│   ├── main.scss                        # Theme base styles
│   ├── _variables.scss                  # CSS custom properties
│   ├── _base.scss
│   ├── _layout.scss
│   └── components/
│       └── _post-card.scss
├── scripts/
│   └── main.js                          # Theme JS
├── public/                              # Theme static assets
│   └── fonts/
└── package.json
```

### Content Repo Structure

```
my-blog/                                  # User's blog
├── content/
│   ├── posts/                           # Blog posts
│   │   ├── my-first-post.md
│   │   └── my-second-post.md
│   ├── pages/                           # Static pages
│   │   ├── about.md
│   │   └── contact.md
│   └── _data/
│       └── site.js                      # Site-specific data
├── overrides/                           # Theme customizations
│   ├── layouts/
│   │   └── base.njk                     # Override theme layout
│   └── styles/
│       └── custom.scss                  # Additional styles
├── public/                              # Site-specific static files
│   ├── images/
│   └── favicon.ico
├── eleventy.config.js                   # Minimal config
├── package.json                         # Depends on theme
├── .env                                 # Site settings
└── README.md
```

## Implementation

### 1. Theme Package (eleventy-theme-simple-blog)

**package.json:**

```json
{
  "name": "eleventy-theme-simple-blog",
  "version": "1.0.0",
  "type": "module",
  "main": "lib/index.js",
  "exports": {
    ".": "./lib/index.js",
    "./config": "./lib/config.js",
    "./layouts": "./layouts",
    "./styles": "./styles"
  },
  "files": [
    "lib",
    "layouts",
    "includes",
    "styles",
    "scripts",
    "public"
  ],
  "peerDependencies": {
    "@11ty/eleventy": "^3.0.0"
  },
  "dependencies": {
    "@11ty/eleventy-plugin-vite": "^7.0.0",
    "luxon": "^3.0.0",
    "markdown-it": "^14.0.0"
  }
}
```

**lib/index.js (main export):**

```js
import { createConfig } from './config.js';
import filters from './filters.js';
import transforms from './transforms.js';
import shortcodes from './shortcodes.js';

export { createConfig, filters, transforms, shortcodes };

// Default export for simple usage
export default createConfig;
```

**lib/config.js (Eleventy config factory):**

```js
import path from 'path';
import { fileURLToPath } from 'url';
import EleventyVitePlugin from '@11ty/eleventy-plugin-vite';
import filters from './filters.js';
import transforms from './transforms.js';
import shortcodes from './shortcodes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themePath = path.resolve(__dirname, '..');

export function createConfig(userOptions = {}) {
  return function(eleventyConfig) {
    // Merge user options with defaults
    const options = {
      layoutsDir: path.join(themePath, 'layouts'),
      includesDir: path.join(themePath, 'includes'),
      contentDir: 'content',
      outputDir: '_site',
      overridesDir: 'overrides',
      ...userOptions
    };

    // Add theme layouts
    eleventyConfig.addLayoutAlias('base', path.join(options.layoutsDir, 'base.njk'));
    eleventyConfig.addLayoutAlias('post', path.join(options.layoutsDir, 'post.njk'));

    // Add includes paths (theme + user overrides)
    eleventyConfig.addIncludesDirectory(options.includesDir);
    if (options.overridesDir) {
      eleventyConfig.addIncludesDirectory(path.join(options.overridesDir, 'layouts'));
    }

    // Register filters
    Object.entries(filters).forEach(([name, fn]) => {
      eleventyConfig.addFilter(name, fn);
    });

    // Register transforms
    Object.entries(transforms).forEach(([name, fn]) => {
      eleventyConfig.addTransform(name, fn);
    });

    // Register shortcodes
    Object.entries(shortcodes).forEach(([name, fn]) => {
      eleventyConfig.addShortcode(name, fn);
    });

    // Vite plugin for asset bundling
    eleventyConfig.addPlugin(EleventyVitePlugin, {
      viteOptions: {
        build: {
          rollupOptions: {
            input: {
              main: path.join(themePath, 'scripts/main.js'),
            },
          },
        },
        css: {
          preprocessorOptions: {
            scss: {
              // Allow importing from theme and user overrides
              includePaths: [
                path.join(themePath, 'styles'),
                path.join(process.cwd(), options.overridesDir, 'styles'),
              ],
            },
          },
        },
      },
    });

    // Copy theme public files
    eleventyConfig.addPassthroughCopy({
      [path.join(themePath, 'public')]: '/',
    });

    return {
      dir: {
        input: options.contentDir,
        output: options.outputDir,
        includes: '../' + options.includesDir,
        layouts: '../' + options.layoutsDir,
      },
      templateFormats: ['md', 'njk', 'html'],
      htmlTemplateEngine: 'njk',
      markdownTemplateEngine: 'njk',
    };
  };
}
```

### 2. User Blog Configuration

**eleventy.config.js (user's blog):**

```js
import createThemeConfig from 'eleventy-theme-simple-blog';

export default function(eleventyConfig) {
  // Apply theme configuration
  const themeConfig = createThemeConfig({
    contentDir: 'content',
    outputDir: '_site',
    overridesDir: 'overrides',
  });

  const config = themeConfig(eleventyConfig);

  // Add user-specific customizations
  eleventyConfig.addFilter('myCustomFilter', (value) => {
    return value.toUpperCase();
  });

  // User can still add their own plugins
  // eleventyConfig.addPlugin(myCustomPlugin);

  return config;
}
```

**package.json (user's blog):**

```json
{
  "name": "my-awesome-blog",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "eleventy --serve",
    "build": "eleventy"
  },
  "dependencies": {
    "@11ty/eleventy": "^3.0.0",
    "eleventy-theme-simple-blog": "^1.0.0"
  }
}
```

### 3. Theme Customization System

**User overrides (optional):**

```
my-blog/overrides/
├── layouts/
│   └── base.njk          # Overrides theme's base.njk
├── styles/
│   └── custom.scss       # Additional styles
└── scripts/
    └── custom.js         # Additional JS
```

**How overrides work:**

1. **Layouts:** Eleventy's include paths check overrides first
2. **Styles:** SCSS `@use` checks multiple paths
3. **Scripts:** User's main.js can import theme + custom

**content/_data/site.js (user configuration):**

```js
export default {
  title: "My Awesome Blog",
  description: "Thoughts on web development",
  url: "https://myblog.com",
  author: {
    name: "Jane Doe",
    email: "jane@example.com",
  },
  // Theme settings
  theme: {
    colorScheme: "dark",
    showReadingTime: true,
    postsPerPage: 10,
  }
};
```

## Publishing the Theme

### Option 1: npm Registry

```bash
cd eleventy-theme-simple-blog
npm publish
```

Users install:
```bash
npm install eleventy-theme-simple-blog
```

### Option 2: GitHub Packages (Private)

```json
// User's package.json
{
  "dependencies": {
    "eleventy-theme-simple-blog": "github:yourusername/eleventy-theme-simple-blog"
  }
}
```

### Option 3: Monorepo (Local Development)

```
eleventy-projects/
├── packages/
│   ├── theme-simple-blog/
│   └── theme-portfolio/
└── sites/
    ├── my-blog/
    └── my-portfolio/
```

Use npm workspaces or pnpm workspace.

## Migration Path

### Phase 1: Simplify Current Starter
1. Follow SIMPLIFICATION_PLAN.md
2. Remove per-page bundling
3. Consolidate to global bundles
4. Test thoroughly

### Phase 2: Extract Theme Package
1. Create new repo: `eleventy-theme-simple-blog`
2. Move layouts, includes, styles, scripts to theme
3. Extract filters, transforms, shortcodes to `lib/`
4. Create `lib/config.js` with configuration factory
5. Publish to npm or GitHub

### Phase 3: Convert Starter to Content Repo
1. Create new `content/` directory
2. Move posts and pages
3. Create `overrides/` for customizations
4. Update `package.json` to depend on theme
5. Minimal `eleventy.config.js` that imports theme

## Benefits

✅ **For Theme Authors:**
- Build once, reuse for multiple sites
- Easy to maintain (one codebase)
- Can version and update independently
- Community can contribute themes

✅ **For Content Creators:**
- Focus on writing, not configuration
- Update theme with `npm update`
- Override only what you need
- Easy to switch themes

✅ **For the Ecosystem:**
- Shareable, composable themes
- Best practices baked in
- Lower barrier to entry
- Eleventy becomes more accessible

## Real-World Examples

This pattern is used successfully in:
- **Jekyll** (theme gems)
- **Hugo** (theme modules)
- **WordPress** (themes in plugins)
- **Gatsby** (theme packages)

Eleventy can adopt similar patterns while staying minimal and flexible.

## Next Steps

1. **Start with simplification** (see SIMPLIFICATION_PLAN.md)
2. **Test simplified approach** on current blog
3. **Extract theme** when you're happy with structure
4. **Publish** as open source theme
5. **Iterate** based on feedback

Would you like a starter theme package scaffold?
