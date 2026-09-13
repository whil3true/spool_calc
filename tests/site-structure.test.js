import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = process.cwd();
const sitePrefix = '/spool_calc';

function localPathFromUrl(url) {
  const parsed = new URL(url);
  assert.ok(parsed.pathname.startsWith(`${sitePrefix}/`) || parsed.pathname === `${sitePrefix}/`);
  const relative = parsed.pathname.slice(sitePrefix.length).replace(/^\//, '');
  return relative.endsWith('/') || relative === '' ? `${relative}index.html` : relative;
}

test('every sitemap URL points to a real static page', () => {
  const sitemap = readFileSync(resolve(repoRoot, 'sitemap.xml'), 'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  assert.ok(urls.length >= 16, 'sitemap unexpectedly lost MVP pages');
  for (const url of urls) {
    const path = resolve(repoRoot, localPathFromUrl(url));
    assert.ok(existsSync(path), `sitemap target does not exist: ${url}`);
  }
});

test('guide index links to all ten guide pages', () => {
  const index = readFileSync(resolve(repoRoot, 'guides/index.html'), 'utf8');
  const guideLinks = [...index.matchAll(/href="\.\/([^"#]+)\/"/g)].map((match) => match[1]);
  assert.equal(new Set(guideLinks).size, 10);
  for (const slug of guideLinks) {
    assert.ok(existsSync(resolve(repoRoot, `guides/${slug}/index.html`)), `missing guide: ${slug}`);
  }
});
