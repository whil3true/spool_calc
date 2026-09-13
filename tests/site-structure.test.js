import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = process.cwd();
const canonicalOrigin = 'https://shpulometr.ru';
const oldPagesHost = /whil3true\.github\.io\/spool_calc/i;

function sitemapUrls() {
  const sitemap = readFileSync(resolve(repoRoot, 'sitemap.xml'), 'utf8');
  return [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function localPathFromUrl(url) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, canonicalOrigin, `unexpected sitemap origin: ${url}`);
  const relative = parsed.pathname.replace(/^\//, '');
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

test('sitemap contains exactly sixteen production-domain pages', () => {
  const urls = sitemapUrls();
  assert.equal(urls.length, 16);
  assert.equal(new Set(urls).size, 16);
  for (const url of urls) assert.ok(existsSync(resolve(repoRoot, localPathFromUrl(url))), `sitemap target does not exist: ${url}`);
  assert.ok(urls.some((url) => url.endsWith('/guides/tie-line-to-spool/')));
  assert.ok(!urls.some((url) => url.endsWith('/guides/underfill-overfill/')));
});

test('guide index links to the ten final guide pages', () => {
  const index = readFileSync(resolve(repoRoot, 'guides/index.html'), 'utf8');
  const guideLinks = [...index.matchAll(/href="\.\/([^"#]+)\/"/g)].map((match) => match[1]);
  assert.equal(new Set(guideLinks).size, 10);
  assert.ok(guideLinks.includes('tie-line-to-spool'));
  assert.ok(!guideLinks.includes('underfill-overfill'));
  for (const slug of guideLinks) assert.ok(existsSync(resolve(repoRoot, `guides/${slug}/index.html`)), `missing guide: ${slug}`);
});

test('every indexable page has production canonical, SEO basics and Metrika', () => {
  for (const url of sitemapUrls()) {
    const path = resolve(repoRoot, localPathFromUrl(url));
    const html = readFileSync(path, 'utf8');
    assert.match(html, /<title>[^<]+<\/title>/i, `missing title: ${url}`);
    assert.match(html, /<meta name="description" content="[^"]+">/i, `missing description: ${url}`);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/i)?.[1];
    assert.equal(canonical, url, `canonical mismatch: ${url}`);
    assert.equal([...html.matchAll(/<h1(?:\s[^>]*)?>/gi)].length, 1, `expected one H1: ${url}`);
    assert.match(html, /Шпулометр/i, `brand missing: ${url}`);
    assert.match(html, /metrika\.js/i, `Metrika bootstrap missing: ${url}`);
    assert.doesNotMatch(html, oldPagesHost, `old GitHub Pages host remains: ${url}`);
  }
});

test('Metrika bootstrap uses the production counter and bridges product events', () => {
  const source = readFileSync(resolve(repoRoot, 'assets/metrika.js'), 'utf8');
  assert.match(source, /112552271/);
  assert.match(source, /spoolcalc:event/);
  assert.match(source, /reachGoal/);
  assert.match(source, /webvisor:\s*true/);
});

test('robots and sitemap use the production domain', () => {
  const robots = readFileSync(resolve(repoRoot, 'robots.txt'), 'utf8');
  const sitemap = readFileSync(resolve(repoRoot, 'sitemap.xml'), 'utf8');
  assert.match(robots, /Sitemap:\s*https:\/\/shpulometr\.ru\/sitemap\.xml/i);
  assert.doesNotMatch(robots, oldPagesHost);
  assert.doesNotMatch(sitemap, oldPagesHost);
});

test('merged underfill page is non-indexable and points to production spool lip guide', () => {
  const html = readFileSync(resolve(repoRoot, 'guides/underfill-overfill/index.html'), 'utf8');
  assert.match(html, /name="robots" content="noindex,follow"/i);
  assert.match(html, /canonical[^>]+https:\/\/shpulometr\.ru\/guides\/spool-lip-gap\//i);
  assert.match(html, /http-equiv="refresh"[^>]+spool-lip-gap/i);
});

test('homepage keeps four fully clickable visual tool cards', () => {
  const index = readFileSync(resolve(repoRoot, 'index.html'), 'utf8');
  assert.equal([...index.matchAll(/<a class="card card-link card-[^"]+" href="\.\/tools\//g)].length, 4);
  assert.equal([...index.matchAll(/class="card-icon"/g)].length, 4);
  assert.match(index, /class="spool-visual"/);
  assert.equal([...index.matchAll(/class="journey-step"/g)].length, 3);
});

test('homepage communicates product value without registration copy', () => {
  const index = readFileSync(resolve(repoRoot, 'index.html'), 'utf8');
  assert.doesNotMatch(index, /регистрац/i);
  assert.match(index, /По данным со шпули/i);
  assert.match(index, /Калькуляторы для шпули, лески и бэкинга/i);
});

test('user-facing copy avoids registration wording sitewide', () => {
  const files = [resolve(repoRoot, 'index.html'), ...collectFiles(resolve(repoRoot, 'guides'), ['.html']), ...collectFiles(resolve(repoRoot, 'tools'), ['.html'])];
  const offenders = files.filter((path) => /регистрац/i.test(readFileSync(path, 'utf8')));
  assert.deepEqual(offenders, [], `registration wording found in: ${offenders.join(', ')}`);
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
