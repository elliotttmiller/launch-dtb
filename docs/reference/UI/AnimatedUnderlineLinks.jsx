import React, { useEffect } from 'react';

// CSS — optionally move to AnimatedUnderlineLinks.module.css
const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: system-ui, sans-serif;
  background: #0f172a;
  min-height: 100vh;
  display: flex; align-items: center; justify-content: center;
}

.links {
  display: flex; flex-wrap: wrap; gap: 36px;
  font-size: 18px; font-weight: 600;
}
.links a {
  position: relative;
  color: #e2e8f0;
  text-decoration: none;
  padding-bottom: 4px;
}

/* Shared pseudo-element underline */
.links a::after {
  content: "";
  position: absolute;
  left: 0; bottom: 0;
  height: 2px;
  width: 100%;
  background: #818cf8;
}

/* 1. Slide in from left (scaleX from the left edge) */
.u-slide::after {
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}
.u-slide:hover::after { transform: scaleX(1); }

/* 2. Grow from the center outward */
.u-center::after {
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.3s ease;
}
.u-center:hover::after { transform: scaleX(1); }

/* 3. Wipe across: enter from left, exit to right */
.u-wipe::after {
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s ease;
}
.u-wipe:hover::after { transform-origin: left; transform: scaleX(1); }

/* 4. Grow up in height */
.u-grow::after {
  height: 0;
  transition: height 0.25s ease;
}
.u-grow:hover::after { height: 3px; }

/* 5. Springy overshoot */
.u-bounce::after {
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.u-bounce:hover::after { transform: scaleX(1); }
`;

export default function AnimatedUnderlineLinks() {
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
    // 100% pure CSS — no JavaScript. Hover each link to see a different underline animation.
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
      <nav className="links">
        <a href="#" className="u-slide">Slide in</a>
        <a href="#" className="u-center">Center out</a>
        <a href="#" className="u-wipe">Wipe across</a>
        <a href="#" className="u-grow">Grow up</a>
        <a href="#" className="u-bounce">Springy</a>
      </nav>
    </>
  );
}