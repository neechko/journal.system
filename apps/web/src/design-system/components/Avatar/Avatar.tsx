/**
 * Avatar Component
 * User/profile image with fallback initials and status indicator
 */

'use client';

import { forwardRef, HTMLAttributes, ReactNode, useMemo } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  status?: 'online' | 'offline' | 'busy' | 'away' | null;
  statusPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  fallback?: ReactNode;
  border?: boolean;
}

const sizeStyles: Record<AvatarSize, { width: string; height: string; fontSize: string; statusSize: string }> = {
  xs: { width: '24px', height: '24px', fontSize: 'var(--font-size-xs)', statusSize: '8px' },
  sm: { width: '32px', height: '32px', fontSize: 'var(--font-size-sm)', statusSize: '10px' },
  md: { width: '40px', height: '40px', fontSize: 'var(--font-size-base)', statusSize: '12px' },
  lg: { width: '56px', height: '56px', fontSize: 'var(--font-size-lg)', statusSize: '14px' },
  xl: { width: '80px', height: '80px', fontSize: 'var(--font-size-xl)', statusSize: '16px' },
  '2xl': { width: '104px', height: '104px', fontSize: 'var(--font-size-2xl)', statusSize: '20px' },
};

const shapeStyles: Record<AvatarShape, string> = {
  circle: 'border-radius: 50%;',
  square: 'border-radius: 8px;',
};

const baseStyles = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
  background-color: var(--color-brand-primary-light);
  color: var(--color-brand-primary);
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  vertical-align: middle;
`;

const imageStyles = `
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const fallbackStyles = `
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const statusStyles = `
  position: absolute;
  border: 2px solid var(--color-surface-primary);
  border-radius: 50%;
  background-color: var(--color-status-offline);
`;

const statusPositionStyles: Record<string, string> = {
  'bottom-right': 'bottom: -2px; right: -2px;',
  'bottom-left': 'bottom: -2px; left: -2px;',
  'top-right': 'top: -2px; right: -2px;',
  'top-left': 'top: -2px; left: -2px;',
};

const statusColorMap = {
  online: 'var(--color-status-success)',
  offline: 'var(--color-text-tertiary)',
  busy: 'var(--color-status-error)',
  away: 'var(--color-status-warning)',
};

const borderStyles = `
  box-shadow: 0 0 0 2px var(--color-surface-primary);
`;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getColorFromName(name: string): { bg: string; text: string } {
  // Generate consistent colors from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hues = [220, 160, 120, 30, 330, 280, 190, 40]; // blue, green, teal, orange, pink, purple, cyan, yellow
  const hue = hues[Math.abs(hash) % hues.length];

  return {
    bg: `hsl(${hue}, 60%, 92%)`,
    text: `hsl(${hue}, 60%, 35%)`,
  };
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = '',
      name,
      size = 'md',
      shape = 'circle',
      status = null,
      statusPosition = 'bottom-right',
      fallback,
      border = false,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const sizeConfig = sizeStyles[size];
    const { bg: fallbackBg, text: fallbackText } = useMemo(() => name ? getColorFromName(name) : { bg: 'var(--color-brand-primary-light)', text: 'var(--color-brand-primary)' }, [name]);
    const initials = useMemo(() => name ? getInitials(name) : '?', [name]);

    const avatarStyle: React.CSSProperties = {
      width: sizeConfig.width,
      height: sizeConfig.height,
      fontSize: sizeConfig.fontSize,
      ...style,
    } as React.CSSProperties;

    const css = `
      ${baseStyles}
      ${shapeStyles[shape]}
      ${border ? borderStyles : ''}
    `;

    const statusDotStyle: React.CSSProperties = {
      width: sizeConfig.statusSize,
      height: sizeConfig.statusSize,
      backgroundColor: status ? statusColorMap[status] : 'transparent',
      ...statusStyles as React.CSSProperties,
      ...statusPositionStyles[statusPosition] as React.CSSProperties,
    };

    const hasImage = src && src.length > 0;
    const showFallback = !hasImage || (fallback && !hasImage);

    return (
      <div
        ref={ref}
        className={className}
        style={avatarStyle}
        {...props}
      >
        {hasImage && !showFallback ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt || (name ? `${name}'s avatar` : 'Avatar')}
            style={imageStyles as React.CSSProperties}
            loading="lazy"
          />
        ) : (
          <div
            style={{
              ...fallbackStyles as React.CSSProperties,
              backgroundColor: fallbackBg,
              color: fallbackText,
            }}
          >
            {fallback || <span>{initials}</span>}
          </div>
        )}

        {status && (
          <span
            style={statusDotStyle}
            aria-label={`Status: ${status}`}
            role="img"
          />
        )}

        <style jsx>{css}</style>
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar Group component
export interface AvatarGroupProps {
  avatars: Array<{
    src?: string | null;
    name?: string;
    alt?: string;
    size?: AvatarSize;
  }>;
  max?: number;
  size?: AvatarSize;
  overlap?: number; // pixels of overlap
  className?: string;
}

export const AvatarGroup = ({
  avatars,
  max = 5,
  size = 'md',
  overlap = 8,
  className = '',
}: AvatarGroupProps) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
      }}
      role="group"
      aria-label={`${avatars.length} users`}
    >
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          alt={avatar.alt}
          size={avatar.size || size}
          border
          style={{
            marginLeft: index === 0 ? 0 : `-${overlap}px`,
            zIndex: visibleAvatars.length - index,
          }}
        />
      ))}
      {remainingCount > 0 && (
        <Avatar
          name={remainingCount.toString()}
          size={size}
          style={{
            marginLeft: `-${overlap}px`,
            zIndex: 0,
            backgroundColor: 'var(--color-background-tertiary)',
            color: 'var(--color-text-secondary)',
          }}
        >
          +{remainingCount}
        </Avatar>
      )}
    </div>
  );
};

// Avatar with badge (for status display)
export interface AvatarWithBadgeProps extends AvatarProps {
  badge?: ReactNode;
  badgePosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const AvatarWithBadge = forwardRef<HTMLDivElement, AvatarWithBadgeProps>(
  (
    {
      badge,
      badgePosition = 'bottom-right',
      ...props
    },
    ref
  ) => {
    const badgeStyles: Record<string, string> = {
      'bottom-right': 'bottom: 0; right: 0;',
      'bottom-left': 'bottom: 0; left: 0;',
      'top-right': 'top: 0; right: 0;',
      'top-left': 'top: 0; left: 0;',
    };

    return (
      <div
        ref={ref}
        style={{
          position: 'relative',
          display: 'inline-flex',
        }}
      >
        <Avatar {...props} />
        {badge && (
          <span
            style={{
              position: 'absolute',
              ...badgeStyles[badgePosition] as React.CSSProperties,
              transform: 'translate(25%, 25%)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
    );
  }
);

AvatarWithBadge.displayName = 'AvatarWithBadge';