var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/87mAmueENG73WhSIIre9/NG0gyHdX0eollMrm89l0/uirOFEYUM.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, getLoadingLazyAtYPosition, Image as Image1, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";
var cycleOrder = ["Bwu1fW1eT", "MeiJ2FvC3", "mEB3wbfeo"];
var serializationHash = "framer-Gj2Iu";
var variantClassNames = { Bwu1fW1eT: "framer-v-bscnd", mEB3wbfeo: "framer-v-hzw8pc", MeiJ2FvC3: "framer-v-ezw5zh" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { bounce: 0, delay: 0, duration: 0.4, type: "spring" };
var Transition = ({ value, children }) => {
  const config = React.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx(MotionConfigContext.Provider, { value: contextValue, children });
};
var humanReadableVariantMap = { "Sky Blue": "mEB3wbfeo", Beige: "Bwu1fW1eT", Orange: "MeiJ2FvC3" };
var Variants = motion.create(React.Fragment);
var getProps = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "Bwu1fW1eT" };
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
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "Bwu1fW1eT", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsxs(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-bscnd", className, classNames), "data-framer-name": "Beige", layoutDependency, layoutId: "DisplayShoe__Bwu1fW1eT", ref: refBinding, style: { ...style }, ...addPropertyOverrides({ mEB3wbfeo: { "data-framer-name": "Sky Blue" }, MeiJ2FvC3: { "data-framer-name": "Orange" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx(Image1, { as: "figure", background: { alt: "Beige Shoe", fit: "fill", loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + (0 + ((componentViewport?.height || 252) - 0 - ((componentViewport?.height || 252) - 0) * 1) / 2)), pixelHeight: 1152, pixelWidth: 1684, sizes: `max(${componentViewport?.width || "100vw"}, 1px)`, src: "https://framerusercontent.com/images/jibHbT6NjlJ5R8OtUjx2Xo908.png?width=1684&height=1152", srcSet: "https://framerusercontent.com/images/jibHbT6NjlJ5R8OtUjx2Xo908.png?scale-down-to=512&width=1684&height=1152 512w,https://framerusercontent.com/images/jibHbT6NjlJ5R8OtUjx2Xo908.png?scale-down-to=1024&width=1684&height=1152 1024w,https://framerusercontent.com/images/jibHbT6NjlJ5R8OtUjx2Xo908.png?width=1684&height=1152 1684w" }, className: "framer-1cjsvng", "data-framer-name": "Beige", draggable: "false", layoutDependency, layoutId: "DisplayShoe__WmNQL04Pp", style: { opacity: 1 }, variants: { mEB3wbfeo: { opacity: 0 }, MeiJ2FvC3: { opacity: 0 } } }), /* @__PURE__ */ _jsx(Image1, { as: "figure", background: { alt: "Orange Shoe", fit: "fill", loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 1), pixelHeight: 1152, pixelWidth: 1684, sizes: componentViewport?.width || "100vw", src: "https://framerusercontent.com/images/E2VNYrCwgJGNo3KH94ilz3fU30.png?width=1684&height=1152", srcSet: "https://framerusercontent.com/images/E2VNYrCwgJGNo3KH94ilz3fU30.png?scale-down-to=512&width=1684&height=1152 512w,https://framerusercontent.com/images/E2VNYrCwgJGNo3KH94ilz3fU30.png?scale-down-to=1024&width=1684&height=1152 1024w,https://framerusercontent.com/images/E2VNYrCwgJGNo3KH94ilz3fU30.png?width=1684&height=1152 1684w" }, className: "framer-7tjcp5", "data-framer-name": "Orange", draggable: "false", layoutDependency, layoutId: "DisplayShoe__eCPppvpZ8", style: { opacity: 0 }, variants: { MeiJ2FvC3: { opacity: 1 } } }), /* @__PURE__ */ _jsx(Image1, { as: "figure", background: { alt: "Sky Blue Shoe", fit: "fill", loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + 1), pixelHeight: 1138, pixelWidth: 1684, sizes: `calc(${componentViewport?.width || "100vw"} * 0.9905)`, src: "https://framerusercontent.com/images/Q9BLz2ArbQeufG1cvXTiHUALA.png?width=1684&height=1138", srcSet: "https://framerusercontent.com/images/Q9BLz2ArbQeufG1cvXTiHUALA.png?scale-down-to=512&width=1684&height=1138 512w,https://framerusercontent.com/images/Q9BLz2ArbQeufG1cvXTiHUALA.png?scale-down-to=1024&width=1684&height=1138 1024w,https://framerusercontent.com/images/Q9BLz2ArbQeufG1cvXTiHUALA.png?width=1684&height=1138 1684w" }, className: "framer-ni8e0d", "data-framer-name": "Sky Blue", draggable: "false", layoutDependency, layoutId: "DisplayShoe__C7USoApkt", style: { opacity: 0 }, variants: { mEB3wbfeo: { opacity: 1 } } })] }) }) }) });
});
var css = [".framer-Gj2Iu.framer-1my9d6b, .framer-Gj2Iu .framer-1my9d6b { display: block; }", ".framer-Gj2Iu.framer-bscnd { align-content: center; align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: auto; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-Gj2Iu .framer-1cjsvng { -webkit-user-select: none; flex: 1 0 0px; height: 100%; pointer-events: none; position: relative; user-select: none; width: 1px; z-index: 3; }", ".framer-Gj2Iu .framer-7tjcp5 { -webkit-user-select: none; flex: none; height: 100%; left: 0px; pointer-events: none; position: absolute; top: 1px; user-select: none; width: 100%; z-index: 3; }", ".framer-Gj2Iu .framer-ni8e0d { -webkit-user-select: none; aspect-ratio: 1.4642857142857142 / 1; flex: none; height: auto; left: 2px; pointer-events: none; position: absolute; top: 1px; user-select: none; width: 99%; z-index: 3; }"];
var FrameruirOFEYUM = withCSS(Component, css, "framer-Gj2Iu");
var uirOFEYUM_default = FrameruirOFEYUM;
FrameruirOFEYUM.displayName = "Display Shoe";
FrameruirOFEYUM.defaultProps = { height: 252, width: 369 };
addPropertyControls(FrameruirOFEYUM, { variant: { options: ["Bwu1fW1eT", "MeiJ2FvC3", "mEB3wbfeo"], optionTitles: ["Beige", "Orange", "Sky Blue"], title: "Variant", type: ControlType.Enum } });
addFonts(FrameruirOFEYUM, [{ explicitInter: true, fonts: [] }], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "default": { "type": "reactComponent", "name": "FrameruirOFEYUM", "slots": [], "annotations": { "framerIntrinsicHeight": "252", "framerAutoSizeImages": "true", "framerColorSyntax": "true", "framerDisplayContentsDiv": "false", "framerContractVersion": "1", "framerIntrinsicWidth": "369", "framerImmutableVariables": "true", "framerComponentViewportWidth": "true", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","fixed"]},"MeiJ2FvC3":{"layout":["fixed","fixed"]},"mEB3wbfeo":{"layout":["fixed","fixed"]}}}' } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  uirOFEYUM_default as default
};
