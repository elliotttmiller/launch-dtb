
// ─────────────────────────────────────────────────────────────
// CMS Data Stub (Framer plugin v15)
//
// This component was bound to a Framer Collection. The runtime CMS
// machinery has been stripped — wire up your own data source by
// populating this object. Keys are the query aliases used internally
// by the design; values are arrays of items.
//
// AI INTEGRATION NOTE: identify the .map(item => ...) call(s) in
// the component below to learn what fields each item needs. Then
// replace the empty arrays here with your data (fetched from your
// CMS, an API, a JSON file, props, etc.).
// ─────────────────────────────────────────────────────────────
const __FRAMER_CMS_DATA__ = {
  // alias: [ { /* item fields */ } ],
};
const __framer_useQueryData = (query) => {
  const alias = query && query.from && query.from.alias;
  return (alias && __FRAMER_CMS_DATA__[alias]) || [];
};

var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// http-url:https://framerusercontent.com/modules/x792CL25E5sD9xXrqvMm/uqYErgItcWBHF3VgPrdn/bLruI0oTL.js
import { fontStore as fontStore2 } from "./_framer-runtime.js";
var variationAxes, fonts, css, className;
var init_bLruI0oTL = __esm({
  "http-url:https://framerusercontent.com/modules/x792CL25E5sD9xXrqvMm/uqYErgItcWBHF3VgPrdn/bLruI0oTL.js"() {
    fontStore2.loadFonts(["Inter-Variable", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNTI1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNTI1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNTI1"]);
    variationAxes = [{ defaultValue: 14, maxValue: 32, minValue: 14, name: "Optical size", tag: "opsz" }, { defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
    fonts = [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/mYcqTSergLb16PdbJJQMl9ebYm4.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/ZRl8AlxwsX1m7xS1eJCiSPbztg.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/nhSQpBRqFmXNUBY2p5SENQ8NplQ.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/DYHjxG0qXjopUuruoacfl5SA.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/s7NH6sl7w4NU984r5hcmo1tPSYo.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/7lw0VWkeXrGYJT05oB3DsFy8BaY.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/wx5nfqEgOXnxuFaxB0Mn9OhmcZA.woff2", variationAxes, weight: "400" }] }];
    css = ['.framer-UktaB .framer-styles-preset-1sqkecy:not(.rich-text-wrapper), .framer-UktaB .framer-styles-preset-1sqkecy.rich-text-wrapper p { --framer-font-family: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 12px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: normal; --framer-font-style-italic: normal; --framer-font-variation-axes: "opsz" 14, "wght" 525; --framer-font-variation-axes-bold: "opsz" 14, "wght" 525; --framer-font-variation-axes-bold-italic: "opsz" 14, "wght" 525; --framer-font-variation-axes-italic: "opsz" 14, "wght" 525; --framer-font-weight: 400; --framer-font-weight-bold: 400; --framer-font-weight-bold-italic: 400; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.04em; --framer-line-height: 1.2em; --framer-paragraph-spacing: 20px; --framer-text-alignment: center; --framer-text-color: var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
    className = "framer-UktaB";
  }
});

// http-url:https://framerusercontent.com/modules/rvQmVwf0GZo8cRTnvMj1/wzFMOfI6Ln0UDwWoBHVL/WIiaJAMT7.js
import { fontStore as fontStore3 } from "./_framer-runtime.js";
var variationAxes2, fonts2, css2, className2;
var init_WIiaJAMT7 = __esm({
  "http-url:https://framerusercontent.com/modules/rvQmVwf0GZo8cRTnvMj1/wzFMOfI6Ln0UDwWoBHVL/WIiaJAMT7.js"() {
    fontStore3.loadFonts(["Inter-Variable", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNDI1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNDI1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNDI1"]);
    variationAxes2 = [{ defaultValue: 14, maxValue: 32, minValue: 14, name: "Optical size", tag: "opsz" }, { defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
    fonts2 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/mYcqTSergLb16PdbJJQMl9ebYm4.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/ZRl8AlxwsX1m7xS1eJCiSPbztg.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/nhSQpBRqFmXNUBY2p5SENQ8NplQ.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/DYHjxG0qXjopUuruoacfl5SA.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/s7NH6sl7w4NU984r5hcmo1tPSYo.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/7lw0VWkeXrGYJT05oB3DsFy8BaY.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/wx5nfqEgOXnxuFaxB0Mn9OhmcZA.woff2", variationAxes: variationAxes2, weight: "400" }] }];
    css2 = ['.framer-dy7z7 .framer-styles-preset-y1k16k:not(.rich-text-wrapper), .framer-dy7z7 .framer-styles-preset-y1k16k.rich-text-wrapper p { --framer-font-family: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 13px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: normal; --framer-font-style-italic: normal; --framer-font-variation-axes: "opsz" 14, "wght" 425; --framer-font-variation-axes-bold: "opsz" 14, "wght" 425; --framer-font-variation-axes-bold-italic: "opsz" 14, "wght" 425; --framer-font-variation-axes-italic: "opsz" 14, "wght" 425; --framer-font-weight: 400; --framer-font-weight-bold: 400; --framer-font-weight-bold-italic: 400; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.02em; --framer-line-height: 1.5em; --framer-paragraph-spacing: 20px; --framer-text-alignment: center; --framer-text-color: var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
    className2 = "framer-dy7z7";
  }
});

// http-url:https://framerusercontent.com/modules/7Fv1DKwShuhMvjoxe6as/nO2hVN5B6hhq6jrnosi3/W76pPiwFl.js
var W76pPiwFl_exports = {};
__export(W76pPiwFl_exports, {
  __FramerMetadata__: () => __FramerMetadata__,
  default: () => W76pPiwFl_default
});
import { jsx as _jsx2, jsxs as _jsxs2 } from "react/jsx-runtime";
import { addFonts, addPropertyControls as addPropertyControls2, ControlType as ControlType5, cx, getFontsFromSharedStyle, RichText, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup2, motion as motion2, MotionConfigContext } from "framer-motion";
import * as React3 from "react";
import { useRef as useRef4 } from "react";
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var cycleOrder, serializationHash, variantClassNames, transition1, Transition, humanReadableVariantMap, Variants, getProps, createLayoutDependency, Component, css3, FramerW76pPiwFl, W76pPiwFl_default, __FramerMetadata__;
var init_W76pPiwFl = __esm({
  "http-url:https://framerusercontent.com/modules/7Fv1DKwShuhMvjoxe6as/nO2hVN5B6hhq6jrnosi3/W76pPiwFl.js"() {
    init_bLruI0oTL();
    init_WIiaJAMT7();
    cycleOrder = ["fzTpjTBPb", "iwvIJgSxT", "aZuD0jNSC", "rmDSVRFVj"];
    serializationHash = "framer-6KPyM";
    variantClassNames = { aZuD0jNSC: "framer-v-w4sipw", fzTpjTBPb: "framer-v-1qh5yry", iwvIJgSxT: "framer-v-15y057s", rmDSVRFVj: "framer-v-15y3qjp" };
    transition1 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
    Transition = ({ value, children }) => {
      const config = React3.useContext(MotionConfigContext);
      const transition = value ?? config.transition;
      const contextValue = React3.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
      return /* @__PURE__ */ _jsx2(MotionConfigContext.Provider, { value: contextValue, children });
    };
    humanReadableVariantMap = { "Sky Blue": "aZuD0jNSC", Beige: "fzTpjTBPb", Grey: "rmDSVRFVj", Orange: "iwvIJgSxT" };
    Variants = motion2.create(React3.Fragment);
    getProps = ({ height, id, tag, title, width, ...props }) => {
      return { ...props, eez7kHeWw: title ?? props.eez7kHeWw ?? "Limited edition collection", variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "fzTpjTBPb", weK3S2rqe: tag ?? props.weK3S2rqe ?? "New" };
    };
    createLayoutDependency = (props, variants) => {
      if (props.layoutDependency)
        return variants.join("-") + props.layoutDependency;
      return variants.join("-");
    };
    Component = /* @__PURE__ */ React3.forwardRef(function(props, ref) {
      const fallbackRef = useRef4(null);
      const refBinding = ref ?? fallbackRef;
      const defaultLayoutId = React3.useId();
      const { activeLocale, setLocale } = useLocaleInfo();
      const componentViewport = useComponentViewport();
      const { style, className: className6, layoutId, variant, eez7kHeWw, weK3S2rqe, ...restProps } = getProps(props);
      const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "fzTpjTBPb", ref: refBinding, variant, variantClassNames });
      const layoutDependency = createLayoutDependency(props, variants);
      const sharedStyleClassNames = [className, className2];
      const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
      return /* @__PURE__ */ _jsx2(LayoutGroup2, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx2(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx2(Transition, { value: transition1, children: /* @__PURE__ */ _jsxs2(motion2.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-1qh5yry", className6, classNames), "data-border": true, "data-framer-name": "Beige", layoutDependency, layoutId: "BestSellersCarousel__fzTpjTBPb", ref: refBinding, style: { "--border-bottom-width": "0.75px", "--border-color": "var(--token-facdf9ba-ab59-43c2-ab8f-07ddd27ed78e, rgb(227, 207, 179))", "--border-left-width": "0.75px", "--border-right-width": "0.75px", "--border-style": "solid", "--border-top-width": "0.75px", backgroundColor: "var(--token-9039c660-569a-421b-a527-9ac056ae9951, rgb(255, 255, 255))", borderBottomLeftRadius: 1e3, borderBottomRightRadius: 1e3, borderTopLeftRadius: 1e3, borderTopRightRadius: 1e3, ...style }, variants: { aZuD0jNSC: { "--border-color": "var(--token-975004f8-b431-4c64-9cbe-cba253835067, rgb(179, 211, 227))" }, iwvIJgSxT: { "--border-color": "var(--token-a81a54c4-cf8d-443b-a6d8-1594e37ce8c3, rgb(255, 193, 107))" }, rmDSVRFVj: { "--border-bottom-width": "0.5px", "--border-color": "var(--token-66c17a07-9665-42f4-bcc6-e569faf2b983, rgb(138, 138, 138))", "--border-left-width": "0.5px", "--border-right-width": "0.5px", "--border-top-width": "0.5px" } }, ...addPropertyOverrides({ aZuD0jNSC: { "data-framer-name": "Sky Blue" }, iwvIJgSxT: { "data-framer-name": "Orange" }, rmDSVRFVj: { "data-framer-name": "Grey" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx2(motion2.div, { className: "framer-1k3l7si", "data-border": true, "data-framer-name": "Tag", layoutDependency, layoutId: "BestSellersCarousel__eFPAOiPiC", style: { "--border-bottom-width": "0.5px", "--border-color": "var(--token-28a2250d-baec-4b0b-8342-a78e4073532a, rgb(186, 166, 138))", "--border-left-width": "0.5px", "--border-right-width": "0.5px", "--border-style": "solid", "--border-top-width": "0.5px", background: "linear-gradient(180deg, rgb(255, 255, 255) 0%, rgb(227, 207, 179) 100%)", borderBottomLeftRadius: 1e3, borderBottomRightRadius: 1e3, borderTopLeftRadius: 1e3, borderTopRightRadius: 1e3 }, variants: { aZuD0jNSC: { "--border-color": "var(--token-1b38fbfc-6fb2-48eb-8328-d159880837c1, rgb(138, 176, 186))", background: "linear-gradient(180deg, rgb(255, 255, 255) 0%, rgb(179, 218, 227) 100%)" }, iwvIJgSxT: { "--border-color": "var(--token-b0f905ca-4456-4e10-9d5e-13d7035c98df, rgb(199, 148, 78))", background: "linear-gradient(180deg, rgb(255, 255, 255) 0%, rgb(237, 180, 100) 100%)" }, rmDSVRFVj: { "--border-color": "var(--token-66c17a07-9665-42f4-bcc6-e569faf2b983, rgb(138, 138, 138))", background: "linear-gradient(180deg, rgb(255, 255, 255) 0%, rgb(186, 186, 186) 100%)" } }, children: /* @__PURE__ */ _jsx2(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx2(React3.Fragment, { children: /* @__PURE__ */ _jsx2(motion2.p, { className: "framer-styles-preset-1sqkecy", "data-styles-preset": "bLruI0oTL", dir: "auto", style: { "--framer-text-color": "var(--extracted-r6o4lv, rgb(79, 79, 79))" }, children: /* @__PURE__ */ _jsx2(motion2.span, { "data-text-fill": "true", style: { backgroundImage: "linear-gradient(356deg, rgb(117, 77, 21) 0%, var(--token-86f4ddbd-7b32-4e2b-b915-97c05602f890, rgb(227, 207, 179)) 99.4774070945946%)" }, children: "New" }) }) }), className: "framer-142nmne", fonts: ["Inter"], layoutDependency, layoutId: "BestSellersCarousel__uPJhDT7tr", style: { "--extracted-r6o4lv": "rgb(79, 79, 79)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: weK3S2rqe, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides({ aZuD0jNSC: { children: /* @__PURE__ */ _jsx2(React3.Fragment, { children: /* @__PURE__ */ _jsx2(motion2.p, { className: "framer-styles-preset-1sqkecy", "data-styles-preset": "bLruI0oTL", dir: "auto", style: { "--framer-text-color": "var(--extracted-r6o4lv, rgb(79, 79, 79))" }, children: /* @__PURE__ */ _jsx2(motion2.span, { "data-text-fill": "true", style: { backgroundImage: "linear-gradient(356deg, rgb(21, 74, 117) 0%, rgb(179, 209, 227) 100%)" }, children: "New" }) }) }) }, iwvIJgSxT: { children: /* @__PURE__ */ _jsx2(React3.Fragment, { children: /* @__PURE__ */ _jsx2(motion2.p, { className: "framer-styles-preset-1sqkecy", "data-styles-preset": "bLruI0oTL", dir: "auto", style: { "--framer-text-color": "var(--extracted-r6o4lv, rgb(79, 79, 79))" }, children: /* @__PURE__ */ _jsx2(motion2.span, { "data-text-fill": "true", style: { backgroundImage: "linear-gradient(356deg, rgb(161, 108, 18) 0%, rgb(237, 164, 62) 100%)" }, children: "New" }) }) }) }, rmDSVRFVj: { children: /* @__PURE__ */ _jsx2(React3.Fragment, { children: /* @__PURE__ */ _jsx2(motion2.p, { className: "framer-styles-preset-1sqkecy", "data-styles-preset": "bLruI0oTL", dir: "auto", style: { "--framer-text-color": "var(--extracted-r6o4lv, rgb(79, 79, 79))" }, children: /* @__PURE__ */ _jsx2(motion2.span, { "data-text-fill": "true", style: { backgroundImage: "linear-gradient(356deg, rgb(0, 0, 0) 0%, rgb(255, 255, 255) 100%)" }, children: "New" }) }) }) } }, baseVariant, gestureVariant) }) }), /* @__PURE__ */ _jsx2(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx2(React3.Fragment, { children: /* @__PURE__ */ _jsx2(motion2.p, { className: "framer-styles-preset-y1k16k", "data-styles-preset": "WIiaJAMT7", dir: "auto", style: { "--framer-text-color": "var(--extracted-r6o4lv, rgb(156, 115, 59))" }, children: /* @__PURE__ */ _jsx2(motion2.span, { "data-text-fill": "true", style: { backgroundImage: "linear-gradient(0deg, rgb(156, 115, 59) 0%, rgba(255, 232, 199, 0.3) 100%)" }, children: "Limited edition collection" }) }) }), className: "framer-osa7ii", fonts: ["Inter"], layoutDependency, layoutId: "BestSellersCarousel__eYC6Ya7Xd", style: { "--extracted-r6o4lv": "rgb(156, 115, 59)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: eez7kHeWw, variants: { aZuD0jNSC: { "--extracted-r6o4lv": "rgb(79, 79, 79)" }, iwvIJgSxT: { "--extracted-r6o4lv": "rgb(79, 79, 79)" } }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides({ aZuD0jNSC: { children: /* @__PURE__ */ _jsx2(React3.Fragment, { children: /* @__PURE__ */ _jsx2(motion2.p, { className: "framer-styles-preset-y1k16k", "data-styles-preset": "WIiaJAMT7", dir: "auto", style: { "--framer-text-color": "var(--extracted-r6o4lv, rgb(79, 79, 79))" }, children: /* @__PURE__ */ _jsx2(motion2.span, { "data-text-fill": "true", style: { backgroundImage: "linear-gradient(356deg, rgb(21, 74, 117) 0%, rgb(179, 209, 227) 100%)" }, children: "Limited edition collection" }) }) }) }, iwvIJgSxT: { children: /* @__PURE__ */ _jsx2(React3.Fragment, { children: /* @__PURE__ */ _jsx2(motion2.p, { className: "framer-styles-preset-y1k16k", "data-styles-preset": "WIiaJAMT7", dir: "auto", style: { "--framer-text-color": "var(--extracted-r6o4lv, rgb(79, 79, 79))" }, children: /* @__PURE__ */ _jsx2(motion2.span, { "data-text-fill": "true", style: { backgroundImage: "linear-gradient(356deg, rgb(161, 108, 18) 0%, rgb(237, 164, 62) 100%)" }, children: "Limited edition collection" }) }) }) }, rmDSVRFVj: { children: /* @__PURE__ */ _jsx2(React3.Fragment, { children: /* @__PURE__ */ _jsx2(motion2.p, { className: "framer-styles-preset-y1k16k", "data-styles-preset": "WIiaJAMT7", dir: "auto", style: { "--framer-text-color": "var(--extracted-r6o4lv, rgb(156, 115, 59))" }, children: /* @__PURE__ */ _jsx2(motion2.span, { "data-text-fill": "true", style: { backgroundImage: "linear-gradient(0deg, rgb(0, 0, 0) 0%, rgb(224, 224, 224) 100%)" }, children: "Limited edition collection" }) }) }) } }, baseVariant, gestureVariant) })] }) }) }) });
    });
    css3 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-6KPyM.framer-z7blk, .framer-6KPyM .framer-z7blk { display: block; }", ".framer-6KPyM.framer-1qh5yry { align-content: center; align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 6px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 4px 12px 4px 4px; position: relative; width: min-content; will-change: var(--framer-will-change-override, transform); }", ".framer-6KPyM .framer-1k3l7si { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 2px 6px 1px 6px; position: relative; width: min-content; will-change: var(--framer-will-change-override, transform); }", ".framer-6KPyM .framer-142nmne, .framer-6KPyM .framer-osa7ii { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ...css, ...css2, '.framer-6KPyM[data-border="true"]::after, .framer-6KPyM [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
    FramerW76pPiwFl = withCSS(Component, css3, "framer-6KPyM");
    W76pPiwFl_default = FramerW76pPiwFl;
    FramerW76pPiwFl.displayName = "Recent Activity Chip";
    FramerW76pPiwFl.defaultProps = { height: 27, width: 205 };
    addPropertyControls2(FramerW76pPiwFl, { variant: { options: ["fzTpjTBPb", "iwvIJgSxT", "aZuD0jNSC", "rmDSVRFVj"], optionTitles: ["Beige", "Orange", "Sky Blue", "Grey"], title: "Variant", type: ControlType5.Enum }, eez7kHeWw: { defaultValue: "Limited edition collection", displayTextArea: false, title: "Title", type: ControlType5.String }, oneez7kHeWwChange: { changes: "eez7kHeWw", type: ControlType5.ChangeHandler }, weK3S2rqe: { defaultValue: "New", displayTextArea: false, title: "Tag", type: ControlType5.String }, onweK3S2rqeChange: { changes: "weK3S2rqe", type: ControlType5.ChangeHandler } });
    addFonts(FramerW76pPiwFl, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }] }, ...getFontsFromSharedStyle(fonts), ...getFontsFromSharedStyle(fonts2)], { supportsExplicitInterCodegen: true });
    __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "FramerW76pPiwFl", "slots": [], "annotations": { "framerIntrinsicWidth": "205", "framerIntrinsicHeight": "27", "framerComponentViewportWidth": "true", "framerContractVersion": "1", "framerImmutableVariables": "true", "framerVariables": '{"eez7kHeWw":"title","weK3S2rqe":"tag"}', "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["auto","auto"]},"iwvIJgSxT":{"layout":["auto","auto"]},"aZuD0jNSC":{"layout":["auto","auto"]},"rmDSVRFVj":{"layout":["auto","auto"]}}}', "framerColorSyntax": "true", "framerDisplayContentsDiv": "false", "framerAutoSizeImages": "true" } }, "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
  }
});

// http-url:https://framerusercontent.com/modules/aAJKkeQ9fdQtqcmk5uQY/oiJDFwUmbAEYMEcGFV6j/eE2hU3DZQ.js
import { jsx as _jsx4, jsxs as _jsxs4, Fragment as _Fragment } from "react/jsx-runtime";
import { addFonts as addFonts3, addPropertyControls as addPropertyControls4, ChildrenCanSuspend, ComponentViewportProvider, ControlType as ControlType7, cx as cx3, forwardLoader, getFonts, PathVariablesContext, queryCache, ResolveLinks, SmartComponentScopedContainer, useComponentViewport as useComponentViewport3, useLocaleCode, useLocaleInfo as useLocaleInfo3, useQueryData, useRouter, useVariantState as useVariantState3, withCSS as withCSS3 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup4, motion as motion4, MotionConfigContext as MotionConfigContext3 } from "framer-motion";
import * as React5 from "react";
import { useRef as useRef6 } from "react";

// http-url:https://framerusercontent.com/modules/UIrMjSS6ZX89L0CsT8k6/3dMrKtwDsHhQeeykStyV/Carousel.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Children, useCallback as useCallback2, useEffect as useEffect7, useState as useState3, useRef as useRef3, cloneElement, startTransition, useId } from "react";
import { addPropertyControls, ControlType as ControlType4, RenderTarget as RenderTarget3 } from "./_framer-runtime.js";
import { scroll, resize } from "@motionone/dom";
import { clamp } from "@motionone/utils";
import { animate as animate2, motion, useMotionValue, useTransform, useReducedMotion, LayoutGroup } from "framer-motion";

// http-url:https://framerusercontent.com/modules/VTUDdizacRHpwbkOamr7/AykinQJbgwl92LvMGZwu/constants.js
import { ControlType } from "./_framer-runtime.js";
var containerStyles = {
  position: "relative",
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};
var emptyStateStyle = {
  ...containerStyles,
  borderRadius: 6,
  background: "rgba(136, 85, 255, 0.3)",
  color: "#85F",
  border: "1px dashed #85F",
  flexDirection: "column"
};
var defaultEvents = {
  onClick: {
    type: ControlType.EventHandler
  },
  onMouseEnter: {
    type: ControlType.EventHandler
  },
  onMouseLeave: {
    type: ControlType.EventHandler
  }
};
var fontSizeOptions = {
  type: ControlType.Number,
  title: "Font Size",
  min: 2,
  max: 200,
  step: 1,
  displayStepper: true
};
var fontControls = {
  font: {
    type: ControlType.Boolean,
    title: "Font",
    defaultValue: false,
    disabledTitle: "Default",
    enabledTitle: "Custom"
  },
  fontFamily: {
    type: ControlType.String,
    title: "Family",
    placeholder: "Inter",
    hidden: ({ font }) => !font
  },
  fontWeight: {
    type: ControlType.Enum,
    title: "Weight",
    options: [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900
    ],
    optionTitles: [
      "Thin",
      "Extra-light",
      "Light",
      "Regular",
      "Medium",
      "Semi-bold",
      "Bold",
      "Extra-bold",
      "Black"
    ],
    hidden: ({ font }) => !font
  }
};

// http-url:https://framerusercontent.com/modules/D4TWeLfcxT6Tysr2BlYg/iZjmqdxVx1EOiM3k1FaW/useOnNavigationTargetChange.js
import { useIsInCurrentNavigationTarget } from "./_framer-runtime.js";
import { useEffect } from "react";

// http-url:https://framerusercontent.com/modules/ExNgrA7EJTKUPpH6vIlN/eiOrSJ2Ab5M9jPCvVwUz/useConstant.js
import { useRef } from "react";

// http-url:https://framerusercontent.com/modules/D2Lz5CmnNVPZFFiZXalt/QaCzPbriZBfXWZIIycFI/colorFromToken.js
import { Color } from "./_framer-runtime.js";

// http-url:https://framerusercontent.com/modules/3mKFSGQqKHV82uOV1eBc/5fbRLvOpxZC0JOXugvwm/isMotionValue.js
import { MotionValue } from "./_framer-runtime.js";

// http-url:https://framerusercontent.com/modules/xDiQsqBGXzmMsv7AlEVy/uhunpMiNsbXxzjlXsg1y/useUniqueClassName.js
import * as React from "react";

// http-url:https://framerusercontent.com/modules/ETACN5BJyFTSo0VVDJfu/NHRqowOiXkF9UwOzczF7/variantUtils.js
import { ControlType as ControlType2 } from "./_framer-runtime.js";

// http-url:https://framerusercontent.com/modules/eMBrwoqQK7h6mEeGQUH8/GuplvPJVjmxpk9zqOTcb/isBrowser.js
import { useMemo } from "react";

// http-url:https://framerusercontent.com/modules/v9AWX2URmiYsHf7GbctE/XxKAZ9KlhWqf5x1JMyyF/useOnChange.js
import { useEffect as useEffect3 } from "react";

// http-url:https://framerusercontent.com/modules/kNDwabfjDEb3vUxkQlZS/fSIr3AOAYbGlfSPgXpYu/useAutoMotionValue.js
import { useCallback, useEffect as useEffect4, useRef as useRef2 } from "react";
import { motionValue, animate, RenderTarget } from "./_framer-runtime.js";

// http-url:https://framerusercontent.com/modules/cuQH4dmpDnV8YK1mSgQX/KqRXqunFjE6ufhpc7ZRu/useFontControls.js
import { fontStore } from "./_framer-runtime.js";
import { useEffect as useEffect5 } from "react";

// http-url:https://framerusercontent.com/modules/afBE9Yx1W6bY5q32qPxe/m3q7puE2tbo1S2C0s0CT/useRenderTarget.js
import { useMemo as useMemo2 } from "react";
import { RenderTarget as RenderTarget2 } from "./_framer-runtime.js";

// http-url:https://framerusercontent.com/modules/zGkoP8tPDCkoBzMdt5uq/0zFSjxIYliHxrQQnryFX/useControlledState.js
import * as React2 from "react";

// http-url:https://framerusercontent.com/modules/5SM58HxZHxjjv7aLMOgQ/WXz9i6mVki0bBCrKdqB3/propUtils.js
import { useMemo as useMemo3 } from "react";
import { ControlType as ControlType3 } from "./_framer-runtime.js";
var borderRadiusControl = {
  borderRadius: {
    title: "Radius",
    type: ControlType3.FusedNumber,
    toggleKey: "isMixedBorderRadius",
    toggleTitles: [
      "Radius",
      "Radius per corner"
    ],
    valueKeys: [
      "topLeftRadius",
      "topRightRadius",
      "bottomRightRadius",
      "bottomLeftRadius"
    ],
    valueLabels: [
      "TL",
      "TR",
      "BR",
      "BL"
    ],
    min: 0
  }
};
function usePadding(props) {
  const { padding, paddingPerSide, paddingTop, paddingRight, paddingBottom, paddingLeft } = props;
  const paddingValue = useMemo3(
    () => paddingPerSide ? `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px` : padding,
    [
      padding,
      paddingPerSide,
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft
    ]
  );
  return paddingValue;
}
var paddingControl = {
  padding: {
    type: ControlType3.FusedNumber,
    toggleKey: "paddingPerSide",
    toggleTitles: [
      "Padding",
      "Padding per side"
    ],
    valueKeys: [
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft"
    ],
    valueLabels: [
      "T",
      "R",
      "B",
      "L"
    ],
    min: 0,
    title: "Padding"
  }
};

// http-url:https://framerusercontent.com/modules/UIrMjSS6ZX89L0CsT8k6/3dMrKtwDsHhQeeykStyV/Carousel.js
function calcMaskWidth([inset, width]) {
  return inset + (100 - inset) * (width / 100) * 0.5;
}
function checkLimit(progress, target, { edgeOpacity, moreItems, buttonRef }, transition) {
  if (moreItems.current && progress === target) {
    moreItems.current = false;
    animate2(edgeOpacity, 1, transition);
    buttonRef.current?.setAttribute("disabled", "");
  } else if (!moreItems.current && progress !== target) {
    moreItems.current = true;
    animate2(edgeOpacity, 0, transition);
    buttonRef.current?.removeAttribute("disabled");
  }
}
function useGUI(initialMoreItems, initialAlpha) {
  const moreItems = useRef3(initialMoreItems);
  const edgeOpacity = useMotionValue(moreItems.current ? 0 : 1);
  const fadeOpacity = useTransform(edgeOpacity, [0, 1], [initialAlpha || 0, 1]);
  const buttonOpacity = useTransform(edgeOpacity, (v3) => 1 - v3);
  const buttonRef = useRef3(null);
  const pointerEvents = useTransform(buttonOpacity, (v3) => v3 > 0.2 ? "auto" : "none");
  const cursor = useTransform(pointerEvents, (v3) => v3 === "auto" ? "pointer" : "default");
  const buttonStyle = { ...baseButtonStyles, opacity: buttonOpacity, pointerEvents, cursor };
  return { moreItems, fadeOpacity, edgeOpacity, buttonStyle, buttonRef };
}
function setAriaVisible({ element }) {
  element.setAttribute("aria-hidden", false);
}
function useScrollLimits(container, axis, directionModifier, scrollInfo, updateCurrentScroll, targetScroll, checkLimits, measureItems) {
  useEffect7(() => {
    if (!container.current)
      return;
    const updateScrollInfo = (info) => {
      scrollInfo.current = info[axis];
      if (info[axis].current * directionModifier === targetScroll.current) {
        targetScroll.current = void 0;
      }
      updateCurrentScroll(info[axis].current);
      checkLimits();
    };
    const stopScroll = scroll(updateScrollInfo, { container: container.current, axis });
    const stopResize = resize(container.current, () => {
      measureItems();
      checkLimits();
    });
    return () => {
      stopScroll();
      stopResize();
    };
  }, [checkLimits, measureItems]);
}
function Carousel({ slots, gap, axis, align, sizingObject, fadeObject, arrowObject, snapObject, progressObject, ariaLabel, borderRadius, effectsObject, ...props }) {
  const filteredSlots = slots?.filter(Boolean);
  const numItems = Children.count(filteredSlots);
  const isCanvas = RenderTarget3.current() === RenderTarget3.canvas;
  const writingDirection = useWritingDirection();
  const directionModifier = axis && writingDirection === "rtl" ? -1 : 1;
  const padding = usePadding(props);
  const axisLabel = axis ? "x" : "y";
  const { fadeContent, fadeWidth, fadeInset, fadeTransition, fadeAlpha } = fadeObject;
  const { snap, snapEdge, fluid } = snapObject;
  const { widthType, widthInset, widthColumns, heightType, heightInset, heightRows } = sizingObject;
  const { showScrollbar, showProgressDots, dotSize, dotsInset, dotsRadius, dotsPadding, dotsGap, dotsFill, dotsBackground, dotsActiveOpacity, dotsOpacity, dotsBlur } = progressObject;
  const { showMouseControls, arrowSize, arrowRadius, arrowFill, leftArrow, rightArrow, arrowPadding } = arrowObject;
  const scrollInfo = useRef3(void 0);
  const targetScroll = useRef3(void 0);
  const currentScroll = useMotionValue(0);
  const updateCurrentScroll = (newScroll) => {
    currentScroll.set(targetScroll.current !== void 0 ? targetScroll.current : newScroll);
  };
  const start = useGUI(writingDirection === "rtl", fadeAlpha);
  const end = useGUI(writingDirection !== "rtl", fadeAlpha);
  const startMaskInset = useMotionValue(fadeInset * 0.5);
  const endMaskInset = useTransform(startMaskInset, (v3) => 100 - v3);
  const baseWidth = useMotionValue(fadeWidth);
  const startMaskWidth = useTransform([startMaskInset, baseWidth], calcMaskWidth);
  const endMaskWidth = useTransform(startMaskWidth, (v3) => 100 - v3);
  const direction = useMotionValue(axis ? "right" : "bottom");
  const mask = useTransform([direction, start.fadeOpacity, startMaskInset, startMaskWidth, end.fadeOpacity, endMaskInset, endMaskWidth], (latest) => {
    return `linear-gradient(to ${latest[0]}, rgb(0, 0, 0, ${latest[1]}) ${latest[2]}%, rgb(0, 0, 0, 1) ${latest[3]}%, rgba(0, 0, 0, 1) ${latest[6]}%, rgb(0, 0, 0, ${latest[4]}) ${latest[5]}%)`;
  });
  const carouselRef = useRef3(null);
  const [numPages, setNumPages] = useState3(isCanvas ? 4 : 1);
  const itemStyle = { scrollSnapAlign: snapEdge, flexShrink: 0 };
  const childStyle = {};
  if (align === "stretch") {
    if (axis) {
      childStyle.height = "100%";
      itemStyle.height = "auto";
    } else {
      childStyle.width = "100%";
      itemStyle.width = "auto";
    }
  }
  if (!fluid) {
    itemStyle.scrollSnapStop = "always";
  }
  if (widthType === "stretch") {
    itemStyle.width = `calc(100% - ${widthInset || 0}px)`;
    childStyle.width = "100%";
  } else if (widthType === "columns") {
    itemStyle.width = `calc(${100 / widthColumns}% - ${gap}px + ${gap / widthColumns}px)`;
    childStyle.width = "100%";
  }
  if (heightType === "stretch") {
    itemStyle.height = `calc(100% - ${heightInset || 0}px)`;
    childStyle.height = "100%";
  } else if (heightType === "rows") {
    itemStyle.height = `calc(${100 / heightRows}% - ${gap}px + ${gap / heightRows}px)`;
    childStyle.height = "100%";
  }
  const scrollOverflow = isCanvas ? "hidden" : "auto";
  const containerStyle = { ...baseContainerStyle, padding };
  const carouselStyle = { ...baseCarouselStyle, gap, alignItems: align, flexDirection: axis ? "row" : "column", overflowX: axis ? scrollOverflow : "hidden", overflowY: axis ? "hidden" : scrollOverflow, scrollSnapType: snap ? `${axisLabel} mandatory` : void 0, WebkitOverflowScrolling: "touch", WebkitMaskImage: fadeContent ? mask : void 0, maskImage: fadeContent ? mask : void 0, borderRadius };
  const carouselA11y = { ["aria-roledescription"]: "carousel" };
  if (ariaLabel) {
    carouselA11y["aria-title"] = ariaLabel;
  }
  const itemA11y = {};
  if (align === "stretch") {
    itemA11y["aria-role"] = "group";
    itemA11y["aria-roledescription"] = "slide";
  }
  if (!isCanvas) {
    const itemSizes = useRef3([]);
    useScrollLimits(carouselRef, axisLabel, directionModifier, scrollInfo, updateCurrentScroll, targetScroll, useCallback2(() => {
      if (!scrollInfo.current)
        return;
      const { targetLength, containerLength, scrollLength } = scrollInfo.current;
      const current = currentScroll.get();
      if (!targetLength && !containerLength)
        return;
      if (targetLength > containerLength) {
        checkLimit(current * directionModifier, 0, start, fadeTransition);
        checkLimit(current * directionModifier, scrollLength, end, fadeTransition);
        for (let i3 = 0; i3 < itemSizes.current.length; i3++) {
          const { element, start: start2, end: end2 } = itemSizes.current[i3];
          const outOfView = end2 < current || start2 > current + containerLength;
          element.setAttribute("aria-hidden", outOfView);
          if (!outOfView) {
            element.querySelectorAll("button,a").forEach((el) => {
              const orig = el.dataset.origTabIndex;
              if (orig)
                el.tabIndex = orig;
              else
                el.removeAttribute("tabIndex");
            });
          } else {
            element.querySelectorAll("button,a").forEach((el) => {
              const orig = el.getAttribute("tabIndex");
              if (orig)
                el.dataset.origTabIndex = orig;
              el.tabIndex = -1;
            });
          }
        }
      } else {
        checkLimit(0, 0, start, fadeTransition);
        checkLimit(1, 1, end, fadeTransition);
        itemSizes.current.forEach(setAriaVisible);
      }
      let newNumPages = Math.ceil(targetLength / containerLength);
      if (!isNaN(newNumPages)) {
        if (newNumPages / numItems > 0.65)
          newNumPages = numItems;
        if (newNumPages !== numPages)
          setNumPages(newNumPages);
      }
    }, [numPages]), useCallback2(() => {
      if (!carouselRef.current)
        return;
      itemSizes.current = Array.from(carouselRef.current.children).map((element) => {
        return axis ? { element, start: element.offsetLeft, end: element.offsetLeft + element.offsetWidth } : { element, start: element.offsetTop, end: element.offsetTop + element.offsetHeight };
      });
    }, []));
  }
  if (isCanvas) {
    useEffect7(() => {
      baseWidth.set(fadeWidth);
    }, [fadeWidth]);
    useEffect7(() => {
      startMaskInset.set(fadeInset * 0.5);
    }, [fadeInset]);
    useEffect7(() => {
      direction.set(axis ? "right" : "bottom");
    }, [axis]);
  }
  const isReducedMotion = useReducedMotion();
  const goto = (scrollTo) => {
    targetScroll.current = scrollTo;
    const options = axis ? { left: scrollTo } : { top: scrollTo };
    carouselRef.current.scrollTo({ ...options, behavior: isReducedMotion ? "auto" : "smooth" });
  };
  const gotoPage = (page, adjustment = 0) => {
    if (!scrollInfo.current)
      return;
    const { scrollLength } = scrollInfo.current;
    const totalLen = scrollLength / (numPages - 1);
    goto((page * totalLen + adjustment * totalLen) * directionModifier);
  };
  const gotoDelta = (delta) => () => {
    if (!scrollInfo.current)
      return;
    const { containerLength, scrollLength } = scrollInfo.current;
    const current = currentScroll.get() * directionModifier;
    const pageLength = scrollLength / numPages;
    const currentPage = clamp(0, numPages - 1, Math.floor(current / pageLength));
    let adjustment = 0;
    if (snap && (snapEdge === "start" || snapEdge === "end") && delta >= 1)
      adjustment = 0.4;
    gotoPage(currentPage + delta, adjustment);
  };
  if (numItems === 0) {
    return /* @__PURE__ */ _jsx(Placeholder, {});
  }
  const dots = [];
  const dotsBlurStyle = {};
  if (numPages > 1 && showProgressDots && !showScrollbar) {
    for (let i3 = 0; i3 < numPages; i3++) {
      const isSelected = isCanvas && !i3 || false;
      dots.push(/* @__PURE__ */ _jsx(Dot, { dotStyle: { ...dotStyle, width: dotSize, height: dotSize, backgroundColor: dotsFill }, buttonStyle: baseButtonStyles, isSelected, selectedOpacity: dotsActiveOpacity, opacity: dotsOpacity, onClick: () => startTransition(() => gotoPage(i3)), currentScroll, scrollInfo, total: numPages, index: i3, gap: dotsGap, padding: dotsPadding, axis, directionModifier }));
    }
    if (dotsBlur) {
      dotsBlurStyle.backdropFilter = dotsBlurStyle.WebkitBackdropFilter = `blur(${dotsBlur}px)`;
    }
  }
  const leftArrowSrc = leftArrow || "https://framerusercontent.com/images/6tTbkXggWgQCAJ4DO2QEdXXmgM.svg";
  const rightArrowSrc = rightArrow || "https://framerusercontent.com/images/11KSGbIZoRSg4pjdnUoif6MKHI.svg";
  return /* @__PURE__ */ _jsxs("section", { style: containerStyle, ...carouselA11y, children: [/* @__PURE__ */ _jsx(motion.ul, { ref: carouselRef, style: carouselStyle, className: "framer--carousel", "data-show-scrollbar": showScrollbar, "aria-atomic": "false", "aria-live": "polite", onWheel: () => targetScroll.current = void 0, children: Children.map(filteredSlots, (child, index) => /* @__PURE__ */ _jsx(AutoIdLayoutGroup, { inherit: "id", children: /* @__PURE__ */ _jsx("li", { style: itemStyle, ...itemA11y, "aria-label": `${index + 1} of ${numItems}`, children: /* @__PURE__ */ cloneElement(child, { ...child.props, style: { ...child.props?.style, ...childStyle } }) }) })) }), /* @__PURE__ */ _jsxs("fieldset", { style: { ...controlsStyles, padding: arrowPadding, display: "flex", flexDirection: axis ? "row" : "column" }, "aria-label": "Carousel pagination controls", className: "framer--carousel-controls", "data-show-mouse-controls": showMouseControls, children: [
    // isMouseDevice &&
    /* @__PURE__ */ _jsx(motion.button, { ref: start.buttonRef, type: "button", style: { ...start.buttonStyle, backgroundColor: arrowFill, width: arrowSize, height: arrowSize, borderRadius: arrowRadius, rotate: !axis ? 90 : 0, display: showMouseControls ? "block" : "none" }, onClick: gotoDelta(-1), "aria-label": "Previous", whileTap: { scale: 0.9 }, transition: { duration: 0.05 }, children: /* @__PURE__ */ _jsx("img", { decoding: "async", alt: "", width: arrowSize, height: arrowSize, src: writingDirection === "rtl" && axis ? rightArrowSrc : leftArrowSrc }) }),
    // isMouseDevice &&
    /* @__PURE__ */ _jsx(motion.button, { ref: end.buttonRef, type: "button", style: { ...end.buttonStyle, backgroundColor: arrowFill, width: arrowSize, height: arrowSize, borderRadius: arrowRadius, rotate: !axis ? 90 : 0, display: showMouseControls ? "block" : "none" }, onClick: gotoDelta(1), "aria-label": "Next", whileTap: { scale: 0.9 }, transition: { duration: 0.05 }, children: /* @__PURE__ */ _jsx("img", { decoding: "async", alt: "", width: arrowSize, height: arrowSize, src: writingDirection === "rtl" && axis ? leftArrowSrc : rightArrowSrc }) }),
    dots.length > 1 ? /* @__PURE__ */ _jsx("div", { style: { ...dotsContainerStyle, left: axis ? "50%" : dotsInset, top: !axis ? "50%" : "unset", transform: axis ? "translateX(-50%)" : "translateY(-50%)", flexDirection: axis ? "row" : "column", bottom: axis ? dotsInset : "unset", borderRadius: dotsRadius, backgroundColor: dotsBackground, ...dotsBlurStyle }, children: dots }) : null
  ] }), /* @__PURE__ */ _jsx(MouseStyles, {})] });
}
Carousel.defaultProps = { gap: 10, padding: 10, progressObject: { showScrollbar: false, showProgressDots: false }, sizingObject: { widthType: "auto", widthOffset: 0, widthColumns: 2, heightType: "auto", heightOffset: 0, heightRows: 2 }, borderRadius: 0 };
addPropertyControls(Carousel, { slots: { type: ControlType4.Array, title: "Children", control: { type: ControlType4.ComponentInstance } }, axis: { type: ControlType4.Enum, title: "Direction", options: [true, false], optionIcons: ["direction-horizontal", "direction-vertical"], displaySegmentedControl: true }, align: { type: ControlType4.Enum, title: "Align", options: ["flex-start", "center", "flex-end"], optionIcons: { axis: { true: ["align-top", "align-middle", "align-bottom"], false: ["align-left", "align-center", "align-right"] } }, defaultValue: "center", displaySegmentedControl: true }, gap: { type: ControlType4.Number, title: "Gap" }, ...paddingControl, sizingObject: { type: ControlType4.Object, title: "Sizing", controls: { widthType: { type: ControlType4.Enum, title: "Width", options: ["auto", "stretch", "columns"], optionTitles: ["Auto", "Stretch", "Columns"], defaultValue: "auto" }, widthInset: { type: ControlType4.Number, title: "Inset", min: 0, max: 500, defaultValue: 0, hidden: (props) => props.widthType !== "stretch" }, widthColumns: { type: ControlType4.Number, title: "Columns", min: 1, max: 10, defaultValue: 2, displayStepper: true, hidden: (props) => props.widthType !== "columns" }, heightType: { type: ControlType4.Enum, title: "Height", options: ["auto", "stretch", "rows"], optionTitles: ["Auto", "Stretch", "Rows"], defaultValue: "auto" }, heightInset: { type: ControlType4.Number, title: "Inset", min: 0, max: 500, defaultValue: 0, hidden: (props) => props.heightType !== "stretch" }, heightRows: { type: ControlType4.Number, title: "Rows", min: 1, max: 10, defaultValue: 2, displayStepper: true, hidden: (props) => props.heightType !== "rows" } } }, snapObject: { type: ControlType4.Object, title: "Snapping", controls: { snap: { type: ControlType4.Boolean, title: "Enable" }, snapEdge: { type: ControlType4.Enum, title: "Edge", options: ["start", "center", "end"], optionTitles: ["Left", "Center", "Right"], defaultValue: "center", hidden: (props) => !props.snap }, fluid: { type: ControlType4.Boolean, title: "Fluid", defaultValue: false, hidden: (props) => !props.snap } } }, fadeObject: { type: ControlType4.Object, title: "Fading", controls: { fadeContent: { type: ControlType4.Boolean, title: "Enable", defaultValue: false }, fadeWidth: { type: ControlType4.Number, title: "Width", defaultValue: 25, min: 0, max: 100, unit: "%", hidden: (props) => !props.fadeContent }, fadeInset: { type: ControlType4.Number, title: "Inset", defaultValue: 0, min: 0, max: 100, unit: "%", hidden: (props) => !props.fadeContent }, fadeAlpha: { type: ControlType4.Number, title: "Opacity", hidden: (props) => !props.fadeContent, min: 0, max: 1, step: 0.05, defaultValue: 0 }, fadeTransition: { type: ControlType4.Transition, title: "Transition", hidden: (props) => !props.fadeContent } } }, progressObject: { type: ControlType4.Object, title: "Progress", controls: { showScrollbar: { type: ControlType4.Boolean, title: "Scroll Bar", defaultValue: false }, showProgressDots: { type: ControlType4.Boolean, title: "Dots", defaultValue: false, hidden: (props) => props.showScrollbar }, dotSize: { type: ControlType4.Number, title: "Size", min: 1, max: 100, defaultValue: 10, displayStepper: true, hidden: (props) => !props.showProgressDots || props.showScrollbar }, dotsInset: { type: ControlType4.Number, title: "Inset", min: 0, max: 100, defaultValue: 10, displayStepper: true, hidden: (props) => !props.showProgressDots || props.showScrollbar }, dotsGap: { type: ControlType4.Number, title: "Gap", min: 0, max: 100, defaultValue: 10, displayStepper: true, hidden: (props) => !props.showProgressDots || props.showScrollbar }, dotsPadding: { type: ControlType4.Number, title: "Padding", min: 0, max: 100, defaultValue: 10, displayStepper: true, hidden: (props) => !props.showProgressDots || props.showScrollbar }, dotsFill: { type: ControlType4.Color, title: "Fill", defaultValue: "#fff", hidden: (props) => !props.showProgressDots || props.showScrollbar }, dotsBackground: { type: ControlType4.Color, title: "Backdrop", defaultValue: "rgba(0,0,0,0.2)", hidden: (props) => !props.showProgressDots || props.showScrollbar }, dotsRadius: { type: ControlType4.Number, title: "Radius", min: 0, max: 200, defaultValue: 50, hidden: (props) => !props.showProgressDots || props.showScrollbar }, dotsOpacity: { type: ControlType4.Number, title: "Opacity", min: 0, max: 1, defaultValue: 0.5, step: 0.1, displayStepper: true, hidden: (props) => !props.showProgressDots || props.showScrollbar }, dotsActiveOpacity: { type: ControlType4.Number, title: "Current", min: 0, max: 1, defaultValue: 1, step: 0.1, displayStepper: true, hidden: (props) => !props.showProgressDots || props.showScrollbar }, dotsBlur: { type: ControlType4.Number, title: "Blur", min: 0, max: 50, defaultValue: 4, step: 1, hidden: (props) => !props.showProgressDots || props.showScrollbar } } }, arrowObject: { type: ControlType4.Object, title: "Arrows", controls: { showMouseControls: { type: ControlType4.Boolean, title: "Show", defaultValue: true }, arrowFill: { type: ControlType4.Color, title: "Fill", defaultValue: "rgba(0,0,0,0.2)", hidden: (props) => !props.showMouseControls }, leftArrow: { type: ControlType4.Image, title: "Previous", hidden: (props) => !props.showMouseControls }, rightArrow: { type: ControlType4.Image, title: "Next", hidden: (props) => !props.showMouseControls }, arrowSize: { type: ControlType4.Number, title: "Size", min: 0, max: 200, displayStepper: true, defaultValue: 40, hidden: (props) => !props.showMouseControls }, arrowRadius: { type: ControlType4.Number, title: "Radius", min: 0, max: 500, defaultValue: 40, hidden: (props) => !props.showMouseControls }, arrowPadding: { type: ControlType4.Number, title: "Inset", min: 0, max: 100, defaultValue: 20, displayStepper: true, hidden: (props) => !props.showMouseControls } } }, ariaLabel: { type: ControlType4.String, title: "Aria Label", placeholder: "Movies..." }, borderRadius: { type: ControlType4.Number, title: "Radius", min: 0, max: 500, displayStepper: true, defaultValue: 0 } });
function Dot({ currentScroll, scrollInfo, isSelected, selectedOpacity, opacity: unselectedOpacity, total, index, dotStyle: dotStyle2, buttonStyle, gap, padding, axis, directionModifier, ...props }) {
  const opacity = useTransform(currentScroll, (v3) => {
    if (!scrollInfo.current?.scrollLength) {
      return index === 0 ? selectedOpacity : unselectedOpacity;
    }
    const currentScroll2 = v3 * directionModifier;
    const pageLength = scrollInfo.current?.scrollLength / total;
    const minScroll = pageLength * index;
    const maxScroll = minScroll + pageLength;
    const isSelected2 = currentScroll2 >= minScroll && (index < total - 1 ? currentScroll2 < maxScroll : index === total - 1);
    return isSelected2 ? selectedOpacity : unselectedOpacity;
  });
  const inlinePadding = gap / 2;
  let top = !axis && index > 0 ? inlinePadding : padding;
  let bottom = !axis && index !== total - 1 ? inlinePadding : padding;
  let right = axis && index !== total - 1 ? inlinePadding : padding;
  let left = axis && index > 0 ? inlinePadding : padding;
  return /* @__PURE__ */ _jsx("button", { "aria-label": `Scroll to page ${index + 1}`, type: "button", ...props, style: { ...buttonStyle, padding: `${top}px ${right}px ${bottom}px ${left}px` }, children: /* @__PURE__ */ _jsx(motion.div, { style: { ...dotStyle2, opacity } }) });
}
function Placeholder() {
  return /* @__PURE__ */ _jsxs("section", { style: placeholderStyles, children: [/* @__PURE__ */ _jsx("div", { style: emojiStyles, children: "\u2728" }), /* @__PURE__ */ _jsx("p", { style: titleStyles, children: "Connect to Content" }), /* @__PURE__ */ _jsx("p", { style: subtitleStyles, children: "Add layers or components to swipe between." })] });
}
function MouseStyles() {
  return /* @__PURE__ */ _jsx("div", { dangerouslySetInnerHTML: { __html: `<style>@media (pointer: fine) {
                .framer--carousel[data-show-scrollbar="false"]::-webkit-scrollbar {
                    display: none;
                    -webkit-appearance: none;
                    width: 0;
                    height: 0;
                }

                .framer--carousel[data-show-scrollbar="false"]::-webkit-scrollbar-thumb {
                    display: none;
                }

                .framer--carousel[data-show-scrollbar="false"] {
                    scrollbar-width: none;
                    scrollbar-height: none;
                }
            }</style>` } });
}
var placeholderStyles = { display: "flex", width: "100%", height: "100%", placeContent: "center", placeItems: "center", flexDirection: "column", color: "#96F", background: "rgba(136, 85, 255, 0.1)", fontSize: 11, overflow: "hidden", padding: "20px 20px 30px 20px" };
var emojiStyles = { fontSize: 32, marginBottom: 10 };
var titleStyles = { margin: 0, marginBottom: 10, fontWeight: 600, textAlign: "center" };
var subtitleStyles = { margin: 0, opacity: 0.7, maxWidth: 130, lineHeight: 1.5, textAlign: "center" };
var baseContainerStyle = { display: "flex", overflow: "hidden", width: "100%", height: "100%", position: "relative" };
var baseCarouselStyle = { padding: 0, margin: 0, listStyle: "none", position: "relative", display: "flex", flex: "1 1 100%", width: "100%", height: "100%" };
var baseButtonStyles = { border: "none", display: "flex", placeContent: "center", placeItems: "center", overflow: "hidden", background: "transparent", cursor: "pointer", margin: 0, padding: 0 };
var controlsStyles = { display: "flex", justifyContent: "space-between", alignItems: "center", position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", border: 0, padding: 0, margin: 0 };
var dotsContainerStyle = { display: "flex", placeContent: "center", placeItems: "center", overflow: "hidden", position: "absolute", pointerEvents: "auto" };
var dotStyle = { borderRadius: "50%", background: "white", cursor: "pointer", border: "none", placeContent: "center", placeItems: "center", padding: 0 };
function useWritingDirection() {
  const [writingDirection, setWritingDirection] = useState3("ltr");
  useEffect7(() => {
    if (__dai_window?.document?.documentElement?.dir === "rtl") {
      setWritingDirection("rtl");
    }
  }, []);
  return writingDirection;
}
function AutoIdLayoutGroup({ children, ...props }) {
  const id = useId();
  return /* @__PURE__ */ _jsx(LayoutGroup, { id, ...props, children });
}

// http-url:https://framerusercontent.com/modules/pZnfY0Y5oVEwIFWbwseo/nLQuNacprbzBwAoMYKOX/wWC8EGMFo.js
import { addPropertyControls as e5, ControlType as l3, lazy as t4, QueryEngine as a3 } from "./_framer-runtime.js";

// http-url:https://framerusercontent.com/modules/pZnfY0Y5oVEwIFWbwseo/nLQuNacprbzBwAoMYKOX/wWC8EGMFo-0.js
import { ControlType as y } from "./_framer-runtime.js";
import { ControlType as P } from "./_framer-runtime.js";
var t;
var e = Object.create;
var r = Object.defineProperty;
var n = Object.getOwnPropertyDescriptor;
var i = Object.getOwnPropertyNames;
var s = Object.getPrototypeOf;
var a = Object.prototype.hasOwnProperty;
var o = (t5, e6, n4) => e6 in t5 ? r(t5, e6, { enumerable: true, configurable: true, writable: true, value: n4 }) : t5[e6] = n4;
var u = (t5, e6) => function() {
  return e6 || (0, t5[i(t5)[0]])((e6 = { exports: {} }).exports, e6), e6.exports;
};
var l = (t5, e6, s4, o3) => {
  if (e6 && "object" == typeof e6 || "function" == typeof e6)
    for (let u4 of i(e6))
      a.call(t5, u4) || u4 === s4 || r(t5, u4, { get: () => e6[u4], enumerable: !(o3 = n(e6, u4)) || o3.enumerable });
  return t5;
};
var h = (t5, n4, i3) => (i3 = null != t5 ? e(s(t5)) : {}, l(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  !n4 && t5 && t5.__esModule ? i3 : r(i3, "default", { value: t5, enumerable: true }),
  t5
));
var c = (t5, e6, r3) => o(t5, "symbol" != typeof e6 ? e6 + "" : e6, r3);
var f = u({ "../../../node_modules/dataloader/index.js"(t5, e6) {
  var r3, n4 = /* @__PURE__ */ function() {
    function t6(t7, e8) {
      if ("function" != typeof t7)
        throw TypeError("DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but got: " + t7 + ".");
      this._batchLoadFn = t7, this._maxBatchSize = function(t8) {
        if (!(!t8 || false !== t8.batch))
          return 1;
        var e9 = t8 && t8.maxBatchSize;
        if (void 0 === e9)
          return 1 / 0;
        if ("number" != typeof e9 || e9 < 1)
          throw TypeError("maxBatchSize must be a positive number: " + e9);
        return e9;
      }(e8), this._batchScheduleFn = function(t8) {
        var e9 = t8 && t8.batchScheduleFn;
        if (void 0 === e9)
          return i3;
        if ("function" != typeof e9)
          throw TypeError("batchScheduleFn must be a function: " + e9);
        return e9;
      }(e8), this._cacheKeyFn = function(t8) {
        var e9 = t8 && t8.cacheKeyFn;
        if (void 0 === e9)
          return function(t9) {
            return t9;
          };
        if ("function" != typeof e9)
          throw TypeError("cacheKeyFn must be a function: " + e9);
        return e9;
      }(e8), this._cacheMap = function(t8) {
        if (!(!t8 || false !== t8.cache))
          return null;
        var e9 = t8 && t8.cacheMap;
        if (void 0 === e9)
          return /* @__PURE__ */ new Map();
        if (null !== e9) {
          var r4 = ["get", "set", "delete", "clear"].filter(function(t9) {
            return e9 && "function" != typeof e9[t9];
          });
          if (0 !== r4.length)
            throw TypeError("Custom cacheMap missing methods: " + r4.join(", "));
        }
        return e9;
      }(e8), this._batch = null, this.name = e8 && e8.name ? e8.name : null;
    }
    var e7 = t6.prototype;
    return e7.load = function(t7) {
      if (null == t7)
        throw TypeError("The loader.load() function must be called with a value, but got: " + String(t7) + ".");
      var e8 = function(t8) {
        var e9 = t8._batch;
        if (null !== e9 && !e9.hasDispatched && e9.keys.length < t8._maxBatchSize)
          return e9;
        var r5 = { hasDispatched: false, keys: [], callbacks: [] };
        return t8._batch = r5, t8._batchScheduleFn(function() {
          (function(t9, e10) {
            var r6;
            if (e10.hasDispatched = true, 0 === e10.keys.length) {
              a4(e10);
              return;
            }
            try {
              r6 = t9._batchLoadFn(e10.keys);
            } catch (r7) {
              return s4(t9, e10, TypeError("DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function errored synchronously: " + String(r7) + "."));
            }
            if (!r6 || "function" != typeof r6.then)
              return s4(t9, e10, TypeError("DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function did not return a Promise: " + String(r6) + "."));
            r6.then(function(t10) {
              if (!o3(t10))
                throw TypeError("DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function did not return a Promise of an Array: " + String(t10) + ".");
              if (t10.length !== e10.keys.length)
                throw TypeError("DataLoader must be constructed with a function which accepts Array<key> and returns Promise<Array<value>>, but the function did not return a Promise of an Array of the same length as the Array of keys.\n\nKeys:\n" + String(e10.keys) + "\n\nValues:\n" + String(t10));
              a4(e10);
              for (var r7 = 0; r7 < e10.callbacks.length; r7++) {
                var n6 = t10[r7];
                n6 instanceof Error ? e10.callbacks[r7].reject(n6) : e10.callbacks[r7].resolve(n6);
              }
            }).catch(function(r7) {
              s4(t9, e10, r7);
            });
          })(t8, r5);
        }), r5;
      }(this), r4 = this._cacheMap, n5 = this._cacheKeyFn(t7);
      if (r4) {
        var i4 = r4.get(n5);
        if (i4) {
          var u4 = e8.cacheHits || (e8.cacheHits = []);
          return new Promise(function(t8) {
            u4.push(function() {
              t8(i4);
            });
          });
        }
      }
      e8.keys.push(t7);
      var l4 = new Promise(function(t8, r5) {
        e8.callbacks.push({ resolve: t8, reject: r5 });
      });
      return r4 && r4.set(n5, l4), l4;
    }, e7.loadMany = function(t7) {
      if (!o3(t7))
        throw TypeError("The loader.loadMany() function must be called with Array<key> but got: " + t7 + ".");
      for (var e8 = [], r4 = 0; r4 < t7.length; r4++)
        e8.push(this.load(t7[r4]).catch(function(t8) {
          return t8;
        }));
      return Promise.all(e8);
    }, e7.clear = function(t7) {
      var e8 = this._cacheMap;
      if (e8) {
        var r4 = this._cacheKeyFn(t7);
        e8.delete(r4);
      }
      return this;
    }, e7.clearAll = function() {
      var t7 = this._cacheMap;
      return t7 && t7.clear(), this;
    }, e7.prime = function(t7, e8) {
      var r4 = this._cacheMap;
      if (r4) {
        var n5, i4 = this._cacheKeyFn(t7);
        void 0 === r4.get(i4) && (e8 instanceof Error ? (n5 = Promise.reject(e8)).catch(function() {
        }) : n5 = Promise.resolve(e8), r4.set(i4, n5));
      }
      return this;
    }, t6;
  }(), i3 = "object" == typeof process && "function" == typeof process.nextTick ? function(t6) {
    r3 || (r3 = Promise.resolve()), r3.then(function() {
      process.nextTick(t6);
    });
  } : "function" == typeof setImmediate ? function(t6) {
    setImmediate(t6);
  } : function(t6) {
    setTimeout(t6);
  };
  function s4(t6, e7, r4) {
    a4(e7);
    for (var n5 = 0; n5 < e7.keys.length; n5++)
      t6.clear(e7.keys[n5]), e7.callbacks[n5].reject(r4);
  }
  function a4(t6) {
    if (t6.cacheHits)
      for (var e7 = 0; e7 < t6.cacheHits.length; e7++)
        t6.cacheHits[e7]();
  }
  function o3(t6) {
    return "object" == typeof t6 && null !== t6 && "number" == typeof t6.length && (0 === t6.length || t6.length > 0 && Object.prototype.hasOwnProperty.call(t6, t6.length - 1));
  }
  e6.exports = n4;
} });
var d = h(f(), 1);
var g = { Uint8: 1, Uint16: 2, Uint32: 4, BigUint64: 8, Int8: 1, Int16: 2, Int32: 4, BigInt64: 8, Float32: 4, Float64: 8 };
var p = class {
  getOffset() {
    return this.offset;
  }
  ensureLength(t5) {
    let e6 = this.bytes.length;
    if (!(this.offset + t5 <= e6))
      throw Error("Reading out of bounds");
  }
  readUint8() {
    let t5 = g.Uint8;
    this.ensureLength(t5);
    let e6 = this.view.getUint8(this.offset);
    return this.offset += t5, e6;
  }
  readUint16() {
    let t5 = g.Uint16;
    this.ensureLength(t5);
    let e6 = this.view.getUint16(this.offset);
    return this.offset += t5, e6;
  }
  readUint32() {
    let t5 = g.Uint32;
    this.ensureLength(t5);
    let e6 = this.view.getUint32(this.offset);
    return this.offset += t5, e6;
  }
  readUint64() {
    let t5 = this.readBigUint64();
    return Number(t5);
  }
  readBigUint64() {
    let t5 = g.BigUint64;
    this.ensureLength(t5);
    let e6 = this.view.getBigUint64(this.offset);
    return this.offset += t5, e6;
  }
  readInt8() {
    let t5 = g.Int8;
    this.ensureLength(t5);
    let e6 = this.view.getInt8(this.offset);
    return this.offset += t5, e6;
  }
  readInt16() {
    let t5 = g.Int16;
    this.ensureLength(t5);
    let e6 = this.view.getInt16(this.offset);
    return this.offset += t5, e6;
  }
  readInt32() {
    let t5 = g.Int32;
    this.ensureLength(t5);
    let e6 = this.view.getInt32(this.offset);
    return this.offset += t5, e6;
  }
  readInt64() {
    let t5 = this.readBigInt64();
    return Number(t5);
  }
  readBigInt64() {
    let t5 = g.BigInt64;
    this.ensureLength(t5);
    let e6 = this.view.getBigInt64(this.offset);
    return this.offset += t5, e6;
  }
  readFloat32() {
    let t5 = g.Float32;
    this.ensureLength(t5);
    let e6 = this.view.getFloat32(this.offset);
    return this.offset += t5, e6;
  }
  readFloat64() {
    let t5 = g.Float64;
    this.ensureLength(t5);
    let e6 = this.view.getFloat64(this.offset);
    return this.offset += t5, e6;
  }
  readBytes(t5) {
    let e6 = this.offset, r3 = e6 + t5, n4 = this.bytes.subarray(e6, r3);
    return this.offset = r3, n4;
  }
  readString() {
    let t5 = this.readUint32(), e6 = this.readBytes(t5);
    return this.decoder.decode(e6);
  }
  readJson() {
    let t5 = this.readString();
    return JSON.parse(t5);
  }
  constructor(t5) {
    this.bytes = t5, c(this, "offset", 0), c(this, "view"), c(this, "decoder", new TextDecoder()), this.view = v(this.bytes);
  }
};
function v(t5) {
  return new DataView(t5.buffer, t5.byteOffset, t5.byteLength);
}
var m = "undefined" != typeof __dai_window;
var w = m && "function" == typeof __dai_window.requestIdleCallback;
function I(t5, ...e6) {
  if (!t5)
    throw Error("Assertion Error" + (e6.length > 0 ? ": " + e6.join(" ") : ""));
}
function b(t5) {
  throw Error(`Unexpected value: ${t5}`);
}
var U = 1024;
var S = 1.5;
var k = (t5) => 2 ** t5 - 1;
var L = (t5) => -(2 ** (t5 - 1));
var B = (t5) => 2 ** (t5 - 1) - 1;
var E = { Uint8: 0, Uint16: 0, Uint32: 0, Uint64: 0, BigUint64: 0, Int8: L(8), Int16: L(16), Int32: L(32), Int64: Number.MIN_SAFE_INTEGER, BigInt64: -(BigInt(2) ** BigInt(63)) };
var M = { Uint8: k(8), Uint16: k(16), Uint32: k(32), Uint64: Number.MAX_SAFE_INTEGER, BigUint64: BigInt(2) ** BigInt(64) - BigInt(1), Int8: B(8), Int16: B(16), Int32: B(32), Int64: Number.MAX_SAFE_INTEGER, BigInt64: BigInt(2) ** BigInt(63) - BigInt(1) };
function T(t5, e6, r3, n4) {
  I(t5 >= e6, t5, "outside lower bound for", n4), I(t5 <= r3, t5, "outside upper bound for", n4);
}
var F = class {
  getOffset() {
    return this.offset;
  }
  slice(t5 = 0, e6 = this.offset) {
    return this.bytes.slice(t5, e6);
  }
  subarray(t5 = 0, e6 = this.offset) {
    return this.bytes.subarray(t5, e6);
  }
  ensureLength(t5) {
    let e6 = this.bytes.length;
    if (this.offset + t5 <= e6)
      return;
    let r3 = new Uint8Array(Math.ceil(e6 * S) + t5);
    r3.set(this.bytes), this.bytes = r3, this.view = v(r3);
  }
  writeUint8(t5) {
    T(t5, E.Uint8, M.Uint8, "Uint8");
    let e6 = g.Uint8;
    this.ensureLength(e6), this.view.setUint8(this.offset, t5), this.offset += e6;
  }
  writeUint16(t5) {
    T(t5, E.Uint16, M.Uint16, "Uint16");
    let e6 = g.Uint16;
    this.ensureLength(e6), this.view.setUint16(this.offset, t5), this.offset += e6;
  }
  writeUint32(t5) {
    T(t5, E.Uint32, M.Uint32, "Uint32");
    let e6 = g.Uint32;
    this.ensureLength(e6), this.view.setUint32(this.offset, t5), this.offset += e6;
  }
  writeUint64(t5) {
    T(t5, E.Uint64, M.Uint64, "Uint64");
    let e6 = BigInt(t5);
    this.writeBigUint64(e6);
  }
  writeBigUint64(t5) {
    T(t5, E.BigUint64, M.BigUint64, "BigUint64");
    let e6 = g.BigUint64;
    this.ensureLength(e6), this.view.setBigUint64(this.offset, t5), this.offset += e6;
  }
  writeInt8(t5) {
    T(t5, E.Int8, M.Int8, "Int8");
    let e6 = g.Int8;
    this.ensureLength(e6), this.view.setInt8(this.offset, t5), this.offset += e6;
  }
  writeInt16(t5) {
    T(t5, E.Int16, M.Int16, "Int16");
    let e6 = g.Int16;
    this.ensureLength(e6), this.view.setInt16(this.offset, t5), this.offset += e6;
  }
  writeInt32(t5) {
    T(t5, E.Int32, M.Int32, "Int32");
    let e6 = g.Int32;
    this.ensureLength(e6), this.view.setInt32(this.offset, t5), this.offset += e6;
  }
  writeInt64(t5) {
    T(t5, E.Int64, M.Int64, "Int64");
    let e6 = BigInt(t5);
    this.writeBigInt64(e6);
  }
  writeBigInt64(t5) {
    T(t5, E.BigInt64, M.BigInt64, "BigInt64");
    let e6 = g.BigInt64;
    this.ensureLength(e6), this.view.setBigInt64(this.offset, t5), this.offset += e6;
  }
  writeFloat32(t5) {
    let e6 = g.Float32;
    this.ensureLength(e6), this.view.setFloat32(this.offset, t5), this.offset += e6;
  }
  writeFloat64(t5) {
    let e6 = g.Float64;
    this.ensureLength(e6), this.view.setFloat64(this.offset, t5), this.offset += e6;
  }
  writeBytes(t5) {
    let e6 = t5.length;
    this.ensureLength(e6), this.bytes.set(t5, this.offset), this.offset += e6;
  }
  encodeString(t5) {
    let e6 = this.encodedStrings.get(t5);
    if (e6)
      return e6;
    let r3 = this.encoder.encode(t5);
    return this.encodedStrings.set(t5, r3), r3;
  }
  writeString(t5) {
    let e6 = this.encodeString(t5), r3 = e6.length;
    this.writeUint32(r3), this.writeBytes(e6);
  }
  writeJson(t5) {
    let e6 = JSON.stringify(t5);
    this.writeString(e6);
  }
  constructor() {
    c(this, "offset", 0), c(this, "bytes", new Uint8Array(U)), c(this, "view", v(this.bytes)), c(this, "encoder", new TextEncoder()), c(this, "encodedStrings", /* @__PURE__ */ new Map());
  }
};
function x(t5) {
  return "string" == typeof t5;
}
function N(t5) {
  return Number.isFinite(t5);
}
function A(t5) {
  return null === t5;
}
var O = class t2 {
  static fromString(e6) {
    let [r3, n4, i3] = e6.split("/").map(Number);
    return I(N(r3), "Invalid chunkId"), I(N(n4), "Invalid offset"), I(N(i3), "Invalid length"), new t2(r3, n4, i3);
  }
  toString() {
    return `${this.chunkId}/${this.offset}/${this.length}`;
  }
  static read(e6) {
    let r3 = e6.readUint16(), n4 = e6.readUint32(), i3 = e6.readUint32();
    return new t2(r3, n4, i3);
  }
  write(t5) {
    t5.writeUint16(this.chunkId), t5.writeUint32(this.offset), t5.writeUint32(this.length);
  }
  compare(t5) {
    return this.chunkId < t5.chunkId ? -1 : this.chunkId > t5.chunkId ? 1 : this.offset < t5.offset ? -1 : this.offset > t5.offset ? 1 : (I(this.length === t5.length), 0);
  }
  constructor(t5, e6, r3) {
    this.chunkId = t5, this.offset = e6, this.length = r3;
  }
};
function R(t5) {
  if (A(t5))
    return 0;
  switch (t5.type) {
    case P.Array:
      return 1;
    case P.Boolean:
      return 2;
    case P.Color:
      return 3;
    case P.Date:
      return 4;
    case P.Enum:
      return 5;
    case P.File:
      return 6;
    case P.ResponsiveImage:
      return 10;
    case P.Link:
      return 7;
    case P.Number:
      return 8;
    case P.Object:
      return 9;
    case P.RichText:
      return 11;
    case P.String:
      return 12;
    case P.VectorSetItem:
      return 13;
    default:
      b(t5);
  }
}
function q(e6) {
  let r3 = e6.readUint16(), n4 = [];
  for (let i3 = 0; i3 < r3; i3++) {
    let r4 = t.read(e6);
    n4.push(r4);
  }
  return { type: P.Array, value: n4 };
}
function _(e6, r3) {
  for (let n4 of (e6.writeUint16(r3.value.length), r3.value))
    t.write(e6, n4);
}
function D(e6, r3, n4) {
  let i3 = e6.value.length, s4 = r3.value.length;
  if (i3 < s4)
    return -1;
  if (i3 > s4)
    return 1;
  for (let s5 = 0; s5 < i3; s5++) {
    let i4 = e6.value[s5], a4 = r3.value[s5], o3 = t.compare(i4, a4, n4);
    if (0 !== o3)
      return o3;
  }
  return 0;
}
function j(t5) {
  return { type: P.Boolean, value: 0 !== t5.readUint8() };
}
function C(t5, e6) {
  t5.writeUint8(e6.value ? 1 : 0);
}
function J(t5, e6) {
  return t5.value < e6.value ? -1 : t5.value > e6.value ? 1 : 0;
}
function V(t5) {
  return { type: P.Color, value: t5.readString() };
}
function W(t5, e6) {
  t5.writeString(e6.value);
}
function $(t5, e6) {
  return t5.value < e6.value ? -1 : t5.value > e6.value ? 1 : 0;
}
function z(t5) {
  let e6 = t5.readInt64(), r3 = new Date(e6);
  return { type: P.Date, value: r3.toISOString() };
}
function G(t5, e6) {
  let r3 = new Date(e6.value), n4 = r3.getTime();
  t5.writeInt64(n4);
}
function K(t5, e6) {
  let r3 = new Date(t5.value), n4 = new Date(e6.value);
  return r3 < n4 ? -1 : r3 > n4 ? 1 : 0;
}
function H(t5) {
  return { type: P.Enum, value: t5.readString() };
}
function X(t5, e6) {
  t5.writeString(e6.value);
}
function Q(t5, e6) {
  return t5.value < e6.value ? -1 : t5.value > e6.value ? 1 : 0;
}
function Y(t5) {
  return { type: P.File, value: t5.readString() };
}
function Z(t5, e6) {
  t5.writeString(e6.value);
}
function tt(t5, e6) {
  return t5.value < e6.value ? -1 : t5.value > e6.value ? 1 : 0;
}
function te(t5) {
  return { type: P.Link, value: t5.readJson() };
}
function tr(t5, e6) {
  t5.writeJson(e6.value);
}
function tn(t5, e6) {
  let r3 = JSON.stringify(t5.value), n4 = JSON.stringify(e6.value);
  return r3 < n4 ? -1 : r3 > n4 ? 1 : 0;
}
function ti(t5) {
  return { type: P.Number, value: t5.readFloat64() };
}
function ts(t5, e6) {
  t5.writeFloat64(e6.value);
}
function ta(t5, e6) {
  return t5.value < e6.value ? -1 : t5.value > e6.value ? 1 : 0;
}
function to(e6) {
  let r3 = e6.readUint16(), n4 = {};
  for (let i3 = 0; i3 < r3; i3++) {
    let r4 = e6.readString();
    n4[r4] = t.read(e6);
  }
  return { type: P.Object, value: n4 };
}
function tu(e6, r3) {
  let n4 = Object.entries(r3.value);
  for (let [r4, i3] of (e6.writeUint16(n4.length), n4))
    e6.writeString(r4), t.write(e6, i3);
}
function tl(e6, r3, n4) {
  let i3 = Object.keys(e6.value).sort(), s4 = Object.keys(r3.value).sort();
  if (i3.length < s4.length)
    return -1;
  if (i3.length > s4.length)
    return 1;
  for (let a4 = 0; a4 < i3.length; a4++) {
    let o3 = i3[a4], u4 = s4[a4];
    if (o3 < u4)
      return -1;
    if (o3 > u4)
      return 1;
    let l4 = e6.value[o3] ?? null, h3 = r3.value[u4] ?? null, c4 = t.compare(l4, h3, n4);
    if (0 !== c4)
      return c4;
  }
  return 0;
}
function th(t5) {
  return { type: P.ResponsiveImage, value: t5.readJson() };
}
function tc(t5, e6) {
  t5.writeJson(e6.value);
}
function tf(t5, e6) {
  let r3 = JSON.stringify(t5.value), n4 = JSON.stringify(e6.value);
  return r3 < n4 ? -1 : r3 > n4 ? 1 : 0;
}
function td(t5) {
  let e6 = t5.readInt8();
  if (0 === e6)
    return { type: P.RichText, value: t5.readUint32() };
  if (1 === e6)
    return { type: P.RichText, value: t5.readString() };
  throw Error("Invalid rich text pointer");
}
function tg(t5, e6) {
  if (N(e6.value)) {
    t5.writeInt8(0), t5.writeUint32(e6.value);
    return;
  }
  if (x(e6.value)) {
    t5.writeInt8(1), t5.writeString(e6.value);
    return;
  }
  throw Error("Invalid rich text pointer");
}
function tp(t5, e6) {
  let r3 = t5.value, n4 = e6.value;
  if (N(r3) && N(n4) || x(r3) && x(n4))
    return r3 < n4 ? -1 : r3 > n4 ? 1 : 0;
  throw Error("Invalid rich text pointer");
}
function tv(t5) {
  return { type: P.String, value: t5.readString() };
}
function ty(t5, e6) {
  t5.writeString(e6.value);
}
function tm(t5, e6, r3) {
  let n4 = t5.value, i3 = e6.value;
  return (0 === r3.type && (n4 = t5.value.toLowerCase(), i3 = e6.value.toLowerCase()), n4 < i3) ? -1 : n4 > i3 ? 1 : 0;
}
function tw(t5) {
  return { type: P.VectorSetItem, value: t5.readUint32() };
}
function tI(t5, e6) {
  t5.writeUint32(e6.value);
}
function tb(t5, e6) {
  let r3 = t5.value, n4 = e6.value;
  return r3 < n4 ? -1 : r3 > n4 ? 1 : 0;
}
((t5) => {
  t5.read = function(t6) {
    let e6 = t6.readUint8();
    switch (e6) {
      case 0:
        return null;
      case 1:
        return q(t6);
      case 2:
        return j(t6);
      case 3:
        return V(t6);
      case 4:
        return z(t6);
      case 5:
        return H(t6);
      case 6:
        return Y(t6);
      case 7:
        return te(t6);
      case 8:
        return ti(t6);
      case 9:
        return to(t6);
      case 10:
        return th(t6);
      case 11:
        return td(t6);
      case 12:
        return tv(t6);
      case 13:
        return tw(t6);
      default:
        b(e6);
    }
  }, t5.write = function(t6, e6) {
    let r3 = R(e6);
    if (t6.writeUint8(r3), !A(e6))
      switch (e6.type) {
        case P.Array:
          return _(t6, e6);
        case P.Boolean:
          return C(t6, e6);
        case P.Color:
          return W(t6, e6);
        case P.Date:
          return G(t6, e6);
        case P.Enum:
          return X(t6, e6);
        case P.File:
          return Z(t6, e6);
        case P.Link:
          return tr(t6, e6);
        case P.Number:
          return ts(t6, e6);
        case P.Object:
          return tu(t6, e6);
        case P.ResponsiveImage:
          return tc(t6, e6);
        case P.RichText:
          return tg(t6, e6);
        case P.VectorSetItem:
          return tI(t6, e6);
        case P.String:
          return ty(t6, e6);
        default:
          b(e6);
      }
  }, t5.compare = function(t6, e6, r3) {
    let n4 = R(t6), i3 = R(e6);
    if (n4 < i3)
      return -1;
    if (n4 > i3)
      return 1;
    if (A(t6) || A(e6))
      return 0;
    switch (t6.type) {
      case P.Array:
        return I(e6.type === P.Array), D(t6, e6, r3);
      case P.Boolean:
        return I(e6.type === P.Boolean), J(t6, e6);
      case P.Color:
        return I(e6.type === P.Color), $(t6, e6);
      case P.Date:
        return I(e6.type === P.Date), K(t6, e6);
      case P.Enum:
        return I(e6.type === P.Enum), Q(t6, e6);
      case P.File:
        return I(e6.type === P.File), tt(t6, e6);
      case P.Link:
        return I(e6.type === P.Link), tn(t6, e6);
      case P.Number:
        return I(e6.type === P.Number), ta(t6, e6);
      case P.Object:
        return I(e6.type === P.Object), tl(t6, e6, r3);
      case P.ResponsiveImage:
        return I(e6.type === P.ResponsiveImage), tf(t6, e6);
      case P.RichText:
        return I(e6.type === P.RichText), tp(t6, e6);
      case P.VectorSetItem:
        return I(e6.type === P.VectorSetItem), tb(t6, e6);
      case P.String:
        return I(e6.type === P.String), tm(t6, e6, r3);
      default:
        b(t6);
    }
  };
})(t || (t = {}));
var tU = class e2 {
  sortEntries() {
    this.entries.sort((e6, r3) => {
      for (let n4 = 0; n4 < this.fieldNames.length; n4++) {
        let i3 = e6.values[n4], s4 = r3.values[n4], a4 = t.compare(i3, s4, this.options.collation);
        if (0 !== a4)
          return a4;
      }
      return e6.pointer.compare(r3.pointer);
    });
  }
  static deserialize(r3) {
    let n4 = new p(r3), i3 = n4.readJson(), s4 = n4.readUint8(), a4 = [];
    for (let t5 = 0; t5 < s4; t5++) {
      let t6 = n4.readString();
      a4.push(t6);
    }
    let o3 = new e2(a4, { collation: i3 }), u4 = n4.readUint32();
    for (let e6 = 0; e6 < u4; e6++) {
      let e7 = [];
      for (let r5 = 0; r5 < s4; r5++) {
        let r6 = t.read(n4);
        e7.push(r6);
      }
      let r4 = O.read(n4);
      o3.entries.push({ values: e7, pointer: r4 });
    }
    return o3;
  }
  serialize() {
    let e6 = new F();
    for (let t5 of (e6.writeJson(this.options.collation), e6.writeUint8(this.fieldNames.length), this.fieldNames))
      e6.writeString(t5);
    for (let r3 of (this.sortEntries(), e6.writeUint32(this.entries.length), this.entries)) {
      let { values: n4, pointer: i3 } = r3;
      for (let r4 of n4)
        t.write(e6, r4);
      i3.write(e6);
    }
    return e6.subarray();
  }
  addItem(t5, e6) {
    let r3 = this.fieldNames.map((e7) => t5.getField(e7) ?? null);
    this.entries.push({ values: r3, pointer: e6 });
  }
  constructor(t5, e6) {
    this.fieldNames = t5, this.options = e6, c(this, "entries", []);
  }
};
var tS = 3;
var tk = 250;
var tL = [
  408,
  // Request Timeout
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
];
var tB = async (t5, e6) => {
  let r3 = 0;
  for (; ; ) {
    try {
      let n4 = await fetch(t5, e6);
      if (!tL.includes(n4.status) || ++r3 > tS)
        return n4;
    } catch (t6) {
      if (e6?.signal?.aborted || ++r3 > tS)
        throw t6;
    }
    await tE(r3);
  }
};
async function tE(t5) {
  let e6 = Math.floor(tk * (Math.random() + 1) * 2 ** (t5 - 1));
  await new Promise((t6) => {
    setTimeout(t6, e6);
  });
}
async function tM(t5, e6) {
  let r3 = tx(e6), n4 = [], i3 = 0;
  for (let t6 of r3)
    n4.push(`${t6.from}-${t6.to - 1}`), i3 += t6.to - t6.from;
  let s4 = new URL(t5), a4 = n4.join(",");
  s4.searchParams.set("range", a4);
  let o3 = await tB(s4);
  if (200 !== o3.status)
    throw Error(`Request failed: ${o3.status} ${o3.statusText}`);
  let u4 = await o3.arrayBuffer(), l4 = new Uint8Array(u4);
  if (l4.length !== i3)
    throw Error("Request failed: Unexpected response length");
  let h3 = new tT(), c4 = 0;
  for (let t6 of r3) {
    let e7 = t6.to - t6.from, r4 = c4 + e7, n5 = l4.subarray(c4, r4);
    h3.write(t6.from, n5), c4 = r4;
  }
  return e6.map((t6) => h3.read(t6.from, t6.to - t6.from));
}
var tT = class {
  read(t5, e6) {
    for (let r3 of this.chunks) {
      if (t5 < r3.start)
        break;
      if (t5 > r3.end)
        continue;
      if (t5 + e6 > r3.end)
        break;
      let n4 = t5 - r3.start, i3 = n4 + e6;
      return r3.data.slice(n4, i3);
    }
    throw Error("Missing data");
  }
  write(t5, e6) {
    let r3 = t5, n4 = r3 + e6.length, i3 = 0, s4 = this.chunks.length;
    for (; i3 < s4; i3++) {
      let t6 = this.chunks[i3];
      if (I(t6, "Missing chunk"), !(r3 > t6.end)) {
        if (r3 > t6.start) {
          let n5 = r3 - t6.start, i4 = t6.data.subarray(0, n5);
          e6 = tF(i4, e6), r3 = t6.start;
        }
        break;
      }
    }
    for (; s4 > i3; s4--) {
      let t6 = this.chunks[s4 - 1];
      if (I(t6, "Missing chunk"), !(n4 < t6.start)) {
        if (n4 < t6.end) {
          let r4 = n4 - t6.start, i4 = t6.data.subarray(r4);
          e6 = tF(e6, i4), n4 = t6.end;
        }
        break;
      }
    }
    let a4 = { start: r3, end: n4, data: e6 }, o3 = s4 - i3;
    this.chunks.splice(i3, o3, a4);
  }
  constructor() {
    c(this, "chunks", []);
  }
};
function tF(t5, e6) {
  let r3 = t5.length + e6.length, n4 = new Uint8Array(r3);
  return n4.set(t5, 0), n4.set(e6, t5.length), n4;
}
function tx(t5) {
  I(t5.length > 0, "Must have at least one range");
  let e6 = [...t5].sort((t6, e7) => t6.from - e7.from), r3 = [];
  for (let t6 of e6) {
    let e7 = r3.length - 1, n4 = r3[e7];
    n4 && t6.from <= n4.to ? r3[e7] = { from: n4.from, to: Math.max(n4.to, t6.to) } : r3.push(t6);
  }
  return r3;
}
var tN = class {
  async loadModel() {
    let [t5] = await tM(this.options.url, [this.options.range]);
    return I(t5, "Failed to load model"), tU.deserialize(t5);
  }
  async getModel() {
    return this.modelPromise ?? (this.modelPromise = this.loadModel()), this.model ?? (this.model = await this.modelPromise), this.model;
  }
  async lookupItems(t5) {
    I(t5.length === this.fields.length, "Invalid query length");
    let e6 = await this.getModel(), r3 = t5.reduce((t6, e7, r4) => t6.flatMap((t7) => {
      switch (e7.type) {
        case "All":
          return [t7];
        case "Equals":
          return this.queryEquals(t7, e7, r4);
        case "NotEquals":
          return this.queryNotEquals(t7, e7, r4);
        case "LessThan":
          return this.queryLessThan(t7, e7, r4);
        case "GreaterThan":
          return this.queryGreaterThan(t7, e7, r4);
        case "Contains":
          return this.queryContains(t7, e7, r4);
        case "StartsWith":
          return this.queryStartsWith(t7, e7, r4);
        case "EndsWith":
          return this.queryEndsWith(t7, e7, r4);
        default:
          b(e7);
      }
    }), [e6.entries]), n4 = [];
    for (let t6 of r3)
      for (let e7 of t6) {
        let t7 = {};
        for (let r4 = 0; r4 < this.options.fieldNames.length; r4++) {
          let n5 = this.options.fieldNames[r4], i3 = e7.values[r4];
          t7[n5] = i3;
        }
        n4.push({ pointer: e7.pointer.toString(), data: t7 });
      }
    return n4;
  }
  queryEquals(t5, e6, r3) {
    let n4 = this.getLeftMost(t5, r3, e6.value), i3 = this.getRightMost(t5, r3, e6.value), s4 = t5.slice(n4, i3 + 1);
    return s4.length > 0 ? [s4] : [];
  }
  queryNotEquals(t5, e6, r3) {
    let n4 = this.getLeftMost(t5, r3, e6.value), i3 = this.getRightMost(t5, r3, e6.value), s4 = [], a4 = t5.slice(0, n4);
    a4.length > 0 && s4.push(a4);
    let o3 = t5.slice(i3 + 1);
    return o3.length > 0 && s4.push(o3), s4;
  }
  queryLessThan(t5, e6, r3) {
    let n4 = this.getRightMost(t5, r3, null);
    if (t5 = t5.slice(n4 + 1), e6.inclusive) {
      let n5 = this.getRightMost(t5, r3, e6.value), i4 = t5.slice(0, n5 + 1);
      return i4.length > 0 ? [i4] : [];
    }
    let i3 = this.getLeftMost(t5, r3, e6.value), s4 = t5.slice(0, i3);
    return s4.length > 0 ? [s4] : [];
  }
  queryGreaterThan(t5, e6, r3) {
    let n4 = this.getRightMost(t5, r3, null);
    if (t5 = t5.slice(n4 + 1), e6.inclusive) {
      let n5 = this.getLeftMost(t5, r3, e6.value), i4 = t5.slice(n5);
      return i4.length > 0 ? [i4] : [];
    }
    let i3 = this.getRightMost(t5, r3, e6.value), s4 = t5.slice(i3 + 1);
    return s4.length > 0 ? [s4] : [];
  }
  queryContains(t5, e6, r3) {
    return this.findItems(t5, r3, (t6) => {
      if (t6?.type !== y.String || e6.value?.type !== y.String)
        return false;
      let r4 = t6.value, n4 = e6.value.value;
      return 0 === this.collation.type && (r4 = r4.toLowerCase(), n4 = n4.toLowerCase()), r4.includes(n4);
    });
  }
  queryStartsWith(t5, e6, r3) {
    return this.findItems(t5, r3, (t6) => {
      if (t6?.type !== y.String || e6.value?.type !== y.String)
        return false;
      let r4 = t6.value, n4 = e6.value.value;
      return 0 === this.collation.type && (r4 = r4.toLowerCase(), n4 = n4.toLowerCase()), r4.startsWith(n4);
    });
  }
  queryEndsWith(t5, e6, r3) {
    return this.findItems(t5, r3, (t6) => {
      if (t6?.type !== y.String || e6.value?.type !== y.String)
        return false;
      let r4 = t6.value, n4 = e6.value.value;
      return 0 === this.collation.type && (r4 = r4.toLowerCase(), n4 = n4.toLowerCase()), r4.endsWith(n4);
    });
  }
  /**
  * Returns the index of the left most entry that is equal to the target.
  *
  * ```text
  *   Left most
  *       ↓
  * ┌───┬───┬───┬───┬───┬───┐
  * │ 1 │ 2 │ 2 │ 2 │ 2 │ 3 │
  * └───┴───┴───┴───┴───┴───┘
  * ```
  *
  * @param entries The entries array to search in.
  * @param position The position of the value in the entry.
  * @param target The target value to search for.
  * @returns The index of the left most entry that is equal to the target.
  */
  getLeftMost(e6, r3, n4) {
    let i3 = 0, s4 = e6.length;
    for (; i3 < s4; ) {
      let a4 = i3 + s4 >> 1, o3 = e6[a4], u4 = o3.values[r3];
      0 > t.compare(u4, n4, this.collation) ? i3 = a4 + 1 : s4 = a4;
    }
    return i3;
  }
  /**
  * Returns the index of the right most entry that is equal to the target.
  *
  * ```text
  *              Right most
  *                   ↓
  * ┌───┬───┬───┬───┬───┬───┐
  * │ 1 │ 2 │ 2 │ 2 │ 2 │ 3 │
  * └───┴───┴───┴───┴───┴───┘
  * ```
  *
  * @param entries The entries array to search in.
  * @param position The position of the value in the entry.
  * @param target The target value to search for.
  * @returns The index of the right most entry that is equal to the target.
  */
  getRightMost(e6, r3, n4) {
    let i3 = 0, s4 = e6.length;
    for (; i3 < s4; ) {
      let a4 = i3 + s4 >> 1, o3 = e6[a4], u4 = o3.values[r3];
      t.compare(u4, n4, this.collation) > 0 ? s4 = a4 : i3 = a4 + 1;
    }
    return s4 - 1;
  }
  /**
  * Finds all items that are matching the predicate and groups adjacent items together.
  *
  * @param entries The entries array to search in.
  * @param position The position of the value in the entry.
  * @param predicate The predicate to match the values against.
  * @returns An array of chunks that match the predicate.
  */
  findItems(t5, e6, r3) {
    let n4 = [], i3 = 0;
    for (let s4 = 0; s4 < t5.length; s4++) {
      let a4 = t5[s4], o3 = a4.values[e6], u4 = r3(o3);
      if (!u4) {
        if (i3 < s4) {
          let e7 = t5.slice(i3, s4);
          n4.push(e7);
        }
        i3 = s4 + 1;
      }
    }
    if (i3 < t5.length) {
      let e7 = t5.slice(i3);
      n4.push(e7);
    }
    return n4;
  }
  constructor(t5) {
    this.options = t5, c(this, "schema"), c(this, "fields"), c(this, "supportedLookupTypes", [
      "All",
      "Equals",
      "NotEquals",
      "LessThan",
      "GreaterThan",
      "Contains",
      "StartsWith",
      "EndsWith"
      /* EndsWith */
    ]), c(this, "modelPromise"), c(this, "model"), c(this, "collation");
    let e6 = {}, r3 = [];
    for (let t6 of this.options.fieldNames) {
      let n4 = this.options.collectionSchema[t6];
      I(n4, "Missing definition for field", t6), e6[t6] = n4, r3.push({ type: "Identifier", name: t6 });
    }
    this.schema = e6, this.fields = r3, this.collation = this.options.collation;
  }
};
var tA = class e3 {
  static read(r3) {
    let n4 = new e3(), i3 = r3.readUint16();
    for (let e6 = 0; e6 < i3; e6++) {
      let e7 = r3.readString(), i4 = t.read(r3);
      n4.setField(e7, i4);
    }
    return n4;
  }
  write(e6) {
    for (let [r3, n4] of (e6.writeUint16(this.fields.size), this.fields))
      e6.writeString(r3), t.write(e6, n4);
  }
  getData() {
    let t5 = {};
    for (let [e6, r3] of this.fields)
      t5[e6] = r3;
    return t5;
  }
  setField(t5, e6) {
    this.fields.set(t5, e6);
  }
  getField(t5) {
    return this.fields.get(t5);
  }
  constructor() {
    c(this, "fields", /* @__PURE__ */ new Map());
  }
};
var tO = class {
  scanItems() {
    return this.itemsPromise ?? (this.itemsPromise = tB(this.url).then(async (t5) => {
      if (!t5.ok)
        throw Error(`Request failed: ${t5.status} ${t5.statusText}`);
      let e6 = await t5.arrayBuffer(), r3 = new Uint8Array(e6), n4 = new p(r3), i3 = [], s4 = n4.readUint32();
      for (let t6 = 0; t6 < s4; t6++) {
        let t7 = n4.getOffset(), e7 = tA.read(n4), r4 = n4.getOffset() - t7, s5 = new O(this.id, t7, r4), a4 = s5.toString(), o3 = { pointer: a4, data: e7.getData() };
        this.itemLoader.prime(a4, o3), i3.push(o3);
      }
      return i3;
    })), this.itemsPromise;
  }
  resolveItem(t5) {
    return this.itemLoader.load(t5);
  }
  constructor(t5, e6) {
    this.id = t5, this.url = e6, c(this, "itemsPromise"), c(this, "itemLoader", new d.default(async (t6) => {
      let e7 = t6.map((t7) => {
        let e8 = O.fromString(t7);
        return { from: e8.offset, to: e8.offset + e8.length };
      }), r3 = await tM(this.url, e7);
      return r3.map((e8, r4) => {
        let n4 = new p(e8), i3 = tA.read(n4), s4 = t6[r4];
        return I(s4, "Missing pointer"), { pointer: s4, data: i3.getData() };
      });
    }, { maxBatchSize: 250 }));
  }
};
var tP = class {
  async scanItems() {
    let t5 = await Promise.all(this.chunks.map(async (t6) => t6.scanItems()));
    return t5.flat();
  }
  resolveItems(t5) {
    return Promise.all(t5.map((t6) => {
      let e6 = O.fromString(t6), r3 = this.chunks[e6.chunkId];
      return I(r3, "Missing chunk"), r3.resolveItem(t6);
    }));
  }
  compareItems(t5, e6) {
    let r3 = O.fromString(t5.pointer), n4 = O.fromString(e6.pointer);
    return r3.compare(n4);
  }
  compareValues(e6, r3, n4) {
    return t.compare(e6, r3, n4);
  }
  constructor(t5) {
    this.options = t5, c(this, "id"), c(this, "schema"), c(this, "indexes"), c(this, "resolveRichText"), c(this, "resolveVectorSetItem"), c(this, "chunks"), this.chunks = this.options.chunks.map((t6, e6) => new tO(e6, t6)), this.schema = t5.schema, this.indexes = t5.indexes, this.resolveRichText = t5.resolveRichText, this.resolveVectorSetItem = t5.resolveVectorSetItem, this.id = t5.id;
  }
};

// http-url:https://framerusercontent.com/modules/pZnfY0Y5oVEwIFWbwseo/nLQuNacprbzBwAoMYKOX/wWC8EGMFo-1.js
import { jsx as e4 } from "react/jsx-runtime";
import { AutoBreakpointVariant as t3, ComponentPresetsConsumer as r2, Link as n2, motion as o2 } from "./_framer-runtime.js";
import { isValidElement as i2 } from "react";
import { Fragment as p2, createElement as s2 } from "react";
var a2;
var l2 = "undefined" != typeof __dai_window;
var f2 = l2 && "function" == typeof __dai_window.requestIdleCallback;
var u2 = "preload";
function c2(e6) {
  return "object" == typeof e6 && null !== e6 && !/* @__PURE__ */ i2(e6) && u2 in e6;
}
function m2(e6, ...t5) {
  if (!e6)
    throw Error("Assertion Error" + (t5.length > 0 ? ": " + t5.join(" ") : ""));
}
var d2 = ((a2 = d2 || {})[a2.Fragment = 1] = "Fragment", a2[a2.Link = 2] = "Link", a2[a2.Module = 3] = "Module", a2[a2.Tag = 4] = "Tag", a2[a2.Text = 5] = "Text", a2);
function g2(i3) {
  let a4 = /* @__PURE__ */ new Map();
  return (l4) => {
    let f4 = a4.get(l4);
    if (f4)
      return f4;
    let u4 = JSON.parse(l4), d4 = function a5(l5) {
      switch (l5[0]) {
        case 1: {
          let [, ...e6] = l5, t5 = e6.map(a5);
          return /* @__PURE__ */ s2(p2, void 0, ...t5);
        }
        case 2: {
          let [, e6, ...t5] = l5, r3 = t5.map(a5);
          return /* @__PURE__ */ s2(n2, e6, ...r3);
        }
        case 3: {
          let [, n4, o3, f5, u5] = l5;
          for (let e6 of f5) {
            let t5 = o3[e6];
            t5 && (o3[e6] = a5(t5));
          }
          for (let e6 of u5) {
            let t5 = o3[e6];
            if ("string" != typeof t5)
              continue;
            let r3 = i3[t5];
            r3 && (c2(r3) && r3.preload(), o3[e6] = r3);
          }
          let p4 = i3[n4];
          return m2(p4, "Module not found"), c2(p4) && p4.preload(), /* @__PURE__ */ e4(r2, { componentIdentifier: n4, children: (r3) => /* @__PURE__ */ e4(t3, { component: p4, props: { ...r3, ...o3 } }) });
        }
        case 4: {
          let [, e6, t5, ...r3] = l5, n4 = r3.map(a5);
          if ("a" === e6)
            return /* @__PURE__ */ s2(o2.a, t5, ...n4);
          return /* @__PURE__ */ s2(e6, t5, ...n4);
        }
        case 5: {
          let [, e6] = l5;
          return e6;
        }
      }
    }(u4);
    return a4.set(l4, d4), d4;
  };
}

// http-url:https://framerusercontent.com/modules/pZnfY0Y5oVEwIFWbwseo/nLQuNacprbzBwAoMYKOX/wWC8EGMFo.js
var m3 = t4(() => Promise.resolve().then(() => (init_W76pPiwFl(), W76pPiwFl_exports)));
var n3 = { bRLi7BvJJ: { isNullable: true, type: l3.ResponsiveImage }, BVHw1asXj: { isNullable: true, type: l3.ResponsiveImage }, createdAt: { isNullable: true, type: l3.Date }, cxkHsOrjz: { isNullable: true, type: l3.ResponsiveImage }, eDZ42NszQ: { isNullable: true, type: l3.ResponsiveImage }, ENbbVp8vc: { isNullable: true, type: l3.Number }, fc8SWJvvh: { definition: { isNullable: true, type: l3.String }, isNullable: true, type: l3.Array }, ho7bJj83Y: { isNullable: true, type: l3.ResponsiveImage }, id: { isNullable: false, type: l3.String }, kEAdWZ6bN: { isNullable: true, type: l3.ResponsiveImage }, L0XvF6Czl: { isNullable: true, type: l3.Number }, MmZDiJKCx: { isNullable: true, type: l3.ResponsiveImage }, MyF9IreYr: { isNullable: true, type: l3.ResponsiveImage }, nextItemId: { isNullable: true, type: l3.String }, NF5HioKUo: { isNullable: true, type: l3.Boolean }, nSPJuhtcH: { definition: { isNullable: true, type: l3.String }, isNullable: true, type: l3.Array }, previousItemId: { isNullable: true, type: l3.String }, rPQCyIqtZ: { definition: { isNullable: true, type: l3.String }, isNullable: true, type: l3.Array }, txBAYRkX5: { isNullable: true, type: l3.ResponsiveImage }, uEVRVrN3G: { isNullable: true, type: l3.RichText }, ULM6scxx_: { isNullable: true, type: l3.String }, updatedAt: { isNullable: true, type: l3.Date }, vXC_2Qw_g: { definition: { isNullable: true, type: l3.String }, isNullable: true, type: l3.Array }, WdGHyjYPS: { definition: { isNullable: true, type: l3.String }, isNullable: true, type: l3.Array }, wjbVR4laR: { isNullable: true, type: l3.String }, WpJ3gRydg: { isNullable: true, type: l3.Link }, X3CtE80s9: { isNullable: true, type: l3.String }, YFdaPgYa5: { isNullable: true, type: l3.ResponsiveImage }, yp6exRXCn: { isNullable: true, type: l3.ResponsiveImage }, yYNW6Sz6Q: { isNullable: true, type: l3.ResponsiveImage } };
var c3 = ["id"];
var s3 = { type: 1 };
var u3 = ["previousItemId"];
var d3 = ["nextItemId"];
var f3 = ["id", "wjbVR4laR"];
var p3 = ["wjbVR4laR", "id"];
var w2 = ["wjbVR4laR"];
var y2 = { type: 0 };
var g3 = ["X3CtE80s9"];
var R2 = ["L0XvF6Czl"];
var N2 = ["ULM6scxx_"];
var h2 = ["uEVRVrN3G"];
var C2 = ["NF5HioKUo"];
var I2 = ["nSPJuhtcH"];
var b2 = ["vXC_2Qw_g"];
var S2 = ["WdGHyjYPS"];
var x2 = ["WpJ3gRydg"];
var v2 = ["fc8SWJvvh"];
var L2 = ["rPQCyIqtZ"];
var M2 = ["ENbbVp8vc"];
var W2 = ["cxkHsOrjz"];
var F2 = ["yp6exRXCn"];
var E2 = ["yYNW6Sz6Q"];
var G2 = ["BVHw1asXj"];
var U2 = ["txBAYRkX5"];
var V2 = ["MmZDiJKCx"];
var P2 = ["bRLi7BvJJ"];
var j2 = ["YFdaPgYa5"];
var B2 = ["kEAdWZ6bN"];
var J2 = ["MyF9IreYr"];
var Y2 = ["ho7bJj83Y"];
var A2 = ["eDZ42NszQ"];
var X2 = [];
var H2 = (e6) => {
  let l4 = X2[e6];
  if (l4)
    return l4().then((e7) => e7.default);
};
var k2 = { "local-module:canvasComponent/W76pPiwFl:default": m3 };
var z2 = g2(k2);
var D2 = new a3();
var Q2 = { collectionByLocaleId: { default: new tP({ chunks: [""], id: "959e97c7-2542-4a37-896e-a09a59aaa98ddefault", indexes: [new tN({ collation: s3, collectionSchema: n3, fieldNames: c3, range: { from: 0, to: 433 }, url: "" }), new tN({ collation: s3, collectionSchema: n3, fieldNames: u3, range: { from: 433, to: 865 }, url: "" }), new tN({ collation: s3, collectionSchema: n3, fieldNames: d3, range: { from: 865, to: 1293 }, url: "" }), new tN({ collation: s3, collectionSchema: n3, fieldNames: f3, range: { from: 1293, to: 2164 }, url: "" }), new tN({ collation: s3, collectionSchema: n3, fieldNames: p3, range: { from: 2164, to: 3035 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: w2, range: { from: 3035, to: 3662 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: g3, range: { from: 3662, to: 4289 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: R2, range: { from: 4289, to: 4644 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: N2, range: { from: 4644, to: 5322 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: h2, range: { from: 5322, to: 12961 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: C2, range: { from: 12961, to: 13197 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: I2, range: { from: 13197, to: 13814 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: b2, range: { from: 13814, to: 14319 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: S2, range: { from: 14319, to: 14666 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: x2, range: { from: 14666, to: 15429 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: v2, range: { from: 15429, to: 17558 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: L2, range: { from: 17558, to: 18197 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: M2, range: { from: 18197, to: 18552 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: W2, range: { from: 18552, to: 27840 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: F2, range: { from: 27840, to: 37173 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: E2, range: { from: 37173, to: 46187 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: G2, range: { from: 46187, to: 55303 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: U2, range: { from: 55303, to: 64432 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: V2, range: { from: 64432, to: 73417 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: P2, range: { from: 73417, to: 78807 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: j2, range: { from: 78807, to: 79549 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: B2, range: { from: 79549, to: 79768 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: J2, range: { from: 79768, to: 79987 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: Y2, range: { from: 79987, to: 80206 }, url: "" }), new tN({ collation: y2, collectionSchema: n3, fieldNames: A2, range: { from: 80206, to: 80425 }, url: "" })], resolveRichText: z2, resolveVectorSetItem: H2, schema: n3 }) }, displayName: "Shoes", id: "959e97c7-2542-4a37-896e-a09a59aaa98d" };
var wWC8EGMFo_default = Q2;
e5(Q2, { wjbVR4laR: { preventLocalization: true, title: "Slug", type: l3.String }, X3CtE80s9: { defaultValue: "", title: "Product Title", type: l3.String }, L0XvF6Czl: { defaultValue: 0, title: "Price", type: l3.Number }, ULM6scxx_: { defaultValue: "", title: "Tagline", type: l3.String }, uEVRVrN3G: { defaultValue: "", title: "Description", type: l3.RichText }, NF5HioKUo: { defaultValue: false, title: "Best Seller", type: l3.Boolean }, nSPJuhtcH: { dataIdentifier: "local-module:collection/N2cLBMuUA:default", title: "Categories", type: l3.MultiCollectionReference }, vXC_2Qw_g: { dataIdentifier: "local-module:collection/N2cLBMuUA:default", defaultValue: ["fsNLTrnXE"], title: "Gender", type: l3.MultiCollectionReference }, WdGHyjYPS: { dataIdentifier: "local-module:collection/N2cLBMuUA:default", title: "Collection", type: l3.MultiCollectionReference }, WpJ3gRydg: { title: "Checkout Link", type: l3.Link }, fc8SWJvvh: { dataIdentifier: "local-module:collection/fHBgVg8VC:default", title: "Shoe Sizes", type: l3.MultiCollectionReference }, rPQCyIqtZ: { dataIdentifier: "local-module:collection/wWC8EGMFo:default", title: "Available Colors", type: l3.MultiCollectionReference }, ENbbVp8vc: { defaultValue: 1, max: 10, title: "Total Product Images", type: l3.Number }, cxkHsOrjz: { title: "Primary Thumbnail", type: l3.ResponsiveImage }, yp6exRXCn: { title: "Secondary Thumbnail", type: l3.ResponsiveImage }, yYNW6Sz6Q: { title: "Product Image 1", type: l3.ResponsiveImage }, BVHw1asXj: { title: "Product Image 2", type: l3.ResponsiveImage }, txBAYRkX5: { title: "Product Image 3", type: l3.ResponsiveImage }, MmZDiJKCx: { title: "Product Image 4", type: l3.ResponsiveImage }, bRLi7BvJJ: { title: "Product Image 5", type: l3.ResponsiveImage }, YFdaPgYa5: { title: "Product Image 6", type: l3.ResponsiveImage }, kEAdWZ6bN: { title: "Product Image 7", type: l3.ResponsiveImage }, MyF9IreYr: { title: "Product Image 8", type: l3.ResponsiveImage }, ho7bJj83Y: { title: "Product Image 9", type: l3.ResponsiveImage }, eDZ42NszQ: { title: "Product Image 10", type: l3.ResponsiveImage }, createdAt: { title: "Created", type: l3.Date }, updatedAt: { title: "Updated", type: l3.Date }, previousItemId: { dataIdentifier: "local-module:collection/wWC8EGMFo:default", title: "Previous", type: l3.CollectionReference }, nextItemId: { dataIdentifier: "local-module:collection/wWC8EGMFo:default", title: "Next", type: l3.CollectionReference } });

// http-url:https://framerusercontent.com/modules/NdqJ6hXLFuU7IiQgk9aN/TxFiOpGVt6Rndufwvesb/URl4ptbYA.js
import { jsx as _jsx3, jsxs as _jsxs3 } from "react/jsx-runtime";
import { addFonts as addFonts2, addPropertyControls as addPropertyControls3, ControlType as ControlType6, cx as cx2, getFontsFromSharedStyle as getFontsFromSharedStyle2, getLoadingLazyAtYPosition, Image as Image1, Link, RichText as RichText2, useComponentViewport as useComponentViewport2, useLocaleInfo as useLocaleInfo2, useVariantState as useVariantState2, withCSS as withCSS2 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup3, motion as motion3, MotionConfigContext as MotionConfigContext2 } from "framer-motion";
import * as React4 from "react";
import { useRef as useRef5 } from "react";

// http-url:https://framerusercontent.com/modules/pViJj926CBy444h3AYfq/yXDe2VVQ9pDsXbJlmrXJ/CT_DBbR5R.js
import { fontStore as fontStore4 } from "./_framer-runtime.js";
fontStore4.loadFonts(["Inter-Variable", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNTUw", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNTUw", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNTUw"]);
var variationAxes3 = [{ defaultValue: 14, maxValue: 32, minValue: 14, name: "Optical size", tag: "opsz" }, { defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
var fonts3 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/mYcqTSergLb16PdbJJQMl9ebYm4.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/ZRl8AlxwsX1m7xS1eJCiSPbztg.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/nhSQpBRqFmXNUBY2p5SENQ8NplQ.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/DYHjxG0qXjopUuruoacfl5SA.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/s7NH6sl7w4NU984r5hcmo1tPSYo.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/7lw0VWkeXrGYJT05oB3DsFy8BaY.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/wx5nfqEgOXnxuFaxB0Mn9OhmcZA.woff2", variationAxes: variationAxes3, weight: "400" }] }];
var css4 = ['.framer-fQ51O .framer-styles-preset-5rfdkx:not(.rich-text-wrapper), .framer-fQ51O .framer-styles-preset-5rfdkx.rich-text-wrapper p { --framer-font-family: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 14px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: normal; --framer-font-style-italic: normal; --framer-font-variation-axes: "opsz" 14, "wght" 550; --framer-font-variation-axes-bold: "opsz" 14, "wght" 550; --framer-font-variation-axes-bold-italic: "opsz" 14, "wght" 550; --framer-font-variation-axes-italic: "opsz" 14, "wght" 550; --framer-font-weight: 400; --framer-font-weight-bold: 400; --framer-font-weight-bold-italic: 400; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.02em; --framer-line-height: 1.5em; --framer-paragraph-spacing: 20px; --framer-text-alignment: left; --framer-text-color: var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className3 = "framer-fQ51O";

// http-url:https://framerusercontent.com/modules/XcWm95OqMMgibdoCvVcb/deChp29LadbLFuqjm8mg/hWdlH0iq7.js
import { fontStore as fontStore5 } from "./_framer-runtime.js";
fontStore5.loadFonts(["Inter-Variable", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNTI1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNTI1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNTI1"]);
var variationAxes4 = [{ defaultValue: 14, maxValue: 32, minValue: 14, name: "Optical size", tag: "opsz" }, { defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
var fonts4 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/mYcqTSergLb16PdbJJQMl9ebYm4.woff2", variationAxes: variationAxes4, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/ZRl8AlxwsX1m7xS1eJCiSPbztg.woff2", variationAxes: variationAxes4, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/nhSQpBRqFmXNUBY2p5SENQ8NplQ.woff2", variationAxes: variationAxes4, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/DYHjxG0qXjopUuruoacfl5SA.woff2", variationAxes: variationAxes4, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/s7NH6sl7w4NU984r5hcmo1tPSYo.woff2", variationAxes: variationAxes4, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/7lw0VWkeXrGYJT05oB3DsFy8BaY.woff2", variationAxes: variationAxes4, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/wx5nfqEgOXnxuFaxB0Mn9OhmcZA.woff2", variationAxes: variationAxes4, weight: "400" }] }];
var css5 = ['.framer-M6mYX .framer-styles-preset-1nkfhjw:not(.rich-text-wrapper), .framer-M6mYX .framer-styles-preset-1nkfhjw.rich-text-wrapper p { --framer-font-family: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 16px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: normal; --framer-font-style-italic: normal; --framer-font-variation-axes: "opsz" 14, "wght" 525; --framer-font-variation-axes-bold: "opsz" 14, "wght" 525; --framer-font-variation-axes-bold-italic: "opsz" 14, "wght" 525; --framer-font-variation-axes-italic: "opsz" 14, "wght" 525; --framer-font-weight: 400; --framer-font-weight-bold: 400; --framer-font-weight-bold-italic: 400; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.03em; --framer-line-height: 1.2em; --framer-paragraph-spacing: 20px; --framer-text-alignment: left; --framer-text-color: var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className4 = "framer-M6mYX";

// http-url:https://framerusercontent.com/modules/BT4DryjSPZmKrjBOySEg/O80nV57MDANLnqeA22Qs/PXfjos31S.js
import { fontStore as fontStore6 } from "./_framer-runtime.js";
fontStore6.loadFonts(["Inter-Variable", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNDc1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNDc1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNDc1"]);
var variationAxes5 = [{ defaultValue: 14, maxValue: 32, minValue: 14, name: "Optical size", tag: "opsz" }, { defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
var fonts5 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/mYcqTSergLb16PdbJJQMl9ebYm4.woff2", variationAxes: variationAxes5, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/ZRl8AlxwsX1m7xS1eJCiSPbztg.woff2", variationAxes: variationAxes5, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/nhSQpBRqFmXNUBY2p5SENQ8NplQ.woff2", variationAxes: variationAxes5, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/DYHjxG0qXjopUuruoacfl5SA.woff2", variationAxes: variationAxes5, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/s7NH6sl7w4NU984r5hcmo1tPSYo.woff2", variationAxes: variationAxes5, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/7lw0VWkeXrGYJT05oB3DsFy8BaY.woff2", variationAxes: variationAxes5, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/wx5nfqEgOXnxuFaxB0Mn9OhmcZA.woff2", variationAxes: variationAxes5, weight: "400" }] }];
var css6 = ['.framer-ImlYg .framer-styles-preset-1sjmy9b:not(.rich-text-wrapper), .framer-ImlYg .framer-styles-preset-1sjmy9b.rich-text-wrapper p { --framer-font-family: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 14px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: normal; --framer-font-style-italic: normal; --framer-font-variation-axes: "opsz" 14, "wght" 475; --framer-font-variation-axes-bold: "opsz" 14, "wght" 475; --framer-font-variation-axes-bold-italic: "opsz" 14, "wght" 475; --framer-font-variation-axes-italic: "opsz" 14, "wght" 475; --framer-font-weight: 400; --framer-font-weight-bold: 400; --framer-font-weight-bold-italic: 400; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.02em; --framer-line-height: 1.5em; --framer-paragraph-spacing: 20px; --framer-text-alignment: center; --framer-text-color: var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className5 = "framer-ImlYg";

// http-url:https://framerusercontent.com/modules/NdqJ6hXLFuU7IiQgk9aN/TxFiOpGVt6Rndufwvesb/URl4ptbYA.js
var enabledGestures = { x9sTdZGYw: { hover: true } };
var cycleOrder2 = ["x9sTdZGYw", "VBg6hQjIT"];
var serializationHash2 = "framer-eT7hn";
var variantClassNames2 = { VBg6hQjIT: "framer-v-1oc3mqv", x9sTdZGYw: "framer-v-n5vsu" };
function addPropertyOverrides2(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition12 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var toResponsiveImage = (value) => {
  if (typeof value === "object" && value !== null && typeof value.src === "string") {
    return value;
  }
  return typeof value === "string" ? { src: value } : void 0;
};
var Transition2 = ({ value, children }) => {
  const config = React4.useContext(MotionConfigContext2);
  const transition = value ?? config.transition;
  const contextValue = React4.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx3(MotionConfigContext2.Provider, { value: contextValue, children });
};
var humanReadableVariantMap2 = { Primary: "x9sTdZGYw", Secondary: "VBg6hQjIT" };
var Variants2 = motion3.create(React4.Fragment);
var getProps2 = ({ backgroundFallback, height, id, link, name1, price, primaryProductImage, secondaryProductImage, tagline, width, ...props }) => {
  return { ...props, c1lLI8Tpf: name1 ?? props.c1lLI8Tpf ?? "Nike Jordi", DpzGN4NEt: link ?? props.DpzGN4NEt, fznMvrmZS: backgroundFallback ?? props.fznMvrmZS ?? "rgb(245, 245, 245)", ogzYrzUEQ: tagline ?? props.ogzYrzUEQ ?? "Men's Slides", owbnoSkUH: primaryProductImage ?? props.owbnoSkUH, Rqo_rbsqg: secondaryProductImage ?? props.Rqo_rbsqg, variant: humanReadableVariantMap2[props.variant] ?? props.variant ?? "x9sTdZGYw", yrXIEPqWT: price ?? props.yrXIEPqWT ?? "\u20B92,500" };
};
var createLayoutDependency2 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component2 = /* @__PURE__ */ React4.forwardRef(function(props, ref) {
  const fallbackRef = useRef5(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React4.useId();
  const { activeLocale, setLocale } = useLocaleInfo2();
  const componentViewport = useComponentViewport2();
  const { style, className: className6, layoutId, variant, owbnoSkUH, Rqo_rbsqg, fznMvrmZS, c1lLI8Tpf, ogzYrzUEQ, yrXIEPqWT, DpzGN4NEt, ...restProps } = getProps2(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState2({ cycleOrder: cycleOrder2, defaultVariant: "x9sTdZGYw", enabledGestures, ref: refBinding, variant, variantClassNames: variantClassNames2 });
  const layoutDependency = createLayoutDependency2(props, variants);
  const sharedStyleClassNames = [className4, className5, className3];
  const scopingClassNames = cx2(serializationHash2, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx3(LayoutGroup3, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx3(Variants2, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx3(Transition2, { value: transition12, children: /* @__PURE__ */ _jsx3(Link, { href: DpzGN4NEt, motionChild: true, nodeId: "x9sTdZGYw", openInNewTab: false, scopeId: "URl4ptbYA", children: /* @__PURE__ */ _jsxs3(motion3.a, { ...restProps, ...gestureHandlers, className: `${cx2(scopingClassNames, "framer-n5vsu", className6, classNames)} framer-1eew1gv`, "data-framer-name": "Primary", draggable: "false", layoutDependency, layoutId: "BestSellersCarousel__x9sTdZGYw", ref: refBinding, style: { ...style }, ...addPropertyOverrides2({ "x9sTdZGYw-hover": { "data-framer-name": void 0 }, VBg6hQjIT: { "data-framer-name": "Secondary" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsxs3(motion3.div, { className: "framer-1m6qkbg", "data-framer-name": "Product Image", layoutDependency, layoutId: "BestSellersCarousel__eAhWeQUqO", style: { backgroundColor: fznMvrmZS }, children: [/* @__PURE__ */ _jsx3(Image1, { as: "figure", background: { alt: "Product Image", fit: "fill", intrinsicHeight: 434, intrinsicWidth: 438, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + (((componentViewport?.height || 499) - 0 - 644) / 2 + 0 + 0) + 0), pixelHeight: 868, pixelWidth: 876, sizes: `max(${componentViewport?.width || "100vw"}, 1px)`, ...toResponsiveImage(owbnoSkUH) }, className: "framer-i5snpi", "data-framer-name": "1", "data-selection": true, draggable: "false", layoutDependency, layoutId: "BestSellersCarousel__C4fVavIsC", style: { opacity: 1 }, variants: { "x9sTdZGYw-hover": { opacity: 0 } } }), /* @__PURE__ */ _jsx3(Image1, { as: "figure", background: { alt: "Product Image", fit: "fill", intrinsicHeight: 434, intrinsicWidth: 438, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + (((componentViewport?.height || 499) - 0 - 644) / 2 + 0 + 0) + 0), pixelHeight: 868, pixelWidth: 876, sizes: componentViewport?.width || "100vw", ...toResponsiveImage(Rqo_rbsqg) }, className: "framer-1it4mav", "data-framer-name": "2", "data-selection": true, draggable: "false", layoutDependency, layoutId: "BestSellersCarousel__FazMKeR1O", style: { opacity: 0 }, variants: { "x9sTdZGYw-hover": { opacity: 1 } } })] }), /* @__PURE__ */ _jsxs3(motion3.div, { className: "framer-1g74nvx", "data-framer-name": "Details", layoutDependency, layoutId: "BestSellersCarousel__mLdB0IM1o", children: [/* @__PURE__ */ _jsx3(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx3(React4.Fragment, { children: /* @__PURE__ */ _jsx3(motion3.p, { className: "framer-styles-preset-1nkfhjw", "data-styles-preset": "hWdlH0iq7", dir: "auto", children: "Nike Jordi" }) }), className: "framer-3xyk4q", fonts: ["Inter"], layoutDependency, layoutId: "BestSellersCarousel__ne60ekirZ", style: { "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: c1lLI8Tpf, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx3(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx3(React4.Fragment, { children: /* @__PURE__ */ _jsx3(motion3.p, { className: "framer-styles-preset-1sjmy9b", "data-styles-preset": "PXfjos31S", dir: "auto", style: { "--framer-text-alignment": "left", "--framer-text-color": "var(--extracted-r6o4lv, var(--token-55732a59-bc62-4580-8bcc-abc8c3da47fc, rgb(97, 97, 97)))" }, children: "Men's Slides" }) }), className: "framer-dctfs3", fonts: ["Inter"], layoutDependency, layoutId: "BestSellersCarousel__Dz3CklDfN", style: { "--extracted-r6o4lv": "var(--token-55732a59-bc62-4580-8bcc-abc8c3da47fc, rgb(97, 97, 97))", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: ogzYrzUEQ, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx3(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx3(React4.Fragment, { children: /* @__PURE__ */ _jsx3(motion3.p, { className: "framer-styles-preset-5rfdkx", "data-styles-preset": "CT_DBbR5R", dir: "auto", style: { "--framer-text-alignment": "left" }, children: "\u20B92,500" }) }), className: "framer-4yo203", fonts: ["Inter"], layoutDependency, layoutId: "BestSellersCarousel__PGYPxW9iQ", style: { "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: yrXIEPqWT, verticalAlignment: "top", withExternalLayout: true })] })] }) }) }) }) });
});
var css7 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-eT7hn.framer-1eew1gv, .framer-eT7hn .framer-1eew1gv { display: block; }", ".framer-eT7hn.framer-n5vsu { align-content: flex-start; align-items: flex-start; cursor: pointer; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 24px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; text-decoration: none; width: 400px; }", ".framer-eT7hn .framer-1m6qkbg { align-content: center; align-items: center; aspect-ratio: 1 / 1; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: var(--framer-aspect-ratio-supported, 400px); justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-eT7hn .framer-i5snpi { --selection-background-color: rgba(0, 153, 255, 0.15); --selection-color: #0099FF; -webkit-user-select: none; flex: 1 0 0px; height: 100%; overflow: visible; position: relative; user-select: none; width: 1px; }", ".framer-eT7hn .framer-1it4mav { --selection-background-color: rgba(0, 153, 255, 0.15); --selection-color: #0099FF; -webkit-user-select: none; flex: none; height: 100%; left: 0px; overflow: visible; position: absolute; top: 0px; user-select: none; width: 100%; z-index: 1; }", ".framer-eT7hn .framer-1g74nvx { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 7px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-eT7hn .framer-3xyk4q, .framer-eT7hn .framer-dctfs3, .framer-eT7hn .framer-4yo203 { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; }", ".framer-eT7hn.framer-v-1oc3mqv.framer-n5vsu { cursor: unset; }", ...css5, ...css6, ...css4, '.framer-eT7hn[data-selection="true"] * ::selection, .framer-eT7hn [data-selection="true"] * ::selection { color: var(--selection-color, none); background-color: var(--selection-background-color, none); }'];
var FramerURl4ptbYA = withCSS2(Component2, css7, "framer-eT7hn");
var URl4ptbYA_default = FramerURl4ptbYA;
FramerURl4ptbYA.displayName = "Product Card";
FramerURl4ptbYA.defaultProps = { height: 499, width: 400 };
addPropertyControls3(FramerURl4ptbYA, { variant: { options: ["x9sTdZGYw", "VBg6hQjIT"], optionTitles: ["Primary", "Secondary"], title: "Variant", type: ControlType6.Enum }, owbnoSkUH: { title: "Primary Product Image", type: ControlType6.ResponsiveImage }, Rqo_rbsqg: { title: "Secondary Product Image", type: ControlType6.ResponsiveImage }, fznMvrmZS: { defaultValue: "rgb(245, 245, 245)", title: "Background Fallback", type: ControlType6.Color }, c1lLI8Tpf: { defaultValue: "Nike Jordi", displayTextArea: false, title: "Name", type: ControlType6.String }, onc1lLI8TpfChange: { changes: "c1lLI8Tpf", type: ControlType6.ChangeHandler }, ogzYrzUEQ: { defaultValue: "Men's Slides", displayTextArea: false, title: "Tagline", type: ControlType6.String }, onogzYrzUEQChange: { changes: "ogzYrzUEQ", type: ControlType6.ChangeHandler }, yrXIEPqWT: { defaultValue: "\u20B92,500", displayTextArea: false, title: "Price", type: ControlType6.String }, onyrXIEPqWTChange: { changes: "yrXIEPqWT", type: ControlType6.ChangeHandler }, DpzGN4NEt: { title: "Link", type: ControlType6.Link } });
addFonts2(FramerURl4ptbYA, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }] }, ...getFontsFromSharedStyle2(fonts4), ...getFontsFromSharedStyle2(fonts5), ...getFontsFromSharedStyle2(fonts3)], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/aAJKkeQ9fdQtqcmk5uQY/oiJDFwUmbAEYMEcGFV6j/eE2hU3DZQ.js
var ProductCardFonts = getFonts(URl4ptbYA_default);
var CarouselFonts = getFonts(Carousel);
var cycleOrder3 = ["YddRK6JtV", "t7J4OXMxa"];
var serializationHash3 = "framer-J7SPL";
var variantClassNames3 = { t7J4OXMxa: "framer-v-1mgv8a8", YddRK6JtV: "framer-v-ftvsm7" };
function addPropertyOverrides3(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition13 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var greaterThan = (a4, b3) => {
  return typeof a4 === "number" && typeof b3 === "number" ? a4 > b3 : false;
};
var convertFromBoolean = (value, activeLocale) => {
  return value ? "x9sTdZGYw" : "VBg6hQjIT";
};
var toResponsiveImage2 = (value) => {
  if (typeof value === "object" && value !== null && typeof value.src === "string") {
    return value;
  }
  return typeof value === "string" ? { src: value } : void 0;
};
var numberToString = (value, options = {}, activeLocale) => {
  const fallbackLocale = "en-US";
  const locale = options.locale || activeLocale || fallbackLocale;
  const { useGrouping, notation, compactDisplay, style, currency, currencyDisplay, unit, unitDisplay, minimumFractionDigits, maximumFractionDigits, minimumIntegerDigits } = options;
  const formatOptions = { useGrouping, notation, compactDisplay, style, currency, currencyDisplay, unit, unitDisplay, minimumFractionDigits, maximumFractionDigits, minimumIntegerDigits };
  const number = Number(value);
  try {
    return number.toLocaleString(locale, formatOptions);
  } catch {
    try {
      return number.toLocaleString(fallbackLocale, formatOptions);
    } catch {
      return number.toLocaleString();
    }
  }
};
var matchVariant = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var query1 = () => ({ from: { alias: "tLinFvMiO", data: wWC8EGMFo_default, type: "Collection" }, limit: { type: "LiteralValue", value: 1 }, offset: { type: "LiteralValue", value: 0 }, select: [{ collection: "tLinFvMiO", name: "ENbbVp8vc", type: "Identifier" }, { collection: "tLinFvMiO", name: "cxkHsOrjz", type: "Identifier" }, { collection: "tLinFvMiO", name: "yp6exRXCn", type: "Identifier" }, { collection: "tLinFvMiO", name: "X3CtE80s9", type: "Identifier" }, { collection: "tLinFvMiO", name: "ULM6scxx_", type: "Identifier" }, { collection: "tLinFvMiO", name: "L0XvF6Czl", type: "Identifier" }, { collection: "tLinFvMiO", name: "wjbVR4laR", type: "Identifier" }, { collection: "tLinFvMiO", name: "id", type: "Identifier" }], where: { left: { collection: "tLinFvMiO", name: "NF5HioKUo", type: "Identifier" }, operator: "==", right: { type: "LiteralValue", value: true }, type: "BinaryOperation" } });
var QueryData = ({ query, pageSize, children }) => {
  const data = __framer_useQueryData(query);
  return children(data);
};
var query3 = () => ({ from: { alias: "ga50Ov9PY", data: wWC8EGMFo_default, type: "Collection" }, limit: { type: "LiteralValue", value: 1 }, offset: { type: "LiteralValue", value: 1 }, select: [{ collection: "ga50Ov9PY", name: "ENbbVp8vc", type: "Identifier" }, { collection: "ga50Ov9PY", name: "cxkHsOrjz", type: "Identifier" }, { collection: "ga50Ov9PY", name: "yp6exRXCn", type: "Identifier" }, { collection: "ga50Ov9PY", name: "X3CtE80s9", type: "Identifier" }, { collection: "ga50Ov9PY", name: "ULM6scxx_", type: "Identifier" }, { collection: "ga50Ov9PY", name: "L0XvF6Czl", type: "Identifier" }, { collection: "ga50Ov9PY", name: "wjbVR4laR", type: "Identifier" }, { collection: "ga50Ov9PY", name: "id", type: "Identifier" }], where: { left: { collection: "ga50Ov9PY", name: "NF5HioKUo", type: "Identifier" }, operator: "==", right: { type: "LiteralValue", value: true }, type: "BinaryOperation" } });
var query5 = () => ({ from: { alias: "d64M_s95a", data: wWC8EGMFo_default, type: "Collection" }, limit: { type: "LiteralValue", value: 1 }, offset: { type: "LiteralValue", value: 2 }, select: [{ collection: "d64M_s95a", name: "ENbbVp8vc", type: "Identifier" }, { collection: "d64M_s95a", name: "cxkHsOrjz", type: "Identifier" }, { collection: "d64M_s95a", name: "yp6exRXCn", type: "Identifier" }, { collection: "d64M_s95a", name: "X3CtE80s9", type: "Identifier" }, { collection: "d64M_s95a", name: "ULM6scxx_", type: "Identifier" }, { collection: "d64M_s95a", name: "L0XvF6Czl", type: "Identifier" }, { collection: "d64M_s95a", name: "wjbVR4laR", type: "Identifier" }, { collection: "d64M_s95a", name: "id", type: "Identifier" }], where: { left: { collection: "d64M_s95a", name: "NF5HioKUo", type: "Identifier" }, operator: "==", right: { type: "LiteralValue", value: true }, type: "BinaryOperation" } });
var query7 = () => ({ from: { alias: "oDvU2QsiU", data: wWC8EGMFo_default, type: "Collection" }, limit: { type: "LiteralValue", value: 1 }, offset: { type: "LiteralValue", value: 3 }, select: [{ collection: "oDvU2QsiU", name: "ENbbVp8vc", type: "Identifier" }, { collection: "oDvU2QsiU", name: "cxkHsOrjz", type: "Identifier" }, { collection: "oDvU2QsiU", name: "yp6exRXCn", type: "Identifier" }, { collection: "oDvU2QsiU", name: "X3CtE80s9", type: "Identifier" }, { collection: "oDvU2QsiU", name: "ULM6scxx_", type: "Identifier" }, { collection: "oDvU2QsiU", name: "L0XvF6Czl", type: "Identifier" }, { collection: "oDvU2QsiU", name: "wjbVR4laR", type: "Identifier" }, { collection: "oDvU2QsiU", name: "id", type: "Identifier" }], where: { left: { collection: "oDvU2QsiU", name: "NF5HioKUo", type: "Identifier" }, operator: "==", right: { type: "LiteralValue", value: true }, type: "BinaryOperation" } });
var query9 = () => ({ from: { alias: "dZciX5yRx", data: wWC8EGMFo_default, type: "Collection" }, limit: { type: "LiteralValue", value: 1 }, offset: { type: "LiteralValue", value: 0 }, select: [{ collection: "dZciX5yRx", name: "cxkHsOrjz", type: "Identifier" }, { collection: "dZciX5yRx", name: "yp6exRXCn", type: "Identifier" }, { collection: "dZciX5yRx", name: "X3CtE80s9", type: "Identifier" }, { collection: "dZciX5yRx", name: "ULM6scxx_", type: "Identifier" }, { collection: "dZciX5yRx", name: "L0XvF6Czl", type: "Identifier" }, { collection: "dZciX5yRx", name: "wjbVR4laR", type: "Identifier" }, { collection: "dZciX5yRx", name: "id", type: "Identifier" }], where: { left: { collection: "dZciX5yRx", name: "NF5HioKUo", type: "Identifier" }, operator: "==", right: { type: "LiteralValue", value: true }, type: "BinaryOperation" } });
var query11 = () => ({ from: { alias: "YX5CBN3TN", data: wWC8EGMFo_default, type: "Collection" }, limit: { type: "LiteralValue", value: 1 }, offset: { type: "LiteralValue", value: 1 }, select: [{ collection: "YX5CBN3TN", name: "cxkHsOrjz", type: "Identifier" }, { collection: "YX5CBN3TN", name: "yp6exRXCn", type: "Identifier" }, { collection: "YX5CBN3TN", name: "X3CtE80s9", type: "Identifier" }, { collection: "YX5CBN3TN", name: "ULM6scxx_", type: "Identifier" }, { collection: "YX5CBN3TN", name: "L0XvF6Czl", type: "Identifier" }, { collection: "YX5CBN3TN", name: "wjbVR4laR", type: "Identifier" }, { collection: "YX5CBN3TN", name: "id", type: "Identifier" }], where: { left: { collection: "YX5CBN3TN", name: "NF5HioKUo", type: "Identifier" }, operator: "==", right: { type: "LiteralValue", value: true }, type: "BinaryOperation" } });
var query13 = () => ({ from: { alias: "nXOaWt_Ll", data: wWC8EGMFo_default, type: "Collection" }, limit: { type: "LiteralValue", value: 1 }, offset: { type: "LiteralValue", value: 2 }, select: [{ collection: "nXOaWt_Ll", name: "cxkHsOrjz", type: "Identifier" }, { collection: "nXOaWt_Ll", name: "yp6exRXCn", type: "Identifier" }, { collection: "nXOaWt_Ll", name: "X3CtE80s9", type: "Identifier" }, { collection: "nXOaWt_Ll", name: "ULM6scxx_", type: "Identifier" }, { collection: "nXOaWt_Ll", name: "L0XvF6Czl", type: "Identifier" }, { collection: "nXOaWt_Ll", name: "wjbVR4laR", type: "Identifier" }, { collection: "nXOaWt_Ll", name: "id", type: "Identifier" }], where: { left: { collection: "nXOaWt_Ll", name: "NF5HioKUo", type: "Identifier" }, operator: "==", right: { type: "LiteralValue", value: true }, type: "BinaryOperation" } });
var query15 = () => ({ from: { alias: "yCJSc6ZLg", data: wWC8EGMFo_default, type: "Collection" }, limit: { type: "LiteralValue", value: 1 }, offset: { type: "LiteralValue", value: 3 }, select: [{ collection: "yCJSc6ZLg", name: "cxkHsOrjz", type: "Identifier" }, { collection: "yCJSc6ZLg", name: "yp6exRXCn", type: "Identifier" }, { collection: "yCJSc6ZLg", name: "X3CtE80s9", type: "Identifier" }, { collection: "yCJSc6ZLg", name: "ULM6scxx_", type: "Identifier" }, { collection: "yCJSc6ZLg", name: "L0XvF6Czl", type: "Identifier" }, { collection: "yCJSc6ZLg", name: "wjbVR4laR", type: "Identifier" }, { collection: "yCJSc6ZLg", name: "id", type: "Identifier" }], where: { left: { collection: "yCJSc6ZLg", name: "NF5HioKUo", type: "Identifier" }, operator: "==", right: { type: "LiteralValue", value: true }, type: "BinaryOperation" } });
var Transition3 = ({ value, children }) => {
  const config = React5.useContext(MotionConfigContext3);
  const transition = value ?? config.transition;
  const contextValue = React5.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx4(MotionConfigContext3.Provider, { value: contextValue, children });
};
var humanReadableVariantMap3 = { Large: "YddRK6JtV", Small: "t7J4OXMxa" };
var Variants3 = motion4.create(React5.Fragment);
var getProps3 = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap3[props.variant] ?? props.variant ?? "YddRK6JtV" };
};
var createLayoutDependency3 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component3 = /* @__PURE__ */ React5.forwardRef(function(props, ref) {
  const fallbackRef = useRef6(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React5.useId();
  const { activeLocale, setLocale } = useLocaleInfo3();
  const componentViewport = useComponentViewport3();
  const { style, className: className6, layoutId, variant, ...restProps } = getProps3(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState3({ cycleOrder: cycleOrder3, defaultVariant: "YddRK6JtV", ref: refBinding, variant, variantClassNames: variantClassNames3 });
  const layoutDependency = createLayoutDependency3(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx3(serializationHash3, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (baseVariant === "t7J4OXMxa")
      return false;
    return true;
  };
  const activeLocaleCode = useLocaleCode();
  const router = useRouter();
  const isDisplayed1 = () => {
    if (baseVariant === "t7J4OXMxa")
      return true;
    return false;
  };
  return /* @__PURE__ */ _jsx4(LayoutGroup4, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx4(Variants3, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx4(Transition3, { value: transition13, children: /* @__PURE__ */ _jsxs4(motion4.div, { ...restProps, ...gestureHandlers, className: cx3(scopingClassNames, "framer-ftvsm7", className6, classNames), "data-framer-name": "Large", layoutDependency, layoutId: "BestSellersCarousel__YddRK6JtV", ref: refBinding, style: { ...style }, ...addPropertyOverrides3({ t7J4OXMxa: { "data-framer-name": "Small" } }, baseVariant, gestureVariant), children: [isDisplayed() && /* @__PURE__ */ _jsx4(ComponentViewportProvider, { children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-aivfzb-container", "data-framer-name": "Carousel Large", isAuthoredByUser: true, isModuleExternal: true, layoutDependency, layoutId: "BestSellersCarousel__G14KKSbDh-container", name: "Carousel Large", nodeId: "G14KKSbDh", rendersWithMotion: true, scopeId: "eE2hU3DZQ", children: /* @__PURE__ */ _jsx4(Carousel, { align: "center", ariaLabel: "", arrowObject: { arrowFill: "rgba(0, 0, 0, 0.2)", arrowPadding: 20, arrowRadius: 40, arrowSize: 40, showMouseControls: true }, axis: true, borderRadius: 0, fadeObject: { fadeAlpha: 0, fadeContent: true, fadeInset: 0, fadeTransition: { bounce: 0, delay: 0, duration: 0.2, type: "spring" }, fadeWidth: 35 }, gap: 10, height: "100%", id: "G14KKSbDh", layoutId: "BestSellersCarousel__G14KKSbDh", name: "Carousel Large", padding: 0, paddingBottom: 0, paddingLeft: 0, paddingPerSide: false, paddingRight: 0, paddingTop: 0, progressObject: { dotsActiveOpacity: 1, dotsBackground: "rgba(0, 0, 0, 0.2)", dotsBlur: 4, dotsFill: "rgb(255, 255, 255)", dotsGap: 10, dotsInset: 10, dotSize: 10, dotsOpacity: 0.5, dotsPadding: 10, dotsRadius: 50, showProgressDots: false, showScrollbar: false }, sizingObject: { heightInset: 0, heightRows: 2, heightType: "auto", widthColumns: 2, widthInset: 0, widthType: "auto" }, slots: [/* @__PURE__ */ _jsx4(motion4.div, { className: "framer-1f3rs5g", "data-framer-name": "1 Large", layoutDependency, layoutId: "BestSellersCarousel__tLinFvMiO", children: /* @__PURE__ */ _jsx4(ChildrenCanSuspend, { children: /* @__PURE__ */ _jsx4(QueryData, { query: query1(), children: (collection, paginationInfo, loadMore) => {
    return /* @__PURE__ */ _jsx4(_Fragment, { children: collection?.map(({ cxkHsOrjz: cxkHsOrjztLinFvMiO, ENbbVp8vc: ENbbVp8vctLinFvMiO, id: idtLinFvMiO, L0XvF6Czl: L0XvF6CzltLinFvMiO, ULM6scxx_: ULM6scxx_tLinFvMiO, wjbVR4laR: wjbVR4laRtLinFvMiO, X3CtE80s9: X3CtE80s9tLinFvMiO, yp6exRXCn: yp6exRXCntLinFvMiO }, index) => {
      ENbbVp8vctLinFvMiO ?? (ENbbVp8vctLinFvMiO = 0);
      X3CtE80s9tLinFvMiO ?? (X3CtE80s9tLinFvMiO = "");
      ULM6scxx_tLinFvMiO ?? (ULM6scxx_tLinFvMiO = "");
      L0XvF6CzltLinFvMiO ?? (L0XvF6CzltLinFvMiO = 0);
      wjbVR4laRtLinFvMiO ?? (wjbVR4laRtLinFvMiO = "");
      return /* @__PURE__ */ _jsx4(LayoutGroup4, { id: `tLinFvMiO-${idtLinFvMiO}`, children: /* @__PURE__ */ _jsx4(PathVariablesContext.Provider, { value: { wjbVR4laR: wjbVR4laRtLinFvMiO }, children: /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-1ko5zxn", draggable: "false", layoutDependency, layoutId: "BestSellersCarousel__SiOPfrkSE", children: /* @__PURE__ */ _jsx4(ResolveLinks, { links: [{ href: { pathVariables: { wjbVR4laR: wjbVR4laRtLinFvMiO }, webPageId: "fIwdA4CC3" }, implicitPathVariables: void 0 }], children: (resolvedLinks) => /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 499, width: "400px", children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-1ayredx-container", draggable: "false", inComponentSlot: true, layoutDependency, layoutId: "BestSellersCarousel__sL8CeeUdc-container", nodeId: "sL8CeeUdc", rendersWithMotion: true, scopeId: "eE2hU3DZQ", children: /* @__PURE__ */ _jsx4(URl4ptbYA_default, { c1lLI8Tpf: X3CtE80s9tLinFvMiO, DpzGN4NEt: resolvedLinks[0], height: "100%", id: "sL8CeeUdc", layoutId: "BestSellersCarousel__sL8CeeUdc", ogzYrzUEQ: ULM6scxx_tLinFvMiO, owbnoSkUH: toResponsiveImage2(cxkHsOrjztLinFvMiO), Rqo_rbsqg: toResponsiveImage2(yp6exRXCntLinFvMiO), style: { width: "100%" }, variant: matchVariant(convertFromBoolean(greaterThan(ENbbVp8vctLinFvMiO, 1), activeLocale)), width: "100%", yrXIEPqWT: numberToString(L0XvF6CzltLinFvMiO, { currency: "USD", currencyDisplay: "symbol", locale: "", notation: "standard", style: "currency" }, activeLocaleCode) }) }) }) }) }) }) }, idtLinFvMiO);
    }) });
  } }) }) }), /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-1of9iae", "data-framer-name": "2 Large", layoutDependency, layoutId: "BestSellersCarousel__ga50Ov9PY", children: /* @__PURE__ */ _jsx4(ChildrenCanSuspend, { children: /* @__PURE__ */ _jsx4(QueryData, { query: query3(), children: (collection1, paginationInfo1, loadMore1) => {
    return /* @__PURE__ */ _jsx4(_Fragment, { children: collection1?.map(({ cxkHsOrjz: cxkHsOrjzga50Ov9PY, ENbbVp8vc: ENbbVp8vcga50Ov9PY, id: idga50Ov9PY, L0XvF6Czl: L0XvF6Czlga50Ov9PY, ULM6scxx_: ULM6scxx_ga50Ov9PY, wjbVR4laR: wjbVR4laRga50Ov9PY, X3CtE80s9: X3CtE80s9ga50Ov9PY, yp6exRXCn: yp6exRXCnga50Ov9PY }, index1) => {
      ENbbVp8vcga50Ov9PY ?? (ENbbVp8vcga50Ov9PY = 0);
      X3CtE80s9ga50Ov9PY ?? (X3CtE80s9ga50Ov9PY = "");
      ULM6scxx_ga50Ov9PY ?? (ULM6scxx_ga50Ov9PY = "");
      L0XvF6Czlga50Ov9PY ?? (L0XvF6Czlga50Ov9PY = 0);
      wjbVR4laRga50Ov9PY ?? (wjbVR4laRga50Ov9PY = "");
      return /* @__PURE__ */ _jsx4(LayoutGroup4, { id: `ga50Ov9PY-${idga50Ov9PY}`, children: /* @__PURE__ */ _jsx4(PathVariablesContext.Provider, { value: { wjbVR4laR: wjbVR4laRga50Ov9PY }, children: /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-1azkask", draggable: "false", layoutDependency, layoutId: "BestSellersCarousel__DfMoJBCQB", children: /* @__PURE__ */ _jsx4(ResolveLinks, { links: [{ href: { pathVariables: { wjbVR4laR: wjbVR4laRga50Ov9PY }, webPageId: "fIwdA4CC3" }, implicitPathVariables: void 0 }], children: (resolvedLinks1) => /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 499, width: "400px", children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-5izuy3-container", draggable: "false", inComponentSlot: true, layoutDependency, layoutId: "BestSellersCarousel__AvABCMpmU-container", nodeId: "AvABCMpmU", rendersWithMotion: true, scopeId: "eE2hU3DZQ", children: /* @__PURE__ */ _jsx4(URl4ptbYA_default, { c1lLI8Tpf: X3CtE80s9ga50Ov9PY, DpzGN4NEt: resolvedLinks1[0], height: "100%", id: "AvABCMpmU", layoutId: "BestSellersCarousel__AvABCMpmU", ogzYrzUEQ: ULM6scxx_ga50Ov9PY, owbnoSkUH: toResponsiveImage2(cxkHsOrjzga50Ov9PY), Rqo_rbsqg: toResponsiveImage2(yp6exRXCnga50Ov9PY), style: { width: "100%" }, variant: matchVariant(convertFromBoolean(greaterThan(ENbbVp8vcga50Ov9PY, 1), activeLocale)), width: "100%", yrXIEPqWT: numberToString(L0XvF6Czlga50Ov9PY, { currency: "USD", currencyDisplay: "symbol", locale: "", notation: "standard", style: "currency" }, activeLocaleCode) }) }) }) }) }) }) }, idga50Ov9PY);
    }) });
  } }) }) }), /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-o8diiu", "data-framer-name": "3 Large", layoutDependency, layoutId: "BestSellersCarousel__d64M_s95a", children: /* @__PURE__ */ _jsx4(ChildrenCanSuspend, { children: /* @__PURE__ */ _jsx4(QueryData, { query: query5(), children: (collection2, paginationInfo2, loadMore2) => {
    return /* @__PURE__ */ _jsx4(_Fragment, { children: collection2?.map(({ cxkHsOrjz: cxkHsOrjzd64M_s95a, ENbbVp8vc: ENbbVp8vcd64M_s95a, id: idd64M_s95a, L0XvF6Czl: L0XvF6Czld64M_s95a, ULM6scxx_: ULM6scxx_d64M_s95a, wjbVR4laR: wjbVR4laRd64M_s95a, X3CtE80s9: X3CtE80s9d64M_s95a, yp6exRXCn: yp6exRXCnd64M_s95a }, index2) => {
      ENbbVp8vcd64M_s95a ?? (ENbbVp8vcd64M_s95a = 0);
      X3CtE80s9d64M_s95a ?? (X3CtE80s9d64M_s95a = "");
      ULM6scxx_d64M_s95a ?? (ULM6scxx_d64M_s95a = "");
      L0XvF6Czld64M_s95a ?? (L0XvF6Czld64M_s95a = 0);
      wjbVR4laRd64M_s95a ?? (wjbVR4laRd64M_s95a = "");
      return /* @__PURE__ */ _jsx4(LayoutGroup4, { id: `d64M_s95a-${idd64M_s95a}`, children: /* @__PURE__ */ _jsx4(PathVariablesContext.Provider, { value: { wjbVR4laR: wjbVR4laRd64M_s95a }, children: /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-1agiso4", draggable: "false", layoutDependency, layoutId: "BestSellersCarousel__tfIx4xfuG", children: /* @__PURE__ */ _jsx4(ResolveLinks, { links: [{ href: { pathVariables: { wjbVR4laR: wjbVR4laRd64M_s95a }, webPageId: "fIwdA4CC3" }, implicitPathVariables: void 0 }], children: (resolvedLinks2) => /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 499, width: "400px", children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-kmgxhj-container", draggable: "false", inComponentSlot: true, layoutDependency, layoutId: "BestSellersCarousel__ANoQIrHbJ-container", nodeId: "ANoQIrHbJ", rendersWithMotion: true, scopeId: "eE2hU3DZQ", children: /* @__PURE__ */ _jsx4(URl4ptbYA_default, { c1lLI8Tpf: X3CtE80s9d64M_s95a, DpzGN4NEt: resolvedLinks2[0], height: "100%", id: "ANoQIrHbJ", layoutId: "BestSellersCarousel__ANoQIrHbJ", ogzYrzUEQ: ULM6scxx_d64M_s95a, owbnoSkUH: toResponsiveImage2(cxkHsOrjzd64M_s95a), Rqo_rbsqg: toResponsiveImage2(yp6exRXCnd64M_s95a), style: { width: "100%" }, variant: matchVariant(convertFromBoolean(greaterThan(ENbbVp8vcd64M_s95a, 1), activeLocale)), width: "100%", yrXIEPqWT: numberToString(L0XvF6Czld64M_s95a, { currency: "USD", currencyDisplay: "symbol", locale: "", notation: "standard", style: "currency" }, activeLocaleCode) }) }) }) }) }) }) }, idd64M_s95a);
    }) });
  } }) }) }), /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-1rq0h1p", "data-framer-name": "4 Large", layoutDependency, layoutId: "BestSellersCarousel__oDvU2QsiU", children: /* @__PURE__ */ _jsx4(ChildrenCanSuspend, { children: /* @__PURE__ */ _jsx4(QueryData, { query: query7(), children: (collection3, paginationInfo3, loadMore3) => {
    return /* @__PURE__ */ _jsx4(_Fragment, { children: collection3?.map(({ cxkHsOrjz: cxkHsOrjzoDvU2QsiU, ENbbVp8vc: ENbbVp8vcoDvU2QsiU, id: idoDvU2QsiU, L0XvF6Czl: L0XvF6CzloDvU2QsiU, ULM6scxx_: ULM6scxx_oDvU2QsiU, wjbVR4laR: wjbVR4laRoDvU2QsiU, X3CtE80s9: X3CtE80s9oDvU2QsiU, yp6exRXCn: yp6exRXCnoDvU2QsiU }, index3) => {
      ENbbVp8vcoDvU2QsiU ?? (ENbbVp8vcoDvU2QsiU = 0);
      X3CtE80s9oDvU2QsiU ?? (X3CtE80s9oDvU2QsiU = "");
      ULM6scxx_oDvU2QsiU ?? (ULM6scxx_oDvU2QsiU = "");
      L0XvF6CzloDvU2QsiU ?? (L0XvF6CzloDvU2QsiU = 0);
      wjbVR4laRoDvU2QsiU ?? (wjbVR4laRoDvU2QsiU = "");
      return /* @__PURE__ */ _jsx4(LayoutGroup4, { id: `oDvU2QsiU-${idoDvU2QsiU}`, children: /* @__PURE__ */ _jsx4(PathVariablesContext.Provider, { value: { wjbVR4laR: wjbVR4laRoDvU2QsiU }, children: /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-jj60nn", draggable: "false", layoutDependency, layoutId: "BestSellersCarousel__m7zv7hKB3", children: /* @__PURE__ */ _jsx4(ResolveLinks, { links: [{ href: { pathVariables: { wjbVR4laR: wjbVR4laRoDvU2QsiU }, webPageId: "fIwdA4CC3" }, implicitPathVariables: void 0 }], children: (resolvedLinks3) => /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 499, width: "400px", children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-hunl0o-container", draggable: "false", inComponentSlot: true, layoutDependency, layoutId: "BestSellersCarousel__ewWSnOL4D-container", nodeId: "ewWSnOL4D", rendersWithMotion: true, scopeId: "eE2hU3DZQ", children: /* @__PURE__ */ _jsx4(URl4ptbYA_default, { c1lLI8Tpf: X3CtE80s9oDvU2QsiU, DpzGN4NEt: resolvedLinks3[0], height: "100%", id: "ewWSnOL4D", layoutId: "BestSellersCarousel__ewWSnOL4D", ogzYrzUEQ: ULM6scxx_oDvU2QsiU, owbnoSkUH: toResponsiveImage2(cxkHsOrjzoDvU2QsiU), Rqo_rbsqg: toResponsiveImage2(yp6exRXCnoDvU2QsiU), style: { width: "100%" }, variant: matchVariant(convertFromBoolean(greaterThan(ENbbVp8vcoDvU2QsiU, 1), activeLocale)), width: "100%", yrXIEPqWT: numberToString(L0XvF6CzloDvU2QsiU, { currency: "USD", currencyDisplay: "symbol", locale: "", notation: "standard", style: "currency" }, activeLocaleCode) }) }) }) }) }) }) }, idoDvU2QsiU);
    }) });
  } }) }) })], snapObject: { fluid: false, snap: true, snapEdge: "center" }, style: { width: "100%" }, width: "100%" }) }) }), isDisplayed1() && /* @__PURE__ */ _jsx4(ComponentViewportProvider, { children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-82o9ed-container", "data-framer-name": "Carousel Small", isAuthoredByUser: true, isModuleExternal: true, layoutDependency, layoutId: "BestSellersCarousel__mWGdpvSe2-container", name: "Carousel Small", nodeId: "mWGdpvSe2", rendersWithMotion: true, scopeId: "eE2hU3DZQ", children: /* @__PURE__ */ _jsx4(Carousel, { align: "center", ariaLabel: "", arrowObject: { arrowFill: "rgba(0, 0, 0, 0.2)", arrowPadding: 20, arrowRadius: 40, arrowSize: 40, showMouseControls: true }, axis: true, borderRadius: 0, fadeObject: { fadeAlpha: 0, fadeContent: true, fadeInset: 0, fadeTransition: { bounce: 0, delay: 0, duration: 0.2, type: "spring" }, fadeWidth: 35 }, gap: 10, height: "100%", id: "mWGdpvSe2", layoutId: "BestSellersCarousel__mWGdpvSe2", name: "Carousel Small", padding: 0, paddingBottom: 0, paddingLeft: 0, paddingPerSide: false, paddingRight: 0, paddingTop: 0, progressObject: { dotsActiveOpacity: 1, dotsBackground: "rgba(0, 0, 0, 0.2)", dotsBlur: 4, dotsFill: "rgb(255, 255, 255)", dotsGap: 10, dotsInset: 10, dotSize: 10, dotsOpacity: 0.5, dotsPadding: 10, dotsRadius: 50, showProgressDots: false, showScrollbar: false }, sizingObject: { heightInset: 0, heightRows: 2, heightType: "auto", widthColumns: 2, widthInset: 0, widthType: "auto" }, slots: [/* @__PURE__ */ _jsx4(motion4.div, { className: "framer-1vt4ap5", "data-framer-name": "1 Small", layoutDependency, layoutId: "BestSellersCarousel__dZciX5yRx", children: /* @__PURE__ */ _jsx4(ChildrenCanSuspend, { children: /* @__PURE__ */ _jsx4(QueryData, { query: query9(), children: (collection4, paginationInfo4, loadMore4) => {
    return /* @__PURE__ */ _jsx4(_Fragment, { children: collection4?.map(({ cxkHsOrjz: cxkHsOrjzdZciX5yRx, id: iddZciX5yRx, L0XvF6Czl: L0XvF6CzldZciX5yRx, ULM6scxx_: ULM6scxx_dZciX5yRx, wjbVR4laR: wjbVR4laRdZciX5yRx, X3CtE80s9: X3CtE80s9dZciX5yRx, yp6exRXCn: yp6exRXCndZciX5yRx }, index4) => {
      X3CtE80s9dZciX5yRx ?? (X3CtE80s9dZciX5yRx = "");
      ULM6scxx_dZciX5yRx ?? (ULM6scxx_dZciX5yRx = "");
      L0XvF6CzldZciX5yRx ?? (L0XvF6CzldZciX5yRx = 0);
      wjbVR4laRdZciX5yRx ?? (wjbVR4laRdZciX5yRx = "");
      return /* @__PURE__ */ _jsx4(LayoutGroup4, { id: `dZciX5yRx-${iddZciX5yRx}`, children: /* @__PURE__ */ _jsx4(PathVariablesContext.Provider, { value: { wjbVR4laR: wjbVR4laRdZciX5yRx }, children: /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-qhw0ex", draggable: "false", layoutDependency, layoutId: "BestSellersCarousel__vlk9CCqfc", children: /* @__PURE__ */ _jsx4(ResolveLinks, { links: [{ href: { pathVariables: { wjbVR4laR: wjbVR4laRdZciX5yRx }, webPageId: "fIwdA4CC3" }, implicitPathVariables: void 0 }], children: (resolvedLinks4) => /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 499, width: "300px", children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-1cwfw90-container", draggable: "false", inComponentSlot: true, layoutDependency, layoutId: "BestSellersCarousel__Kff61IFAc-container", nodeId: "Kff61IFAc", rendersWithMotion: true, scopeId: "eE2hU3DZQ", children: /* @__PURE__ */ _jsx4(URl4ptbYA_default, { c1lLI8Tpf: X3CtE80s9dZciX5yRx, DpzGN4NEt: resolvedLinks4[0], height: "100%", id: "Kff61IFAc", layoutId: "BestSellersCarousel__Kff61IFAc", ogzYrzUEQ: ULM6scxx_dZciX5yRx, owbnoSkUH: toResponsiveImage2(cxkHsOrjzdZciX5yRx), Rqo_rbsqg: toResponsiveImage2(yp6exRXCndZciX5yRx), style: { width: "100%" }, variant: matchVariant("VBg6hQjIT"), width: "100%", yrXIEPqWT: numberToString(L0XvF6CzldZciX5yRx, { currency: "USD", currencyDisplay: "symbol", locale: "", notation: "standard", style: "currency" }, activeLocaleCode) }) }) }) }) }) }) }, iddZciX5yRx);
    }) });
  } }) }) }), /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-1joa0p0", "data-framer-name": "2 Small", layoutDependency, layoutId: "BestSellersCarousel__YX5CBN3TN", children: /* @__PURE__ */ _jsx4(ChildrenCanSuspend, { children: /* @__PURE__ */ _jsx4(QueryData, { query: query11(), children: (collection5, paginationInfo5, loadMore5) => {
    return /* @__PURE__ */ _jsx4(_Fragment, { children: collection5?.map(({ cxkHsOrjz: cxkHsOrjzYX5CBN3TN, id: idYX5CBN3TN, L0XvF6Czl: L0XvF6CzlYX5CBN3TN, ULM6scxx_: ULM6scxx_YX5CBN3TN, wjbVR4laR: wjbVR4laRYX5CBN3TN, X3CtE80s9: X3CtE80s9YX5CBN3TN, yp6exRXCn: yp6exRXCnYX5CBN3TN }, index5) => {
      X3CtE80s9YX5CBN3TN ?? (X3CtE80s9YX5CBN3TN = "");
      ULM6scxx_YX5CBN3TN ?? (ULM6scxx_YX5CBN3TN = "");
      L0XvF6CzlYX5CBN3TN ?? (L0XvF6CzlYX5CBN3TN = 0);
      wjbVR4laRYX5CBN3TN ?? (wjbVR4laRYX5CBN3TN = "");
      return /* @__PURE__ */ _jsx4(LayoutGroup4, { id: `YX5CBN3TN-${idYX5CBN3TN}`, children: /* @__PURE__ */ _jsx4(PathVariablesContext.Provider, { value: { wjbVR4laR: wjbVR4laRYX5CBN3TN }, children: /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-2xw5ww", draggable: "false", layoutDependency, layoutId: "BestSellersCarousel__mD4qtmjL9", children: /* @__PURE__ */ _jsx4(ResolveLinks, { links: [{ href: { pathVariables: { wjbVR4laR: wjbVR4laRYX5CBN3TN }, webPageId: "fIwdA4CC3" }, implicitPathVariables: void 0 }], children: (resolvedLinks5) => /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 499, width: "300px", children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-56pedd-container", draggable: "false", inComponentSlot: true, layoutDependency, layoutId: "BestSellersCarousel__X4Bl54FDQ-container", nodeId: "X4Bl54FDQ", rendersWithMotion: true, scopeId: "eE2hU3DZQ", children: /* @__PURE__ */ _jsx4(URl4ptbYA_default, { c1lLI8Tpf: X3CtE80s9YX5CBN3TN, DpzGN4NEt: resolvedLinks5[0], height: "100%", id: "X4Bl54FDQ", layoutId: "BestSellersCarousel__X4Bl54FDQ", ogzYrzUEQ: ULM6scxx_YX5CBN3TN, owbnoSkUH: toResponsiveImage2(cxkHsOrjzYX5CBN3TN), Rqo_rbsqg: toResponsiveImage2(yp6exRXCnYX5CBN3TN), style: { width: "100%" }, variant: matchVariant("VBg6hQjIT"), width: "100%", yrXIEPqWT: numberToString(L0XvF6CzlYX5CBN3TN, { currency: "USD", currencyDisplay: "symbol", locale: "", notation: "standard", style: "currency" }, activeLocaleCode) }) }) }) }) }) }) }, idYX5CBN3TN);
    }) });
  } }) }) }), /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-izf07i", "data-framer-name": "3 Small", layoutDependency, layoutId: "BestSellersCarousel__nXOaWt_Ll", children: /* @__PURE__ */ _jsx4(ChildrenCanSuspend, { children: /* @__PURE__ */ _jsx4(QueryData, { query: query13(), children: (collection6, paginationInfo6, loadMore6) => {
    return /* @__PURE__ */ _jsx4(_Fragment, { children: collection6?.map(({ cxkHsOrjz: cxkHsOrjznXOaWt_Ll, id: idnXOaWt_Ll, L0XvF6Czl: L0XvF6CzlnXOaWt_Ll, ULM6scxx_: ULM6scxx_nXOaWt_Ll, wjbVR4laR: wjbVR4laRnXOaWt_Ll, X3CtE80s9: X3CtE80s9nXOaWt_Ll, yp6exRXCn: yp6exRXCnnXOaWt_Ll }, index6) => {
      X3CtE80s9nXOaWt_Ll ?? (X3CtE80s9nXOaWt_Ll = "");
      ULM6scxx_nXOaWt_Ll ?? (ULM6scxx_nXOaWt_Ll = "");
      L0XvF6CzlnXOaWt_Ll ?? (L0XvF6CzlnXOaWt_Ll = 0);
      wjbVR4laRnXOaWt_Ll ?? (wjbVR4laRnXOaWt_Ll = "");
      return /* @__PURE__ */ _jsx4(LayoutGroup4, { id: `nXOaWt_Ll-${idnXOaWt_Ll}`, children: /* @__PURE__ */ _jsx4(PathVariablesContext.Provider, { value: { wjbVR4laR: wjbVR4laRnXOaWt_Ll }, children: /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-bvtt00", draggable: "false", layoutDependency, layoutId: "BestSellersCarousel__v1WhuYSBl", children: /* @__PURE__ */ _jsx4(ResolveLinks, { links: [{ href: { pathVariables: { wjbVR4laR: wjbVR4laRnXOaWt_Ll }, webPageId: "fIwdA4CC3" }, implicitPathVariables: void 0 }], children: (resolvedLinks6) => /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 499, width: "300px", children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-5wrghj-container", draggable: "false", inComponentSlot: true, layoutDependency, layoutId: "BestSellersCarousel__sfwK_OfKa-container", nodeId: "sfwK_OfKa", rendersWithMotion: true, scopeId: "eE2hU3DZQ", children: /* @__PURE__ */ _jsx4(URl4ptbYA_default, { c1lLI8Tpf: X3CtE80s9nXOaWt_Ll, DpzGN4NEt: resolvedLinks6[0], height: "100%", id: "sfwK_OfKa", layoutId: "BestSellersCarousel__sfwK_OfKa", ogzYrzUEQ: ULM6scxx_nXOaWt_Ll, owbnoSkUH: toResponsiveImage2(cxkHsOrjznXOaWt_Ll), Rqo_rbsqg: toResponsiveImage2(yp6exRXCnnXOaWt_Ll), style: { width: "100%" }, variant: matchVariant("VBg6hQjIT"), width: "100%", yrXIEPqWT: numberToString(L0XvF6CzlnXOaWt_Ll, { currency: "USD", currencyDisplay: "symbol", locale: "", notation: "standard", style: "currency" }, activeLocaleCode) }) }) }) }) }) }) }, idnXOaWt_Ll);
    }) });
  } }) }) }), /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-1sa0ijz", "data-framer-name": "4 Small", layoutDependency, layoutId: "BestSellersCarousel__yCJSc6ZLg", children: /* @__PURE__ */ _jsx4(ChildrenCanSuspend, { children: /* @__PURE__ */ _jsx4(QueryData, { query: query15(), children: (collection7, paginationInfo7, loadMore7) => {
    return /* @__PURE__ */ _jsx4(_Fragment, { children: collection7?.map(({ cxkHsOrjz: cxkHsOrjzyCJSc6ZLg, id: idyCJSc6ZLg, L0XvF6Czl: L0XvF6CzlyCJSc6ZLg, ULM6scxx_: ULM6scxx_yCJSc6ZLg, wjbVR4laR: wjbVR4laRyCJSc6ZLg, X3CtE80s9: X3CtE80s9yCJSc6ZLg, yp6exRXCn: yp6exRXCnyCJSc6ZLg }, index7) => {
      X3CtE80s9yCJSc6ZLg ?? (X3CtE80s9yCJSc6ZLg = "");
      ULM6scxx_yCJSc6ZLg ?? (ULM6scxx_yCJSc6ZLg = "");
      L0XvF6CzlyCJSc6ZLg ?? (L0XvF6CzlyCJSc6ZLg = 0);
      wjbVR4laRyCJSc6ZLg ?? (wjbVR4laRyCJSc6ZLg = "");
      return /* @__PURE__ */ _jsx4(LayoutGroup4, { id: `yCJSc6ZLg-${idyCJSc6ZLg}`, children: /* @__PURE__ */ _jsx4(PathVariablesContext.Provider, { value: { wjbVR4laR: wjbVR4laRyCJSc6ZLg }, children: /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-czmkqs", draggable: "false", layoutDependency, layoutId: "BestSellersCarousel__iB5lFzP7y", children: /* @__PURE__ */ _jsx4(ResolveLinks, { links: [{ href: { pathVariables: { wjbVR4laR: wjbVR4laRyCJSc6ZLg }, webPageId: "fIwdA4CC3" }, implicitPathVariables: void 0 }], children: (resolvedLinks7) => /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 499, width: "300px", children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-125b02t-container", draggable: "false", inComponentSlot: true, layoutDependency, layoutId: "BestSellersCarousel__XhjGKmsIB-container", nodeId: "XhjGKmsIB", rendersWithMotion: true, scopeId: "eE2hU3DZQ", children: /* @__PURE__ */ _jsx4(URl4ptbYA_default, { c1lLI8Tpf: X3CtE80s9yCJSc6ZLg, DpzGN4NEt: resolvedLinks7[0], height: "100%", id: "XhjGKmsIB", layoutId: "BestSellersCarousel__XhjGKmsIB", ogzYrzUEQ: ULM6scxx_yCJSc6ZLg, owbnoSkUH: toResponsiveImage2(cxkHsOrjzyCJSc6ZLg), Rqo_rbsqg: toResponsiveImage2(yp6exRXCnyCJSc6ZLg), style: { width: "100%" }, variant: matchVariant("VBg6hQjIT"), width: "100%", yrXIEPqWT: numberToString(L0XvF6CzlyCJSc6ZLg, { currency: "USD", currencyDisplay: "symbol", locale: "", notation: "standard", style: "currency" }, activeLocaleCode) }) }) }) }) }) }) }, idyCJSc6ZLg);
    }) });
  } }) }) })], snapObject: { fluid: false, snap: true, snapEdge: "center" }, style: { width: "100%" }, width: "100%" }) }) })] }) }) }) });
});
var css8 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-J7SPL.framer-sfkxu, .framer-J7SPL .framer-sfkxu { display: block; }", ".framer-J7SPL.framer-ftvsm7 { align-content: center; align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-J7SPL .framer-aivfzb-container, .framer-J7SPL .framer-1ayredx-container, .framer-J7SPL .framer-5izuy3-container, .framer-J7SPL .framer-kmgxhj-container, .framer-J7SPL .framer-hunl0o-container, .framer-J7SPL .framer-82o9ed-container, .framer-J7SPL .framer-1cwfw90-container, .framer-J7SPL .framer-56pedd-container, .framer-J7SPL .framer-5wrghj-container, .framer-J7SPL .framer-125b02t-container { flex: 1 0 0px; height: auto; position: relative; width: 1px; }", ".framer-J7SPL .framer-1f3rs5g, .framer-J7SPL .framer-1of9iae, .framer-J7SPL .framer-o8diiu, .framer-J7SPL .framer-1rq0h1p { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 20px; height: min-content; justify-content: center; padding: 0px; position: relative; width: 400px; }", ".framer-J7SPL .framer-1ko5zxn, .framer-J7SPL .framer-1azkask, .framer-J7SPL .framer-1agiso4, .framer-J7SPL .framer-jj60nn, .framer-J7SPL .framer-qhw0ex, .framer-J7SPL .framer-2xw5ww, .framer-J7SPL .framer-bvtt00, .framer-J7SPL .framer-czmkqs { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: flex-start; padding: 0px; position: relative; width: 100%; }", ".framer-J7SPL .framer-1vt4ap5, .framer-J7SPL .framer-1joa0p0, .framer-J7SPL .framer-izf07i, .framer-J7SPL .framer-1sa0ijz { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 20px; height: min-content; justify-content: center; padding: 0px; position: relative; width: 300px; }"];
var FramereE2hU3DZQ = withCSS3(Component3, css8, "framer-J7SPL");
var eE2hU3DZQ_default = FramereE2hU3DZQ;
FramereE2hU3DZQ.displayName = "Best Sellers Carousel";
FramereE2hU3DZQ.defaultProps = { height: 499, width: 1072 };
addPropertyControls4(FramereE2hU3DZQ, { variant: { options: ["YddRK6JtV", "t7J4OXMxa"], optionTitles: ["Large", "Small"], title: "Variant", type: ControlType7.Enum } });
addFonts3(FramereE2hU3DZQ, [{ explicitInter: true, fonts: [] }, ...ProductCardFonts, ...CarouselFonts], { supportsExplicitInterCodegen: true });
FramereE2hU3DZQ.loader = { load: (props, context) => {
  const locale = context.locale;
  const queryCacheEntry = queryCache.get(query1(), locale);
  const queryCacheEntry1 = queryCache.get(query3(), locale);
  const queryCacheEntry2 = queryCache.get(query5(), locale);
  const queryCacheEntry3 = queryCache.get(query7(), locale);
  const queryCacheEntry4 = queryCache.get(query9(), locale);
  const queryCacheEntry5 = queryCache.get(query11(), locale);
  const queryCacheEntry6 = queryCache.get(query13(), locale);
  const queryCacheEntry7 = queryCache.get(query15(), locale);
  return Promise.allSettled([queryCacheEntry.preload(), queryCacheEntry1.preload(), queryCacheEntry2.preload(), queryCacheEntry3.preload(), queryCacheEntry4.preload(), queryCacheEntry5.preload(), queryCacheEntry6.preload(), queryCacheEntry7.preload(), (async () => {
    const parentData = await queryCacheEntry.readMaybeAsync() ?? [];
    return Promise.allSettled(parentData.flatMap((item) => forwardLoader(URl4ptbYA_default, {}, context)));
  })(), (async () => {
    const parentData = await queryCacheEntry1.readMaybeAsync() ?? [];
    return Promise.allSettled(parentData.flatMap((item) => forwardLoader(URl4ptbYA_default, {}, context)));
  })(), (async () => {
    const parentData = await queryCacheEntry2.readMaybeAsync() ?? [];
    return Promise.allSettled(parentData.flatMap((item) => forwardLoader(URl4ptbYA_default, {}, context)));
  })(), (async () => {
    const parentData = await queryCacheEntry3.readMaybeAsync() ?? [];
    return Promise.allSettled(parentData.flatMap((item) => forwardLoader(URl4ptbYA_default, {}, context)));
  })(), (async () => {
    const parentData = await queryCacheEntry4.readMaybeAsync() ?? [];
    return Promise.allSettled(parentData.flatMap((item) => forwardLoader(URl4ptbYA_default, {}, context)));
  })(), (async () => {
    const parentData = await queryCacheEntry5.readMaybeAsync() ?? [];
    return Promise.allSettled(parentData.flatMap((item) => forwardLoader(URl4ptbYA_default, {}, context)));
  })(), (async () => {
    const parentData = await queryCacheEntry6.readMaybeAsync() ?? [];
    return Promise.allSettled(parentData.flatMap((item) => forwardLoader(URl4ptbYA_default, {}, context)));
  })(), (async () => {
    const parentData = await queryCacheEntry7.readMaybeAsync() ?? [];
    return Promise.allSettled(parentData.flatMap((item) => forwardLoader(URl4ptbYA_default, {}, context)));
  })()]);
} };
var __FramerMetadata__2 = { "exports": { "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "default": { "type": "reactComponent", "name": "FramereE2hU3DZQ", "slots": [], "annotations": { "framerIntrinsicWidth": "1072", "framerIntrinsicHeight": "499", "framerContractVersion": "1", "framerAutoSizeImages": "true", "framerColorSyntax": "true", "framerComponentViewportWidth": "true", "framerImmutableVariables": "true", "framerDisplayContentsDiv": "false", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]},"t7J4OXMxa":{"layout":["fixed","auto"]}}}' } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__2 as __FramerMetadata__,
  eE2hU3DZQ_default as default
};
