var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// http-url:https://framerusercontent.com/modules/Ujtf1QzkNNzjjasicPdI/KFLGkTOZAmDL4R2pJ9Hn/SUOQExBkZ.js
import { jsx as _jsx6, jsxs as _jsxs2 } from "react/jsx-runtime";
import { addFonts as addFonts3, addPropertyControls as addPropertyControls5, ComponentViewportProvider as ComponentViewportProvider2, ControlType as ControlType5, cx as cx5, forwardLoader as forwardLoader2, getFonts as getFonts2, getFontsFromSharedStyle as getFontsFromSharedStyle2, ResolveLinks, RichText as RichText2, SmartComponentScopedContainer as SmartComponentScopedContainer2, useComponentViewport as useComponentViewport3, useLocaleInfo as useLocaleInfo3, useRouter, useVariantState as useVariantState3, withCSS as withCSS5 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup3, motion as motion5, MotionConfigContext as MotionConfigContext3 } from "framer-motion";
import * as React5 from "react";
import { useRef as useRef3 } from "react";

// http-url:https://framerusercontent.com/modules/pViJj926CBy444h3AYfq/yXDe2VVQ9pDsXbJlmrXJ/CT_DBbR5R.js
import { fontStore } from "./_framer-runtime.js";
fontStore.loadFonts(["Inter-Variable", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNTUw", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNTUw", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNTUw"]);
var variationAxes = [{ defaultValue: 14, maxValue: 32, minValue: 14, name: "Optical size", tag: "opsz" }, { defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
var fonts = [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/mYcqTSergLb16PdbJJQMl9ebYm4.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/ZRl8AlxwsX1m7xS1eJCiSPbztg.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/nhSQpBRqFmXNUBY2p5SENQ8NplQ.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/DYHjxG0qXjopUuruoacfl5SA.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/s7NH6sl7w4NU984r5hcmo1tPSYo.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/7lw0VWkeXrGYJT05oB3DsFy8BaY.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/wx5nfqEgOXnxuFaxB0Mn9OhmcZA.woff2", variationAxes, weight: "400" }] }];
var css = ['.framer-fQ51O .framer-styles-preset-5rfdkx:not(.rich-text-wrapper), .framer-fQ51O .framer-styles-preset-5rfdkx.rich-text-wrapper p { --framer-font-family: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 14px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: normal; --framer-font-style-italic: normal; --framer-font-variation-axes: "opsz" 14, "wght" 550; --framer-font-variation-axes-bold: "opsz" 14, "wght" 550; --framer-font-variation-axes-bold-italic: "opsz" 14, "wght" 550; --framer-font-variation-axes-italic: "opsz" 14, "wght" 550; --framer-font-weight: 400; --framer-font-weight-bold: 400; --framer-font-weight-bold-italic: 400; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.02em; --framer-line-height: 1.5em; --framer-paragraph-spacing: 20px; --framer-text-alignment: left; --framer-text-color: var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className = "framer-fQ51O";

// http-url:https://framerusercontent.com/modules/rvQmVwf0GZo8cRTnvMj1/wzFMOfI6Ln0UDwWoBHVL/WIiaJAMT7.js
import { fontStore as fontStore2 } from "./_framer-runtime.js";
fontStore2.loadFonts(["Inter-Variable", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNDI1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNDI1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNDI1"]);
var variationAxes2 = [{ defaultValue: 14, maxValue: 32, minValue: 14, name: "Optical size", tag: "opsz" }, { defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
var fonts2 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/mYcqTSergLb16PdbJJQMl9ebYm4.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/ZRl8AlxwsX1m7xS1eJCiSPbztg.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/nhSQpBRqFmXNUBY2p5SENQ8NplQ.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/DYHjxG0qXjopUuruoacfl5SA.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/s7NH6sl7w4NU984r5hcmo1tPSYo.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/7lw0VWkeXrGYJT05oB3DsFy8BaY.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/wx5nfqEgOXnxuFaxB0Mn9OhmcZA.woff2", variationAxes: variationAxes2, weight: "400" }] }];
var css2 = ['.framer-dy7z7 .framer-styles-preset-y1k16k:not(.rich-text-wrapper), .framer-dy7z7 .framer-styles-preset-y1k16k.rich-text-wrapper p { --framer-font-family: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 13px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: normal; --framer-font-style-italic: normal; --framer-font-variation-axes: "opsz" 14, "wght" 425; --framer-font-variation-axes-bold: "opsz" 14, "wght" 425; --framer-font-variation-axes-bold-italic: "opsz" 14, "wght" 425; --framer-font-variation-axes-italic: "opsz" 14, "wght" 425; --framer-font-weight: 400; --framer-font-weight-bold: 400; --framer-font-weight-bold-italic: 400; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.02em; --framer-line-height: 1.5em; --framer-paragraph-spacing: 20px; --framer-text-alignment: center; --framer-text-color: var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className2 = "framer-dy7z7";

// http-url:https://framerusercontent.com/modules/wX9fklQeuFFuj3ZuGcFZ/nr5aMuFmX2ws7YHLuqfA/tiRz_Cwp2.js
import { jsx as _jsx5, jsxs as _jsxs } from "react/jsx-runtime";
import { addFonts as addFonts2, addPropertyControls as addPropertyControls4, ComponentViewportProvider, ControlType as ControlType4, cx as cx4, forwardLoader, getFonts, getFontsFromSharedStyle, Link, RichText, SmartComponentScopedContainer, useActiveVariantCallback, useComponentViewport as useComponentViewport2, useLocaleInfo as useLocaleInfo2, useOnVariantChange, useVariantState as useVariantState2, withCodeBoundaryForOverrides, withCSS as withCSS4, withFX, withMappedReactProps, withOptimizedAppearEffect } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup2, motion as motion4, MotionConfigContext as MotionConfigContext2 } from "framer-motion";
import * as React4 from "react";
import { useRef as useRef2 } from "react";

// http-url:https://framerusercontent.com/modules/pkSyBYBJkudkuOnOyZKd/FhZ0BujM5yzNnqzwftJp/ShoeVariant.js
import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from "react";

// http-url:https://framerusercontent.com/modules/vj7bFUjvEQFgEzNBkdoG/vf3CKm378wlVcBk7IhSU/createStore.js
import { useState, useEffect } from "react";
import { Data, useObserveData } from "./_framer-runtime.js";
function createStore(state1) {
  const dataStore = Data({ state: Object.freeze({ ...state1 }) });
  const setDataStore = (newState) => {
    if (typeof newState === "function") {
      newState = newState(dataStore.state);
    }
    dataStore.state = Object.freeze({ ...dataStore.state, ...newState });
  };
  let storeState = typeof state1 === "object" ? Object.freeze({ ...state1 }) : state1;
  const storeSetters = /* @__PURE__ */ new Set();
  const setStoreState = (newState) => {
    if (typeof newState === "function") {
      newState = newState(storeState);
    }
    storeState = typeof newState === "object" ? Object.freeze({ ...storeState, ...newState }) : newState;
    storeSetters.forEach((setter) => setter(storeState));
  };
  function useStore2() {
    const [state, setState] = useState(storeState);
    useEffect(() => {
      storeSetters.add(setState);
      return () => storeSetters.delete(setState);
    }, []);
    if (useObserveData() === true) {
      useObserveData();
      return [dataStore.state, setDataStore];
    } else {
      return [state, setStoreState];
    }
  }
  return useStore2;
}

// http-url:https://framerusercontent.com/modules/pkSyBYBJkudkuOnOyZKd/FhZ0BujM5yzNnqzwftJp/ShoeVariant.js
var useStore = createStore({ variant: "beige" });
function withVariant(Component6, variantName) {
  return /* @__PURE__ */ forwardRef((props, ref) => {
    const [store] = useStore();
    return /* @__PURE__ */ _jsx(Component6, { ref, ...props, variant: store.variant });
  });
}

// http-url:https://framerusercontent.com/modules/pmoggTWmhxccZ8VWFvMy/CwgfCjbZuajs7tE5WxYA/ocOde6Lm9.js
import { fontStore as fontStore3 } from "./_framer-runtime.js";
fontStore3.loadFonts(["Inter-Variable", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNjI1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNjI1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNjI1"]);
var variationAxes3 = [{ defaultValue: 14, maxValue: 32, minValue: 14, name: "Optical size", tag: "opsz" }, { defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
var fonts3 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/mYcqTSergLb16PdbJJQMl9ebYm4.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/ZRl8AlxwsX1m7xS1eJCiSPbztg.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/nhSQpBRqFmXNUBY2p5SENQ8NplQ.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/DYHjxG0qXjopUuruoacfl5SA.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/s7NH6sl7w4NU984r5hcmo1tPSYo.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/7lw0VWkeXrGYJT05oB3DsFy8BaY.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/wx5nfqEgOXnxuFaxB0Mn9OhmcZA.woff2", variationAxes: variationAxes3, weight: "400" }] }];
var css3 = ['.framer-hoAO6 .framer-styles-preset-1v7qm6:not(.rich-text-wrapper), .framer-hoAO6 .framer-styles-preset-1v7qm6.rich-text-wrapper p { --framer-font-family: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 13px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: normal; --framer-font-style-italic: normal; --framer-font-variation-axes: "opsz" 14, "wght" 625; --framer-font-variation-axes-bold: "opsz" 14, "wght" 625; --framer-font-variation-axes-bold-italic: "opsz" 14, "wght" 625; --framer-font-variation-axes-italic: "opsz" 14, "wght" 625; --framer-font-weight: 400; --framer-font-weight-bold: 400; --framer-font-weight-bold-italic: 400; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.04em; --framer-line-height: 1.2em; --framer-paragraph-spacing: 20px; --framer-text-alignment: center; --framer-text-color: var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className3 = "framer-hoAO6";

// http-url:https://framerusercontent.com/modules/gea1qki17iB30fzhQx5Z/gJ2ySUGLAZiBqOiPJpxU/nurrKhgTm.js
import { jsx as _jsx2 } from "react/jsx-runtime";
import { addPropertyControls, ControlType, cx, motion, withCSS } from "./_framer-runtime.js";
import * as React from "react";
import { forwardRef as forwardRef3 } from "react";
var mask = `url('data:image/svg+xml,<svg display="block" role="presentation" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M 0 20 C 0 8.954 8.954 0 20 0 L 70 0 C 81.046 0 90 8.954 90 20 L 90 70 C 90 81.046 81.046 90 70 90 L 20 90 C 8.954 90 0 81.046 0 70 Z" fill="transparent" height="90px" id="MbysBnH8U" stroke-dasharray="0" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="4" stroke-width="9" stroke="var(--118a55, var(--token-20891e9f-0dd5-476a-bdd1-5f7056109a89, rgb(0, 0, 0)))" transform="translate(5 5)" width="90px"/><path d="M 44.857 4.984 L 44.857 8.309 C 44.857 17.483 37.42 24.921 28.245 24.921 L 26.58 24.921 C 17.406 24.921 9.968 17.483 9.968 8.309 L 9.968 4.984 C 9.968 2.231 7.737 0 4.984 0 C 2.231 0 0 2.231 0 4.984 L 0 8.049 C 0 22.872 12.017 34.889 26.84 34.889 L 27.986 34.889 C 42.809 34.889 54.826 22.872 54.826 8.049 L 54.826 4.984 C 54.826 2.231 52.594 0 49.841 0 C 47.089 0 44.857 2.231 44.857 4.984 Z" fill="var(--118a55, var(--token-20891e9f-0dd5-476a-bdd1-5f7056109a89, rgb(0, 0, 0)))" height="34.888999999999996px" id="yJEqThAF9" transform="translate(22.5 24.222)" width="54.82557142857195px"/></svg>') alpha no-repeat center / auto var(--framer-icon-mask-mode, add), var(--framer-icon-mask, none)`;
var SVG = /* @__PURE__ */ forwardRef3((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx2(motion.div, { ...rest, layoutId, ref }) : /* @__PURE__ */ _jsx2("div", { ...rest, ref });
});
var getProps = ({ color, height, id, width, ...props }) => {
  return { ...props, GaDHsaDms: color ?? props.GaDHsaDms ?? "var(--token-20891e9f-0dd5-476a-bdd1-5f7056109a89, rgb(0, 0, 0))" };
};
var Component = /* @__PURE__ */ React.forwardRef(function(props, ref) {
  const { style, className: className4, layoutId, variant, GaDHsaDms, ...restProps } = getProps(props);
  return /* @__PURE__ */ _jsx2(SVG, { ...restProps, className: cx("framer-3ppw5", className4), layoutId, ref, style: { "--118a55": GaDHsaDms, ...style } });
});
var css4 = [`.framer-3ppw5 { -webkit-mask: ${mask}; aspect-ratio: 1; background-color: var(--118a55); mask: ${mask}; width: 100px; }`];
var Icon = withCSS(Component, css4, "framer-3ppw5");
Icon.displayName = "Shopping Bag";
var nurrKhgTm_default = Icon;
addPropertyControls(Icon, { GaDHsaDms: { defaultValue: 'var(--token-20891e9f-0dd5-476a-bdd1-5f7056109a89, rgb(0, 0, 0)) /* {"name":"Icon Black"} */', hidden: false, title: "Color", type: ControlType.Color } });

// http-url:https://framerusercontent.com/modules/Fs5VQrVyKoruA9COVjYx/V45WQoTRvnjjKwxyThBd/wggGXhZaC.js
import { jsx as _jsx3 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls2, ControlType as ControlType2, cx as cx2, motion as motion2, withCSS as withCSS2 } from "./_framer-runtime.js";
import * as React2 from "react";
import { forwardRef as forwardRef5 } from "react";
var mask2 = `url('data:image/svg+xml,<svg display="block" role="presentation" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><path d="M 0 39.757 L 38.539 1.218 C 39.317 0.438 40.373 0 41.475 0 C 42.577 0 43.633 0.438 44.411 1.218 L 82.95 39.757 M 41.475 14.872 L 41.475 81.232" fill="transparent" height="81.23205219268812px" id="jOHsmej4_" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="16.59" stroke="var(--118a55, var(--token-20891e9f-0dd5-476a-bdd1-5f7056109a89, rgb(0, 0, 0)))" transform="translate(8.5 9.51) rotate(90 41.475 40.616)" width="82.95000000000005px"/></svg>') alpha no-repeat center / auto var(--framer-icon-mask-mode, add), var(--framer-icon-mask, none)`;
var SVG2 = /* @__PURE__ */ forwardRef5((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx3(motion2.div, { ...rest, layoutId, ref }) : /* @__PURE__ */ _jsx3("div", { ...rest, ref });
});
var getProps2 = ({ color, height, id, width, ...props }) => {
  return { ...props, GaDHsaDms: color ?? props.GaDHsaDms ?? "var(--token-20891e9f-0dd5-476a-bdd1-5f7056109a89, rgb(0, 0, 0))" };
};
var Component2 = /* @__PURE__ */ React2.forwardRef(function(props, ref) {
  const { style, className: className4, layoutId, variant, GaDHsaDms, ...restProps } = getProps2(props);
  return /* @__PURE__ */ _jsx3(SVG2, { ...restProps, className: cx2("framer-ZtDxP", className4), layoutId, ref, style: { "--118a55": GaDHsaDms, ...style } });
});
var css5 = [`.framer-ZtDxP { -webkit-mask: ${mask2}; aspect-ratio: 1; background-color: var(--118a55); mask: ${mask2}; width: 100px; }`];
var Icon2 = withCSS2(Component2, css5, "framer-ZtDxP");
Icon2.displayName = "Arrow Right";
var wggGXhZaC_default = Icon2;
addPropertyControls2(Icon2, { GaDHsaDms: { defaultValue: 'var(--token-20891e9f-0dd5-476a-bdd1-5f7056109a89, rgb(0, 0, 0)) /* {"name":"Icon Black"} */', hidden: false, title: "Color", type: ControlType2.Color } });

// http-url:https://framerusercontent.com/modules/fl44L3j47KSn0MeEnTPZ/LhWXjmG2eJqNMuhM2UhA/F6mcHeKS5.js
var F6mcHeKS5_exports = {};
__export(F6mcHeKS5_exports, {
  __FramerMetadata__: () => __FramerMetadata__,
  default: () => F6mcHeKS5_default
});
import { jsx as _jsx4 } from "react/jsx-runtime";
import { addFonts, addPropertyControls as addPropertyControls3, ControlType as ControlType3, cx as cx3, useComponentViewport, useLocaleInfo, useVariantState, withCSS as withCSS3 } from "./_framer-runtime.js";
import { LayoutGroup, motion as motion3, MotionConfigContext } from "framer-motion";
import * as React3 from "react";
import { useRef } from "react";
var cycleOrder = ["AOqf1darv", "t9Opis00b", "Qs7gZYDbr"];
var serializationHash = "framer-Ia9xc";
var variantClassNames = { AOqf1darv: "framer-v-1ije16d", Qs7gZYDbr: "framer-v-1pq4dpn", t9Opis00b: "framer-v-1i62q2t" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition = ({ value, children }) => {
  const config = React3.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React3.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx4(MotionConfigContext.Provider, { value: contextValue, children });
};
var humanReadableVariantMap = { "Sky Blue": "Qs7gZYDbr", Beige: "AOqf1darv", Orange: "t9Opis00b" };
var Variants = motion3.create(React3.Fragment);
var getProps3 = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "AOqf1darv" };
};
var createLayoutDependency = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component3 = /* @__PURE__ */ React3.forwardRef(function(props, ref) {
  const fallbackRef = useRef(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React3.useId();
  const { activeLocale, setLocale } = useLocaleInfo();
  const componentViewport = useComponentViewport();
  const { style, className: className4, layoutId, variant, ...restProps } = getProps3(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "AOqf1darv", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx3(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx4(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx4(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx4(Transition, { value: transition1, children: /* @__PURE__ */ _jsx4(motion3.div, { ...restProps, ...gestureHandlers, className: cx3(scopingClassNames, "framer-1ije16d", className4, classNames), "data-framer-name": "Beige", layoutDependency, layoutId: "HeroShoeCTA__AOqf1darv", ref: refBinding, style: { backgroundColor: "var(--token-388df0dc-be7c-4b9c-99ff-20b03d80e91a, rgb(194, 169, 134))", borderBottomLeftRadius: "100%", borderBottomRightRadius: "100%", borderTopLeftRadius: "100%", borderTopRightRadius: "100%", ...style }, variants: { Qs7gZYDbr: { backgroundColor: "var(--token-3ee2d369-5709-489b-affd-4ddf13e2421b, rgb(145, 217, 255))" }, t9Opis00b: { backgroundColor: "var(--token-0811ed08-71ff-4889-9a2e-53a63a755add, rgb(255, 195, 122))" } }, ...addPropertyOverrides({ Qs7gZYDbr: { "data-framer-name": "Sky Blue" }, t9Opis00b: { "data-framer-name": "Orange" } }, baseVariant, gestureVariant) }) }) }) });
});
var css6 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-Ia9xc.framer-8vak4o, .framer-Ia9xc .framer-8vak4o { display: block; }", ".framer-Ia9xc.framer-1ije16d { height: auto; overflow: var(--overflow-clip-fallback, clip); position: relative; width: 100%; will-change: var(--framer-will-change-override, transform); }"];
var FramerF6mcHeKS5 = withCSS3(Component3, css6, "framer-Ia9xc");
var F6mcHeKS5_default = FramerF6mcHeKS5;
FramerF6mcHeKS5.displayName = "Buy Now Button Bubble";
FramerF6mcHeKS5.defaultProps = { height: 111, width: 111 };
addPropertyControls3(FramerF6mcHeKS5, { variant: { options: ["AOqf1darv", "t9Opis00b", "Qs7gZYDbr"], optionTitles: ["Beige", "Orange", "Sky Blue"], title: "Variant", type: ControlType3.Enum } });
addFonts(FramerF6mcHeKS5, [{ explicitInter: true, fonts: [] }], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "default": { "type": "reactComponent", "name": "FramerF6mcHeKS5", "slots": [], "annotations": { "framerImmutableVariables": "true", "framerIntrinsicHeight": "111", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","fixed"]},"t9Opis00b":{"layout":["fixed","fixed"]},"Qs7gZYDbr":{"layout":["fixed","fixed"]}}}', "framerContractVersion": "1", "framerAutoSizeImages": "true", "framerColorSyntax": "true", "framerDisplayContentsDiv": "false", "framerIntrinsicWidth": "111", "framerComponentViewportWidth": "true" } }, "__FramerMetadata__": { "type": "variable" } } };

// http-url:https://framerusercontent.com/modules/wX9fklQeuFFuj3ZuGcFZ/nr5aMuFmX2ws7YHLuqfA/tiRz_Cwp2.js
var ShoppingBagFonts = getFonts(nurrKhgTm_default);
var ArrowRightFonts = getFonts(wggGXhZaC_default);
var ArrowRightWithFXWithOptimizedAppearEffect = withOptimizedAppearEffect(withFX(wggGXhZaC_default));
var BuyNowButtonBubbleFonts = getFonts(F6mcHeKS5_default);
var BuyNowButtonBubbleWithVariant1akthtyWithMappedReactProps19q51e4 = withMappedReactProps(withCodeBoundaryForOverrides(F6mcHeKS5_default, { nodeId: "sqQgy4iLX", override: withVariant, scopeId: "tiRz_Cwp2" }), F6mcHeKS5_exports);
var enabledGestures = { DUh9czCMs: { pressed: true } };
var cycleOrder2 = ["hB5sJux9_", "rO5JFb8be", "XzOanXB0Z", "DUh9czCMs"];
var serializationHash2 = "framer-qJH8W";
var variantClassNames2 = { DUh9czCMs: "framer-v-bmi4up", hB5sJux9_: "framer-v-oonrc8", rO5JFb8be: "framer-v-1sjdnct", XzOanXB0Z: "framer-v-1ta2x5h" };
function addPropertyOverrides2(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition12 = { duration: 0, type: "tween" };
var transition2 = { bounce: 0, delay: 0, duration: 0.4, type: "spring" };
var animation = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition2, x: 0, y: 0 };
var animation1 = { opacity: 1e-3, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, x: -20, y: 0 };
var matchVariant = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var Transition2 = ({ value, children }) => {
  const config = React4.useContext(MotionConfigContext2);
  const transition = value ?? config.transition;
  const contextValue = React4.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx5(MotionConfigContext2.Provider, { value: contextValue, children });
};
var humanReadableVariantMap2 = { "Animated End": "XzOanXB0Z", "Animated Start": "hB5sJux9_", Animated: "rO5JFb8be", Static: "DUh9czCMs" };
var Variants2 = motion4.create(React4.Fragment);
var getProps4 = ({ height, id, link, width, ...props }) => {
  return { ...props, LtuWPY8RR: link ?? props.LtuWPY8RR, variant: humanReadableVariantMap2[props.variant] ?? props.variant ?? "hB5sJux9_" };
};
var createLayoutDependency2 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component4 = /* @__PURE__ */ React4.forwardRef(function(props, ref) {
  const fallbackRef = useRef2(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React4.useId();
  const { activeLocale, setLocale } = useLocaleInfo2();
  const componentViewport = useComponentViewport2();
  const { style, className: className4, layoutId, variant, LtuWPY8RR, ...restProps } = getProps4(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState2({ cycleOrder: cycleOrder2, defaultVariant: "hB5sJux9_", enabledGestures, ref: refBinding, variant, variantClassNames: variantClassNames2 });
  const layoutDependency = createLayoutDependency2(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback(baseVariant);
  const onMouseEnterle2gee = activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: true });
    setVariant("rO5JFb8be");
  });
  const onMouseLeave1wsil39 = activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: false });
    setVariant("XzOanXB0Z");
  });
  const onAppear16bvqbo = activeVariantCallback(async (...args) => {
    await delay(() => setVariant("hB5sJux9_", true), 400);
  });
  useOnVariantChange(baseVariant, { XzOanXB0Z: onAppear16bvqbo });
  const sharedStyleClassNames = [className3];
  const scopingClassNames = cx4(serializationHash2, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (baseVariant === "rO5JFb8be")
      return true;
    return false;
  };
  return /* @__PURE__ */ _jsx5(LayoutGroup2, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx5(Variants2, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx5(Transition2, { value: transition12, ...addPropertyOverrides2({ rO5JFb8be: { value: transition2 }, XzOanXB0Z: { value: transition2 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx5(Link, { href: LtuWPY8RR, motionChild: true, nodeId: "hB5sJux9_", openInNewTab: false, scopeId: "tiRz_Cwp2", children: /* @__PURE__ */ _jsxs(motion4.a, { ...restProps, ...gestureHandlers, className: `${cx4(scopingClassNames, "framer-oonrc8", className4, classNames)} framer-1mprnp8`, "data-framer-name": "Animated Start", "data-highlight": true, layoutDependency, layoutId: "HeroShoeCTA__hB5sJux9_", onMouseEnter: onMouseEnterle2gee, ref: refBinding, style: { backdropFilter: "blur(5px)", backgroundColor: "var(--token-0e502221-6f42-4f77-a99f-3a117329e30d, rgba(0, 0, 0, 0.2))", borderBottomLeftRadius: 1e3, borderBottomRightRadius: 1e3, borderTopLeftRadius: 1e3, borderTopRightRadius: 1e3, WebkitBackdropFilter: "blur(5px)", ...style }, variants: { "DUh9czCMs-pressed": { backgroundColor: "var(--token-e45124b5-8b43-4c5c-9f28-dedcc4dd9cdf, rgba(0, 0, 0, 0.3))" } }, ...addPropertyOverrides2({ "DUh9czCMs-pressed": { "data-framer-name": void 0, "data-highlight": void 0, onMouseEnter: void 0 }, DUh9czCMs: { "data-framer-name": "Static", "data-highlight": void 0, onMouseEnter: void 0 }, rO5JFb8be: { "data-framer-name": "Animated", onMouseLeave: onMouseLeave1wsil39 }, XzOanXB0Z: { "data-framer-name": "Animated End" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx5(nurrKhgTm_default, { animated: true, className: "framer-1lm7ara", layoutDependency, layoutId: "HeroShoeCTA__Zrt5gsQia", style: { "--118a55": "var(--token-c4652695-7f66-461d-9ec5-551c9e0af1d0, rgb(255, 255, 255))", rotate: 0 }, variants: { DUh9czCMs: { rotate: 0 }, rO5JFb8be: { rotate: -8 }, XzOanXB0Z: { rotate: 0 } } }), /* @__PURE__ */ _jsx5(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx5(React4.Fragment, { children: /* @__PURE__ */ _jsx5(motion4.p, { className: "framer-styles-preset-1v7qm6", "data-styles-preset": "ocOde6Lm9", dir: "auto", style: { "--framer-text-color": "var(--extracted-r6o4lv, var(--token-e0ec22b8-2ee9-41b9-9c9b-068af203c374, rgb(255, 255, 255)))" }, children: "Buy now" }) }), className: "framer-74k20e", fonts: ["Inter"], layoutDependency, layoutId: "HeroShoeCTA__G5V3bML4R", style: { "--extracted-r6o4lv": "var(--token-e0ec22b8-2ee9-41b9-9c9b-068af203c374, rgb(255, 255, 255))", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }), isDisplayed() && /* @__PURE__ */ _jsx5(ArrowRightWithFXWithOptimizedAppearEffect, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation, animated: true, className: "framer-186suw4", "data-framer-appear-id": "186suw4", initial: animation1, layoutDependency, layoutId: "HeroShoeCTA__tP_nrBCll", optimized: true, style: { "--118a55": "var(--token-c4652695-7f66-461d-9ec5-551c9e0af1d0, rgb(255, 255, 255))" } }), /* @__PURE__ */ _jsx5(ComponentViewportProvider, { height: 109, width: `calc(${componentViewport?.width || "100vw"} * 1.1989)`, y: (componentViewport?.y || 0) + ((componentViewport?.height || 27.5) * 1.9636363636363638 - 54.5), ...addPropertyOverrides2({ rO5JFb8be: { y: (componentViewport?.y || 0) + ((componentViewport?.height || 27.5) * 0.5090909090909093 - 54.5) }, XzOanXB0Z: { height: 108.5, y: (componentViewport?.y || 0) + ((componentViewport?.height || 27.5) * -0.9454545454545452 - 54.25) } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx5(SmartComponentScopedContainer, { className: "framer-1akthty-container", layoutDependency, layoutId: "HeroShoeCTA__sqQgy4iLX-container", nodeId: "sqQgy4iLX", rendersWithMotion: true, scopeId: "tiRz_Cwp2", children: /* @__PURE__ */ _jsx5(BuyNowButtonBubbleWithVariant1akthtyWithMappedReactProps19q51e4, { height: "100%", id: "sqQgy4iLX", layoutId: "HeroShoeCTA__sqQgy4iLX", style: { height: "100%", width: "100%" }, variant: matchVariant("AOqf1darv"), width: "100%" }) }) })] }) }) }) }) });
});
var css7 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-qJH8W.framer-1mprnp8, .framer-qJH8W .framer-1mprnp8 { display: block; }", ".framer-qJH8W.framer-oonrc8 { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 6px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 6px 12px 6px 12px; position: relative; text-decoration: none; width: min-content; will-change: var(--framer-will-change-override, transform); }", ".framer-qJH8W .framer-1lm7ara { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 12px); position: relative; width: 12px; z-index: 2; }", ".framer-qJH8W .framer-74k20e { flex: none; height: auto; position: relative; white-space: pre; width: auto; z-index: 2; }", ".framer-qJH8W .framer-186suw4 { flex: none; height: var(--framer-aspect-ratio-supported, 10px); position: relative; width: 10px; z-index: 2; }", ".framer-qJH8W .framer-1akthty-container { flex: none; height: 109px; left: calc(-60.7734806629834% - 119.88950276243094% / 2); position: absolute; top: calc(196.36363636363637% - 109px / 2); width: 120%; z-index: 1; }", ".framer-qJH8W.framer-v-1sjdnct .framer-1akthty-container { left: calc(50.828729281767984% - 119.88950276243094% / 2); top: calc(50.90909090909093% - 109px / 2); }", ".framer-qJH8W.framer-v-1ta2x5h .framer-1akthty-container { height: 109px; left: calc(160.22099447513813% - 119.88950276243094% / 2); top: calc(-94.54545454545452% - 108.5px / 2); }", ...css3];
var FramertiRz_Cwp2 = withCSS4(Component4, css7, "framer-qJH8W");
var tiRz_Cwp2_default = FramertiRz_Cwp2;
FramertiRz_Cwp2.displayName = "Animated Buy Now Button";
FramertiRz_Cwp2.defaultProps = { height: 27.5, width: 92.5 };
addPropertyControls4(FramertiRz_Cwp2, { variant: { options: ["hB5sJux9_", "rO5JFb8be", "XzOanXB0Z", "DUh9czCMs"], optionTitles: ["Animated Start", "Animated", "Animated End", "Static"], title: "Variant", type: ControlType4.Enum }, LtuWPY8RR: { title: "Link", type: ControlType4.Link } });
addFonts2(FramertiRz_Cwp2, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }] }, ...ShoppingBagFonts, ...ArrowRightFonts, ...BuyNowButtonBubbleFonts, ...getFontsFromSharedStyle(fonts3)], { supportsExplicitInterCodegen: true });
FramertiRz_Cwp2.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader(F6mcHeKS5_default, {}, context)]);
} };

// http-url:https://framerusercontent.com/modules/Ujtf1QzkNNzjjasicPdI/KFLGkTOZAmDL4R2pJ9Hn/SUOQExBkZ.js
var AnimatedBuyNowButtonFonts = getFonts2(tiRz_Cwp2_default);
var cycleOrder3 = ["pU3JDp4XQ", "i8LqbqhM_", "XvtF263f1"];
var serializationHash3 = "framer-3yalT";
var variantClassNames3 = { i8LqbqhM_: "framer-v-vbkrmx", pU3JDp4XQ: "framer-v-eaa3qa", XvtF263f1: "framer-v-v1ejny" };
function addPropertyOverrides3(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition13 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var negate = (value) => {
  return !value;
};
var equals = (a, b) => {
  return typeof a === "string" && typeof b === "string" ? a.toLowerCase() === b.toLowerCase() : a === b;
};
var convertFromBoolean = (value, activeLocale) => {
  return value ? "DUh9czCMs" : "hB5sJux9_";
};
var matchVariant2 = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var Transition3 = ({ value, children }) => {
  const config = React5.useContext(MotionConfigContext3);
  const transition = value ?? config.transition;
  const contextValue = React5.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx6(MotionConfigContext3.Provider, { value: contextValue, children });
};
var humanReadableVariantMap3 = { "Sky Blue": "XvtF263f1", Beige: "pU3JDp4XQ", Orange: "i8LqbqhM_" };
var Variants3 = motion5.create(React5.Fragment);
var getProps5 = ({ height, id, phoneBreakpoint, width, ...props }) => {
  return { ...props, PRmy6BIEU: phoneBreakpoint ?? props.PRmy6BIEU, variant: humanReadableVariantMap3[props.variant] ?? props.variant ?? "pU3JDp4XQ" };
};
var createLayoutDependency3 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component5 = /* @__PURE__ */ React5.forwardRef(function(props, ref) {
  const fallbackRef = useRef3(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React5.useId();
  const { activeLocale, setLocale } = useLocaleInfo3();
  const componentViewport = useComponentViewport3();
  const { style, className: className4, layoutId, variant, PRmy6BIEU, ...restProps } = getProps5(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState3({ cycleOrder: cycleOrder3, defaultVariant: "pU3JDp4XQ", ref: refBinding, variant, variantClassNames: variantClassNames3 });
  const layoutDependency = createLayoutDependency3(props, variants);
  const sharedStyleClassNames = [className, className2];
  const scopingClassNames = cx5(serializationHash3, ...sharedStyleClassNames);
  const visible = negate(PRmy6BIEU);
  const router = useRouter();
  return /* @__PURE__ */ _jsx6(LayoutGroup3, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx6(Variants3, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx6(Transition3, { value: transition13, children: /* @__PURE__ */ _jsxs2(motion5.div, { ...restProps, ...gestureHandlers, className: cx5(scopingClassNames, "framer-eaa3qa", className4, classNames), "data-framer-name": "Beige", layoutDependency, layoutId: "HeroShoeCTA__pU3JDp4XQ", ref: refBinding, style: { ...style }, ...addPropertyOverrides3({ i8LqbqhM_: { "data-framer-name": "Orange" }, XvtF263f1: { "data-framer-name": "Sky Blue" } }, baseVariant, gestureVariant), children: [visible !== false && /* @__PURE__ */ _jsxs2(motion5.div, { className: "framer-dg0nxu", "data-framer-name": "Title & Description", layoutDependency, layoutId: "HeroShoeCTA__sFnbRm3ay", children: [/* @__PURE__ */ _jsx6(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx6(React5.Fragment, { children: /* @__PURE__ */ _jsx6(motion5.p, { className: "framer-styles-preset-5rfdkx", "data-styles-preset": "CT_DBbR5R", dir: "auto", style: { "--framer-text-alignment": "left" }, children: "Beige" }) }), className: "framer-58erhv", fonts: ["Inter"], layoutDependency, layoutId: "HeroShoeCTA__PcWmucZLM", style: { "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides3({ i8LqbqhM_: { children: /* @__PURE__ */ _jsx6(React5.Fragment, { children: /* @__PURE__ */ _jsx6(motion5.p, { className: "framer-styles-preset-5rfdkx", "data-styles-preset": "CT_DBbR5R", dir: "auto", style: { "--framer-text-alignment": "left" }, children: "Orange" }) }) }, XvtF263f1: { children: /* @__PURE__ */ _jsx6(React5.Fragment, { children: /* @__PURE__ */ _jsx6(motion5.p, { className: "framer-styles-preset-5rfdkx", "data-styles-preset": "CT_DBbR5R", dir: "auto", style: { "--framer-text-alignment": "left" }, children: "Sky Blue" }) }) } }, baseVariant, gestureVariant) }), /* @__PURE__ */ _jsx6(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx6(React5.Fragment, { children: /* @__PURE__ */ _jsxs2(motion5.p, { className: "framer-styles-preset-y1k16k", "data-styles-preset": "WIiaJAMT7", dir: "auto", style: { "--framer-text-alignment": "left" }, children: [/* @__PURE__ */ _jsx6(motion5.span, { style: { "--framer-text-color": "var(--extracted-1w3ko1f, var(--token-31c75237-3696-4093-9011-7822eb8b6641, rgb(122, 122, 122)))" }, children: "A comfort elegance that " }), /* @__PURE__ */ _jsx6(motion5.br, {}), /* @__PURE__ */ _jsx6(motion5.span, { style: { "--framer-text-color": "var(--extracted-c9yw3e, var(--token-31c75237-3696-4093-9011-7822eb8b6641, rgb(122, 122, 122)))" }, children: "your foot needs." })] }) }), className: "framer-1s453pr", fonts: ["Inter"], layoutDependency, layoutId: "HeroShoeCTA__rbqSTBo9n", style: { "--extracted-1w3ko1f": "var(--token-31c75237-3696-4093-9011-7822eb8b6641, rgb(122, 122, 122))", "--extracted-c9yw3e": "var(--token-31c75237-3696-4093-9011-7822eb8b6641, rgb(122, 122, 122))", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true })] }), /* @__PURE__ */ _jsx6(ResolveLinks, { links: [{ href: { pathVariables: { wjbVR4laR: "nyke-air-flex-beige" }, unresolvedPathSlugs: { wjbVR4laR: { collectionId: "wWC8EGMFo", collectionItemId: "uhsVpGOLR" } }, webPageId: "fIwdA4CC3" }, implicitPathVariables: void 0 }, { href: { pathVariables: { wjbVR4laR: "nyke-air-flex-orange" }, unresolvedPathSlugs: { wjbVR4laR: { collectionId: "wWC8EGMFo", collectionItemId: "S2zRi_dPz" } }, webPageId: "fIwdA4CC3" }, implicitPathVariables: void 0 }, { href: { pathVariables: { wjbVR4laR: "nyke-air-flex-sky-blue" }, unresolvedPathSlugs: { wjbVR4laR: { collectionId: "wWC8EGMFo", collectionItemId: "aDHvRnr63" } }, webPageId: "fIwdA4CC3" }, implicitPathVariables: void 0 }], children: (resolvedLinks) => /* @__PURE__ */ _jsx6(ComponentViewportProvider2, { height: 27, y: (componentViewport?.y || 0) + 0 + 0, children: /* @__PURE__ */ _jsx6(SmartComponentScopedContainer2, { className: "framer-5ug9jl-container", layoutDependency, layoutId: "HeroShoeCTA__eRGDaWNg0-container", nodeId: "eRGDaWNg0", rendersWithMotion: true, scopeId: "SUOQExBkZ", children: /* @__PURE__ */ _jsx6(tiRz_Cwp2_default, { height: "100%", id: "eRGDaWNg0", layoutId: "HeroShoeCTA__eRGDaWNg0", LtuWPY8RR: resolvedLinks[0], variant: matchVariant2(convertFromBoolean(equals(PRmy6BIEU, true), activeLocale)), width: "100%", ...addPropertyOverrides3({ i8LqbqhM_: { LtuWPY8RR: resolvedLinks[1] }, XvtF263f1: { LtuWPY8RR: resolvedLinks[2] } }, baseVariant, gestureVariant) }) }) }) })] }) }) }) });
});
var css8 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-3yalT.framer-e9pcxu, .framer-3yalT .framer-e9pcxu { display: block; }", ".framer-3yalT.framer-eaa3qa { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 16px; height: min-content; justify-content: flex-start; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: min-content; }", ".framer-3yalT .framer-dg0nxu { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 6px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: min-content; }", ".framer-3yalT .framer-58erhv { align-self: stretch; flex: none; height: auto; position: relative; white-space: pre-wrap; width: auto; word-break: break-word; word-wrap: break-word; }", ".framer-3yalT .framer-1s453pr { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-3yalT .framer-5ug9jl-container { flex: none; height: auto; position: relative; width: auto; }", ...css, ...css2];
var FramerSUOQExBkZ = withCSS5(Component5, css8, "framer-3yalT");
var SUOQExBkZ_default = FramerSUOQExBkZ;
FramerSUOQExBkZ.displayName = "Hero Shoe CTA";
FramerSUOQExBkZ.defaultProps = { height: 109.5, width: 145.5 };
addPropertyControls5(FramerSUOQExBkZ, { variant: { options: ["pU3JDp4XQ", "i8LqbqhM_", "XvtF263f1"], optionTitles: ["Beige", "Orange", "Sky Blue"], title: "Variant", type: ControlType5.Enum }, PRmy6BIEU: { defaultValue: false, title: "Phone Breakpoint", type: ControlType5.Boolean }, onPRmy6BIEUChange: { changes: "PRmy6BIEU", type: ControlType5.ChangeHandler } });
addFonts3(FramerSUOQExBkZ, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }] }, ...AnimatedBuyNowButtonFonts, ...getFontsFromSharedStyle2(fonts), ...getFontsFromSharedStyle2(fonts2)], { supportsExplicitInterCodegen: true });
FramerSUOQExBkZ.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader2(tiRz_Cwp2_default, {}, context)]);
} };
var __FramerMetadata__2 = { "exports": { "default": { "type": "reactComponent", "name": "FramerSUOQExBkZ", "slots": [], "annotations": { "framerContractVersion": "1", "framerVariables": '{"PRmy6BIEU":"phoneBreakpoint"}', "framerIntrinsicHeight": "109.5", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["auto","auto"]},"i8LqbqhM_":{"layout":["auto","auto"]},"XvtF263f1":{"layout":["auto","auto"]}}}', "framerComponentViewportWidth": "true", "framerAutoSizeImages": "true", "framerImmutableVariables": "true", "framerColorSyntax": "true", "framerDisplayContentsDiv": "false", "framerIntrinsicWidth": "145.5" } }, "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__2 as __FramerMetadata__,
  SUOQExBkZ_default as default
};
