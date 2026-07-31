import React, { useEffect } from 'react';

// CSS — optionally move to AnimatedTabsWithIndicator.module.css
const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }

.demo { width: 100%; max-width: 520px; }

.tabs {
  display: flex; position: relative;
  background: #e2e8f0; border-radius: 10px;
  padding: 4px; gap: 2px; margin-bottom: 20px;
}

.tab {
  flex: 1; padding: 8px 10px; font-size: 13px; font-weight: 600;
  color: #64748b; background: none; border: none; cursor: pointer;
  border-radius: 7px; position: relative; z-index: 1;
  transition: color 0.2s; font-family: inherit; white-space: nowrap;
}
.tab.active { color: #1e293b; }

.indicator {
  position: absolute; top: 4px; bottom: 4px;
  background: #fff; border-radius: 7px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.12);
  transition: left 0.25s cubic-bezier(0.4,0,0.2,1), width 0.25s cubic-bezier(0.4,0,0.2,1);
  pointer-events: none;
}

.panels { }
.panel { display: none; animation: fadeIn 0.2s ease; }
.panel.active { display: block; }
.panel h3 { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
.panel p  { font-size: 14px; color: #64748b; line-height: 1.65; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
`;

export default function AnimatedTabsWithIndicator() {
  // Auto-generated escape hatch: the original snippet's vanilla JS runs once
  // after mount and queries the rendered DOM. For idiomatic React, lift this
  // into state + handlers.
  useEffect(() => {
    const _listeners = [];
    const _originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function(type, listener, options) {
      _listeners.push({ target: this, type, listener, options });
      return _originalAddEventListener.call(this, type, listener, options);
    };
    function switchTab(btn, idx) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.panel')[idx].classList.add('active');
      moveIndicator(btn);
    }
    
    function moveIndicator(btn) {
      const tabsEl = document.getElementById('tabs');
      const ind    = document.getElementById('indicator');
      const rect   = btn.getBoundingClientRect();
      const pRect  = tabsEl.getBoundingClientRect();
      ind.style.left  = (rect.left - pRect.left) + 'px';
      ind.style.width = rect.width + 'px';
    }
    
    // Init on load
    const firstTab = document.querySelector('.tab.active');
    if (firstTab) moveIndicator(firstTab);
    window.addEventListener('resize', () => {
      const active = document.querySelector('.tab.active');
      if (active) moveIndicator(active);
    });
    // Cleanup: restore addEventListener and remove all listeners
    return () => {
      EventTarget.prototype.addEventListener = _originalAddEventListener;
      for (const { target, type, listener, options } of _listeners) {
        target.removeEventListener(type, listener, options);
      }
    };

    // Expose handlers used by inline JSX events to the global scope
    if (typeof switchTab === 'function') window.switchTab = switchTab;
  }, []);

  return (
    <>
      <style>{css}</style>
      <div className="demo">
        <div className="tabs" id="tabs">
          <button className="tab active" onClick={(event) => { switchTab(event.currentTarget,0) }}>Overview</button>
          <button className="tab" onClick={(event) => { switchTab(event.currentTarget,1) }}>Features</button>
          <button className="tab" onClick={(event) => { switchTab(event.currentTarget,2) }}>Pricing</button>
          <button className="tab" onClick={(event) => { switchTab(event.currentTarget,3) }}>Docs</button>
          <div className="indicator" id="indicator"></div>
        </div>
        <div className="panels">
          <div className="panel active"><h3>Product Overview</h3><p>A high-level summary of what the product does and who it's for. Start here if you're new.</p></div>
          <div className="panel"><h3>Key Features</h3><p>Deep dive into individual features — integrations, automations, custom workflows, and API access.</p></div>
          <div className="panel"><h3>Pricing Plans</h3><p>Compare Starter, Pro, and Team plans. All include a 14-day free trial with no credit card required.</p></div>
          <div className="panel"><h3>Documentation</h3><p>Full API reference, SDK guides, tutorials, and example projects to get you up and running fast.</p></div>
        </div>
      </div>
    </>
  );
}