var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/2qQSCNYRwdZQo8UkPzfJ/K0nzfwzwv9DSMMCzogvn/e1vFUka05.js
import { jsx as _jsx20, jsxs as _jsxs12 } from "react/jsx-runtime";
import { addFonts as addFonts9, addPropertyControls as addPropertyControls15, ComponentViewportProvider as ComponentViewportProvider6, ControlType as ControlType15, cx as cx14, forwardLoader as forwardLoader6, getFonts as getFonts6, Instance as Instance2, Link as Link3, SmartComponentScopedContainer as SmartComponentScopedContainer6, SVG as SVG6, useActiveVariantCallback as useActiveVariantCallback9, useComponentViewport as useComponentViewport9, useLocaleInfo as useLocaleInfo17, useVariantState as useVariantState9, withCSS as withCSS15 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup9, motion as motion20, MotionConfigContext as MotionConfigContext9 } from "framer-motion";
import * as React18 from "react";
import { useRef as useRef15 } from "react";

// http-url:https://framerusercontent.com/modules/2QGlX864pmL5cxqknTvK/sudwzLB4XBD5Atme8MXS/UvPxI2Cnv.js
import { jsx as _jsx } from "react/jsx-runtime";
import { addPropertyControls, ControlType, cx, motion, useSVGTemplate, withCSS } from "./_framer-runtime.js";
import * as React from "react";
import { forwardRef as forwardRef2 } from "react";
var mask = "var(--framer-icon-mask)";
var Base = /* @__PURE__ */ forwardRef2(function(props, ref) {
  return /* @__PURE__ */ _jsx("svg", { ...props, ref, children: props.children });
});
var MotionSVG = motion.create(Base);
var SVG = /* @__PURE__ */ forwardRef2((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx(MotionSVG, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx("svg", { ...rest, ref, children });
});
var svg = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 0 6 C 0 2.686 2.686 0 6 0 C 9.314 0 12 2.686 12 6 C 12 9.314 9.314 12 6 12 C 2.686 12 0 9.314 0 6 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="12px" id="cPTa10O2f" transform="translate(6 3)" width="12px"/><path d="M 0 6 C 0 2.686 2.686 0 6 0 C 9.314 0 12 2.686 12 6 C 12 9.314 9.314 12 6 12 C 2.686 12 0 9.314 0 6 Z" fill="transparent" height="12px" id="K1KJBDfjt" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(6 3)" width="12px"/><path d="M 0 5.25 C 1.816 2.112 5.114 0 9 0 C 12.886 0 16.184 2.112 18 5.25" fill="transparent" height="5.25px" id="nuzXpJw0A" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3 15)" width="18px"/></svg>';
var getProps = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component = /* @__PURE__ */ React.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps(props);
  const href = useSVGTemplate("1327812126", svg);
  return /* @__PURE__ */ _jsx(SVG, { ...restProps, className: cx("framer-vWtJe", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx("use", { href }) });
});
var css = [`.framer-vWtJe { -webkit-mask: ${mask}; aspect-ratio: 1; display: block; mask: ${mask}; width: 24px; }`];
var Icon = withCSS(Component, css, "framer-vWtJe");
Icon.displayName = "User";
var UvPxI2Cnv_default = Icon;
addPropertyControls(Icon, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType.Number } });

// http-url:https://framerusercontent.com/modules/4xJsJPc59it6XmHEERsh/koUifyDPwJ9ohyYl3uMd/itu1soPCZ.js
import { jsx as _jsx2 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls2, ControlType as ControlType2, cx as cx2, motion as motion2, useSVGTemplate as useSVGTemplate2, withCSS as withCSS2 } from "./_framer-runtime.js";
import * as React2 from "react";
import { forwardRef as forwardRef4 } from "react";
var mask2 = "var(--framer-icon-mask)";
var Base2 = /* @__PURE__ */ forwardRef4(function(props, ref) {
  return /* @__PURE__ */ _jsx2("svg", { ...props, ref, children: props.children });
});
var MotionSVG2 = motion2.create(Base2);
var SVG2 = /* @__PURE__ */ forwardRef4((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx2(MotionSVG2, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx2("svg", { ...rest, ref, children });
});
var svg2 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 0 12 L 0 0 L 16.5 0 L 16.5 12 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="12px" id="gwB_ZdJt6" transform="translate(3.75 6)" width="16.5px"/><path d="M 0 0 L 16.5 0" fill="transparent" height="1px" id="xGkn4qbwc" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3.75 12)" width="16.5px"/><path d="M 0 0 L 16.5 0" fill="transparent" height="1px" id="uQ9bOFKFt" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3.75 6)" width="16.5px"/><path d="M 0 0 L 16.5 0" fill="transparent" height="1px" id="hrURkUe9P" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3.75 18)" width="16.5px"/></svg>';
var getProps2 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component2 = /* @__PURE__ */ React2.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps2(props);
  const href = useSVGTemplate2("3559153988", svg2);
  return /* @__PURE__ */ _jsx2(SVG2, { ...restProps, className: cx2("framer-iZmZi", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx2("use", { href }) });
});
var css2 = [`.framer-iZmZi { -webkit-mask: ${mask2}; aspect-ratio: 1; display: block; mask: ${mask2}; width: 24px; }`];
var Icon2 = withCSS2(Component2, css2, "framer-iZmZi");
Icon2.displayName = "List";
var itu1soPCZ_default = Icon2;
addPropertyControls2(Icon2, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType2.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType2.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType2.Number } });

// http-url:https://framerusercontent.com/modules/6wAE2eMb2Tl3zrU7u4UL/mKj6QS2p4Cgdaa0WrZKY/Search.js
import { jsx as _jsx8, jsxs as _jsxs6 } from "react/jsx-runtime";
import { createPortal } from "react-dom";
import { useRef as useRef6, useState as useState10, useEffect as useEffect10, forwardRef as forwardRef9 } from "react";
import { AnimatePresence, motion as motion8 } from "framer-motion";

// http-url:https://framerusercontent.com/modules/LV9trClbmNwd5PVj9l8y/L4rFqMGNzGSwRZpGTGF3/Icons.js
import { jsx as _jsx3, jsxs as _jsxs } from "react/jsx-runtime";
import { motion as motion3 } from "framer-motion";
function SearchIcon(props) {
  return /* @__PURE__ */ _jsx3("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 256 256", width: props.width, height: props.height, style: { ...props.style, color: props.color }, children: /* @__PURE__ */ _jsx3("path", { d: "M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z", fill: "currentColor" }) });
}
function ClearIcon(props) {
  return /* @__PURE__ */ _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 256 256", ...props, children: [/* @__PURE__ */ _jsx3("rect", { width: "256", height: "256", fill: "none" }), /* @__PURE__ */ _jsx3("path", { d: "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,130.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32L139.31,128Z", fill: "currentColor" })] });
}
function SpinnerIcon(props) {
  const borderWidth = 3;
  return /* @__PURE__ */ _jsxs("div", { style: { position: "relative", ...props.style }, children: [/* @__PURE__ */ _jsx3(motion3.div, { animate: { rotate: 360 }, transition: { ease: "linear", duration: 1, repeat: Infinity }, style: { borderRadius: 100, backgroundImage: `conic-gradient(from 270deg, transparent 0%, ${props.color} 100%)`, width: "100%", height: "100%" } }), /* @__PURE__ */ _jsx3("div", { style: { backgroundColor: props.backgroundColor, borderRadius: 100, position: "absolute", top: borderWidth, left: borderWidth, bottom: borderWidth, right: borderWidth } })] });
}

// http-url:https://framerusercontent.com/modules/6wAE2eMb2Tl3zrU7u4UL/mKj6QS2p4Cgdaa0WrZKY/Search.js
import { addPropertyControls as addPropertyControls3, ControlType as ControlType3, RenderTarget, withCSS as withCSS3 } from "./_framer-runtime.js";

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/lCNMpf6DznmmCJRndYjM/SearchModal.js
import { jsx as _jsx7, jsxs as _jsxs5 } from "react/jsx-runtime";

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/1vZ2fdkLJI4IprrVTHqR/useSearch.js
import { useLocaleInfo as useLocaleInfo7 } from "./_framer-runtime.js";
import { clamp as clamp7 } from "framer-motion";
import { useEffect as useEffect7, useState as useState7, useTransition as useTransition4 } from "react";

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/1GynhDlRW7uuXFYW1RXb/SearchModal.js
import { jsx as _jsx6, jsxs as _jsxs4 } from "react/jsx-runtime";

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/fpvHBWGoGQcWezUopJLS/useSearch.js
import { useLocaleInfo as useLocaleInfo5 } from "./_framer-runtime.js";
import { clamp as clamp5 } from "framer-motion";
import { useEffect as useEffect5, useState as useState5, useTransition as useTransition3 } from "react";

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/bsLTiXYjkHoD2XaMjabu/SearchModal.js
import { jsx as _jsx5, jsxs as _jsxs3 } from "react/jsx-runtime";

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/G59GwobMNJqwSjtPO6Pv/useSearch.js
import { useLocaleInfo as useLocaleInfo3 } from "./_framer-runtime.js";
import { clamp as clamp3 } from "framer-motion";
import { useEffect as useEffect3, useState as useState3, useTransition as useTransition2 } from "react";

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/wgITiHCOZBBo33pin0wW/SearchModal.js
import { jsx as _jsx4, jsxs as _jsxs2 } from "react/jsx-runtime";

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/IOZYtsQMauhTmjY894DM/useSearch.js
import { useLocaleInfo } from "./_framer-runtime.js";
import { clamp } from "framer-motion";
import { useEffect, useState, useTransition } from "react";

// http-url:https://framerusercontent.com/modules/3Xi2AslpcDRhfyCVPmx3/d0Oobr5BHnVqZJQyMdGn/storage.js
function Storage(name) {
  this.ready = new Promise((resolve, reject) => {
    var request = __dai_window.indexedDB.open(location.origin);
    request.onupgradeneeded = (e) => {
      this.db = e.target["result"];
      this.db.createObjectStore("store");
    };
    request.onsuccess = (e) => {
      this.db = e.target["result"];
      resolve();
    };
    request.onerror = (e) => {
      this.db = e.target["result"];
      reject(e);
    };
  });
}
Storage.prototype.get = function(key) {
  return this.ready.then(() => {
    return new Promise((resolve, reject) => {
      var request = this.getStore().get(key);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = reject;
    });
  });
};
Storage.prototype.getStore = function() {
  return this.db.transaction([
    "store"
  ], "readwrite").objectStore("store");
};
Storage.prototype.set = function(key, value) {
  return this.ready.then(() => {
    return new Promise((resolve, reject) => {
      var request = this.getStore().put(value, key);
      request.onsuccess = resolve;
      request.onerror = reject;
    });
  });
};
Storage.prototype.delete = function(key, value) {
  __dai_window.indexedDB.deleteDatabase(location.origin);
};

// http-url:https://framerusercontent.com/modules/m2nL4qHNbqX9QCxsHsGL/b9aplVZjN51x28yfNK16/cache.js
async function setCachedData(url, dataToCache, cache = new Storage("cache")) {
  const cacheKey = url;
  const data = await cache.set(cacheKey, dataToCache);
}
async function checkForCachedData(url, cache = new Storage("cache")) {
  const cacheKey = url;
  const data = await cache.get(cacheKey);
  if (data) {
    return data;
  } else {
    return null;
  }
}

// http-url:https://framerusercontent.com/modules/uU1mtMKXsrVAg8N5hW7w/v7gDLwKJgQ5vAsFHxY4H/cachedIndex.js
var VERSION = 1;
function isDefaultLocaleId(localeId) {
  return !localeId || localeId === "default";
}
var INDEX_KEY = "searchIndexCache";
function getIndexKey(localeId) {
  if (isDefaultLocaleId(localeId))
    return INDEX_KEY;
  return `${INDEX_KEY}-${localeId}`;
}
var METADATA_KEY = "searchCacheMetadata";
function getMetadataKey(localeId) {
  if (isDefaultLocaleId(localeId))
    return METADATA_KEY;
  return `${METADATA_KEY}-${localeId}`;
}
async function getCachedIndex(localeId, indexHash) {
  const metadataKey = getMetadataKey(localeId);
  const indexKey = getIndexKey(localeId);
  const [metadata, cachedIndex] = await Promise.all([checkForCachedData(metadataKey), checkForCachedData(indexKey)]);
  if (cachedIndex) {
    return { status: indexHash && metadata?.indexHash === indexHash ? "fresh" : "stale", searchIndex: cachedIndex, indexHash: metadata?.indexHash };
  }
  return { status: "miss" };
}
function setCachedIndex(localeId, index, indexHash) {
  const indexKey = getIndexKey(localeId);
  setCachedData(indexKey, index);
  const metadata = { version: VERSION, timestamp: Date.now(), indexHash };
  const metadataKey = getMetadataKey(localeId);
  setCachedData(metadataKey, metadata);
}

// http-url:https://framerusercontent.com/modules/K9JZRwJcE6slDAf8rUmh/mJ54py1Ecnn1RoC4N1m4/fakeResults.js
var fakeResults = { "/": { version: 1, title: "Example Search Result", description: "Description of search result.", keywords: "", h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], p: [], url: "/example-url/", codeblock: [] }, "/example-1": { version: 1, title: "Publish your Site to Search", description: "Try Site Search to instantly search your Framer site content.", keywords: "", h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], p: [], url: "/example-url/1/", codeblock: [] }, "/example-2": { version: 1, title: "Customise your Site Search", description: "Personalize everything from corner radius, to icon weight.", keywords: "", h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], p: [], url: "/example-url/2/", codeblock: [] } };

// http-url:https://framerusercontent.com/modules/TwRgbWuhHeB95MPifel4/YW8Hlm59FG3PajbrVsaR/fuzzySearch.js
var peq = new Uint32Array(65536);
var myers_32 = (a, b) => {
  const n = a.length;
  const m = b.length;
  const lst = 1 << n - 1;
  let pv = -1;
  let mv = 0;
  let sc = n;
  let i = n;
  while (i--) {
    peq[a.charCodeAt(i)] |= 1 << i;
  }
  for (i = 0; i < m; i++) {
    let eq = peq[b.charCodeAt(i)];
    const xv = eq | mv;
    eq |= (eq & pv) + pv ^ pv;
    mv |= ~(eq | pv);
    pv &= eq;
    if (mv & lst) {
      sc++;
    }
    if (pv & lst) {
      sc--;
    }
    mv = mv << 1 | 1;
    pv = pv << 1 | ~(xv | mv);
    mv &= xv;
  }
  i = n;
  while (i--) {
    peq[a.charCodeAt(i)] = 0;
  }
  return sc;
};
var myers_x = (b, a) => {
  const n = a.length;
  const m = b.length;
  const mhc = [];
  const phc = [];
  const hsize = Math.ceil(n / 32);
  const vsize = Math.ceil(m / 32);
  for (let i = 0; i < hsize; i++) {
    phc[i] = -1;
    mhc[i] = 0;
  }
  let j = 0;
  for (; j < vsize - 1; j++) {
    let mv = 0;
    let pv = -1;
    const start = j * 32;
    const vlen = Math.min(32, m) + start;
    for (let k = start; k < vlen; k++) {
      peq[b.charCodeAt(k)] |= 1 << k;
    }
    for (let i1 = 0; i1 < n; i1++) {
      const eq = peq[a.charCodeAt(i1)];
      const pb = phc[i1 / 32 | 0] >>> i1 & 1;
      const mb = mhc[i1 / 32 | 0] >>> i1 & 1;
      const xv = eq | mv;
      const xh = ((eq | mb) & pv) + pv ^ pv | eq | mb;
      let ph = mv | ~(xh | pv);
      let mh = pv & xh;
      if (ph >>> 31 ^ pb) {
        phc[i1 / 32 | 0] ^= 1 << i1;
      }
      if (mh >>> 31 ^ mb) {
        mhc[i1 / 32 | 0] ^= 1 << i1;
      }
      ph = ph << 1 | pb;
      mh = mh << 1 | mb;
      pv = mh | ~(xv | ph);
      mv = ph & xv;
    }
    for (let k1 = start; k1 < vlen; k1++) {
      peq[b.charCodeAt(k1)] = 0;
    }
  }
  let mv1 = 0;
  let pv1 = -1;
  const start1 = j * 32;
  const vlen1 = Math.min(32, m - start1) + start1;
  for (let k2 = start1; k2 < vlen1; k2++) {
    peq[b.charCodeAt(k2)] |= 1 << k2;
  }
  let score = m;
  for (let i2 = 0; i2 < n; i2++) {
    const eq1 = peq[a.charCodeAt(i2)];
    const pb1 = phc[i2 / 32 | 0] >>> i2 & 1;
    const mb1 = mhc[i2 / 32 | 0] >>> i2 & 1;
    const xv1 = eq1 | mv1;
    const xh1 = ((eq1 | mb1) & pv1) + pv1 ^ pv1 | eq1 | mb1;
    let ph1 = mv1 | ~(xh1 | pv1);
    let mh1 = pv1 & xh1;
    score += ph1 >>> m - 1 & 1;
    score -= mh1 >>> m - 1 & 1;
    if (ph1 >>> 31 ^ pb1) {
      phc[i2 / 32 | 0] ^= 1 << i2;
    }
    if (mh1 >>> 31 ^ mb1) {
      mhc[i2 / 32 | 0] ^= 1 << i2;
    }
    ph1 = ph1 << 1 | pb1;
    mh1 = mh1 << 1 | mb1;
    pv1 = mh1 | ~(xv1 | ph1);
    mv1 = ph1 & xv1;
  }
  for (let k3 = start1; k3 < vlen1; k3++) {
    peq[b.charCodeAt(k3)] = 0;
  }
  return score;
};
var distance = (a, b) => {
  if (a.length < b.length) {
    const tmp = b;
    b = a;
    a = tmp;
  }
  if (b.length === 0) {
    return a.length;
  }
  if (a.length <= 32) {
    return myers_32(a, b);
  }
  return myers_x(a, b);
};

// http-url:https://framerusercontent.com/modules/MWsEnYfRnoOQq31DN4ql/fxR5MNtgeSOU8Mj4iY9n/utils.js
var localStorageDebugFlag = (() => {
  try {
    return typeof __dai_window !== "undefined" && __dai_window.localStorage.__framerDebugSearch === "true";
  } catch (e) {
  }
})();
var groupsRegex = /[A-Z]{2,}|[A-Z][a-z]+|[a-z]+|[A-Z]\d*|\d+/gu;
function capitalizeFirstLetter(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function titleCase(value) {
  const groups = value.match(groupsRegex) || [];
  return groups.map(capitalizeFirstLetter).join(" ");
}
function clampText(text, maxLength) {
  const textLength = text.length;
  if (textLength <= maxLength) {
    return text;
  }
  const slicedText = text.slice(0, maxLength);
  if (textLength > maxLength) {
    return slicedText + "\u2026";
  }
  return slicedText;
}
function isEmptyObject(object) {
  return Object.keys(object).length === 0;
}
function createLogger(showOutput) {
  function log5(...data) {
    console.log(Date.now(), ...data);
  }
  function time5(label) {
    console.time(label);
  }
  function timeEnd5(label) {
    console.timeEnd(label);
  }
  function noop() {
  }
  if (!showOutput) {
    return { log: noop, time: noop, timeEnd: noop };
  }
  return { log: log5, time: time5, timeEnd: timeEnd5 };
}
var DEFAULT_FONT_FAMILY = `"Inter", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`;
function getFontFamily(theme) {
  if (theme.inputFont?.fontFamily)
    return theme.inputFont.fontFamily;
  if (theme.titleFont?.fontFamily)
    return theme.titleFont.fontFamily;
  if (theme.subtitleFont?.fontFamily)
    return theme.subtitleFont.fontFamily;
  return DEFAULT_FONT_FAMILY;
}
function animationKeyFromLayout(layout) {
  return `${layout}Animation`;
}
var safeDocument = typeof document !== "undefined" ? document : null;
var safeWindow = typeof __dai_window !== "undefined" ? __dai_window : null;
var metaTagSelector = 'meta[name="framer-search-index"]';
function getMetaTagContent() {
  const metaTag = safeDocument?.querySelector(metaTagSelector);
  if (!metaTag)
    return void 0;
  const metaTagContent = metaTag.getAttribute("content");
  return metaTagContent;
}
var checkIfOverLimit = () => {
  return getMetaTagContent() === "limit-reached";
};
function stripLocaleSlugFromPath(url, localeSlug) {
  if (!localeSlug)
    return url;
  const localeSlugWithSlash = `/${localeSlug}`;
  if (url.startsWith(localeSlugWithSlash)) {
    return url.slice(localeSlugWithSlash.length);
  }
}
function yieldToMain(isHighPriority) {
  if ("scheduler" in __dai_window) {
    const options = { priority: isHighPriority ? "user-blocking" : "user-visible" };
    if ("yield" in scheduler)
      return scheduler.yield(options);
    if ("postTask" in scheduler)
      return scheduler.postTask(() => {
      }, options);
  }
  if (isHighPriority) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/IOZYtsQMauhTmjY894DM/useSearch.js
var { log, time, timeEnd } = createLogger(localStorageDebugFlag);
var splitWordsRegex = (() => {
  try {
    const regex = RegExp("[\\s.,;!?\\p{P}\\p{Z}]+(?<!\\p{L}&)(?!&\\p{L})", "u");
    "".split(regex);
    return regex;
  } catch {
    log("Falling back to regex without lookbehind");
    return RegExp("[\\s.,;!?\\p{P}\\p{Z}]+", "u");
  }
})();

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/wgITiHCOZBBo33pin0wW/SearchModal.js
import React3, { useEffect as useEffect2, useState as useState2, useMemo, forwardRef as forwardRef5, useRef as useRef2, useDeferredValue, useLayoutEffect, useCallback as useCallback2, useImperativeHandle } from "react";

// http-url:https://framerusercontent.com/modules/PJVBcBLmDteTEAZh3J9Z/keXJyjyE9VnzUcDMayjg/browser.js
var Browser;
(function(Browser2) {
  var isTouch = Browser2.isTouch = () => "ontouchstart" in __dai_window || __dai_navigator.maxTouchPoints > 0;
  var isChrome = Browser2.isChrome = () => __dai_navigator.userAgent.toLowerCase().includes("chrome/");
  var isWebKit = Browser2.isWebKit = () => __dai_navigator.userAgent.toLowerCase().includes("applewebkit/");
  var isSafari = Browser2.isSafari = () => isWebKit() && !isChrome();
  var isSafariDesktop = Browser2.isSafariDesktop = () => isSafari() && !isTouch();
  var isWindows = Browser2.isWindows = () => /Win/.test(__dai_navigator.platform);
  var isMacOS = Browser2.isMacOS = () => /Mac/.test(__dai_navigator.platform);
})(Browser || (Browser = {}));

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/wgITiHCOZBBo33pin0wW/SearchModal.js
import { motion as motion4, clamp as clamp2, useAnimate } from "framer-motion";

// http-url:https://framerusercontent.com/modules/Gzef0nFihI9m9vZG45th/lIUxbZcreiDm2GzUkt3y/useCallbackOnMouseMove.js
import { useRef, useCallback } from "react";
var useCallbackOnMouseMove = (callback, mousePositionRef) => {
  const prevPositionRef = useRef(null);
  return useCallback((event) => {
    if (!Browser.isSafari())
      return callback(event);
    const ref = mousePositionRef ? mousePositionRef : prevPositionRef;
    const { clientX, clientY } = event;
    const prevCursorPosition = ref.current;
    ref.current = { x: clientX, y: clientY };
    if (!prevCursorPosition) {
      return;
    }
    if (prevCursorPosition.x !== clientX || prevCursorPosition.y !== clientY) {
      return callback(event);
    }
  }, [mousePositionRef, callback]);
};

// http-url:https://framerusercontent.com/modules/eAnjm75CdfYT1Zz4BIaz/7KDSfnnyD1T3Ap75L4m8/scrollIntoView.js
function scrollIntoView(targetElement, scrollElement, { offsetTop, offsetBottom }) {
  const targetElementBounds = targetElement.getBoundingClientRect();
  const scrollElementBounds = scrollElement.getBoundingClientRect();
  if (targetElementBounds.top < scrollElementBounds.top) {
    const difference = scrollElementBounds.top - targetElementBounds.top;
    scrollElement.scrollTop = scrollElement.scrollTop - difference - offsetTop;
  } else if (targetElementBounds.bottom > scrollElementBounds.bottom) {
    const topAligned = scrollElementBounds.top - targetElementBounds.top;
    const minOffset = scrollElement.scrollTop - topAligned - offsetTop;
    const bottomAligned = targetElementBounds.bottom - scrollElementBounds.bottom;
    const offset = scrollElement.scrollTop + bottomAligned + offsetBottom;
    scrollElement.scrollTop = Math.min(minOffset, offset);
  }
}

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/wgITiHCOZBBo33pin0wW/SearchModal.js
import {
  useLocaleInfo as useLocaleInfo2,
  useRouter,
  inferInitialRouteFromPath
} from "./_framer-runtime.js";
var SearchInputClearButtonType;
(function(SearchInputClearButtonType5) {
  SearchInputClearButtonType5["Icon"] = "icon";
  SearchInputClearButtonType5["Text"] = "text";
  SearchInputClearButtonType5["None"] = "none";
})(SearchInputClearButtonType || (SearchInputClearButtonType = {}));
var SearchInputDividerType;
(function(SearchInputDividerType5) {
  SearchInputDividerType5["None"] = "none";
  SearchInputDividerType5["FullWidth"] = "fullWidth";
  SearchInputDividerType5["Contained"] = "contained";
})(SearchInputDividerType || (SearchInputDividerType = {}));
var SearchResultTitleType;
(function(SearchResultTitleType5) {
  SearchResultTitleType5["H1"] = "h1";
  SearchResultTitleType5["Title"] = "title";
})(SearchResultTitleType || (SearchResultTitleType = {}));
var SearchResultSubtitleType;
(function(SearchResultSubtitleType5) {
  SearchResultSubtitleType5["Description"] = "description";
  SearchResultSubtitleType5["Path"] = "path";
})(SearchResultSubtitleType || (SearchResultSubtitleType = {}));
var SearchResultItemType;
(function(SearchResultItemType5) {
  SearchResultItemType5["FullWidth"] = "fullWidth";
  SearchResultItemType5["Contained"] = "contained";
})(SearchResultItemType || (SearchResultItemType = {}));
var SearchLayoutType;
(function(SearchLayoutType5) {
  SearchLayoutType5["Sidebar"] = "Sidebar";
  SearchLayoutType5["FixedTop"] = "FixedTop";
  SearchLayoutType5["QuickMenu"] = "QuickMenu";
})(SearchLayoutType || (SearchLayoutType = {}));
var SearchEntryType;
(function(SearchEntryType5) {
  SearchEntryType5["Icon"] = "icon";
  SearchEntryType5["Text"] = "text";
})(SearchEntryType || (SearchEntryType = {}));
var SearchIconType;
(function(SearchIconType5) {
  SearchIconType5["Default"] = "default";
  SearchIconType5["Custom"] = "custom";
})(SearchIconType || (SearchIconType = {}));

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/G59GwobMNJqwSjtPO6Pv/useSearch.js
var { log: log2, time: time2, timeEnd: timeEnd2 } = createLogger(localStorageDebugFlag);
var splitWordsRegex2 = (() => {
  try {
    const regex = RegExp("[\\s.,;!?\\p{P}\\p{Z}]+(?<!\\p{L}&)(?!&\\p{L})", "u");
    "".split(regex);
    return regex;
  } catch {
    log2("Falling back to regex without lookbehind");
    return RegExp("[\\s.,;!?\\p{P}\\p{Z}]+", "u");
  }
})();

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/bsLTiXYjkHoD2XaMjabu/SearchModal.js
import React4, { useEffect as useEffect4, useState as useState4, useMemo as useMemo2, forwardRef as forwardRef6, useRef as useRef3, useDeferredValue as useDeferredValue2, useLayoutEffect as useLayoutEffect2, useCallback as useCallback3, useImperativeHandle as useImperativeHandle2 } from "react";
import { motion as motion5, clamp as clamp4, useAnimate as useAnimate2 } from "framer-motion";
import {
  useLocaleInfo as useLocaleInfo4,
  useRouter as useRouter2,
  inferInitialRouteFromPath as inferInitialRouteFromPath2
} from "./_framer-runtime.js";
var SearchInputClearButtonType2;
(function(SearchInputClearButtonType5) {
  SearchInputClearButtonType5["Icon"] = "icon";
  SearchInputClearButtonType5["Text"] = "text";
  SearchInputClearButtonType5["None"] = "none";
})(SearchInputClearButtonType2 || (SearchInputClearButtonType2 = {}));
var SearchInputDividerType2;
(function(SearchInputDividerType5) {
  SearchInputDividerType5["None"] = "none";
  SearchInputDividerType5["FullWidth"] = "fullWidth";
  SearchInputDividerType5["Contained"] = "contained";
})(SearchInputDividerType2 || (SearchInputDividerType2 = {}));
var SearchResultTitleType2;
(function(SearchResultTitleType5) {
  SearchResultTitleType5["H1"] = "h1";
  SearchResultTitleType5["Title"] = "title";
})(SearchResultTitleType2 || (SearchResultTitleType2 = {}));
var SearchResultSubtitleType2;
(function(SearchResultSubtitleType5) {
  SearchResultSubtitleType5["Description"] = "description";
  SearchResultSubtitleType5["Path"] = "path";
})(SearchResultSubtitleType2 || (SearchResultSubtitleType2 = {}));
var SearchResultItemType2;
(function(SearchResultItemType5) {
  SearchResultItemType5["FullWidth"] = "fullWidth";
  SearchResultItemType5["Contained"] = "contained";
})(SearchResultItemType2 || (SearchResultItemType2 = {}));
var SearchLayoutType2;
(function(SearchLayoutType5) {
  SearchLayoutType5["Sidebar"] = "Sidebar";
  SearchLayoutType5["FixedTop"] = "FixedTop";
  SearchLayoutType5["QuickMenu"] = "QuickMenu";
})(SearchLayoutType2 || (SearchLayoutType2 = {}));
var SearchEntryType2;
(function(SearchEntryType5) {
  SearchEntryType5["Icon"] = "icon";
  SearchEntryType5["Text"] = "text";
})(SearchEntryType2 || (SearchEntryType2 = {}));
var SearchIconType2;
(function(SearchIconType5) {
  SearchIconType5["Default"] = "default";
  SearchIconType5["Custom"] = "custom";
})(SearchIconType2 || (SearchIconType2 = {}));

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/fpvHBWGoGQcWezUopJLS/useSearch.js
var { log: log3, time: time3, timeEnd: timeEnd3 } = createLogger(localStorageDebugFlag);
var splitWordsRegex3 = (() => {
  try {
    const regex = RegExp("[\\s.,;!?\\p{P}\\p{Z}]+(?<!\\p{L}&)(?!&\\p{L})", "u");
    "".split(regex);
    return regex;
  } catch {
    log3("Falling back to regex without lookbehind");
    return RegExp("[\\s.,;!?\\p{P}\\p{Z}]+", "u");
  }
})();

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/1GynhDlRW7uuXFYW1RXb/SearchModal.js
import React5, { useEffect as useEffect6, useState as useState6, useMemo as useMemo3, forwardRef as forwardRef7, useRef as useRef4, useDeferredValue as useDeferredValue3, useLayoutEffect as useLayoutEffect3, useCallback as useCallback4, useImperativeHandle as useImperativeHandle3 } from "react";
import { motion as motion6, clamp as clamp6, useAnimate as useAnimate3 } from "framer-motion";
import {
  useLocaleInfo as useLocaleInfo6,
  useRouter as useRouter3,
  inferInitialRouteFromPath as inferInitialRouteFromPath3
} from "./_framer-runtime.js";
var SearchInputClearButtonType3;
(function(SearchInputClearButtonType5) {
  SearchInputClearButtonType5["Icon"] = "icon";
  SearchInputClearButtonType5["Text"] = "text";
  SearchInputClearButtonType5["None"] = "none";
})(SearchInputClearButtonType3 || (SearchInputClearButtonType3 = {}));
var SearchInputDividerType3;
(function(SearchInputDividerType5) {
  SearchInputDividerType5["None"] = "none";
  SearchInputDividerType5["FullWidth"] = "fullWidth";
  SearchInputDividerType5["Contained"] = "contained";
})(SearchInputDividerType3 || (SearchInputDividerType3 = {}));
var SearchResultTitleType3;
(function(SearchResultTitleType5) {
  SearchResultTitleType5["H1"] = "h1";
  SearchResultTitleType5["Title"] = "title";
})(SearchResultTitleType3 || (SearchResultTitleType3 = {}));
var SearchResultSubtitleType3;
(function(SearchResultSubtitleType5) {
  SearchResultSubtitleType5["Description"] = "description";
  SearchResultSubtitleType5["Path"] = "path";
})(SearchResultSubtitleType3 || (SearchResultSubtitleType3 = {}));
var SearchResultItemType3;
(function(SearchResultItemType5) {
  SearchResultItemType5["FullWidth"] = "fullWidth";
  SearchResultItemType5["Contained"] = "contained";
})(SearchResultItemType3 || (SearchResultItemType3 = {}));
var SearchLayoutType3;
(function(SearchLayoutType5) {
  SearchLayoutType5["Sidebar"] = "Sidebar";
  SearchLayoutType5["FixedTop"] = "FixedTop";
  SearchLayoutType5["QuickMenu"] = "QuickMenu";
})(SearchLayoutType3 || (SearchLayoutType3 = {}));
var SearchEntryType3;
(function(SearchEntryType5) {
  SearchEntryType5["Icon"] = "icon";
  SearchEntryType5["Text"] = "text";
})(SearchEntryType3 || (SearchEntryType3 = {}));
var SearchIconType3;
(function(SearchIconType5) {
  SearchIconType5["Default"] = "default";
  SearchIconType5["Custom"] = "custom";
})(SearchIconType3 || (SearchIconType3 = {}));

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/1vZ2fdkLJI4IprrVTHqR/useSearch.js
var { log: log4, time: time4, timeEnd: timeEnd4 } = createLogger(localStorageDebugFlag);
var splitWordsRegex4 = (() => {
  try {
    const regex = RegExp("[\\s.,;!?\\p{P}\\p{Z}]+(?<!\\p{L}&)(?!&\\p{L})", "u");
    "".split(regex);
    return regex;
  } catch {
    log4("Falling back to regex without lookbehind");
    return RegExp("[\\s.,;!?\\p{P}\\p{Z}]+", "u");
  }
})();
function splitWords(text) {
  return text.split(splitWordsRegex4);
}
function getUniqueWords(str) {
  const words = splitWords(str).filter((word) => word.trim() && word.length > 0);
  return new Set(words);
}
var normalizeRegex = /[\u0300-\u036f]/g;
function getNormalizedString(text) {
  if (Array.isArray(text)) {
    return text.map(getNormalizedString);
  }
  return text.normalize("NFD").replace(normalizeRegex, "").toLowerCase();
}
var normalizedItemCache = /* @__PURE__ */ new WeakMap();
function getNormalizedItemFromCache(item) {
  const cached = normalizedItemCache.get(item);
  if (cached)
    return cached;
  const normalizedItem = getNormalizedItem(item);
  normalizedItemCache.set(item, normalizedItem);
  return normalizedItem;
}
function getNormalizedItem(item) {
  const normalizedItem = {};
  for (const key in item) {
    if (item.hasOwnProperty(key)) {
      const value = item[key];
      if (typeof value === "string") {
        normalizedItem[key] = getNormalizedString(value);
        continue;
      }
      if (Array.isArray(value)) {
        normalizedItem[key] = getNormalizedString(value);
        continue;
      }
      normalizedItem[key] = value;
    }
  }
  return normalizedItem;
}
function getMatchRange(currentRange, start, end) {
  const result = { ...currentRange };
  if (start < result.start) {
    result.start = start;
  }
  if (end > result.end) {
    result.end = end;
  }
  return result;
}
function getScoreForSearchIndexItem(item, query, words, fullQuery) {
  let score = 0;
  const match = { title: { start: Infinity, end: 0 }, description: { start: Infinity, end: 0 } };
  const urlWords = getUniqueWords(item.url);
  if (urlWords.has(query)) {
    score += 10;
  }
  if (words.size === 1 && urlWords.size === 1 && urlWords.values().next().value === query) {
    score += score * 5;
  }
  if (score > 0) {
    const splitLength = item.url.split("/").length;
    score += clamp7(10 - splitLength, 0, splitLength);
  }
  const titleWords = getUniqueWords(item.title);
  if (titleWords.has(query)) {
    score += 10;
  }
  const titleIndex = item.title.indexOf(query);
  if (titleIndex !== -1) {
    score += 10;
    match.title = getMatchRange(match.title, titleIndex, titleIndex + query.length);
  }
  if (distance(item.title, fullQuery) <= 2) {
    score += score * 10;
  }
  for (const titleWord of titleWords) {
    const distanceScore = distance(query, titleWord);
    if (distanceScore <= 2) {
      score += 10;
    }
  }
  const headings = [...item.h1, ...item.h2, ...item.h3, ...item.h4, ...item.h5, ...item.h6];
  for (const heading of headings) {
    const headingWords = getUniqueWords(heading);
    if (distance(heading, fullQuery) <= 2) {
      score += score * 10;
    }
    if (heading.startsWith(query)) {
      score += 10;
    }
    if (headingWords.has(query)) {
      score += 10;
    }
    if (heading.includes(query)) {
      score += 1;
    }
    for (const headingWord of headingWords) {
      const distanceScore = distance(query, headingWord);
      if (distanceScore <= 2) {
        score += 1;
      }
    }
  }
  const descriptionIndex = item.description.indexOf(query);
  if (descriptionIndex !== -1) {
    score += 10;
    match.description = getMatchRange(match.description, descriptionIndex, descriptionIndex + query.length);
  }
  for (const p of item.p) {
    if (p.includes(query)) {
      score += 0.5;
    }
  }
  for (const codeblock of item.codeblock) {
    if (distance(codeblock, fullQuery) <= 2) {
      score *= 10;
    }
    if (codeblock.includes(fullQuery)) {
      score += 10;
    }
    if (codeblock.includes(query)) {
      score += 0.5;
    }
  }
  return { score, match };
}
function getSearchIndexItemScore(item, normalizedQuery) {
  const normalizedItem = getNormalizedItemFromCache(item);
  const queryWords = getUniqueWords(normalizedQuery);
  let total = 0;
  for (const queryWord of queryWords) {
    const { score } = getScoreForSearchIndexItem(normalizedItem, queryWord, queryWords, normalizedQuery);
    total += score;
  }
  return total;
}
function useRawSearch(index, query, settings) {
  const [results, setResults] = useState7(null);
  const [, startTransition] = useTransition4();
  useEffect7(() => {
    const abortController = new AbortController();
    executeRawSearch(index, query, settings, abortController.signal).then((res) => {
      if (!abortController.signal.aborted) {
        startTransition(() => {
          setResults(res);
        });
      }
    }).catch((err) => {
      if (err.name !== "AbortError") {
        console.error("Search failed:", err);
      }
    });
    return () => {
      abortController.abort();
    };
  }, [index, query]);
  return { results: results ?? [] };
}
var QUANTUM = 32;
async function executeRawSearch(index, query, settings, signal) {
  const path = safeWindow?.location.pathname;
  time4("query");
  const normalizedQuery = getNormalizedString(query);
  const results = [];
  const items = Object.values(index);
  let deadline = performance.now() + QUANTUM;
  async function yieldToMainIfNecessary() {
    if (performance.now() >= deadline) {
      await yieldToMain();
      deadline = performance.now() + QUANTUM;
    }
  }
  for (let i = 0; i < items.length; ++i) {
    if (performance.now() >= deadline) {
      await yieldToMainIfNecessary();
      deadline = performance.now() + QUANTUM;
    }
    if (signal?.aborted)
      return [];
    const item = items[i];
    const score = getSearchIndexItemScore(item, normalizedQuery);
    if (score > (settings.minimumScore || 0) && (!path || item.url !== path)) {
      const heading = item.h1.length && item.h1[0];
      const title = settings?.titleType === SearchResultTitleType3.Title ? item.title : heading ? heading : item.title;
      results.push({ url: item.url, title, description: item.description, body: [...item.p, item.codeblock].join(" "), score });
    }
  }
  await yieldToMainIfNecessary();
  if (signal?.aborted)
    return [];
  const sorted = results.sort((itemA, itemB) => itemB.score - itemA.score);
  timeEnd4("query");
  await yieldToMainIfNecessary();
  if (signal?.aborted)
    return [];
  return results.slice(0, 20);
}
function getIndexedScopedToUrl(index, rawUrlScope, localeSlug) {
  const scopedIndex = {};
  const baseScopeUrlHasVariable = rawUrlScope.includes(":");
  const urlUpToPathVariable = rawUrlScope.split(":")[0];
  const urlScope = urlUpToPathVariable.length > 1 ? urlUpToPathVariable : "";
  for (const url in index) {
    const strippedURL = stripLocaleSlugFromPath(url, localeSlug);
    if (!strippedURL.startsWith(urlScope)) {
      continue;
    }
    if (baseScopeUrlHasVariable && url.length <= urlScope.length) {
      continue;
    }
    scopedIndex[url] = index[url];
  }
  return scopedIndex;
}
function useSearch4(query, settings) {
  const [searchIndex, _setSearchIndex] = useState7({});
  const [status, setStatus] = useState7("loading");
  const { results } = useRawSearch(searchIndex, query, settings);
  const { activeLocale } = useLocaleInfo7();
  const localeId = activeLocale?.id;
  function setSearchIndex(index, options = { ignoreScope: false }) {
    let scopedIndex = index;
    if (settings.urlScope && !options.ignoreScope) {
      scopedIndex = getIndexedScopedToUrl(index, settings.urlScope, activeLocale?.slug);
      log4("Using URL scope", settings.urlScope);
    }
    _setSearchIndex(scopedIndex);
  }
  useEffect7(() => {
    async function loadSearchIndex() {
      setStatus("loading");
      const baseUrl = getBaseUrl("framer-search-index");
      if (!baseUrl) {
        setStatus("no-meta-tag-found");
        setSearchIndex(fakeResults, { ignoreScope: true });
        log4("No meta tag found");
        return;
      }
      const cacheResult = await getCachedIndex(localeId, baseUrl);
      if (cacheResult.status === "fresh") {
        setSearchIndex(cacheResult.searchIndex);
        setStatus("success");
        log4("Using fresh cached index");
        return;
      }
      if (cacheResult.status === "stale") {
        setSearchIndex(cacheResult.searchIndex);
        setStatus("loading-with-cache");
        log4("Using stale cached index while loading a fresh one");
      }
      const searchIndexUrl = getSearchIndexUrl(baseUrl, localeId);
      const response = await fetch(searchIndexUrl);
      if (response.ok) {
        const downloadedIndex = await response.json();
        setSearchIndex(downloadedIndex);
        setCachedIndex(localeId, downloadedIndex, baseUrl);
        setStatus("success");
        log4("Using downloaded index");
        return;
      }
      const isNotFound = response.status === 403 || response.status === 404;
      if (!isNotFound) {
        throw new Error(response.statusText);
      }
      log4("Index not found");
      const fallbackBaseUrl = getBaseUrl("framer-search-index-fallback");
      if (!fallbackBaseUrl) {
        if (cacheResult.status === "miss") {
          setStatus("pending-index-generation");
          log4("No fallback, no cache");
        } else {
          setStatus("success");
          log4("No fallback, using cache");
        }
        return;
      }
      if (cacheResult.status === "stale" && cacheResult.indexHash === fallbackBaseUrl) {
        setStatus("success");
        log4("Using cached fallback index");
        return;
      }
      const fallbackSearchIndexUrl = getSearchIndexUrl(fallbackBaseUrl, localeId);
      const fallbackResponse = await fetch(fallbackSearchIndexUrl);
      if (fallbackResponse.ok) {
        const downloadedIndex = await fallbackResponse.json();
        setSearchIndex(downloadedIndex);
        setCachedIndex(localeId, downloadedIndex, fallbackBaseUrl);
        setStatus("success");
        log4("Using downloaded fallback index");
        return;
      }
      if (cacheResult.status === "miss") {
        setStatus("pending-index-generation");
        log4("Fallback failed, no cache");
      } else {
        setStatus("success");
        log4("Fallback failed, using cache");
      }
    }
    loadSearchIndex().catch((error) => {
      setStatus("error");
      log4("Failed to load search index", error);
    });
  }, [localeId]);
  log4({ status, results });
  return { results, status };
}
function getBaseUrl(name) {
  return safeDocument?.querySelector(`meta[name="${name}"]`)?.getAttribute("content");
}
function getSearchIndexUrl(baseURL, localeId) {
  if (isDefaultLocaleId(localeId))
    return baseURL;
  return baseURL.replace(".json", `-${localeId}.json`);
}

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/lCNMpf6DznmmCJRndYjM/SearchModal.js
import React6, { useEffect as useEffect8, useState as useState8, useMemo as useMemo4, forwardRef as forwardRef8, useRef as useRef5, useDeferredValue as useDeferredValue4, useLayoutEffect as useLayoutEffect4, useCallback as useCallback5, useImperativeHandle as useImperativeHandle4 } from "react";
import { motion as motion7, clamp as clamp8, useAnimate as useAnimate4 } from "framer-motion";
import {
  useLocaleInfo as useLocaleInfo8,
  useRouter as useRouter4,
  inferInitialRouteFromPath as inferInitialRouteFromPath4
} from "./_framer-runtime.js";
var MAX_DESCRIPTION_LENGTH = 120;
var MODAL_MAX_HEIGHT = 496;
var VERTICAL_SPACING_MULTIPLIER = 0.6;
function ClearButton({ theme, type, onClick, text }) {
  const shouldDisplayIcon = type === "icon";
  const iconOrText = shouldDisplayIcon ? /* @__PURE__ */ _jsx7(ClearIcon, { style: { color: theme.inputIconColor, width: theme.inputIconSize, height: theme.inputIconSize } }) : text;
  return /* @__PURE__ */ _jsx7("div", { style: { flexShrink: 0, fontSize: theme && theme.titleFont && theme.titleFont.fontSize ? theme.titleFont.fontSize : 15 }, children: /* @__PURE__ */ _jsx7("button", { className: "__framer-search-clear-button", onClick, style: { fontFamily: "inherit", border: "none", background: "none", cursor: "pointer", display: "flex", textTransform: "uppercase", color: theme.inputIconColor, fontSize: "0.75em", padding: 0 }, children: iconOrText }) });
}
function Divider({ theme, type }) {
  const styles = { background: theme.foregroundColor, height: 1, flexShrink: 0, opacity: 0.05 };
  if (type === "contained" && theme) {
    styles.marginLeft = theme.horizontalSpacing;
    styles.marginRight = theme.horizontalSpacing;
  }
  return /* @__PURE__ */ _jsx7("div", { style: styles });
}
var Input = /* @__PURE__ */ forwardRef8(function Input2(props, ref) {
  const { value = "", status, autofocus, theme, placeholder, iconType, clearButtonType, onChange } = props;
  const [inputValue, setInputValue] = useState8(value);
  const [isFocused, setIsFocused] = useState8(false);
  const inputRef = useRef5();
  useImperativeHandle4(ref, () => inputRef.current);
  React6.useLayoutEffect(() => {
    return () => {
      const inputElement = inputRef.current;
      if (!inputElement || inputElement !== document.activeElement)
        return;
      inputElement.blur();
    };
  }, []);
  const handleInputClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  const handleClearClick = () => {
    setInputValue("");
  };
  useEffect8(() => {
    onChange(inputValue);
  }, [inputValue]);
  const hasInputText = inputValue.length > 0;
  const showClearButton = inputValue.length > 0 && clearButtonType && clearButtonType !== "none";
  const verticalSpacing = Math.floor(theme ? theme.horizontalSpacing * VERTICAL_SPACING_MULTIPLIER : 0);
  const searchIcon = iconType === "custom" && theme.inputIconImage ? /* @__PURE__ */ _jsx7("img", { alt: "icon alongside the Site Search input", src: theme.inputIconImage.src, width: theme.inputIconSize, height: theme.inputIconSize, decoding: "async" }) : /* @__PURE__ */ _jsx7(SearchIcon, { color: theme.inputIconColor, width: theme.inputIconSize, height: theme.inputIconSize });
  return /* @__PURE__ */ _jsxs5("div", { role: "search", style: { ...inputContainerStyle, fontFamily: getFontFamily(theme), paddingLeft: theme && theme.horizontalSpacing, paddingRight: theme && theme.horizontalSpacing, gap: 12, paddingTop: verticalSpacing, paddingBottom: verticalSpacing, touchAction: "none" }, onClick: handleInputClick, children: [/* @__PURE__ */ _jsx7("div", { style: { flexShrink: 0, display: "flex" }, children: status === "loading" && inputValue ? /* @__PURE__ */ _jsx7(SpinnerIcon, { color: theme.inputIconColor, backgroundColor: theme.backgroundColor, style: { height: theme && theme.inputIconSize, width: theme && theme.inputIconSize } }) : searchIcon }), /* @__PURE__ */ _jsx7("input", { ref: inputRef, spellCheck: false, autoFocus: autofocus, style: {
    ...inputStyle,
    WebkitTapHighlightColor: "rgba(0,0,0,0)",
    color: theme.foregroundColor,
    lineHeight: "2em",
    verticalAlign: "baseline",
    ...theme.titleFont,
    ...theme.inputFont,
    fontSize: theme.inputFontSize,
    // @ts-ignore
    "--framer-search-placeholder-color": theme.placeholderColor
  }, onFocus: () => {
    const scrollOffset = document.documentElement.scrollTop;
    document.documentElement.scrollTop = scrollOffset;
  }, placeholder, value: inputValue, onChange: () => setInputValue(inputRef.current.value) }), showClearButton && /* @__PURE__ */ _jsx7(ClearButton, { theme, type: props.clearButtonType, text: props.clearButtonText, onClick: handleClearClick })] });
});
var inputContainerStyle = { display: "inline-flex", alignItems: "center", flexShrink: 0 };
var inputStyle = { outline: "none", border: "none", background: "transparent", fontWeight: 500, height: "2em", padding: 0, width: "100%" };
var ResultRow = /* @__PURE__ */ React6.memo(/* @__PURE__ */ React6.forwardRef(function ResultRow2(props, ref) {
  const { index, result, prevMousePositionRef, type = "contained", subtitleType = "path", selected = false, theme, localeSlug, style, onMouseMove, onPointerDown, onNavigateTo } = props;
  const { url, title, score } = result;
  const urlPath = useMemo4(() => {
    return stripLocaleSlugFromPath(url, localeSlug);
  }, [url, localeSlug]);
  const handleMouseMove = useCallbackOnMouseMove((event) => onMouseMove(event, index), prevMousePositionRef);
  const isContained = type === "contained";
  const borderRadius = isContained ? clamp8(0, Infinity, theme.borderRadius - theme.spacing) : 0;
  const subtitleText = subtitleType === "path" ? urlPath : clampText(result.description, MAX_DESCRIPTION_LENGTH);
  const handleClick = (event) => {
    event.preventDefault();
    onNavigateTo(result.url);
  };
  const focusTrap = (event) => {
    event.preventDefault();
  };
  return /* @__PURE__ */ _jsx7("a", { ref, style: { textDecoration: "none" }, href: result.url, onClick: handleClick, onMouseMove: handleMouseMove, onMouseDown: focusTrap, onPointerDown: (event) => onPointerDown(event, index), children: /* @__PURE__ */ _jsxs5("li", { style: { ...resultContainer, ...style, paddingTop: isContained ? 12 : 16, paddingBottom: isContained ? 12 : 16, color: theme.foregroundColor, position: "relative", paddingLeft: theme && theme.horizontalSpacing, paddingRight: theme && theme.horizontalSpacing }, children: [/* @__PURE__ */ _jsx7("div", { style: { backgroundColor: theme.foregroundColor, position: "absolute", opacity: selected ? 0.06 : 0, borderRadius, left: theme && isContained ? theme.spacing : 0, right: theme && isContained ? theme.spacing : 0, top: 0, bottom: 0 } }), /* @__PURE__ */ _jsxs5("div", { style: { display: "flex", flexDirection: "column", overflow: "hidden", gap: 4 }, children: [/* @__PURE__ */ _jsx7("h3", { style: { ...resultTitle, ...theme.titleFont, lineHeight: "1.4em" }, children: title }), /* @__PURE__ */ _jsxs5("p", { style: { margin: 0, color: theme.subtitleColor, ...theme.subtitleFont, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "1.4em" }, children: [localStorageDebugFlag ? score : "", " ", subtitleText] })] })] }, result.url) });
}));
function QuickMenuSpacer({ onClick }) {
  return /* @__PURE__ */ _jsx7("div", { style: { width: "100%", flexBasis: "20vh" }, onClick });
}
var layoutContainerStyle = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 15, overflow: "visible" };
function LayoutContainer({ layoutType, theme, onKeyDown, onDismiss, children, modalOptions }) {
  const layoutStyles = getLayoutBaseStyles(layoutType, theme);
  const style = { ...layoutContainerStyle, ...layoutStyles, willChange: "transform", marginTop: layoutType === "FixedTop" ? theme.offsetTop : 0, height: layoutType === "Sidebar" ? "100%" : "auto", maxHeight: layoutType === "QuickMenu" ? "100%" : "none", justifyContent: layoutType === "Sidebar" ? "flex-end" : "flex-start", flexDirection: layoutType === "Sidebar" ? "column-reverse" : "column" };
  const innerStyle = { ...layoutContainerStyle, ...layoutStyles, height: layoutType === "Sidebar" ? "100%" : "auto", maxHeight: layoutType === "QuickMenu" ? "100%" : "none", gap: layoutType === "Sidebar" ? 0 : theme.gapBetweenStatusAndSearch, backgroundColor: layoutType === "Sidebar" ? theme.backgroundColor : "transparent", justifyContent: layoutType === "Sidebar" ? "flex-end" : "flex-start", flexDirection: layoutType === "Sidebar" ? "column-reverse" : "column", originX: 0.5, originY: 0.5 };
  function getContainerAnimation() {
    switch (layoutType) {
      case "FixedTop": {
        const key = animationKeyFromLayout("FixedTop");
        const prop = modalOptions ? modalOptions[key] : void 0;
        if (prop) {
          return prop;
        } else {
          return { y: -10, opacity: 0.2, transition: { duration: Browser.isTouch() ? 0 : 0.15 } };
        }
        break;
      }
      case "QuickMenu": {
        const key = animationKeyFromLayout("QuickMenu");
        const prop = modalOptions ? modalOptions[key] : void 0;
        if (prop) {
          return prop;
        } else {
          return { scale: 0.95, opacity: 0, y: 0, x: 0, rotate: 0, transition: { type: "spring", stiffness: 600, damping: 40 } };
        }
        break;
      }
      case "Sidebar": {
        const key = animationKeyFromLayout("Sidebar");
        const prop = modalOptions ? modalOptions[key] : void 0;
        if (prop) {
          return prop;
        } else {
          return { x: -10, opacity: 0, transition: { duration: 0.15 } };
        }
        break;
      }
    }
  }
  const containerAnimation = getContainerAnimation();
  return /* @__PURE__ */ _jsxs5("div", { style, onKeyDown, onClick: (event) => event.stopPropagation(), children: [layoutType === "QuickMenu" && /* @__PURE__ */ _jsx7(QuickMenuSpacer, { onClick: onDismiss }), /* @__PURE__ */ _jsx7(motion7.div, { initial: containerAnimation, animate: { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }, transition: containerAnimation ? containerAnimation.transition : void 0, exit: { opacity: 0, transition: { duration: 0 } }, style: innerStyle, children })] });
}
function ModalContainer({ layoutType, theme, children, heightIsStatic, heightTransition, heightDeps }) {
  const style = {
    // This `willChange` is required to avoid weird rendering issues where
    // parts of the search window won't redraw, which we observed in Safari 16.4.
    willChange: "transform",
    backgroundColor: theme.backgroundColor,
    color: theme.foregroundColor,
    borderRadius: layoutType === "QuickMenu" ? theme.borderRadius : 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: layoutType !== "Sidebar" ? theme.shadow : void 0,
    maxHeight: layoutType === "QuickMenu" ? `min(${MODAL_MAX_HEIGHT}px, calc(100vh - 30px))` : void 0
  };
  const [scope, animate] = useAnimate4();
  useLayoutEffect4(() => {
    if (layoutType !== "QuickMenu" || heightIsStatic)
      return;
    const prevHeight = scope.current.offsetHeight;
    scope.current.style.height = "auto";
    const height = scope.current.offsetHeight;
    scope.current.style.height = prevHeight + "px";
    animate(scope.current, { height: [prevHeight, height] }, heightTransition);
  }, heightDeps);
  return /* @__PURE__ */ _jsx7("div", { ref: scope, role: "dialog", className: layoutType === "FixedTop" ? "__framer-max-height-80dvh" : void 0, style, children });
}
var ScrollView = /* @__PURE__ */ React6.forwardRef(function ScrollView2({ theme, children }, ref) {
  const isTouch = Browser.isTouch();
  const [canScroll, setCanScroll] = React6.useState(true);
  React6.useEffect(() => {
    if (!isTouch)
      return;
    const element = ref.current;
    if (!element)
      return;
    setCanScroll(element.scrollHeight > element.clientHeight);
  });
  return /* @__PURE__ */ _jsx7("div", { ref, style: {
    width: `calc(100% + ${theme.scrollBarWidth}px)`,
    overflowY: "scroll",
    overflowX: "hidden",
    overscrollBehavior: "contain",
    touchAction: canScroll ? void 0 : "none",
    // Make the list appear slightly under the divider
    // so that the divider is still visible when the first
    // item is selected.
    marginTop: -1
  }, children });
});
var statusStyle = { backgroundColor: "#B5B5B5", color: "#FFF", boxShadow: "0px 20px 40px 0px rgba(0, 0, 0, 0.25)", fontFamily: "inherit", textAlign: "center", fontSize: 13, padding: "8px 0" };
function StatusMessage({ status, layoutType, theme }) {
  const verticalSpacing = Math.floor(theme ? theme.horizontalSpacing * VERTICAL_SPACING_MULTIPLIER : 0);
  const style = { ...statusStyle, userSelect: "none", fontFamily: getFontFamily(theme), paddingLeft: theme && theme.horizontalSpacing, paddingRight: theme && theme.horizontalSpacing, fontWeight: 500, lineHeight: `calc(${theme.inputFontSize} * 2)`, paddingTop: verticalSpacing, paddingBottom: verticalSpacing, ...theme.titleFont, zIndex: theme.zIndex + 1, maxWidth: layoutType === "FixedTop" ? "none" : theme.width, width: layoutType === "FixedTop" ? `calc(100% - ${verticalSpacing * 2}px` : "100%", boxShadow: layoutType !== "Sidebar" && statusStyle.boxShadow, borderRadius: layoutType !== "Sidebar" && theme.borderRadius };
  const previewInfoText = layoutType === "FixedTop" ? "Preview Mode" : "Preview Mode. Publish your Site to Search.";
  if (status === "no-meta-tag-found") {
    return /* @__PURE__ */ _jsx7("div", { style, children: previewInfoText });
  }
  if (status === "pending-index-generation") {
    return /* @__PURE__ */ _jsx7("div", { style, children: "Site is being indexed" });
  }
  return null;
}
var resultTitle = { textOverflow: "ellipsis", maxWidth: "100%", overflow: "hidden", fontWeight: 500, whiteSpace: "nowrap", flex: 1, margin: 0 };
var resultContainer = { padding: "16px 20px", listStyle: "none", fontWeight: 500 };
var sidebarStyles = { left: 0, width: 500 };
var fixedTopStyles = { top: 0, width: "100%" };
var quickMenuStyles = { width: 500 };
function getLayoutBaseStyles(layoutOption, theme) {
  switch (layoutOption) {
    case "Sidebar":
      return { ...sidebarStyles, width: theme.width };
    case "FixedTop":
      return fixedTopStyles;
    case "QuickMenu":
      return { ...quickMenuStyles, width: theme.width };
  }
}
var SearchInputClearButtonType4;
(function(SearchInputClearButtonType5) {
  SearchInputClearButtonType5["Icon"] = "icon";
  SearchInputClearButtonType5["Text"] = "text";
  SearchInputClearButtonType5["None"] = "none";
})(SearchInputClearButtonType4 || (SearchInputClearButtonType4 = {}));
var SearchInputDividerType4;
(function(SearchInputDividerType5) {
  SearchInputDividerType5["None"] = "none";
  SearchInputDividerType5["FullWidth"] = "fullWidth";
  SearchInputDividerType5["Contained"] = "contained";
})(SearchInputDividerType4 || (SearchInputDividerType4 = {}));
var SearchResultTitleType4;
(function(SearchResultTitleType5) {
  SearchResultTitleType5["H1"] = "h1";
  SearchResultTitleType5["Title"] = "title";
})(SearchResultTitleType4 || (SearchResultTitleType4 = {}));
var SearchResultSubtitleType4;
(function(SearchResultSubtitleType5) {
  SearchResultSubtitleType5["Description"] = "description";
  SearchResultSubtitleType5["Path"] = "path";
})(SearchResultSubtitleType4 || (SearchResultSubtitleType4 = {}));
var SearchResultItemType4;
(function(SearchResultItemType5) {
  SearchResultItemType5["FullWidth"] = "fullWidth";
  SearchResultItemType5["Contained"] = "contained";
})(SearchResultItemType4 || (SearchResultItemType4 = {}));
var SearchLayoutType4;
(function(SearchLayoutType5) {
  SearchLayoutType5["Sidebar"] = "Sidebar";
  SearchLayoutType5["FixedTop"] = "FixedTop";
  SearchLayoutType5["QuickMenu"] = "QuickMenu";
})(SearchLayoutType4 || (SearchLayoutType4 = {}));
var SearchEntryType4;
(function(SearchEntryType5) {
  SearchEntryType5["Icon"] = "icon";
  SearchEntryType5["Text"] = "text";
})(SearchEntryType4 || (SearchEntryType4 = {}));
var SearchIconType4;
(function(SearchIconType5) {
  SearchIconType5["Default"] = "default";
  SearchIconType5["Custom"] = "custom";
})(SearchIconType4 || (SearchIconType4 = {}));
function SearchModal(props) {
  const { layoutType, theme, urlScope, inputOptions, backdropOptions, modalOptions, resultOptions, onDismiss } = props;
  const { activeLocale } = useLocaleInfo8();
  const localeId = activeLocale?.id;
  const localeSlug = activeLocale?.slug;
  const input = useRef5();
  const selectedResultRow = useRef5();
  const scrollView = useRef5();
  const [selected, setSelected] = useState8({ index: 0, scroll: true });
  const prevMousePositionRef = useRef5(null);
  const [isKeyboardNavigationDisabled, setIsKeyboardNavigationDisabled] = useState8(Browser.isTouch);
  const [query, setQuery] = useState8("");
  const deferredQuery = useDeferredValue4(query);
  const { results, status } = useSearch4(deferredQuery, { minimumScore: 0, urlScope, titleType: resultOptions.titleType });
  const selectedResult = results[selected.index];
  const verticalSpacing = Math.floor(theme ? theme.horizontalSpacing * VERTICAL_SPACING_MULTIPLIER : 0);
  useEffect8(() => {
    setSelected({ index: 0, scroll: true });
  }, [deferredQuery]);
  const handleResultRowPointerDown = useCallback5((event, index) => {
    if (event.pointerType !== "touch")
      return;
    setIsKeyboardNavigationDisabled(true);
    setSelected({ index, scroll: false });
  }, []);
  const handleResultRowMouseMove = useCallback5((event, index) => {
    setSelected((previousSelected) => {
      if (previousSelected.index === index) {
        return previousSelected;
      }
      return { index, scroll: false };
    });
  }, []);
  const router = useRouter4();
  const navigateTo = useCallback5(async (url) => {
    if (status === "no-meta-tag-found") {
      return;
    }
    try {
      const { routeId, pathVariables } = inferInitialRouteFromPath4(router.routes, url);
      const route = router.getRoute?.(routeId);
      onDismiss();
      await route?.page?.preload?.();
      router.navigate?.(routeId, null, pathVariables, false);
    } catch (error) {
      __dai_window.location.href = url;
    }
  }, [status]);
  const handleKeyDown = (event) => {
    const maxIndex = results.length - 1;
    switch (event.code) {
      case "ArrowUp":
        event.preventDefault();
        if (isKeyboardNavigationDisabled) {
          setIsKeyboardNavigationDisabled(false);
          break;
        }
        setSelected((previousSelected) => ({ index: clamp8(0, maxIndex, previousSelected.index - 1), scroll: true }));
        break;
      case "ArrowDown":
        event.preventDefault();
        if (isKeyboardNavigationDisabled) {
          setIsKeyboardNavigationDisabled(false);
          break;
        }
        setSelected((previousSelected) => ({ index: clamp8(0, maxIndex, previousSelected.index + 1), scroll: true }));
        break;
      case "Escape":
        break;
      case "Enter":
        if (selectedResult) {
          navigateTo(selectedResult.url);
        }
        break;
      default:
        event.stopPropagation();
    }
  };
  const showNoResults = results.length === 0 && deferredQuery.length > 1 && status !== "loading";
  const showDivider = Boolean((deferredQuery.length > 0 && results.length > 0 || showNoResults) && status !== "loading" && props.inputOptions && props.inputOptions.dividerType !== "none");
  const isItemContained = Boolean(props.resultOptions && props.resultOptions.itemType === "contained");
  const spacing = isItemContained ? theme.spacing : 10;
  const listPaddingTop = showDivider && isItemContained ? spacing + theme.gapBetweenResults * 2 : 0;
  useEffect8(() => {
    if (!selected.scroll)
      return;
    const element = selectedResultRow.current;
    if (!element)
      return;
    scrollIntoView(element, scrollView.current, { offsetTop: showDivider && isItemContained ? listPaddingTop : 0, offsetBottom: isItemContained ? spacing : 0 });
  }, [selected]);
  return /* @__PURE__ */ _jsxs5(LayoutContainer, { layoutType, modalOptions, theme, onKeyDown: handleKeyDown, onDismiss, children: [/* @__PURE__ */ _jsxs5(ModalContainer, { layoutType, theme, heightIsStatic: modalOptions.heightIsStatic, heightTransition: modalOptions.heightTransition, heightDeps: [results.length, showNoResults], children: [/* @__PURE__ */ _jsx7(Input, { autofocus: true, ref: input, onChange: setQuery, value: query, theme, status, iconType: inputOptions.iconOptions.iconType, placeholder: inputOptions.placeholderOptions.placeholderText, clearButtonType: inputOptions ? inputOptions.clearButtonType : void 0, clearButtonText: inputOptions.clearButtonText }), showDivider && /* @__PURE__ */ _jsx7(Divider, { theme, type: inputOptions.dividerType }), /* @__PURE__ */ _jsx7(ScrollView, { ref: scrollView, theme, children: /* @__PURE__ */ _jsxs5("ul", { "aria-live": "polite", style: { display: "flex", flexDirection: "column", width: `calc(100% - ${theme.scrollBarWidth}px)`, padding: 0, paddingTop: listPaddingTop, paddingBottom: results.length && isItemContained ? spacing : 0, gap: theme.gapBetweenResults, margin: 0 }, children: [results.map((result, index) => {
    const isSelected = index === selected.index;
    return /* @__PURE__ */ _jsx7(ResultRow, { ref: isSelected ? selectedResultRow : null, index, result, prevMousePositionRef, selected: !isKeyboardNavigationDisabled && isSelected, type: props.resultOptions.itemType, subtitleType: props.resultOptions.subtitleOptions.subtitleType, theme, localeSlug, onMouseMove: handleResultRowMouseMove, onPointerDown: handleResultRowPointerDown, onNavigateTo: navigateTo }, result.url);
  }), showNoResults && /* @__PURE__ */ _jsx7("li", { style: { paddingTop: verticalSpacing - listPaddingTop, paddingBottom: verticalSpacing, lineHeight: "2em", paddingLeft: theme && theme.horizontalSpacing, paddingRight: theme && theme.horizontalSpacing, height: "Sidebar" ? "100%" : "auto" }, children: /* @__PURE__ */ _jsx7("h3", { style: { ...resultTitle, textAlign: "center", lineHeight: `calc(${theme.inputFontSize} * 2)`, color: theme.subtitleColor, ...theme.titleFont }, children: "No results" }) })] }) })] }), /* @__PURE__ */ _jsx7(StatusMessage, { status, layoutType, theme })] });
}

// http-url:https://framerusercontent.com/modules/hqEf5wXaAewP8VPuaZ98/5A0QGVeEr2cwheQpIuEG/useViewportSizeState.js
import { useEffect as useEffect9, useState as useState9 } from "react";
function getViewportSize() {
  if (typeof __dai_window === "undefined") {
    return { width: 0, height: 0 };
  }
  return { width: __dai_window.innerWidth, height: __dai_window.innerHeight };
}
function useViewportSizeState(getState) {
  const [state, setState] = useState9(() => getState(getViewportSize()));
  useEffect9(() => {
    const handleWindowResize = () => setState(getState(getViewportSize()));
    __dai_window.addEventListener("resize", handleWindowResize);
    return () => {
      __dai_window.removeEventListener("resize", handleWindowResize);
    };
  }, []);
  return state;
}

// http-url:https://framerusercontent.com/modules/6wAE2eMb2Tl3zrU7u4UL/mKj6QS2p4Cgdaa0WrZKY/Search.js
var EntryPointOptions;
(function(EntryPointOptions2) {
  EntryPointOptions2["icon"] = "Icon";
  EntryPointOptions2["input"] = "Input";
})(EntryPointOptions || (EntryPointOptions = {}));
function buildShadow(shadowProperty, fallback = "none") {
  if (!shadowProperty)
    return fallback;
  const { x, y, blur, color, spread } = shadowProperty;
  return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
}
var Overlay = /* @__PURE__ */ forwardRef9(function Overlay2(props, ref) {
  const { layoutType, theme, onDismiss } = props;
  useEffect10(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Escape") {
        event.stopPropagation();
        onDismiss();
      }
    };
    const handlePointerDown = (event) => {
      if (event.pointerType !== "touch")
        return;
      const isWithinSearchHeader = Boolean(event.target instanceof Element && event.target.closest("[role=search]"));
      if (isWithinSearchHeader)
        return;
      if (document.activeElement instanceof HTMLInputElement) {
        document.activeElement.blur();
      }
    };
    __dai_window.addEventListener("keydown", handleKeyDown);
    __dai_window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    document.body.classList.add(bodyOverflowHidden);
    return () => {
      __dai_window.removeEventListener("keydown", handleKeyDown);
      __dai_window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      document.body.classList.remove(bodyOverflowHidden);
    };
  }, []);
  return /* @__PURE__ */ createPortal(/* @__PURE__ */ _jsxs6("div", { ref, className: "__framer-search-modal-container", role: "presentation", style: { ...backdropStyles, zIndex: props.backdropOptions.zIndex, justifyContent: layoutType === SearchLayoutType4.Sidebar ? "flex-start" : "center" }, onClick: onDismiss, children: [/* @__PURE__ */ _jsx8(motion8.div, { role: "presentation", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } }, transition: theme.overlayTransition, style: { top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", boxSizing: "border-box", position: "absolute", touchAction: "none", backgroundColor: props.backdropOptions.backgroundColor } }), /* @__PURE__ */ _jsx8(SearchModal, { urlScope: props.urlScope, layoutType, inputOptions: props.inputOptions, resultOptions: props.resultOptions, modalOptions: props.modalOptions, backdropOptions: props.backdropOptions, theme: props.theme, onDismiss })] }), document.body);
});
var backdropStyles = { width: "100%", boxSizing: "border-box", willChange: "transform", position: "fixed", display: "flex", alignItems: "flex-start", top: 0, left: 0, right: 0, bottom: 0 };
var containerStyle = { height: "100%", display: "flex", borderRadius: 10, cursor: "inherit", overflow: "hidden" };
var bodyOverflowHidden = "__framer-overflow-hidden";
var EntryPoint = withCSS3(function EntryPoint2(props) {
  const overlay = useRef6(null);
  const [isOpen, setIsOpen] = useState10(false);
  const [isOverLimit, setIsOverLimit] = useState10(false);
  const [isSafariTouchDevice, setIsSafariTouchDevice] = useState10(false);
  const [isOnCanvas] = useState10(() => RenderTarget.current() === RenderTarget.canvas);
  useEffect10(() => {
    setIsOverLimit(checkIfOverLimit());
    setIsSafariTouchDevice(Browser.isSafari() && Browser.isTouch());
  }, []);
  const baseInputFontSize = props.inputOptions?.inputFont?.fontSize ? props.inputOptions.inputFont.fontSize : "16px";
  const inputFontSize = isSafariTouchDevice ? `max(16px, ${baseInputFontSize})` : baseInputFontSize;
  const layoutType = useViewportSizeState((size) => {
    if (size.width < props.modalOptions.width + 10) {
      return SearchLayoutType4.FixedTop;
    }
    return props.modalOptions.layoutType || props.layoutType;
  });
  const theme = {
    subtitleColor: props.resultOptions.subtitleOptions.subtitleColor,
    backgroundColor: props.modalOptions.backgroundColor,
    foregroundColor: props.resultOptions.titleColor,
    placeholderColor: props.inputOptions.placeholderOptions.placeholderColor,
    titleFont: props.resultOptions?.titleFont && !isEmptyObject(props.resultOptions.titleFont) ? props.resultOptions.titleFont : { fontSize: 14, fontFamily: DEFAULT_FONT_FAMILY, fontWeight: 500 },
    subtitleFont: props.resultOptions.subtitleOptions?.subtitleFont && !isEmptyObject(props.resultOptions.subtitleOptions.subtitleFont) ? props.resultOptions.subtitleOptions.subtitleFont : { fontSize: 12, fontFamily: DEFAULT_FONT_FAMILY, fontWeight: 500 },
    inputFont: props.inputOptions?.inputFont && !isEmptyObject(props.inputOptions.inputFont) ? props.inputOptions.inputFont : { fontSize: 16, fontFamily: DEFAULT_FONT_FAMILY, fontWeight: 500 },
    // Keep separate so we can more easily override
    inputFontSize,
    width: props.modalOptions.width,
    offsetTop: props.modalOptions.top,
    borderRadius: props.modalOptions.borderRadius,
    shadow: buildShadow(props.modalOptions.shadow),
    entryIconColor: props.iconColor,
    entryIconSize: props.iconSize,
    entryIconImage: props.iconImage,
    inputIconSize: props.inputOptions.iconOptions.iconSize,
    inputIconColor: props.inputOptions.iconOptions.iconColor,
    inputIconImage: props.inputOptions.iconOptions.iconImage,
    gapBetweenStatusAndSearch: 16,
    gapBetweenResults: 1,
    scrollBarWidth: 20,
    margin: 10,
    spacing: 8,
    zIndex: props.backdropOptions.zIndex,
    horizontalSpacing: 20,
    overlayTransition: props.backdropOptions.transition
  };
  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isOverLimit)
      return;
    setIsOpen(true);
  };
  return /* @__PURE__ */ _jsxs6("div", { style: { ...containerStyle, ...props.style, pointerEvents: isOverLimit ? "none" : "auto", opacity: isOverLimit ? 0.4 : 1 }, children: [/* @__PURE__ */ _jsx8("button", { "aria-label": "Search Icon", style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "none", cursor: "inherit", color: "inherit", border: "none", borderRadius: 10, padding: 0 }, onClick: handleClick, children: props.iconType === SearchIconType4.Custom && theme.entryIconImage ? /* @__PURE__ */ _jsx8("img", { alt: "icon entry point for Site Search", src: theme.entryIconImage.src, width: theme.entryIconSize, height: theme.entryIconSize }) : /* @__PURE__ */ _jsx8(SearchIcon, { color: theme.entryIconColor, width: theme.entryIconSize, height: theme.entryIconSize }) }), /* @__PURE__ */ _jsx8(AnimatePresence, { children: isOpen && !isOnCanvas && /* @__PURE__ */ _jsx8(Overlay, { ref: overlay, layoutType, urlScope: props.urlScope, inputOptions: props.inputOptions, resultOptions: props.resultOptions, backdropOptions: props.backdropOptions, modalOptions: props.modalOptions, theme, onDismiss: () => setIsOpen(false) }) })] });
}, [
  // Prevent scrolling on iOS Safari when Input is focused.
  // From: https://gist.github.com/kiding/72721a0553fa93198ae2bb6eefaa3299
  `
        @keyframes __framer-blink-input {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }

        .__framer-search-modal-container input:focus {
            animation: __framer-blink-input 0.01s;
        }
        `,
  // Allow styling of input placeholder
  `
         .__framer-search-modal-container input::placeholder, 
         .__framer-search-modal-container input::-webkit-input-placeholder { 
            color: var(--framer-search-placeholder-color, #999999);
            opacity: 1;
        }
        `,
  // Allow fallback to 100vh when dvh unit is not supported.
  `
        .__framer-search-modal-container {
            height: 100vh;
            height: 100dvh;
        }
        .__framer-search-modal-container .__framer-max-height-80dvh {
            max-height: 80vh;
            max-height: 80dvh;
        }
        `,
  `
        body.${bodyOverflowHidden} {
            overflow: hidden;
        }`,
  // Increase hit target
  `
        button.__framer-search-clear-button {
            position: relative;
        }
        button.__framer-search-clear-button::after {
            content: "";
            position: absolute;
            top: -10px;
            right: -10px;
            bottom: -10px;
            left: -10px;
        }`
], "framer-lib-search");
var Search_default = EntryPoint;
addPropertyControls3(EntryPoint, {
  urlScope: {
    title: "Scope",
    // @ts-ignore - Internal
    type: ControlType3.PageScope
  },
  // entryType: {
  //     title: "Type",
  //     type: ControlType.Enum,
  //     options: Object.values(SearchEntryType),
  //     optionTitles: Object.values(SearchEntryType).map(titleCase),
  //     displaySegmentedControl: true,
  // },
  iconType: { title: "Icon", type: ControlType3.Enum, options: Object.values(SearchIconType4), optionTitles: Object.values(SearchIconType4).map(titleCase), displaySegmentedControl: true },
  iconColor: { title: "Color", type: ControlType3.Color, defaultValue: "#333", hidden: (props) => props.iconType === SearchIconType4.Custom },
  iconImage: { title: "File", type: ControlType3.ResponsiveImage, allowedFileTypes: ["jpg", "png", "svg"], hidden: (props) => props.iconType === SearchIconType4.Default },
  iconSize: { title: "Size", type: ControlType3.Number, displayStepper: true, defaultValue: 24 },
  inputOptions: { title: "Input", type: ControlType3.Object, buttonTitle: "Icon, Styles", controls: { iconOptions: { title: "Icon", type: ControlType3.Object, buttonTitle: "Color, Size", controls: { iconType: { title: "Icon", type: ControlType3.Enum, options: Object.values(SearchIconType4), optionTitles: Object.values(SearchIconType4).map(titleCase), displaySegmentedControl: true }, iconColor: { title: "Color", type: ControlType3.Color, defaultValue: "rgba(0, 0, 0, 0.45)", hidden: ({ iconType }) => {
    return iconType === SearchIconType4.Custom;
  } }, iconImage: { title: "File", type: ControlType3.ResponsiveImage, allowedFileTypes: ["jpg", "png", "svg"], hidden: ({ iconType }) => iconType === SearchIconType4.Default }, iconSize: { title: "Icon Size", type: ControlType3.Number, displayStepper: true, defaultValue: 18, min: 0, max: 100 } } }, inputFont: {
    title: "Font",
    // @ts-ignore – Internal
    type: ControlType3.Font,
    displayFontSize: true
  }, textColor: { title: "Color", type: ControlType3.Color, defaultValue: "#333" }, placeholderOptions: { title: "Placeholder", type: ControlType3.Object, buttonTitle: "Color, Text", controls: { placeholderText: { title: "Text", type: ControlType3.String, defaultValue: "Search..." }, placeholderColor: { title: "Color", type: ControlType3.Color, defaultValue: "rgba(0,0,0,0.4)" } } }, dividerType: { title: "Divider", type: ControlType3.Enum, options: Object.values(SearchInputDividerType4), optionTitles: Object.keys(SearchInputDividerType4).map(titleCase), defaultValue: SearchInputDividerType4.FullWidth }, clearButtonType: { title: "Clear Type", type: ControlType3.Enum, options: Object.values(SearchInputClearButtonType4), optionTitles: Object.keys(SearchInputClearButtonType4).map(titleCase), defaultValue: SearchInputClearButtonType4.Icon }, clearButtonText: { title: "Clear Text", type: ControlType3.String, defaultValue: "Clear", hidden: (props) => props.clearButtonType !== SearchInputClearButtonType4.Text } } },
  modalOptions: { title: "Modal", buttonTitle: "Layout, Width", type: ControlType3.Object, controls: { layoutType: { title: "Layout", type: ControlType3.Enum, options: Object.keys(SearchLayoutType4), optionTitles: Object.values(SearchLayoutType4).map(titleCase), defaultValue: SearchLayoutType4.QuickMenu }, width: { title: "Width", type: ControlType3.Number, defaultValue: 500, min: 200, max: 1e3, displayStepper: true, step: 5, hidden: (props) => props.layoutType === SearchLayoutType4.FixedTop }, top: { title: "Top", type: ControlType3.Number, defaultValue: 0, min: 0, max: 1e3, displayStepper: true, hidden: (props) => props.layoutType !== SearchLayoutType4.FixedTop }, heightIsStatic: { title: "Height", type: ControlType3.Boolean, enabledTitle: "Instant", disabledTitle: "Animate", hidden: ({ layoutType }) => layoutType !== SearchLayoutType4.QuickMenu }, heightTransition: { title: "Type", type: ControlType3.Transition, defaultValue: { type: "spring", stiffness: 800, damping: 60 }, hidden: ({ heightIsStatic, layoutType }) => layoutType !== SearchLayoutType4.QuickMenu || heightIsStatic }, borderRadius: { title: "Radius", type: ControlType3.Number, defaultValue: 16, displayStepper: true, min: 0, hidden: ({ layoutType }) => layoutType !== SearchLayoutType4.QuickMenu }, shadow: { buttonTitle: "Options", type: ControlType3.Object, defaultValue: { x: 0, y: 20, blur: 40, spread: 0, color: "rgba(0,0,0,0.2)" }, controls: { color: { type: ControlType3.Color, defaultValue: "rgba(0,0,0,0.2)" }, x: { type: ControlType3.Number, defaultValue: 0 }, y: { type: ControlType3.Number, defaultValue: 20 }, blur: { type: ControlType3.Number, defaultValue: 40 }, spread: { type: ControlType3.Number, defaultValue: 0 } } }, backgroundColor: { title: "Background", type: ControlType3.Color, defaultValue: "#FFF" }, [animationKeyFromLayout(SearchLayoutType4.QuickMenu)]: { title: "Animation", type: ControlType3.Object, icon: "effect", hidden: ({ layoutType }) => layoutType !== SearchLayoutType4.QuickMenu, optional: true, buttonTitle: "Options", controls: {
    opacity: { type: ControlType3.Number, defaultValue: 0.5, step: 0.1, min: 0, max: 1 },
    scale: { type: ControlType3.Number, defaultValue: 0.75, step: 0.1, min: 0, max: 2 },
    // rotate: {
    //     type: ControlType.Number,
    //     defaultValue: 0,
    //     min: -360,
    //     max: 360,
    // },
    x: { type: ControlType3.Number, defaultValue: 0, min: -500, max: 500 },
    y: { type: ControlType3.Number, defaultValue: 0, min: -500, max: 500 },
    transition: { type: ControlType3.Transition }
  } }, [animationKeyFromLayout(SearchLayoutType4.FixedTop)]: { title: "Animation", type: ControlType3.Object, icon: "effect", buttonTitle: "Options", hidden: ({ layoutType }) => layoutType !== SearchLayoutType4.FixedTop, optional: true, controls: { opacity: { type: ControlType3.Number, defaultValue: 0.8, step: 0.1, min: 0, max: 1 }, y: { type: ControlType3.Number, defaultValue: 0, min: -100, max: 100 }, transition: { type: ControlType3.Transition } } }, [animationKeyFromLayout(SearchLayoutType4.Sidebar)]: { title: "Animation", type: ControlType3.Object, icon: "effect", buttonTitle: "Options", hidden: ({ layoutType }) => layoutType !== SearchLayoutType4.Sidebar, optional: true, controls: { opacity: { type: ControlType3.Number, defaultValue: 0.8, step: 0.1, min: 0, max: 1 }, x: { type: ControlType3.Number, defaultValue: 0, min: -1e3, max: 1e3 }, transition: { type: ControlType3.Transition } } } } },
  resultOptions: {
    title: "Results",
    buttonTitle: "Fonts, Style",
    type: ControlType3.Object,
    defaultValue: {},
    // description:
    //     "Learn more about how to use Site Search [here](https://framer.com/learn/site-search)",
    controls: { itemType: { title: "Style", type: ControlType3.Enum, options: Object.values(SearchResultItemType4), optionTitles: Object.keys(SearchResultItemType4).map(titleCase), defaultValue: SearchResultItemType4.FullWidth }, titleFont: {
      title: "Title",
      // @ts-ignore - Internal
      type: ControlType3.Font,
      defaultValue: { fontSize: 15 },
      displayFontSize: true
    }, titleColor: { title: "Color", type: ControlType3.Color, defaultValue: "#333" }, titleType: { title: "Content", type: ControlType3.Enum, options: Object.values(SearchResultTitleType4), optionTitles: Object.keys(SearchResultTitleType4).map(titleCase), defaultValue: SearchResultTitleType4.H1, displaySegmentedControl: true }, subtitleOptions: { type: ControlType3.Object, title: "Subtitle", buttonTitle: "Font, Content", controls: { subtitleFont: {
      title: "Font",
      // @ts-ignore - Internal
      type: ControlType3.Font,
      defaultValue: { fontSize: 13 },
      displayFontSize: true
    }, subtitleColor: { title: "Color", type: ControlType3.Color, defaultValue: "rgba(0, 0, 0, 0.4)" }, subtitleType: { title: "Content", type: ControlType3.Enum, options: Object.values(SearchResultSubtitleType4), optionTitles: Object.keys(SearchResultSubtitleType4).map(titleCase), defaultValue: SearchResultSubtitleType4.Path } } } }
  },
  backdropOptions: { title: "Backdrop", type: ControlType3.Object, buttonTitle: "Color, Z Index", controls: { backgroundColor: { title: "Color", type: ControlType3.Color, defaultValue: "rgba(0, 0, 0, 0.8)" }, zIndex: { title: "Z Index", type: ControlType3.Number, defaultValue: 10, displayStepper: true, min: 0, max: 10 }, transition: { type: ControlType3.Transition } } }
});
EntryPoint.displayName = "Search";

// http-url:https://framerusercontent.com/modules/AaUsCN2P0PhEUfriOZlw/EqZufiIdbu8zZj2HlG8e/JfaLoQZWi.js
import { jsx as _jsx9 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls4, ControlType as ControlType4, cx as cx3, motion as motion9, useSVGTemplate as useSVGTemplate3, withCSS as withCSS4 } from "./_framer-runtime.js";
import * as React7 from "react";
import { forwardRef as forwardRef11 } from "react";
var mask3 = "var(--framer-icon-mask)";
var Base3 = /* @__PURE__ */ forwardRef11(function(props, ref) {
  return /* @__PURE__ */ _jsx9("svg", { ...props, ref, children: props.children });
});
var MotionSVG3 = motion9.create(Base3);
var SVG3 = /* @__PURE__ */ forwardRef11((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx9(MotionSVG3, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx9("svg", { ...rest, ref, children });
});
var svg3 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 2.404 8.651 C 2.584 9.3 3.175 9.75 3.848 9.75 L 13.115 9.75 C 13.789 9.75 14.38 9.301 14.56 8.651 L 16.958 0 L 0 0 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="9.750000027977563px" id="JexuerWiv" transform="translate(4.792 6.75)" width="16.9584375px"/><path d="M 0 1.5 C 0 0.672 0.672 0 1.5 0 C 2.328 0 3 0.672 3 1.5 C 3 2.328 2.328 3 1.5 3 C 0.672 3 0 2.328 0 1.5 Z" fill="var(--21h8s6, rgb(0, 0, 0))" height="3px" id="QcU5ASZ8j" transform="translate(6.75 18.75)" width="3px"/><path d="M 0 1.5 C 0 0.672 0.672 0 1.5 0 C 2.328 0 3 0.672 3 1.5 C 3 2.328 2.328 3 1.5 3 C 0.672 3 0 2.328 0 1.5 Z" fill="var(--21h8s6, rgb(0, 0, 0))" height="3px" id="Q0hrPRgBc" transform="translate(16.5 18.75)" width="3px"/><path d="M 0 0 L 2.25 0 L 5.695 12.401 C 5.876 13.05 6.466 13.5 7.14 13.5 L 16.406 13.5 C 17.08 13.5 17.672 13.051 17.852 12.401 L 20.25 3.75 L 3.292 3.75" fill="transparent" height="13.500000027977558px" id="LO6i_Yl07" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(1.5 3)" width="20.25px"/></svg>';
var getProps3 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component3 = /* @__PURE__ */ React7.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps3(props);
  const href = useSVGTemplate3("1330623165", svg3);
  return /* @__PURE__ */ _jsx9(SVG3, { ...restProps, className: cx3("framer-xo4dj", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx9("use", { href }) });
});
var css3 = [`.framer-xo4dj { -webkit-mask: ${mask3}; aspect-ratio: 1; display: block; mask: ${mask3}; width: 24px; }`];
var Icon3 = withCSS4(Component3, css3, "framer-xo4dj");
Icon3.displayName = "Shopping Cart Simple";
var JfaLoQZWi_default = Icon3;
addPropertyControls4(Icon3, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType4.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType4.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType4.Number } });

// http-url:https://framerusercontent.com/modules/wbL0GysLpUpZOLelXsKU/7IhRlKXIvqCTv7OUjGRe/q95pf4lLL.js
import { jsx as _jsx10 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls5, ControlType as ControlType5, cx as cx4, motion as motion10, useSVGTemplate as useSVGTemplate4, withCSS as withCSS5 } from "./_framer-runtime.js";
import * as React8 from "react";
import { forwardRef as forwardRef13 } from "react";
var mask4 = "var(--framer-icon-mask)";
var Base4 = /* @__PURE__ */ forwardRef13(function(props, ref) {
  return /* @__PURE__ */ _jsx10("svg", { ...props, ref, children: props.children });
});
var MotionSVG4 = motion10.create(Base4);
var SVG4 = /* @__PURE__ */ forwardRef13((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx10(MotionSVG4, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx10("svg", { ...rest, ref, children });
});
var svg4 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 1.5 16.5 C 0.672 16.5 0 15.828 0 15 L 0 1.5 C 0 0.672 0.672 0 1.5 0 L 15 0 C 15.828 0 16.5 0.672 16.5 1.5 L 16.5 15 C 16.5 15.828 15.828 16.5 15 16.5 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="16.5px" id="LjE0Ycn76" transform="translate(3.75 3.75)" width="16.5px"/><path d="M 13.5 0 L 0 13.5" fill="var(--21h8s6, rgb(0, 0, 0))" height="13.5px" id="oSDwjLCvX" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(5.25 5.25)" width="13.5px"/><path d="M 13.5 13.5 L 0 0" fill="var(--21h8s6, rgb(0, 0, 0))" height="13.5px" id="H9XwXWiXU" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(5.25 5.25)" width="13.5px"/></svg>';
var getProps4 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component4 = /* @__PURE__ */ React8.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps4(props);
  const href = useSVGTemplate4("2202960551", svg4);
  return /* @__PURE__ */ _jsx10(SVG4, { ...restProps, className: cx4("framer-AhL2C", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx10("use", { href }) });
});
var css4 = [`.framer-AhL2C { -webkit-mask: ${mask4}; aspect-ratio: 1; display: block; mask: ${mask4}; width: 24px; }`];
var Icon4 = withCSS5(Component4, css4, "framer-AhL2C");
Icon4.displayName = "X";
var q95pf4lLL_default = Icon4;
addPropertyControls5(Icon4, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType5.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType5.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType5.Number } });

// http-url:https://framerusercontent.com/modules/Q6NT8NZXP0XQR4Axne36/dGPiG8qv9MbOasWAzWPi/c8o9SH5Pr.js
import { jsx as _jsx13, jsxs as _jsxs7 } from "react/jsx-runtime";
import { addFonts as addFonts2, addPropertyControls as addPropertyControls8, ComponentViewportProvider, ControlType as ControlType8, cx as cx7, forwardLoader, getFonts, RichText as RichText2, SmartComponentScopedContainer, useActiveVariantCallback as useActiveVariantCallback2, useComponentViewport as useComponentViewport2, useLocaleInfo as useLocaleInfo10, useVariantState as useVariantState2, withCSS as withCSS8 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup2, motion as motion13, MotionConfigContext as MotionConfigContext2 } from "framer-motion";
import * as React11 from "react";
import { useRef as useRef8 } from "react";

// http-url:https://framerusercontent.com/modules/lQrAYHHJtdFNMDLtDObP/AeOa4UWhMeKfWe3XZa5D/lDWUVpnhJ.js
import { jsx as _jsx11 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls6, ControlType as ControlType6, cx as cx5, motion as motion11, useSVGTemplate as useSVGTemplate5, withCSS as withCSS6 } from "./_framer-runtime.js";
import * as React9 from "react";
import { forwardRef as forwardRef15 } from "react";
var mask5 = "var(--framer-icon-mask)";
var Base5 = /* @__PURE__ */ forwardRef15(function(props, ref) {
  return /* @__PURE__ */ _jsx11("svg", { ...props, ref, children: props.children });
});
var MotionSVG5 = motion11.create(Base5);
var SVG5 = /* @__PURE__ */ forwardRef15((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx11(MotionSVG5, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx11("svg", { ...rest, ref, children });
});
var svg5 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 0 7.5 L 7.5 0 L 15 7.5 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="7.5px" id="UuMHk3w7N" transform="translate(4.5 7.5)" width="15px"/><path d="M 0 7.5 L 7.5 0 L 15 7.5" fill="transparent" height="7.5px" id="YIh_WXd8s" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(4.5 7.5)" width="15px"/></svg>';
var getProps5 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component5 = /* @__PURE__ */ React9.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps5(props);
  const href = useSVGTemplate5("471393433", svg5);
  return /* @__PURE__ */ _jsx11(SVG5, { ...restProps, className: cx5("framer-Zt3B0", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx11("use", { href }) });
});
var css5 = [`.framer-Zt3B0 { -webkit-mask: ${mask5}; aspect-ratio: 1; display: block; mask: ${mask5}; width: 24px; }`];
var Icon5 = withCSS6(Component5, css5, "framer-Zt3B0");
Icon5.displayName = "Caret Up";
var lDWUVpnhJ_default = Icon5;
addPropertyControls6(Icon5, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType6.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType6.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType6.Number } });

// http-url:https://framerusercontent.com/modules/3Vbau0zB7WNq1MxYhCjz/H5azxXpHhTfdMDi4EbMM/xvHKkw4Lv.js
import { jsx as _jsx12 } from "react/jsx-runtime";
import { addFonts, addPropertyControls as addPropertyControls7, ControlType as ControlType7, cx as cx6, Link, RichText, useActiveVariantCallback, useComponentViewport, useLocaleInfo as useLocaleInfo9, useVariantState, withCSS as withCSS7 } from "./_framer-runtime.js";
import { LayoutGroup, motion as motion12, MotionConfigContext } from "framer-motion";
import * as React10 from "react";
import { useRef as useRef7 } from "react";
var enabledGestures = { vQ4tPUNuw: { hover: true } };
var serializationHash = "framer-r5bta";
var variantClassNames = { vQ4tPUNuw: "framer-v-1hu1ytn" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition = ({ value, children }) => {
  const config = React10.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React10.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx12(MotionConfigContext.Provider, { value: contextValue, children });
};
var Variants = motion12.create(React10.Fragment);
var getProps6 = ({ click, height, id, link, newTab, smoothScroll, text, width, ...props }) => {
  return { ...props, SbnDmc0Ms: text ?? props.SbnDmc0Ms ?? "Nav Item", TEXQPq0ip: link ?? props.TEXQPq0ip, u1toCPSvE: smoothScroll ?? props.u1toCPSvE, WcYx6PpLU: click ?? props.WcYx6PpLU, Z3SWEK0uk: newTab ?? props.Z3SWEK0uk };
};
var createLayoutDependency = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component6 = /* @__PURE__ */ React10.forwardRef(function(props, ref) {
  const fallbackRef = useRef7(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React10.useId();
  const { activeLocale, setLocale } = useLocaleInfo9();
  const componentViewport = useComponentViewport();
  const { style, className, layoutId, variant, SbnDmc0Ms, TEXQPq0ip, Z3SWEK0uk, u1toCPSvE, WcYx6PpLU, ...restProps } = getProps6(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ defaultVariant: "vQ4tPUNuw", enabledGestures, ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback(baseVariant);
  const onTap19tdxes = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    if (WcYx6PpLU) {
      const res = await WcYx6PpLU(...args);
      if (res === false)
        return false;
    }
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx6(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx12(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx12(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx12(Transition, { value: transition1, children: /* @__PURE__ */ _jsx12(Link, { href: TEXQPq0ip, motionChild: true, nodeId: "vQ4tPUNuw", openInNewTab: Z3SWEK0uk, scopeId: "xvHKkw4Lv", smoothScroll: u1toCPSvE, children: /* @__PURE__ */ _jsx12(motion12.a, { ...restProps, ...gestureHandlers, className: `${cx6(scopingClassNames, "framer-1hu1ytn", className, classNames)} framer-17hhuts`, "data-framer-name": "Menu Item", "data-highlight": true, layoutDependency, layoutId: "e1vFUka05__vQ4tPUNuw", onTap: onTap19tdxes, ref: refBinding, style: { ...style }, ...addPropertyOverrides({ "vQ4tPUNuw-hover": { "data-framer-name": void 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx12(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx12(React10.Fragment, { children: /* @__PURE__ */ _jsx12(motion12.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(130, 130, 130))" }, children: "Nav Item" }) }), className: "framer-1sxdfe5", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__VF2eO6eL0", style: { "--extracted-r6o4lv": "rgb(130, 130, 130)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: SbnDmc0Ms, variants: { "vQ4tPUNuw-hover": { "--extracted-r6o4lv": "rgb(18, 18, 18)" } }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides({ "vQ4tPUNuw-hover": { children: /* @__PURE__ */ _jsx12(React10.Fragment, { children: /* @__PURE__ */ _jsx12(motion12.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Nav Item" }) }) } }, baseVariant, gestureVariant) }) }) }) }) }) });
});
var css6 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-r5bta.framer-17hhuts, .framer-r5bta .framer-17hhuts { display: block; }", ".framer-r5bta.framer-1hu1ytn { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 4px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 6px 0px 6px 0px; position: relative; text-decoration: none; width: min-content; }", ".framer-r5bta .framer-1sxdfe5 { flex: none; height: auto; position: relative; white-space: pre; width: auto; }"];
var FramerxvHKkw4Lv = withCSS7(Component6, css6, "framer-r5bta");
var xvHKkw4Lv_default = FramerxvHKkw4Lv;
FramerxvHKkw4Lv.displayName = "Menu Link";
FramerxvHKkw4Lv.defaultProps = { height: 29, width: 56 };
addPropertyControls7(FramerxvHKkw4Lv, { SbnDmc0Ms: { defaultValue: "Nav Item", displayTextArea: false, title: "Text", type: ControlType7.String }, onSbnDmc0MsChange: { changes: "SbnDmc0Ms", type: ControlType7.ChangeHandler }, TEXQPq0ip: { title: "Link", type: ControlType7.Link }, Z3SWEK0uk: { defaultValue: false, title: "New Tab", type: ControlType7.Boolean }, onZ3SWEK0ukChange: { changes: "Z3SWEK0uk", type: ControlType7.ChangeHandler }, u1toCPSvE: { defaultValue: false, title: "Smooth Scroll", type: ControlType7.Boolean }, onu1toCPSvEChange: { changes: "u1toCPSvE", type: ControlType7.ChangeHandler }, WcYx6PpLU: { title: "Click", type: ControlType7.EventHandler } });
addFonts(FramerxvHKkw4Lv, [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", openType: true, source: "google", style: "normal", uiFamilyName: "Geist", url: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RruM4mJPby1QNtA.woff2", weight: "500" }] }], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/Q6NT8NZXP0XQR4Axne36/dGPiG8qv9MbOasWAzWPi/c8o9SH5Pr.js
var CaretUpFonts = getFonts(lDWUVpnhJ_default);
var MenuLinkFonts = getFonts(xvHKkw4Lv_default);
var cycleOrder = ["shKZfIBF2", "b2UmB7XOJ", "O563gik_Q"];
var serializationHash2 = "framer-vXP38";
var variantClassNames2 = { b2UmB7XOJ: "framer-v-1rjm34s", O563gik_Q: "framer-v-uzebq2", shKZfIBF2: "framer-v-1vs6ywr" };
function addPropertyOverrides2(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition12 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition2 = ({ value, children }) => {
  const config = React11.useContext(MotionConfigContext2);
  const transition = value ?? config.transition;
  const contextValue = React11.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx13(MotionConfigContext2.Provider, { value: contextValue, children });
};
var humanReadableVariantMap = { "Desktop & Tablet": "shKZfIBF2", "Phone Closed": "O563gik_Q", "Phone Open": "b2UmB7XOJ" };
var Variants2 = motion13.create(React11.Fragment);
var getProps7 = ({ closeDropdown, closeNav, height, id, width, ...props }) => {
  return { ...props, MW82Yr8hk: closeNav ?? props.MW82Yr8hk, UxUlZSy6z: closeDropdown ?? props.UxUlZSy6z, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "shKZfIBF2" };
};
var createLayoutDependency2 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component7 = /* @__PURE__ */ React11.forwardRef(function(props, ref) {
  const fallbackRef = useRef8(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React11.useId();
  const { activeLocale, setLocale } = useLocaleInfo10();
  const componentViewport = useComponentViewport2();
  const { style, className, layoutId, variant, UxUlZSy6z, MW82Yr8hk, ...restProps } = getProps7(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState2({ cycleOrder, defaultVariant: "shKZfIBF2", ref: refBinding, variant, variantClassNames: variantClassNames2 });
  const layoutDependency = createLayoutDependency2(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback2(baseVariant);
  const onMouseLeave1qlyf7s = activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: false });
    if (UxUlZSy6z) {
      const res = await UxUlZSy6z(...args);
      if (res === false)
        return false;
    }
  });
  const onTap3yzzyn = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    setVariant("b2UmB7XOJ");
  });
  const onTap1kl3gf4 = activeVariantCallback(async (...args) => {
    setVariant("O563gik_Q");
  });
  const WcYx6PpLU59dgnd = activeVariantCallback(async (...args) => {
    if (MW82Yr8hk) {
      const res = await MW82Yr8hk(...args);
      if (res === false)
        return false;
    }
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx7(serializationHash2, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (["b2UmB7XOJ", "O563gik_Q"].includes(baseVariant))
      return true;
    return false;
  };
  return /* @__PURE__ */ _jsx13(LayoutGroup2, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx13(Variants2, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx13(Transition2, { value: transition12, children: /* @__PURE__ */ _jsxs7(motion13.div, { ...restProps, ...gestureHandlers, className: cx7(scopingClassNames, "framer-1vs6ywr", className, classNames), "data-framer-name": "Desktop & Tablet", "data-highlight": true, layoutDependency, layoutId: "e1vFUka05__shKZfIBF2", onMouseLeave: onMouseLeave1qlyf7s, ref: refBinding, style: { ...style }, ...addPropertyOverrides2({ b2UmB7XOJ: { "data-framer-name": "Phone Open", "data-highlight": void 0, onMouseLeave: void 0 }, O563gik_Q: { "data-framer-name": "Phone Closed", onMouseLeave: void 0, onTap: onTap3yzzyn } }, baseVariant, gestureVariant), children: [isDisplayed() && /* @__PURE__ */ _jsxs7(motion13.div, { className: "framer-i6exye", "data-framer-name": "Mobile Title", layoutDependency, layoutId: "e1vFUka05__OP14kuIW1", style: { backgroundColor: "rgb(255, 255, 255)" }, ...addPropertyOverrides2({ b2UmB7XOJ: { "data-highlight": true, onTap: onTap1kl3gf4 } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx13(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx13(React11.Fragment, { children: /* @__PURE__ */ _jsx13(motion13.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-size": "18px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Men" }) }), className: "framer-1fveayi", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__hsDCuvf6N", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx13(motion13.div, { className: "framer-19bjrej", "data-framer-name": "Icon", layoutDependency, layoutId: "e1vFUka05__sVeUCnv7i", children: /* @__PURE__ */ _jsx13(lDWUVpnhJ_default, { animated: true, className: "framer-1ly3b0y", layoutDependency, layoutId: "e1vFUka05__o0P1G84Cx", style: { "--1m6trwb": 0, "--21h8s6": "rgb(0, 0, 0)", "--pgex8v": 2, rotate: 0 }, variants: { O563gik_Q: { rotate: -180 } } }) })] }), /* @__PURE__ */ _jsxs7(motion13.div, { className: "framer-151v99i", "data-framer-name": "Menu", layoutDependency, layoutId: "e1vFUka05__enWFrHGp_", children: [/* @__PURE__ */ _jsxs7(motion13.div, { className: "framer-m1e072", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__otddIcRCi", children: [/* @__PURE__ */ _jsx13(motion13.div, { className: "framer-1rqypb3", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__xfJFfEAO8", children: /* @__PURE__ */ _jsx13(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx13(React11.Fragment, { children: /* @__PURE__ */ _jsx13(motion13.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Footwear" }) }), className: "framer-1py6uvg", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__JF9KIJdGh", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs7(motion13.div, { className: "framer-1v2kqs7", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__Nsesyvgn6", children: [/* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 0 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-sggl3p-container", layoutDependency, layoutId: "e1vFUka05__zLWNuHvb6-container", nodeId: "zLWNuHvb6", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "zLWNuHvb6", layoutId: "e1vFUka05__zLWNuHvb6", SbnDmc0Ms: "All Footwear", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 0 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-1nu160k-container", layoutDependency, layoutId: "e1vFUka05__HxY6ENbK4-container", nodeId: "HxY6ENbK4", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "HxY6ENbK4", layoutId: "e1vFUka05__HxY6ENbK4", SbnDmc0Ms: "Everyday Style", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 29 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-17bf3uu-container", layoutDependency, layoutId: "e1vFUka05__Yb17TTfom-container", nodeId: "Yb17TTfom", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "Yb17TTfom", layoutId: "e1vFUka05__Yb17TTfom", SbnDmc0Ms: "Running", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 29 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-pp5ghb-container", layoutDependency, layoutId: "e1vFUka05__AalSTxeZx-container", nodeId: "AalSTxeZx", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "AalSTxeZx", layoutId: "e1vFUka05__AalSTxeZx", SbnDmc0Ms: "Basketball", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 140, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 58 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-1d3k1ul-container", layoutDependency, layoutId: "e1vFUka05__UBrihy4GX-container", nodeId: "UBrihy4GX", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "UBrihy4GX", layoutId: "e1vFUka05__UBrihy4GX", SbnDmc0Ms: "Training", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 175, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 58 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-10suf92-container", layoutDependency, layoutId: "e1vFUka05__ibrUgaHLI-container", nodeId: "ibrUgaHLI", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "ibrUgaHLI", layoutId: "e1vFUka05__ibrUgaHLI", SbnDmc0Ms: "Outdoor & Trail", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 210, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 87 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 87 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-q0f3dt-container", layoutDependency, layoutId: "e1vFUka05__wNJEm27At-container", nodeId: "wNJEm27At", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "wNJEm27At", layoutId: "e1vFUka05__wNJEm27At", SbnDmc0Ms: "Sandals", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs7(motion13.div, { className: "framer-vnoewg", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__A09vfMfj0", children: [/* @__PURE__ */ _jsx13(motion13.div, { className: "framer-uv61e3", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__SIbL5eQw_", children: /* @__PURE__ */ _jsx13(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx13(React11.Fragment, { children: /* @__PURE__ */ _jsx13(motion13.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Apparel" }) }), className: "framer-107ymeb", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__qRUqMkMtP", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs7(motion13.div, { className: "framer-1uyzucx", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__tcKbbdo2D", children: [/* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 0 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-kl63g9-container", layoutDependency, layoutId: "e1vFUka05__dCT8UqEGQ-container", nodeId: "dCT8UqEGQ", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "dCT8UqEGQ", layoutId: "e1vFUka05__dCT8UqEGQ", SbnDmc0Ms: "All New Apparel", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 0 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-1tc7o6q-container", layoutDependency, layoutId: "e1vFUka05__NDpjCqF7F-container", nodeId: "NDpjCqF7F", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "NDpjCqF7F", layoutId: "e1vFUka05__NDpjCqF7F", SbnDmc0Ms: "Tops & Tees", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 29 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-ye1ehr-container", layoutDependency, layoutId: "e1vFUka05__SxRBH3W5a-container", nodeId: "SxRBH3W5a", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "SxRBH3W5a", layoutId: "e1vFUka05__SxRBH3W5a", SbnDmc0Ms: "Hoodies & Fleece", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 29 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-1dx6afj-container", layoutDependency, layoutId: "e1vFUka05__zKiSjzpFv-container", nodeId: "zKiSjzpFv", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "zKiSjzpFv", layoutId: "e1vFUka05__zKiSjzpFv", SbnDmc0Ms: "Shorts", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 140, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 58 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-1du5b7w-container", layoutDependency, layoutId: "e1vFUka05__ieZI__okD-container", nodeId: "ieZI__okD", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "ieZI__okD", layoutId: "e1vFUka05__ieZI__okD", SbnDmc0Ms: "Pants & Joggers", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 175, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 58 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-1e5pcxv-container", layoutDependency, layoutId: "e1vFUka05__rgrpKTWL7-container", nodeId: "rgrpKTWL7", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "rgrpKTWL7", layoutId: "e1vFUka05__rgrpKTWL7", SbnDmc0Ms: "Jackets & Vests", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 210, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 87 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 87 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-13377i8-container", layoutDependency, layoutId: "e1vFUka05__S3by9tM4s-container", nodeId: "S3by9tM4s", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "S3by9tM4s", layoutId: "e1vFUka05__S3by9tM4s", SbnDmc0Ms: "Base Layer", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 245, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 87 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 159.2 + 0 + 27.2 + 0 + 87 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-yb62an-container", layoutDependency, layoutId: "e1vFUka05__ssrL4zeqO-container", nodeId: "ssrL4zeqO", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "ssrL4zeqO", layoutId: "e1vFUka05__ssrL4zeqO", SbnDmc0Ms: "Socks & Underwear", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs7(motion13.div, { className: "framer-1nhbshm", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__uIYAzTd7E", children: [/* @__PURE__ */ _jsx13(motion13.div, { className: "framer-1jaud30", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__CLClnB6mm", children: /* @__PURE__ */ _jsx13(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx13(React11.Fragment, { children: /* @__PURE__ */ _jsx13(motion13.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "By Sport" }) }), className: "framer-1pnzgz0", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__iYfB4lCrN", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs7(motion13.div, { className: "framer-60w4uh", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__GolSuYj4r", children: [/* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 0 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-13tl3iu-container", layoutDependency, layoutId: "e1vFUka05__WSo86Hjl2-container", nodeId: "WSo86Hjl2", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "WSo86Hjl2", layoutId: "e1vFUka05__WSo86Hjl2", SbnDmc0Ms: "Running", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 0 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-23ed2w-container", layoutDependency, layoutId: "e1vFUka05__xb0Ip6YuR-container", nodeId: "xb0Ip6YuR", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "xb0Ip6YuR", layoutId: "e1vFUka05__xb0Ip6YuR", SbnDmc0Ms: "Basketball", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 29 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-1e7qq4w-container", layoutDependency, layoutId: "e1vFUka05__yA9ruqKVW-container", nodeId: "yA9ruqKVW", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "yA9ruqKVW", layoutId: "e1vFUka05__yA9ruqKVW", SbnDmc0Ms: "Training", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 29 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-3kag65-container", layoutDependency, layoutId: "e1vFUka05__ZLXyQzSRb-container", nodeId: "ZLXyQzSRb", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "ZLXyQzSRb", layoutId: "e1vFUka05__ZLXyQzSRb", SbnDmc0Ms: "Football", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 140, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 58 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-9yf6d7-container", layoutDependency, layoutId: "e1vFUka05__dhn3fYqWm-container", nodeId: "dhn3fYqWm", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "dhn3fYqWm", layoutId: "e1vFUka05__dhn3fYqWm", SbnDmc0Ms: "Tennis", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 175, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 58 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-1179mbh-container", layoutDependency, layoutId: "e1vFUka05__djPs1b6O1-container", nodeId: "djPs1b6O1", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "djPs1b6O1", layoutId: "e1vFUka05__djPs1b6O1", SbnDmc0Ms: "Golf", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 210, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 87 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 318.4 + 0 + 27.2 + 0 + 87 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-1n50xv6-container", layoutDependency, layoutId: "e1vFUka05__RSUEE5fNy-container", nodeId: "RSUEE5fNy", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "RSUEE5fNy", layoutId: "e1vFUka05__RSUEE5fNy", SbnDmc0Ms: "Track & Field", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs7(motion13.div, { className: "framer-13u4pjb", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__vJK3wIYqg", children: [/* @__PURE__ */ _jsx13(motion13.div, { className: "framer-uu2705", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__Gb_wBHZA_", children: /* @__PURE__ */ _jsx13(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx13(React11.Fragment, { children: /* @__PURE__ */ _jsx13(motion13.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Collections" }) }), className: "framer-1igios2", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__UwUXKGfCp", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs7(motion13.div, { className: "framer-3hxqo1", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__Z54B2qCdA", children: [/* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 477.6 + 0 + 27.2 + 0 + 0 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 477.6 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-1fk9cj3-container", layoutDependency, layoutId: "e1vFUka05__nkMNGBd3w-container", nodeId: "nkMNGBd3w", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "nkMNGBd3w", layoutId: "e1vFUka05__nkMNGBd3w", SbnDmc0Ms: "Fleece Series", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 477.6 + 0 + 27.2 + 0 + 0 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 477.6 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-1le0e7-container", layoutDependency, layoutId: "e1vFUka05__rRE900MCM-container", nodeId: "rRE900MCM", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "rRE900MCM", layoutId: "e1vFUka05__rRE900MCM", SbnDmc0Ms: "Performance Dry", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 477.6 + 0 + 27.2 + 0 + 29 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 477.6 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-srygao-container", layoutDependency, layoutId: "e1vFUka05__vYaAAlNbY-container", nodeId: "vYaAAlNbY", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "vYaAAlNbY", layoutId: "e1vFUka05__vYaAAlNbY", SbnDmc0Ms: "All Terrain", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides2({ b2UmB7XOJ: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 477.6 + 0 + 27.2 + 0 + 29 }, O563gik_Q: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 477.6 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainer, { className: "framer-1qo51k4-container", layoutDependency, layoutId: "e1vFUka05__zekxTmUzW-container", nodeId: "zekxTmUzW", rendersWithMotion: true, scopeId: "c8o9SH5Pr", children: /* @__PURE__ */ _jsx13(xvHKkw4Lv_default, { height: "100%", id: "zekxTmUzW", layoutId: "e1vFUka05__zekxTmUzW", SbnDmc0Ms: "Compression", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] })] })] }) }) }) });
});
var css7 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-vXP38.framer-2xaoyp, .framer-vXP38 .framer-2xaoyp { display: block; }", ".framer-vXP38.framer-1vs6ywr { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; max-width: 1200px; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-vXP38 .framer-i6exye { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; overflow: var(--overflow-clip-fallback, clip); padding: 16px; position: relative; width: 100%; }", ".framer-vXP38 .framer-1fveayi, .framer-vXP38 .framer-1py6uvg, .framer-vXP38 .framer-107ymeb, .framer-vXP38 .framer-1pnzgz0, .framer-vXP38 .framer-1igios2 { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-vXP38 .framer-19bjrej { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 2px; position: relative; width: min-content; }", ".framer-vXP38 .framer-1ly3b0y { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 20px); position: relative; width: 20px; }", ".framer-vXP38 .framer-151v99i { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 16px; height: min-content; justify-content: center; overflow: visible; padding: 24px 16px 24px 16px; position: relative; width: 100%; }", ".framer-vXP38 .framer-m1e072, .framer-vXP38 .framer-vnoewg, .framer-vXP38 .framer-1nhbshm, .framer-vXP38 .framer-13u4pjb { align-content: flex-start; align-items: flex-start; display: flex; flex: 1 0 0px; flex-direction: column; flex-wrap: nowrap; gap: 20px; height: min-content; justify-content: center; max-width: 230px; overflow: visible; padding: 0px; position: relative; width: 1px; }", ".framer-vXP38 .framer-1rqypb3, .framer-vXP38 .framer-uv61e3, .framer-vXP38 .framer-1jaud30, .framer-vXP38 .framer-uu2705 { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-vXP38 .framer-1v2kqs7, .framer-vXP38 .framer-1uyzucx, .framer-vXP38 .framer-60w4uh, .framer-vXP38 .framer-3hxqo1 { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 6px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-vXP38 .framer-sggl3p-container, .framer-vXP38 .framer-1nu160k-container, .framer-vXP38 .framer-17bf3uu-container, .framer-vXP38 .framer-pp5ghb-container, .framer-vXP38 .framer-1d3k1ul-container, .framer-vXP38 .framer-10suf92-container, .framer-vXP38 .framer-q0f3dt-container, .framer-vXP38 .framer-kl63g9-container, .framer-vXP38 .framer-1tc7o6q-container, .framer-vXP38 .framer-ye1ehr-container, .framer-vXP38 .framer-1dx6afj-container, .framer-vXP38 .framer-1du5b7w-container, .framer-vXP38 .framer-1e5pcxv-container, .framer-vXP38 .framer-13377i8-container, .framer-vXP38 .framer-yb62an-container, .framer-vXP38 .framer-13tl3iu-container, .framer-vXP38 .framer-23ed2w-container, .framer-vXP38 .framer-1e7qq4w-container, .framer-vXP38 .framer-3kag65-container, .framer-vXP38 .framer-9yf6d7-container, .framer-vXP38 .framer-1179mbh-container, .framer-vXP38 .framer-1n50xv6-container, .framer-vXP38 .framer-1fk9cj3-container, .framer-vXP38 .framer-1le0e7-container, .framer-vXP38 .framer-srygao-container, .framer-vXP38 .framer-1qo51k4-container { flex: none; height: auto; position: relative; width: auto; }", ".framer-vXP38.framer-v-1rjm34s.framer-1vs6ywr { width: 100%; }", ".framer-vXP38.framer-v-1rjm34s .framer-i6exye { cursor: pointer; }", ".framer-vXP38.framer-v-1rjm34s .framer-151v99i, .framer-vXP38.framer-v-uzebq2 .framer-151v99i { flex-direction: column; padding: 8px 16px 8px 16px; }", ".framer-vXP38.framer-v-1rjm34s .framer-m1e072, .framer-vXP38.framer-v-1rjm34s .framer-vnoewg, .framer-vXP38.framer-v-1rjm34s .framer-1nhbshm, .framer-vXP38.framer-v-1rjm34s .framer-13u4pjb, .framer-vXP38.framer-v-uzebq2 .framer-m1e072, .framer-vXP38.framer-v-uzebq2 .framer-vnoewg, .framer-vXP38.framer-v-uzebq2 .framer-1nhbshm, .framer-vXP38.framer-v-uzebq2 .framer-13u4pjb { flex: none; gap: 8px; max-width: unset; width: 100%; }", ".framer-vXP38.framer-v-1rjm34s .framer-1v2kqs7, .framer-vXP38.framer-v-1rjm34s .framer-1uyzucx, .framer-vXP38.framer-v-1rjm34s .framer-60w4uh, .framer-vXP38.framer-v-1rjm34s .framer-3hxqo1, .framer-vXP38.framer-v-uzebq2 .framer-1v2kqs7, .framer-vXP38.framer-v-uzebq2 .framer-1uyzucx, .framer-vXP38.framer-v-uzebq2 .framer-60w4uh, .framer-vXP38.framer-v-uzebq2 .framer-3hxqo1 { align-content: unset; align-items: unset; display: grid; gap: 0px; grid-auto-rows: minmax(0, 1fr); grid-template-columns: repeat(2, minmax(50px, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); }", ".framer-vXP38.framer-v-1rjm34s .framer-sggl3p-container, .framer-vXP38.framer-v-1rjm34s .framer-1nu160k-container, .framer-vXP38.framer-v-1rjm34s .framer-17bf3uu-container, .framer-vXP38.framer-v-1rjm34s .framer-pp5ghb-container, .framer-vXP38.framer-v-1rjm34s .framer-1d3k1ul-container, .framer-vXP38.framer-v-1rjm34s .framer-10suf92-container, .framer-vXP38.framer-v-1rjm34s .framer-q0f3dt-container, .framer-vXP38.framer-v-1rjm34s .framer-kl63g9-container, .framer-vXP38.framer-v-1rjm34s .framer-1tc7o6q-container, .framer-vXP38.framer-v-1rjm34s .framer-ye1ehr-container, .framer-vXP38.framer-v-1rjm34s .framer-1dx6afj-container, .framer-vXP38.framer-v-1rjm34s .framer-1du5b7w-container, .framer-vXP38.framer-v-1rjm34s .framer-1e5pcxv-container, .framer-vXP38.framer-v-1rjm34s .framer-13377i8-container, .framer-vXP38.framer-v-1rjm34s .framer-yb62an-container, .framer-vXP38.framer-v-1rjm34s .framer-13tl3iu-container, .framer-vXP38.framer-v-1rjm34s .framer-23ed2w-container, .framer-vXP38.framer-v-1rjm34s .framer-1e7qq4w-container, .framer-vXP38.framer-v-1rjm34s .framer-3kag65-container, .framer-vXP38.framer-v-1rjm34s .framer-9yf6d7-container, .framer-vXP38.framer-v-1rjm34s .framer-1179mbh-container, .framer-vXP38.framer-v-1rjm34s .framer-1n50xv6-container, .framer-vXP38.framer-v-1rjm34s .framer-1fk9cj3-container, .framer-vXP38.framer-v-1rjm34s .framer-1le0e7-container, .framer-vXP38.framer-v-1rjm34s .framer-srygao-container, .framer-vXP38.framer-v-1rjm34s .framer-1qo51k4-container, .framer-vXP38.framer-v-uzebq2 .framer-sggl3p-container, .framer-vXP38.framer-v-uzebq2 .framer-1nu160k-container, .framer-vXP38.framer-v-uzebq2 .framer-17bf3uu-container, .framer-vXP38.framer-v-uzebq2 .framer-pp5ghb-container, .framer-vXP38.framer-v-uzebq2 .framer-1d3k1ul-container, .framer-vXP38.framer-v-uzebq2 .framer-10suf92-container, .framer-vXP38.framer-v-uzebq2 .framer-q0f3dt-container, .framer-vXP38.framer-v-uzebq2 .framer-kl63g9-container, .framer-vXP38.framer-v-uzebq2 .framer-1tc7o6q-container, .framer-vXP38.framer-v-uzebq2 .framer-ye1ehr-container, .framer-vXP38.framer-v-uzebq2 .framer-1dx6afj-container, .framer-vXP38.framer-v-uzebq2 .framer-1du5b7w-container, .framer-vXP38.framer-v-uzebq2 .framer-1e5pcxv-container, .framer-vXP38.framer-v-uzebq2 .framer-13377i8-container, .framer-vXP38.framer-v-uzebq2 .framer-yb62an-container, .framer-vXP38.framer-v-uzebq2 .framer-13tl3iu-container, .framer-vXP38.framer-v-uzebq2 .framer-23ed2w-container, .framer-vXP38.framer-v-uzebq2 .framer-1e7qq4w-container, .framer-vXP38.framer-v-uzebq2 .framer-3kag65-container, .framer-vXP38.framer-v-uzebq2 .framer-9yf6d7-container, .framer-vXP38.framer-v-uzebq2 .framer-1179mbh-container, .framer-vXP38.framer-v-uzebq2 .framer-1n50xv6-container, .framer-vXP38.framer-v-uzebq2 .framer-1fk9cj3-container, .framer-vXP38.framer-v-uzebq2 .framer-1le0e7-container, .framer-vXP38.framer-v-uzebq2 .framer-srygao-container, .framer-vXP38.framer-v-uzebq2 .framer-1qo51k4-container { align-self: start; justify-self: start; width: 100%; }", ".framer-vXP38.framer-v-uzebq2.framer-1vs6ywr { cursor: pointer; height: auto; overflow: hidden; width: 100%; }"];
var Framerc8o9SH5Pr = withCSS8(Component7, css7, "framer-vXP38");
var c8o9SH5Pr_default = Framerc8o9SH5Pr;
Framerc8o9SH5Pr.displayName = "Men Menu";
Framerc8o9SH5Pr.defaultProps = { height: 359.5, width: 1200 };
addPropertyControls8(Framerc8o9SH5Pr, { variant: { options: ["shKZfIBF2", "b2UmB7XOJ", "O563gik_Q"], optionTitles: ["Desktop & Tablet", "Phone Open", "Phone Closed"], title: "Variant", type: ControlType8.Enum }, UxUlZSy6z: { title: "Close Dropdown", type: ControlType8.EventHandler }, MW82Yr8hk: { title: "Close Nav", type: ControlType8.EventHandler } });
addFonts2(Framerc8o9SH5Pr, [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RruM4mJPby1QNtA.woff2", weight: "500" }] }, ...CaretUpFonts, ...MenuLinkFonts], { supportsExplicitInterCodegen: true });
Framerc8o9SH5Pr.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader(xvHKkw4Lv_default, {}, context)]);
} };

// http-url:https://framerusercontent.com/modules/I9ohwXuE8eHe1Yqitvw9/Oyoj0zFrnrrkqFHa9Xms/eWbC_MfEi.js
import { jsx as _jsx14, jsxs as _jsxs8 } from "react/jsx-runtime";
import { addFonts as addFonts3, addPropertyControls as addPropertyControls9, ComponentViewportProvider as ComponentViewportProvider2, ControlType as ControlType9, cx as cx8, forwardLoader as forwardLoader2, getFonts as getFonts2, RichText as RichText3, SmartComponentScopedContainer as SmartComponentScopedContainer2, useActiveVariantCallback as useActiveVariantCallback3, useComponentViewport as useComponentViewport3, useLocaleInfo as useLocaleInfo11, useVariantState as useVariantState3, withCSS as withCSS9 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup3, motion as motion14, MotionConfigContext as MotionConfigContext3 } from "framer-motion";
import * as React12 from "react";
import { useRef as useRef9 } from "react";
var CaretUpFonts2 = getFonts2(lDWUVpnhJ_default);
var MenuLinkFonts2 = getFonts2(xvHKkw4Lv_default);
var cycleOrder2 = ["TNlf4U32B", "GFuZuCFMf", "T67nWYtyt"];
var serializationHash3 = "framer-D1rEa";
var variantClassNames3 = { GFuZuCFMf: "framer-v-oks14k", T67nWYtyt: "framer-v-xno3nj", TNlf4U32B: "framer-v-16rsorq" };
function addPropertyOverrides3(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition13 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition3 = ({ value, children }) => {
  const config = React12.useContext(MotionConfigContext3);
  const transition = value ?? config.transition;
  const contextValue = React12.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx14(MotionConfigContext3.Provider, { value: contextValue, children });
};
var humanReadableVariantMap2 = { "Desktop & Tablet": "TNlf4U32B", "Phone Closed": "T67nWYtyt", "Phone Open": "GFuZuCFMf" };
var Variants3 = motion14.create(React12.Fragment);
var getProps8 = ({ closeDropdown, closeNav, height, id, width, ...props }) => {
  return { ...props, MW82Yr8hk: closeNav ?? props.MW82Yr8hk, UxUlZSy6z: closeDropdown ?? props.UxUlZSy6z, variant: humanReadableVariantMap2[props.variant] ?? props.variant ?? "TNlf4U32B" };
};
var createLayoutDependency3 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component8 = /* @__PURE__ */ React12.forwardRef(function(props, ref) {
  const fallbackRef = useRef9(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React12.useId();
  const { activeLocale, setLocale } = useLocaleInfo11();
  const componentViewport = useComponentViewport3();
  const { style, className, layoutId, variant, UxUlZSy6z, MW82Yr8hk, ...restProps } = getProps8(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState3({ cycleOrder: cycleOrder2, defaultVariant: "TNlf4U32B", ref: refBinding, variant, variantClassNames: variantClassNames3 });
  const layoutDependency = createLayoutDependency3(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback3(baseVariant);
  const onMouseLeave1qlyf7s = activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: false });
    if (UxUlZSy6z) {
      const res = await UxUlZSy6z(...args);
      if (res === false)
        return false;
    }
  });
  const onTap9w7129 = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    setVariant("GFuZuCFMf");
  });
  const onTap275cq9 = activeVariantCallback(async (...args) => {
    setVariant("T67nWYtyt");
  });
  const WcYx6PpLU59dgnd = activeVariantCallback(async (...args) => {
    if (MW82Yr8hk) {
      const res = await MW82Yr8hk(...args);
      if (res === false)
        return false;
    }
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx8(serializationHash3, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (["GFuZuCFMf", "T67nWYtyt"].includes(baseVariant))
      return true;
    return false;
  };
  return /* @__PURE__ */ _jsx14(LayoutGroup3, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx14(Variants3, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx14(Transition3, { value: transition13, children: /* @__PURE__ */ _jsxs8(motion14.div, { ...restProps, ...gestureHandlers, className: cx8(scopingClassNames, "framer-16rsorq", className, classNames), "data-framer-name": "Desktop & Tablet", "data-highlight": true, layoutDependency, layoutId: "e1vFUka05__TNlf4U32B", onMouseLeave: onMouseLeave1qlyf7s, ref: refBinding, style: { ...style }, ...addPropertyOverrides3({ GFuZuCFMf: { "data-framer-name": "Phone Open", "data-highlight": void 0, onMouseLeave: void 0 }, T67nWYtyt: { "data-framer-name": "Phone Closed", onMouseLeave: void 0, onTap: onTap9w7129 } }, baseVariant, gestureVariant), children: [isDisplayed() && /* @__PURE__ */ _jsxs8(motion14.div, { className: "framer-1q77pj", "data-framer-name": "Mobile Title", layoutDependency, layoutId: "e1vFUka05__Ko8NBKIvx", style: { backgroundColor: "rgb(255, 255, 255)" }, ...addPropertyOverrides3({ GFuZuCFMf: { "data-highlight": true, onTap: onTap275cq9 } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx14(RichText3, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx14(React12.Fragment, { children: /* @__PURE__ */ _jsx14(motion14.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-size": "18px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Women" }) }), className: "framer-1i5u537", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__FF28skTdD", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx14(motion14.div, { className: "framer-8hy250", "data-framer-name": "Icon", layoutDependency, layoutId: "e1vFUka05__lHNGfbkZz", children: /* @__PURE__ */ _jsx14(lDWUVpnhJ_default, { animated: true, className: "framer-13a27m", layoutDependency, layoutId: "e1vFUka05__IjNrF4yqS", style: { "--1m6trwb": 0, "--21h8s6": "rgb(0, 0, 0)", "--pgex8v": 2, rotate: 0 }, variants: { T67nWYtyt: { rotate: -180 } } }) })] }), /* @__PURE__ */ _jsxs8(motion14.div, { className: "framer-erm3ti", "data-framer-name": "Menu", layoutDependency, layoutId: "e1vFUka05__umms7iTtT", children: [/* @__PURE__ */ _jsxs8(motion14.div, { className: "framer-1myqyh2", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__jKHPHOQI0", children: [/* @__PURE__ */ _jsx14(motion14.div, { className: "framer-ssu6x1", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__gTRw6O7nj", children: /* @__PURE__ */ _jsx14(RichText3, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx14(React12.Fragment, { children: /* @__PURE__ */ _jsx14(motion14.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Footwear" }) }), className: "framer-1ddfe7", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__nh4QVNVfg", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs8(motion14.div, { className: "framer-8l6uvp", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__MGOZsy2j5", children: [/* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 0 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-10o92xp-container", layoutDependency, layoutId: "e1vFUka05__qoZkeIrfS-container", nodeId: "qoZkeIrfS", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "qoZkeIrfS", layoutId: "e1vFUka05__qoZkeIrfS", SbnDmc0Ms: "All Footwear", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 0 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-ecpkhb-container", layoutDependency, layoutId: "e1vFUka05__RnDAtrO45-container", nodeId: "RnDAtrO45", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "RnDAtrO45", layoutId: "e1vFUka05__RnDAtrO45", SbnDmc0Ms: "Everyday Style", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 29 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-1ihvnmw-container", layoutDependency, layoutId: "e1vFUka05__vd02BDYty-container", nodeId: "vd02BDYty", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "vd02BDYty", layoutId: "e1vFUka05__vd02BDYty", SbnDmc0Ms: "Running", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 29 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-1eugkvp-container", layoutDependency, layoutId: "e1vFUka05__VqeJ94vL1-container", nodeId: "VqeJ94vL1", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "VqeJ94vL1", layoutId: "e1vFUka05__VqeJ94vL1", SbnDmc0Ms: "Basketball", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 140, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 58 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-15huiir-container", layoutDependency, layoutId: "e1vFUka05__vfeaJpwEo-container", nodeId: "vfeaJpwEo", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "vfeaJpwEo", layoutId: "e1vFUka05__vfeaJpwEo", SbnDmc0Ms: "Training", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 175, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 58 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-nunvx8-container", layoutDependency, layoutId: "e1vFUka05__MW29u_WGK-container", nodeId: "MW29u_WGK", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "MW29u_WGK", layoutId: "e1vFUka05__MW29u_WGK", SbnDmc0Ms: "Outdoor & Trail", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 210, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 87 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 87 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-l7nn37-container", layoutDependency, layoutId: "e1vFUka05__DbsvUWP4r-container", nodeId: "DbsvUWP4r", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "DbsvUWP4r", layoutId: "e1vFUka05__DbsvUWP4r", SbnDmc0Ms: "Sandals", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs8(motion14.div, { className: "framer-62z9l8", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__vIT6BWIc8", children: [/* @__PURE__ */ _jsx14(motion14.div, { className: "framer-rch0l3", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__AWrfawbUG", children: /* @__PURE__ */ _jsx14(RichText3, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx14(React12.Fragment, { children: /* @__PURE__ */ _jsx14(motion14.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Apparel" }) }), className: "framer-dlj17f", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__VZvHk3JSG", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs8(motion14.div, { className: "framer-mb0gvu", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__E3N9HYZO_", children: [/* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 0 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-1xv9o4d-container", layoutDependency, layoutId: "e1vFUka05__bDeAlst9V-container", nodeId: "bDeAlst9V", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "bDeAlst9V", layoutId: "e1vFUka05__bDeAlst9V", SbnDmc0Ms: "All New Apparel", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 0 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-1ke90b5-container", layoutDependency, layoutId: "e1vFUka05__VgI6gye_s-container", nodeId: "VgI6gye_s", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "VgI6gye_s", layoutId: "e1vFUka05__VgI6gye_s", SbnDmc0Ms: "Tops & Tees", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 29 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-1jc69lh-container", layoutDependency, layoutId: "e1vFUka05__AxraWVoab-container", nodeId: "AxraWVoab", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "AxraWVoab", layoutId: "e1vFUka05__AxraWVoab", SbnDmc0Ms: "Sports Bras", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 29 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-1pze965-container", layoutDependency, layoutId: "e1vFUka05__srBf3xugg-container", nodeId: "srBf3xugg", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "srBf3xugg", layoutId: "e1vFUka05__srBf3xugg", SbnDmc0Ms: "Hoodies & Fleece", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 140, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 58 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-1tccqi1-container", layoutDependency, layoutId: "e1vFUka05__bseAH4wKY-container", nodeId: "bseAH4wKY", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "bseAH4wKY", layoutId: "e1vFUka05__bseAH4wKY", SbnDmc0Ms: "Shorts", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 175, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 58 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-ldfq7a-container", layoutDependency, layoutId: "e1vFUka05__tfzcrPuou-container", nodeId: "tfzcrPuou", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "tfzcrPuou", layoutId: "e1vFUka05__tfzcrPuou", SbnDmc0Ms: "Leggings & Tights", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 210, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 87 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 87 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-13ethtd-container", layoutDependency, layoutId: "e1vFUka05__FxSOvmnOG-container", nodeId: "FxSOvmnOG", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "FxSOvmnOG", layoutId: "e1vFUka05__FxSOvmnOG", SbnDmc0Ms: "Jackets & Vests", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 245, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 87 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 159.2 + 0 + 27.2 + 0 + 87 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-4enn6f-container", layoutDependency, layoutId: "e1vFUka05__lm16SYSWP-container", nodeId: "lm16SYSWP", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "lm16SYSWP", layoutId: "e1vFUka05__lm16SYSWP", SbnDmc0Ms: "Socks & Underwear", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs8(motion14.div, { className: "framer-ilc1f7", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__nbR0nXBOr", children: [/* @__PURE__ */ _jsx14(motion14.div, { className: "framer-15eq33a", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__jdiBk72ti", children: /* @__PURE__ */ _jsx14(RichText3, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx14(React12.Fragment, { children: /* @__PURE__ */ _jsx14(motion14.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "By Sport" }) }), className: "framer-u5bbu2", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__TExMEixAe", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs8(motion14.div, { className: "framer-cipvmu", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__Ta9c6dHk7", children: [/* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 0 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-12i0mwe-container", layoutDependency, layoutId: "e1vFUka05__MZx3xQ4M7-container", nodeId: "MZx3xQ4M7", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "MZx3xQ4M7", layoutId: "e1vFUka05__MZx3xQ4M7", SbnDmc0Ms: "Running", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 0 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-1uu5cj3-container", layoutDependency, layoutId: "e1vFUka05__eVXGz6dkJ-container", nodeId: "eVXGz6dkJ", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "eVXGz6dkJ", layoutId: "e1vFUka05__eVXGz6dkJ", SbnDmc0Ms: "Training", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 29 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-p7fo0p-container", layoutDependency, layoutId: "e1vFUka05__jJfyKyGJH-container", nodeId: "jJfyKyGJH", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "jJfyKyGJH", layoutId: "e1vFUka05__jJfyKyGJH", SbnDmc0Ms: "Yoga & Studio", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 29 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-10l69zs-container", layoutDependency, layoutId: "e1vFUka05__OUw4424_Z-container", nodeId: "OUw4424_Z", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "OUw4424_Z", layoutId: "e1vFUka05__OUw4424_Z", SbnDmc0Ms: "Basketball", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 140, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 58 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-ewq9xc-container", layoutDependency, layoutId: "e1vFUka05__JSt6bcdEQ-container", nodeId: "JSt6bcdEQ", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "JSt6bcdEQ", layoutId: "e1vFUka05__JSt6bcdEQ", SbnDmc0Ms: "Tennis", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 175, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 58 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-itkxcs-container", layoutDependency, layoutId: "e1vFUka05__ATT3IfwNd-container", nodeId: "ATT3IfwNd", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "ATT3IfwNd", layoutId: "e1vFUka05__ATT3IfwNd", SbnDmc0Ms: "Golf", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 210, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 87 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 318.4 + 0 + 27.2 + 0 + 87 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-xbonqx-container", layoutDependency, layoutId: "e1vFUka05__GdgzbirsQ-container", nodeId: "GdgzbirsQ", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "GdgzbirsQ", layoutId: "e1vFUka05__GdgzbirsQ", SbnDmc0Ms: "Track & Field", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs8(motion14.div, { className: "framer-1d2cnj8", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__lcWT4O63o", children: [/* @__PURE__ */ _jsx14(motion14.div, { className: "framer-1jcpmmd", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__HvmKV9oqE", children: /* @__PURE__ */ _jsx14(RichText3, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx14(React12.Fragment, { children: /* @__PURE__ */ _jsx14(motion14.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Collections" }) }), className: "framer-yn2dzb", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__pTHr_BKnS", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs8(motion14.div, { className: "framer-1t16q8z", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__sMobwxn_7", children: [/* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 477.6 + 0 + 27.2 + 0 + 0 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 477.6 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-bgiqxu-container", layoutDependency, layoutId: "e1vFUka05__bRgmRW_K5-container", nodeId: "bRgmRW_K5", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "bRgmRW_K5", layoutId: "e1vFUka05__bRgmRW_K5", SbnDmc0Ms: "Seamless Series", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 477.6 + 0 + 27.2 + 0 + 0 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 477.6 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-18zqals-container", layoutDependency, layoutId: "e1vFUka05__vI_5fTnRG-container", nodeId: "vI_5fTnRG", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "vI_5fTnRG", layoutId: "e1vFUka05__vI_5fTnRG", SbnDmc0Ms: "High Support", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 477.6 + 0 + 27.2 + 0 + 29 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 477.6 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-d5sdmu-container", layoutDependency, layoutId: "e1vFUka05__torzEDz5J-container", nodeId: "torzEDz5J", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "torzEDz5J", layoutId: "e1vFUka05__torzEDz5J", SbnDmc0Ms: "Performance Dry", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx14(ComponentViewportProvider2, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides3({ GFuZuCFMf: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 477.6 + 0 + 27.2 + 0 + 29 }, T67nWYtyt: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 477.6 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx14(SmartComponentScopedContainer2, { className: "framer-1ltcuu3-container", layoutDependency, layoutId: "e1vFUka05__uPTRBeRC1-container", nodeId: "uPTRBeRC1", rendersWithMotion: true, scopeId: "eWbC_MfEi", children: /* @__PURE__ */ _jsx14(xvHKkw4Lv_default, { height: "100%", id: "uPTRBeRC1", layoutId: "e1vFUka05__uPTRBeRC1", SbnDmc0Ms: "Compression", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] })] })] }) }) }) });
});
var css8 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-D1rEa.framer-1qfneg7, .framer-D1rEa .framer-1qfneg7 { display: block; }", ".framer-D1rEa.framer-16rsorq { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; max-width: 1200px; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-D1rEa .framer-1q77pj { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; overflow: var(--overflow-clip-fallback, clip); padding: 16px; position: relative; width: 100%; }", ".framer-D1rEa .framer-1i5u537, .framer-D1rEa .framer-1ddfe7, .framer-D1rEa .framer-dlj17f, .framer-D1rEa .framer-u5bbu2, .framer-D1rEa .framer-yn2dzb { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-D1rEa .framer-8hy250 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: min-content; }", ".framer-D1rEa .framer-13a27m { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 20px); position: relative; width: 20px; }", ".framer-D1rEa .framer-erm3ti { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 16px; height: min-content; justify-content: center; overflow: visible; padding: 24px 16px 24px 16px; position: relative; width: 100%; }", ".framer-D1rEa .framer-1myqyh2, .framer-D1rEa .framer-62z9l8, .framer-D1rEa .framer-ilc1f7, .framer-D1rEa .framer-1d2cnj8 { align-content: flex-start; align-items: flex-start; display: flex; flex: 1 0 0px; flex-direction: column; flex-wrap: nowrap; gap: 20px; height: min-content; justify-content: center; max-width: 230px; overflow: visible; padding: 0px; position: relative; width: 1px; }", ".framer-D1rEa .framer-ssu6x1, .framer-D1rEa .framer-rch0l3, .framer-D1rEa .framer-15eq33a, .framer-D1rEa .framer-1jcpmmd { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-D1rEa .framer-8l6uvp, .framer-D1rEa .framer-mb0gvu, .framer-D1rEa .framer-cipvmu, .framer-D1rEa .framer-1t16q8z { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 6px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-D1rEa .framer-10o92xp-container, .framer-D1rEa .framer-ecpkhb-container, .framer-D1rEa .framer-1ihvnmw-container, .framer-D1rEa .framer-1eugkvp-container, .framer-D1rEa .framer-15huiir-container, .framer-D1rEa .framer-nunvx8-container, .framer-D1rEa .framer-l7nn37-container, .framer-D1rEa .framer-1xv9o4d-container, .framer-D1rEa .framer-1ke90b5-container, .framer-D1rEa .framer-1jc69lh-container, .framer-D1rEa .framer-1pze965-container, .framer-D1rEa .framer-1tccqi1-container, .framer-D1rEa .framer-ldfq7a-container, .framer-D1rEa .framer-13ethtd-container, .framer-D1rEa .framer-4enn6f-container, .framer-D1rEa .framer-12i0mwe-container, .framer-D1rEa .framer-1uu5cj3-container, .framer-D1rEa .framer-p7fo0p-container, .framer-D1rEa .framer-10l69zs-container, .framer-D1rEa .framer-ewq9xc-container, .framer-D1rEa .framer-itkxcs-container, .framer-D1rEa .framer-xbonqx-container, .framer-D1rEa .framer-bgiqxu-container, .framer-D1rEa .framer-18zqals-container, .framer-D1rEa .framer-d5sdmu-container, .framer-D1rEa .framer-1ltcuu3-container { flex: none; height: auto; position: relative; width: auto; }", ".framer-D1rEa.framer-v-oks14k.framer-16rsorq { width: 100%; }", ".framer-D1rEa.framer-v-oks14k .framer-1q77pj { cursor: pointer; }", ".framer-D1rEa.framer-v-oks14k .framer-erm3ti, .framer-D1rEa.framer-v-xno3nj .framer-erm3ti { flex-direction: column; padding: 8px 16px 8px 16px; }", ".framer-D1rEa.framer-v-oks14k .framer-1myqyh2, .framer-D1rEa.framer-v-oks14k .framer-62z9l8, .framer-D1rEa.framer-v-oks14k .framer-ilc1f7, .framer-D1rEa.framer-v-oks14k .framer-1d2cnj8, .framer-D1rEa.framer-v-xno3nj .framer-1myqyh2, .framer-D1rEa.framer-v-xno3nj .framer-62z9l8, .framer-D1rEa.framer-v-xno3nj .framer-ilc1f7, .framer-D1rEa.framer-v-xno3nj .framer-1d2cnj8 { flex: none; gap: 8px; max-width: unset; width: 100%; }", ".framer-D1rEa.framer-v-oks14k .framer-8l6uvp, .framer-D1rEa.framer-v-oks14k .framer-mb0gvu, .framer-D1rEa.framer-v-oks14k .framer-cipvmu, .framer-D1rEa.framer-v-oks14k .framer-1t16q8z, .framer-D1rEa.framer-v-xno3nj .framer-8l6uvp, .framer-D1rEa.framer-v-xno3nj .framer-mb0gvu, .framer-D1rEa.framer-v-xno3nj .framer-cipvmu, .framer-D1rEa.framer-v-xno3nj .framer-1t16q8z { align-content: unset; align-items: unset; display: grid; gap: 0px; grid-auto-rows: minmax(0, 1fr); grid-template-columns: repeat(2, minmax(50px, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); }", ".framer-D1rEa.framer-v-oks14k .framer-10o92xp-container, .framer-D1rEa.framer-v-oks14k .framer-ecpkhb-container, .framer-D1rEa.framer-v-oks14k .framer-1ihvnmw-container, .framer-D1rEa.framer-v-oks14k .framer-1eugkvp-container, .framer-D1rEa.framer-v-oks14k .framer-15huiir-container, .framer-D1rEa.framer-v-oks14k .framer-nunvx8-container, .framer-D1rEa.framer-v-oks14k .framer-l7nn37-container, .framer-D1rEa.framer-v-oks14k .framer-1xv9o4d-container, .framer-D1rEa.framer-v-oks14k .framer-1ke90b5-container, .framer-D1rEa.framer-v-oks14k .framer-1jc69lh-container, .framer-D1rEa.framer-v-oks14k .framer-1pze965-container, .framer-D1rEa.framer-v-oks14k .framer-1tccqi1-container, .framer-D1rEa.framer-v-oks14k .framer-ldfq7a-container, .framer-D1rEa.framer-v-oks14k .framer-13ethtd-container, .framer-D1rEa.framer-v-oks14k .framer-4enn6f-container, .framer-D1rEa.framer-v-oks14k .framer-12i0mwe-container, .framer-D1rEa.framer-v-oks14k .framer-1uu5cj3-container, .framer-D1rEa.framer-v-oks14k .framer-p7fo0p-container, .framer-D1rEa.framer-v-oks14k .framer-10l69zs-container, .framer-D1rEa.framer-v-oks14k .framer-ewq9xc-container, .framer-D1rEa.framer-v-oks14k .framer-itkxcs-container, .framer-D1rEa.framer-v-oks14k .framer-xbonqx-container, .framer-D1rEa.framer-v-oks14k .framer-bgiqxu-container, .framer-D1rEa.framer-v-oks14k .framer-18zqals-container, .framer-D1rEa.framer-v-oks14k .framer-d5sdmu-container, .framer-D1rEa.framer-v-oks14k .framer-1ltcuu3-container, .framer-D1rEa.framer-v-xno3nj .framer-10o92xp-container, .framer-D1rEa.framer-v-xno3nj .framer-ecpkhb-container, .framer-D1rEa.framer-v-xno3nj .framer-1ihvnmw-container, .framer-D1rEa.framer-v-xno3nj .framer-1eugkvp-container, .framer-D1rEa.framer-v-xno3nj .framer-15huiir-container, .framer-D1rEa.framer-v-xno3nj .framer-nunvx8-container, .framer-D1rEa.framer-v-xno3nj .framer-l7nn37-container, .framer-D1rEa.framer-v-xno3nj .framer-1xv9o4d-container, .framer-D1rEa.framer-v-xno3nj .framer-1ke90b5-container, .framer-D1rEa.framer-v-xno3nj .framer-1jc69lh-container, .framer-D1rEa.framer-v-xno3nj .framer-1pze965-container, .framer-D1rEa.framer-v-xno3nj .framer-1tccqi1-container, .framer-D1rEa.framer-v-xno3nj .framer-ldfq7a-container, .framer-D1rEa.framer-v-xno3nj .framer-13ethtd-container, .framer-D1rEa.framer-v-xno3nj .framer-4enn6f-container, .framer-D1rEa.framer-v-xno3nj .framer-12i0mwe-container, .framer-D1rEa.framer-v-xno3nj .framer-1uu5cj3-container, .framer-D1rEa.framer-v-xno3nj .framer-p7fo0p-container, .framer-D1rEa.framer-v-xno3nj .framer-10l69zs-container, .framer-D1rEa.framer-v-xno3nj .framer-ewq9xc-container, .framer-D1rEa.framer-v-xno3nj .framer-itkxcs-container, .framer-D1rEa.framer-v-xno3nj .framer-xbonqx-container, .framer-D1rEa.framer-v-xno3nj .framer-bgiqxu-container, .framer-D1rEa.framer-v-xno3nj .framer-18zqals-container, .framer-D1rEa.framer-v-xno3nj .framer-d5sdmu-container, .framer-D1rEa.framer-v-xno3nj .framer-1ltcuu3-container { align-self: start; justify-self: start; width: 100%; }", ".framer-D1rEa.framer-v-xno3nj.framer-16rsorq { cursor: pointer; height: auto; overflow: hidden; width: 100%; }"];
var FramereWbC_MfEi = withCSS9(Component8, css8, "framer-D1rEa");
var eWbC_MfEi_default = FramereWbC_MfEi;
FramereWbC_MfEi.displayName = "Women Menu";
FramereWbC_MfEi.defaultProps = { height: 359.5, width: 1200 };
addPropertyControls9(FramereWbC_MfEi, { variant: { options: ["TNlf4U32B", "GFuZuCFMf", "T67nWYtyt"], optionTitles: ["Desktop & Tablet", "Phone Open", "Phone Closed"], title: "Variant", type: ControlType9.Enum }, UxUlZSy6z: { title: "Close Dropdown", type: ControlType9.EventHandler }, MW82Yr8hk: { title: "Close Nav", type: ControlType9.EventHandler } });
addFonts3(FramereWbC_MfEi, [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RruM4mJPby1QNtA.woff2", weight: "500" }] }, ...CaretUpFonts2, ...MenuLinkFonts2], { supportsExplicitInterCodegen: true });
FramereWbC_MfEi.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader2(xvHKkw4Lv_default, {}, context)]);
} };

// http-url:https://framerusercontent.com/modules/dvlOopTqT9Wmy3USn7xa/6g8wvP857wqOKpaabosi/oRNeXEz8O.js
import { jsx as _jsx15, jsxs as _jsxs9 } from "react/jsx-runtime";
import { addFonts as addFonts4, addPropertyControls as addPropertyControls10, ComponentViewportProvider as ComponentViewportProvider3, ControlType as ControlType10, cx as cx9, forwardLoader as forwardLoader3, getFonts as getFonts3, RichText as RichText4, SmartComponentScopedContainer as SmartComponentScopedContainer3, useActiveVariantCallback as useActiveVariantCallback4, useComponentViewport as useComponentViewport4, useLocaleInfo as useLocaleInfo12, useVariantState as useVariantState4, withCSS as withCSS10 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup4, motion as motion15, MotionConfigContext as MotionConfigContext4 } from "framer-motion";
import * as React13 from "react";
import { useRef as useRef10 } from "react";
var CaretUpFonts3 = getFonts3(lDWUVpnhJ_default);
var MenuLinkFonts3 = getFonts3(xvHKkw4Lv_default);
var cycleOrder3 = ["NjbypYOoz", "VG3wIEouY", "pCp9gT1DB"];
var serializationHash4 = "framer-w4d02";
var variantClassNames4 = { NjbypYOoz: "framer-v-lt5tjt", pCp9gT1DB: "framer-v-capvdh", VG3wIEouY: "framer-v-ebdta0" };
function addPropertyOverrides4(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition14 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition4 = ({ value, children }) => {
  const config = React13.useContext(MotionConfigContext4);
  const transition = value ?? config.transition;
  const contextValue = React13.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx15(MotionConfigContext4.Provider, { value: contextValue, children });
};
var humanReadableVariantMap3 = { "Desktop & Tablet": "NjbypYOoz", "Phone Closed": "pCp9gT1DB", "Phone Open": "VG3wIEouY" };
var Variants4 = motion15.create(React13.Fragment);
var getProps9 = ({ closeDropdown, closeNav, height, id, width, ...props }) => {
  return { ...props, MW82Yr8hk: closeNav ?? props.MW82Yr8hk, UxUlZSy6z: closeDropdown ?? props.UxUlZSy6z, variant: humanReadableVariantMap3[props.variant] ?? props.variant ?? "NjbypYOoz" };
};
var createLayoutDependency4 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component9 = /* @__PURE__ */ React13.forwardRef(function(props, ref) {
  const fallbackRef = useRef10(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React13.useId();
  const { activeLocale, setLocale } = useLocaleInfo12();
  const componentViewport = useComponentViewport4();
  const { style, className, layoutId, variant, UxUlZSy6z, MW82Yr8hk, ...restProps } = getProps9(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState4({ cycleOrder: cycleOrder3, defaultVariant: "NjbypYOoz", ref: refBinding, variant, variantClassNames: variantClassNames4 });
  const layoutDependency = createLayoutDependency4(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback4(baseVariant);
  const onMouseLeave1qlyf7s = activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: false });
    if (UxUlZSy6z) {
      const res = await UxUlZSy6z(...args);
      if (res === false)
        return false;
    }
  });
  const onTapy9l5yd = activeVariantCallback(async (...args) => {
    setVariant("pCp9gT1DB");
  });
  const onTap9dhy63 = activeVariantCallback(async (...args) => {
    setVariant("VG3wIEouY");
  });
  const WcYx6PpLU59dgnd = activeVariantCallback(async (...args) => {
    if (MW82Yr8hk) {
      const res = await MW82Yr8hk(...args);
      if (res === false)
        return false;
    }
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx9(serializationHash4, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (["VG3wIEouY", "pCp9gT1DB"].includes(baseVariant))
      return true;
    return false;
  };
  return /* @__PURE__ */ _jsx15(LayoutGroup4, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx15(Variants4, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx15(Transition4, { value: transition14, children: /* @__PURE__ */ _jsxs9(motion15.div, { ...restProps, ...gestureHandlers, className: cx9(scopingClassNames, "framer-lt5tjt", className, classNames), "data-framer-name": "Desktop & Tablet", "data-highlight": true, layoutDependency, layoutId: "e1vFUka05__NjbypYOoz", onMouseLeave: onMouseLeave1qlyf7s, ref: refBinding, style: { ...style }, ...addPropertyOverrides4({ pCp9gT1DB: { "data-framer-name": "Phone Closed", "data-highlight": void 0, onMouseLeave: void 0 }, VG3wIEouY: { "data-framer-name": "Phone Open", "data-highlight": void 0, onMouseLeave: void 0 } }, baseVariant, gestureVariant), children: [isDisplayed() && /* @__PURE__ */ _jsxs9(motion15.div, { className: "framer-n6xnlq", "data-framer-name": "Mobile Title", layoutDependency, layoutId: "e1vFUka05__XUzc4RwsW", style: { backgroundColor: "rgb(255, 255, 255)" }, ...addPropertyOverrides4({ pCp9gT1DB: { "data-highlight": true, onTap: onTap9dhy63 }, VG3wIEouY: { "data-highlight": true, onTap: onTapy9l5yd } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx15(RichText4, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx15(React13.Fragment, { children: /* @__PURE__ */ _jsx15(motion15.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-size": "18px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Sale" }) }), className: "framer-8bvam0", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__Rhz6Sbrpk", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx15(motion15.div, { className: "framer-15dozy1", "data-framer-name": "Icon", layoutDependency, layoutId: "e1vFUka05__OS4mel_G4", children: /* @__PURE__ */ _jsx15(lDWUVpnhJ_default, { animated: true, className: "framer-b01bwj", layoutDependency, layoutId: "e1vFUka05__FjVv78k8n", style: { "--1m6trwb": 0, "--21h8s6": "rgb(0, 0, 0)", "--pgex8v": 2, rotate: 0 }, variants: { pCp9gT1DB: { rotate: -180 } } }) })] }), /* @__PURE__ */ _jsxs9(motion15.div, { className: "framer-tljmgh", "data-framer-name": "Menu", layoutDependency, layoutId: "e1vFUka05__pNKOe9JBh", children: [/* @__PURE__ */ _jsxs9(motion15.div, { className: "framer-16qqqof", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__KwEFwN9kt", children: [/* @__PURE__ */ _jsx15(motion15.div, { className: "framer-1ovtu3q", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__uREjV3RUd", children: /* @__PURE__ */ _jsx15(RichText4, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx15(React13.Fragment, { children: /* @__PURE__ */ _jsx15(motion15.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Shop by Gender" }) }), className: "framer-1o72626", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__KzZEw37fA", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs9(motion15.div, { className: "framer-10tv6oi", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__tBjOa87tC", children: [/* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 0 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-1kwoldk-container", layoutDependency, layoutId: "e1vFUka05__NmTvAHulc-container", nodeId: "NmTvAHulc", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "NmTvAHulc", layoutId: "e1vFUka05__NmTvAHulc", SbnDmc0Ms: "All Outlet", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 0 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-xzvwrk-container", layoutDependency, layoutId: "e1vFUka05__GbHfZ129y-container", nodeId: "GbHfZ129y", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "GbHfZ129y", layoutId: "e1vFUka05__GbHfZ129y", SbnDmc0Ms: "Men's Outlet", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 29 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-1auj1d1-container", layoutDependency, layoutId: "e1vFUka05__xs7QFf42_-container", nodeId: "xs7QFf42_", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "xs7QFf42_", layoutId: "e1vFUka05__xs7QFf42_", SbnDmc0Ms: "Women's Outlet", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 29 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-yd75ym-container", layoutDependency, layoutId: "e1vFUka05__S2pTWBRBx-container", nodeId: "S2pTWBRBx", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "S2pTWBRBx", layoutId: "e1vFUka05__S2pTWBRBx", SbnDmc0Ms: "Kids' Outlet", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs9(motion15.div, { className: "framer-wptpgd", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__BJ6P2_Rir", children: [/* @__PURE__ */ _jsx15(motion15.div, { className: "framer-1xcydwg", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__Y9f1BusFK", children: /* @__PURE__ */ _jsx15(RichText4, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx15(React13.Fragment, { children: /* @__PURE__ */ _jsx15(motion15.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Shop by Category" }) }), className: "framer-1ohinn9", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__Lgaysoany", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs9(motion15.div, { className: "framer-o6iqva", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__FBQQWbLq3", children: [/* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 101.2 + 0 + 27.2 + 0 + 0 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 101.2 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-1liulb4-container", layoutDependency, layoutId: "e1vFUka05__yz_1xsELP-container", nodeId: "yz_1xsELP", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "yz_1xsELP", layoutId: "e1vFUka05__yz_1xsELP", SbnDmc0Ms: "All Footwear on Sale", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 101.2 + 0 + 27.2 + 0 + 0 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 101.2 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-agffny-container", layoutDependency, layoutId: "e1vFUka05__KpamUyuW5-container", nodeId: "KpamUyuW5", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "KpamUyuW5", layoutId: "e1vFUka05__KpamUyuW5", SbnDmc0Ms: "All Apparel on Sale", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 101.2 + 0 + 27.2 + 0 + 29 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 101.2 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-1r6dgx6-container", layoutDependency, layoutId: "e1vFUka05__EIHh_HowK-container", nodeId: "EIHh_HowK", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "EIHh_HowK", layoutId: "e1vFUka05__EIHh_HowK", SbnDmc0Ms: "Bags & Packs", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 101.2 + 0 + 27.2 + 0 + 29 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 101.2 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-o5zx7g-container", layoutDependency, layoutId: "e1vFUka05__xtI34_3el-container", nodeId: "xtI34_3el", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "xtI34_3el", layoutId: "e1vFUka05__xtI34_3el", SbnDmc0Ms: "Socks & Accessories", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs9(motion15.div, { className: "framer-lkhsz3", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__Yg1x4rFhR", children: [/* @__PURE__ */ _jsx15(motion15.div, { className: "framer-ej0bps", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__EWotfhCCJ", children: /* @__PURE__ */ _jsx15(RichText4, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx15(React13.Fragment, { children: /* @__PURE__ */ _jsx15(motion15.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Best Deals" }) }), className: "framer-1cx2zdp", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__n2SvTUJp5", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs9(motion15.div, { className: "framer-s0po1a", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__iEa0TIaFc", children: [/* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 202.4 + 0 + 27.2 + 0 + 0 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 202.4 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-zoxiu3-container", layoutDependency, layoutId: "e1vFUka05__EmW1w2SIr-container", nodeId: "EmW1w2SIr", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "EmW1w2SIr", layoutId: "e1vFUka05__EmW1w2SIr", SbnDmc0Ms: "Up to 30% Off", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 202.4 + 0 + 27.2 + 0 + 0 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 202.4 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-vx0mt2-container", layoutDependency, layoutId: "e1vFUka05__rTnuh0eda-container", nodeId: "rTnuh0eda", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "rTnuh0eda", layoutId: "e1vFUka05__rTnuh0eda", SbnDmc0Ms: "Up to 50% Off", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 202.4 + 0 + 27.2 + 0 + 29 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 202.4 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-l5r6fj-container", layoutDependency, layoutId: "e1vFUka05__cA6J_llsZ-container", nodeId: "cA6J_llsZ", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "cA6J_llsZ", layoutId: "e1vFUka05__cA6J_llsZ", SbnDmc0Ms: "Clearance", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 202.4 + 0 + 27.2 + 0 + 29 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 202.4 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-uuzvkm-container", layoutDependency, layoutId: "e1vFUka05__wLBj0_lsh-container", nodeId: "wLBj0_lsh", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "wLBj0_lsh", layoutId: "e1vFUka05__wLBj0_lsh", SbnDmc0Ms: "Last Sizes", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 140, ...addPropertyOverrides4({ pCp9gT1DB: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 202.4 + 0 + 27.2 + 0 + 58 }, VG3wIEouY: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 202.4 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-uyp9dv-container", layoutDependency, layoutId: "e1vFUka05__lXrNDzcxq-container", nodeId: "lXrNDzcxq", rendersWithMotion: true, scopeId: "oRNeXEz8O", children: /* @__PURE__ */ _jsx15(xvHKkw4Lv_default, { height: "100%", id: "lXrNDzcxq", layoutId: "e1vFUka05__lXrNDzcxq", SbnDmc0Ms: "Bundle & Save", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] })] })] }) }) }) });
});
var css9 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-w4d02.framer-oiwqhp, .framer-w4d02 .framer-oiwqhp { display: block; }", ".framer-w4d02.framer-lt5tjt { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; max-width: 1200px; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-w4d02 .framer-n6xnlq { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; overflow: var(--overflow-clip-fallback, clip); padding: 16px; position: relative; width: 100%; }", ".framer-w4d02 .framer-8bvam0, .framer-w4d02 .framer-1o72626, .framer-w4d02 .framer-1ohinn9, .framer-w4d02 .framer-1cx2zdp { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-w4d02 .framer-15dozy1 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: min-content; }", ".framer-w4d02 .framer-b01bwj { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 20px); position: relative; width: 20px; }", ".framer-w4d02 .framer-tljmgh { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 16px; height: min-content; justify-content: center; overflow: visible; padding: 24px 16px 24px 16px; position: relative; width: 100%; }", ".framer-w4d02 .framer-16qqqof, .framer-w4d02 .framer-wptpgd, .framer-w4d02 .framer-lkhsz3 { align-content: flex-start; align-items: flex-start; display: flex; flex: 1 0 0px; flex-direction: column; flex-wrap: nowrap; gap: 20px; height: min-content; justify-content: center; max-width: 230px; overflow: visible; padding: 0px; position: relative; width: 1px; }", ".framer-w4d02 .framer-1ovtu3q, .framer-w4d02 .framer-1xcydwg, .framer-w4d02 .framer-ej0bps { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-w4d02 .framer-10tv6oi, .framer-w4d02 .framer-o6iqva, .framer-w4d02 .framer-s0po1a { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 6px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-w4d02 .framer-1kwoldk-container, .framer-w4d02 .framer-xzvwrk-container, .framer-w4d02 .framer-1auj1d1-container, .framer-w4d02 .framer-yd75ym-container, .framer-w4d02 .framer-1liulb4-container, .framer-w4d02 .framer-agffny-container, .framer-w4d02 .framer-1r6dgx6-container, .framer-w4d02 .framer-o5zx7g-container, .framer-w4d02 .framer-zoxiu3-container, .framer-w4d02 .framer-vx0mt2-container, .framer-w4d02 .framer-l5r6fj-container, .framer-w4d02 .framer-uuzvkm-container, .framer-w4d02 .framer-uyp9dv-container { flex: none; height: auto; position: relative; width: auto; }", ".framer-w4d02.framer-v-ebdta0.framer-lt5tjt { width: 100%; }", ".framer-w4d02.framer-v-ebdta0 .framer-n6xnlq, .framer-w4d02.framer-v-capvdh .framer-n6xnlq { cursor: pointer; }", ".framer-w4d02.framer-v-ebdta0 .framer-tljmgh, .framer-w4d02.framer-v-capvdh .framer-tljmgh { flex-direction: column; padding: 8px 16px 8px 16px; }", ".framer-w4d02.framer-v-ebdta0 .framer-16qqqof, .framer-w4d02.framer-v-ebdta0 .framer-wptpgd, .framer-w4d02.framer-v-ebdta0 .framer-lkhsz3, .framer-w4d02.framer-v-capvdh .framer-16qqqof, .framer-w4d02.framer-v-capvdh .framer-wptpgd, .framer-w4d02.framer-v-capvdh .framer-lkhsz3 { flex: none; gap: 8px; max-width: unset; width: 100%; }", ".framer-w4d02.framer-v-ebdta0 .framer-10tv6oi, .framer-w4d02.framer-v-ebdta0 .framer-o6iqva, .framer-w4d02.framer-v-ebdta0 .framer-s0po1a, .framer-w4d02.framer-v-capvdh .framer-10tv6oi, .framer-w4d02.framer-v-capvdh .framer-o6iqva, .framer-w4d02.framer-v-capvdh .framer-s0po1a { align-content: unset; align-items: unset; display: grid; gap: 0px; grid-auto-rows: minmax(0, 1fr); grid-template-columns: repeat(2, minmax(50px, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); }", ".framer-w4d02.framer-v-ebdta0 .framer-1kwoldk-container, .framer-w4d02.framer-v-ebdta0 .framer-xzvwrk-container, .framer-w4d02.framer-v-ebdta0 .framer-1auj1d1-container, .framer-w4d02.framer-v-ebdta0 .framer-yd75ym-container, .framer-w4d02.framer-v-ebdta0 .framer-1liulb4-container, .framer-w4d02.framer-v-ebdta0 .framer-agffny-container, .framer-w4d02.framer-v-ebdta0 .framer-1r6dgx6-container, .framer-w4d02.framer-v-ebdta0 .framer-o5zx7g-container, .framer-w4d02.framer-v-ebdta0 .framer-zoxiu3-container, .framer-w4d02.framer-v-ebdta0 .framer-vx0mt2-container, .framer-w4d02.framer-v-ebdta0 .framer-l5r6fj-container, .framer-w4d02.framer-v-ebdta0 .framer-uuzvkm-container, .framer-w4d02.framer-v-ebdta0 .framer-uyp9dv-container, .framer-w4d02.framer-v-capvdh .framer-1kwoldk-container, .framer-w4d02.framer-v-capvdh .framer-xzvwrk-container, .framer-w4d02.framer-v-capvdh .framer-1auj1d1-container, .framer-w4d02.framer-v-capvdh .framer-yd75ym-container, .framer-w4d02.framer-v-capvdh .framer-1liulb4-container, .framer-w4d02.framer-v-capvdh .framer-agffny-container, .framer-w4d02.framer-v-capvdh .framer-1r6dgx6-container, .framer-w4d02.framer-v-capvdh .framer-o5zx7g-container, .framer-w4d02.framer-v-capvdh .framer-zoxiu3-container, .framer-w4d02.framer-v-capvdh .framer-vx0mt2-container, .framer-w4d02.framer-v-capvdh .framer-l5r6fj-container, .framer-w4d02.framer-v-capvdh .framer-uuzvkm-container, .framer-w4d02.framer-v-capvdh .framer-uyp9dv-container { align-self: start; justify-self: start; width: 100%; }", ".framer-w4d02.framer-v-capvdh.framer-lt5tjt { height: auto; overflow: hidden; width: 100%; }"];
var FrameroRNeXEz8O = withCSS10(Component9, css9, "framer-w4d02");
var oRNeXEz8O_default = FrameroRNeXEz8O;
FrameroRNeXEz8O.displayName = "Sale Menu";
FrameroRNeXEz8O.defaultProps = { height: 255, width: 1200 };
addPropertyControls10(FrameroRNeXEz8O, { variant: { options: ["NjbypYOoz", "VG3wIEouY", "pCp9gT1DB"], optionTitles: ["Desktop & Tablet", "Phone Open", "Phone Closed"], title: "Variant", type: ControlType10.Enum }, UxUlZSy6z: { title: "Close Dropdown", type: ControlType10.EventHandler }, MW82Yr8hk: { title: "Close Nav", type: ControlType10.EventHandler } });
addFonts4(FrameroRNeXEz8O, [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RruM4mJPby1QNtA.woff2", weight: "500" }] }, ...CaretUpFonts3, ...MenuLinkFonts3], { supportsExplicitInterCodegen: true });
FrameroRNeXEz8O.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader3(xvHKkw4Lv_default, {}, context)]);
} };

// http-url:https://framerusercontent.com/modules/Z1bTfeElAcSoyE8OVRED/ZmJWBNiG8yelOs0T7LIG/Wq_yc4GsM.js
import { jsx as _jsx16 } from "react/jsx-runtime";
import { addFonts as addFonts5, addPropertyControls as addPropertyControls11, ControlType as ControlType11, cx as cx10, Instance, Link as Link2, useActiveVariantCallback as useActiveVariantCallback5, useComponentViewport as useComponentViewport5, useLocaleInfo as useLocaleInfo13, useVariantState as useVariantState5, withCSS as withCSS11 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup5, motion as motion16, MotionConfigContext as MotionConfigContext5 } from "framer-motion";
import * as React14 from "react";
import { useRef as useRef11 } from "react";
var enabledGestures2 = { eu1vRnzql: { hover: true } };
var serializationHash5 = "framer-33sqd";
var variantClassNames5 = { eu1vRnzql: "framer-v-1avrn1c" };
function addPropertyOverrides5(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition15 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition5 = ({ value, children }) => {
  const config = React14.useContext(MotionConfigContext5);
  const transition = value ?? config.transition;
  const contextValue = React14.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx16(MotionConfigContext5.Provider, { value: contextValue, children });
};
var Variants5 = motion16.create(React14.Fragment);
var getProps10 = ({ click, height, icon, id, link, newTab, width, ...props }) => {
  return { ...props, C0dmAOVj8: icon ?? props.C0dmAOVj8 ?? itu1soPCZ_default, d04aE9y9N: link ?? props.d04aE9y9N, jmwkLyRss: click ?? props.jmwkLyRss, qXdMjaA7O: newTab ?? props.qXdMjaA7O };
};
var createLayoutDependency5 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component10 = /* @__PURE__ */ React14.forwardRef(function(props, ref) {
  const fallbackRef = useRef11(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React14.useId();
  const { activeLocale, setLocale } = useLocaleInfo13();
  const componentViewport = useComponentViewport5();
  const { style, className, layoutId, variant, C0dmAOVj8, d04aE9y9N, qXdMjaA7O, jmwkLyRss, ...restProps } = getProps10(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState5({ defaultVariant: "eu1vRnzql", enabledGestures: enabledGestures2, ref: refBinding, variant, variantClassNames: variantClassNames5 });
  const layoutDependency = createLayoutDependency5(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback5(baseVariant);
  const onTap1wt8l97 = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    if (jmwkLyRss) {
      const res = await jmwkLyRss(...args);
      if (res === false)
        return false;
    }
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx10(serializationHash5, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx16(LayoutGroup5, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx16(Variants5, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx16(Transition5, { value: transition15, children: /* @__PURE__ */ _jsx16(Link2, { href: d04aE9y9N, motionChild: true, nodeId: "eu1vRnzql", openInNewTab: qXdMjaA7O, scopeId: "Wq_yc4GsM", children: /* @__PURE__ */ _jsx16(motion16.a, { ...restProps, ...gestureHandlers, className: `${cx10(scopingClassNames, "framer-1avrn1c", className, classNames)} framer-1d9txtc`, "data-framer-name": "Default", "data-highlight": true, layoutDependency, layoutId: "e1vFUka05__eu1vRnzql", onTap: onTap1wt8l97, ref: refBinding, style: { opacity: 1, ...style }, variants: { "eu1vRnzql-hover": { opacity: 0.5 } }, ...addPropertyOverrides5({ "eu1vRnzql-hover": { "data-framer-name": void 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx16(Instance, { animated: true, className: "framer-3v6yhl", Component: C0dmAOVj8, layoutDependency, layoutId: "e1vFUka05__WBGx4bvAe", style: { "--1m6trwb": 0, "--21h8s6": "rgb(18, 18, 18)", "--pgex8v": 2 } }) }) }) }) }) });
});
var css10 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-33sqd.framer-1d9txtc, .framer-33sqd .framer-1d9txtc { display: block; }", ".framer-33sqd.framer-1avrn1c { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 6px; position: relative; text-decoration: none; width: min-content; }", ".framer-33sqd .framer-3v6yhl { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 20px); position: relative; width: 20px; }"];
var FramerWq_yc4GsM = withCSS11(Component10, css10, "framer-33sqd");
var Wq_yc4GsM_default = FramerWq_yc4GsM;
FramerWq_yc4GsM.displayName = "Icon";
FramerWq_yc4GsM.defaultProps = { height: 32, width: 32 };
addPropertyControls11(FramerWq_yc4GsM, { C0dmAOVj8: { defaultValue: { identifier: "module:4xJsJPc59it6XmHEERsh/koUifyDPwJ9ohyYl3uMd/itu1soPCZ.js:default", moduleId: "4xJsJPc59it6XmHEERsh" }, setModuleId: "omX0gWFPqDwhaiWwf6ab", title: "Icon", type: ControlType11.VectorSetItem }, d04aE9y9N: { title: "Link", type: ControlType11.Link }, qXdMjaA7O: { defaultValue: false, title: "New Tab", type: ControlType11.Boolean }, onqXdMjaA7OChange: { changes: "qXdMjaA7O", type: ControlType11.ChangeHandler }, jmwkLyRss: { title: "Click", type: ControlType11.EventHandler } });
addFonts5(FramerWq_yc4GsM, [{ explicitInter: true, fonts: [] }], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/2cNUG2xpmiJvJHbR4vzm/D0A2hskbCAu7gHNJuFpp/xfttPphNl.js
import { jsx as _jsx17, jsxs as _jsxs10 } from "react/jsx-runtime";
import { addFonts as addFonts6, addPropertyControls as addPropertyControls12, ComponentViewportProvider as ComponentViewportProvider4, ControlType as ControlType12, cx as cx11, forwardLoader as forwardLoader4, getFonts as getFonts4, RichText as RichText5, SmartComponentScopedContainer as SmartComponentScopedContainer4, useActiveVariantCallback as useActiveVariantCallback6, useComponentViewport as useComponentViewport6, useLocaleInfo as useLocaleInfo14, useVariantState as useVariantState6, withCSS as withCSS12 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup6, motion as motion17, MotionConfigContext as MotionConfigContext6 } from "framer-motion";
import * as React15 from "react";
import { useRef as useRef12 } from "react";
var CaretUpFonts4 = getFonts4(lDWUVpnhJ_default);
var MenuLinkFonts4 = getFonts4(xvHKkw4Lv_default);
var cycleOrder4 = ["P0CC2cO6u", "SbCN65WUp", "HP7XaJ4f7"];
var serializationHash6 = "framer-U7hXO";
var variantClassNames6 = { HP7XaJ4f7: "framer-v-1c26sgo", P0CC2cO6u: "framer-v-4ho47t", SbCN65WUp: "framer-v-oej7w" };
function addPropertyOverrides6(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition16 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition6 = ({ value, children }) => {
  const config = React15.useContext(MotionConfigContext6);
  const transition = value ?? config.transition;
  const contextValue = React15.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx17(MotionConfigContext6.Provider, { value: contextValue, children });
};
var humanReadableVariantMap4 = { "Desktop & Tablet": "P0CC2cO6u", "Phone Closed": "HP7XaJ4f7", "Phone Open": "SbCN65WUp" };
var Variants6 = motion17.create(React15.Fragment);
var getProps11 = ({ closeDropdown, closeNav, height, id, width, ...props }) => {
  return { ...props, MW82Yr8hk: closeNav ?? props.MW82Yr8hk, UxUlZSy6z: closeDropdown ?? props.UxUlZSy6z, variant: humanReadableVariantMap4[props.variant] ?? props.variant ?? "P0CC2cO6u" };
};
var createLayoutDependency6 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component11 = /* @__PURE__ */ React15.forwardRef(function(props, ref) {
  const fallbackRef = useRef12(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React15.useId();
  const { activeLocale, setLocale } = useLocaleInfo14();
  const componentViewport = useComponentViewport6();
  const { style, className, layoutId, variant, UxUlZSy6z, MW82Yr8hk, ...restProps } = getProps11(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState6({ cycleOrder: cycleOrder4, defaultVariant: "P0CC2cO6u", ref: refBinding, variant, variantClassNames: variantClassNames6 });
  const layoutDependency = createLayoutDependency6(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback6(baseVariant);
  const onMouseLeave1qlyf7s = activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: false });
    if (UxUlZSy6z) {
      const res = await UxUlZSy6z(...args);
      if (res === false)
        return false;
    }
  });
  const onTapjykbbt = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    setVariant("SbCN65WUp");
  });
  const onTapyvndee = activeVariantCallback(async (...args) => {
    setVariant("HP7XaJ4f7");
  });
  const WcYx6PpLU59dgnd = activeVariantCallback(async (...args) => {
    if (MW82Yr8hk) {
      const res = await MW82Yr8hk(...args);
      if (res === false)
        return false;
    }
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx11(serializationHash6, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (["SbCN65WUp", "HP7XaJ4f7"].includes(baseVariant))
      return true;
    return false;
  };
  return /* @__PURE__ */ _jsx17(LayoutGroup6, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx17(Variants6, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx17(Transition6, { value: transition16, children: /* @__PURE__ */ _jsxs10(motion17.div, { ...restProps, ...gestureHandlers, className: cx11(scopingClassNames, "framer-4ho47t", className, classNames), "data-framer-name": "Desktop & Tablet", "data-highlight": true, layoutDependency, layoutId: "e1vFUka05__P0CC2cO6u", onMouseLeave: onMouseLeave1qlyf7s, ref: refBinding, style: { ...style }, ...addPropertyOverrides6({ HP7XaJ4f7: { "data-framer-name": "Phone Closed", onMouseLeave: void 0, onTap: onTapjykbbt }, SbCN65WUp: { "data-framer-name": "Phone Open", "data-highlight": void 0, onMouseLeave: void 0 } }, baseVariant, gestureVariant), children: [isDisplayed() && /* @__PURE__ */ _jsxs10(motion17.div, { className: "framer-49jmbu", "data-framer-name": "Mobile Title", layoutDependency, layoutId: "e1vFUka05__EoTRAEAXo", style: { backgroundColor: "rgb(255, 255, 255)" }, ...addPropertyOverrides6({ SbCN65WUp: { "data-highlight": true, onTap: onTapyvndee } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx17(RichText5, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx17(React15.Fragment, { children: /* @__PURE__ */ _jsx17(motion17.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-size": "18px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "New" }) }), className: "framer-1f3zghw", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__odl_IRjge", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx17(motion17.div, { className: "framer-1e9b3d8", "data-framer-name": "Icon", layoutDependency, layoutId: "e1vFUka05__JMootn1cL", children: /* @__PURE__ */ _jsx17(lDWUVpnhJ_default, { animated: true, className: "framer-1tvhw6m", layoutDependency, layoutId: "e1vFUka05__X5yZlCq97", style: { "--1m6trwb": 0, "--21h8s6": "rgb(0, 0, 0)", "--pgex8v": 2, rotate: 0 }, variants: { HP7XaJ4f7: { rotate: -180 } } }) })] }), /* @__PURE__ */ _jsxs10(motion17.div, { className: "framer-qia5es", "data-framer-name": "Menu", layoutDependency, layoutId: "e1vFUka05__ZaTfWu7jJ", children: [/* @__PURE__ */ _jsxs10(motion17.div, { className: "framer-kjxmbu", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__BCCGuBEVN", children: [/* @__PURE__ */ _jsx17(motion17.div, { className: "framer-p23ebo", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__w_N6BFe_R", children: /* @__PURE__ */ _jsx17(RichText5, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx17(React15.Fragment, { children: /* @__PURE__ */ _jsx17(motion17.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Highlights" }) }), className: "framer-1dd71jj", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__x2KqNnFVG", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs10(motion17.div, { className: "framer-11hb07v", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__fy4wQn88H", children: [/* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 0 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-3pkgni-container", layoutDependency, layoutId: "e1vFUka05__MCTL9YRxE-container", nodeId: "MCTL9YRxE", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "MCTL9YRxE", layoutId: "e1vFUka05__MCTL9YRxE", SbnDmc0Ms: "Just Dropped", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 0 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-1nfc4am-container", layoutDependency, layoutId: "e1vFUka05__DtIxCmHGW-container", nodeId: "DtIxCmHGW", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "DtIxCmHGW", layoutId: "e1vFUka05__DtIxCmHGW", SbnDmc0Ms: "Top Picks", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 29 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-dsm605-container", layoutDependency, layoutId: "e1vFUka05__kvILyDqjI-container", nodeId: "kvILyDqjI", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "kvILyDqjI", layoutId: "e1vFUka05__kvILyDqjI", SbnDmc0Ms: "Members Only", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 29 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 0 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-1d0t16v-container", layoutDependency, layoutId: "e1vFUka05__o2OXSVfUu-container", nodeId: "o2OXSVfUu", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "o2OXSVfUu", layoutId: "e1vFUka05__o2OXSVfUu", SbnDmc0Ms: "Made to Last", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs10(motion17.div, { className: "framer-128318f", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__w0HzcU5I2", children: [/* @__PURE__ */ _jsx17(motion17.div, { className: "framer-edfyko", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__beTeVec28", children: /* @__PURE__ */ _jsx17(RichText5, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx17(React15.Fragment, { children: /* @__PURE__ */ _jsx17(motion17.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Footwear" }) }), className: "framer-5sk4b8", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__C2r7QLBzs", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs10(motion17.div, { className: "framer-k16u0l", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__f5wg6t_3K", children: [/* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 0 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-119dklo-container", layoutDependency, layoutId: "e1vFUka05__GkNauITgW-container", nodeId: "GkNauITgW", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "GkNauITgW", layoutId: "e1vFUka05__GkNauITgW", SbnDmc0Ms: "All New Footwear", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 0 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-tysdld-container", layoutDependency, layoutId: "e1vFUka05__ymbwxYYMb-container", nodeId: "ymbwxYYMb", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "ymbwxYYMb", layoutId: "e1vFUka05__ymbwxYYMb", SbnDmc0Ms: "Everyday Style", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 29 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-65pini-container", layoutDependency, layoutId: "e1vFUka05__MiGhZjTnn-container", nodeId: "MiGhZjTnn", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "MiGhZjTnn", layoutId: "e1vFUka05__MiGhZjTnn", SbnDmc0Ms: "Running", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 29 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-1edmequ-container", layoutDependency, layoutId: "e1vFUka05__hQaUQX5MK-container", nodeId: "hQaUQX5MK", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "hQaUQX5MK", layoutId: "e1vFUka05__hQaUQX5MK", SbnDmc0Ms: "Basketball", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 140, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 58 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-11q2o8r-container", layoutDependency, layoutId: "e1vFUka05__fz1kBsbTG-container", nodeId: "fz1kBsbTG", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "fz1kBsbTG", layoutId: "e1vFUka05__fz1kBsbTG", SbnDmc0Ms: "Training", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 175, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 58 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-1wrqavz-container", layoutDependency, layoutId: "e1vFUka05__kiqqPDHUd-container", nodeId: "kiqqPDHUd", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "kiqqPDHUd", layoutId: "e1vFUka05__kiqqPDHUd", SbnDmc0Ms: "Outdoor & Trail", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 210, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 87 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 101.2 + 0 + 27.2 + 0 + 87 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-17najnm-container", layoutDependency, layoutId: "e1vFUka05__kIshbHwnn-container", nodeId: "kIshbHwnn", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "kIshbHwnn", layoutId: "e1vFUka05__kIshbHwnn", SbnDmc0Ms: "Sandals", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs10(motion17.div, { className: "framer-n7y75d", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__Kc6XtELpo", children: [/* @__PURE__ */ _jsx17(motion17.div, { className: "framer-1lw05ny", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__xISLfL0Gv", children: /* @__PURE__ */ _jsx17(RichText5, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx17(React15.Fragment, { children: /* @__PURE__ */ _jsx17(motion17.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Apparel" }) }), className: "framer-ouu5bp", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__aqFEJDlSM", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs10(motion17.div, { className: "framer-qii1u0", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__TGVwmB8w7", children: [/* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 260.4 + 0 + 27.2 + 0 + 0 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 260.4 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-1406lny-container", layoutDependency, layoutId: "e1vFUka05__W5APdeQcf-container", nodeId: "W5APdeQcf", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "W5APdeQcf", layoutId: "e1vFUka05__W5APdeQcf", SbnDmc0Ms: "All New Apparel", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 260.4 + 0 + 27.2 + 0 + 0 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 260.4 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-17fpter-container", layoutDependency, layoutId: "e1vFUka05__lEUJG1R_W-container", nodeId: "lEUJG1R_W", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "lEUJG1R_W", layoutId: "e1vFUka05__lEUJG1R_W", SbnDmc0Ms: "Tops & Tees", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 260.4 + 0 + 27.2 + 0 + 29 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 260.4 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-fylpx9-container", layoutDependency, layoutId: "e1vFUka05__c11LZ4Hm2-container", nodeId: "c11LZ4Hm2", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "c11LZ4Hm2", layoutId: "e1vFUka05__c11LZ4Hm2", SbnDmc0Ms: "Hoodies & Fleece", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 260.4 + 0 + 27.2 + 0 + 29 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 260.4 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-1470tcx-container", layoutDependency, layoutId: "e1vFUka05__BIkIX7vdp-container", nodeId: "BIkIX7vdp", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "BIkIX7vdp", layoutId: "e1vFUka05__BIkIX7vdp", SbnDmc0Ms: "Shorts", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 140, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 260.4 + 0 + 27.2 + 0 + 58 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 260.4 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-omtihe-container", layoutDependency, layoutId: "e1vFUka05__OekVggCvk-container", nodeId: "OekVggCvk", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "OekVggCvk", layoutId: "e1vFUka05__OekVggCvk", SbnDmc0Ms: "Pants & Leggings", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 175, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 260.4 + 0 + 27.2 + 0 + 58 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 260.4 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-ho06kr-container", layoutDependency, layoutId: "e1vFUka05__dPRcvfIaD-container", nodeId: "dPRcvfIaD", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "dPRcvfIaD", layoutId: "e1vFUka05__dPRcvfIaD", SbnDmc0Ms: "Jackets & Outerwear", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs10(motion17.div, { className: "framer-11ot63s", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__yacXbFqMK", children: [/* @__PURE__ */ _jsx17(motion17.div, { className: "framer-10090xi", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__D4lyUglNP", children: /* @__PURE__ */ _jsx17(RichText5, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx17(React15.Fragment, { children: /* @__PURE__ */ _jsx17(motion17.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Gear" }) }), className: "framer-lj70ux", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__NbL6yddVU", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs10(motion17.div, { className: "framer-19hoxbl", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__MVMAfQPQi", children: [/* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 390.6 + 0 + 27.2 + 0 + 0 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 390.6 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-1w3j4ap-container", layoutDependency, layoutId: "e1vFUka05__PQgfWJEvH-container", nodeId: "PQgfWJEvH", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "PQgfWJEvH", layoutId: "e1vFUka05__PQgfWJEvH", SbnDmc0Ms: "All New Gear", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 390.6 + 0 + 27.2 + 0 + 0 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 390.6 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-kknxhg-container", layoutDependency, layoutId: "e1vFUka05__bFVVTQsIj-container", nodeId: "bFVVTQsIj", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "bFVVTQsIj", layoutId: "e1vFUka05__bFVVTQsIj", SbnDmc0Ms: "Bags & Packs", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 390.6 + 0 + 27.2 + 0 + 29 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 390.6 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-brumrs-container", layoutDependency, layoutId: "e1vFUka05__oA_66Mlq8-container", nodeId: "oA_66Mlq8", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "oA_66Mlq8", layoutId: "e1vFUka05__oA_66Mlq8", SbnDmc0Ms: "Socks", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 390.6 + 0 + 27.2 + 0 + 29 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 390.6 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-151mync-container", layoutDependency, layoutId: "e1vFUka05__pWbcFnDEi-container", nodeId: "pWbcFnDEi", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "pWbcFnDEi", layoutId: "e1vFUka05__pWbcFnDEi", SbnDmc0Ms: "Caps & Headwear", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx17(ComponentViewportProvider4, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 140, ...addPropertyOverrides6({ HP7XaJ4f7: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 390.6 + 0 + 27.2 + 0 + 58 }, SbCN65WUp: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 56 + 8 + 390.6 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx17(SmartComponentScopedContainer4, { className: "framer-1h4v32e-container", layoutDependency, layoutId: "e1vFUka05__g2ZptrUEA-container", nodeId: "g2ZptrUEA", rendersWithMotion: true, scopeId: "xfttPphNl", children: /* @__PURE__ */ _jsx17(xvHKkw4Lv_default, { height: "100%", id: "g2ZptrUEA", layoutId: "e1vFUka05__g2ZptrUEA", SbnDmc0Ms: "Accessories", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] })] })] }) }) }) });
});
var css11 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-U7hXO.framer-15iy642, .framer-U7hXO .framer-15iy642 { display: block; }", ".framer-U7hXO.framer-4ho47t { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; max-width: 1200px; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-U7hXO .framer-49jmbu { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; overflow: var(--overflow-clip-fallback, clip); padding: 16px; position: relative; width: 100%; }", ".framer-U7hXO .framer-1f3zghw, .framer-U7hXO .framer-1dd71jj, .framer-U7hXO .framer-5sk4b8, .framer-U7hXO .framer-ouu5bp, .framer-U7hXO .framer-lj70ux { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-U7hXO .framer-1e9b3d8 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 2px; position: relative; width: min-content; }", ".framer-U7hXO .framer-1tvhw6m { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 20px); position: relative; width: 20px; }", ".framer-U7hXO .framer-qia5es { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 16px; height: min-content; justify-content: center; overflow: visible; padding: 24px 16px 24px 16px; position: relative; width: 100%; }", ".framer-U7hXO .framer-kjxmbu, .framer-U7hXO .framer-128318f, .framer-U7hXO .framer-n7y75d, .framer-U7hXO .framer-11ot63s { align-content: flex-start; align-items: flex-start; display: flex; flex: 1 0 0px; flex-direction: column; flex-wrap: nowrap; gap: 20px; height: min-content; justify-content: center; max-width: 230px; overflow: visible; padding: 0px; position: relative; width: 1px; }", ".framer-U7hXO .framer-p23ebo, .framer-U7hXO .framer-edfyko, .framer-U7hXO .framer-1lw05ny, .framer-U7hXO .framer-10090xi { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-U7hXO .framer-11hb07v, .framer-U7hXO .framer-k16u0l, .framer-U7hXO .framer-qii1u0, .framer-U7hXO .framer-19hoxbl { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 6px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-U7hXO .framer-3pkgni-container, .framer-U7hXO .framer-1nfc4am-container, .framer-U7hXO .framer-dsm605-container, .framer-U7hXO .framer-1d0t16v-container, .framer-U7hXO .framer-119dklo-container, .framer-U7hXO .framer-tysdld-container, .framer-U7hXO .framer-65pini-container, .framer-U7hXO .framer-1edmequ-container, .framer-U7hXO .framer-11q2o8r-container, .framer-U7hXO .framer-1wrqavz-container, .framer-U7hXO .framer-17najnm-container, .framer-U7hXO .framer-1406lny-container, .framer-U7hXO .framer-17fpter-container, .framer-U7hXO .framer-fylpx9-container, .framer-U7hXO .framer-1470tcx-container, .framer-U7hXO .framer-omtihe-container, .framer-U7hXO .framer-ho06kr-container, .framer-U7hXO .framer-1w3j4ap-container, .framer-U7hXO .framer-kknxhg-container, .framer-U7hXO .framer-brumrs-container, .framer-U7hXO .framer-151mync-container, .framer-U7hXO .framer-1h4v32e-container { flex: none; height: auto; position: relative; width: auto; }", ".framer-U7hXO.framer-v-oej7w.framer-4ho47t { width: 100%; }", ".framer-U7hXO.framer-v-oej7w .framer-49jmbu { cursor: pointer; }", ".framer-U7hXO.framer-v-oej7w .framer-qia5es, .framer-U7hXO.framer-v-1c26sgo .framer-qia5es { flex-direction: column; padding: 8px 16px 8px 16px; }", ".framer-U7hXO.framer-v-oej7w .framer-kjxmbu, .framer-U7hXO.framer-v-oej7w .framer-128318f, .framer-U7hXO.framer-v-oej7w .framer-n7y75d, .framer-U7hXO.framer-v-oej7w .framer-11ot63s, .framer-U7hXO.framer-v-1c26sgo .framer-kjxmbu, .framer-U7hXO.framer-v-1c26sgo .framer-128318f, .framer-U7hXO.framer-v-1c26sgo .framer-n7y75d, .framer-U7hXO.framer-v-1c26sgo .framer-11ot63s { flex: none; gap: 8px; max-width: unset; width: 100%; }", ".framer-U7hXO.framer-v-oej7w .framer-11hb07v, .framer-U7hXO.framer-v-oej7w .framer-k16u0l, .framer-U7hXO.framer-v-oej7w .framer-qii1u0, .framer-U7hXO.framer-v-oej7w .framer-19hoxbl, .framer-U7hXO.framer-v-1c26sgo .framer-11hb07v, .framer-U7hXO.framer-v-1c26sgo .framer-k16u0l, .framer-U7hXO.framer-v-1c26sgo .framer-qii1u0, .framer-U7hXO.framer-v-1c26sgo .framer-19hoxbl { align-content: unset; align-items: unset; display: grid; gap: 0px; grid-auto-rows: minmax(0, 1fr); grid-template-columns: repeat(2, minmax(50px, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); }", ".framer-U7hXO.framer-v-oej7w .framer-3pkgni-container, .framer-U7hXO.framer-v-oej7w .framer-1nfc4am-container, .framer-U7hXO.framer-v-oej7w .framer-dsm605-container, .framer-U7hXO.framer-v-oej7w .framer-1d0t16v-container, .framer-U7hXO.framer-v-oej7w .framer-119dklo-container, .framer-U7hXO.framer-v-oej7w .framer-tysdld-container, .framer-U7hXO.framer-v-oej7w .framer-65pini-container, .framer-U7hXO.framer-v-oej7w .framer-1edmequ-container, .framer-U7hXO.framer-v-oej7w .framer-11q2o8r-container, .framer-U7hXO.framer-v-oej7w .framer-1wrqavz-container, .framer-U7hXO.framer-v-oej7w .framer-17najnm-container, .framer-U7hXO.framer-v-oej7w .framer-1406lny-container, .framer-U7hXO.framer-v-oej7w .framer-17fpter-container, .framer-U7hXO.framer-v-oej7w .framer-fylpx9-container, .framer-U7hXO.framer-v-oej7w .framer-1470tcx-container, .framer-U7hXO.framer-v-oej7w .framer-omtihe-container, .framer-U7hXO.framer-v-oej7w .framer-ho06kr-container, .framer-U7hXO.framer-v-oej7w .framer-1w3j4ap-container, .framer-U7hXO.framer-v-oej7w .framer-kknxhg-container, .framer-U7hXO.framer-v-oej7w .framer-brumrs-container, .framer-U7hXO.framer-v-oej7w .framer-151mync-container, .framer-U7hXO.framer-v-oej7w .framer-1h4v32e-container, .framer-U7hXO.framer-v-1c26sgo .framer-3pkgni-container, .framer-U7hXO.framer-v-1c26sgo .framer-1nfc4am-container, .framer-U7hXO.framer-v-1c26sgo .framer-dsm605-container, .framer-U7hXO.framer-v-1c26sgo .framer-1d0t16v-container, .framer-U7hXO.framer-v-1c26sgo .framer-119dklo-container, .framer-U7hXO.framer-v-1c26sgo .framer-tysdld-container, .framer-U7hXO.framer-v-1c26sgo .framer-65pini-container, .framer-U7hXO.framer-v-1c26sgo .framer-1edmequ-container, .framer-U7hXO.framer-v-1c26sgo .framer-11q2o8r-container, .framer-U7hXO.framer-v-1c26sgo .framer-1wrqavz-container, .framer-U7hXO.framer-v-1c26sgo .framer-17najnm-container, .framer-U7hXO.framer-v-1c26sgo .framer-1406lny-container, .framer-U7hXO.framer-v-1c26sgo .framer-17fpter-container, .framer-U7hXO.framer-v-1c26sgo .framer-fylpx9-container, .framer-U7hXO.framer-v-1c26sgo .framer-1470tcx-container, .framer-U7hXO.framer-v-1c26sgo .framer-omtihe-container, .framer-U7hXO.framer-v-1c26sgo .framer-ho06kr-container, .framer-U7hXO.framer-v-1c26sgo .framer-1w3j4ap-container, .framer-U7hXO.framer-v-1c26sgo .framer-kknxhg-container, .framer-U7hXO.framer-v-1c26sgo .framer-brumrs-container, .framer-U7hXO.framer-v-1c26sgo .framer-151mync-container, .framer-U7hXO.framer-v-1c26sgo .framer-1h4v32e-container { align-self: start; justify-self: start; width: 100%; }", ".framer-U7hXO.framer-v-1c26sgo.framer-4ho47t { cursor: pointer; height: auto; overflow: hidden; width: 100%; }"];
var FramerxfttPphNl = withCSS12(Component11, css11, "framer-U7hXO");
var xfttPphNl_default = FramerxfttPphNl;
FramerxfttPphNl.displayName = "New Menu";
FramerxfttPphNl.defaultProps = { height: 325, width: 1200 };
addPropertyControls12(FramerxfttPphNl, { variant: { options: ["P0CC2cO6u", "SbCN65WUp", "HP7XaJ4f7"], optionTitles: ["Desktop & Tablet", "Phone Open", "Phone Closed"], title: "Variant", type: ControlType12.Enum }, UxUlZSy6z: { title: "Close Dropdown", type: ControlType12.EventHandler }, MW82Yr8hk: { title: "Close Nav", type: ControlType12.EventHandler } });
addFonts6(FramerxfttPphNl, [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RruM4mJPby1QNtA.woff2", weight: "500" }] }, ...CaretUpFonts4, ...MenuLinkFonts4], { supportsExplicitInterCodegen: true });
FramerxfttPphNl.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader4(xvHKkw4Lv_default, {}, context)]);
} };

// http-url:https://framerusercontent.com/modules/65v8G2sSAYp1PJPiqywm/h58Wk894XgkXbKwKxnUj/YUfI10wRI.js
import { jsx as _jsx18 } from "react/jsx-runtime";
import { addFonts as addFonts7, addPropertyControls as addPropertyControls13, ControlType as ControlType13, cx as cx12, RichText as RichText6, useActiveVariantCallback as useActiveVariantCallback7, useComponentViewport as useComponentViewport7, useLocaleInfo as useLocaleInfo15, useVariantState as useVariantState7, withCSS as withCSS13 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup7, motion as motion18, MotionConfigContext as MotionConfigContext7 } from "framer-motion";
import * as React16 from "react";
import { useRef as useRef13 } from "react";
var enabledGestures3 = { bjJwMxSlc: { hover: true }, jm28fkr97: { hover: true } };
var cycleOrder5 = ["jm28fkr97", "j_O1vZgpc", "bjJwMxSlc"];
var serializationHash7 = "framer-kPVen";
var variantClassNames7 = { bjJwMxSlc: "framer-v-z74kac", j_O1vZgpc: "framer-v-cn7nw2", jm28fkr97: "framer-v-1i5uaun" };
function addPropertyOverrides7(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition17 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition7 = ({ value, children }) => {
  const config = React16.useContext(MotionConfigContext7);
  const transition = value ?? config.transition;
  const contextValue = React16.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx18(MotionConfigContext7.Provider, { value: contextValue, children });
};
var humanReadableVariantMap5 = { Active: "j_O1vZgpc", Default: "jm28fkr97", Inactive: "bjJwMxSlc" };
var Variants7 = motion18.create(React16.Fragment);
var getProps12 = ({ height, id, mouseEnter, text, width, ...props }) => {
  return { ...props, Lk2P6A1v3: mouseEnter ?? props.Lk2P6A1v3, SbnDmc0Ms: text ?? props.SbnDmc0Ms ?? "Nav Item", variant: humanReadableVariantMap5[props.variant] ?? props.variant ?? "jm28fkr97" };
};
var createLayoutDependency7 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component12 = /* @__PURE__ */ React16.forwardRef(function(props, ref) {
  const fallbackRef = useRef13(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React16.useId();
  const { activeLocale, setLocale } = useLocaleInfo15();
  const componentViewport = useComponentViewport7();
  const { style, className, layoutId, variant, SbnDmc0Ms, Lk2P6A1v3, ...restProps } = getProps12(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState7({ cycleOrder: cycleOrder5, defaultVariant: "jm28fkr97", enabledGestures: enabledGestures3, ref: refBinding, variant, variantClassNames: variantClassNames7 });
  const layoutDependency = createLayoutDependency7(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback7(baseVariant);
  const onMouseEntermia52m = activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: true });
    if (Lk2P6A1v3) {
      const res = await Lk2P6A1v3(...args);
      if (res === false)
        return false;
    }
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx12(serializationHash7, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx18(LayoutGroup7, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx18(Variants7, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx18(Transition7, { value: transition17, children: /* @__PURE__ */ _jsx18(motion18.div, { ...restProps, ...gestureHandlers, className: cx12(scopingClassNames, "framer-1i5uaun", className, classNames), "data-border": true, "data-framer-name": "Default", "data-highlight": true, layoutDependency, layoutId: "e1vFUka05__jm28fkr97", onMouseEnter: onMouseEntermia52m, ref: refBinding, style: { "--border-bottom-width": "2px", "--border-color": "rgba(18, 18, 18, 0)", "--border-left-width": "0px", "--border-right-width": "0px", "--border-style": "solid", "--border-top-width": "0px", ...style }, variants: { "bjJwMxSlc-hover": { "--border-color": "rgb(18, 18, 18)" }, "jm28fkr97-hover": { "--border-color": "rgb(18, 18, 18)" }, j_O1vZgpc: { "--border-color": "rgb(18, 18, 18)" } }, ...addPropertyOverrides7({ "bjJwMxSlc-hover": { "data-framer-name": void 0 }, "jm28fkr97-hover": { "data-framer-name": void 0 }, bjJwMxSlc: { "data-framer-name": "Inactive" }, j_O1vZgpc: { "data-framer-name": "Active" } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx18(RichText6, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx18(React16.Fragment, { children: /* @__PURE__ */ _jsx18(motion18.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Nav Item" }) }), className: "framer-14jiofv", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__RyK9hmmWW", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: SbnDmc0Ms, variants: { "bjJwMxSlc-hover": { "--extracted-r6o4lv": "rgb(18, 18, 18)" }, bjJwMxSlc: { "--extracted-r6o4lv": "rgb(130, 130, 130)" } }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides7({ "bjJwMxSlc-hover": { children: /* @__PURE__ */ _jsx18(React16.Fragment, { children: /* @__PURE__ */ _jsx18(motion18.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Nav Item" }) }) }, bjJwMxSlc: { children: /* @__PURE__ */ _jsx18(React16.Fragment, { children: /* @__PURE__ */ _jsx18(motion18.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(130, 130, 130))" }, children: "Nav Item" }) }) } }, baseVariant, gestureVariant) }) }) }) }) });
});
var css12 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-kPVen.framer-qhsmt, .framer-kPVen .framer-qhsmt { display: block; }", ".framer-kPVen.framer-1i5uaun { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 4px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 6px 4px 6px 4px; position: relative; width: min-content; }", ".framer-kPVen .framer-14jiofv { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", '.framer-kPVen[data-border="true"]::after, .framer-kPVen [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FramerYUfI10wRI = withCSS13(Component12, css12, "framer-kPVen");
var YUfI10wRI_default = FramerYUfI10wRI;
FramerYUfI10wRI.displayName = "Nav Item";
FramerYUfI10wRI.defaultProps = { height: 29, width: 64 };
addPropertyControls13(FramerYUfI10wRI, { variant: { options: ["jm28fkr97", "j_O1vZgpc", "bjJwMxSlc"], optionTitles: ["Default", "Active", "Inactive"], title: "Variant", type: ControlType13.Enum }, SbnDmc0Ms: { defaultValue: "Nav Item", displayTextArea: false, title: "Text", type: ControlType13.String }, onSbnDmc0MsChange: { changes: "SbnDmc0Ms", type: ControlType13.ChangeHandler }, Lk2P6A1v3: { title: "Mouse Enter", type: ControlType13.EventHandler } });
addFonts7(FramerYUfI10wRI, [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", openType: true, source: "google", style: "normal", uiFamilyName: "Geist", url: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RruM4mJPby1QNtA.woff2", weight: "500" }] }], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/G44kZ0KLXM4qrgtsfJyr/uxOQaIyC2J3XXx4T1bPi/zc3OAab8E.js
import { jsx as _jsx19, jsxs as _jsxs11 } from "react/jsx-runtime";
import { addFonts as addFonts8, addPropertyControls as addPropertyControls14, ComponentViewportProvider as ComponentViewportProvider5, ControlType as ControlType14, cx as cx13, forwardLoader as forwardLoader5, getFonts as getFonts5, RichText as RichText7, SmartComponentScopedContainer as SmartComponentScopedContainer5, useActiveVariantCallback as useActiveVariantCallback8, useComponentViewport as useComponentViewport8, useLocaleInfo as useLocaleInfo16, useVariantState as useVariantState8, withCSS as withCSS14 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup8, motion as motion19, MotionConfigContext as MotionConfigContext8 } from "framer-motion";
import * as React17 from "react";
import { useRef as useRef14 } from "react";
var CaretUpFonts5 = getFonts5(lDWUVpnhJ_default);
var MenuLinkFonts5 = getFonts5(xvHKkw4Lv_default);
var cycleOrder6 = ["EYf70W21r", "xijAzKgKe", "BFuRwmVWD"];
var serializationHash8 = "framer-FC7tr";
var variantClassNames8 = { BFuRwmVWD: "framer-v-cyftcc", EYf70W21r: "framer-v-qqq59p", xijAzKgKe: "framer-v-frgqsj" };
function addPropertyOverrides8(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition18 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition8 = ({ value, children }) => {
  const config = React17.useContext(MotionConfigContext8);
  const transition = value ?? config.transition;
  const contextValue = React17.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx19(MotionConfigContext8.Provider, { value: contextValue, children });
};
var humanReadableVariantMap6 = { "Desktop & Tablet": "EYf70W21r", "Phone Closed": "BFuRwmVWD", "Phone Open": "xijAzKgKe" };
var Variants8 = motion19.create(React17.Fragment);
var getProps13 = ({ closeDropdown, closeNav, height, id, width, ...props }) => {
  return { ...props, MW82Yr8hk: closeNav ?? props.MW82Yr8hk, UxUlZSy6z: closeDropdown ?? props.UxUlZSy6z, variant: humanReadableVariantMap6[props.variant] ?? props.variant ?? "EYf70W21r" };
};
var createLayoutDependency8 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component13 = /* @__PURE__ */ React17.forwardRef(function(props, ref) {
  const fallbackRef = useRef14(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React17.useId();
  const { activeLocale, setLocale } = useLocaleInfo16();
  const componentViewport = useComponentViewport8();
  const { style, className, layoutId, variant, UxUlZSy6z, MW82Yr8hk, ...restProps } = getProps13(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState8({ cycleOrder: cycleOrder6, defaultVariant: "EYf70W21r", ref: refBinding, variant, variantClassNames: variantClassNames8 });
  const layoutDependency = createLayoutDependency8(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback8(baseVariant);
  const onMouseLeave1qlyf7s = activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: false });
    if (UxUlZSy6z) {
      const res = await UxUlZSy6z(...args);
      if (res === false)
        return false;
    }
  });
  const onTapfqbuea = activeVariantCallback(async (...args) => {
    setVariant("BFuRwmVWD");
  });
  const onTaph3koxg = activeVariantCallback(async (...args) => {
    setVariant("xijAzKgKe");
  });
  const WcYx6PpLU59dgnd = activeVariantCallback(async (...args) => {
    if (MW82Yr8hk) {
      const res = await MW82Yr8hk(...args);
      if (res === false)
        return false;
    }
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx13(serializationHash8, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (["xijAzKgKe", "BFuRwmVWD"].includes(baseVariant))
      return true;
    return false;
  };
  return /* @__PURE__ */ _jsx19(LayoutGroup8, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx19(Variants8, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx19(Transition8, { value: transition18, children: /* @__PURE__ */ _jsxs11(motion19.div, { ...restProps, ...gestureHandlers, className: cx13(scopingClassNames, "framer-qqq59p", className, classNames), "data-framer-name": "Desktop & Tablet", "data-highlight": true, layoutDependency, layoutId: "e1vFUka05__EYf70W21r", onMouseLeave: onMouseLeave1qlyf7s, ref: refBinding, style: { ...style }, ...addPropertyOverrides8({ BFuRwmVWD: { "data-framer-name": "Phone Closed", "data-highlight": void 0, onMouseLeave: void 0 }, xijAzKgKe: { "data-framer-name": "Phone Open", "data-highlight": void 0, onMouseLeave: void 0 } }, baseVariant, gestureVariant), children: [isDisplayed() && /* @__PURE__ */ _jsxs11(motion19.div, { className: "framer-rhm1b5", "data-framer-name": "Mobile Title", layoutDependency, layoutId: "e1vFUka05__xQqLh7IZx", style: { backgroundColor: "rgb(255, 255, 255)" }, ...addPropertyOverrides8({ BFuRwmVWD: { "data-highlight": true, onTap: onTaph3koxg }, xijAzKgKe: { "data-highlight": true, onTap: onTapfqbuea } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx19(RichText7, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx19(React17.Fragment, { children: /* @__PURE__ */ _jsx19(motion19.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-size": "18px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Kids" }) }), className: "framer-f3up0h", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__itpVMRxgg", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx19(motion19.div, { className: "framer-e34uxf", "data-framer-name": "Icon", layoutDependency, layoutId: "e1vFUka05__P_65IoTbF", children: /* @__PURE__ */ _jsx19(lDWUVpnhJ_default, { animated: true, className: "framer-tpiumf", layoutDependency, layoutId: "e1vFUka05__vOkVxhsum", style: { "--1m6trwb": 0, "--21h8s6": "rgb(0, 0, 0)", "--pgex8v": 2, rotate: 0 }, variants: { BFuRwmVWD: { rotate: -180 } } }) })] }), /* @__PURE__ */ _jsxs11(motion19.div, { className: "framer-1r8b4fy", "data-framer-name": "Menu", layoutDependency, layoutId: "e1vFUka05__EHYHlZ4z4", children: [/* @__PURE__ */ _jsxs11(motion19.div, { className: "framer-4ecvyn", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__SukmiTFW1", children: [/* @__PURE__ */ _jsx19(motion19.div, { className: "framer-y4lj6x", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__Np3RmEU3X", children: /* @__PURE__ */ _jsx19(RichText7, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx19(React17.Fragment, { children: /* @__PURE__ */ _jsx19(motion19.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Boys" }) }), className: "framer-1uyztni", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__hmKwsrK78", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs11(motion19.div, { className: "framer-1gc90by", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__RSZ7sdx_d", children: [/* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 0 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-1hpx3k9-container", layoutDependency, layoutId: "e1vFUka05__ymWWsVHts-container", nodeId: "ymWWsVHts", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "ymWWsVHts", layoutId: "e1vFUka05__ymWWsVHts", SbnDmc0Ms: "All Boys Footwear", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 0 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-5k5z56-container", layoutDependency, layoutId: "e1vFUka05__pND8Z5DW0-container", nodeId: "pND8Z5DW0", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "pND8Z5DW0", layoutId: "e1vFUka05__pND8Z5DW0", SbnDmc0Ms: "All Boys Apparel", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 29 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-1d2attm-container", layoutDependency, layoutId: "e1vFUka05__bbYNpQqhu-container", nodeId: "bbYNpQqhu", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "bbYNpQqhu", layoutId: "e1vFUka05__bbYNpQqhu", SbnDmc0Ms: "Everyday Style", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 29 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-5e5gw0-container", layoutDependency, layoutId: "e1vFUka05__jVb5bUTEv-container", nodeId: "jVb5bUTEv", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "jVb5bUTEv", layoutId: "e1vFUka05__jVb5bUTEv", SbnDmc0Ms: "Running", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 140, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 58 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-1vv9g10-container", layoutDependency, layoutId: "e1vFUka05__sbfnjb_aQ-container", nodeId: "sbfnjb_aQ", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "sbfnjb_aQ", layoutId: "e1vFUka05__sbfnjb_aQ", SbnDmc0Ms: "Basketball", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 175, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 58 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 0 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-1c8q3nx-container", layoutDependency, layoutId: "e1vFUka05__jNX7k8U2u-container", nodeId: "jNX7k8U2u", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "jNX7k8U2u", layoutId: "e1vFUka05__jNX7k8U2u", SbnDmc0Ms: "Training", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs11(motion19.div, { className: "framer-1n2x3y5", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__WqUOeb22X", children: [/* @__PURE__ */ _jsx19(motion19.div, { className: "framer-1m9mfrk", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__khXew_zSs", children: /* @__PURE__ */ _jsx19(RichText7, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx19(React17.Fragment, { children: /* @__PURE__ */ _jsx19(motion19.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Girls" }) }), className: "framer-ggmitj", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__nsIOf44i6", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs11(motion19.div, { className: "framer-qk3054", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__yvdvrhaa5", children: [/* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 130.2 + 0 + 27.2 + 0 + 0 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 130.2 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-b9x8e4-container", layoutDependency, layoutId: "e1vFUka05__hNMuVegUA-container", nodeId: "hNMuVegUA", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "hNMuVegUA", layoutId: "e1vFUka05__hNMuVegUA", SbnDmc0Ms: "All Girls Footwear", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 130.2 + 0 + 27.2 + 0 + 0 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 130.2 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-1n46lm5-container", layoutDependency, layoutId: "e1vFUka05__MEpOZsItk-container", nodeId: "MEpOZsItk", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "MEpOZsItk", layoutId: "e1vFUka05__MEpOZsItk", SbnDmc0Ms: "All Girls Apparel", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 130.2 + 0 + 27.2 + 0 + 29 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 130.2 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-uzzmy8-container", layoutDependency, layoutId: "e1vFUka05__GRqYVjEVd-container", nodeId: "GRqYVjEVd", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "GRqYVjEVd", layoutId: "e1vFUka05__GRqYVjEVd", SbnDmc0Ms: "Everyday Style", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 130.2 + 0 + 27.2 + 0 + 29 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 130.2 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-w13g96-container", layoutDependency, layoutId: "e1vFUka05__wneCssBei-container", nodeId: "wneCssBei", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "wneCssBei", layoutId: "e1vFUka05__wneCssBei", SbnDmc0Ms: "Running", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 140, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 130.2 + 0 + 27.2 + 0 + 58 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 130.2 + 0 + 27.2 + 0 + 58 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-yzsqav-container", layoutDependency, layoutId: "e1vFUka05__MWpneqpbf-container", nodeId: "MWpneqpbf", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "MWpneqpbf", layoutId: "e1vFUka05__MWpneqpbf", SbnDmc0Ms: "Training", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs11(motion19.div, { className: "framer-18s3zwd", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__YcbNnhOS2", children: [/* @__PURE__ */ _jsx19(motion19.div, { className: "framer-107no06", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__j3TY1aCir", children: /* @__PURE__ */ _jsx19(RichText7, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx19(React17.Fragment, { children: /* @__PURE__ */ _jsx19(motion19.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Little Ones" }) }), className: "framer-ihy74e", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__FiertnNCv", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs11(motion19.div, { className: "framer-19u2540", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__YhgVdGPWU", children: [/* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 260.4 + 0 + 27.2 + 0 + 0 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 260.4 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-afpti3-container", layoutDependency, layoutId: "e1vFUka05__SiRKJNgMB-container", nodeId: "SiRKJNgMB", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "SiRKJNgMB", layoutId: "e1vFUka05__SiRKJNgMB", SbnDmc0Ms: "All Baby & Toddler", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 260.4 + 0 + 27.2 + 0 + 0 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 260.4 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-1lcli3j-container", layoutDependency, layoutId: "e1vFUka05__MabotD9f6-container", nodeId: "MabotD9f6", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "MabotD9f6", layoutId: "e1vFUka05__MabotD9f6", SbnDmc0Ms: "Footwear", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 260.4 + 0 + 27.2 + 0 + 29 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 260.4 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-1dmmy56-container", layoutDependency, layoutId: "e1vFUka05__P2U7fQBrX-container", nodeId: "P2U7fQBrX", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "P2U7fQBrX", layoutId: "e1vFUka05__P2U7fQBrX", SbnDmc0Ms: "Apparel", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] }), /* @__PURE__ */ _jsxs11(motion19.div, { className: "framer-1itvww2", "data-framer-name": "Column", layoutDependency, layoutId: "e1vFUka05__nTAsMeFfy", children: [/* @__PURE__ */ _jsx19(motion19.div, { className: "framer-1tt6ghl", "data-framer-name": "Title", layoutDependency, layoutId: "e1vFUka05__NpwGSJIDv", children: /* @__PURE__ */ _jsx19(RichText7, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx19(React17.Fragment, { children: /* @__PURE__ */ _jsx19(motion19.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtNTAw", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(18, 18, 18))" }, children: "Shop by Age" }) }), className: "framer-cq98ee", fonts: ["GF;Geist-500"], layoutDependency, layoutId: "e1vFUka05__zRaljDJPB", style: { "--extracted-r6o4lv": "rgb(18, 18, 18)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }), /* @__PURE__ */ _jsxs11(motion19.div, { className: "framer-1dpj4ti", "data-framer-name": "Links", layoutDependency, layoutId: "e1vFUka05__rUGfpZ9rm", children: [/* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 0, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 361.6 + 0 + 27.2 + 0 + 0 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 361.6 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-1ti1ypi-container", layoutDependency, layoutId: "e1vFUka05__HCmi9qRiD-container", nodeId: "HCmi9qRiD", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "HCmi9qRiD", layoutId: "e1vFUka05__HCmi9qRiD", SbnDmc0Ms: "Baby (0-24m)", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 35, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 361.6 + 0 + 27.2 + 0 + 0 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 361.6 + 0 + 27.2 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-v9glff-container", layoutDependency, layoutId: "e1vFUka05__d0qwVAPF5-container", nodeId: "d0qwVAPF5", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "d0qwVAPF5", layoutId: "e1vFUka05__d0qwVAPF5", SbnDmc0Ms: "Toddler (2-4y)", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 70, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 361.6 + 0 + 27.2 + 0 + 29 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 361.6 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-1j8wtip-container", layoutDependency, layoutId: "e1vFUka05__xM8Y5zSYt-container", nodeId: "xM8Y5zSYt", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "xM8Y5zSYt", layoutId: "e1vFUka05__xM8Y5zSYt", SbnDmc0Ms: "Little Kids (4-7y)", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) }), /* @__PURE__ */ _jsx19(ComponentViewportProvider5, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 24 + 0 + 39.2 + 0 + 105, ...addPropertyOverrides8({ BFuRwmVWD: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 361.6 + 0 + 27.2 + 0 + 29 }, xijAzKgKe: { width: `max((${componentViewport?.width || "100vw"} - 32px) / 2, 50px)`, y: (componentViewport?.y || 0) + 0 + 53.6 + 8 + 361.6 + 0 + 27.2 + 0 + 29 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer5, { className: "framer-d6hsra-container", layoutDependency, layoutId: "e1vFUka05__AR3b5iq7N-container", nodeId: "AR3b5iq7N", rendersWithMotion: true, scopeId: "zc3OAab8E", children: /* @__PURE__ */ _jsx19(xvHKkw4Lv_default, { height: "100%", id: "AR3b5iq7N", layoutId: "e1vFUka05__AR3b5iq7N", SbnDmc0Ms: "Big Kids (7-15y)", TEXQPq0ip: "https://framer.link/val-casanova", u1toCPSvE: false, WcYx6PpLU: WcYx6PpLU59dgnd, width: "100%", Z3SWEK0uk: false }) }) })] })] })] })] }) }) }) });
});
var css13 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-FC7tr.framer-1g4ruu, .framer-FC7tr .framer-1g4ruu { display: block; }", ".framer-FC7tr.framer-qqq59p { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; max-width: 1200px; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-FC7tr .framer-rhm1b5 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; overflow: var(--overflow-clip-fallback, clip); padding: 16px; position: relative; width: 100%; }", ".framer-FC7tr .framer-f3up0h, .framer-FC7tr .framer-1uyztni, .framer-FC7tr .framer-ggmitj, .framer-FC7tr .framer-ihy74e, .framer-FC7tr .framer-cq98ee { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-FC7tr .framer-e34uxf { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: min-content; }", ".framer-FC7tr .framer-tpiumf { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 20px); position: relative; width: 20px; }", ".framer-FC7tr .framer-1r8b4fy { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 16px; height: min-content; justify-content: center; overflow: visible; padding: 24px 16px 24px 16px; position: relative; width: 100%; }", ".framer-FC7tr .framer-4ecvyn, .framer-FC7tr .framer-1n2x3y5, .framer-FC7tr .framer-18s3zwd, .framer-FC7tr .framer-1itvww2 { align-content: flex-start; align-items: flex-start; display: flex; flex: 1 0 0px; flex-direction: column; flex-wrap: nowrap; gap: 20px; height: min-content; justify-content: center; max-width: 230px; overflow: visible; padding: 0px; position: relative; width: 1px; }", ".framer-FC7tr .framer-y4lj6x, .framer-FC7tr .framer-1m9mfrk, .framer-FC7tr .framer-107no06, .framer-FC7tr .framer-1tt6ghl { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-FC7tr .framer-1gc90by, .framer-FC7tr .framer-qk3054, .framer-FC7tr .framer-19u2540, .framer-FC7tr .framer-1dpj4ti { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 6px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-FC7tr .framer-1hpx3k9-container, .framer-FC7tr .framer-5k5z56-container, .framer-FC7tr .framer-1d2attm-container, .framer-FC7tr .framer-5e5gw0-container, .framer-FC7tr .framer-1vv9g10-container, .framer-FC7tr .framer-1c8q3nx-container, .framer-FC7tr .framer-b9x8e4-container, .framer-FC7tr .framer-1n46lm5-container, .framer-FC7tr .framer-uzzmy8-container, .framer-FC7tr .framer-w13g96-container, .framer-FC7tr .framer-yzsqav-container, .framer-FC7tr .framer-afpti3-container, .framer-FC7tr .framer-1lcli3j-container, .framer-FC7tr .framer-1dmmy56-container, .framer-FC7tr .framer-1ti1ypi-container, .framer-FC7tr .framer-v9glff-container, .framer-FC7tr .framer-1j8wtip-container, .framer-FC7tr .framer-d6hsra-container { flex: none; height: auto; position: relative; width: auto; }", ".framer-FC7tr.framer-v-frgqsj.framer-qqq59p { width: 100%; }", ".framer-FC7tr.framer-v-frgqsj .framer-rhm1b5, .framer-FC7tr.framer-v-cyftcc .framer-rhm1b5 { cursor: pointer; }", ".framer-FC7tr.framer-v-frgqsj .framer-1r8b4fy, .framer-FC7tr.framer-v-cyftcc .framer-1r8b4fy { flex-direction: column; padding: 8px 16px 8px 16px; }", ".framer-FC7tr.framer-v-frgqsj .framer-4ecvyn, .framer-FC7tr.framer-v-frgqsj .framer-1n2x3y5, .framer-FC7tr.framer-v-frgqsj .framer-18s3zwd, .framer-FC7tr.framer-v-frgqsj .framer-1itvww2, .framer-FC7tr.framer-v-cyftcc .framer-4ecvyn, .framer-FC7tr.framer-v-cyftcc .framer-1n2x3y5, .framer-FC7tr.framer-v-cyftcc .framer-18s3zwd, .framer-FC7tr.framer-v-cyftcc .framer-1itvww2 { flex: none; gap: 8px; max-width: unset; width: 100%; }", ".framer-FC7tr.framer-v-frgqsj .framer-1gc90by, .framer-FC7tr.framer-v-frgqsj .framer-qk3054, .framer-FC7tr.framer-v-frgqsj .framer-19u2540, .framer-FC7tr.framer-v-frgqsj .framer-1dpj4ti, .framer-FC7tr.framer-v-cyftcc .framer-1gc90by, .framer-FC7tr.framer-v-cyftcc .framer-qk3054, .framer-FC7tr.framer-v-cyftcc .framer-19u2540, .framer-FC7tr.framer-v-cyftcc .framer-1dpj4ti { align-content: unset; align-items: unset; display: grid; gap: 0px; grid-auto-rows: minmax(0, 1fr); grid-template-columns: repeat(2, minmax(50px, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); }", ".framer-FC7tr.framer-v-frgqsj .framer-1hpx3k9-container, .framer-FC7tr.framer-v-frgqsj .framer-5k5z56-container, .framer-FC7tr.framer-v-frgqsj .framer-1d2attm-container, .framer-FC7tr.framer-v-frgqsj .framer-5e5gw0-container, .framer-FC7tr.framer-v-frgqsj .framer-1vv9g10-container, .framer-FC7tr.framer-v-frgqsj .framer-1c8q3nx-container, .framer-FC7tr.framer-v-frgqsj .framer-b9x8e4-container, .framer-FC7tr.framer-v-frgqsj .framer-1n46lm5-container, .framer-FC7tr.framer-v-frgqsj .framer-uzzmy8-container, .framer-FC7tr.framer-v-frgqsj .framer-w13g96-container, .framer-FC7tr.framer-v-frgqsj .framer-yzsqav-container, .framer-FC7tr.framer-v-frgqsj .framer-afpti3-container, .framer-FC7tr.framer-v-frgqsj .framer-1lcli3j-container, .framer-FC7tr.framer-v-frgqsj .framer-1dmmy56-container, .framer-FC7tr.framer-v-frgqsj .framer-1ti1ypi-container, .framer-FC7tr.framer-v-frgqsj .framer-v9glff-container, .framer-FC7tr.framer-v-frgqsj .framer-1j8wtip-container, .framer-FC7tr.framer-v-frgqsj .framer-d6hsra-container, .framer-FC7tr.framer-v-cyftcc .framer-1hpx3k9-container, .framer-FC7tr.framer-v-cyftcc .framer-5k5z56-container, .framer-FC7tr.framer-v-cyftcc .framer-1d2attm-container, .framer-FC7tr.framer-v-cyftcc .framer-5e5gw0-container, .framer-FC7tr.framer-v-cyftcc .framer-1vv9g10-container, .framer-FC7tr.framer-v-cyftcc .framer-1c8q3nx-container, .framer-FC7tr.framer-v-cyftcc .framer-b9x8e4-container, .framer-FC7tr.framer-v-cyftcc .framer-1n46lm5-container, .framer-FC7tr.framer-v-cyftcc .framer-uzzmy8-container, .framer-FC7tr.framer-v-cyftcc .framer-w13g96-container, .framer-FC7tr.framer-v-cyftcc .framer-yzsqav-container, .framer-FC7tr.framer-v-cyftcc .framer-afpti3-container, .framer-FC7tr.framer-v-cyftcc .framer-1lcli3j-container, .framer-FC7tr.framer-v-cyftcc .framer-1dmmy56-container, .framer-FC7tr.framer-v-cyftcc .framer-1ti1ypi-container, .framer-FC7tr.framer-v-cyftcc .framer-v9glff-container, .framer-FC7tr.framer-v-cyftcc .framer-1j8wtip-container, .framer-FC7tr.framer-v-cyftcc .framer-d6hsra-container { align-self: start; justify-self: start; width: 100%; }", ".framer-FC7tr.framer-v-cyftcc.framer-qqq59p { height: auto; overflow: hidden; width: 100%; }"];
var Framerzc3OAab8E = withCSS14(Component13, css13, "framer-FC7tr");
var zc3OAab8E_default = Framerzc3OAab8E;
Framerzc3OAab8E.displayName = "Kids Menu";
Framerzc3OAab8E.defaultProps = { height: 290, width: 1200 };
addPropertyControls14(Framerzc3OAab8E, { variant: { options: ["EYf70W21r", "xijAzKgKe", "BFuRwmVWD"], optionTitles: ["Desktop & Tablet", "Phone Open", "Phone Closed"], title: "Variant", type: ControlType14.Enum }, UxUlZSy6z: { title: "Close Dropdown", type: ControlType14.EventHandler }, MW82Yr8hk: { title: "Close Nav", type: ControlType14.EventHandler } });
addFonts8(Framerzc3OAab8E, [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RruM4mJPby1QNtA.woff2", weight: "500" }] }, ...CaretUpFonts5, ...MenuLinkFonts5], { supportsExplicitInterCodegen: true });
Framerzc3OAab8E.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader5(xvHKkw4Lv_default, {}, context)]);
} };

// http-url:https://framerusercontent.com/modules/2qQSCNYRwdZQo8UkPzfJ/K0nzfwzwv9DSMMCzogvn/e1vFUka05.js
var NavItemFonts = getFonts6(YUfI10wRI_default);
var SearchFonts = getFonts6(Search_default);
var IconFonts = getFonts6(Wq_yc4GsM_default);
var NewMenuFonts = getFonts6(xfttPphNl_default);
var MenMenuFonts = getFonts6(c8o9SH5Pr_default);
var WomenMenuFonts = getFonts6(eWbC_MfEi_default);
var KidsMenuFonts = getFonts6(zc3OAab8E_default);
var SaleMenuFonts = getFonts6(oRNeXEz8O_default);
var cycleOrder7 = ["HihUXUAoM", "QwwWPUrYq", "pD7BcMK82", "HUjJWBAL_", "exC0iftiH", "aI713qdgP", "l_N4piQ82", "YO7D0E5Zi", "cb5_AxI8e"];
var serializationHash9 = "framer-L5CE9";
var variantClassNames9 = { aI713qdgP: "framer-v-uljs23", cb5_AxI8e: "framer-v-ll7v3x", exC0iftiH: "framer-v-1n2ftg1", HihUXUAoM: "framer-v-1v4tj4n", HUjJWBAL_: "framer-v-mkt94d", l_N4piQ82: "framer-v-1r18z2t", pD7BcMK82: "framer-v-atohjn", QwwWPUrYq: "framer-v-81y8v1", YO7D0E5Zi: "framer-v-1bbkjhl" };
function addPropertyOverrides9(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition19 = { bounce: 0, delay: 0, duration: 0.6, type: "spring" };
var matchVariant = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var Transition9 = ({ value, children }) => {
  const config = React18.useContext(MotionConfigContext9);
  const transition = value ?? config.transition;
  const contextValue = React18.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx20(MotionConfigContext9.Provider, { value: contextValue, children });
};
var humanReadableVariantMap7 = { "Make edits here": "HihUXUAoM", "Phone Closed": "cb5_AxI8e", "Phone Open": "YO7D0E5Zi", Closed: "QwwWPUrYq", Kids: "aI713qdgP", Men: "HUjJWBAL_", New: "pD7BcMK82", Sale: "l_N4piQ82", Women: "exC0iftiH" };
var Variants9 = motion20.create(React18.Fragment);
var getProps14 = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap7[props.variant] ?? props.variant ?? "HihUXUAoM" };
};
var createLayoutDependency9 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component14 = /* @__PURE__ */ React18.forwardRef(function(props, ref) {
  const fallbackRef = useRef15(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React18.useId();
  const { activeLocale, setLocale } = useLocaleInfo17();
  const componentViewport = useComponentViewport9();
  const { style, className, layoutId, variant, ...restProps } = getProps14(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState9({ cycleOrder: cycleOrder7, defaultVariant: "HihUXUAoM", ref: refBinding, variant, variantClassNames: variantClassNames9 });
  const layoutDependency = createLayoutDependency9(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback9(baseVariant);
  const onMouseEnter15t4kde = activeVariantCallback(async (...args) => {
    setVariant("QwwWPUrYq");
  });
  const onTapqbstws = activeVariantCallback(async (...args) => {
    setVariant("cb5_AxI8e");
  });
  const Lk2P6A1v3q0i8xr = activeVariantCallback(async (...args) => {
    setVariant("pD7BcMK82");
  });
  const Lk2P6A1v3fmd8qx = activeVariantCallback(async (...args) => {
    setVariant("HUjJWBAL_");
  });
  const Lk2P6A1v3oh94ej = activeVariantCallback(async (...args) => {
    setVariant("exC0iftiH");
  });
  const Lk2P6A1v3tjlgfa = activeVariantCallback(async (...args) => {
    setVariant("aI713qdgP");
  });
  const Lk2P6A1v31duieuu = activeVariantCallback(async (...args) => {
    setVariant("l_N4piQ82");
  });
  const onTap1u6gf8b = activeVariantCallback(async (...args) => {
    setVariant("YO7D0E5Zi");
  });
  const UxUlZSy6z15t4kde = activeVariantCallback(async (...args) => {
    setVariant("QwwWPUrYq");
  });
  const MW82Yr8hkqbstws = activeVariantCallback(async (...args) => {
    setVariant("cb5_AxI8e");
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx14(serializationHash9, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (["YO7D0E5Zi", "cb5_AxI8e"].includes(baseVariant))
      return false;
    return true;
  };
  const isDisplayed1 = () => {
    if (baseVariant === "cb5_AxI8e")
      return false;
    return true;
  };
  const isDisplayed2 = () => {
    if (["YO7D0E5Zi", "cb5_AxI8e"].includes(baseVariant))
      return true;
    return false;
  };
  const isDisplayed3 = () => {
    if (["QwwWPUrYq", "HUjJWBAL_", "exC0iftiH", "aI713qdgP", "l_N4piQ82"].includes(baseVariant))
      return false;
    return true;
  };
  const isDisplayed4 = () => {
    if (["QwwWPUrYq", "pD7BcMK82", "exC0iftiH", "aI713qdgP", "l_N4piQ82"].includes(baseVariant))
      return false;
    return true;
  };
  const isDisplayed5 = () => {
    if (["QwwWPUrYq", "pD7BcMK82", "HUjJWBAL_", "aI713qdgP", "l_N4piQ82"].includes(baseVariant))
      return false;
    return true;
  };
  const isDisplayed6 = () => {
    if (["QwwWPUrYq", "pD7BcMK82", "HUjJWBAL_", "exC0iftiH", "l_N4piQ82"].includes(baseVariant))
      return false;
    return true;
  };
  const isDisplayed7 = () => {
    if (["QwwWPUrYq", "pD7BcMK82", "HUjJWBAL_", "exC0iftiH", "aI713qdgP"].includes(baseVariant))
      return false;
    return true;
  };
  return /* @__PURE__ */ _jsx20(LayoutGroup9, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx20(Variants9, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx20(Transition9, { value: transition19, children: /* @__PURE__ */ _jsxs12(motion20.div, { ...restProps, ...gestureHandlers, className: cx14(scopingClassNames, "framer-1v4tj4n", className, classNames), "data-framer-name": "Make edits here", layoutDependency, layoutId: "e1vFUka05__HihUXUAoM", ref: refBinding, style: { ...style }, ...addPropertyOverrides9({ aI713qdgP: { "data-framer-name": "Kids" }, cb5_AxI8e: { "data-framer-name": "Phone Closed" }, exC0iftiH: { "data-framer-name": "Women" }, HUjJWBAL_: { "data-framer-name": "Men" }, l_N4piQ82: { "data-framer-name": "Sale" }, pD7BcMK82: { "data-framer-name": "New" }, QwwWPUrYq: { "data-framer-name": "Closed" }, YO7D0E5Zi: { "data-framer-name": "Phone Open" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsxs12(motion20.div, { className: "framer-9koh9s", "data-framer-name": "Top Bar", layoutDependency, layoutId: "e1vFUka05__WU16Fa2Ai", children: [/* @__PURE__ */ _jsx20(motion20.div, { className: "framer-7zbjo3", "data-framer-name": "Logo Container", "data-highlight": true, layoutDependency, layoutId: "e1vFUka05__E2ntdq2Gi", onMouseEnter: onMouseEnter15t4kde, ...addPropertyOverrides9({ cb5_AxI8e: { "data-highlight": void 0, onMouseEnter: void 0 }, YO7D0E5Zi: { "data-highlight": void 0, onMouseEnter: void 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx20(Link3, { href: "https://framer.link/val-casanova", motionChild: true, nodeId: "lQaKWppPs", openInNewTab: true, scopeId: "e1vFUka05", children: /* @__PURE__ */ _jsx20(motion20.a, { className: "framer-1to7nw8 framer-zkg2ew", "data-framer-name": "Placeholder Logo", layoutDependency, layoutId: "e1vFUka05__lQaKWppPs", ...addPropertyOverrides9({ YO7D0E5Zi: { "data-highlight": true, onTap: onTapqbstws } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsxs12(SVG6, { className: "framer-1lya0le", layoutDependency, layoutId: "e1vFUka05__yHKGA3kW5", requiresOverflowVisible: false, svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 25.027 19.983" overflow="visible"><path d="M 21.514 15.467 L 15.492 19.983 L 2.445 19.983 L 3.448 17.474 L 5.958 15.467 L 14.489 15.467 L 15.994 17.474 L 20.009 5.43 L 22.518 3.423 L 25.027 3.423 Z M 21.578 2.509 L 19.069 4.516 L 10.538 4.516 L 9.033 2.509 L 5.018 14.553 L 2.509 16.56 L 0 16.56 L 3.513 4.516 L 9.535 0 L 22.582 0 Z M 11.851 6.408 L 17.371 6.408 L 14.36 15.441 L 12.855 13.434 L 7.335 13.434 L 10.345 4.401 Z" fill="rgb(18, 18, 18)"></path></svg>', withExternalLayout: true, children: [/* @__PURE__ */ _jsx20(SVG6, { className: "framer-om53mm", layoutDependency, layoutId: "e1vFUka05__PenCmR6wK", requiresOverflowVisible: false, svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 22.582 16.56" overflow="visible"><path d="M 19.069 12.044 L 13.047 16.56 L 0 16.56 L 1.004 14.051 L 3.513 12.044 L 12.044 12.044 L 13.549 14.051 L 17.564 2.007 L 20.073 0 L 22.582 0 Z" fill="transparent"></path></svg>', withExternalLayout: true }), /* @__PURE__ */ _jsx20(SVG6, { className: "framer-1axo765", layoutDependency, layoutId: "e1vFUka05__TbpGLaW8e", requiresOverflowVisible: false, svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 22.582 16.56" overflow="visible"><path d="M 21.578 2.509 L 19.069 4.516 L 10.538 4.516 L 9.033 2.509 L 5.018 14.553 L 2.509 16.56 L 0 16.56 L 3.513 4.516 L 9.535 0 L 22.582 0 Z" fill="transparent"></path></svg>', withExternalLayout: true }), /* @__PURE__ */ _jsx20(SVG6, { className: "framer-13yp8ww", layoutDependency, layoutId: "e1vFUka05__pY7uehh7L", requiresOverflowVisible: false, svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 10.036 11.04" overflow="visible"><path d="M 4.516 2.007 L 10.036 2.007 L 7.026 11.04 L 5.52 9.033 L 0 9.033 L 3.011 0 Z" fill="transparent"></path></svg>', withExternalLayout: true })] }) }) }) }), isDisplayed() && /* @__PURE__ */ _jsxs12(motion20.div, { className: "framer-45ak9m", "data-framer-name": "Menu", layoutDependency, layoutId: "e1vFUka05__eGjsDk2F6", children: [/* @__PURE__ */ _jsx20(ComponentViewportProvider6, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 17.5 + 0, children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-11vnknx-container", layoutDependency, layoutId: "e1vFUka05__NkVNdY2Or-container", nodeId: "NkVNdY2Or", rendersWithMotion: true, scopeId: "e1vFUka05", children: /* @__PURE__ */ _jsx20(YUfI10wRI_default, { height: "100%", id: "NkVNdY2Or", layoutId: "e1vFUka05__NkVNdY2Or", Lk2P6A1v3: Lk2P6A1v3q0i8xr, SbnDmc0Ms: "New", variant: matchVariant("jm28fkr97"), width: "100%", ...addPropertyOverrides9({ aI713qdgP: { variant: matchVariant("bjJwMxSlc") }, exC0iftiH: { variant: matchVariant("bjJwMxSlc") }, HUjJWBAL_: { variant: matchVariant("bjJwMxSlc") }, l_N4piQ82: { variant: matchVariant("bjJwMxSlc") }, pD7BcMK82: { variant: matchVariant("j_O1vZgpc") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx20(ComponentViewportProvider6, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 17.5 + 0, children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-1fs3pwt-container", layoutDependency, layoutId: "e1vFUka05__W4tJeTjc1-container", nodeId: "W4tJeTjc1", rendersWithMotion: true, scopeId: "e1vFUka05", children: /* @__PURE__ */ _jsx20(YUfI10wRI_default, { height: "100%", id: "W4tJeTjc1", layoutId: "e1vFUka05__W4tJeTjc1", Lk2P6A1v3: Lk2P6A1v3fmd8qx, SbnDmc0Ms: "Men", variant: matchVariant("jm28fkr97"), width: "100%", ...addPropertyOverrides9({ aI713qdgP: { variant: matchVariant("bjJwMxSlc") }, exC0iftiH: { variant: matchVariant("bjJwMxSlc") }, HUjJWBAL_: { variant: matchVariant("j_O1vZgpc") }, l_N4piQ82: { variant: matchVariant("bjJwMxSlc") }, pD7BcMK82: { variant: matchVariant("bjJwMxSlc") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx20(ComponentViewportProvider6, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 17.5 + 0, children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-17q7mmh-container", layoutDependency, layoutId: "e1vFUka05__x2e9eFqcN-container", nodeId: "x2e9eFqcN", rendersWithMotion: true, scopeId: "e1vFUka05", children: /* @__PURE__ */ _jsx20(YUfI10wRI_default, { height: "100%", id: "x2e9eFqcN", layoutId: "e1vFUka05__x2e9eFqcN", Lk2P6A1v3: Lk2P6A1v3oh94ej, SbnDmc0Ms: "Women", variant: matchVariant("jm28fkr97"), width: "100%", ...addPropertyOverrides9({ aI713qdgP: { variant: matchVariant("bjJwMxSlc") }, exC0iftiH: { variant: matchVariant("j_O1vZgpc") }, HUjJWBAL_: { variant: matchVariant("bjJwMxSlc") }, l_N4piQ82: { variant: matchVariant("bjJwMxSlc") }, pD7BcMK82: { variant: matchVariant("bjJwMxSlc") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx20(ComponentViewportProvider6, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 17.5 + 0, children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-er5ub4-container", layoutDependency, layoutId: "e1vFUka05__G6rm8i2h3-container", nodeId: "G6rm8i2h3", rendersWithMotion: true, scopeId: "e1vFUka05", children: /* @__PURE__ */ _jsx20(YUfI10wRI_default, { height: "100%", id: "G6rm8i2h3", layoutId: "e1vFUka05__G6rm8i2h3", Lk2P6A1v3: Lk2P6A1v3tjlgfa, SbnDmc0Ms: "Kids", variant: matchVariant("jm28fkr97"), width: "100%", ...addPropertyOverrides9({ aI713qdgP: { variant: matchVariant("j_O1vZgpc") }, exC0iftiH: { variant: matchVariant("bjJwMxSlc") }, HUjJWBAL_: { variant: matchVariant("bjJwMxSlc") }, l_N4piQ82: { variant: matchVariant("bjJwMxSlc") }, pD7BcMK82: { variant: matchVariant("bjJwMxSlc") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx20(ComponentViewportProvider6, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 17.5 + 0, children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-1i66ax3-container", layoutDependency, layoutId: "e1vFUka05__A4LJSOUq0-container", nodeId: "A4LJSOUq0", rendersWithMotion: true, scopeId: "e1vFUka05", children: /* @__PURE__ */ _jsx20(YUfI10wRI_default, { height: "100%", id: "A4LJSOUq0", layoutId: "e1vFUka05__A4LJSOUq0", Lk2P6A1v3: Lk2P6A1v31duieuu, SbnDmc0Ms: "Sale", variant: matchVariant("jm28fkr97"), width: "100%", ...addPropertyOverrides9({ aI713qdgP: { variant: matchVariant("bjJwMxSlc") }, exC0iftiH: { variant: matchVariant("bjJwMxSlc") }, HUjJWBAL_: { variant: matchVariant("bjJwMxSlc") }, l_N4piQ82: { variant: matchVariant("j_O1vZgpc") }, pD7BcMK82: { variant: matchVariant("bjJwMxSlc") } }, baseVariant, gestureVariant) }) }) })] }), /* @__PURE__ */ _jsxs12(motion20.div, { className: "framer-180rldw", "data-framer-name": "Icons Right", "data-highlight": true, layoutDependency, layoutId: "e1vFUka05__U59KjgTWK", onMouseEnter: onMouseEnter15t4kde, ...addPropertyOverrides9({ cb5_AxI8e: { "data-highlight": void 0, onMouseEnter: void 0 }, YO7D0E5Zi: { "data-highlight": void 0, onMouseEnter: void 0 } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx20(ComponentViewportProvider6, { children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-1da9oy8-container", isAuthoredByUser: true, isModuleExternal: true, layoutDependency, layoutId: "e1vFUka05__Yib4Up2xY-container", nodeId: "Yib4Up2xY", rendersWithMotion: true, scopeId: "e1vFUka05", children: /* @__PURE__ */ _jsx20(Search_default, { backdropOptions: { backgroundColor: "rgba(0, 0, 0, 0.8)", transition: { damping: 60, delay: 0, mass: 1, stiffness: 500, type: "spring" }, zIndex: 10 }, height: "100%", iconColor: "rgb(18, 18, 18)", iconSize: 20, iconType: "default", id: "Yib4Up2xY", inputOptions: { clearButtonText: "Clear", clearButtonType: "icon", dividerType: "fullWidth", iconOptions: { iconColor: "rgba(0, 0, 0, 0.45)", iconSize: 18, iconType: "default" }, inputFont: { fontFamily: '"Geist", "Geist Placeholder", sans-serif', fontSize: "16px", fontStyle: "normal", fontWeight: 400 }, placeholderOptions: { placeholderColor: "rgba(0, 0, 0, 0.4)", placeholderText: "Search..." }, textColor: "rgb(51, 51, 51)" }, layoutId: "e1vFUka05__Yib4Up2xY", modalOptions: { backgroundColor: "rgb(255, 255, 255)", borderRadius: 16, heightIsStatic: true, heightTransition: { damping: 60, delay: 0, mass: 1, stiffness: 800, type: "spring" }, layoutType: "QuickMenu", shadow: { blur: 40, color: "rgba(0, 0, 0, 0.2)", spread: 0, x: 0, y: 20 }, top: 0, width: 500 }, resultOptions: { itemType: "fullWidth", subtitleOptions: { subtitleColor: "rgba(0, 0, 0, 0.4)", subtitleFont: {}, subtitleType: "path" }, titleColor: "rgb(51, 51, 51)", titleFont: {}, titleType: "h1" }, style: { height: "100%", width: "100%" }, width: "100%" }) }) }), isDisplayed1() && /* @__PURE__ */ _jsx20(ComponentViewportProvider6, { height: 32, y: (componentViewport?.y || 0) + 0 + 0 + 16 + 0, children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-1ephj7f-container", layoutDependency, layoutId: "e1vFUka05__aTrvEwWsz-container", nodeId: "aTrvEwWsz", rendersWithMotion: true, scopeId: "e1vFUka05", children: /* @__PURE__ */ _jsx20(Wq_yc4GsM_default, { C0dmAOVj8: UvPxI2Cnv_default, height: "100%", id: "aTrvEwWsz", layoutId: "e1vFUka05__aTrvEwWsz", qXdMjaA7O: false, width: "100%", ...addPropertyOverrides9({ YO7D0E5Zi: { jmwkLyRss: void 0 } }, baseVariant, gestureVariant) }) }) }), isDisplayed1() && /* @__PURE__ */ _jsx20(ComponentViewportProvider6, { height: 32, y: (componentViewport?.y || 0) + 0 + 0 + 16 + 0, children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-f23h4g-container", layoutDependency, layoutId: "e1vFUka05__XWsIDUkd4-container", nodeId: "XWsIDUkd4", rendersWithMotion: true, scopeId: "e1vFUka05", children: /* @__PURE__ */ _jsx20(Wq_yc4GsM_default, { C0dmAOVj8: JfaLoQZWi_default, height: "100%", id: "XWsIDUkd4", layoutId: "e1vFUka05__XWsIDUkd4", qXdMjaA7O: false, width: "100%", ...addPropertyOverrides9({ YO7D0E5Zi: { jmwkLyRss: void 0 } }, baseVariant, gestureVariant) }) }) }), isDisplayed2() && /* @__PURE__ */ _jsx20(motion20.div, { className: "framer-1tulul2", "data-framer-name": "Mobile Menu Icon", layoutDependency, layoutId: "e1vFUka05__WBav9mBIQ", ...addPropertyOverrides9({ cb5_AxI8e: { "data-highlight": true, onTap: onTap1u6gf8b }, YO7D0E5Zi: { "data-highlight": true, onTap: onTapqbstws } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx20(Instance2, { animated: true, className: "framer-vrn8mc", Component: itu1soPCZ_default, layoutDependency, layoutId: "e1vFUka05__h19DBnsG8", style: { "--1m6trwb": 0, "--21h8s6": "rgb(0, 0, 0)", "--pgex8v": 2 }, ...addPropertyOverrides9({ YO7D0E5Zi: { Component: q95pf4lLL_default } }, baseVariant, gestureVariant) }) })] })] }), isDisplayed3() && /* @__PURE__ */ _jsx20(ComponentViewportProvider6, { height: 325, width: `min(${componentViewport?.width || "100vw"}, 1200px)`, y: (componentViewport?.y || 0) + 0 + 64, children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-dbof2v-container", layoutDependency, layoutId: "e1vFUka05__gAPIpMrUc-container", nodeId: "gAPIpMrUc", rendersWithMotion: true, scopeId: "e1vFUka05", style: { opacity: 1 }, variants: { cb5_AxI8e: { opacity: 0 } }, children: /* @__PURE__ */ _jsx20(xfttPphNl_default, { height: "100%", id: "gAPIpMrUc", layoutId: "e1vFUka05__gAPIpMrUc", style: { maxWidth: "100%", width: "100%" }, UxUlZSy6z: UxUlZSy6z15t4kde, variant: matchVariant("P0CC2cO6u"), width: "100%", ...addPropertyOverrides9({ cb5_AxI8e: { UxUlZSy6z: void 0, variant: matchVariant("HP7XaJ4f7") }, YO7D0E5Zi: { MW82Yr8hk: MW82Yr8hkqbstws, UxUlZSy6z: void 0, variant: matchVariant("HP7XaJ4f7") } }, baseVariant, gestureVariant) }) }) }), isDisplayed4() && /* @__PURE__ */ _jsx20(ComponentViewportProvider6, { height: 360, width: `min(${componentViewport?.width || "100vw"}, 1200px)`, y: (componentViewport?.y || 0) + 0 + 389, ...addPropertyOverrides9({ HUjJWBAL_: { y: (componentViewport?.y || 0) + 0 + 64 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-1t5lscx-container", layoutDependency, layoutId: "e1vFUka05__DbXWIsBp1-container", nodeId: "DbXWIsBp1", rendersWithMotion: true, scopeId: "e1vFUka05", style: { opacity: 1 }, variants: { cb5_AxI8e: { opacity: 0 } }, children: /* @__PURE__ */ _jsx20(c8o9SH5Pr_default, { height: "100%", id: "DbXWIsBp1", layoutId: "e1vFUka05__DbXWIsBp1", style: { maxWidth: "100%", width: "100%" }, UxUlZSy6z: UxUlZSy6z15t4kde, variant: matchVariant("shKZfIBF2"), width: "100%", ...addPropertyOverrides9({ cb5_AxI8e: { UxUlZSy6z: void 0, variant: matchVariant("O563gik_Q") }, YO7D0E5Zi: { MW82Yr8hk: MW82Yr8hkqbstws, UxUlZSy6z: void 0, variant: matchVariant("O563gik_Q") } }, baseVariant, gestureVariant) }) }) }), isDisplayed5() && /* @__PURE__ */ _jsx20(ComponentViewportProvider6, { height: 360, width: `min(${componentViewport?.width || "100vw"}, 1200px)`, y: (componentViewport?.y || 0) + 0 + 749, ...addPropertyOverrides9({ exC0iftiH: { y: (componentViewport?.y || 0) + 0 + 64 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-wqd308-container", layoutDependency, layoutId: "e1vFUka05__mnf2UjIzn-container", nodeId: "mnf2UjIzn", rendersWithMotion: true, scopeId: "e1vFUka05", style: { opacity: 1 }, variants: { cb5_AxI8e: { opacity: 0 } }, children: /* @__PURE__ */ _jsx20(eWbC_MfEi_default, { height: "100%", id: "mnf2UjIzn", layoutId: "e1vFUka05__mnf2UjIzn", style: { maxWidth: "100%", width: "100%" }, UxUlZSy6z: UxUlZSy6z15t4kde, variant: matchVariant("TNlf4U32B"), width: "100%", ...addPropertyOverrides9({ cb5_AxI8e: { UxUlZSy6z: void 0, variant: matchVariant("T67nWYtyt") }, YO7D0E5Zi: { MW82Yr8hk: MW82Yr8hkqbstws, UxUlZSy6z: void 0, variant: matchVariant("T67nWYtyt") } }, baseVariant, gestureVariant) }) }) }), isDisplayed6() && /* @__PURE__ */ _jsx20(ComponentViewportProvider6, { height: 290, width: `min(${componentViewport?.width || "100vw"}, 1200px)`, y: (componentViewport?.y || 0) + 0 + 1109, ...addPropertyOverrides9({ aI713qdgP: { y: (componentViewport?.y || 0) + 0 + 64 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-1r4xt4y-container", layoutDependency, layoutId: "e1vFUka05__KKZxdB1pW-container", nodeId: "KKZxdB1pW", rendersWithMotion: true, scopeId: "e1vFUka05", style: { opacity: 1 }, variants: { cb5_AxI8e: { opacity: 0 } }, children: /* @__PURE__ */ _jsx20(zc3OAab8E_default, { height: "100%", id: "KKZxdB1pW", layoutId: "e1vFUka05__KKZxdB1pW", style: { maxWidth: "100%", width: "100%" }, UxUlZSy6z: UxUlZSy6z15t4kde, variant: matchVariant("EYf70W21r"), width: "100%", ...addPropertyOverrides9({ cb5_AxI8e: { UxUlZSy6z: void 0, variant: matchVariant("BFuRwmVWD") }, YO7D0E5Zi: { MW82Yr8hk: MW82Yr8hkqbstws, UxUlZSy6z: void 0, variant: matchVariant("BFuRwmVWD") } }, baseVariant, gestureVariant) }) }) }), isDisplayed7() && /* @__PURE__ */ _jsx20(ComponentViewportProvider6, { height: 255, width: `min(${componentViewport?.width || "100vw"}, 1200px)`, y: (componentViewport?.y || 0) + 0 + 1399, ...addPropertyOverrides9({ l_N4piQ82: { y: (componentViewport?.y || 0) + 0 + 64 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx20(SmartComponentScopedContainer6, { className: "framer-1jcy3gz-container", "data-framer-name": "Sale Menu", layoutDependency, layoutId: "e1vFUka05__i68b21dYP-container", name: "Sale Menu", nodeId: "i68b21dYP", rendersWithMotion: true, scopeId: "e1vFUka05", style: { opacity: 1 }, variants: { cb5_AxI8e: { opacity: 0 } }, children: /* @__PURE__ */ _jsx20(oRNeXEz8O_default, { height: "100%", id: "i68b21dYP", layoutId: "e1vFUka05__i68b21dYP", name: "Sale Menu", style: { maxWidth: "100%", width: "100%" }, UxUlZSy6z: UxUlZSy6z15t4kde, variant: matchVariant("NjbypYOoz"), width: "100%", ...addPropertyOverrides9({ cb5_AxI8e: { UxUlZSy6z: void 0, variant: matchVariant("pCp9gT1DB") }, YO7D0E5Zi: { MW82Yr8hk: MW82Yr8hkqbstws, UxUlZSy6z: void 0, variant: matchVariant("pCp9gT1DB") } }, baseVariant, gestureVariant) }) }) })] }) }) }) });
});
var css14 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-L5CE9.framer-zkg2ew, .framer-L5CE9 .framer-zkg2ew { display: block; }", ".framer-L5CE9.framer-1v4tj4n { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-L5CE9 .framer-9koh9s { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; max-width: 1700px; overflow: var(--overflow-clip-fallback, clip); padding: 16px; position: relative; width: 100%; }", ".framer-L5CE9 .framer-7zbjo3 { align-content: center; align-items: center; display: flex; flex: 1 0 0px; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 1px; }", ".framer-L5CE9 .framer-1to7nw8 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 6px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; text-decoration: none; width: min-content; }", ".framer-L5CE9 .framer-1lya0le { height: 20px; position: relative; width: 25px; }", ".framer-L5CE9 .framer-om53mm { height: 17px; left: 3px; position: absolute; top: 4px; width: 23px; }", ".framer-L5CE9 .framer-1axo765 { height: 17px; left: 0px; position: absolute; top: 0px; width: 23px; }", ".framer-L5CE9 .framer-13yp8ww { height: 11px; left: 8px; position: absolute; top: 5px; width: 10px; }", ".framer-L5CE9 .framer-45ak9m { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 16px; height: min-content; justify-content: flex-start; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: min-content; }", ".framer-L5CE9 .framer-11vnknx-container, .framer-L5CE9 .framer-1fs3pwt-container, .framer-L5CE9 .framer-17q7mmh-container, .framer-L5CE9 .framer-er5ub4-container, .framer-L5CE9 .framer-1i66ax3-container, .framer-L5CE9 .framer-1ephj7f-container, .framer-L5CE9 .framer-f23h4g-container { flex: none; height: auto; position: relative; width: auto; }", ".framer-L5CE9 .framer-180rldw { align-content: center; align-items: center; display: flex; flex: 1 0 0px; flex-direction: row; flex-wrap: nowrap; gap: 8px; height: min-content; justify-content: flex-end; overflow: visible; padding: 0px; position: relative; width: 1px; }", ".framer-L5CE9 .framer-1da9oy8-container { cursor: pointer; flex: none; height: 32px; position: relative; width: 32px; }", ".framer-L5CE9 .framer-1tulul2 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 6px; position: relative; width: min-content; }", ".framer-L5CE9 .framer-vrn8mc { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 20px); position: relative; width: 20px; }", ".framer-L5CE9 .framer-dbof2v-container, .framer-L5CE9 .framer-1t5lscx-container, .framer-L5CE9 .framer-wqd308-container, .framer-L5CE9 .framer-1r4xt4y-container, .framer-L5CE9 .framer-1jcy3gz-container { flex: none; height: auto; max-width: 1200px; position: relative; width: 100%; }", ".framer-L5CE9.framer-v-81y8v1 .framer-1da9oy8-container { order: 0; }", ".framer-L5CE9.framer-v-81y8v1 .framer-1ephj7f-container { order: 1; }", ".framer-L5CE9.framer-v-81y8v1 .framer-f23h4g-container { order: 2; }", ".framer-L5CE9.framer-v-1bbkjhl.framer-1v4tj4n { max-height: calc(var(--framer-viewport-height, 100vh) * 1); min-height: calc(var(--framer-viewport-height, 100vh) * 1); overflow: auto; overscroll-behavior: contain; width: 100%; }", ".framer-L5CE9.framer-v-1bbkjhl .framer-1to7nw8, .framer-L5CE9.framer-v-1bbkjhl .framer-1tulul2, .framer-L5CE9.framer-v-ll7v3x .framer-1tulul2 { cursor: pointer; }", ".framer-L5CE9.framer-v-ll7v3x.framer-1v4tj4n { height: auto; width: 100%; }"];
var Framere1vFUka05 = withCSS15(Component14, css14, "framer-L5CE9");
var e1vFUka05_default = Framere1vFUka05;
Framere1vFUka05.displayName = "Full Width Nav";
Framere1vFUka05.defaultProps = { height: 1653, width: 1200 };
addPropertyControls15(Framere1vFUka05, { variant: { options: ["HihUXUAoM", "QwwWPUrYq", "pD7BcMK82", "HUjJWBAL_", "exC0iftiH", "aI713qdgP", "l_N4piQ82", "YO7D0E5Zi", "cb5_AxI8e"], optionTitles: ["Make edits here", "Closed", "New", "Men", "Women", "Kids", "Sale", "Phone Open", "Phone Closed"], title: "Variant", type: ControlType15.Enum } });
addFonts9(Framere1vFUka05, [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", source: "google", style: "normal", uiFamilyName: "Geist", url: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RnOM4mJPby1QNtA.woff2", weight: "400" }] }, ...NavItemFonts, ...SearchFonts, ...IconFonts, ...NewMenuFonts, ...MenMenuFonts, ...WomenMenuFonts, ...KidsMenuFonts, ...SaleMenuFonts], { supportsExplicitInterCodegen: true });
Framere1vFUka05.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader6(YUfI10wRI_default, {}, context), forwardLoader6(Wq_yc4GsM_default, {}, context), forwardLoader6(xfttPphNl_default, {}, context), forwardLoader6(c8o9SH5Pr_default, {}, context), forwardLoader6(eWbC_MfEi_default, {}, context), forwardLoader6(zc3OAab8E_default, {}, context), forwardLoader6(oRNeXEz8O_default, {}, context)]);
} };
var __FramerMetadata__ = { "exports": { "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "default": { "type": "reactComponent", "name": "Framere1vFUka05", "slots": [], "annotations": { "framerDisplayContentsDiv": "false", "framerContractVersion": "1", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]},"QwwWPUrYq":{"layout":["fixed","auto"]},"pD7BcMK82":{"layout":["fixed","auto"]},"HUjJWBAL_":{"layout":["fixed","auto"]},"exC0iftiH":{"layout":["fixed","auto"]},"aI713qdgP":{"layout":["fixed","auto"]},"l_N4piQ82":{"layout":["fixed","auto"]},"YO7D0E5Zi":{"layout":["fixed","auto"],"constraints":[null,null,"100vh","100vh"]},"cb5_AxI8e":{"layout":["fixed","fixed"]}}}', "framerAutoSizeImages": "true", "framerImmutableVariables": "true", "framerIntrinsicWidth": "1200", "framerColorSyntax": "true", "framerIntrinsicHeight": "1653", "framerComponentViewportWidth": "true" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  e1vFUka05_default as default
};
