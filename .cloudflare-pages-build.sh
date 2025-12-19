#!/bin/bash
# Cloudflare Pages build script

# Install dependencies
bundle install

# Build for production
JEKYLL_ENV=production bundle exec jekyll build

# Output directory: _site
