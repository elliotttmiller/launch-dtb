var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/rjkIBmSPAZN85l4l9Uv1/tDFvUbFEgVaiVLC5PhSj/ArkBx20pQ.js
import { jsx as _jsx3, jsxs as _jsxs3 } from "react/jsx-runtime";
import { addFonts as addFonts3, addPropertyControls as addPropertyControls3, ComponentViewportProvider as ComponentViewportProvider2, ControlType as ControlType3, cx as cx3, forwardLoader as forwardLoader2, getFonts as getFonts2, SmartComponentScopedContainer as SmartComponentScopedContainer2, useActiveVariantCallback as useActiveVariantCallback3, useComponentViewport as useComponentViewport3, useLocaleInfo as useLocaleInfo3, useVariantState as useVariantState3, withCSS as withCSS3 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup3, motion as motion3, MotionConfigContext as MotionConfigContext3 } from "framer-motion";
import * as React3 from "react";
import { useRef as useRef3 } from "react";

// http-url:https://framerusercontent.com/modules/2QWgC0J5AeZMBaDuWk9T/VVWLGoL0bnkPXbnECOCR/u1yOEy5ya.js
import { jsx as _jsx2, jsxs as _jsxs2 } from "react/jsx-runtime";
import { addFonts as addFonts2, addPropertyControls as addPropertyControls2, ComponentViewportProvider, ControlType as ControlType2, cx as cx2, forwardLoader, getFonts, getFontsFromSharedStyle, patchBorderRadiusScaleCorrector, RichText, SmartComponentScopedContainer, useActiveVariantCallback as useActiveVariantCallback2, useComponentViewport as useComponentViewport2, useLocaleInfo as useLocaleInfo2, useVariantState as useVariantState2, withCSS as withCSS2, withFX, withOptimizedAppearEffect } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup2, motion as motion2, MotionConfigContext as MotionConfigContext2 } from "framer-motion";
import * as React2 from "react";
import { useRef as useRef2 } from "react";

// http-url:https://framerusercontent.com/modules/7fD7o2yl2ikIKpE0Z3qs/cvFG7h3quPS8ykPhV2yx/amNEcipQY.js
import { fontStore } from "./_framer-runtime.js";
fontStore.loadFonts(["Inter-Variable", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNDI1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNDI1", "Inter-VariableVF=Im9wc3oiIDE0LCAid2dodCIgNDI1"]);
var variationAxes = [{ defaultValue: 14, maxValue: 32, minValue: 14, name: "Optical size", tag: "opsz" }, { defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
var fonts = [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/mYcqTSergLb16PdbJJQMl9ebYm4.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/ZRl8AlxwsX1m7xS1eJCiSPbztg.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/nhSQpBRqFmXNUBY2p5SENQ8NplQ.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/DYHjxG0qXjopUuruoacfl5SA.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/s7NH6sl7w4NU984r5hcmo1tPSYo.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/7lw0VWkeXrGYJT05oB3DsFy8BaY.woff2", variationAxes, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/wx5nfqEgOXnxuFaxB0Mn9OhmcZA.woff2", variationAxes, weight: "400" }] }];
var css = ['.framer-cc5NC .framer-styles-preset-9tj2n0:not(.rich-text-wrapper), .framer-cc5NC .framer-styles-preset-9tj2n0.rich-text-wrapper p { --framer-font-family: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-bold-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-family-italic: "Inter Variable", "Inter Variable Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 14px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: normal; --framer-font-style-italic: normal; --framer-font-variation-axes: "opsz" 14, "wght" 425; --framer-font-variation-axes-bold: "opsz" 14, "wght" 425; --framer-font-variation-axes-bold-italic: "opsz" 14, "wght" 425; --framer-font-variation-axes-italic: "opsz" 14, "wght" 425; --framer-font-weight: 400; --framer-font-weight-bold: 400; --framer-font-weight-bold-italic: 400; --framer-font-weight-italic: 400; --framer-letter-spacing: -0.02em; --framer-line-height: 1.5em; --framer-paragraph-spacing: 20px; --framer-text-alignment: center; --framer-text-color: var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className = "framer-cc5NC";

// http-url:https://framerusercontent.com/modules/zyBbQ9QnWD2sWb39bVd2/FOlHOP5by5T8KU05y380/UtwEWRQU9.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, getLoadingLazyAtYPosition, Image as Image1, useActiveVariantCallback, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";
var cycleOrder = ["Urs_KmaLX", "K6QRy3tH7"];
var serializationHash = "framer-9eBBt";
var variantClassNames = { K6QRy3tH7: "framer-v-1de3l6k", Urs_KmaLX: "framer-v-4oizsp" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition = ({ value, children }) => {
  const config = React.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx(MotionConfigContext.Provider, { value: contextValue, children });
};
var humanReadableVariantMap = { Closed: "Urs_KmaLX", Open: "K6QRy3tH7" };
var Variants = motion.create(React.Fragment);
var getProps = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "Urs_KmaLX" };
};
var createLayoutDependency = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component = /* @__PURE__ */ React.forwardRef(function(props, ref) {
  const fallbackRef = useRef(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React.useId();
  const { activeLocale, setLocale } = useLocaleInfo();
  const componentViewport = useComponentViewport();
  const { style, className: className2, layoutId, variant, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "Urs_KmaLX", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback(baseVariant);
  const onTap11p3a39 = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    setVariant("K6QRy3tH7");
  });
  const onTapr08xpk = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    setVariant("Urs_KmaLX");
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (baseVariant === "K6QRy3tH7")
      return false;
    return true;
  };
  const isDisplayed1 = () => {
    if (baseVariant === "K6QRy3tH7")
      return true;
    return false;
  };
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsxs(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-4oizsp", className2, classNames), "data-framer-name": "Closed", "data-highlight": true, layoutDependency, layoutId: "FAQs__Urs_KmaLX", onTap: onTap11p3a39, ref: refBinding, style: { ...style }, ...addPropertyOverrides({ K6QRy3tH7: { "data-framer-name": "Open", onTap: onTapr08xpk } }, baseVariant, gestureVariant), children: [isDisplayed() && /* @__PURE__ */ _jsx(Image1, { as: "figure", background: { alt: "Closed Box Illustration", fit: "fill", intrinsicHeight: 1728, intrinsicWidth: 2448, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0 + (((componentViewport?.height || 42.5) - 0 - (Math.max(0, ((componentViewport?.height || 42.5) - 0 - 0) / 1) * 1 + 0)) / 2 + 0 + 0)), pixelHeight: 1728, pixelWidth: 2448, sizes: componentViewport?.width || "100vw", src: "https://framerusercontent.com/images/D6NkFPuo8d4TEmjIyT3KDPlVDw.png?width=2448&height=1728", srcSet: "https://framerusercontent.com/images/D6NkFPuo8d4TEmjIyT3KDPlVDw.png?scale-down-to=512&width=2448&height=1728 512w,https://framerusercontent.com/images/D6NkFPuo8d4TEmjIyT3KDPlVDw.png?scale-down-to=1024&width=2448&height=1728 1024w,https://framerusercontent.com/images/D6NkFPuo8d4TEmjIyT3KDPlVDw.png?scale-down-to=2048&width=2448&height=1728 2048w,https://framerusercontent.com/images/D6NkFPuo8d4TEmjIyT3KDPlVDw.png?width=2448&height=1728 2448w" }, className: "framer-1cbwaar", "data-framer-name": "Closed", draggable: "false", layoutDependency, layoutId: "FAQs__sbzJSzoo6", style: { filter: "grayscale(1)", WebkitFilter: "grayscale(1)" } }), isDisplayed1() && /* @__PURE__ */ _jsx(Image1, { as: "figure", background: { alt: "Open Box Illustration", fit: "fill", intrinsicHeight: 1728, intrinsicWidth: 2448, pixelHeight: 1728, pixelWidth: 2448, src: "https://framerusercontent.com/images/9shKdUJnYLbJBUHmdJrBFVzkA4s.png?width=2448&height=1728", srcSet: "https://framerusercontent.com/images/9shKdUJnYLbJBUHmdJrBFVzkA4s.png?scale-down-to=512&width=2448&height=1728 512w,https://framerusercontent.com/images/9shKdUJnYLbJBUHmdJrBFVzkA4s.png?scale-down-to=1024&width=2448&height=1728 1024w,https://framerusercontent.com/images/9shKdUJnYLbJBUHmdJrBFVzkA4s.png?scale-down-to=2048&width=2448&height=1728 2048w,https://framerusercontent.com/images/9shKdUJnYLbJBUHmdJrBFVzkA4s.png?width=2448&height=1728 2448w" }, className: "framer-1a61r8o", "data-framer-name": "Open", draggable: "false", layoutDependency, layoutId: "FAQs__damPAxZ27", style: { filter: "grayscale(0)", WebkitFilter: "grayscale(0)" }, ...addPropertyOverrides({ K6QRy3tH7: { background: { alt: "Open Box Illustration", fit: "fill", intrinsicHeight: 1728, intrinsicWidth: 2448, loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 0), pixelHeight: 1728, pixelWidth: 2448, sizes: componentViewport?.width || "100vw", src: "https://framerusercontent.com/images/9shKdUJnYLbJBUHmdJrBFVzkA4s.png?width=2448&height=1728", srcSet: "https://framerusercontent.com/images/9shKdUJnYLbJBUHmdJrBFVzkA4s.png?scale-down-to=512&width=2448&height=1728 512w,https://framerusercontent.com/images/9shKdUJnYLbJBUHmdJrBFVzkA4s.png?scale-down-to=1024&width=2448&height=1728 1024w,https://framerusercontent.com/images/9shKdUJnYLbJBUHmdJrBFVzkA4s.png?scale-down-to=2048&width=2448&height=1728 2048w,https://framerusercontent.com/images/9shKdUJnYLbJBUHmdJrBFVzkA4s.png?width=2448&height=1728 2448w" } } }, baseVariant, gestureVariant) })] }) }) }) });
});
var css2 = [".framer-9eBBt.framer-1p8v5n0, .framer-9eBBt .framer-1p8v5n0 { display: block; }", ".framer-9eBBt.framer-4oizsp { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: auto; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-9eBBt .framer-1cbwaar { -webkit-user-select: none; flex: 1 0 0px; height: 1px; overflow: visible; position: relative; user-select: none; width: 100%; }", ".framer-9eBBt .framer-1a61r8o { -webkit-user-select: none; flex: none; height: 100%; left: 0px; overflow: visible; position: absolute; top: 0px; user-select: none; width: 100%; z-index: 1; }"];
var FramerUtwEWRQU9 = withCSS(Component, css2, "framer-9eBBt");
var UtwEWRQU9_default = FramerUtwEWRQU9;
FramerUtwEWRQU9.displayName = "Shoe Box Toggle";
FramerUtwEWRQU9.defaultProps = { height: 42.5, width: 60 };
addPropertyControls(FramerUtwEWRQU9, { variant: { options: ["Urs_KmaLX", "K6QRy3tH7"], optionTitles: ["Closed", "Open"], title: "Variant", type: ControlType.Enum } });
addFonts(FramerUtwEWRQU9, [{ explicitInter: true, fonts: [] }], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/2QWgC0J5AeZMBaDuWk9T/VVWLGoL0bnkPXbnECOCR/u1yOEy5ya.js
var ShoeBoxToggleFonts = getFonts(UtwEWRQU9_default);
var RichTextWithFXWithOptimizedAppearEffect = withOptimizedAppearEffect(withFX(RichText));
var cycleOrder2 = ["wsV422pGM", "uKFHKrul2"];
var serializationHash2 = "framer-gOi2b";
var variantClassNames2 = { uKFHKrul2: "framer-v-4ywfv9", wsV422pGM: "framer-v-sc4ocn" };
function addPropertyOverrides2(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var patchBorderRadiusScaleCorrector1 = patchBorderRadiusScaleCorrector();
var transition12 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var matchVariant = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var transition2 = { bounce: 0, delay: 0, duration: 0.6, type: "spring" };
var animation = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition2, x: 0, y: 0 };
var animation1 = { opacity: 1e-3, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, x: 0, y: 0 };
var Transition2 = ({ value, children }) => {
  const config = React2.useContext(MotionConfigContext2);
  const transition = value ?? config.transition;
  const contextValue = React2.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx2(MotionConfigContext2.Provider, { value: contextValue, children });
};
var humanReadableVariantMap2 = { Closed: "wsV422pGM", Open: "uKFHKrul2" };
var Variants2 = motion2.create(React2.Fragment);
var getProps2 = ({ answer, click, height, id, question, width, ...props }) => {
  return { ...props, e7dEXJOCV: answer ?? props.e7dEXJOCV ?? "We accept 1 week returns and refunds as well. Any case after that will not be considered.", G3LfTsfet: question ?? props.G3LfTsfet ?? "What does the return & refund policy look like?", j8hwokujt: click ?? props.j8hwokujt, variant: humanReadableVariantMap2[props.variant] ?? props.variant ?? "wsV422pGM" };
};
var createLayoutDependency2 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component2 = /* @__PURE__ */ React2.forwardRef(function(props, ref) {
  const fallbackRef = useRef2(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React2.useId();
  const { activeLocale, setLocale } = useLocaleInfo2();
  const componentViewport = useComponentViewport2();
  const { style, className: className2, layoutId, variant, G3LfTsfet, e7dEXJOCV, j8hwokujt, ...restProps } = getProps2(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState2({ cycleOrder: cycleOrder2, defaultVariant: "wsV422pGM", ref: refBinding, variant, variantClassNames: variantClassNames2 });
  const layoutDependency = createLayoutDependency2(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback2(baseVariant);
  const onTapc3vqp3 = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    if (j8hwokujt) {
      const res = await j8hwokujt(...args);
      if (res === false)
        return false;
    }
    setVariant("uKFHKrul2");
  });
  const onTap13tal0l = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    if (j8hwokujt) {
      const res = await j8hwokujt(...args);
      if (res === false)
        return false;
    }
    setVariant("wsV422pGM");
  });
  const sharedStyleClassNames = [className];
  const scopingClassNames = cx2(serializationHash2, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (baseVariant === "uKFHKrul2")
      return true;
    return false;
  };
  return /* @__PURE__ */ _jsx2(LayoutGroup2, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx2(Variants2, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx2(Transition2, { value: transition12, children: /* @__PURE__ */ _jsxs2(motion2.div, { ...restProps, ...gestureHandlers, className: cx2(scopingClassNames, "framer-sc4ocn", className2, classNames), "data-framer-name": "Closed", "data-highlight": true, layoutDependency, layoutId: "FAQs__wsV422pGM", onTap: onTapc3vqp3, ref: refBinding, style: { "--corner-shape-fallback": 0.796, backgroundColor: "var(--token-c81209ee-d76c-46df-b8d5-cc628e2f35fa, rgb(250, 250, 250))", borderBottomLeftRadius: "calc(20px*var(--one-if-corner-shape-supported,var(--corner-shape-fallback,1)))", borderBottomRightRadius: "calc(20px*var(--one-if-corner-shape-supported,var(--corner-shape-fallback,1)))", borderTopLeftRadius: "calc(20px*var(--one-if-corner-shape-supported,var(--corner-shape-fallback,1)))", borderTopRightRadius: "calc(20px*var(--one-if-corner-shape-supported,var(--corner-shape-fallback,1)))", cornerShape: "superellipse(1.4)", ...style }, ...addPropertyOverrides2({ uKFHKrul2: { "data-framer-name": "Open", onTap: onTap13tal0l } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx2(ComponentViewportProvider, { height: 43, width: "50px", y: (componentViewport?.y || 0) + 18, children: /* @__PURE__ */ _jsx2(SmartComponentScopedContainer, { className: "framer-vj7ivr-container", layoutDependency, layoutId: "FAQs__XmfSZ3MLR-container", nodeId: "XmfSZ3MLR", rendersWithMotion: true, scopeId: "u1yOEy5ya", children: /* @__PURE__ */ _jsx2(UtwEWRQU9_default, { height: "100%", id: "XmfSZ3MLR", layoutId: "FAQs__XmfSZ3MLR", style: { height: "100%", width: "100%" }, variant: matchVariant("Urs_KmaLX"), width: "100%", ...addPropertyOverrides2({ uKFHKrul2: { variant: matchVariant("K6QRy3tH7") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsxs2(motion2.div, { className: "framer-1ta5z3d", "data-framer-name": "Text", layoutDependency, layoutId: "FAQs__p7IC8IqLg", children: [/* @__PURE__ */ _jsx2(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx2(React2.Fragment, { children: /* @__PURE__ */ _jsx2(motion2.p, { dir: "auto", style: { "--font-selector": "SW50ZXItVmFyaWFibGVWRj1JbTl3YzNvaUlERTBMQ0FpZDJkb2RDSWdOVFV3", "--framer-font-family": '"Inter Variable", "Inter Variable Placeholder", sans-serif', "--framer-font-size": "15px", "--framer-font-variation-axes": 'var(--extracted-2gg91v, "opsz" 14, "wght" 550)', "--framer-letter-spacing": "-0.02em", "--framer-line-height": "1.5em", "--framer-text-alignment": "left", "--framer-text-color": "var(--extracted-r6o4lv, var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, rgb(0, 0, 0)))" }, children: "What does the return & refund policy look like?" }) }), className: "framer-1s3nm6c", fonts: ["Inter-Variable"], layoutDependency, layoutId: "FAQs__qXqk3xYeU", style: { "--extracted-2gg91v": '"opsz" 14, "wght" 550', "--extracted-r6o4lv": "var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, rgb(0, 0, 0))", "--framer-paragraph-spacing": "0px" }, text: G3LfTsfet, verticalAlignment: "top", withExternalLayout: true }), isDisplayed() && /* @__PURE__ */ _jsx2(RichTextWithFXWithOptimizedAppearEffect, { __fromCanvasComponent: true, __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation, children: /* @__PURE__ */ _jsx2(React2.Fragment, { children: /* @__PURE__ */ _jsx2(motion2.p, { className: "framer-styles-preset-9tj2n0", "data-styles-preset": "amNEcipQY", dir: "auto", style: { "--framer-text-alignment": "left", "--framer-text-color": "var(--extracted-r6o4lv, var(--token-55732a59-bc62-4580-8bcc-abc8c3da47fc, rgb(97, 97, 97)))" }, children: "We accept 1 week returns and refunds as well. Any case after that will not be considered." }) }), className: "framer-k81muf", "data-framer-appear-id": "k81muf", fonts: ["Inter"], initial: animation1, layoutDependency, layoutId: "FAQs__YFR1O1RsU", optimized: true, style: { "--extracted-r6o4lv": "var(--token-55732a59-bc62-4580-8bcc-abc8c3da47fc, rgb(97, 97, 97))", "--framer-paragraph-spacing": "0px" }, text: e7dEXJOCV, verticalAlignment: "top", withExternalLayout: true })] })] }) }) }) });
});
var css3 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-gOi2b.framer-18nodmk, .framer-gOi2b .framer-18nodmk { display: block; }", ".framer-gOi2b.framer-sc4ocn { align-content: flex-start; align-items: flex-start; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 16px; height: min-content; justify-content: center; overflow: hidden; padding: 18px; position: relative; width: 100%; will-change: var(--framer-will-change-override, transform); }", ".framer-gOi2b .framer-vj7ivr-container { aspect-ratio: 1.3953488372093024 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 36px); position: relative; width: 50px; }", ".framer-gOi2b .framer-1ta5z3d { align-content: flex-start; align-items: flex-start; align-self: stretch; display: flex; flex: 1 0 0px; flex-direction: column; flex-wrap: nowrap; gap: 4px; height: auto; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 1px; }", ".framer-gOi2b .framer-1s3nm6c, .framer-gOi2b .framer-k81muf { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; z-index: 1; }", ...css];
var Frameru1yOEy5ya = withCSS2(Component2, css3, "framer-gOi2b");
var u1yOEy5ya_default = Frameru1yOEy5ya;
Frameru1yOEy5ya.displayName = "FAQ Accordion";
Frameru1yOEy5ya.defaultProps = { height: 72, width: 800 };
addPropertyControls2(Frameru1yOEy5ya, { variant: { options: ["wsV422pGM", "uKFHKrul2"], optionTitles: ["Closed", "Open"], title: "Variant", type: ControlType2.Enum }, G3LfTsfet: { defaultValue: "What does the return & refund policy look like?", displayTextArea: true, title: "Question", type: ControlType2.String }, onG3LfTsfetChange: { changes: "G3LfTsfet", type: ControlType2.ChangeHandler }, e7dEXJOCV: { defaultValue: "We accept 1 week returns and refunds as well. Any case after that will not be considered.", displayTextArea: true, title: "Answer", type: ControlType2.String }, one7dEXJOCVChange: { changes: "e7dEXJOCV", type: ControlType2.ChangeHandler }, j8hwokujt: { title: "Click", type: ControlType2.EventHandler } });
var variationAxes2 = [{ defaultValue: 14, maxValue: 32, minValue: 14, name: "Optical size", tag: "opsz" }, { defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
addFonts2(Frameru1yOEy5ya, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/mYcqTSergLb16PdbJJQMl9ebYm4.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/ZRl8AlxwsX1m7xS1eJCiSPbztg.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/nhSQpBRqFmXNUBY2p5SENQ8NplQ.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/DYHjxG0qXjopUuruoacfl5SA.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/s7NH6sl7w4NU984r5hcmo1tPSYo.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/7lw0VWkeXrGYJT05oB3DsFy8BaY.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/wx5nfqEgOXnxuFaxB0Mn9OhmcZA.woff2", variationAxes: variationAxes2, weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }] }, ...ShoeBoxToggleFonts, ...getFontsFromSharedStyle(fonts)], { supportsExplicitInterCodegen: true });
Frameru1yOEy5ya.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader(UtwEWRQU9_default, {}, context)]);
} };

// http-url:https://framerusercontent.com/modules/rjkIBmSPAZN85l4l9Uv1/tDFvUbFEgVaiVLC5PhSj/ArkBx20pQ.js
var FAQAccordionFonts = getFonts2(u1yOEy5ya_default);
var cycleOrder3 = ["Eb3YZKRF7", "SG8QZ8A7e", "zCo_yt8Fi", "PhujRBMsa", "UqjXqlYPI", "R3Di7TxQg"];
var serializationHash3 = "framer-Nefcd";
var variantClassNames3 = { Eb3YZKRF7: "framer-v-1ep2ull", PhujRBMsa: "framer-v-mcrzm", R3Di7TxQg: "framer-v-u0vnhe", SG8QZ8A7e: "framer-v-17zuurc", UqjXqlYPI: "framer-v-1owsitk", zCo_yt8Fi: "framer-v-egttx8" };
function addPropertyOverrides3(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition13 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var matchVariant2 = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var Transition3 = ({ value, children }) => {
  const config = React3.useContext(MotionConfigContext3);
  const transition = value ?? config.transition;
  const contextValue = React3.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx3(MotionConfigContext3.Provider, { value: contextValue, children });
};
var humanReadableVariantMap3 = { "1 Open": "Eb3YZKRF7", "2 Open": "SG8QZ8A7e", "3 Open": "zCo_yt8Fi", "4 Open": "PhujRBMsa", "5 Open": "UqjXqlYPI", "6 Open": "R3Di7TxQg" };
var Variants3 = motion3.create(React3.Fragment);
var getProps3 = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap3[props.variant] ?? props.variant ?? "Eb3YZKRF7" };
};
var createLayoutDependency3 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component3 = /* @__PURE__ */ React3.forwardRef(function(props, ref) {
  const fallbackRef = useRef3(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React3.useId();
  const { activeLocale, setLocale } = useLocaleInfo3();
  const componentViewport = useComponentViewport3();
  const { style, className: className2, layoutId, variant, ...restProps } = getProps3(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState3({ cycleOrder: cycleOrder3, defaultVariant: "Eb3YZKRF7", ref: refBinding, variant, variantClassNames: variantClassNames3 });
  const layoutDependency = createLayoutDependency3(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback3(baseVariant);
  const j8hwokujtju1zkj = activeVariantCallback(async (...args) => {
    setVariant("Eb3YZKRF7");
  });
  const j8hwokujt1jhp4af = activeVariantCallback(async (...args) => {
    setVariant("SG8QZ8A7e");
  });
  const j8hwokujtidd2ts = activeVariantCallback(async (...args) => {
    setVariant("zCo_yt8Fi");
  });
  const j8hwokujt1ktc6iw = activeVariantCallback(async (...args) => {
    setVariant("PhujRBMsa");
  });
  const j8hwokujto6rckp = activeVariantCallback(async (...args) => {
    setVariant("UqjXqlYPI");
  });
  const j8hwokujt4vrfuw = activeVariantCallback(async (...args) => {
    setVariant("R3Di7TxQg");
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx3(serializationHash3, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx3(LayoutGroup3, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx3(Variants3, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx3(Transition3, { value: transition13, children: /* @__PURE__ */ _jsxs3(motion3.div, { ...restProps, ...gestureHandlers, className: cx3(scopingClassNames, "framer-1ep2ull", className2, classNames), "data-framer-name": "1 Open", layoutDependency, layoutId: "FAQs__Eb3YZKRF7", ref: refBinding, style: { ...style }, ...addPropertyOverrides3({ PhujRBMsa: { "data-framer-name": "4 Open" }, R3Di7TxQg: { "data-framer-name": "6 Open" }, SG8QZ8A7e: { "data-framer-name": "2 Open" }, UqjXqlYPI: { "data-framer-name": "5 Open" }, zCo_yt8Fi: { "data-framer-name": "3 Open" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx3(ComponentViewportProvider2, { height: 72, width: componentViewport?.width || "100vw", y: (componentViewport?.y || 0) + 0 + 0, children: /* @__PURE__ */ _jsx3(SmartComponentScopedContainer2, { className: "framer-13ga07f-container", layout: "position", layoutDependency, layoutId: "FAQs__rXPvfDpeo-container", nodeId: "rXPvfDpeo", rendersWithMotion: true, scopeId: "ArkBx20pQ", children: /* @__PURE__ */ _jsx3(u1yOEy5ya_default, { e7dEXJOCV: "Yep \u2014 we ship worldwide. Delivery times and shipping costs are calculated at checkout based on your location.", G3LfTsfet: "Do you ship internationally?", height: "100%", id: "rXPvfDpeo", j8hwokujt: j8hwokujtju1zkj, layoutId: "FAQs__rXPvfDpeo", style: { width: "100%" }, variant: matchVariant2("uKFHKrul2"), width: "100%", ...addPropertyOverrides3({ PhujRBMsa: { variant: matchVariant2("wsV422pGM") }, R3Di7TxQg: { variant: matchVariant2("wsV422pGM") }, SG8QZ8A7e: { variant: matchVariant2("wsV422pGM") }, UqjXqlYPI: { variant: matchVariant2("wsV422pGM") }, zCo_yt8Fi: { variant: matchVariant2("wsV422pGM") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx3(ComponentViewportProvider2, { height: 72, width: componentViewport?.width || "100vw", y: (componentViewport?.y || 0) + 0 + 82, children: /* @__PURE__ */ _jsx3(SmartComponentScopedContainer2, { className: "framer-zx3t32-container", layout: "position", layoutDependency, layoutId: "FAQs__hORHtCZQ1-container", nodeId: "hORHtCZQ1", rendersWithMotion: true, scopeId: "ArkBx20pQ", children: /* @__PURE__ */ _jsx3(u1yOEy5ya_default, { e7dEXJOCV: "Each product page includes a detailed sizing guide to help you find your perfect fit. If you\u2019re between sizes, we usually recommend sizing up.", G3LfTsfet: "How do I find the right size?", height: "100%", id: "hORHtCZQ1", j8hwokujt: j8hwokujt1jhp4af, layoutId: "FAQs__hORHtCZQ1", style: { width: "100%" }, variant: matchVariant2("wsV422pGM"), width: "100%", ...addPropertyOverrides3({ SG8QZ8A7e: { j8hwokujt: void 0, variant: matchVariant2("uKFHKrul2") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx3(ComponentViewportProvider2, { height: 72, width: componentViewport?.width || "100vw", y: (componentViewport?.y || 0) + 0 + 164, children: /* @__PURE__ */ _jsx3(SmartComponentScopedContainer2, { className: "framer-1yiq6g6-container", layout: "position", layoutDependency, layoutId: "FAQs__IoWNlPUCm-container", nodeId: "IoWNlPUCm", rendersWithMotion: true, scopeId: "ArkBx20pQ", children: /* @__PURE__ */ _jsx3(u1yOEy5ya_default, { e7dEXJOCV: "Most of our sneakers are designed to be worn by everyone. Size conversions are available directly on the product page.", G3LfTsfet: "Are your sneakers unisex?", height: "100%", id: "IoWNlPUCm", j8hwokujt: j8hwokujtidd2ts, layoutId: "FAQs__IoWNlPUCm", style: { width: "100%" }, variant: matchVariant2("wsV422pGM"), width: "100%", ...addPropertyOverrides3({ zCo_yt8Fi: { j8hwokujt: void 0, variant: matchVariant2("uKFHKrul2") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx3(ComponentViewportProvider2, { height: 72, width: componentViewport?.width || "100vw", y: (componentViewport?.y || 0) + 0 + 246, children: /* @__PURE__ */ _jsx3(SmartComponentScopedContainer2, { className: "framer-1ssnzgn-container", layout: "position", layoutDependency, layoutId: "FAQs__zDSbTCn0_-container", nodeId: "zDSbTCn0_", rendersWithMotion: true, scopeId: "ArkBx20pQ", children: /* @__PURE__ */ _jsx3(u1yOEy5ya_default, { e7dEXJOCV: "Absolutely. We offer easy returns and exchanges within 14 days of delivery, as long as the sneakers are unworn and in original condition.", G3LfTsfet: "Can I return or exchange my order?", height: "100%", id: "zDSbTCn0_", j8hwokujt: j8hwokujt1ktc6iw, layoutId: "FAQs__zDSbTCn0_", style: { width: "100%" }, variant: matchVariant2("wsV422pGM"), width: "100%", ...addPropertyOverrides3({ PhujRBMsa: { j8hwokujt: void 0, variant: matchVariant2("uKFHKrul2") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx3(ComponentViewportProvider2, { height: 72, width: componentViewport?.width || "100vw", y: (componentViewport?.y || 0) + 0 + 328, children: /* @__PURE__ */ _jsx3(SmartComponentScopedContainer2, { className: "framer-jpvwnb-container", layout: "position", layoutDependency, layoutId: "FAQs__UYWQJ5bqz-container", nodeId: "UYWQJ5bqz", rendersWithMotion: true, scopeId: "ArkBx20pQ", children: /* @__PURE__ */ _jsx3(u1yOEy5ya_default, { e7dEXJOCV: "Once your order ships, you\u2019ll receive a tracking link via email so you can follow it every step of the way.", G3LfTsfet: "How can I track my order?", height: "100%", id: "UYWQJ5bqz", j8hwokujt: j8hwokujto6rckp, layoutId: "FAQs__UYWQJ5bqz", style: { width: "100%" }, variant: matchVariant2("wsV422pGM"), width: "100%", ...addPropertyOverrides3({ UqjXqlYPI: { j8hwokujt: void 0, variant: matchVariant2("uKFHKrul2") } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx3(ComponentViewportProvider2, { height: 72, width: componentViewport?.width || "100vw", y: (componentViewport?.y || 0) + 0 + 410, children: /* @__PURE__ */ _jsx3(SmartComponentScopedContainer2, { className: "framer-1khdv2f-container", layout: "position", layoutDependency, layoutId: "FAQs__Tf51CoJC8-container", nodeId: "Tf51CoJC8", rendersWithMotion: true, scopeId: "ArkBx20pQ", children: /* @__PURE__ */ _jsx3(u1yOEy5ya_default, { e7dEXJOCV: "Always. Every pair is carefully sourced and quality-checked to ensure authenticity and premium condition.", G3LfTsfet: "Are the sneakers authentic?", height: "100%", id: "Tf51CoJC8", j8hwokujt: j8hwokujt4vrfuw, layoutId: "FAQs__Tf51CoJC8", style: { width: "100%" }, variant: matchVariant2("wsV422pGM"), width: "100%", ...addPropertyOverrides3({ R3Di7TxQg: { j8hwokujt: void 0, variant: matchVariant2("uKFHKrul2") } }, baseVariant, gestureVariant) }) }) })] }) }) }) });
});
var css4 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-Nefcd.framer-8vojrc, .framer-Nefcd .framer-8vojrc { display: block; }", ".framer-Nefcd.framer-1ep2ull { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-Nefcd .framer-13ga07f-container, .framer-Nefcd .framer-zx3t32-container, .framer-Nefcd .framer-1yiq6g6-container, .framer-Nefcd .framer-1ssnzgn-container, .framer-Nefcd .framer-jpvwnb-container, .framer-Nefcd .framer-1khdv2f-container { flex: none; height: auto; position: relative; width: 100%; }"];
var FramerArkBx20pQ = withCSS3(Component3, css4, "framer-Nefcd");
var ArkBx20pQ_default = FramerArkBx20pQ;
FramerArkBx20pQ.displayName = "FAQ's";
FramerArkBx20pQ.defaultProps = { height: 513.5, width: 600 };
addPropertyControls3(FramerArkBx20pQ, { variant: { options: ["Eb3YZKRF7", "SG8QZ8A7e", "zCo_yt8Fi", "PhujRBMsa", "UqjXqlYPI", "R3Di7TxQg"], optionTitles: ["1 Open", "2 Open", "3 Open", "4 Open", "5 Open", "6 Open"], title: "Variant", type: ControlType3.Enum } });
addFonts3(FramerArkBx20pQ, [{ explicitInter: true, fonts: [] }, ...FAQAccordionFonts], { supportsExplicitInterCodegen: true });
FramerArkBx20pQ.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader2(u1yOEy5ya_default, {}, context)]);
} };
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "FramerArkBx20pQ", "slots": [], "annotations": { "framerIntrinsicHeight": "513.5", "framerIntrinsicWidth": "600", "framerColorSyntax": "true", "framerContractVersion": "1", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]},"SG8QZ8A7e":{"layout":["fixed","auto"]},"zCo_yt8Fi":{"layout":["fixed","auto"]},"PhujRBMsa":{"layout":["fixed","auto"]},"UqjXqlYPI":{"layout":["fixed","auto"]},"R3Di7TxQg":{"layout":["fixed","auto"]}}}', "framerImmutableVariables": "true", "framerDisplayContentsDiv": "false", "framerComponentViewportWidth": "true", "framerAutoSizeImages": "true" } }, "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  ArkBx20pQ_default as default
};
