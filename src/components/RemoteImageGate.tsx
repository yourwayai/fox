import React, { useState, memo } from 'react';
import { ShieldAlert, ShieldCheck, Eye, AlertTriangle } from 'lucide-react';
import { resolveMarkdownImageSrc } from '../utils/tauriBridge';
import { isRemoteImageUrl, extractImageHostname, isImageDomainTrusted } from '../utils/security';

export interface RemoteImageGateProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  filePath?: string;
  trustedDomains?: string[];
  allowedUrls?: Set<string>;
  allowAllDocImages?: boolean;
  onAllowImage?: (url: string) => void;
  onTrustDomain?: (domain: string) => void;
  onAllowAllDocImages?: () => void;
}

export const RemoteImageGate: React.FC<RemoteImageGateProps> = memo(
  ({
    src,
    alt,
    filePath,
    trustedDomains = [],
    allowedUrls,
    allowAllDocImages = false,
    onAllowImage,
    onTrustDomain,
    onAllowAllDocImages,
    className,
    ...props
  }) => {
    const [localAllowed, setLocalAllowed] = useState(false);
    const [hasError, setHasError] = useState(false);

    const resolvedSrc = resolveMarkdownImageSrc(src || '', filePath);
    if (!resolvedSrc) return null;

    const isRemote = isRemoteImageUrl(resolvedSrc);

    // Local assets (file, asset://, data:, blob:) load directly
    if (!isRemote) {
      return (
        <img
          src={resolvedSrc}
          alt={alt || ''}
          loading="lazy"
          className={
            className ||
            'max-w-full rounded-md shadow-sm my-3 border border-neutral-200 dark:border-neutral-800'
          }
          {...props}
        />
      );
    }

    const hostname = extractImageHostname(resolvedSrc);
    const isDomainTrusted = isImageDomainTrusted(hostname, trustedDomains);
    const isUrlAllowed = allowedUrls?.has(resolvedSrc) || localAllowed;
    const isPermitted = allowAllDocImages || isDomainTrusted || isUrlAllowed;

    // When permitted, render the actual <img> tag
    if (isPermitted) {
      if (hasError) {
        return (
          <div className="my-3 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/60 text-xs text-neutral-600 dark:text-neutral-400 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 truncate">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="truncate">
                外链图片加载失败：{alt ? `“${alt}”` : hostname || resolvedSrc}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHasError(false)}
              className="px-2.5 py-1 text-[11px] font-medium rounded bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 shrink-0 transition-colors"
            >
              重试
            </button>
          </div>
        );
      }

      return (
        <div className="relative group my-3 inline-block max-w-full">
          <img
            src={resolvedSrc}
            alt={alt || ''}
            loading="lazy"
            onError={() => setHasError(true)}
            className={
              className ||
              'max-w-full rounded-md shadow-sm border border-neutral-200 dark:border-neutral-800 transition-opacity'
            }
            {...props}
          />
          {hostname && (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-2 right-2 text-[10px] bg-neutral-950/75 text-neutral-300 backdrop-blur-sm px-1.5 py-0.5 rounded pointer-events-none select-none font-mono">
              {hostname}
            </span>
          )}
        </div>
      );
    }

    // Default Gate: Block remote network request and display interactive confirmation card
    return (
      <div className="my-3.5 p-3 rounded-xl border border-dashed border-amber-300/80 dark:border-amber-700/60 bg-amber-50/40 dark:bg-amber-950/20 text-neutral-800 dark:text-neutral-200 text-xs select-none transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  外链图片已拦截
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/40 px-1.5 py-0.5 rounded font-medium">
                  防信标追踪
                </span>
                {hostname && (
                  <span
                    className="font-mono text-[10px] text-neutral-600 dark:text-neutral-400 bg-neutral-200/70 dark:bg-neutral-800/80 px-1.5 py-0.5 rounded truncate max-w-[200px]"
                    title={resolvedSrc}
                  >
                    {hostname}
                  </span>
                )}
              </div>
              <p
                className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 truncate"
                title={alt || resolvedSrc}
              >
                {alt ? `图片描述：“${alt}”` : resolvedSrc}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={() => {
                setLocalAllowed(true);
                onAllowImage?.(resolvedSrc);
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 shadow-sm transition-colors"
              title="单次加载这张图片"
            >
              <Eye className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
              <span>加载此图</span>
            </button>

            {hostname && (
              <button
                type="button"
                onClick={() => {
                  setLocalAllowed(true);
                  onTrustDomain?.(hostname);
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 transition-colors"
                title={`信任并自动加载来自 ${hostname} 的所有图片`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>信任域名</span>
              </button>
            )}

            {onAllowAllDocImages && (
              <button
                type="button"
                onClick={onAllowAllDocImages}
                className="px-2 py-1 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                title="放行本文档内所有的外链图片"
              >
                全部放行
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

RemoteImageGate.displayName = 'RemoteImageGate';
