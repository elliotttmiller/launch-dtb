var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/0xFWI1GLI6kUQz8whOiY/IAxShTS6tDkmboYz6PkO/FeE2hmrzA.js
import { jsx as _jsx } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";
var cycleOrder = ["B7R2Vd4T2", "DeSzPr0Gb", "NHX6nPrF6"];
var serializationHash = "framer-NGkLH";
var variantClassNames = { B7R2Vd4T2: "framer-v-ymnmly", DeSzPr0Gb: "framer-v-1487vh4", NHX6nPrF6: "framer-v-1jibmth" };
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
var humanReadableVariantMap = { "Sky Blue": "NHX6nPrF6", Beige: "B7R2Vd4T2", Orange: "DeSzPr0Gb" };
var Variants = motion.create(React.Fragment);
var getProps = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "B7R2Vd4T2" };
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
  const { style, className, layoutId, variant, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "B7R2Vd4T2", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsx(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-ymnmly", className, classNames), "data-framer-name": "Beige", layoutDependency, layoutId: "HeroBackgroundInverted__B7R2Vd4T2", ref: refBinding, style: { background: "linear-gradient(180deg, rgb(228, 208, 180) 0%, rgb(238, 226, 210) 11%, rgb(245, 238, 229) 39%, rgb(251, 248, 244) 60%, rgb(255, 255, 255) 100%)", ...style }, variants: { DeSzPr0Gb: { background: "linear-gradient(180deg, var(--token-0811ed08-71ff-4889-9a2e-53a63a755add, rgb(255, 195, 122)) 0%, rgb(255, 207, 153) 17.19805743243243%, rgb(255, 228, 201) 37.14984515765766%, rgb(255, 247, 240) 69.9412302927928%, rgb(255, 255, 255) 100%)" }, NHX6nPrF6: { background: "linear-gradient(180deg, var(--token-f04af15e-7364-47f9-bbfb-f1df2805a355, rgb(204, 237, 255)) 0%, rgb(224, 243, 255) 15.521185247747749%, rgb(235, 247, 255) 37.950450450450454%, rgb(247, 252, 255) 73.24746621621621%, rgb(255, 255, 255) 100%)" } }, ...addPropertyOverrides({ DeSzPr0Gb: { "data-framer-name": "Orange" }, NHX6nPrF6: { "data-framer-name": "Sky Blue" } }, baseVariant, gestureVariant) }) }) }) });
});
var css = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-NGkLH.framer-1aw39df, .framer-NGkLH .framer-1aw39df { display: block; }", ".framer-NGkLH.framer-ymnmly { height: auto; overflow: var(--overflow-clip-fallback, clip); position: relative; width: 100%; }"];
var FramerFeE2hmrzA = withCSS(Component, css, "framer-NGkLH");
var FeE2hmrzA_default = FramerFeE2hmrzA;
FramerFeE2hmrzA.displayName = "Hero Background Inverted";
FramerFeE2hmrzA.defaultProps = { height: 800, width: 1200 };
addPropertyControls(FramerFeE2hmrzA, { variant: { options: ["B7R2Vd4T2", "DeSzPr0Gb", "NHX6nPrF6"], optionTitles: ["Beige", "Orange", "Sky Blue"], title: "Variant", type: ControlType.Enum } });
addFonts(FramerFeE2hmrzA, [{ explicitInter: true, fonts: [] }], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "FramerFeE2hmrzA", "slots": [], "annotations": { "framerIntrinsicWidth": "1200", "framerContractVersion": "1", "framerComponentViewportWidth": "true", "framerImmutableVariables": "true", "framerColorSyntax": "true", "framerAutoSizeImages": "true", "framerDisplayContentsDiv": "false", "framerIntrinsicHeight": "800", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","fixed"]},"DeSzPr0Gb":{"layout":["fixed","fixed"]},"NHX6nPrF6":{"layout":["fixed","fixed"]}}}' } }, "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  FeE2hmrzA_default as default
};
