import React, { useEffect } from 'react';

// CSS — optionally move to FeatureTabsShowcase.module.css
const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0b1120;color:#e2e8f0;padding:40px 18px;display:flex;justify-content:center}

.ft-wrap{width:100%;max-width:760px}
.ft-tabs{position:relative;display:flex;gap:4px;background:#111827;border:1px solid #1f2937;border-radius:12px;padding:5px;margin:0 auto 22px;width:fit-content}
.ft-tab{position:relative;z-index:1;border:none;background:none;font-family:inherit;font-size:13.5px;font-weight:600;color:#94a3b8;padding:9px 18px;border-radius:8px;cursor:pointer;transition:color .2s;white-space:nowrap}
.ft-tab.active{color:#fff}
.ft-ink{position:absolute;top:5px;height:calc(100% - 10px);border-radius:8px;background:linear-gradient(120deg,#6366f1,#8b5cf6);transition:transform .32s cubic-bezier(.4,0,.2,1),width .32s;z-index:0}

.ft-panels{position:relative;background:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden;min-height:260px}
.ft-panel{display:grid;grid-template-columns:1fr 1fr;gap:22px;padding:26px;opacity:0;transform:translateY(10px);transition:opacity .3s,transform .3s}
.ft-panel.active{opacity:1;transform:none}
.ft-panel[hidden]{display:none}

.ft-copy h3{font-size:20px;font-weight:800;margin-bottom:8px}
.ft-copy p{font-size:13.5px;color:#94a3b8;line-height:1.55;margin-bottom:14px}
.ft-copy ul{list-style:none;display:flex;flex-direction:column;gap:8px}
.ft-copy li{font-size:13px;color:#cbd5e1;padding-left:22px;position:relative}
.ft-copy li::before{content:'✓';position:absolute;left:0;color:#8b5cf6;font-weight:900}

.ft-art{border-radius:12px;background:#0b1120;border:1px solid #1f2937;display:flex;align-items:center;justify-content:center;gap:10px;padding:18px;min-height:180px}
.ft-art-0{align-items:flex-end}
.ft-bar{flex:1;height:var(--h);background:linear-gradient(180deg,#8b5cf6,#6366f1);border-radius:6px 6px 0 0;animation:ftGrow .5s ease both}
@keyframes ftGrow{from{height:0}}
.ft-node{width:46px;height:46px;border-radius:12px;background:#1e293b;border:1px solid #334155;display:flex;align-items:center;justify-content:center;font-size:20px}
.ft-wire{width:26px;height:2px;background:linear-gradient(90deg,#6366f1,#8b5cf6)}
.ft-chip{background:#1e293b;border:1px solid #334155;border-radius:999px;padding:8px 14px;font-size:13px;font-weight:600;color:#c4b5fd}
.ft-chip-add{background:#6366f1;color:#fff;border-color:#6366f1}

@media(max-width:560px){.ft-panel{grid-template-columns:1fr}.ft-tabs{width:100%}.ft-tab{flex:1}}
`;

export default function FeatureTabsShowcase() {
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
    var tabsWrap = document.getElementById('ftTabs');
    var tabs = Array.prototype.slice.call(tabsWrap.querySelectorAll('.ft-tab'));
    var ink = document.getElementById('ftInk');
    var panels = Array.prototype.slice.call(document.querySelectorAll('.ft-panel'));
    
    function moveInk(tab) {
      ink.style.width = tab.offsetWidth + 'px';
      ink.style.transform = 'translateX(' + (tab.offsetLeft - 5) + 'px)';
    }
    
    function activate(i) {
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(function (p, j) {
        if (j === i) { p.hidden = false; requestAnimationFrame(function () { p.classList.add('active'); }); }
        else { p.classList.remove('active'); p.hidden = true; }
      });
      moveInk(tabs[i]);
    }
    
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(i); });
      // Arrow-key navigation between tabs for accessibility.
      tab.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(i + 1) % tabs.length].focus(); activate((i + 1) % tabs.length); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); var p = (i - 1 + tabs.length) % tabs.length; tabs[p].focus(); activate(p); }
      });
    });
    
    requestAnimationFrame(function () { moveInk(tabs[0]); });
    window.addEventListener('resize', function () {
      var active = tabs.filter(function (t) { return t.classList.contains('active'); })[0];
      moveInk(active);
    });
    // Cleanup: restore addEventListener and remove all listeners
    return () => {
      EventTarget.prototype.addEventListener = _originalAddEventListener;
      for (const { target, type, listener, options } of _listeners) {
        target.removeEventListener(type, listener, options);
      }
    };
  }, []);

  return (
    <>
      <style>{css}</style>
      <section className="ft-wrap">
        <div className="ft-tabs" role="tablist" id="ftTabs">
          <button className="ft-tab active" role="tab" aria-selected="true" data-i="0">Analytics</button>
          <button className="ft-tab" role="tab" aria-selected="false" data-i="1">Automation</button>
          <button className="ft-tab" role="tab" aria-selected="false" data-i="2">Collaboration</button>
          <span className="ft-ink" id="ftInk"></span>
        </div>
      
        <div className="ft-panels" id="ftPanels">
          <div className="ft-panel active" role="tabpanel">
            <div className="ft-copy"><h3>Real-time analytics</h3><p>Watch every metric update live with charts that never need a refresh.</p><ul><li>Live event stream</li><li>Custom dashboards</li><li>Export to CSV</li></ul></div>
            <div className="ft-art ft-art-0"><div className="ft-bar" style={{ '--h': '40%' }}></div><div className="ft-bar" style={{ '--h': '70%' }}></div><div className="ft-bar" style={{ '--h': '55%' }}></div><div className="ft-bar" style={{ '--h': '90%' }}></div><div className="ft-bar" style={{ '--h': '65%' }}></div></div>
          </div>
          <div className="ft-panel" role="tabpanel" hidden>
            <div className="ft-copy"><h3>Workflow automation</h3><p>Chain triggers and actions so repetitive work runs itself.</p><ul><li>Visual rule builder</li><li>200+ integrations</li><li>Error retries</li></ul></div>
            <div className="ft-art ft-art-1"><div className="ft-node">⚡</div><div className="ft-wire"></div><div className="ft-node">⚙</div><div className="ft-wire"></div><div className="ft-node">✓</div></div>
          </div>
          <div className="ft-panel" role="tabpanel" hidden>
            <div className="ft-copy"><h3>Team collaboration</h3><p>Comment, mention, and resolve right where the work happens.</p><ul><li>Inline threads</li><li>Live presence</li><li>Role permissions</li></ul></div>
            <div className="ft-art ft-art-2"><div className="ft-chip">@maya</div><div className="ft-chip">@devon</div><div className="ft-chip">@priya</div><div className="ft-chip ft-chip-add">+4</div></div>
          </div>
        </div>
      </section>
    </>
  );
}