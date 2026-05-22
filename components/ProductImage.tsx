'use client'

interface ProductImageData {
  url: string
  alt?: string | null
  position?: number
}

interface ProductImageProps {
  images?: ProductImageData[] | null
  name: string
  categoryName?: string | null
  style?: React.CSSProperties
  className?: string
  /** Override which image index to show (defaults to 0) */
  index?: number
}

const CATEGORY_EMOJIS: Record<string, string> = {
  Electronics: '⚡',
  Fashion: '👗',
  'Home & Living': '🏡',
  Beauty: '✨',
  Accessories: '💎',
  Sports: '🏃',
  'Home & Kitchen': '🏡',
  Books: '📚',
  Toys: '🎮',
  Automotive: '🚗',
}

export function ProductImage({
  images,
  name,
  categoryName,
  style,
  className,
  index = 0,
}: ProductImageProps) {
  const img = images?.[index] ?? images?.[0]

  if (img?.url) {
    return (
      <img
        src={img.url}
        alt={img.alt || name}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          ...style,
        }}
        className={className}
        loading="lazy"
      />
    )
  }

  const emoji = categoryName ? (CATEGORY_EMOJIS[categoryName] ?? '🛍️') : '🛍️'

  return (
    <div
      className={`product-image${className ? ` ${className}` : ''}`}
      style={style}
    >
      <span style={{ fontFamily: 'system-ui', fontSize: 32, display: 'block', marginBottom: 8 }}>
        {emoji}
      </span>
      <span style={{ fontSize: 11 }}>{name}</span>
    </div>
  )
}
