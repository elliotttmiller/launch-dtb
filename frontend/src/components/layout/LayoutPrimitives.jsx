const joinClasses = (...classes) => classes.filter(Boolean).join(' ');

const CONTAINER_SIZES = new Set(['narrow', 'default', 'wide', 'full', 'fluid']);
const SECTION_SPACING = new Set(['compact', 'default', 'spacious']);

export function PageFrame({
  as: Component = 'div',
  surface = false,
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      className={joinClasses('dtb-page', surface && 'dtb-page--surface', className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Container({
  as: Component = 'div',
  size = 'default',
  className = '',
  children,
  ...props
}) {
  const safeSize = CONTAINER_SIZES.has(size) ? size : 'default';

  return (
    <Component
      className={joinClasses('dtb-container', `dtb-container--${safeSize}`, className)}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Section({
  as: Component = 'section',
  spacing = 'default',
  contained = false,
  containerSize = 'default',
  className = '',
  children,
  ...props
}) {
  const safeSpacing = SECTION_SPACING.has(spacing) ? spacing : 'default';
  const sectionClass = joinClasses(
    'dtb-section',
    safeSpacing !== 'default' && `dtb-section--${safeSpacing}`,
    className,
  );

  return (
    <Component className={sectionClass} {...props}>
      {contained ? <Container size={containerSize}>{children}</Container> : children}
    </Component>
  );
}

export function Stack({
  as: Component = 'div',
  gap,
  className = '',
  style,
  children,
  ...props
}) {
  const resolvedStyle = gap ? { ...style, '--dtb-stack-gap': gap } : style;

  return (
    <Component className={joinClasses('dtb-stack', className)} style={resolvedStyle} {...props}>
      {children}
    </Component>
  );
}

export function Cluster({
  as: Component = 'div',
  gap,
  align,
  justify,
  className = '',
  style,
  children,
  ...props
}) {
  const resolvedStyle = {
    ...style,
    ...(gap ? { '--dtb-cluster-gap': gap } : null),
    ...(align ? { '--dtb-cluster-align': align } : null),
    ...(justify ? { '--dtb-cluster-justify': justify } : null),
  };

  return (
    <Component className={joinClasses('dtb-cluster', className)} style={resolvedStyle} {...props}>
      {children}
    </Component>
  );
}

export function AutoGrid({
  as: Component = 'div',
  minimum = '17rem',
  gap,
  className = '',
  style,
  children,
  ...props
}) {
  const resolvedStyle = {
    ...style,
    '--dtb-grid-min': minimum,
    ...(gap ? { '--dtb-grid-gap': gap } : null),
  };

  return (
    <Component className={joinClasses('dtb-auto-grid', className)} style={resolvedStyle} {...props}>
      {children}
    </Component>
  );
}

export function SplitLayout({
  as: Component = 'div',
  secondaryWidth,
  gap,
  className = '',
  style,
  children,
  ...props
}) {
  const resolvedStyle = {
    ...style,
    ...(secondaryWidth ? { '--dtb-split-secondary': secondaryWidth } : null),
    ...(gap ? { '--dtb-split-gap': gap } : null),
  };

  return (
    <Component className={joinClasses('dtb-split-layout', className)} style={resolvedStyle} {...props}>
      {children}
    </Component>
  );
}

export function SidebarLayout({
  as: Component = 'div',
  sidebarWidth,
  gap,
  className = '',
  style,
  children,
  ...props
}) {
  const resolvedStyle = {
    ...style,
    ...(sidebarWidth ? { '--dtb-sidebar-width': sidebarWidth } : null),
    ...(gap ? { '--dtb-sidebar-gap': gap } : null),
  };

  return (
    <Component className={joinClasses('dtb-sidebar-layout', className)} style={resolvedStyle} {...props}>
      {children}
    </Component>
  );
}