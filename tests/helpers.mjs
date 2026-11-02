import fs from 'node:fs';
import path from 'node:path';

export const repoRoot = path.resolve(import.meta.dirname, '..');
export const distRoot = path.join(repoRoot, 'dist');

export function read(relativePath) {
  return fs.readFileSync(path.join(distRoot, relativePath), 'utf8');
}

export function exists(relativePath) {
  return fs.existsSync(path.join(distRoot, relativePath));
}

export function attr(html, tag, name, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<${tag}\\b(?=[^>]*\\b${name}=["']${escaped}["'])[^>]*>`, 'i');
  return html.match(re)?.[0] ?? '';
}

export function meta(html, name) {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const a = html.match(new RegExp(`<meta\\b(?=[^>]*\\bname=["']${esc}["'])(?=[^>]*\\bcontent=["']([^"']*)["'])[^>]*>`, 'i'));
  if (a) return a[1];
  const b = html.match(new RegExp(`<meta\\b(?=[^>]*\\bcontent=["']([^"']*)["'])(?=[^>]*\\bname=["']${esc}["'])[^>]*>`, 'i'));
  return b?.[1] ?? '';
}

export function linkHref(html, rel, hreflang = null) {
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(m => m[0]);
  for (const tag of links) {
    if (!new RegExp(`\\brel=["'][^"']*${rel}[^"']*["']`, 'i').test(tag)) continue;
    if (hreflang && !new RegExp(`\\bhreflang=["']${hreflang}["']`, 'i').test(tag)) continue;
    return tag.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? '';
  }
  return '';
}

export function title(html) {
  return html.match(/<title>([^<]+)<\/title>/i)?.[1].trim() ?? '';
}

export function h1Count(html) {
  return [...html.matchAll(/<h1\b/gi)].length;
}

export function htmlLang(html) {
  return html.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1] ?? '';
}

export function htmlDir(html) {
  return html.match(/<html\b[^>]*\bdir=["']([^"']+)["']/i)?.[1] ?? '';
}

export function jsonLdBlocks(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map(m => JSON.parse(m[1]));
}

export function internalHrefs(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)]
    .map(m => m[1])
    .filter(href => href.startsWith('/') && !href.startsWith('//'));
}

export function imageTags(html) {
  return [...html.matchAll(/<img\b[^>]*>/gi)].map(m => m[0]);
}

export function routeToFile(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (clean === '/') return 'index.html';
  return `${clean.replace(/^\//, '').replace(/\/$/, '')}/index.html`;
}
