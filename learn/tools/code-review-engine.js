import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import js from "@eslint/js";
import { Linter } from "eslint";
import * as espree from "espree";
import globals from "globals";
import * as parse5 from "parse5";
import postcss from "postcss";
import * as prettier from "prettier";

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };
const HTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const LETTER_OR_DIGIT_RE = /[\p{Letter}\p{Number}]/u;
const INLINE_HANDLER_RE = /^on[a-z]+$/;
const INLINE_HANDLER_IN_STRING_RE = /\bon[a-z]+\s*=/i;
const EXTERNAL_FONT_RE = /fonts\.googleapis\.com/i;
const CLICK_LIKE_HANDLER_NAMES = new Set([
  "onclick",
  "onmousedown",
  "onmouseup",
  "onpointerdown",
  "onpointerup",
  "ontouchstart",
  "ontouchend"
]);
const SINGLE_FILE_SIDECAR_EXTENSIONS = [".css", ".js", ".mjs", ".cjs"];
// WHATWG MIME Sniffing "JavaScript MIME type" essence values; a <script type>
// outside this list (and not "module") is a data block, not executable code.
const JS_SCRIPT_MIME_TYPES = new Set([
  "application/ecmascript",
  "application/javascript",
  "application/x-ecmascript",
  "application/x-javascript",
  "text/ecmascript",
  "text/javascript",
  "text/javascript1.0",
  "text/javascript1.1",
  "text/javascript1.2",
  "text/javascript1.3",
  "text/javascript1.4",
  "text/javascript1.5",
  "text/jscript",
  "text/livescript",
  "text/x-ecmascript",
  "text/x-javascript"
]);
// CSS properties whose transitions move content (vestibular triggers); color
// and opacity fades are deliberately excluded so the house-style 0.15s fades
// do not require a prefers-reduced-motion guard.
const MOVEMENT_TRANSITION_PROPERTIES = new Set([
  "transform",
  "translate",
  "scale",
  "rotate",
  "left",
  "top",
  "right",
  "bottom",
  "inset",
  "width",
  "height"
]);
const JS_LINTER = new Linter({ configType: "flat" });
const JS_LINT_RULES = {
  ...js.configs.recommended.rules,
  "no-unused-vars": ["warn", { args: "none", varsIgnorePattern: "^_" }],
  "no-constant-condition": "warn",
  "no-self-compare": "error",
  "no-console": ["warn", { allow: ["warn", "error"] }],
  eqeqeq: ["warn", "smart"],
  "no-template-curly-in-string": "warn",
  "no-var": "warn",
  "prefer-const": ["warn", { destructuring: "all" }]
};
const JS_LINT_GLOBALS = {
  ...globals.browser,
  dagre: "readonly"
};

export async function runCli(argv) {
  const options = parseArgs(argv);

  if (options.help) {
    console.log([
      "Usage:",
      "  npm run code-review -- <app> [--json]",
      "  npm run code-review -- <app>/index.html [--json]",
      "  npm run code-review -- --all [--json]",
      "",
      "Reports structural, formatting, JS/CSS, duplication, and single-file-app policy issues for the apps in this folder."
    ].join("\n"));
    return;
  }

  const cwd = process.cwd();
  const repoFiles = await listHtmlFiles(cwd);
  const targets = options.all
    ? repoFiles
    : [await resolveTarget(cwd, options.target)];

  if (!options.all) {
    const exists = await fileExists(targets[0]);
    if (!exists) {
      throw new Error(`file not found: ${options.target}`);
    }
    if (path.extname(targets[0]).toLowerCase() !== ".html") {
      throw new Error("target must be an .html file or an app folder containing index.html");
    }
  }

  const indexedFiles = uniqueSortedPaths([...repoFiles, ...targets]);
  const repoIndex = await buildRepoIndex(indexedFiles, cwd);
  const reports = [];

  for (const file of targets) {
    reports.push(await reviewFile(file, cwd, repoIndex));
  }

  if (options.json) {
    console.log(JSON.stringify({
      generatedAt: new Date().toISOString(),
      cwd,
      reports
    }, null, 2));
  } else {
    console.log(renderReports(reports));
  }

  process.exitCode = reports.some((report) => report.findings.length > 0) ? 1 : 0;
}

function parseArgs(argv) {
  const options = {
    all: false,
    help: false,
    json: false,
    target: null
  };

  for (const arg of argv) {
    if (arg === "--all") {
      options.all = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`unknown option: ${arg}`);
    }
    if (options.target) {
      throw new Error("pass either one HTML file or --all");
    }
    options.target = arg;
  }

  if (!options.help && !options.all && !options.target) {
    throw new Error("usage: npm run code-review -- <app> [--json] or npm run code-review -- --all [--json]");
  }

  if (options.all && options.target) {
    throw new Error("pass either one HTML file or --all");
  }

  return options;
}

const APP_SCAN_SKIP_DIRS = new Set(["node_modules", "tools", "docs"]);

async function listHtmlFiles(cwd) {
  const entries = await fs.readdir(cwd, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      files.push(path.join(cwd, entry.name));
    } else if (entry.isDirectory() && !APP_SCAN_SKIP_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
      const candidate = path.join(cwd, entry.name, "index.html");
      if (await fileExists(candidate)) {
        files.push(candidate);
      }
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function resolveTarget(cwd, target) {
  const resolved = path.resolve(cwd, target);
  const stats = await fs.stat(resolved).catch(() => null);
  if (stats?.isDirectory()) {
    return path.join(resolved, "index.html");
  }
  return resolved;
}

function uniqueSortedPaths(files) {
  return [...new Set(files)].sort((left, right) => left.localeCompare(right));
}

async function buildRepoIndex(files, cwd) {
  const titleIndex = new Map();

  await Promise.all(files.map(async (file) => {
    const content = normalizeNewlines(await fs.readFile(file, "utf8"));
    const parsed = parseDocument(content);

    const titleText = collectDocumentTitle(parsed.document);
    if (titleText) {
      pushIndexed(titleIndex, titleText, file);
    }
  }));

  const hubContent = await fs.readFile(path.join(cwd, "index.md"), "utf8").catch(() => null);

  return { titleIndex, hubContent };
}

async function reviewFile(file, cwd, repoIndex) {
  const content = normalizeNewlines(await fs.readFile(file, "utf8"));
  const lineStarts = buildLineStarts(content);
  const parsed = parseDocument(content);
  const findings = [];
  const relativeFile = path.relative(cwd, file) || path.basename(file);

  for (const error of parsed.errors) {
    findings.push(makeFinding(relativeFile, {
      severity: "high",
      category: "html",
      ruleId: "html/parse-error",
      line: error.startLine ?? error.line ?? null,
      column: error.startCol ?? error.col ?? null,
      message: `HTML parse error: ${error.code || "invalid markup"}.`
    }));
  }

  const appName = getAppName(cwd, file);
  const htmlState = analyzeHtml(relativeFile, parsed.document, content, findings);
  const styleBlocks = collectBlocks(parsed.document, content, lineStarts, "style");
  const scriptBlocks = collectBlocks(parsed.document, content, lineStarts, "script", { inlineOnly: true, executableOnly: true });
  const scriptState = { referencesI18n: false };

  for (const block of styleBlocks) {
    analyzeCss(relativeFile, block, findings);
  }

  for (const block of scriptBlocks) {
    analyzeScript(relativeFile, block, findings, scriptState);
  }

  await analyzeFormatting(relativeFile, content, findings);
  analyzeDuplication(relativeFile, file, htmlState, repoIndex, findings);
  analyzeConventions(relativeFile, appName, content, htmlState, scriptState, repoIndex, findings);
  analyzeHouseStyle(relativeFile, appName, content, lineStarts, styleBlocks, scriptState, findings);
  await analyzeSingleFilePolicy(relativeFile, file, appName !== null, findings);

  // House-style rules the app's docs/style-drift.md records are known drift:
  // reported as a count so they stay visible, but they do not fail the gate.
  const suppressions = await readDriftSuppressions(file, appName);
  const kept = [];
  const suppressedRuleIds = new Set();
  for (const finding of findings) {
    if (finding.ruleId.startsWith("house/") && suppressions.has(finding.ruleId)) {
      suppressedRuleIds.add(finding.ruleId);
      continue;
    }
    kept.push(finding);
  }

  kept.sort(compareFindings);

  const counts = {
    high: kept.filter((finding) => finding.severity === "high").length,
    medium: kept.filter((finding) => finding.severity === "medium").length,
    low: kept.filter((finding) => finding.severity === "low").length
  };

  return {
    file: relativeFile,
    findings: kept,
    suppressed: [...suppressedRuleIds].sort(),
    summary: {
      total: kept.length,
      ...counts
    }
  };
}

function getAppName(cwd, absoluteFile) {
  const relative = path.relative(cwd, absoluteFile);
  const parts = relative.split(path.sep);
  if (parts.length === 2 && parts[1].toLowerCase() === "index.html" && !parts[0].startsWith(".")) {
    return parts[0];
  }
  return null;
}

function parseDocument(content) {
  const errors = [];
  const document = parse5.parse(content, {
    sourceCodeLocationInfo: true,
    onParseError: (error) => {
      errors.push(error);
    }
  });

  return { document, errors };
}

function analyzeHtml(file, document, content, findings) {
  const doctypeNode = (document.childNodes || []).find((node) => node.nodeName === "#documentType") || null;
  const ids = new Map();
  const labelsByFor = new Map();
  const labelNodes = [];
  const formControls = [];
  const headings = [];
  let hasMain = false;
  let hasRoleMain = false;
  let hasCharset = false;
  let charsetEndOffset = null;
  let viewportContent = null;
  let viewportNode = null;
  let htmlNode = null;
  let titleNode = null;
  let titleText = "";
  let descriptionNode = null;
  let descriptionContent = "";
  let canonicalHref = null;
  let ogUrl = null;
  let hasLangToggle = false;
  let hasGoogleFontsLink = false;
  let fontsLinkNode = null;
  let hasGstaticPreconnect = false;
  const documentOrigin = collectDocumentOrigin(document);

  walkHtml(document, (node) => {
    if (node.nodeName === "#comment") {
      const text = normalizeWhitespace(node.data || "");
      if (/saved from url/i.test(text)) {
        findings.push(makeFinding(file, {
          severity: "medium",
          category: "html",
          ruleId: "html/saved-from-url-comment",
          line: node.sourceCodeLocation?.startLine ?? null,
          column: node.sourceCodeLocation?.startCol ?? null,
          message: "Export artifact comment `saved from url` is still in the file."
        }));
      }
      return;
    }

    if (!isElementNode(node)) {
      return;
    }

    if (node.tagName === "html") {
      htmlNode = node;
    }

    // Only the HTML-namespace <title> names the document; inline SVG <title>
    // elements are icon descriptions and must not shadow it.
    if (node.tagName === "title" && node.namespaceURI === HTML_NAMESPACE && !titleNode) {
      titleNode = node;
      titleText = normalizeWhitespace(textContent(node));
    }

    if (node.tagName === "main") {
      hasMain = true;
    }

    if (attributeValue(node, "role") === "main") {
      hasRoleMain = true;
    }

    if (/^h[1-6]$/.test(node.tagName) && node.namespaceURI === HTML_NAMESPACE) {
      headings.push({
        level: Number(node.tagName[1]),
        line: node.sourceCodeLocation?.startLine ?? null,
        column: node.sourceCodeLocation?.startCol ?? null
      });
    }

    if (node.tagName === "meta" && attributeValue(node, "charset")) {
      hasCharset = true;
      charsetEndOffset = node.sourceCodeLocation?.endOffset ?? null;
    }

    if (node.tagName === "meta" && (attributeValue(node, "http-equiv") || "").toLowerCase() === "content-type") {
      findings.push(makeFinding(file, {
        severity: "medium",
        category: "html",
        ruleId: "html/legacy-meta-content-type",
        line: node.sourceCodeLocation?.startLine ?? null,
        column: node.sourceCodeLocation?.startCol ?? null,
        message: "Legacy `meta http-equiv=\"Content-Type\"` is unnecessary in HTML5; use only `<meta charset>`."
      }));
    }

    if (node.tagName === "meta" && (attributeValue(node, "name") || "").toLowerCase() === "viewport") {
      viewportContent = attributeValue(node, "content") || "";
      viewportNode = node;
    }

    if (node.tagName === "meta" && (attributeValue(node, "name") || "").toLowerCase() === "description") {
      descriptionNode = node;
      descriptionContent = normalizeWhitespace(attributeValue(node, "content") || "");
    }

    if (node.tagName === "meta" && (attributeValue(node, "property") || "").toLowerCase() === "og:url" && ogUrl === null) {
      ogUrl = (attributeValue(node, "content") || "").trim();
    }

    if ((attributeValue(node, "class") || "").split(/\s+/).includes("lang-btn")) {
      hasLangToggle = true;
    }

    const tabindexValue = attributeValue(node, "tabindex");
    if (tabindexValue !== null && Number.parseInt(tabindexValue, 10) > 0) {
      findings.push(makeFinding(file, {
        severity: "medium",
        category: "html",
        ruleId: "html/positive-tabindex",
        line: node.sourceCodeLocation?.startLine ?? null,
        column: node.sourceCodeLocation?.startCol ?? null,
        message: `${formatElement(node)} uses \`tabindex="${tabindexValue}"\`. Positive tabindex overrides the natural focus order; use 0 or restructure the DOM.`
      }));
    }

    if (node.tagName === "link") {
      const href = attributeValue(node, "href");
      if (href && hasRelToken(node, "canonical") && canonicalHref === null) {
        canonicalHref = href.trim();
      }

      if (href && hasRelToken(node, "preconnect") && /fonts\.gstatic\.com/i.test(href)) {
        hasGstaticPreconnect = true;
      }

      if (href && hasRelToken(node, "stylesheet") && EXTERNAL_FONT_RE.test(href)) {
        hasGoogleFontsLink = true;
        fontsLinkNode = fontsLinkNode ?? node;
      }

      if (href && hasRelToken(node, "stylesheet") && EXTERNAL_FONT_RE.test(href) && !/[?&]display=swap\b/.test(href)) {
        findings.push(makeFinding(file, {
          severity: "medium",
          category: "html",
          ruleId: "html/font-link-missing-display-swap",
          line: node.sourceCodeLocation?.startLine ?? null,
          column: node.sourceCodeLocation?.startCol ?? null,
          message: `Google Fonts link is missing \`display=swap\` parameter — text may be invisible during font load.`
        }));
      }

      if (hasRelToken(node, "stylesheet") && isLocalProjectAssetUrl(href)) {
        findings.push(makeFinding(file, {
          severity: "high",
          category: "architecture",
          ruleId: "architecture/local-stylesheet-link",
          line: node.sourceCodeLocation?.startLine ?? null,
          column: node.sourceCodeLocation?.startCol ?? null,
          message: `Single-file app policy violation: local stylesheet \`${href}\` is linked from HTML. Inline it into a \`<style>\` block in this file.`
        }));
      }
    }

    const id = attributeValue(node, "id");
    if (id) {
      pushIndexed(ids, id, node);
    }

    if (node.tagName === "label") {
      labelNodes.push(node);
      const htmlFor = attributeValue(node, "for");
      if (htmlFor) {
        pushIndexed(labelsByFor, htmlFor, node);
      }
    }

    if (isLabelableControl(node)) {
      formControls.push(node);
    }

    if (node.tagName === "a" && attributeValue(node, "target") === "_blank") {
      const rel = (attributeValue(node, "rel") || "").toLowerCase().split(/\s+/);
      if (!rel.includes("noopener") && !rel.includes("noreferrer")) {
        findings.push(makeFinding(file, {
          severity: "medium",
          category: "html",
          ruleId: "html/target-blank-no-rel-noopener",
          line: node.sourceCodeLocation?.startLine ?? null,
          column: node.sourceCodeLocation?.startCol ?? null,
          message: `${formatElement(node)} opens a new tab without \`rel="noopener"\` or \`rel="noreferrer"\`.`
        }));
      }
    }

    for (const attribute of node.attrs || []) {
      if (INLINE_HANDLER_RE.test(attribute.name)) {
        findings.push(makeFinding(file, {
          severity: "high",
          category: "html",
          ruleId: "html/no-inline-event-handler",
          line: node.sourceCodeLocation?.attrs?.[attribute.name]?.startLine ?? node.sourceCodeLocation?.startLine ?? null,
          column: node.sourceCodeLocation?.attrs?.[attribute.name]?.startCol ?? node.sourceCodeLocation?.startCol ?? null,
          message: `Inline \`${attribute.name}\` handler on ${formatElement(node)}. Bind events in script instead.`
        }));

        if (CLICK_LIKE_HANDLER_NAMES.has(attribute.name) && !isSemanticallyInteractive(node)) {
          findings.push(makeFinding(file, {
            severity: "medium",
            category: "html",
            ruleId: "html/non-semantic-interactive-element",
            line: node.sourceCodeLocation?.attrs?.[attribute.name]?.startLine ?? node.sourceCodeLocation?.startLine ?? null,
            column: node.sourceCodeLocation?.attrs?.[attribute.name]?.startCol ?? node.sourceCodeLocation?.startCol ?? null,
            message: `${formatElement(node)} is clickable but is not a semantic interactive element such as <button> or <a href>.`
          }));
        }
      }

      if (attribute.name === "style") {
        findings.push(makeFinding(file, {
          severity: "medium",
          category: "html",
          ruleId: "html/no-inline-style-attribute",
          line: node.sourceCodeLocation?.attrs?.style?.startLine ?? node.sourceCodeLocation?.startLine ?? null,
          column: node.sourceCodeLocation?.attrs?.style?.startCol ?? node.sourceCodeLocation?.startCol ?? null,
          message: `Inline style on ${formatElement(node)} makes reuse and formatting harder. Move it into the style block.`
        }));
      }
    }

    if (node.tagName === "button" && !attributeValue(node, "type")) {
      findings.push(makeFinding(file, {
        severity: "medium",
        category: "html",
        ruleId: "html/button-missing-type",
        line: node.sourceCodeLocation?.startLine ?? null,
        column: node.sourceCodeLocation?.startCol ?? null,
        message: `${formatElement(node)} is missing \`type="button"\`, so it will default to submit semantics inside a form.`
      }));
    }

    if (node.tagName === "button" && looksUnlabeledControl(node)) {
      findings.push(makeFinding(file, {
        severity: "medium",
        category: "html",
        ruleId: "html/icon-button-missing-label",
        line: node.sourceCodeLocation?.startLine ?? null,
        column: node.sourceCodeLocation?.startCol ?? null,
        message: `${formatElement(node)} relies on icon-like text without an \`aria-label\` or descriptive \`title\`.`
      }));
    }

    if (node.tagName === "canvas" && lacksCanvasTextAlternative(node)) {
      findings.push(makeFinding(file, {
        severity: "medium",
        category: "html",
        ruleId: "html/canvas-missing-text-alternative",
        line: node.sourceCodeLocation?.startLine ?? null,
        column: node.sourceCodeLocation?.startCol ?? null,
        message: `${formatElement(node)} has no fallback text or accessible label.`
      }));
    }

    if (node.tagName === "script" && attributeValue(node, "src") && isInsideHead(node)) {
      const type = (attributeValue(node, "type") || "").toLowerCase();
      // defer/async are boolean attributes: a bare `defer` has value "", so
      // presence must be tested, never value truthiness (WHATWG HTML 2.3.2).
      if (type !== "module" && !hasAttribute(node, "defer") && !hasAttribute(node, "async")) {
        findings.push(makeFinding(file, {
          severity: "medium",
          category: "html",
          ruleId: "html/blocking-head-script",
          line: node.sourceCodeLocation?.startLine ?? null,
          column: node.sourceCodeLocation?.startCol ?? null,
          message: `External script ${attributeValue(node, "src")} is loaded in <head> without \`defer\` or \`async\`.`
        }));
      }
    }

    if (node.tagName === "script" && isLocalProjectAssetUrl(attributeValue(node, "src"))) {
      findings.push(makeFinding(file, {
        severity: "high",
        category: "architecture",
        ruleId: "architecture/local-script-src",
        line: node.sourceCodeLocation?.startLine ?? null,
        column: node.sourceCodeLocation?.startCol ?? null,
        message: `Single-file app policy violation: local script \`${attributeValue(node, "src")}\` is loaded with \`src\`. Inline it into a \`<script>\` block in this file.`
      }));
    }

    if (node.tagName === "script" && isCrossOriginUrl(attributeValue(node, "src"), documentOrigin)) {
      const sriValue = attributeValue(node, "integrity");
      if (!sriValue) {
        findings.push(makeFinding(file, {
          severity: "medium",
          category: "html",
          ruleId: "html/external-script-missing-integrity",
          line: node.sourceCodeLocation?.startLine ?? null,
          column: node.sourceCodeLocation?.startCol ?? null,
          message: `External script ${attributeValue(node, "src")} is missing Subresource Integrity metadata.`
        }));
      } else if (!isValidIntegrityValue(sriValue)) {
        findings.push(makeFinding(file, {
          severity: "high",
          category: "html",
          ruleId: "html/invalid-integrity-hash",
          line: node.sourceCodeLocation?.startLine ?? null,
          column: node.sourceCodeLocation?.startCol ?? null,
          message: `External script ${attributeValue(node, "src")} has an invalid SRI hash: \`${sriValue}\`.`
        }));
      } else if (!hasAttribute(node, "crossorigin")) {
        findings.push(makeFinding(file, {
          severity: "medium",
          category: "html",
          ruleId: "html/integrity-script-missing-crossorigin",
          line: node.sourceCodeLocation?.startLine ?? null,
          column: node.sourceCodeLocation?.startCol ?? null,
          message: `Cross-origin script ${attributeValue(node, "src")} has \`integrity\` but is missing \`crossorigin\`.`
        }));
      }
    }

    if (node.tagName === "img" && attributeValue(node, "alt") === null) {
      findings.push(makeFinding(file, {
        severity: "medium",
        category: "html",
        ruleId: "html/img-missing-alt",
        line: node.sourceCodeLocation?.startLine ?? null,
        column: node.sourceCodeLocation?.startCol ?? null,
        message: `${formatElement(node)} is missing an \`alt\` attribute.`
      }));
    }
  });

  if (!doctypeNode) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/missing-doctype",
      line: 1,
      column: 1,
      message: "Document is missing the required `<!doctype html>` preamble."
    }));
  } else if ((doctypeNode.name || "").toLowerCase() !== "html") {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/non-html5-doctype",
      line: doctypeNode.sourceCodeLocation?.startLine ?? 1,
      column: doctypeNode.sourceCodeLocation?.startCol ?? 1,
      message: "Document doctype is not the standard HTML5 doctype."
    }));
  }

  if (!htmlNode || !attributeValue(htmlNode, "lang")) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/missing-lang",
      line: htmlNode?.sourceCodeLocation?.startLine ?? 1,
      column: htmlNode?.sourceCodeLocation?.startCol ?? 1,
      message: "<html> is missing a language attribute."
    }));
  }

  if (!hasCharset) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/missing-charset",
      line: 1,
      column: 1,
      message: "Document is missing `<meta charset>`."
    }));
  }

  // WHATWG 4.2.5.4: the element must be "serialized completely within the
  // first 1024 bytes" — measure the element's end, in bytes, not code units.
  if (hasCharset && charsetEndOffset !== null &&
      Buffer.byteLength(content.slice(0, charsetEndOffset), "utf8") > 1024) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/charset-not-early",
      line: 1,
      column: 1,
      message: "`<meta charset>` must be serialized entirely within the first 1024 bytes of the document."
    }));
  }

  if (!titleNode || !titleText) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/missing-title",
      line: titleNode?.sourceCodeLocation?.startLine ?? 1,
      column: titleNode?.sourceCodeLocation?.startCol ?? 1,
      message: "Document is missing a non-empty `<title>`."
    }));
  }

  if (!descriptionNode || !descriptionContent) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/missing-meta-description",
      line: descriptionNode?.sourceCodeLocation?.startLine ?? 1,
      column: descriptionNode?.sourceCodeLocation?.startCol ?? 1,
      message: "Document is missing a non-empty `<meta name=\"description\">`."
    }));
  }

  if (viewportContent == null) {
    findings.push(makeFinding(file, {
      severity: "high",
      category: "html",
      ruleId: "html/missing-viewport",
      line: 1,
      column: 1,
      message: "Document is missing a `<meta name=\"viewport\">` tag."
    }));
  }

  if (viewportContent && /user-scalable\s*=\s*no/i.test(viewportContent)) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/no-user-scalable",
      line: viewportNode?.sourceCodeLocation?.startLine ?? 1,
      column: viewportNode?.sourceCodeLocation?.startCol ?? 1,
      message: "Viewport disables zoom with `user-scalable=no`, which is an accessibility regression."
    }));
  }

  // Thresholds follow axe-core: maximum-scale < 2 violates the WCAG-mapped
  // meta-viewport rule; < 5 violates the meta-viewport-large best practice.
  const maximumScale = parseViewportNumber(viewportContent, "maximum-scale");
  if (maximumScale !== null && maximumScale < 2) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/viewport-maximum-scale-too-low",
      line: viewportNode?.sourceCodeLocation?.startLine ?? 1,
      column: viewportNode?.sourceCodeLocation?.startCol ?? 1,
      message: `Viewport sets \`maximum-scale=${maximumScale}\`, blocking users from zooming to 200% (WCAG 1.4.4).`
    }));
  } else if (maximumScale !== null && maximumScale < 5) {
    findings.push(makeFinding(file, {
      severity: "low",
      category: "html",
      ruleId: "html/viewport-maximum-scale-limits-zoom",
      line: viewportNode?.sourceCodeLocation?.startLine ?? 1,
      column: viewportNode?.sourceCodeLocation?.startCol ?? 1,
      message: `Viewport sets \`maximum-scale=${maximumScale}\`; values below 5 restrict zoom more than best practice allows.`
    }));
  }

  if (!hasMain && !hasRoleMain) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/missing-main-landmark",
      line: 1,
      column: 1,
      message: "Page has no `<main>` landmark."
    }));
  }

  if (headings.length > 0 && !headings.some((heading) => heading.level === 1)) {
    findings.push(makeFinding(file, {
      severity: "low",
      category: "html",
      ruleId: "html/missing-h1",
      line: headings[0].line ?? 1,
      column: headings[0].column ?? 1,
      message: "Page has headings but no `<h1>` (axe: page-has-heading-one)."
    }));
  }

  for (let index = 1; index < headings.length; index += 1) {
    const previous = headings[index - 1];
    const current = headings[index];
    if (current.level > previous.level + 1) {
      findings.push(makeFinding(file, {
        severity: "low",
        category: "html",
        ruleId: "html/heading-order-skip",
        line: current.line,
        column: current.column,
        message: `Heading level jumps from h${previous.level} to h${current.level}; levels should only increase by one (axe: heading-order).`
      }));
    }
  }

  if (hasGoogleFontsLink && !hasGstaticPreconnect) {
    findings.push(makeFinding(file, {
      severity: "low",
      category: "html",
      ruleId: "html/fonts-missing-preconnect",
      line: fontsLinkNode?.sourceCodeLocation?.startLine ?? 1,
      column: fontsLinkNode?.sourceCodeLocation?.startCol ?? 1,
      message: "Google Fonts stylesheet without `<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>` delays font fetches by a connection setup."
    }));
  }

  for (const labelNode of labelNodes) {
    const htmlFor = attributeValue(labelNode, "for");
    const line = labelNode.sourceCodeLocation?.startLine ?? null;
    const column = labelNode.sourceCodeLocation?.startCol ?? null;

    if (htmlFor) {
      if (!firstLabelableById(ids, htmlFor)) {
        findings.push(makeFinding(file, {
          severity: "medium",
          category: "html",
          ruleId: "html/label-invalid-target",
          line,
          column,
          message: `<label for="${htmlFor}"> does not reference a labelable form control.`
        }));
      }
    } else if (!hasLabelableDescendant(labelNode)) {
      findings.push(makeFinding(file, {
        severity: "medium",
        category: "html",
        ruleId: "html/orphan-label",
        line,
        column,
        message: "<label> is not associated with a form control."
      }));
    }
  }

  for (const control of formControls) {
    if (!controlNeedsLabel(control)) {
      continue;
    }
    if (hasAccessibleControlLabel(control, labelsByFor)) {
      continue;
    }

    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/form-control-missing-label",
      line: control.sourceCodeLocation?.startLine ?? null,
      column: control.sourceCodeLocation?.startCol ?? null,
      message: `${formatElement(control)} has no associated semantic label.`
    }));
  }

  for (const [id, nodes] of ids.entries()) {
    if (nodes.length < 2) {
      continue;
    }

    const lines = nodes
      .map((node) => node.sourceCodeLocation?.startLine)
      .filter(Boolean)
      .sort((left, right) => left - right);

    findings.push(makeFinding(file, {
      severity: "high",
      category: "html",
      ruleId: "html/duplicate-id",
      line: lines[0] ?? null,
      column: null,
      message: `Duplicate id \`${id}\` is used ${nodes.length} times.`,
      detail: `Lines ${formatLineList(lines)}.`
    }));
  }

  return { titleText, canonicalHref, ogUrl, hasLangToggle };
}

function analyzeCss(file, block, findings) {
  const root = parseCssRoot(block.text, block, findings, file);
  if (!root) {
    return;
  }

  const importantLines = [];
  const movementTransitionLines = [];
  const duplicateSelectors = new Map();
  let hasHoverState = false;
  let hasFocusState = false;
  let hasMotion = false;
  let hasReducedMotionHandling = false;

  for (const signature of collectCssRuleSignatures(root, block)) {
    pushIndexed(duplicateSelectors, signature.selectorContext, signature.line);
    if (signature.selector.includes(":hover")) {
      hasHoverState = true;
    }
    if (signature.selector.includes(":focus") || signature.selector.includes(":focus-visible")) {
      hasFocusState = true;
    }
  }

  root.walkAtRules((rule) => {
    if (rule.name === "media" && /prefers-reduced-motion\s*:\s*reduce/i.test(rule.params)) {
      hasReducedMotionHandling = true;
    }
    if (rule.name === "import") {
      const importTarget = extractCssImportTarget(rule.params);
      if (isLocalProjectAssetUrl(importTarget)) {
        findings.push(makeFinding(file, {
          severity: "high",
          category: "architecture",
          ruleId: "architecture/local-css-import",
          line: toBlockLine(block, rule.source?.start?.line),
          column: rule.source?.start?.column ?? null,
          message: `Single-file app policy violation: CSS imports local asset \`${importTarget}\`. Inline that stylesheet into this HTML file instead.`
        }));
      }
    }
    if (/keyframes$/i.test(rule.name)) {
      hasMotion = true;
    }
  });

  const outlineNoneLines = [];

  root.walkRules((rule) => {
    let removesOutline = false;
    let hasVisibleReplacement = false;

    rule.walkDecls((decl) => {
      const prop = decl.prop.toLowerCase();
      const val = normalizeCssValue(decl.value);
      if (prop === "outline" && (val === "none" || val === "0")) {
        removesOutline = true;
      }
      if (prop === "outline-style" && val === "none") {
        removesOutline = true;
      }
      if (prop === "box-shadow" || prop === "border" || prop === "border-color" ||
          prop === "outline-color" || prop === "text-decoration" || prop === "background-color") {
        hasVisibleReplacement = true;
      }
    });

    if (removesOutline && !hasVisibleReplacement) {
      outlineNoneLines.push(toBlockLine(block, rule.source?.start?.line));
    }
  });

  if (outlineNoneLines.length > 0) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "css",
      ruleId: "css/outline-none-without-focus-replacement",
      line: outlineNoneLines[0] ?? block.startLine,
      column: null,
      message: `CSS removes \`outline\` without providing a visible focus replacement in ${outlineNoneLines.length} rule(s).`,
      detail: `Lines ${formatLineList(outlineNoneLines)}.`
    }));
  }

  root.walkDecls((decl) => {
    // `!important` inside a prefers-reduced-motion override is the canonical
    // web.dev pattern (it must beat every specific transition/animation rule).
    if (decl.important && !isInsideReducedMotionRule(decl)) {
      importantLines.push(toBlockLine(block, decl.source?.start?.line));
    }
    const prop = decl.prop.toLowerCase();
    if ((prop === "animation" || prop === "animation-name") && !/\bnone\b/i.test(decl.value)) {
      hasMotion = true;
    }
    if (declTransitionsMovement(prop, decl.value)) {
      movementTransitionLines.push(toBlockLine(block, decl.source?.start?.line));
    }
  });

  if (importantLines.length > 0) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "css",
      ruleId: "css/no-important",
      line: importantLines[0] ?? block.startLine,
      column: null,
      message: `CSS uses \`!important\` ${importantLines.length} time(s).`,
      detail: `Lines ${formatLineList(importantLines)}.`
    }));
  }

  for (const [selectorContext, lines] of duplicateSelectors.entries()) {
    if (lines.length < 2) {
      continue;
    }

    findings.push(makeFinding(file, {
      severity: "low",
      category: "css",
      ruleId: "css/duplicate-selector-block",
      line: lines[0] ?? block.startLine,
      column: null,
      message: `Selector block \`${selectorContext}\` is defined ${lines.length} times in the same file.`,
      detail: `Lines ${formatLineList(lines)}.`
    }));
  }

  if (hasHoverState && !hasFocusState) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "css",
      ruleId: "css/missing-focus-styles",
      line: block.startLine,
      column: block.startColumn,
      message: "CSS defines hover states but no focus or focus-visible styles for keyboard users."
    }));
  }

  if (hasMotion && !hasReducedMotionHandling) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "css",
      ruleId: "css/missing-reduced-motion-fallback",
      line: block.startLine,
      column: block.startColumn,
      message: "CSS uses animations but does not provide a `prefers-reduced-motion` fallback."
    }));
  }

  if (movementTransitionLines.length > 0 && !hasReducedMotionHandling) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "css",
      ruleId: "css/movement-transition-no-reduced-motion",
      line: movementTransitionLines[0] ?? block.startLine,
      column: null,
      message: `CSS transitions movement properties (transform/position/size) without a \`prefers-reduced-motion\` guard in ${movementTransitionLines.length} declaration(s).`,
      detail: `Lines ${formatLineList(movementTransitionLines)}.`
    }));
  }
}

function isInsideReducedMotionRule(node) {
  let current = node.parent;
  while (current && current.type !== "root") {
    if (current.type === "atrule" && current.name === "media" &&
        /prefers-reduced-motion/i.test(current.params)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

function declTransitionsMovement(prop, value) {
  if (prop === "scroll-behavior") {
    return /\bsmooth\b/i.test(value);
  }

  if (prop !== "transition" && prop !== "transition-property") {
    return false;
  }

  // Timing keywords/functions and durations never collide with the movement
  // property names, so any ident token in the set means movement transitions.
  return (value.match(/[a-z-]+/gi) || [])
    .some((ident) => MOVEMENT_TRANSITION_PROPERTIES.has(ident.toLowerCase()));
}

function analyzeScript(file, block, findings, scriptState) {
  const trimmed = block.text.trim();
  if (!trimmed) {
    return;
  }

  let ast;
  const sourceType = (block.attrs?.type || "").toLowerCase() === "module" ? "module" : "script";
  try {
    ast = espree.parse(block.text, {
      ecmaVersion: "latest",
      sourceType,
      comment: true,
      loc: true,
      range: true
    });
  } catch (error) {
    findings.push(makeFinding(file, {
      severity: "high",
      category: "js",
      ruleId: "js/parse-error",
      line: toBlockLine(block, error.lineNumber),
      column: error.column ?? null,
      message: `JavaScript parse error: ${error.description || error.message}.`
    }));
    return;
  }

  if (sourceType !== "module" && !hasUseStrict(ast)) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "js",
      ruleId: "js/missing-use-strict",
      line: block.startLine,
      column: block.startColumn,
      message: "Inline script runs in sloppy mode. Add `'use strict';` or switch to `<script type=\"module\">`."
    }));
  }

  analyzeScopeAwareScriptLint(file, block, findings, sourceType);

  const htmlSinkFindings = [];
  const dangerousEvalLines = [];
  const stringTimerLines = [];
  const withLines = [];
  let topLevelDeclarations = 0;
  let hasIntervalLoop = false;
  let hasVisibilityHandling = false;

  for (const statement of ast.body) {
    topLevelDeclarations += countTopLevelDeclarations(statement);
  }

  walkJsAst(ast, null, (node) => {
    if (node.type === "WithStatement") {
      withLines.push(toBlockLine(block, node.loc?.start?.line));
    }

    if (node.type === "AssignmentExpression" && isHtmlSinkTarget(node.left)) {
      htmlSinkFindings.push({
        line: toBlockLine(block, node.loc?.start?.line),
        sink: memberName(node.left),
        hasInlineHandler: expressionContainsInlineHandlerString(node.right)
      });
    }

    if (node.type === "CallExpression" && isInsertAdjacentHtml(node)) {
      htmlSinkFindings.push({
        line: toBlockLine(block, node.loc?.start?.line),
        sink: "insertAdjacentHTML",
        hasInlineHandler: expressionContainsInlineHandlerString(node.arguments[1])
      });
    }

    if (node.type === "CallExpression" && isDangerousEval(node)) {
      dangerousEvalLines.push(toBlockLine(block, node.loc?.start?.line));
    }

    if (node.type === "NewExpression" && node.callee.type === "Identifier" && node.callee.name === "Function") {
      dangerousEvalLines.push(toBlockLine(block, node.loc?.start?.line));
    }

    if (node.type === "CallExpression" && isStringTimer(node)) {
      stringTimerLines.push(toBlockLine(block, node.loc?.start?.line));
    }

    // Only setInterval keeps firing in hidden tabs; browsers pause
    // requestAnimationFrame callbacks when the page is not visible.
    if (node.type === "CallExpression" && node.callee.type === "Identifier" &&
        node.callee.name === "setInterval") {
      hasIntervalLoop = true;
    }

    if (node.type === "Literal" && node.value === "visibilitychange") {
      hasVisibilityHandling = true;
    }

    if (node.type === "Identifier" && node.name === "I18N" && scriptState) {
      scriptState.referencesI18n = true;
    }

    if (isLocalModuleReferenceNode(node)) {
      findings.push(makeFinding(file, {
        severity: "high",
        category: "architecture",
        ruleId: "architecture/local-module-import",
        line: toBlockLine(block, node.loc?.start?.line),
        column: toBlockColumn(block, node.loc?.start?.line, node.loc?.start?.column != null ? node.loc.start.column + 1 : null),
        message: `Single-file app policy violation: script imports local module \`${localModuleReferenceValue(node)}\`. Merge that module back into this HTML file.`
      }));
    }
  });

  if (hasIntervalLoop && !hasVisibilityHandling) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "js",
      ruleId: "js/interval-no-visibility-handling",
      line: block.startLine,
      column: block.startColumn,
      message: "Script uses `setInterval` but never listens for `visibilitychange` — intervals keep firing (throttled) while the tab is hidden."
    }));
  }

  if (sourceType !== "module" && topLevelDeclarations > 15) {
    findings.push(makeFinding(file, {
      severity: "low",
      category: "js",
      ruleId: "js/large-global-surface",
      line: block.startLine,
      column: block.startColumn,
      message: `Script exposes ${topLevelDeclarations} top-level declarations to the page global scope.`
    }));
  }

  for (const sinkFinding of htmlSinkFindings) {
    findings.push(makeFinding(file, {
      severity: sinkFinding.hasInlineHandler ? "high" : "medium",
      category: "js",
      ruleId: sinkFinding.hasInlineHandler ? "js/html-string-with-inline-handlers" : "js/dangerous-html-sink",
      line: sinkFinding.line,
      column: null,
      message: sinkFinding.hasInlineHandler
        ? `HTML is injected through \`${sinkFinding.sink}\` and the generated markup contains inline event attributes.`
        : `HTML is injected through \`${sinkFinding.sink}\`. Prefer DOM construction over string-based markup insertion.`
    }));
  }

  if (dangerousEvalLines.length > 0) {
    findings.push(makeFinding(file, {
      severity: "high",
      category: "js",
      ruleId: "js/no-dynamic-code-eval",
      line: dangerousEvalLines[0] ?? block.startLine,
      column: null,
      message: "Script executes dynamic code via `eval`, `new Function`, or `document.write`-style behavior.",
      detail: `Lines ${formatLineList(dangerousEvalLines)}.`
    }));
  }

  if (stringTimerLines.length > 0) {
    findings.push(makeFinding(file, {
      severity: "high",
      category: "js",
      ruleId: "js/no-string-timers",
      line: stringTimerLines[0] ?? block.startLine,
      column: null,
      message: "String-based `setTimeout`/`setInterval` behaves like eval and should be replaced with functions.",
      detail: `Lines ${formatLineList(stringTimerLines)}.`
    }));
  }

  if (withLines.length > 0) {
    findings.push(makeFinding(file, {
      severity: "high",
      category: "js",
      ruleId: "js/no-with",
      line: withLines[0] ?? block.startLine,
      column: null,
      message: "`with` statement makes scope resolution ambiguous and breaks strict mode.",
      detail: `Lines ${formatLineList(withLines)}.`
    }));
  }
}

function analyzeScopeAwareScriptLint(file, block, findings, sourceType) {
  const messages = JS_LINTER.verify(block.text, {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType,
      globals: JS_LINT_GLOBALS
    },
    rules: JS_LINT_RULES
  });

  for (const message of messages) {
    // A fatal message (ruleId null) means ESLint could not parse the block at
    // all — surfacing it beats silently skipping the whole lint pass.
    if (!message.ruleId && !message.fatal) {
      continue;
    }

    findings.push(makeFinding(file, {
      severity: message.severity >= 2 ? "high" : "medium",
      category: "js",
      ruleId: message.ruleId ? `js/${message.ruleId}` : "js/eslint-parse-error",
      line: toBlockLine(block, message.line),
      column: toBlockColumn(block, message.line, message.column),
      message: message.message
    }));
  }
}

async function analyzeFormatting(file, content, findings) {
  try {
    const formatted = normalizeNewlines(await prettier.format(content, { parser: "html" }));
    if (normalizeNewlines(content) !== formatted) {
      findings.push(makeFinding(file, {
        severity: "low",
        category: "formatting",
        ruleId: "formatting/prettier",
        line: 1,
        column: 1,
        message: "File is not Prettier-clean. Formatting has drifted from a consistent HTML/CSS/JS layout."
      }));
    }
  } catch (error) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "formatting",
      ruleId: "formatting/prettier-error",
      line: 1,
      column: 1,
      message: `Prettier could not parse the file: ${error.message}.`
    }));
  }
}

function analyzeDuplication(file, absoluteFile, htmlState, repoIndex, findings) {
  if (htmlState.titleText) {
    const duplicateTitles = (repoIndex.titleIndex.get(htmlState.titleText) || [])
      .filter((entry) => entry !== absoluteFile);

    if (duplicateTitles.length > 0) {
      findings.push(makeFinding(file, {
        severity: "low",
        category: "duplication",
        ruleId: "duplication/repeated-title",
        line: 1,
        column: 1,
        message: `Document title is duplicated across ${duplicateTitles.length + 1} app files.`,
        detail: `Also used in ${summarizePaths(duplicateTitles, absoluteFile)}.`
      }));
    }
  }
}

function analyzeConventions(file, appName, content, htmlState, scriptState, repoIndex, findings) {
  if (/^---\s*\n/.test(content)) {
    findings.push(makeFinding(file, {
      severity: "high",
      category: "architecture",
      ruleId: "architecture/jekyll-front-matter",
      line: 1,
      column: 1,
      message: "File starts with a `---` front-matter fence. Apps are copied verbatim by Jekyll and must not carry front matter."
    }));
  }

  if (!appName) {
    return;
  }

  const expectedUrl = `https://lepecki.com/learn/${appName}/`;

  if (!htmlState.canonicalHref) {
    findings.push(makeFinding(file, {
      severity: "high",
      category: "architecture",
      ruleId: "architecture/missing-canonical-url",
      line: 1,
      column: 1,
      message: `Document is missing \`<link rel="canonical" href="${expectedUrl}">\`.`
    }));
  } else if (htmlState.canonicalHref !== expectedUrl) {
    findings.push(makeFinding(file, {
      severity: "high",
      category: "architecture",
      ruleId: "architecture/wrong-canonical-url",
      line: 1,
      column: 1,
      message: `Canonical URL is \`${htmlState.canonicalHref}\` but must be \`${expectedUrl}\`.`
    }));
  }

  if (!htmlState.ogUrl) {
    findings.push(makeFinding(file, {
      severity: "high",
      category: "architecture",
      ruleId: "architecture/missing-og-url",
      line: 1,
      column: 1,
      message: `Document is missing \`<meta property="og:url" content="${expectedUrl}">\`.`
    }));
  } else if (htmlState.ogUrl !== expectedUrl) {
    findings.push(makeFinding(file, {
      severity: "high",
      category: "architecture",
      ruleId: "architecture/wrong-og-url",
      line: 1,
      column: 1,
      message: `og:url is \`${htmlState.ogUrl}\` but must be \`${expectedUrl}\`.`
    }));
  }

  if (!htmlState.hasLangToggle || !scriptState.referencesI18n) {
    const missing = [
      !scriptState.referencesI18n ? "an inline `I18N` object" : null,
      !htmlState.hasLangToggle ? "a `.lang-btn` language toggle" : null
    ].filter(Boolean).join(" and ");

    findings.push(makeFinding(file, {
      severity: "medium",
      category: "architecture",
      ruleId: "architecture/missing-i18n",
      line: 1,
      column: 1,
      message: `Bilingual convention violation: app is missing ${missing}.`
    }));
  }

  if (repoIndex.hubContent !== null) {
    const linkPattern = new RegExp(`\\]\\((?:/learn/)?${escapeRegExp(appName)}/(?:index\\.html)?\\)`);
    if (!linkPattern.test(repoIndex.hubContent)) {
      findings.push(makeFinding(file, {
        severity: "medium",
        category: "architecture",
        ruleId: "architecture/not-linked-from-hub",
        line: 1,
        column: 1,
        message: `App is not linked from the hub page \`index.md\` — every app must appear there.`
      }));
    }
  }
}

// ══════════════════════════════════════════════
// HOUSE STYLE (learn/CLAUDE.md)
// ══════════════════════════════════════════════
// Rules the Style reference states but nothing enforced. Every rule has a
// stable `house/<id>` ruleId; an app suppresses one by citing that id in its
// `docs/style-drift.md`, which is the convention CLAUDE.md already defines for
// recording known deviations. That keeps legacy drift green and documented
// while any NEW violation fails the gate.

// U+1F3FB-U+1F3FF in all three encodings these apps use: literal characters,
// surrogate-pair escapes inside JS string literals (🏻-🏿),
// and HTML entities in markup (&#x1F3FB; / &#127995;). Matching only literals
// misses every app that writes its emoji escaped or as an entity.
const SKIN_TONE_RE =
  /[\u{1F3FB}-\u{1F3FF}]|\\uD83C\\uDFF[B-F]|&#x0*1F3F[B-F];|&#0*12799[5-9];/giu;
// The sanctioned dark overlay backdrop. White text on it is correct; the
// contrast rule below applies to the light tier washes only.
const OVERLAY_DARK_BACKDROP_RE =
  /\.[A-Za-z-]*overlay[^{]*\{[^}]*background:\s*rgba\(\s*11,\s*15,\s*24/i;
const INLINE_DISPLAY_RE = /\.style\.display\s*=/g;
const HARDCODED_LOCALE_RE =
  /(?:toLocaleString|toLocaleDateString|toLocaleTimeString|new\s+Intl\.[A-Za-z]+)\(\s*["'][a-z]{2}-[A-Z]{2}["']/g;
const ARIA_LABEL_MARKUP_RE = /\saria-label\s*=\s*"/;
const ARIA_LABEL_SETTER_RE = /setAttribute\(\s*["']aria-label["']/;
const POINTER_LISTENER_RE =
  /addEventListener\(\s*["'](?:mousedown|pointerdown|touchstart)["']/;
// Captures the parameter name so the fallback check works whatever the app
// calls it (`key`, `k`, ...) — matching a literal `|| key` reports apps that
// are already conformant.
const T_FUNCTION_RE = /function\s+T\s*\(\s*([A-Za-z_$][\w$]*)[^)]*\)\s*\{[\s\S]{0,400}/;
const OVERLAY_WHITE_RE =
  /\.[A-Za-z-]*overlay[^{]*\{[^}]*color:\s*(?:#fff\b|#ffffff\b|white)\s*[;}]/gi;

function analyzeHouseStyle(file, appName, content, lineStarts, styleBlocks, scriptState, findings) {
  const cssText = styleBlocks.map((block) => block.text).join("\n");

  const push = (offset, severity, ruleId, message) => {
    const position = offset === null
      ? { line: 1, column: 1 }
      : offsetToLineCol(lineStarts, offset);
    findings.push(makeFinding(file, {
      severity,
      category: "house-style",
      ruleId,
      line: position.line,
      column: position.column,
      message
    }));
  };

  const eachMatch = (regex, handler) => {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      handler(match);
      if (match[0].length === 0) {
        regex.lastIndex += 1;
      }
    }
  };

  // Occurrence rules — one finding per site, pointing at the real line.
  eachMatch(INLINE_DISPLAY_RE, (match) => {
    push(match.index, "medium", "house/inline-style-display",
      "Visibility toggled via inline `style.display`. Use the native `hidden` attribute (`el.hidden = true/false`) with a `[hidden] { display: none }` guard for flex elements.");
  });

  eachMatch(SKIN_TONE_RE, (match) => {
    push(match.index, "medium", "house/skin-tone-emoji",
      "Emoji carries a skin-tone modifier. The Style reference forbids skin-tone modifiers.");
  });

  eachMatch(HARDCODED_LOCALE_RE, (match) => {
    push(match.index, "medium", "house/hardcoded-locale",
      "Locale is hard-coded in a formatting call. Derive it from the language toggle so Polish uses Polish number/date separators.");
  });

  if (!OVERLAY_DARK_BACKDROP_RE.test(cssText)) {
    eachMatch(OVERLAY_WHITE_RE, (match) => {
      push(match.index, "high", "house/overlay-white-text",
        "Result-overlay text is white. White fails WCAG AA on the light tier washes; the Style reference mandates dark ink `#0b171b` at full opacity.");
    });
  }

  // Presence rules — reported once, at the top of the file.
  if (scriptState.referencesI18n
    && ARIA_LABEL_MARKUP_RE.test(content)
    && !ARIA_LABEL_SETTER_RE.test(content)) {
    push(null, "medium", "house/aria-label-not-localized",
      "Markup defines `aria-label` attributes but nothing re-applies them per language. `applyTranslations()` must rewrite aria-labels, otherwise the accessibility layer stays English after the language toggle.");
  }

  if (scriptState.referencesI18n) {
    const missing = [
      !/documentElement\.lang\s*=/.test(content) ? "`document.documentElement.lang`" : null,
      !/document\.title\s*=/.test(content) ? "`document.title`" : null
    ].filter(Boolean);
    if (missing.length > 0) {
      push(null, "medium", "house/i18n-incomplete-apply",
        `\`applyTranslations()\` never rewrites ${missing.join(" or ")}. The Style reference requires both, otherwise the page keeps advertising the wrong language to assistive tech and the browser.`);
    }
  }

  if (/<canvas/i.test(content)
    && POINTER_LISTENER_RE.test(content)
    && !/touch-action:\s*none/i.test(cssText)) {
    push(null, "medium", "house/canvas-missing-touch-action",
      "App drives a pointer interaction but no CSS rule sets `touch-action: none`. Without it the browser may claim the gesture for scrolling or pinch-zoom before the drag resolves.");
  }

  if (cssText && !/-webkit-tap-highlight-color/i.test(cssText)) {
    push(null, "low", "house/missing-tap-highlight",
      "`body` does not set `-webkit-tap-highlight-color: transparent`, so taps flash the platform highlight box.");
  }

  if (cssText && !/:focus-visible/i.test(cssText)) {
    push(null, "medium", "house/missing-focus-visible",
      "No `:focus-visible` styling anywhere. Keyboard users get no visible focus indicator on buttons.");
  }

  analyzeHouseStyleExtras(file, appName, content, lineStarts, styleBlocks, scriptState, push, eachMatch);

  const tFunction = content.match(T_FUNCTION_RE);
  const tFallback = tFunction
    && new RegExp(`\\|\\|\\s*${tFunction[1]}\\b|\\?\\?\\s*${tFunction[1]}\\b|===\\s*undefined`)
      .test(tFunction[0]);
  if (tFunction && !tFallback) {
    push(tFunction.index, "low", "house/i18n-missing-fallback",
      "`T()` has no missing-key fallback. A key absent from one locale renders as `undefined` instead of the key name.");
  }
}

// Overlay TEXT children only. `.overlay-emoji` legitimately animates opacity.
const OVERLAY_TEXT_OPACITY_RE =
  /\.overlay-(?:msg|sub|subtitle|hint|title|detail|conclusion)[^{]*\{[^}]*opacity:\s*0?\.\d+/gi;
const PASSIVE_TOUCHMOVE_RE = /["']touchmove["'][\s\S]{0,300}?passive:\s*true/g;
const SCROLLBAR_STYLING_RE = /::-webkit-scrollbar|scrollbar-width\s*:|scrollbar-color\s*:/gi;
const FORBIDDEN_HEAD_RE =
  /<meta[^>]+name=["']theme-color["']|<link[^>]+rel=["'](?:shortcut\s+)?icon["']/gi;
const LEGACY_MONO_RE = /Share\s*Tech\s*Mono/gi;
const EMPTY_DASHES_RE = />\s*--\s*<|=\s*["']--["']/g;
const DISABLED_ASSIGN_RE = /\.disabled\s*=\s*(?:true|!)/;
// A T() call whose argument is not a string literal, e.g. `T(state.mode)`.
// The negative lookbehind skips the `function T(key)` declaration, which
// otherwise makes every app look like it uses dynamic keys.
const DYNAMIC_T_CALL_RE = /(?<!function\s)\bT\(\s*[^"')\s]/;

function analyzeHouseStyleExtras(file, appName, content, lineStarts, styleBlocks, scriptState, push, eachMatch) {
  const cssText = styleBlocks.map((block) => block.text).join("\n");

  eachMatch(OVERLAY_TEXT_OPACITY_RE, (match) => {
    push(match.index, "medium", "house/overlay-text-opacity",
      "Result-overlay text is dimmed with `opacity`. The Style reference requires the overlay ink at full opacity — the tier washes leave no contrast headroom to spend.");
  });

  eachMatch(PASSIVE_TOUCHMOVE_RE, (match) => {
    push(match.index, "medium", "house/passive-touchmove",
      "`touchmove` is registered with `{ passive: true }`, so the handler cannot `preventDefault()`. A drag registered this way lets the browser scroll or pinch-zoom the page instead.");
  });

  eachMatch(SCROLLBAR_STYLING_RE, (match) => {
    push(match.index, "medium", "house/styled-scrollbar",
      "Scrollbar styling is present. The Style reference states scrollbars are never styled — the panel scrolls natively.");
  });

  eachMatch(FORBIDDEN_HEAD_RE, (match) => {
    push(match.index, "low", "house/forbidden-head-tag",
      "`<head>` carries a `theme-color` meta or a favicon link. The Style reference forbids both.");
  });

  eachMatch(LEGACY_MONO_RE, (match) => {
    push(match.index, "high", "house/legacy-mono-font",
      "Share Tech Mono is referenced. It ships none of `ą ć ę ł ń ś ź ż`, so every Polish readout silently falls back to a mismatched system face. JetBrains Mono is the mandated replacement.");
  });

  eachMatch(EMPTY_DASHES_RE, (match) => {
    push(match.index, "low", "house/empty-readout-dashes",
      "Empty readout rendered as `--`. The Style reference uses an em dash (`&mdash;`).");
  });

  // These are the floors the Style reference sets outright, independent of the
  // 2026-08-16 kid-readability minimums: canvas text is 13-17px (12px only in
  // dense inset panels), and no sanctioned CSS tier goes below 11px.
  {
    const canvasFontRe = /\.font\s*=\s*["'`](?:bold\s+|[0-9]{3}\s+)?(\d+(?:\.\d+)?)px/g;
    canvasFontRe.lastIndex = 0;
    let cf;
    while ((cf = canvasFontRe.exec(content)) !== null) {
      if (parseFloat(cf[1]) < 12) {
        push(cf.index, "medium", "house/tiny-canvas-text",
          `Canvas text drawn at ${cf[1]}px. The Style reference sets canvas text at 13-17px, and 12px only inside dense inset panels — below that a child cannot read it.`);
      }
    }
    const cssFontRe = /font-size:\s*(\d+(?:\.\d+)?)px/g;
    cssFontRe.lastIndex = 0;
    let sf;
    while ((sf = cssFontRe.exec(cssText)) !== null) {
      if (parseFloat(sf[1]) < 11) {
        push(null, "medium", "house/tiny-css-text",
          `CSS sets ${sf[1]}px text. The smallest sanctioned tier is 11px, and that is reserved for uppercase micro-labels.`);
      }
    }
  }

  if (/\b(?:transition|animation):/.test(cssText)
    && !/prefers-reduced-motion/.test(cssText)) {
    push(null, "medium", "house/missing-reduced-motion-css",
      "App animates or transitions but has no `@media (prefers-reduced-motion: reduce)` block. Motion-sensitive users get no way to opt out.");
  }

  // localStorage access THROWS in Safari private browsing rather than
  // returning null, so an unguarded read during start-up takes the app down
  // before it renders. Guarded = a `try {` opens within the preceding window
  // and has not yet been closed by its `catch`.
  {
    const storeRe = /localStorage\s*\.\s*(?:getItem|setItem|removeItem|clear)/g;
    storeRe.lastIndex = 0;
    let hit;
    while ((hit = storeRe.exec(content)) !== null) {
      const window_ = content.slice(Math.max(0, hit.index - 300), hit.index);
      const tryAt = window_.lastIndexOf("try {");
      const catchAt = window_.lastIndexOf("catch");
      if (tryAt < 0 || catchAt > tryAt) {
        push(hit.index, "medium", "house/localstorage-unguarded",
          "`localStorage` accessed outside a try/catch. Safari private browsing throws on access, so this can break the app outright rather than merely losing saved state.");
      }
    }
  }

  // Result overlays are the moment a child most needs feedback, so they must
  // be reachable without a mouse. Only applies to apps that actually build one
  // in JS — a stylesheet with leftover .result-overlay rules is not an overlay.
  if (/\.className\s*=\s*["'](?:result|game)-overlay|classList\.add\(\s*["'](?:result|game)-overlay/.test(content)) {
    const gaps = [
      !/role["'\s,=:]+dialog/.test(content) ? '`role="dialog"`' : null,
      // Case-insensitive: apps set this either as the attribute
      // (setAttribute("tabindex", "-1")) or the IDL property (el.tabIndex = -1).
      !/tabindex["'\s,=:]+-1/i.test(content) ? '`tabindex="-1"` (so it can take focus)' : null,
      !/["']Escape["']/.test(content) ? "Escape/Enter/Space dismissal" : null,
      !/aria-live/.test(content) ? '`aria-live="polite"`' : null
    ].filter(Boolean);
    if (gaps.length > 0) {
      push(null, "medium", "house/overlay-a11y",
        `Result overlay is missing ${gaps.join(", ")}. A child using a keyboard or a screen reader gets no feedback at the one moment the app is talking to them.`);
    }
  }

  if (DISABLED_ASSIGN_RE.test(content) && cssText && !/:disabled/.test(cssText)) {
    push(null, "medium", "house/missing-disabled-style",
      "JS disables controls but no CSS `:disabled` rule exists, so a disabled button looks identical to an enabled one. The Style reference specifies `opacity: 0.4; pointer-events: none`.");
  }

  if (appName) {
    const head = content.slice(0, 1200);
    // Stop at the closing backtick/quote the comment wraps the path in.
    const gate = head.match(/code-review\s+--\s+([\w./-]+)/);
    if (!gate) {
      push(null, "low", "house/missing-review-gate-comment",
        `Top-of-file comment documenting the review gate is missing. It must cite \`npm run code-review -- ${appName}/index.html\`.`);
    } else if (gate[1] !== `${appName}/index.html`) {
      push(null, "low", "house/stale-review-gate-comment",
        `Review-gate comment cites \`${gate[1]}\`, but the app lives at \`${appName}/index.html\`.`);
    }
  }

  // Dead i18n keys. Skipped entirely when the app looks up keys dynamically —
  // `T(state.mode)` would make every such key look unreferenced.
  if (scriptState.referencesI18n && !DYNAMIC_T_CALL_RE.test(content)) {
    const region = content.match(/I18N\s*=\s*\{[\s\S]*?\n\s{0,10}\};/);
    if (region) {
      const seen = new Set();
      const keyRe = /^\s+([A-Za-z_$][\w$]*):\s*["']/gm;
      let keyMatch;
      while ((keyMatch = keyRe.exec(region[0])) !== null) {
        seen.add(keyMatch[1]);
      }
      for (const key of seen) {
        const uses = content.match(new RegExp(`\\b${key}\\b`, "g")) || [];
        // Exactly two occurrences means the `en` and `pl` definitions and
        // nothing else — no reader anywhere in the file.
        if (uses.length === 2) {
          const at = content.search(new RegExp(`^\\s+${key}:\\s*["']`, "m"));
          push(at < 0 ? null : at, "low", "house/dead-i18n-key",
            `I18N key \`${key}\` is defined in both locales but never read. Dead keys still have to be kept in sync on every translation pass.`);
        }
      }
    }
  }
}

const DRIFT_RULE_ID_RE = /house\/[a-z0-9-]+/g;

async function readDriftSuppressions(absoluteFile, appName) {
  if (!appName) {
    return new Set();
  }
  const driftPath = path.join(path.dirname(absoluteFile), "docs", "style-drift.md");
  const text = await fs.readFile(driftPath, "utf8").catch(() => null);
  if (text === null) {
    return new Set();
  }
  return new Set(text.match(DRIFT_RULE_ID_RE) || []);
}

async function analyzeSingleFilePolicy(file, absoluteFile, isAppFile, findings) {
  const dir = path.dirname(absoluteFile);
  const sidecars = isAppFile
    ? await listSidecarFiles(dir)
    : await listSameBasenameSidecars(dir, path.basename(absoluteFile, path.extname(absoluteFile)));

  for (const sidecar of sidecars) {
    findings.push(makeFinding(file, {
      severity: "high",
      category: "architecture",
      ruleId: "architecture/sidecar-app-file",
      line: 1,
      column: 1,
      message: `Single-file app policy violation: \`${sidecar}\` exists in the app folder. Merge it back into the HTML file and remove the sidecar.`
    }));
  }
}

async function listSameBasenameSidecars(dir, baseName) {
  const found = [];
  for (const extension of SINGLE_FILE_SIDECAR_EXTENSIONS) {
    if (await fileExists(path.join(dir, `${baseName}${extension}`))) {
      found.push(`${baseName}${extension}`);
    }
  }
  return found;
}

async function listSidecarFiles(dir, prefix = "") {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const found = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "docs" || entry.name === "node_modules") {
      continue;
    }
    if (entry.isDirectory()) {
      found.push(...await listSidecarFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`));
    } else if (entry.isFile() && SINGLE_FILE_SIDECAR_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
      found.push(`${prefix}${entry.name}`);
    }
  }

  return found.sort((left, right) => left.localeCompare(right));
}

function collectBlocks(document, content, lineStarts, tagName, options = {}) {
  const blocks = [];

  walkHtml(document, (node) => {
    if (!isElementNode(node) || node.tagName !== tagName) {
      return;
    }

    if (options.inlineOnly && attributeValue(node, "src")) {
      return;
    }

    // Data blocks (importmap, application/ld+json, …) are not executable
    // JavaScript and must not be parsed or linted as such.
    if (options.executableOnly && !isExecutableScriptType(attributeValue(node, "type"))) {
      return;
    }

    const location = node.sourceCodeLocation;
    if (!location?.startTag) {
      return;
    }

    const startOffset = location.startTag.endOffset;
    const endOffset = location.endTag?.startOffset ?? location.endOffset;
    const start = offsetToLineCol(lineStarts, startOffset);

    blocks.push({
      tagName,
      text: content.slice(startOffset, endOffset),
      startLine: start.line,
      startColumn: start.column,
      attrs: Object.fromEntries((node.attrs || []).map((attribute) => [attribute.name, attribute.value]))
    });
  });

  return blocks;
}

function isExecutableScriptType(type) {
  const normalized = (type || "").trim().toLowerCase();
  return normalized === "" || normalized === "module" || JS_SCRIPT_MIME_TYPES.has(normalized);
}

function collectDocumentTitle(document) {
  let titleText = "";

  walkHtml(document, (node) => {
    if (!titleText && isElementNode(node) && node.tagName === "title" && node.namespaceURI === HTML_NAMESPACE) {
      titleText = normalizeWhitespace(textContent(node));
    }
  });

  return titleText;
}

function collectDocumentOrigin(document) {
  let origin = null;

  walkHtml(document, (node) => {
    if (origin || !isElementNode(node)) {
      return;
    }

    if (node.tagName === "link" && hasRelToken(node, "canonical")) {
      origin = urlOrigin(attributeValue(node, "href"));
      return;
    }

    if (node.tagName === "meta" && (attributeValue(node, "property") || "").toLowerCase() === "og:url") {
      origin = urlOrigin(attributeValue(node, "content"));
    }
  });

  return origin;
}

function collectCssRuleSignatures(root, block) {
  const signatures = [];

  root.walkRules((rule) => {
    const declarations = [];
    rule.walkDecls((decl) => {
      declarations.push(`${decl.prop.toLowerCase()}:${normalizeCssValue(decl.value)}${decl.important ? "!important" : ""}`);
    });

    if (declarations.length === 0) {
      return;
    }

    const selector = normalizeWhitespace(rule.selector);
    const context = cssContext(rule);
    signatures.push({
      line: toBlockLine(block, rule.source?.start?.line),
      selector,
      selectorContext: context ? `${context} ${selector}` : selector
    });
  });

  return signatures;
}

function parseCssRoot(cssText, block, findings, file) {
  try {
    return postcss.parse(cssText);
  } catch (error) {
    if (findings && file) {
      findings.push(makeFinding(file, {
        severity: "high",
        category: "css",
        ruleId: "css/parse-error",
        line: toBlockLine(block, error.line),
        column: error.column ?? null,
        message: `CSS parse error: ${error.reason || error.message}.`
      }));
    }
    return null;
  }
}

function extractCssImportTarget(params) {
  const normalized = normalizeWhitespace(params || "");
  const quoted = normalized.match(/^(?:url\(\s*)?['"]([^'"]+)['"]\s*\)?$/i);
  if (quoted) {
    return quoted[1];
  }

  const unquotedUrl = normalized.match(/^url\(\s*([^)\s]+)\s*\)$/i);
  if (unquotedUrl) {
    return unquotedUrl[1];
  }

  return null;
}

function hasUseStrict(ast) {
  if (ast.body.some((statement) =>
    statement.type === "ExpressionStatement" && statement.directive === "use strict")) {
    return true;
  }

  if (ast.body.length === 1 && ast.body[0].type === "ExpressionStatement") {
    const expr = ast.body[0].expression;
    const callee = expr.type === "CallExpression" ? expr.callee : null;
    const fn = callee?.type === "FunctionExpression" || callee?.type === "ArrowFunctionExpression"
      ? callee
      : callee?.type === "MemberExpression" && callee.object?.type === "FunctionExpression"
        ? callee.object
        : null;
    if (fn?.body?.type === "BlockStatement") {
      return fn.body.body.some((statement) =>
        statement.type === "ExpressionStatement" && statement.directive === "use strict");
    }
  }

  return false;
}

function countTopLevelDeclarations(statement) {
  if (!statement) {
    return 0;
  }

  if (statement.type === "VariableDeclaration") {
    return statement.declarations.length;
  }

  if (statement.type === "FunctionDeclaration" || statement.type === "ClassDeclaration") {
    return 1;
  }

  return 0;
}

function isHtmlSinkTarget(node) {
  const name = memberName(node);
  return name === "innerHTML" || name === "outerHTML";
}

function isInsertAdjacentHtml(node) {
  return memberName(node.callee) === "insertAdjacentHTML";
}

function isDangerousEval(node) {
  if (node.callee.type === "Identifier" && node.callee.name === "eval") {
    return true;
  }

  return memberName(node.callee) === "write" &&
    node.callee.type === "MemberExpression" &&
    node.callee.object.type === "Identifier" &&
    node.callee.object.name === "document";
}

function isStringTimer(node) {
  if (node.callee.type !== "Identifier") {
    return false;
  }

  if (node.callee.name !== "setTimeout" && node.callee.name !== "setInterval") {
    return false;
  }

  const [firstArg] = node.arguments;
  return firstArg?.type === "Literal" && typeof firstArg.value === "string";
}

function isLocalModuleReferenceNode(node) {
  return Boolean(localModuleReferenceValue(node));
}

function localModuleReferenceValue(node) {
  if (!node) {
    return null;
  }

  if (node.type === "ImportDeclaration" || node.type === "ExportAllDeclaration") {
    const source = node.source?.value;
    return typeof source === "string" && isLocalProjectAssetUrl(source) ? source : null;
  }

  if (node.type === "ExportNamedDeclaration" && node.source) {
    const source = node.source.value;
    return typeof source === "string" && isLocalProjectAssetUrl(source) ? source : null;
  }

  if (node.type === "ImportExpression" && node.source?.type === "Literal" && typeof node.source.value === "string") {
    return isLocalProjectAssetUrl(node.source.value) ? node.source.value : null;
  }

  return null;
}

function expressionContainsInlineHandlerString(node) {
  if (!node) {
    return false;
  }

  let found = false;
  walkJsAst(node, null, (child) => {
    if (found) {
      return;
    }
    if (child.type === "Literal" && typeof child.value === "string" && INLINE_HANDLER_IN_STRING_RE.test(child.value)) {
      found = true;
    }
    if (child.type === "TemplateElement" && INLINE_HANDLER_IN_STRING_RE.test(child.value?.raw || "")) {
      found = true;
    }
  });

  return found;
}

function memberName(node) {
  if (!node || node.type !== "MemberExpression") {
    return null;
  }

  if (!node.computed && node.property.type === "Identifier") {
    return node.property.name;
  }

  if (node.computed && node.property.type === "Literal" && typeof node.property.value === "string") {
    return node.property.value;
  }

  return null;
}

function looksUnlabeledControl(node) {
  if (attributeValue(node, "aria-label") || attributeValue(node, "title")) {
    return false;
  }

  const text = normalizeWhitespace(textContent(node));
  if (!text) {
    return true;
  }

  return !LETTER_OR_DIGIT_RE.test(text);
}

function lacksCanvasTextAlternative(node) {
  if (attributeValue(node, "aria-label") || attributeValue(node, "aria-labelledby") || attributeValue(node, "title")) {
    return false;
  }

  return normalizeWhitespace(textContent(node)) === "";
}

function isInsideHead(node) {
  let current = node.parentNode;
  while (current) {
    if (current.tagName === "head") {
      return true;
    }
    current = current.parentNode;
  }
  return false;
}

function firstLabelableById(ids, id) {
  const nodes = ids.get(id) || [];
  return nodes.find((node) => isLabelableControl(node)) || null;
}

function hasLabelableDescendant(node) {
  let found = false;
  walkHtml(node, (child) => {
    if (found) {
      return;
    }
    if (child !== node && isLabelableControl(child)) {
      found = true;
    }
  });
  return found;
}

function controlNeedsLabel(node) {
  if (node.tagName === "input") {
    const type = (attributeValue(node, "type") || "text").toLowerCase();
    return !["hidden", "button", "submit", "reset", "image"].includes(type);
  }

  return ["meter", "output", "progress", "select", "textarea"].includes(node.tagName);
}

function hasAccessibleControlLabel(node, labelsByFor) {
  if (attributeValue(node, "aria-label") || attributeValue(node, "aria-labelledby") || attributeValue(node, "title")) {
    return true;
  }

  const id = attributeValue(node, "id");
  if (id && (labelsByFor.get(id) || []).length > 0) {
    return true;
  }

  let current = node.parentNode;
  while (current) {
    if (current.tagName === "label") {
      return true;
    }
    current = current.parentNode;
  }

  return false;
}

function isLabelableControl(node) {
  if (!isElementNode(node)) {
    return false;
  }

  if (node.tagName === "input") {
    return (attributeValue(node, "type") || "").toLowerCase() !== "hidden";
  }

  return ["button", "meter", "output", "progress", "select", "textarea"].includes(node.tagName);
}

function isSemanticallyInteractive(node) {
  if (!isElementNode(node)) {
    return false;
  }

  if (node.tagName === "a") {
    return Boolean(attributeValue(node, "href"));
  }

  if (["button", "details", "embed", "iframe", "input", "label", "option", "select", "summary", "textarea"].includes(node.tagName)) {
    return true;
  }

  const role = (attributeValue(node, "role") || "").toLowerCase();
  return ["button", "checkbox", "link", "menuitem", "option", "radio", "switch", "tab"].includes(role);
}

function hasRelToken(node, token) {
  return (attributeValue(node, "rel") || "")
    .split(/\s+/)
    .map((part) => part.toLowerCase())
    .includes(token);
}

function urlOrigin(url) {
  if (!/^(?:https?:)?\/\//i.test(url || "")) {
    return null;
  }

  try {
    const parsed = new URL(url.startsWith("//") ? `https:${url}` : url);
    return parsed.origin;
  } catch {
    return null;
  }
}

// W3C SRI: whitespace-separated `alg-base64` tokens. Exact base64 digest
// lengths: sha256 → 44 chars (one `=` pad), sha384 → 64 (no pad),
// sha512 → 88 (two `=` pads).
const SRI_HASH_PATTERNS = [
  /^sha256-[A-Za-z0-9+/]{43}=$/,
  /^sha384-[A-Za-z0-9+/]{64}$/,
  /^sha512-[A-Za-z0-9+/]{86}==$/
];

function isValidIntegrityValue(value) {
  const tokens = normalizeWhitespace(value).split(" ").filter(Boolean);
  return tokens.length > 0 &&
    tokens.every((token) => SRI_HASH_PATTERNS.some((pattern) => pattern.test(token)));
}

function isCrossOriginUrl(url, documentOrigin) {
  const origin = urlOrigin(url);
  if (!origin) {
    return false;
  }
  if (!documentOrigin) {
    return true;
  }
  return origin !== documentOrigin;
}

function isLocalProjectAssetUrl(url) {
  const normalized = String(url || "").trim();
  if (!normalized || normalized.startsWith("#")) {
    return false;
  }

  if (/^(?:data|blob|javascript|mailto|tel):/i.test(normalized)) {
    return false;
  }

  if (/^(?:https?:)?\/\//i.test(normalized)) {
    return false;
  }

  return true;
}

function parseViewportNumber(content, name) {
  if (!content) {
    return null;
  }

  const match = content.match(new RegExp(`${name}\\s*=\\s*([0-9.]+)`, "i"));
  if (!match) {
    return null;
  }

  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

function attributeValue(node, name) {
  const attribute = (node.attrs || []).find((entry) => entry.name === name);
  return attribute ? attribute.value : null;
}

function hasAttribute(node, name) {
  return (node.attrs || []).some((entry) => entry.name === name);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function textContent(node) {
  if (!node) {
    return "";
  }

  if (node.nodeName === "#text") {
    return node.value || "";
  }

  if (!node.childNodes || node.tagName === "script" || node.tagName === "style") {
    return "";
  }

  return node.childNodes.map((child) => textContent(child)).join("");
}

function formatElement(node) {
  const id = attributeValue(node, "id");
  return id ? `<${node.tagName}#${id}>` : `<${node.tagName}>`;
}

function walkHtml(node, visit) {
  visit(node);
  if (!node.childNodes) {
    return;
  }
  for (const child of node.childNodes) {
    walkHtml(child, visit);
  }
}

function walkJsAst(node, parent, visit) {
  if (!node || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      walkJsAst(child, parent, visit);
    }
    return;
  }

  if (typeof node.type === "string") {
    visit(node, parent);
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "range" || key === "parent") {
      continue;
    }
    walkJsAst(value, node, visit);
  }
}

function makeFinding(file, finding) {
  return {
    file,
    severity: finding.severity,
    category: finding.category,
    ruleId: finding.ruleId,
    line: finding.line ?? null,
    column: finding.column ?? null,
    message: finding.message,
    detail: finding.detail ?? null
  };
}

function compareFindings(left, right) {
  const severity = (SEVERITY_ORDER[left.severity] ?? 99) - (SEVERITY_ORDER[right.severity] ?? 99);
  if (severity !== 0) {
    return severity;
  }

  const line = (left.line ?? Number.MAX_SAFE_INTEGER) - (right.line ?? Number.MAX_SAFE_INTEGER);
  if (line !== 0) {
    return line;
  }

  const category = left.category.localeCompare(right.category);
  if (category !== 0) {
    return category;
  }

  return left.ruleId.localeCompare(right.ruleId);
}

function renderReports(reports) {
  return reports.map(renderReport).join("\n\n");
}

function renderReport(report) {
  const lines = [];
  const { file, summary, findings } = report;

  lines.push(file);
  lines.push(`${summary.total} finding(s): ${summary.high} high, ${summary.medium} medium, ${summary.low} low`);

  const suppressed = report.suppressed || [];
  if (suppressed.length > 0) {
    lines.push(`${suppressed.length} known drift suppressed by docs/style-drift.md: ${suppressed.join(", ")}`);
  }

  if (findings.length === 0) {
    lines.push("No problems found.");
    return lines.join("\n");
  }

  findings.forEach((finding, index) => {
    const location = finding.line ? `line ${finding.line}` : "file";
    lines.push(`${index + 1}. [${finding.severity.toUpperCase()}] ${finding.ruleId} (${location}) ${finding.message}`);
    if (finding.detail) {
      lines.push(`   ${finding.detail}`);
    }
  });

  return lines.join("\n");
}

function pushIndexed(map, key, value) {
  if (!map.has(key)) {
    map.set(key, []);
  }
  map.get(key).push(value);
}

function normalizeWhitespace(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function normalizeCssValue(value) {
  return normalizeWhitespace(value).replace(/\s*,\s*/g, ",").replace(/\s*\(\s*/g, "(").replace(/\s*\)\s*/g, ")");
}

function normalizeNewlines(text) {
  return String(text).replace(/\r\n?/g, "\n");
}

function buildLineStarts(content) {
  const starts = [0];
  for (let index = 0; index < content.length; index += 1) {
    if (content[index] === "\n") {
      starts.push(index + 1);
    }
  }
  return starts;
}

function offsetToLineCol(lineStarts, offset) {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (lineStarts[middle] <= offset && (middle === lineStarts.length - 1 || lineStarts[middle + 1] > offset)) {
      return {
        line: middle + 1,
        column: offset - lineStarts[middle] + 1
      };
    }
    if (lineStarts[middle] > offset) {
      high = middle - 1;
    } else {
      low = middle + 1;
    }
  }

  return { line: 1, column: 1 };
}

function toBlockLine(block, relativeLine) {
  if (relativeLine == null) {
    return block.startLine;
  }
  return block.startLine + relativeLine - 1;
}

function toBlockColumn(block, relativeLine, relativeColumn) {
  if (!relativeColumn) {
    return null;
  }
  if (relativeLine === 1) {
    return block.startColumn + relativeColumn - 1;
  }
  return relativeColumn;
}

function formatLineList(lines, limit = 12) {
  const unique = [...new Set(lines.filter(Boolean))].sort((left, right) => left - right);
  if (unique.length <= limit) {
    return unique.join(", ");
  }
  return `${unique.slice(0, limit).join(", ")}, +${unique.length - limit} more`;
}

function cssContext(rule) {
  const parts = [];
  let current = rule.parent;
  while (current && current.type !== "root") {
    if (current.type === "atrule") {
      parts.unshift(`@${current.name} ${normalizeWhitespace(current.params)}`);
    }
    current = current.parent;
  }
  return parts.join(" ");
}

function summarizePaths(files, currentFile, limit = 6) {
  const sorted = [...new Set(files)]
    .filter((file) => file !== currentFile)
    .map((file) => path.join(path.basename(path.dirname(file)), path.basename(file)))
    .sort((left, right) => left.localeCompare(right));

  if (sorted.length <= limit) {
    return sorted.join(", ");
  }

  return `${sorted.slice(0, limit).join(", ")}, +${sorted.length - limit} more`;
}

function isElementNode(node) {
  return Boolean(node && typeof node.tagName === "string");
}
