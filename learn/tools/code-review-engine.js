import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { Linter } from "eslint";
import * as espree from "espree";
import globals from "globals";
import * as parse5 from "parse5";
import postcss from "postcss";
import * as prettier from "prettier";

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };
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
const JS_LINTER = new Linter({ configType: "flat" });
const JS_LINT_RULES = {
  "no-undef": "error",
  "no-unused-vars": ["warn", { args: "none", varsIgnorePattern: "^_" }],
  "no-redeclare": "error",
  "no-shadow-restricted-names": "error",
  "no-dupe-keys": "error",
  "no-duplicate-case": "error",
  "no-unreachable": "error",
  "no-constant-condition": "warn",
  "no-self-assign": "error",
  "no-self-compare": "error",
  eqeqeq: ["warn", "smart"],
  "use-isnan": "error",
  "valid-typeof": "error",
  "no-sparse-arrays": "error",
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
      "  npm run cr -- <app.html> [--json]",
      "  npm run cr -- --all [--json]",
      "",
      "Reports structural, formatting, JS/CSS, duplication, and single-file-app policy issues for the apps in this folder."
    ].join("\n"));
    return;
  }

  const cwd = process.cwd();
  const repoFiles = await listHtmlFiles(cwd);
  const targets = options.all
    ? repoFiles
    : [path.resolve(cwd, options.target)];

  if (!options.all) {
    const exists = await fileExists(targets[0]);
    if (!exists) {
      throw new Error(`file not found: ${options.target}`);
    }
    if (path.extname(targets[0]).toLowerCase() !== ".html") {
      throw new Error("target must be an .html file");
    }
  }

  const indexedFiles = uniqueSortedPaths([...repoFiles, ...targets]);
  const repoIndex = await buildRepoIndex(indexedFiles);
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
    throw new Error("usage: npm run cr -- <app.html> [--json] or npm run cr -- --all [--json]");
  }

  if (options.all && options.target) {
    throw new Error("pass either one HTML file or --all");
  }

  return options;
}

async function listHtmlFiles(cwd) {
  const entries = await fs.readdir(cwd, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".html"))
    .map((entry) => path.join(cwd, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

function uniqueSortedPaths(files) {
  return [...new Set(files)].sort((left, right) => left.localeCompare(right));
}

async function buildRepoIndex(files) {
  const titleIndex = new Map();

  await Promise.all(files.map(async (file) => {
    const content = normalizeNewlines(await fs.readFile(file, "utf8"));
    const parsed = parseDocument(content);

    const titleText = collectDocumentTitle(parsed.document);
    if (titleText) {
      pushIndexed(titleIndex, titleText, file);
    }
  }));

  return { titleIndex };
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

  const htmlState = analyzeHtml(relativeFile, parsed.document, findings);
  const styleBlocks = collectBlocks(parsed.document, content, lineStarts, "style");
  const scriptBlocks = collectBlocks(parsed.document, content, lineStarts, "script", { inlineOnly: true });
  const cssSignatures = [];

  for (const block of styleBlocks) {
    analyzeCss(relativeFile, block, findings, cssSignatures);
  }

  for (const block of scriptBlocks) {
    analyzeScript(relativeFile, block, findings);
  }

  await analyzeFormatting(relativeFile, content, findings);
  analyzeDuplication(relativeFile, file, htmlState, repoIndex, findings);
  await analyzeSingleFilePolicy(relativeFile, file, findings);

  findings.sort(compareFindings);

  const counts = {
    high: findings.filter((finding) => finding.severity === "high").length,
    medium: findings.filter((finding) => finding.severity === "medium").length,
    low: findings.filter((finding) => finding.severity === "low").length
  };

  return {
    file: relativeFile,
    findings,
    summary: {
      total: findings.length,
      ...counts
    }
  };
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

function analyzeHtml(file, document, findings) {
  const doctypeNode = (document.childNodes || []).find((node) => node.nodeName === "#documentType") || null;
  const ids = new Map();
  const labelsByFor = new Map();
  const labelNodes = [];
  const formControls = [];
  let hasMain = false;
  let hasRoleMain = false;
  let hasCharset = false;
  let charsetOffset = null;
  let viewportContent = null;
  let viewportNode = null;
  let htmlNode = null;
  let titleNode = null;
  let titleText = "";
  let descriptionNode = null;
  let descriptionContent = "";
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

    if (node.tagName === "title") {
      titleNode = node;
      titleText = normalizeWhitespace(textContent(node));
    }

    if (node.tagName === "main") {
      hasMain = true;
    }

    if (attributeValue(node, "role") === "main") {
      hasRoleMain = true;
    }

    if (node.tagName === "meta" && attributeValue(node, "charset")) {
      hasCharset = true;
      charsetOffset = node.sourceCodeLocation?.startOffset ?? null;
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

    if (node.tagName === "link") {
      const href = attributeValue(node, "href");
      if (href && EXTERNAL_FONT_RE.test(href) && !/[?&]display=swap\b/.test(href)) {
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
      if (type !== "module" && !attributeValue(node, "defer") && !attributeValue(node, "async")) {
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
      } else if (!/^sha(256|384|512)-[A-Za-z0-9+/]{43,}=*$/.test(sriValue)) {
        findings.push(makeFinding(file, {
          severity: "high",
          category: "html",
          ruleId: "html/invalid-integrity-hash",
          line: node.sourceCodeLocation?.startLine ?? null,
          column: node.sourceCodeLocation?.startCol ?? null,
          message: `External script ${attributeValue(node, "src")} has an invalid SRI hash: \`${sriValue}\`.`
        }));
      } else if (!attributeValue(node, "crossorigin")) {
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

  if (hasCharset && charsetOffset !== null && charsetOffset >= 1024) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/charset-not-early",
      line: 1,
      column: 1,
      message: "`<meta charset>` should appear entirely within the first 1024 bytes of the document."
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

  const maximumScale = parseViewportNumber(viewportContent, "maximum-scale");
  if (maximumScale !== null && maximumScale < 3) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "html",
      ruleId: "html/viewport-maximum-scale-too-low",
      line: viewportNode?.sourceCodeLocation?.startLine ?? 1,
      column: viewportNode?.sourceCodeLocation?.startCol ?? 1,
      message: `Viewport sets \`maximum-scale=${maximumScale}\`, which restricts zoom too aggressively.`
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

  return { titleText };
}

function analyzeCss(file, block, findings, cssSignatures) {
  const root = parseCssRoot(block.text, block, findings, file);
  if (!root) {
    return;
  }

  const importantLines = [];
  const duplicateSelectors = new Map();
  let hasHoverState = false;
  let hasFocusState = false;
  let hasMotion = false;
  let hasReducedMotionHandling = false;

  for (const signature of collectCssRuleSignatures(root, block)) {
    cssSignatures.push(signature);
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
    if (decl.important) {
      importantLines.push(toBlockLine(block, decl.source?.start?.line));
    }
    const prop = decl.prop.toLowerCase();
    if ((prop === "animation" || prop === "animation-name") && !/\bnone\b/i.test(decl.value)) {
      hasMotion = true;
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
}

function analyzeScript(file, block, findings) {
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
  let hasAnimationLoop = false;
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

    if (node.type === "CallExpression" && node.callee.type === "Identifier" &&
        (node.callee.name === "requestAnimationFrame" || node.callee.name === "setInterval")) {
      hasAnimationLoop = true;
    }

    if (node.type === "Literal" && node.value === "visibilitychange") {
      hasVisibilityHandling = true;
    }

    if (isLocalModuleReferenceNode(node)) {
      findings.push(makeFinding(file, {
        severity: "high",
        category: "architecture",
        ruleId: "architecture/local-module-import",
        line: toBlockLine(block, node.loc?.start?.line),
        column: toBlockColumn(block, node.loc?.start?.line, node.loc?.start?.column ? node.loc.start.column + 1 : null),
        message: `Single-file app policy violation: script imports local module \`${localModuleReferenceValue(node)}\`. Merge that module back into this HTML file.`
      }));
    }
  });

  if (hasAnimationLoop && !hasVisibilityHandling) {
    findings.push(makeFinding(file, {
      severity: "medium",
      category: "js",
      ruleId: "js/animation-loop-no-visibility-handling",
      line: block.startLine,
      column: block.startColumn,
      message: "Script uses `requestAnimationFrame` or `setInterval` but never listens for `visibilitychange` — wastes CPU when the tab is hidden."
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
      ecmaVersion: 2022,
      sourceType,
      globals: JS_LINT_GLOBALS
    },
    rules: JS_LINT_RULES
  });

  for (const message of messages) {
    if (!message.ruleId) {
      continue;
    }

    findings.push(makeFinding(file, {
      severity: message.severity >= 2 ? "high" : "medium",
      category: "js",
      ruleId: `js/${message.ruleId}`,
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

async function analyzeSingleFilePolicy(file, absoluteFile, findings) {
  const dir = path.dirname(absoluteFile);
  const baseName = path.basename(absoluteFile, path.extname(absoluteFile));

  for (const extension of SINGLE_FILE_SIDECAR_EXTENSIONS) {
    const sidecarPath = path.join(dir, `${baseName}${extension}`);
    if (!(await fileExists(sidecarPath))) {
      continue;
    }

    findings.push(makeFinding(file, {
      severity: "high",
      category: "architecture",
      ruleId: "architecture/sidecar-app-file",
      line: 1,
      column: 1,
      message: `Single-file app policy violation: sidecar file \`${path.basename(sidecarPath)}\` exists next to \`${path.basename(absoluteFile)}\`. Merge it back into the HTML file and remove the sidecar.`
    }));
  }
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

function collectDocumentTitle(document) {
  let titleText = "";

  walkHtml(document, (node) => {
    if (!titleText && isElementNode(node) && node.tagName === "title") {
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
    const serialized = `${context}|${selector}|${declarations.join(";")}`;
    signatures.push({
      key: serialized,
      serialized,
      declarationCount: declarations.length,
      line: toBlockLine(block, rule.source?.start?.line),
      selector,
      selectorLabel: context ? `${context} ${selector}` : selector,
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
    .map((file) => path.basename(file))
    .sort((left, right) => left.localeCompare(right));

  if (sorted.length <= limit) {
    return sorted.join(", ");
  }

  return `${sorted.slice(0, limit).join(", ")}, +${sorted.length - limit} more`;
}

function isElementNode(node) {
  return Boolean(node && typeof node.tagName === "string");
}
