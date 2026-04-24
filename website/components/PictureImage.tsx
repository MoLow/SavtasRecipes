interface PictureImageProps {
  /** WebP path relative to public/, e.g. "illustrations/uuid-400w.webp". */
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  /** If true, positions the image absolutely to fill the (position: relative) parent. */
  fill?: boolean;
  /** Explicit dimensions (required when fill is false). */
  width?: number;
  height?: number;
  /** Sets loading=eager + fetchpriority=high. */
  priority?: boolean;
}

/**
 * Lightweight <picture> wrapper that serves AVIF with a WebP fallback.
 * The build step emits matching `-<w>w.avif` and `-<w>w.webp` files for every size.
 * Falls back gracefully when only the WebP variant exists (e.g. `savta.webp`).
 */
export default function PictureImage({
  src,
  alt,
  sizes,
  className,
  fill = false,
  width,
  height,
  priority = false,
}: PictureImageProps) {
  const avif = src.replace(/\.webp$/i, ".avif");
  const imgStyle = fill
    ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%" }
    : undefined;

  return (
    <picture>
      {avif !== src && <source type="image/avif" srcSet={`/${avif}`} sizes={sizes} />}
      <source type="image/webp" srcSet={`/${src}`} sizes={sizes} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/${src}`}
        alt={alt}
        sizes={sizes}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        className={className}
        style={imgStyle}
      />
    </picture>
  );
}
