var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/0h1XIc31JEW5G3ZLdU4E/vHhEZ4iG4xYIqMPHqq94/n0v8zOHwO.js
import { jsx as _jsx } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, getFontsFromSharedStyle, RichText, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";

// http-url:https://framerusercontent.com/modules/5KA73QmVdbAb9YF0Xmuy/2EX0XCQtWmk1DKoPWI9m/X4l3QYsOx.js
import { fontStore } from "./_framer-runtime.js";
fontStore.loadFonts(["GF;Ranchers-regular"]);
var fonts = [{ explicitInter: true, fonts: [{ cssFamilyName: "Ranchers", source: "google", style: "normal", uiFamilyName: "Ranchers", url: "https://fonts.gstatic.com/s/ranchers/v19/zrfm0H3Lx-P2Xvs2AoDdDC79XTHv.woff2", weight: "400" }] }];
var css = ['.framer-F1CzE .framer-styles-preset-1r5o7uy:not(.rich-text-wrapper), .framer-F1CzE .framer-styles-preset-1r5o7uy.rich-text-wrapper h1 { --framer-font-family: "Ranchers", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 220px; --framer-font-style: normal; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-letter-spacing: 0em; --framer-line-height: 1em; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }', '@media (max-width: 1199px) and (min-width: 810px) { .framer-F1CzE .framer-styles-preset-1r5o7uy:not(.rich-text-wrapper), .framer-F1CzE .framer-styles-preset-1r5o7uy.rich-text-wrapper h1 { --framer-font-family: "Ranchers", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 200px; --framer-font-style: normal; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-letter-spacing: 0em; --framer-line-height: 1em; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; } }', '@media (max-width: 809px) and (min-width: 0px) { .framer-F1CzE .framer-styles-preset-1r5o7uy:not(.rich-text-wrapper), .framer-F1CzE .framer-styles-preset-1r5o7uy.rich-text-wrapper h1 { --framer-font-family: "Ranchers", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 80px; --framer-font-style: normal; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-letter-spacing: 0em; --framer-line-height: 1em; --framer-paragraph-spacing: 0px; --framer-text-alignment: start; --framer-text-color: var(--token-d53ec7b6-ca11-471f-93d4-6939f860246e, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; } }'];
var className = "framer-F1CzE";

// http-url:https://framerusercontent.com/modules/0h1XIc31JEW5G3ZLdU4E/vHhEZ4iG4xYIqMPHqq94/n0v8zOHwO.js
var cycleOrder = ["sme0MR6xw", "eUP3f9iaq", "nr_UQipkw"];
var serializationHash = "framer-j1vZY";
var variantClassNames = { eUP3f9iaq: "framer-v-x7chn9", nr_UQipkw: "framer-v-epi6ln", sme0MR6xw: "framer-v-1r25u9g" };
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
var humanReadableVariantMap = { "Sky Blue": "nr_UQipkw", Beige: "sme0MR6xw", Orange: "eUP3f9iaq" };
var Variants = motion.create(React.Fragment);
var getProps = ({ height, id, title, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "sme0MR6xw", ZPdhXCb4b: title ?? props.ZPdhXCb4b ?? "Air Flexs" };
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
  const { style, className: className2, layoutId, variant, ZPdhXCb4b, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "sme0MR6xw", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [className];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsx(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-1r25u9g", className2, classNames), "data-framer-name": "Beige", layoutDependency, layoutId: "HeroTitle__sme0MR6xw", ref: refBinding, style: { ...style }, ...addPropertyOverrides({ eUP3f9iaq: { "data-framer-name": "Orange" }, nr_UQipkw: { "data-framer-name": "Sky Blue" } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.h1, { className: "framer-styles-preset-1r5o7uy", "data-styles-preset": "X4l3QYsOx", dir: "auto", style: { "--framer-text-color": "var(--extracted-gdpscs, var(--token-86f4ddbd-7b32-4e2b-b915-97c05602f890, rgb(227, 207, 179)))" }, children: "Air Flexs" }) }), className: "framer-1ps3hy6", "data-framer-name": "Title", "data-selection": true, fonts: ["Inter"], layoutDependency, layoutId: "HeroTitle__eJ1RzjNGY", style: { "--extracted-gdpscs": "var(--token-86f4ddbd-7b32-4e2b-b915-97c05602f890, rgb(227, 207, 179))", "--framer-paragraph-spacing": "0px" }, text: ZPdhXCb4b, variants: { eUP3f9iaq: { "--extracted-gdpscs": "var(--token-1c027cd7-e03b-4f22-814c-2a2978a206bd, rgb(255, 193, 117))" }, nr_UQipkw: { "--extracted-gdpscs": "var(--token-14b8f2c3-8112-4af3-9cca-76c5a5c29424, rgb(145, 217, 255))" } }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides({ eUP3f9iaq: { children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.h1, { className: "framer-styles-preset-1r5o7uy", "data-styles-preset": "X4l3QYsOx", dir: "auto", style: { "--framer-text-color": "var(--extracted-gdpscs, var(--token-1c027cd7-e03b-4f22-814c-2a2978a206bd, rgb(255, 193, 117)))" }, children: "Air Flexs" }) }) }, nr_UQipkw: { children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.h1, { className: "framer-styles-preset-1r5o7uy", "data-styles-preset": "X4l3QYsOx", dir: "auto", style: { "--framer-text-color": "var(--extracted-gdpscs, var(--token-14b8f2c3-8112-4af3-9cca-76c5a5c29424, rgb(145, 217, 255)))" }, children: "Air Flexs" }) }) } }, baseVariant, gestureVariant) }) }) }) }) });
});
var css2 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-j1vZY.framer-umtv27, .framer-j1vZY .framer-umtv27 { display: block; }", ".framer-j1vZY.framer-1r25u9g { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: auto; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 100%; }", '.framer-j1vZY .framer-1ps3hy6 { --selection-background-color: rgba(227, 207, 179, 0.5); --selection-color: var(--token-86f4ddbd-7b32-4e2b-b915-97c05602f890, #e3cfb3) /* {"name":"Text Beige"} */; flex: none; height: auto; position: relative; white-space: pre; width: auto; }', '.framer-j1vZY.framer-v-x7chn9 .framer-1ps3hy6 { --selection-color: var(--token-1c027cd7-e03b-4f22-814c-2a2978a206bd, #ffc175) /* {"name":"Text Orange"} */; }', '.framer-j1vZY.framer-v-epi6ln .framer-1ps3hy6 { --selection-background-color: rgba(145, 217, 255, 0.5); --selection-color: var(--token-14b8f2c3-8112-4af3-9cca-76c5a5c29424, #91d9ff) /* {"name":"Text Sky Blue"} */; }', ...css, '.framer-j1vZY[data-selection="true"] * ::selection, .framer-j1vZY [data-selection="true"] * ::selection { color: var(--selection-color, none); background-color: var(--selection-background-color, none); }'];
var Framern0v8zOHwO = withCSS(Component, css2, "framer-j1vZY");
var n0v8zOHwO_default = Framern0v8zOHwO;
Framern0v8zOHwO.displayName = "Hero Title";
Framern0v8zOHwO.defaultProps = { height: 220, width: 788 };
addPropertyControls(Framern0v8zOHwO, { variant: { options: ["sme0MR6xw", "eUP3f9iaq", "nr_UQipkw"], optionTitles: ["Beige", "Orange", "Sky Blue"], title: "Variant", type: ControlType.Enum }, ZPdhXCb4b: { defaultValue: "Air Flexs", displayTextArea: false, title: "Title", type: ControlType.String }, onZPdhXCb4bChange: { changes: "ZPdhXCb4b", type: ControlType.ChangeHandler } });
addFonts(Framern0v8zOHwO, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }] }, ...getFontsFromSharedStyle(fonts)], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "default": { "type": "reactComponent", "name": "Framern0v8zOHwO", "slots": [], "annotations": { "framerContractVersion": "1", "framerIntrinsicHeight": "220", "framerIntrinsicWidth": "788", "framerImmutableVariables": "true", "framerDisplayContentsDiv": "false", "framerColorSyntax": "true", "framerComponentViewportWidth": "true", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","fixed"]},"eUP3f9iaq":{"layout":["fixed","fixed"]},"nr_UQipkw":{"layout":["fixed","fixed"]}}}', "framerAutoSizeImages": "true", "framerVariables": '{"ZPdhXCb4b":"title"}' } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  n0v8zOHwO_default as default
};
