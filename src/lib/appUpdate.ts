import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

const RELEASES_URL = 'https://api.github.com/repos/mohab133/Masar/releases/latest';
const DISMISSED_TAG_KEY = 'masar-dismissed-update-tag';
const PENDING_UPDATE_TAG_KEY = 'masar-pending-update-tag';

export interface AvailableUpdate {
  tag: string;
  version: string;
  title: string;
  notes: string;
  downloadUrl: string;
  assetName: string;
}

function normalizeVersion(value: string) {
  return value.replace(/^v/i, '').split(/[+-]/)[0].split('.').map((part) => Number.parseInt(part, 10) || 0);
}

function isNewer(latest: string, current: string) {
  const a = normalizeVersion(latest);
  const b = normalizeVersion(current);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) > (b[index] || 0);
  }
  return false;
}

export async function checkForAppUpdate(): Promise<AvailableUpdate | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const requestUrl = `${RELEASES_URL}?t=${Date.now()}`;
    const [appInfo, response] = await Promise.all([
      CapacitorApp.getInfo(),
      fetch(requestUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/vnd.github+json', 'Cache-Control': 'no-cache' },
        signal: controller.signal,
      }),
    ]);
    if (!response.ok) return null;
    const release = await response.json() as {
      tag_name?: string;
      name?: string;
      body?: string;
      draft?: boolean;
      prerelease?: boolean;
      assets?: Array<{ name?: string; browser_download_url?: string }>;
    };
    const tag = release.tag_name?.trim() || '';
    const asset = release.assets?.find((item) => item.name?.toLowerCase().endsWith('.apk') && item.browser_download_url);
    if (!tag || release.draft || release.prerelease || !asset?.browser_download_url || !isNewer(tag, appInfo.version)) return null;
    if (localStorage.getItem(DISMISSED_TAG_KEY) === tag) return null;
    return {
      tag,
      version: tag.replace(/^v/i, ''),
      title: release.name?.trim() || `تحديث Masar ${tag.replace(/^v/i, '')}`,
      notes: release.body?.trim() || 'يتوفر إصدار أحدث من التطبيق.',
      downloadUrl: asset.browser_download_url,
      assetName: asset.name || `Masar-${tag}.apk`,
    };
  } catch {
    // Update checks are best-effort; offline or GitHub errors must not block the app.
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function dismissAppUpdate(tag: string) {
  localStorage.setItem(DISMISSED_TAG_KEY, tag);
}

export function markUpdateDownloadComplete(tag: string) {
  localStorage.setItem(PENDING_UPDATE_TAG_KEY, tag);
}

export async function hasCompletedPendingUpdate() {
  const pendingTag = localStorage.getItem(PENDING_UPDATE_TAG_KEY);
  if (!pendingTag) return false;
  const appInfo = await CapacitorApp.getInfo();
  if (isNewer(pendingTag, appInfo.version)) return false;
  localStorage.removeItem(PENDING_UPDATE_TAG_KEY);
  return true;
}
