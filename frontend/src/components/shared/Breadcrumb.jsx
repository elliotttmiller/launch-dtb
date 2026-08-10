import { Link } from 'react-router-dom';
import '../../styles/breadcrumb.css';

/**
 * Shared breadcrumb trail. `items` is an ordered array of
 * `{ label, path }`; the last entry always renders as the current page
 * (plain text, `aria-current="page"`) regardless of whether it has a path.
 */
export default function Breadcrumb({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav className="dtb-breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path || item.label} aria-current={isLast ? 'page' : undefined}>
              {isLast ? (
                <span className="dtb-breadcrumb__current">{item.label}</span>
              ) : (
                <Link to={item.path}>{item.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
