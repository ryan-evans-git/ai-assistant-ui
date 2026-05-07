import type { ImageSpec } from './types'

const dataUriRe =
  /^data:image\/(png|jpeg|jpg|gif|webp);base64,[A-Za-z0-9+/=]+$/

/**
 * Image renderer with the same src-allowlist as the server side.
 *
 * The Zod schema at the boundary already rejects unsafe sources, so
 * by the time we reach this component the URL should be trusted.
 * This duplicate guard exists for defense-in-depth — never trust
 * data flowing in from the network, even after server validation.
 */
export function ImageVisual({ spec }: { spec: ImageSpec }) {
  const safe = spec.src.startsWith('https://') || dataUriRe.test(spec.src)
  if (!safe) {
    return (
      <div className="aaui-visual aaui-visual--image-error" role="alert">
        Image source rejected by the UI safety filter.
      </div>
    )
  }
  return (
    <figure className="aaui-visual aaui-visual--image">
      <img
        src={spec.src}
        alt={spec.alt}
        width={spec.width}
        height={spec.height}
        loading="lazy"
        decoding="async"
        // Strip referrer for external https sources so private chats
        // don't leak host URLs to image origins.
        referrerPolicy="no-referrer"
      />
      {spec.caption && (
        <figcaption className="aaui-visual__caption">{spec.caption}</figcaption>
      )}
    </figure>
  )
}
