# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
bundle install

# Serve locally with live reload (available at http://localhost:4000)
bundle exec jekyll serve

# Build for production (output to _site/)
JEKYLL_ENV=production bundle exec jekyll build

# Include future-dated posts during build
bundle exec jekyll serve --future
```

## Architecture

This is a personal website for Łukasz Łepecki (lepecki.com), built on the **Beautiful Jekyll** theme (v6.0.1) and deployed to **Cloudflare Pages** via `.cloudflare-pages-build.sh`.

### Configuration

All site-wide settings live in `_config.yml`: navbar links, social network links, color scheme, analytics (Cloudflare), and Jekyll build options. This is the primary file for site-wide changes.

### Layout hierarchy

`_layouts/base.html` is the root template — it loads all shared CSS/JS and renders the `<nav>`, `<main>`, and `<footer>` includes. All other layouts inherit from it:

- `default.html` → wraps content in the standard page container with optional hero image
- `page.html` → extends `default`, used for static pages
- `post.html` → extends `default`, adds post metadata, tags, social share, and comments
- `home.html` → extends `default`, renders the paginated post feed
- `minimal.html` → extends `base` directly, used for 404

### Content

- **Pages** — `.md` files at the repo root (`aboutme.md`, `resume.md`, `pgpkey.md`). Front matter controls layout, title, and subtitle.
- **Posts** — `_posts/YYYY-MM-DD-title.md`. Permalink format: `/:year-:month-:day-:title/`. Posts are paginated (5 per page).
- **Resume** — also available as a PDF and raw Markdown under `assets/resumes/`.

### Customization

- `assets/css/custom.css` — the only place for site-specific CSS overrides (loaded via `site-css` in `_config.yml`)
- `_includes/` — reusable partials for analytics, comments, social links, head/nav/footer components
