import { Link } from 'react-router-dom';
import '../../styles/breadcrumb.css';

/**
 * Shared breadcrumb + active-filter trail.
 *
 * `items` is an ordered array of `{ label, path }`; the last entry renders
 * as the current page. `activeFilters` is an optional array of
 * `{ id, label, type?, value? }` tokens. When `onRemoveFilter` is supplied,
 * each token becomes independently removable without owning filter state here.
 */
export default function Breadcrumb({
  items = [],
  activeFilters = [],
  onRemoveFilter = null,
  tone = 'default',
  className = '',
}) {
  const hasPath = items.length > 0;
  const hasFilters = activeFilters.length > 0;
  if (!hasPath && !hasFilters) return null;

  const classes = [
    'dtb-breadcrumb-bar',
    tone === 'inverse' ? 'dtb-breadcrumb-bar--inverse' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {hasPath ? (
        <nav className="dtb-breadcrumb" aria-label="Breadcrumb">
          <ol>
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              return (
                <li key={item.path || item.label} aria-current={isLast ? 'page' : undefined}>
                  {isLast ? (
                    <span className="dtb-breadcrumb__current">{item.label}</span>
                  ) : item.onClick ? (
                    <button type="button" className="dtb-breadcrumb__action" onClick={item.onClick}>
                      {item.label}
                    </button>
                  ) : (
                    <Link to={item.path}>{item.label}</Link>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}

      {hasFilters ? (
        <ul className="dtb-breadcrumb-filters" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <li className="dtb-breadcrumb-filter-chip" key={filter.id || `${filter.type || 'filter'}:${filter.value || filter.label}`}>
              <span>{filter.label}</span>
              {typeof onRemoveFilter === 'function' ? (
                <button
                  type="button"
                  aria-label={`Remove filter: ${filter.label}`}
                  onClick={() => onRemoveFilter(filter)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
