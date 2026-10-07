var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/FLt8uZ8tMloQNx3D7M2D/D88ZplEdynYUnBkp8xQg/t3Ke7PZ3N.js
import { jsx as _jsx } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";
var cycleOrder = ["gEYBzTYcK", "hQgeu8mXR", "hzwJ4li4D"];
var serializationHash = "framer-Y5Ddt";
var variantClassNames = { gEYBzTYcK: "framer-v-4kgj8r", hQgeu8mXR: "framer-v-t7o089", hzwJ4li4D: "framer-v-1oq4x0d" };
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
var humanReadableVariantMap = { "Sky Blue": "hzwJ4li4D", Beige: "gEYBzTYcK", Orange: "hQgeu8mXR" };
var Variants = motion.create(React.Fragment);
var getProps = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "gEYBzTYcK" };
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
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "gEYBzTYcK", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsx(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-4kgj8r", className, classNames), "data-framer-name": "Beige", layoutDependency, layoutId: "HeroBackground__gEYBzTYcK", ref: refBinding, style: { background: "linear-gradient(180deg, rgb(255, 255, 255) 0%, var(--token-662c738d-2c5a-4b98-aeea-24b6bd59dfd6, rgb(227, 207, 179)) 100%)", ...style }, variants: { hQgeu8mXR: { background: "linear-gradient(180deg, rgb(255, 255, 255) 0%, var(--token-0811ed08-71ff-4889-9a2e-53a63a755add, rgb(255, 195, 122)) 100%)" }, hzwJ4li4D: { background: "linear-gradient(180deg, rgb(255, 255, 255) 0%, var(--token-f04af15e-7364-47f9-bbfb-f1df2805a355, rgb(204, 237, 255)) 99.80644707207207%)" } }, ...addPropertyOverrides({ hQgeu8mXR: { "data-framer-name": "Orange" }, hzwJ4li4D: { "data-framer-name": "Sky Blue" } }, baseVariant, gestureVariant) }) }) }) });
});
var css = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-Y5Ddt.framer-8vpe79, .framer-Y5Ddt .framer-8vpe79 { display: block; }", ".framer-Y5Ddt.framer-4kgj8r { height: auto; overflow: var(--overflow-clip-fallback, clip); position: relative; width: 100%; }"];
var Framert3Ke7PZ3N = withCSS(Component, css, "framer-Y5Ddt");
var t3Ke7PZ3N_default = Framert3Ke7PZ3N;
Framert3Ke7PZ3N.displayName = "Hero Background";
Framert3Ke7PZ3N.defaultProps = { height: 800, width: 1200 };
addPropertyControls(Framert3Ke7PZ3N, { variant: { options: ["gEYBzTYcK", "hQgeu8mXR", "hzwJ4li4D"], optionTitles: ["Beige", "Orange", "Sky Blue"], title: "Variant", type: ControlType.Enum } });
addFonts(Framert3Ke7PZ3N, [{ explicitInter: true, fonts: [] }], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "default": { "type": "reactComponent", "name": "Framert3Ke7PZ3N", "slots": [], "annotations": { "framerIntrinsicHeight": "800", "framerDisplayContentsDiv": "false", "framerAutoSizeImages": "true", "framerImmutableVariables": "true", "framerComponentViewportWidth": "true", "framerColorSyntax": "true", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","fixed"]},"hQgeu8mXR":{"layout":["fixed","fixed"]},"hzwJ4li4D":{"layout":["fixed","fixed"]}}}', "framerContractVersion": "1", "framerIntrinsicWidth": "1200" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  t3Ke7PZ3N_default as default
};
