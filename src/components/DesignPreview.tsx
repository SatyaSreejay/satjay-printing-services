"use client";

/**
 * Renders a template's SVG. Template output escapes all customer text and
 * only allows data:/same-site image sources, so it is safe to inject.
 */
export function DesignPreview({ svg, label }: { svg: string; label: string }) {
  return (
    <div className="print-preview" role="img" aria-label={label}>
      <div dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
