import StorefrontHeader from '../storefront/StorefrontHeader';
import '../../styles/storefront-nivo-vendor-suppression.css';
import { useEditableComponent } from '../../designer/useEditableComponent.js';

export default function Header(props) {
  const { rootProps, hidden, getColorVar } = useEditableComponent('global-header', 'header-root');

  if (hidden) return null;

  return (
    <div {...rootProps} className="site-header-mount" style={{ background: getColorVar('background_color', undefined) }}>
      <StorefrontHeader {...props} />
    </div>
  );
}
