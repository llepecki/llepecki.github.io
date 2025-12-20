# Favicon Documentation

This document describes how the favicon set for lepecki.com was created.

## Generation Details

**Generator:** https://favicon.io/favicon-generator/

**Configuration:**
- **Font:** Open Sans
- **Color:** #FFFFFF (white)
- **Background:** #0078D4 (Azure blue)
- **Shape:** Circle

## Generated Files

The favicon package includes the following files:

1. `favicon.ico` - Multi-resolution favicon for browsers
2. `favicon-16x16.png` - 16x16 favicon
3. `favicon-32x32.png` - 32x32 favicon
4. `apple-touch-icon.png` - 180x180 icon for iOS/Safari
5. `android-chrome-192x192.png` - 192x192 icon for Android Chrome
6. `android-chrome-512x512.png` - 512x512 icon for Android Chrome
7. `site.webmanifest` - Web app manifest (customized with site branding)

## Customizations

The `site.webmanifest` file has been customized from the generated version to include:
- Site name: "Lukasz Lepecki"
- Short name: "L. Lepecki"
- Theme color: #0078D4 (site brand color - Azure blue)
- Background color: #0078D4

## Updating Favicons

To update the favicon:

1. Visit https://favicon.io/favicon-generator/
2. Configure with:
   - Font: Open Sans
   - Text color: #FFFFFF (white)
   - Background: #0078D4 (Azure blue)
   - Shape: Circle
   - Desired text/settings
3. Download the generated package
4. Extract all files
5. Update `site.webmanifest` with site branding (name, theme color)
6. Copy all files to the repository root
7. Jekyll will automatically include them in the build

## Notes

- All favicon files are in the repository root
- Files are automatically copied to `_site/` during Jekyll build
- The manifest is referenced in `_includes/head.html`
