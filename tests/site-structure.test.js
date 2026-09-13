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

test('homepage keeps four fully clickable visual tool cards', () => {
  const index = readFileSync(resolve(repoRoot, 'index.html'), 'utf8');
  assert.equal([...index.matchAll(/<a class="card card-link card-[^"]+" href="\.\/tools\//g)].length, 4);
  assert.equal([...index.matchAll(/class="card-icon"/g)].length, 4);
  assert.match(index, /class="spool-visual"/);
  assert.equal([...index.matchAll(/class="journey-step"/g)].length, 3);
});

test('user-facing copy avoids ambiguous country-passport wording', () => {
  const roots = ['index.html', 'guides', 'tools', 'src/domain/marking-decoder.js', 'src/domain/winding-guide.js'];
  const files = roots.flatMap((entry) => {
    const path = resolve(repoRoot, entry);
    return statSync(path).isDirectory() ? collectFiles(path, ['.html', '.js']) : [path];
  });
  const offenders = files.filter((path) => /паспортн/i.test(readFileSync(path, 'utf8')));
  assert.deepEqual(offenders, [], `ambiguous wording found in: ${offenders.join(', ')}`);
});

test('site stays light and tool styles do not resurrect automatic dark mode', () => {
  const cssFiles = [
    resolve(repoRoot, 'assets/styles.css'),
    resolve(repoRoot, 'tools/capacity/tool.css'),
    resolve(repoRoot, 'tools/decoder/tool.css'),
  ];
  for (const path of cssFiles) assert.doesNotMatch(readFileSync(path, 'utf8'), /prefers-color-scheme\s*:\s*dark/i);
  assert.match(readFileSync(cssFiles[0], 'utf8'), /color-scheme:\s*light/i);
});
