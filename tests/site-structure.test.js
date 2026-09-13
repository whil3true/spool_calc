import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = process.cwd();
const sitePrefix = '/spool_calc';

function localPathFromUrl(url) {
  const parsed = new URL(url);
  assert.ok(parsed.pathname.startsWith(`${sitePrefix}/`) || parsed.pathname === `${sitePrefix}/`);
  const relative = parsed.pathname.slice(sitePrefix.length).replace(/^\//, '');
  return relative.endsWith('/') || relative === '' ? `${relative}index.html` : relative;
}

function collectFiles(dir, suffixes, result = []) {
  for (const entry of readdirSync(dir)) {
    const path = resolve(dir, entry);
    if (statSync(path).isDirectory()) collectFiles(path, suffixes, result);
    else if (suffixes.some((suffix) => path.endsWith(suffix))) result.push(path);
  }
  return result;
}

test('every sitemap URL points to a real static page', () => {
  const sitemap = readFileSync(resolve(repoRoot, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.length >= 16, 'sitemap unexpectedly lost MVP pages');
  for (const url of urls) assert.ok(existsSync(resolve(repoRoot, localPathFromUrl(url))), `sitemap target does not exist: ${url}`);
});

test('guide index links to all ten guide pages', () => {
  const index = readFileSync(resolve(repoRoot, 'guides/index.html'), 'utf8');
  const guideLinks = [...index.matchAll(/href="\.\/([^"#]+)\/"/g)].map((match) => match[1]);
  assert.equal(new Set(guideLinks).size, 10);
  for (const slug of guideLinks) assert.ok(existsSync(resolve(repoRoot, `guides/${slug}/index.html`)), `missing guide: ${slug}`);
});

test('homepage tool cards are fully clickable links', () => {
  const index = readFileSync(resolve(repoRoot, 'index.html'), 'utf8');
  const toolCards = [...index.matchAll(/<a class="card card-link" href="\.\/tools\//g)];
  assert.equal(toolCards.length, 4);
});

test('user-facing copy avoids passport wording', () => {
  const files = collectFiles(repoRoot, ['.html', '.js']);
  const offenders = files.filter((path) => /паспортн/i.test(readFileSync(path, 'utf8')));
  assert.deepEqual(offenders, [], `ambiguous passport wording found in: ${offenders.join(', ')}`);
});

test('site does not force an automatic dark theme', () => {
  const css = readFileSync(resolve(repoRoot, 'assets/styles.css'), 'utf8');
  assert.doesNotMatch(css, /prefers-color-scheme\s*:\s*dark/i);
  assert.match(css, /color-scheme:\s*light/i);
});
