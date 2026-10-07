var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/AyQCQvVbDqIfhDYZ12Fx/5KMWqHWnygQMdHsPAEMe/ktCuW9AO8.js
import { jsx as _jsx2, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, Floating, RichText, useActiveVariantCallback, useComponentViewport, useLocaleInfo, useOverlayState, useVariantState, withCodeBoundaryForOverrides, withCSS, withFX } from "./_framer-runtime.js";
import { AnimatePresence, LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
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
function withVariantSwitch(Component2, variantName) {
  return /* @__PURE__ */ forwardRef((props, ref) => {
    const [store, setStore] = useStore();
    const handleChange = () => {
      setStore({ variant: variantName });
    };
    return /* @__PURE__ */ _jsx(Component2, { ref, ...props, onClick: handleChange });
  });
}
var withBeige = (Component2) => withVariantSwitch(Component2, "Beige");
var withOrange = (Component2) => withVariantSwitch(Component2, "Orange");
var withSkyBlue = (Component2) => withVariantSwitch(Component2, "Sky Blue");

// http-url:https://framerusercontent.com/modules/AyQCQvVbDqIfhDYZ12Fx/5KMWqHWnygQMdHsPAEMe/ktCuW9AO8.js
var MotionDivWithFX = withFX(motion.div);
var MotionDivWithBeigerm2iet = withCodeBoundaryForOverrides(motion.div, { nodeId: "zmvW3C9g1", override: withBeige, scopeId: "ktCuW9AO8" });
var MotionDivWithSkyBluep8tprf = withCodeBoundaryForOverrides(motion.div, { nodeId: "AfapntieU", override: withSkyBlue, scopeId: "ktCuW9AO8" });
var MotionDivWithOrange174dc34 = withCodeBoundaryForOverrides(motion.div, { nodeId: "G6c3mmKje", override: withOrange, scopeId: "ktCuW9AO8" });
var cycleOrder = ["hMR2Eczfy", "Qmz_V_cpa", "Pp8oChv_V"];
var serializationHash = "framer-iIFm0";
var variantClassNames = { hMR2Eczfy: "framer-v-1v7trr", Pp8oChv_V: "framer-v-1lo7vce", Qmz_V_cpa: "framer-v-1xzenbz" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var animation = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 0.8, skewX: 0, skewY: 0, transition: transition1, x: 0, y: 0 };
var animation1 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition1, x: 0, y: 0 };
var animation2 = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 0.8, skewX: 0, skewY: 0, x: 0, y: 0 };
var Overlay = ({ children, blockDocumentScrolling, dismissWithEsc, enabled = true }) => {
  const [visible, setVisible] = useOverlayState({ blockDocumentScrolling, dismissWithEsc: enabled && dismissWithEsc });
  return children({ hide: () => setVisible(false), show: () => setVisible(true), toggle: () => setVisible(!visible), visible: enabled && visible });
};
var Transition = ({ value, children }) => {
  const config = React.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx2(MotionConfigContext.Provider, { value: contextValue, children });
};
var humanReadableVariantMap = { "Sky Blue": "Pp8oChv_V", Beige: "hMR2Eczfy", Orange: "Qmz_V_cpa" };
var Variants = motion.create(React.Fragment);
var getProps = ({ height, id, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "hMR2Eczfy" };
};
var createLayoutDependency = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component = /* @__PURE__ */ React.forwardRef(function(props, ref) {
  const fallbackRef = useRef2(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React.useId();
  const { activeLocale, setLocale } = useLocaleInfo();
  const componentViewport = useComponentViewport();
  const { style, className, layoutId, variant, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "hMR2Eczfy", ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback(baseVariant);
  const onTap1byn7dv = activeVariantCallback(async (...args) => {
    setVariant("hMR2Eczfy");
  });
  const onMouseEnter13elrgn = ({ overlay }) => activeVariantCallback(async (...args) => {
    overlay.show();
  });
  const onTap1kynriw = activeVariantCallback(async (...args) => {
    setVariant("Pp8oChv_V");
  });
  const onTap1oxslx9 = activeVariantCallback(async (...args) => {
    setVariant("Qmz_V_cpa");
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  const ref1 = React.useRef(null);
  const ref2 = React.useRef(null);
  const ref3 = React.useRef(null);
  const ref4 = React.useRef(null);
  const ref5 = React.useRef(null);
  const ref6 = React.useRef(null);
  return /* @__PURE__ */ _jsx2(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx2(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx2(Transition, { value: transition1, children: /* @__PURE__ */ _jsxs(motion.div, { ...restProps, ...gestureHandlers, className: cx(scopingClassNames, "framer-1v7trr", className, classNames), "data-framer-name": "Beige", layoutDependency, layoutId: "ColorSwitcher__hMR2Eczfy", ref: refBinding, style: { backdropFilter: "blur(5px)", backgroundColor: "var(--token-f2423658-83c6-4d7f-a30b-1ede7af205cb, rgba(0, 0, 0, 0.2))", borderBottomLeftRadius: 1e4, borderBottomRightRadius: 1e4, borderTopLeftRadius: 1e4, borderTopRightRadius: 1e4, WebkitBackdropFilter: "blur(5px)", ...style }, ...addPropertyOverrides({ Pp8oChv_V: { "data-framer-name": "Sky Blue" }, Qmz_V_cpa: { "data-framer-name": "Orange" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx2(Overlay, { blockDocumentScrolling: false, dismissWithEsc: false, children: (overlay) => /* @__PURE__ */ _jsx2(_Fragment, { children: /* @__PURE__ */ _jsx2(MotionDivWithBeigerm2iet, { className: "framer-rm2iet", "data-framer-name": "Color Swatch", "data-highlight": true, id: `${layoutId}-rm2iet`, layoutDependency, layoutId: "ColorSwitcher__zmvW3C9g1", onMouseEnter: onMouseEnter13elrgn({ overlay }), onTap: onTap1byn7dv, ref: ref1, style: { backgroundColor: "var(--token-662c738d-2c5a-4b98-aeea-24b6bd59dfd6, rgb(227, 207, 179))", borderBottomLeftRadius: "100%", borderBottomRightRadius: "100%", borderTopLeftRadius: "100%", borderTopRightRadius: "100%", boxShadow: "0px 0px 0px 1px rgb(255, 255, 255)" }, variants: { Pp8oChv_V: { boxShadow: "0px 0px 0px 1px rgba(255, 255, 255, 0)" }, Qmz_V_cpa: { boxShadow: "0px 0px 0px 1px rgba(255, 255, 255, 0)" } }, children: /* @__PURE__ */ _jsx2(AnimatePresence, { children: overlay.visible && /* @__PURE__ */ _jsx2(Floating, { alignment: "center", anchorRef: ref1, className: cx(scopingClassNames, classNames), collisionDetection: true, collisionDetectionPadding: 20, "data-framer-portal-id": `${layoutId}-rm2iet`, offsetX: 0, offsetY: -20, onDismiss: overlay.hide, placement: "top", safeArea: true, zIndex: 11, children: /* @__PURE__ */ _jsx2(MotionDivWithFX, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation1, className: "framer-18x2w1b", exit: animation, initial: animation2, layoutDependency, layoutId: "ColorSwitcher__I76g2JdJy", ref: ref2, role: "dialog", style: { borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10 }, children: /* @__PURE__ */ _jsx2(motion.div, { className: "framer-19dwgw8", "data-framer-name": "Tooltip", layoutDependency, layoutId: "ColorSwitcher__egp8hxgkd", style: { backdropFilter: "blur(5px)", backgroundColor: "var(--token-f2423658-83c6-4d7f-a30b-1ede7af205cb, rgba(0, 0, 0, 0.2))", borderBottomLeftRadius: 1e4, borderBottomRightRadius: 1e4, borderTopLeftRadius: 1e4, borderTopRightRadius: 1e4, WebkitBackdropFilter: "blur(5px)" }, children: /* @__PURE__ */ _jsx2(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx2(React.Fragment, { children: /* @__PURE__ */ _jsx2(motion.p, { dir: "auto", style: { "--font-selector": "SW50ZXItTWVkaXVt", "--framer-font-size": "12px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, var(--token-e0ec22b8-2ee9-41b9-9c9b-068af203c374, rgb(255, 255, 255)))" }, children: "Beige" }) }), className: "framer-hqq4pa", fonts: ["Inter-Medium"], layoutDependency, layoutId: "ColorSwitcher__jgxgTaZjS", style: { "--extracted-r6o4lv": "var(--token-e0ec22b8-2ee9-41b9-9c9b-068af203c374, rgb(255, 255, 255))", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }) }) }) }) }) }) }), /* @__PURE__ */ _jsx2(Overlay, { blockDocumentScrolling: false, dismissWithEsc: false, children: (overlay1) => /* @__PURE__ */ _jsx2(_Fragment, { children: /* @__PURE__ */ _jsx2(MotionDivWithSkyBluep8tprf, { className: "framer-p8tprf", "data-border": true, "data-framer-name": "Color Swatch", "data-highlight": true, id: `${layoutId}-p8tprf`, layoutDependency, layoutId: "ColorSwitcher__AfapntieU", onMouseEnter: onMouseEnter13elrgn({ overlay: overlay1 }), onTap: onTap1kynriw, ref: ref3, style: { "--border-bottom-width": "2.5px", "--border-color": "var(--token-f8fea787-91d7-4f16-9ffc-1b8878b28370, rgba(255, 255, 255, 0))", "--border-left-width": "2.5px", "--border-right-width": "2.5px", "--border-style": "solid", "--border-top-width": "2.5px", backgroundColor: "var(--token-f04af15e-7364-47f9-bbfb-f1df2805a355, rgb(204, 237, 255))", borderBottomLeftRadius: "100%", borderBottomRightRadius: "100%", borderTopLeftRadius: "100%", borderTopRightRadius: "100%", boxShadow: "0px 0px 0px 1px var(--token-f8fea787-91d7-4f16-9ffc-1b8878b28370, rgba(255, 255, 255, 0))" }, variants: { Pp8oChv_V: { boxShadow: "0px 0px 0px 1px rgb(255, 255, 255)" } }, children: /* @__PURE__ */ _jsx2(AnimatePresence, { children: overlay1.visible && /* @__PURE__ */ _jsx2(Floating, { alignment: "center", anchorRef: ref3, className: cx(scopingClassNames, classNames), collisionDetection: true, collisionDetectionPadding: 20, "data-framer-portal-id": `${layoutId}-p8tprf`, offsetX: 0, offsetY: -20, onDismiss: overlay1.hide, placement: "top", safeArea: true, zIndex: 11, children: /* @__PURE__ */ _jsx2(MotionDivWithFX, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation1, className: "framer-k3cnyf", exit: animation, initial: animation2, layoutDependency, layoutId: "ColorSwitcher__d1WqsDUCv", ref: ref4, role: "dialog", style: { borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10 }, children: /* @__PURE__ */ _jsx2(motion.div, { className: "framer-atyvoy", "data-framer-name": "Tooltip", layoutDependency, layoutId: "ColorSwitcher__lEfxstVPR", style: { backdropFilter: "blur(5px)", backgroundColor: "var(--token-f2423658-83c6-4d7f-a30b-1ede7af205cb, rgba(0, 0, 0, 0.2))", borderBottomLeftRadius: 1e4, borderBottomRightRadius: 1e4, borderTopLeftRadius: 1e4, borderTopRightRadius: 1e4, WebkitBackdropFilter: "blur(5px)" }, children: /* @__PURE__ */ _jsx2(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx2(React.Fragment, { children: /* @__PURE__ */ _jsx2(motion.p, { dir: "auto", style: { "--font-selector": "SW50ZXItTWVkaXVt", "--framer-font-size": "12px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, var(--token-e0ec22b8-2ee9-41b9-9c9b-068af203c374, rgb(255, 255, 255)))" }, children: "Sky Blue" }) }), className: "framer-105cw4h", fonts: ["Inter-Medium"], layoutDependency, layoutId: "ColorSwitcher__AdDhWYzzf", style: { "--extracted-r6o4lv": "var(--token-e0ec22b8-2ee9-41b9-9c9b-068af203c374, rgb(255, 255, 255))", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }) }) }) }) }) }) }), /* @__PURE__ */ _jsx2(Overlay, { blockDocumentScrolling: false, dismissWithEsc: false, children: (overlay2) => /* @__PURE__ */ _jsx2(_Fragment, { children: /* @__PURE__ */ _jsx2(MotionDivWithOrange174dc34, { className: "framer-174dc34", "data-border": true, "data-framer-name": "Color Swatch", "data-highlight": true, id: `${layoutId}-174dc34`, layoutDependency, layoutId: "ColorSwitcher__G6c3mmKje", onMouseEnter: onMouseEnter13elrgn({ overlay: overlay2 }), onTap: onTap1oxslx9, ref: ref5, style: { "--border-bottom-width": "2.5px", "--border-color": "var(--token-f8fea787-91d7-4f16-9ffc-1b8878b28370, rgba(255, 255, 255, 0))", "--border-left-width": "2.5px", "--border-right-width": "2.5px", "--border-style": "solid", "--border-top-width": "2.5px", backgroundColor: "var(--token-e109c2ad-518a-4162-a56d-717528e3b2d7, rgb(255, 162, 48))", borderBottomLeftRadius: "100%", borderBottomRightRadius: "100%", borderTopLeftRadius: "100%", borderTopRightRadius: "100%", boxShadow: "0px 0px 0px 1px var(--token-f8fea787-91d7-4f16-9ffc-1b8878b28370, rgba(255, 255, 255, 0))" }, variants: { Pp8oChv_V: { boxShadow: "0px 0px 0px 1px rgba(255, 255, 255, 0)" }, Qmz_V_cpa: { boxShadow: "0px 0px 0px 1px rgb(255, 255, 255)" } }, children: /* @__PURE__ */ _jsx2(AnimatePresence, { children: overlay2.visible && /* @__PURE__ */ _jsx2(Floating, { alignment: "center", anchorRef: ref5, className: cx(scopingClassNames, classNames), collisionDetection: true, collisionDetectionPadding: 20, "data-framer-portal-id": `${layoutId}-174dc34`, offsetX: 0, offsetY: -20, onDismiss: overlay2.hide, placement: "top", safeArea: true, zIndex: 11, children: /* @__PURE__ */ _jsx2(MotionDivWithFX, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation1, className: "framer-1xbdt7b", exit: animation, initial: animation2, layoutDependency, layoutId: "ColorSwitcher__SjKRIDfzr", ref: ref6, role: "dialog", style: { borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10 }, children: /* @__PURE__ */ _jsx2(motion.div, { className: "framer-1j3sr15", "data-framer-name": "Tooltip", layoutDependency, layoutId: "ColorSwitcher__o9CtQIKYo", style: { backdropFilter: "blur(5px)", backgroundColor: "var(--token-f2423658-83c6-4d7f-a30b-1ede7af205cb, rgba(0, 0, 0, 0.2))", borderBottomLeftRadius: 1e4, borderBottomRightRadius: 1e4, borderTopLeftRadius: 1e4, borderTopRightRadius: 1e4, WebkitBackdropFilter: "blur(5px)" }, children: /* @__PURE__ */ _jsx2(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx2(React.Fragment, { children: /* @__PURE__ */ _jsx2(motion.p, { dir: "auto", style: { "--font-selector": "SW50ZXItTWVkaXVt", "--framer-font-size": "12px", "--framer-font-weight": "500", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, var(--token-e0ec22b8-2ee9-41b9-9c9b-068af203c374, rgb(255, 255, 255)))" }, children: "Orange" }) }), className: "framer-uz1qxu", fonts: ["Inter-Medium"], layoutDependency, layoutId: "ColorSwitcher__HxSAhnBfb", style: { "--extracted-r6o4lv": "var(--token-e0ec22b8-2ee9-41b9-9c9b-068af203c374, rgb(255, 255, 255))", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, verticalAlignment: "top", withExternalLayout: true }) }) }) }) }) }) }) })] }) }) }) });
});
var css = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-iIFm0.framer-1sy4vxm, .framer-iIFm0 .framer-1sy4vxm { display: block; }", ".framer-iIFm0.framer-1v7trr { align-content: flex-end; align-items: flex-end; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 6px; height: auto; justify-content: center; overflow: visible; padding: 8px; position: relative; width: min-content; }", ".framer-iIFm0 .framer-rm2iet, .framer-iIFm0 .framer-p8tprf, .framer-iIFm0 .framer-174dc34 { aspect-ratio: 1 / 1; cursor: pointer; flex: none; height: var(--framer-aspect-ratio-supported, 14px); overflow: var(--overflow-clip-fallback, clip); position: relative; width: 14px; will-change: var(--framer-will-change-override, transform); }", ".framer-iIFm0 .framer-18x2w1b, .framer-iIFm0 .framer-k3cnyf, .framer-iIFm0 .framer-1xbdt7b { align-content: center; align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: min-content; will-change: var(--framer-will-change-override, transform); }", ".framer-iIFm0 .framer-19dwgw8, .framer-iIFm0 .framer-atyvoy, .framer-iIFm0 .framer-1j3sr15 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 6px; height: min-content; justify-content: center; overflow: visible; padding: 3px 10px 3px 10px; position: relative; width: min-content; }", ".framer-iIFm0 .framer-hqq4pa, .framer-iIFm0 .framer-105cw4h, .framer-iIFm0 .framer-uz1qxu { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", '.framer-iIFm0[data-border="true"]::after, .framer-iIFm0 [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FramerktCuW9AO8 = withCSS(Component, css, "framer-iIFm0");
var ktCuW9AO8_default = FramerktCuW9AO8;
FramerktCuW9AO8.displayName = "Color Switcher";
FramerktCuW9AO8.defaultProps = { height: 30, width: 70 };
addPropertyControls(FramerktCuW9AO8, { variant: { options: ["hMR2Eczfy", "Qmz_V_cpa", "Pp8oChv_V"], optionTitles: ["Beige", "Orange", "Sky Blue"], title: "Variant", type: ControlType.Enum } });
addFonts(FramerktCuW9AO8, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5A3Ce6C9YYmCjpQx9M4inSaKU.woff2", weight: "500" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/Qx95Xyt0Ka3SGhinnbXIGpEIyP4.woff2", weight: "500" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/6mJuEAguuIuMog10gGvH5d3cl8.woff2", weight: "500" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/xYYWaj7wCU5zSQH0eXvSaS19wo.woff2", weight: "500" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/otTaNuNpVK4RbdlT7zDDdKvQBA.woff2", weight: "500" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/UjlFhCnUjxhNfep4oYBPqnEssyo.woff2", weight: "500" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/DolVirEGb34pEXEp8t8FQBSK4.woff2", weight: "500" }] }], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "FramerktCuW9AO8", "slots": [], "annotations": { "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["auto","fixed"]},"Qmz_V_cpa":{"layout":["auto","fixed"]},"Pp8oChv_V":{"layout":["auto","fixed"]}}}', "framerAutoSizeImages": "true", "framerDisplayContentsDiv": "false", "framerImmutableVariables": "true", "framerComponentViewportWidth": "true", "framerIntrinsicHeight": "30", "framerIntrinsicWidth": "70", "framerColorSyntax": "true", "framerContractVersion": "1" } }, "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  ktCuW9AO8_default as default
};
