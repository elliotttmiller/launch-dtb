var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/9VKj6FUP5Ak4fuqzTY7a/jKudVwbocFvo9wTjG4Q6/nRL2gSWud.js
import { jsx as _jsx4, jsxs as _jsxs2 } from "react/jsx-runtime";
import { addFonts as addFonts3, addPropertyControls as addPropertyControls4, ComponentViewportProvider, ControlType as ControlType4, cx as cx4, forwardLoader, getFonts as getFonts2, patchBorderRadiusScaleCorrector, RichText as RichText3, SmartComponentScopedContainer, useActiveVariantCallback as useActiveVariantCallback2, useComponentViewport as useComponentViewport3, useLocaleInfo as useLocaleInfo3, useVariantState as useVariantState3, withCSS as withCSS4, withFX } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup3, motion as motion4, MotionConfigContext as MotionConfigContext3 } from "framer-motion";
import * as React4 from "react";
import { useRef as useRef3 } from "react";

// http-url:https://framerusercontent.com/modules/P3Pi20ePBGA1LrWEhBdR/bo4cLErFAJVAHc1C7Sme/RckrNKeK3.js
import { jsx as _jsx } from "react/jsx-runtime";
import { addFonts, addPropertyControls, ControlType, cx, Link, RichText, useComponentViewport, useLocaleInfo, useVariantState, withCSS } from "./_framer-runtime.js";
import { LayoutGroup, motion, MotionConfigContext } from "framer-motion";
import * as React from "react";
import { useRef } from "react";
var enabledGestures = { c2LFSeYh4: { hover: true } };
var serializationHash = "framer-YBtZy";
var variantClassNames = { c2LFSeYh4: "framer-v-690g23" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var transition2 = { delay: 0, duration: 0.3, ease: [0.44, 0, 0.56, 1], type: "tween" };
var Transition = ({ value, children }) => {
  const config = React.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx(MotionConfigContext.Provider, { value: contextValue, children });
};
var Variants = motion.create(React.Fragment);
var getProps = ({ height, id, label, link, newTab, width, ...props }) => {
  return { ...props, bozvEpqSe: link ?? props.bozvEpqSe, nvCOfKBCN: newTab ?? props.nvCOfKBCN ?? true, STPnvkFnT: label ?? props.STPnvkFnT ?? "Instagram" };
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
  const { style, className, layoutId, variant, STPnvkFnT, nvCOfKBCN, bozvEpqSe, ...restProps } = getProps(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ defaultVariant: "c2LFSeYh4", enabledGestures, ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx(Transition, { value: transition1, children: /* @__PURE__ */ _jsx(Link, { href: bozvEpqSe, motionChild: true, nodeId: "c2LFSeYh4", openInNewTab: nvCOfKBCN, scopeId: "RckrNKeK3", children: /* @__PURE__ */ _jsx(motion.a, { ...restProps, ...gestureHandlers, className: `${cx(scopingClassNames, "framer-690g23", className, classNames)} framer-cy73kh`, "data-framer-name": "Default", layoutDependency, layoutId: "nRL2gSWud__c2LFSeYh4", ref: refBinding, style: { ...style }, ...addPropertyOverrides({ "c2LFSeYh4-hover": { "data-framer-name": void 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx(Transition, { value: transition2, children: /* @__PURE__ */ _jsx(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.p, { dir: "auto", style: { "--font-selector": "RlM7U3dpdHplci12YXJpYWJsZVZGPUluZG5hSFFpSURRd01BPT0=", "--framer-font-family": '"Switzer Variable", "Switzer Variable Placeholder", sans-serif', "--framer-font-size": "13px", "--framer-font-variation-axes": 'var(--extracted-2gg91v, "wght" 400)', "--framer-line-height": "1.3em", "--framer-text-color": "var(--extracted-r6o4lv, rgba(17, 17, 17, 0.45))" }, children: "Label" }) }), className: "framer-4jhz22", "data-framer-name": "Label", fonts: ["FS;Switzer-variable"], layoutDependency, layoutId: "nRL2gSWud__tRXQHh1aJ", style: { "--extracted-2gg91v": '"wght" 400', "--extracted-r6o4lv": "rgba(17, 17, 17, 0.45)" }, text: STPnvkFnT, variants: { "c2LFSeYh4-hover": { "--extracted-r6o4lv": "#111111" } }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides({ "c2LFSeYh4-hover": { children: /* @__PURE__ */ _jsx(React.Fragment, { children: /* @__PURE__ */ _jsx(motion.p, { dir: "auto", style: { "--font-selector": "RlM7U3dpdHplci12YXJpYWJsZVZGPUluZG5hSFFpSURRd01BPT0=", "--framer-font-family": '"Switzer Variable", "Switzer Variable Placeholder", sans-serif', "--framer-font-size": "13px", "--framer-font-variation-axes": 'var(--extracted-2gg91v, "wght" 400)', "--framer-line-height": "1.3em", "--framer-text-color": "var(--extracted-r6o4lv, #111111)" }, children: "Instagram" }) }) } }, baseVariant, gestureVariant) }) }) }) }) }) }) });
});
var css = [".framer-YBtZy.framer-cy73kh, .framer-YBtZy .framer-cy73kh { display: block; }", ".framer-YBtZy.framer-690g23 { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: center; overflow: visible; padding: 6px 0px 6px 18px; position: relative; text-decoration: none; width: min-content; }", ".framer-YBtZy .framer-4jhz22 { flex: none; height: auto; position: relative; white-space: pre; width: auto; }"];
var FramerRckrNKeK3 = withCSS(Component, css, "framer-YBtZy");
var RckrNKeK3_default = FramerRckrNKeK3;
FramerRckrNKeK3.displayName = "Nav Social";
FramerRckrNKeK3.defaultProps = { height: 29, width: 77.5 };
addPropertyControls(FramerRckrNKeK3, { STPnvkFnT: { defaultValue: "Instagram", description: "Name of the network, for example Instagram.", title: "Label", type: ControlType.String }, onSTPnvkFnTChange: { changes: "STPnvkFnT", type: ControlType.ChangeHandler }, nvCOfKBCN: { defaultValue: true, title: "New Tab", type: ControlType.Boolean }, onnvCOfKBCNChange: { changes: "nvCOfKBCN", type: ControlType.ChangeHandler }, bozvEpqSe: { description: "Built by Matthias \xD6lschlegel \u{1F4AA}\n[Explore more components](https://framer.link/fsd2pgh)", title: "Link", type: ControlType.Link } });
var variationAxes = [{ defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
addFonts(FramerRckrNKeK3, [{ explicitInter: true, fonts: [{ cssFamilyName: "Switzer Variable", source: "fontshare", style: "normal", uiFamilyName: "Switzer", url: "https://framerusercontent.com/third-party-assets/fontshare/wf/HJHZ26OECMTXRH7JXPFC7EVIHDSLT2RA/LJRNLR7WCPF3PY3SZ7B2LHNUTQMFNCHL/4MCJYGQDIOOXHWSIIB2OYNDBEALJSOGN.woff2", variationAxes, weight: "400" }] }], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/xOaDMH6IuwdYuJYVVjxB/3rOTMZjQ4w3ziHPVWuTr/UQBzRK35A.js
import { jsx as _jsx3, jsxs as _jsxs } from "react/jsx-runtime";
import { addFonts as addFonts2, addPropertyControls as addPropertyControls3, ControlType as ControlType3, cx as cx3, getFonts, Link as Link2, RichText as RichText2, useActiveVariantCallback, useComponentViewport as useComponentViewport2, useLocaleInfo as useLocaleInfo2, useVariantState as useVariantState2, withCSS as withCSS3 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup2, motion as motion3, MotionConfigContext as MotionConfigContext2 } from "framer-motion";
import * as React3 from "react";
import { useRef as useRef2 } from "react";

// http-url:https://framerusercontent.com/modules/CiGGjrw5dYpN4NHDE2Gg/oCG5ewYxDu1Xmf4RdqTv/P3MA2yYun.js
import { jsx as _jsx2 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls2, ControlType as ControlType2, cx as cx2, motion as motion2, useSVGTemplate, withCSS as withCSS2 } from "./_framer-runtime.js";
import * as React2 from "react";
import { forwardRef as forwardRef3 } from "react";
var mask = "var(--framer-icon-mask)";
var Base = /* @__PURE__ */ forwardRef3(function(props, ref) {
  return /* @__PURE__ */ _jsx2("svg", { ...props, ref, children: props.children });
});
var MotionSVG = motion2.create(Base);
var SVG = /* @__PURE__ */ forwardRef3((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx2(MotionSVG, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx2("svg", { ...rest, ref, children });
});
var svg = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L 10 0 L 10 10" fill="transparent" height="10px" id="eMA3WLRa2" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--js9iwy, 2)" stroke="var(--1m973uw, rgb(0,0,0))" transform="translate(7 7)" width="10px"/><path d="M 0 10 L 10 0" fill="transparent" height="10px" id="GBl_xBBAR" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--js9iwy, 2)" stroke="var(--1m973uw, rgb(0,0,0))" transform="translate(7 7)" width="10px"/></svg>';
var getProps2 = ({ color, height, id, width, width1, ...props }) => {
  return { ...props, JEeZYcamG: width1 ?? props.JEeZYcamG ?? 2, P_DcoRcrY: color ?? props.P_DcoRcrY ?? "rgb(0, 0, 0)" };
};
var Component2 = /* @__PURE__ */ React2.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, P_DcoRcrY, JEeZYcamG, ...restProps } = getProps2(props);
  const href = useSVGTemplate("1475982494", svg);
  return /* @__PURE__ */ _jsx2(SVG, { ...restProps, className: cx2("framer-HfmfX", className), layoutId, ref, role: "presentation", style: { "--1m973uw": P_DcoRcrY, "--js9iwy": JEeZYcamG, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx2("use", { href }) });
});
var css2 = [`.framer-HfmfX { -webkit-mask: ${mask}; aspect-ratio: 1; display: block; mask: ${mask}; width: 24px; }`];
var Icon = withCSS2(Component2, css2, "framer-HfmfX");
Icon.displayName = "Arrow Up Right";
var P3MA2yYun_default = Icon;
addPropertyControls2(Icon, { P_DcoRcrY: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType2.Color }, JEeZYcamG: { defaultValue: 2, displayStepper: true, hidden: false, max: 16, min: 1, title: "Width", type: ControlType2.Number } });

// http-url:https://framerusercontent.com/modules/xOaDMH6IuwdYuJYVVjxB/3rOTMZjQ4w3ziHPVWuTr/UQBzRK35A.js
var ArrowUpRightFonts = getFonts(P3MA2yYun_default);
var cycleOrder = ["OyF4KUkoJ", "eooIBL9BV", "B0PmKTr2v"];
var serializationHash2 = "framer-BK6kj";
var variantClassNames2 = { B0PmKTr2v: "framer-v-edv38s", eooIBL9BV: "framer-v-1c83wqm", OyF4KUkoJ: "framer-v-s7v772" };
function addPropertyOverrides2(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition12 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var transition22 = { delay: 0, duration: 0.3, ease: [0.16, 1, 0.3, 1], type: "tween" };
var Transition2 = ({ value, children }) => {
  const config = React3.useContext(MotionConfigContext2);
  const transition = value ?? config.transition;
  const contextValue = React3.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx3(MotionConfigContext2.Provider, { value: contextValue, children });
};
var humanReadableVariantMap = { Active: "eooIBL9BV", Default: "OyF4KUkoJ", Dimmed: "B0PmKTr2v" };
var Variants2 = motion3.create(React3.Fragment);
var getProps3 = ({ height, id, index, label, link, newTab, onHover, onLeave, width, ...props }) => {
  return { ...props, EuStbsHep: newTab ?? props.EuStbsHep ?? false, hNNZPDRIP: label ?? props.hNNZPDRIP ?? "Marketplace", ie99wfron: onLeave ?? props.ie99wfron, JpmxFtPiL: onHover ?? props.JpmxFtPiL, v0MNo3lPt: index ?? props.v0MNo3lPt ?? "01", variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "OyF4KUkoJ", xY5a6paYG: link ?? props.xY5a6paYG };
};
var createLayoutDependency2 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component3 = /* @__PURE__ */ React3.forwardRef(function(props, ref) {
  const fallbackRef = useRef2(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React3.useId();
  const { activeLocale, setLocale } = useLocaleInfo2();
  const componentViewport = useComponentViewport2();
  const { style, className, layoutId, variant, v0MNo3lPt, hNNZPDRIP, JpmxFtPiL, ie99wfron, EuStbsHep, xY5a6paYG, ...restProps } = getProps3(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState2({ cycleOrder, defaultVariant: "OyF4KUkoJ", ref: refBinding, variant, variantClassNames: variantClassNames2 });
  const layoutDependency = createLayoutDependency2(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback(baseVariant);
  const onMouseEnter1lj80ao = activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: true });
    if (JpmxFtPiL) {
      const res = await JpmxFtPiL(...args);
      if (res === false)
        return false;
    }
  });
  const onMouseLeave5rya0d = activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: false });
    if (ie99wfron) {
      const res = await ie99wfron(...args);
      if (res === false)
        return false;
    }
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx3(serializationHash2, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx3(LayoutGroup2, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx3(Variants2, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx3(Transition2, { value: transition12, children: /* @__PURE__ */ _jsx3(Link2, { href: xY5a6paYG, motionChild: true, nodeId: "OyF4KUkoJ", openInNewTab: EuStbsHep, scopeId: "UQBzRK35A", children: /* @__PURE__ */ _jsxs(motion3.a, { ...restProps, ...gestureHandlers, className: `${cx3(scopingClassNames, "framer-s7v772", className, classNames)} framer-1jev0as`, "data-framer-name": "Default", "data-highlight": true, layoutDependency, layoutId: "nRL2gSWud__OyF4KUkoJ", onMouseEnter: onMouseEnter1lj80ao, onMouseLeave: onMouseLeave5rya0d, ref: refBinding, style: { ...style }, ...addPropertyOverrides2({ B0PmKTr2v: { "data-framer-name": "Dimmed" }, eooIBL9BV: { "data-framer-name": "Active" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx3(motion3.div, { className: "framer-vm3ohs", "data-framer-name": "Divider", layoutDependency, layoutId: "nRL2gSWud__wBvK_oClS", style: { backgroundColor: "rgba(17, 17, 17, 0.12)" } }), /* @__PURE__ */ _jsx3(Transition2, { value: transition22, children: /* @__PURE__ */ _jsxs(motion3.div, { className: "framer-zycyud", "data-framer-name": "Label Group", layoutDependency, layoutId: "nRL2gSWud__fNBjcvedM", style: { filter: "none", opacity: 1, WebkitFilter: "none" }, variants: { B0PmKTr2v: { filter: "blur(4px)", opacity: 0.35, WebkitFilter: "blur(4px)" } }, children: [/* @__PURE__ */ _jsx3(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx3(React3.Fragment, { children: /* @__PURE__ */ _jsx3(motion3.p, { dir: "auto", style: { "--font-selector": "RlM7U3dpdHplci12YXJpYWJsZVZGPUluZG5hSFFpSURVd01BPT0=", "--framer-font-family": '"Switzer Variable", "Switzer Variable Placeholder", sans-serif', "--framer-font-open-type-features": "'tnum' on", "--framer-font-size": "12px", "--framer-font-variation-axes": 'var(--extracted-2gg91v, "wght" 500)', "--framer-letter-spacing": "0.06em", "--framer-text-color": "var(--extracted-r6o4lv, rgba(17, 17, 17, 0.32))" }, children: "Index" }) }), className: "framer-4vvvk6", "data-framer-name": "Index", fonts: ["FS;Switzer-variable"], layoutDependency, layoutId: "nRL2gSWud__OFwT1yU1K", style: { "--extracted-2gg91v": '"wght" 500', "--extracted-r6o4lv": "rgba(17, 17, 17, 0.32)" }, text: v0MNo3lPt, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx3(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx3(React3.Fragment, { children: /* @__PURE__ */ _jsx3(motion3.p, { dir: "auto", style: { "--font-selector": "RlM7U3dpdHplci12YXJpYWJsZVZGPUluZG5hSFFpSURVd01BPT0=", "--framer-font-family": '"Switzer Variable", "Switzer Variable Placeholder", sans-serif', "--framer-font-size": "30px", "--framer-font-variation-axes": 'var(--extracted-2gg91v, "wght" 500)', "--framer-letter-spacing": "-0.03em", "--framer-text-color": "var(--extracted-r6o4lv, #111111)" }, children: "Label" }) }), className: "framer-v3yox2", "data-framer-name": "Label", fonts: ["FS;Switzer-variable"], layoutDependency, layoutId: "nRL2gSWud__cKMteGfUl", style: { "--extracted-2gg91v": '"wght" 500', "--extracted-r6o4lv": "#111111" }, text: hNNZPDRIP, verticalAlignment: "top", withExternalLayout: true })] }) }), /* @__PURE__ */ _jsx3(Transition2, { value: transition22, children: /* @__PURE__ */ _jsx3(P3MA2yYun_default, { animated: true, className: "framer-1fxg03t", layoutDependency, layoutId: "nRL2gSWud__DkGWiLLxm", style: { "--1m973uw": "rgb(17, 17, 17)", "--js9iwy": 1.5, opacity: 0 }, variants: { eooIBL9BV: { opacity: 1 } } }) })] }) }) }) }) });
});
var css3 = [".framer-BK6kj.framer-1jev0as, .framer-BK6kj .framer-1jev0as { display: block; }", ".framer-BK6kj.framer-s7v772 { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; overflow: visible; padding: 16px 0px 16px 0px; position: relative; text-decoration: none; width: 408px; }", ".framer-BK6kj .framer-vm3ohs { flex: none; height: 1px; left: 0px; pointer-events: none; position: absolute; right: 0px; top: -1px; }", ".framer-BK6kj .framer-zycyud { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 16px; height: min-content; justify-content: flex-start; padding: 0px; position: relative; width: min-content; }", ".framer-BK6kj .framer-4vvvk6, .framer-BK6kj .framer-v3yox2 { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-BK6kj .framer-1fxg03t { flex: none; height: auto; position: relative; width: 18px; }"];
var FramerUQBzRK35A = withCSS3(Component3, css3, "framer-BK6kj");
var UQBzRK35A_default = FramerUQBzRK35A;
FramerUQBzRK35A.displayName = "Menu Link";
FramerUQBzRK35A.defaultProps = { height: 68, width: 408 };
addPropertyControls3(FramerUQBzRK35A, { variant: { options: ["OyF4KUkoJ", "eooIBL9BV", "B0PmKTr2v"], optionTitles: ["Default", "Active", "Dimmed"], title: "Variant", type: ControlType3.Enum }, v0MNo3lPt: { defaultValue: "01", description: "Small number in front of the label, for example 01.", title: "Index", type: ControlType3.String }, onv0MNo3lPtChange: { changes: "v0MNo3lPt", type: ControlType3.ChangeHandler }, hNNZPDRIP: { defaultValue: "Marketplace", description: "Menu item text.", title: "Label", type: ControlType3.String }, onhNNZPDRIPChange: { changes: "hNNZPDRIP", type: ControlType3.ChangeHandler }, JpmxFtPiL: { title: "On Hover", type: ControlType3.EventHandler }, ie99wfron: { title: "On Leave", type: ControlType3.EventHandler }, EuStbsHep: { defaultValue: false, description: "Opens the link in a new tab.", title: "New Tab", type: ControlType3.Boolean }, onEuStbsHepChange: { changes: "EuStbsHep", type: ControlType3.ChangeHandler }, xY5a6paYG: { description: "Built by Matthias \xD6lschlegel \u{1F4AA}\n[Explore more components](https://framer.link/fsd2pgh)", title: "Link", type: ControlType3.Link } });
var variationAxes2 = [{ defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
addFonts2(FramerUQBzRK35A, [{ explicitInter: true, fonts: [{ cssFamilyName: "Switzer Variable", source: "fontshare", style: "normal", uiFamilyName: "Switzer", url: "https://framerusercontent.com/third-party-assets/fontshare/wf/HJHZ26OECMTXRH7JXPFC7EVIHDSLT2RA/LJRNLR7WCPF3PY3SZ7B2LHNUTQMFNCHL/4MCJYGQDIOOXHWSIIB2OYNDBEALJSOGN.woff2", variationAxes: variationAxes2, weight: "400" }] }, ...ArrowUpRightFonts], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/9VKj6FUP5Ak4fuqzTY7a/jKudVwbocFvo9wTjG4Q6/nRL2gSWud.js
var MenuLinkFonts = getFonts2(UQBzRK35A_default);
var MotionDivWithFX = withFX(motion4.div);
var NavSocialFonts = getFonts2(RckrNKeK3_default);
var cycleOrder2 = ["rIN1Kx5Og", "IA9qV9pnv", "pN_9iGami", "V5TLZUmSX", "BU646MiG6", "o9SepsxST"];
var serializationHash3 = "framer-vMvkH";
var variantClassNames3 = { BU646MiG6: "framer-v-1s1fkqu", IA9qV9pnv: "framer-v-1gq5xxj", o9SepsxST: "framer-v-c1ff0k", pN_9iGami: "framer-v-1xknxid", rIN1Kx5Og: "framer-v-5lj021", V5TLZUmSX: "framer-v-1xq32vm" };
function addPropertyOverrides3(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var patchBorderRadiusScaleCorrector1 = patchBorderRadiusScaleCorrector();
var transition13 = { bounce: 0.2, delay: 0, duration: 0.55, type: "spring" };
var transition23 = { delay: 0, duration: 0.4, ease: [0.42, 0, 0.58, 1], type: "tween" };
var Transition3 = ({ value, children }) => {
  const config = React4.useContext(MotionConfigContext3);
  const transition = value ?? config.transition;
  const contextValue = React4.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx4(MotionConfigContext3.Provider, { value: contextValue, children });
};
var transition3 = { bounce: 0.1, delay: 0, duration: 0.5, type: "spring" };
var transition4 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var animation = { backgroundColor: "rgba(17, 17, 17, 0.05)", opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1.06, skewX: 0, skewY: 0, transition: transition4 };
var transition5 = { bounce: 0.28, delay: 0, duration: 0.7, type: "spring" };
var transition6 = { bounce: 0.35, delay: 0, duration: 0.6, type: "spring" };
var transition7 = { delay: 0, duration: 0.38, ease: [0.33, 0, 0.67, 1], type: "tween" };
var transition8 = { delay: 0.04, duration: 0.34, ease: [0.33, 0, 0.67, 1], type: "tween" };
var matchVariant = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var transition9 = { delay: 0.07, duration: 0.34, ease: [0.33, 0, 0.67, 1], type: "tween" };
var transition10 = { delay: 0.1, duration: 0.34, ease: [0.33, 0, 0.67, 1], type: "tween" };
var transition11 = { delay: 0.13, duration: 0.34, ease: [0.33, 0, 0.67, 1], type: "tween" };
var transition122 = { delay: 0.16, duration: 0.34, ease: [0.33, 0, 0.67, 1], type: "tween" };
var transition132 = { delay: 0, duration: 1.4, ease: [0.42, 0, 0.58, 1], type: "tween" };
var animation1 = { opacity: 0.25, rotate: 360, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, x: 0, y: 0 };
var humanReadableVariantMap2 = { "Open \u2014 Editorial": "BU646MiG6", "Open \u2014 Marketplace": "pN_9iGami", "Open \u2014 Pricing": "o9SepsxST", "Open \u2014 Sellers": "V5TLZUmSX", Closed: "IA9qV9pnv", Open: "rIN1Kx5Og" };
var Variants3 = motion4.create(React4.Fragment);
var getProps4 = ({ height, id, logoName, onClose, onOpen, showBackdrop, time, width, ...props }) => {
  return { ...props, AshYbHZRg: onOpen ?? props.AshYbHZRg, eCSiaI1ym: time ?? props.eCSiaI1ym ?? "10:37", j1CDkm6Yi: showBackdrop ?? props.j1CDkm6Yi ?? false, NUPML5eQK: onClose ?? props.NUPML5eQK, TbpxG5_48: logoName ?? props.TbpxG5_48 ?? "ARKTER", variant: humanReadableVariantMap2[props.variant] ?? props.variant ?? "rIN1Kx5Og" };
};
var createLayoutDependency3 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component4 = /* @__PURE__ */ React4.forwardRef(function(props, ref) {
  const fallbackRef = useRef3(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React4.useId();
  const { activeLocale, setLocale } = useLocaleInfo3();
  const componentViewport = useComponentViewport3();
  const { style, className, layoutId, variant, AshYbHZRg, NUPML5eQK, eCSiaI1ym, j1CDkm6Yi, TbpxG5_48, ...restProps } = getProps4(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState3({ cycleOrder: cycleOrder2, defaultVariant: "rIN1Kx5Og", ref: refBinding, variant, variantClassNames: variantClassNames3 });
  const layoutDependency = createLayoutDependency3(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback2(baseVariant);
  const onTap15ei67c = activeVariantCallback(async (...args) => {
    if (NUPML5eQK) {
      const res = await NUPML5eQK(...args);
      if (res === false)
        return false;
    }
    setVariant("IA9qV9pnv");
  });
  const onTap1hf5bqp = activeVariantCallback(async (...args) => {
    if (AshYbHZRg) {
      const res = await AshYbHZRg(...args);
      if (res === false)
        return false;
    }
    setVariant("rIN1Kx5Og");
  });
  const onMouseLeave12upfbo = activeVariantCallback(async (...args) => {
    setVariant("rIN1Kx5Og");
  });
  const JpmxFtPiLv2vbcj = activeVariantCallback(async (...args) => {
    await delay(() => setVariant("pN_9iGami"), 60);
  });
  const JpmxFtPiLbr1e6q = activeVariantCallback(async (...args) => {
    await delay(() => setVariant("V5TLZUmSX"), 60);
  });
  const JpmxFtPiL1pfemv = activeVariantCallback(async (...args) => {
    await delay(() => setVariant("BU646MiG6"), 60);
  });
  const JpmxFtPiL12iy7ht = activeVariantCallback(async (...args) => {
    await delay(() => setVariant("o9SepsxST"), 60);
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx4(serializationHash3, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx4(LayoutGroup3, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx4(Variants3, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx4(Transition3, { value: transition13, children: /* @__PURE__ */ _jsxs2(motion4.nav, { ...restProps, ...gestureHandlers, "aria-label": "Marketplace Navigation", className: cx4(scopingClassNames, "framer-5lj021", className, classNames), "data-framer-name": "Open", layoutDependency, layoutId: "nRL2gSWud__rIN1Kx5Og", ref: refBinding, style: { "--corner-shape-fallback": 1, cornerShape: "superellipse(1)", ...style }, ...addPropertyOverrides3({ BU646MiG6: { "data-framer-name": "Open \u2014 Editorial" }, IA9qV9pnv: { "data-framer-name": "Closed" }, o9SepsxST: { "data-framer-name": "Open \u2014 Pricing" }, pN_9iGami: { "data-framer-name": "Open \u2014 Marketplace" }, V5TLZUmSX: { "data-framer-name": "Open \u2014 Sellers" } }, baseVariant, gestureVariant), children: [j1CDkm6Yi !== false && /* @__PURE__ */ _jsx4(Transition3, { value: transition23, children: /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-9n395a", "data-framer-name": "Backdrop", layoutDependency, layoutId: "nRL2gSWud__vC0Rm75Ft", style: { backdropFilter: "blur(26px)", backgroundColor: "rgba(239, 238, 234, 0.16)", opacity: 1, WebkitBackdropFilter: "blur(26px)" }, variants: { BU646MiG6: { opacity: 1 }, IA9qV9pnv: { opacity: 0 }, o9SepsxST: { opacity: 1 }, pN_9iGami: { opacity: 1 }, V5TLZUmSX: { opacity: 1 } } }) }), /* @__PURE__ */ _jsx4(Transition3, { value: transition3, children: /* @__PURE__ */ _jsxs2(motion4.div, { className: "framer-5272c8", "data-border": true, "data-framer-name": "Panel", layoutDependency, layoutId: "nRL2gSWud__EroVDMxHA", style: { "--border-bottom-width": "1px", "--border-color": "rgba(255, 255, 255, 0.45)", "--border-left-width": "1px", "--border-right-width": "1px", "--border-style": "solid", "--border-top-width": "1px", "--corner-shape-fallback": 0.71, backdropFilter: "blur(30px)", backgroundColor: "rgba(255, 255, 255, 0.2)", borderBottomLeftRadius: "calc(28px*var(--one-if-corner-shape-supported,var(--corner-shape-fallback,1)))", borderBottomRightRadius: "calc(28px*var(--one-if-corner-shape-supported,var(--corner-shape-fallback,1)))", borderTopLeftRadius: "calc(28px*var(--one-if-corner-shape-supported,var(--corner-shape-fallback,1)))", borderTopRightRadius: "calc(28px*var(--one-if-corner-shape-supported,var(--corner-shape-fallback,1)))", boxShadow: "0px 28px 64px -22px rgba(17, 17, 17, 0.28), inset 0px -1px 0px 0px rgba(17, 17, 17, 0.06)", cornerShape: "superellipse(1.6)", filter: "saturate(1.32)", WebkitBackdropFilter: "blur(30px)", WebkitFilter: "saturate(1.32)" }, children: [/* @__PURE__ */ _jsxs2(motion4.div, { className: "framer-hfmrvc", "data-framer-name": "Bar", layoutDependency, layoutId: "nRL2gSWud__lTC4dD5C8", children: [/* @__PURE__ */ _jsx4(RichText3, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx4(React4.Fragment, { children: /* @__PURE__ */ _jsx4(motion4.p, { dir: "auto", style: { "--font-selector": "SW50ZXItVmFyaWFibGVWRj1JbmRuYUhRaUlEWXdNQT09", "--framer-font-family": '"Inter Variable", "Inter Variable Placeholder", sans-serif', "--framer-font-size": "15px", "--framer-font-variation-axes": 'var(--extracted-2gg91v, "wght" 600)', "--framer-letter-spacing": "0.12em", "--framer-line-height": "1.1em" }, children: "ARKTER" }) }), className: "framer-ed3ax7", "data-framer-name": "Wordmark", fonts: ["Inter-Variable"], layoutDependency, layoutId: "nRL2gSWud__aKirHRFUY", style: { "--extracted-2gg91v": '"wght" 600' }, text: TbpxG5_48, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx4(Transition3, { value: transition5, children: /* @__PURE__ */ _jsxs2(motion4.div, { className: "framer-fzky62", "data-border": true, "data-framer-name": "Menu Button", "data-highlight": true, layoutDependency, layoutId: "nRL2gSWud__m_OOe1cMR", onTap: onTap15ei67c, style: { "--border-bottom-width": "1px", "--border-color": "rgba(17, 17, 17, 0.12)", "--border-left-width": "1px", "--border-right-width": "1px", "--border-style": "solid", "--border-top-width": "1px", borderBottomLeftRadius: 999, borderBottomRightRadius: 999, borderTopLeftRadius: 999, borderTopRightRadius: 999, rotate: 90 }, variants: { IA9qV9pnv: { rotate: 0 } }, whileHover: animation, ...addPropertyOverrides3({ IA9qV9pnv: { onTap: onTap1hf5bqp } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx4(Transition3, { value: transition6, children: /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-h3gzx", "data-framer-name": "Bar Top", layoutDependency, layoutId: "nRL2gSWud__mPd0kkcc9", style: { backgroundColor: "rgb(17, 17, 17)", borderBottomLeftRadius: 2, borderBottomRightRadius: 2, borderTopLeftRadius: 2, borderTopRightRadius: 2, rotate: 45 }, variants: { IA9qV9pnv: { rotate: 0 } } }) }), /* @__PURE__ */ _jsx4(Transition3, { value: transition6, children: /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-1jtqx2m", "data-framer-name": "Bar Bottom", layoutDependency, layoutId: "nRL2gSWud__nkCWEEOI2", style: { backgroundColor: "rgb(17, 17, 17)", borderBottomLeftRadius: 2, borderBottomRightRadius: 2, borderTopLeftRadius: 2, borderTopRightRadius: 2, rotate: -45 }, variants: { IA9qV9pnv: { rotate: 0 } } }) })] }) })] }), /* @__PURE__ */ _jsx4(Transition3, { value: transition7, children: /* @__PURE__ */ _jsxs2(motion4.div, { className: "framer-1b4mohk", "data-framer-name": "Drawer", layoutDependency, layoutId: "nRL2gSWud__p5bZTa4zS", children: [/* @__PURE__ */ _jsxs2(motion4.div, { className: "framer-15596k5", "data-framer-name": "Rows", "data-highlight": true, layoutDependency, layoutId: "nRL2gSWud__WDEOb9YZO", onMouseLeave: onMouseLeave12upfbo, children: [/* @__PURE__ */ _jsx4(Transition3, { value: transition8, children: /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 68, width: `calc(${componentViewport?.width || "100vw"} - 52px)`, y: (componentViewport?.y || 0) + 0 + 0 + 0 + 76 + 14 + 0 + 0 + 0, children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-quhqhc-container", layoutDependency, layoutId: "nRL2gSWud__I9AHkRAQl-container", nodeId: "I9AHkRAQl", rendersWithMotion: true, scopeId: "nRL2gSWud", style: { opacity: 1 }, variants: { BU646MiG6: { opacity: 1 }, IA9qV9pnv: { opacity: 0 }, o9SepsxST: { opacity: 1 }, pN_9iGami: { opacity: 1 }, V5TLZUmSX: { opacity: 1 } }, children: /* @__PURE__ */ _jsx4(UQBzRK35A_default, { EuStbsHep: true, height: "100%", hNNZPDRIP: "Marketplace", id: "I9AHkRAQl", JpmxFtPiL: JpmxFtPiLv2vbcj, layoutId: "nRL2gSWud__I9AHkRAQl", style: { width: "100%" }, v0MNo3lPt: "01", variant: matchVariant("OyF4KUkoJ"), width: "100%", xY5a6paYG: "https://framer.link/fsd2pgh", ...addPropertyOverrides3({ BU646MiG6: { variant: matchVariant("B0PmKTr2v") }, o9SepsxST: { variant: matchVariant("B0PmKTr2v") }, pN_9iGami: { variant: matchVariant("eooIBL9BV") }, V5TLZUmSX: { variant: matchVariant("B0PmKTr2v") } }, baseVariant, gestureVariant) }) }) }) }), /* @__PURE__ */ _jsx4(Transition3, { value: transition9, children: /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 68, width: `calc(${componentViewport?.width || "100vw"} - 52px)`, y: (componentViewport?.y || 0) + 0 + 0 + 0 + 76 + 14 + 0 + 0 + 68, children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-12af4zk-container", layoutDependency, layoutId: "nRL2gSWud__IlzMFPSiX-container", nodeId: "IlzMFPSiX", rendersWithMotion: true, scopeId: "nRL2gSWud", style: { opacity: 1 }, variants: { BU646MiG6: { opacity: 1 }, IA9qV9pnv: { opacity: 0 }, o9SepsxST: { opacity: 1 }, pN_9iGami: { opacity: 1 }, V5TLZUmSX: { opacity: 1 } }, children: /* @__PURE__ */ _jsx4(UQBzRK35A_default, { EuStbsHep: true, height: "100%", hNNZPDRIP: "Sellers", id: "IlzMFPSiX", JpmxFtPiL: JpmxFtPiLbr1e6q, layoutId: "nRL2gSWud__IlzMFPSiX", style: { width: "100%" }, v0MNo3lPt: "02", variant: matchVariant("OyF4KUkoJ"), width: "100%", xY5a6paYG: "https://framer.link/fsd2pgh", ...addPropertyOverrides3({ BU646MiG6: { variant: matchVariant("B0PmKTr2v") }, o9SepsxST: { variant: matchVariant("B0PmKTr2v") }, pN_9iGami: { variant: matchVariant("B0PmKTr2v") }, V5TLZUmSX: { variant: matchVariant("eooIBL9BV") } }, baseVariant, gestureVariant) }) }) }) }), /* @__PURE__ */ _jsx4(Transition3, { value: transition10, children: /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 68, width: `calc(${componentViewport?.width || "100vw"} - 52px)`, y: (componentViewport?.y || 0) + 0 + 0 + 0 + 76 + 14 + 0 + 0 + 136, children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-44vy3h-container", layoutDependency, layoutId: "nRL2gSWud__f_sF1KS7T-container", nodeId: "f_sF1KS7T", rendersWithMotion: true, scopeId: "nRL2gSWud", style: { opacity: 1 }, variants: { BU646MiG6: { opacity: 1 }, IA9qV9pnv: { opacity: 0 }, o9SepsxST: { opacity: 1 }, pN_9iGami: { opacity: 1 }, V5TLZUmSX: { opacity: 1 } }, children: /* @__PURE__ */ _jsx4(UQBzRK35A_default, { EuStbsHep: true, height: "100%", hNNZPDRIP: "Editorial", id: "f_sF1KS7T", JpmxFtPiL: JpmxFtPiL1pfemv, layoutId: "nRL2gSWud__f_sF1KS7T", style: { width: "100%" }, v0MNo3lPt: "03", variant: matchVariant("OyF4KUkoJ"), width: "100%", xY5a6paYG: "https://framer.link/fsd2pgh", ...addPropertyOverrides3({ BU646MiG6: { variant: matchVariant("eooIBL9BV") }, o9SepsxST: { variant: matchVariant("B0PmKTr2v") }, pN_9iGami: { variant: matchVariant("B0PmKTr2v") }, V5TLZUmSX: { variant: matchVariant("B0PmKTr2v") } }, baseVariant, gestureVariant) }) }) }) }), /* @__PURE__ */ _jsx4(Transition3, { value: transition11, children: /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 68, width: `calc(${componentViewport?.width || "100vw"} - 52px)`, y: (componentViewport?.y || 0) + 0 + 0 + 0 + 76 + 14 + 0 + 0 + 204, children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-zpycmq-container", layoutDependency, layoutId: "nRL2gSWud__HdGtBVyD7-container", nodeId: "HdGtBVyD7", rendersWithMotion: true, scopeId: "nRL2gSWud", style: { opacity: 1 }, variants: { BU646MiG6: { opacity: 1 }, IA9qV9pnv: { opacity: 0 }, o9SepsxST: { opacity: 1 }, pN_9iGami: { opacity: 1 }, V5TLZUmSX: { opacity: 1 } }, children: /* @__PURE__ */ _jsx4(UQBzRK35A_default, { EuStbsHep: true, height: "100%", hNNZPDRIP: "Pricing", id: "HdGtBVyD7", JpmxFtPiL: JpmxFtPiL12iy7ht, layoutId: "nRL2gSWud__HdGtBVyD7", style: { width: "100%" }, v0MNo3lPt: "04", variant: matchVariant("OyF4KUkoJ"), width: "100%", xY5a6paYG: "https://framer.link/fsd2pgh", ...addPropertyOverrides3({ BU646MiG6: { variant: matchVariant("B0PmKTr2v") }, o9SepsxST: { variant: matchVariant("eooIBL9BV") }, pN_9iGami: { variant: matchVariant("B0PmKTr2v") }, V5TLZUmSX: { variant: matchVariant("B0PmKTr2v") } }, baseVariant, gestureVariant) }) }) }) })] }), /* @__PURE__ */ _jsx4(Transition3, { value: transition122, children: /* @__PURE__ */ _jsxs2(motion4.div, { className: "framer-19a6iqm", "data-border": true, "data-framer-name": "Foot", layoutDependency, layoutId: "nRL2gSWud__KhbqbDQNz", style: { "--border-bottom-width": "0px", "--border-color": "rgba(17, 17, 17, 0.12)", "--border-left-width": "0px", "--border-right-width": "0px", "--border-style": "solid", "--border-top-width": "1px", opacity: 1 }, variants: { BU646MiG6: { opacity: 1 }, IA9qV9pnv: { opacity: 0 }, o9SepsxST: { opacity: 1 }, pN_9iGami: { opacity: 1 }, V5TLZUmSX: { opacity: 1 } }, children: [/* @__PURE__ */ _jsxs2(motion4.div, { className: "framer-hctmg4", "data-framer-name": "Status", layoutDependency, layoutId: "nRL2gSWud__oqh1HLYtY", children: [/* @__PURE__ */ _jsx4(MotionDivWithFX, { __framer__loop: animation1, __framer__loopEffectEnabled: true, __framer__loopPauseOffscreen: true, __framer__loopRepeatDelay: 0, __framer__loopRepeatType: "mirror", __framer__loopTransition: transition132, __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, className: "framer-k4hhfh", "data-framer-name": "Dot", layoutDependency, layoutId: "nRL2gSWud__gIxhlz6FD", style: { backgroundColor: "rgba(17, 17, 17, 0.55)", borderBottomLeftRadius: 999, borderBottomRightRadius: 999, borderTopLeftRadius: 999, borderTopRightRadius: 999 } }), /* @__PURE__ */ _jsx4(RichText3, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx4(React4.Fragment, { children: /* @__PURE__ */ _jsx4(motion4.p, { dir: "auto", style: { "--font-selector": "RlM7U3dpdHplci12YXJpYWJsZVZGPUluZG5hSFFpSURRd01BPT0=", "--framer-font-family": '"Switzer Variable", "Switzer Variable Placeholder", sans-serif', "--framer-font-size": "13px", "--framer-font-variation-axes": 'var(--extracted-2gg91v, "wght" 400)', "--framer-line-height": "1em", "--framer-text-color": "var(--extracted-r6o4lv, rgba(17, 17, 17, 0.45))" }, children: "10:37" }) }), className: "framer-1pxsvus", fonts: ["FS;Switzer-variable"], layoutDependency, layoutId: "nRL2gSWud__bMYXG_65w", style: { "--extracted-2gg91v": '"wght" 400', "--extracted-r6o4lv": "rgba(17, 17, 17, 0.45)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: eCSiaI1ym, verticalAlignment: "top", withExternalLayout: true })] }), /* @__PURE__ */ _jsxs2(motion4.div, { className: "framer-1p821an", "data-framer-name": "Social", layoutDependency, layoutId: "nRL2gSWud__TkFGLdOEa", children: [/* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 0 + 76 + 14 + 272 + 16 + 0, children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-qd90cs-container", layoutDependency, layoutId: "nRL2gSWud__YZKFSEG4U-container", nodeId: "YZKFSEG4U", rendersWithMotion: true, scopeId: "nRL2gSWud", children: /* @__PURE__ */ _jsx4(RckrNKeK3_default, { bozvEpqSe: "https://framer.link/fsd2pgh", height: "100%", id: "YZKFSEG4U", layoutId: "nRL2gSWud__YZKFSEG4U", nvCOfKBCN: true, STPnvkFnT: "Instagram", width: "100%" }) }) }), /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 0 + 76 + 14 + 272 + 16 + 0, children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-hv8q6s-container", layoutDependency, layoutId: "nRL2gSWud__kvNLzd4Bc-container", nodeId: "kvNLzd4Bc", rendersWithMotion: true, scopeId: "nRL2gSWud", children: /* @__PURE__ */ _jsx4(RckrNKeK3_default, { bozvEpqSe: "https://framer.link/fsd2pgh", height: "100%", id: "kvNLzd4Bc", layoutId: "nRL2gSWud__kvNLzd4Bc", nvCOfKBCN: true, STPnvkFnT: "X", width: "100%" }) }) }), /* @__PURE__ */ _jsx4(ComponentViewportProvider, { height: 29, y: (componentViewport?.y || 0) + 0 + 0 + 0 + 76 + 14 + 272 + 16 + 0, children: /* @__PURE__ */ _jsx4(SmartComponentScopedContainer, { className: "framer-wtxlqq-container", layoutDependency, layoutId: "nRL2gSWud__STWmeuCSh-container", nodeId: "STWmeuCSh", rendersWithMotion: true, scopeId: "nRL2gSWud", children: /* @__PURE__ */ _jsx4(RckrNKeK3_default, { bozvEpqSe: "https://framer.link/fsd2pgh", height: "100%", id: "STWmeuCSh", layoutId: "nRL2gSWud__STWmeuCSh", nvCOfKBCN: true, STPnvkFnT: "LinkedIn", width: "100%" }) }) })] })] }) })] }) }), /* @__PURE__ */ _jsx4(motion4.div, { className: "framer-l853jh", "data-framer-name": "Shine", layoutDependency, layoutId: "nRL2gSWud__nvR7iHxME", style: { background: "linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.9) 50%, rgba(255, 255, 255, 0) 100%)" } })] }) })] }) }) }) });
});
var css4 = [".framer-vMvkH.framer-m8ke51, .framer-vMvkH .framer-m8ke51 { display: block; }", ".framer-vMvkH.framer-5lj021 { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-vMvkH .framer-9n395a { flex: none; height: 3000px; left: calc(50% - 6000px / 2); pointer-events: none; position: absolute; top: -300px; width: 6000px; z-index: 0; }", ".framer-vMvkH .framer-5272c8 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; will-change: var(--framer-will-change-override, transform); z-index: 1; }", ".framer-vMvkH .framer-hfmrvc { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; padding: 18px 18px 18px 26px; position: relative; width: 100%; }", ".framer-vMvkH .framer-ed3ax7 { -webkit-user-select: none; flex: none; height: auto; position: relative; user-select: none; white-space: pre; width: auto; }", ".framer-vMvkH .framer-fzky62 { cursor: pointer; flex: none; gap: 0px; height: 40px; overflow: hidden; position: relative; width: 40px; will-change: var(--framer-will-change-effect-override, transform); }", ".framer-vMvkH .framer-h3gzx, .framer-vMvkH .framer-1jtqx2m { flex: none; height: 2px; left: 12px; position: absolute; top: 19px; width: 16px; }", ".framer-vMvkH .framer-1b4mohk { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; padding: 14px 26px 18px 26px; pointer-events: auto; position: relative; width: 100%; }", ".framer-vMvkH .framer-15596k5 { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-vMvkH .framer-quhqhc-container, .framer-vMvkH .framer-12af4zk-container, .framer-vMvkH .framer-44vy3h-container, .framer-vMvkH .framer-zpycmq-container { flex: none; height: auto; position: relative; width: 100%; }", ".framer-vMvkH .framer-19a6iqm { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; padding: 16px 0px 0px 0px; position: relative; width: 100%; }", ".framer-vMvkH .framer-hctmg4 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 9px; height: min-content; justify-content: flex-start; padding: 0px; position: relative; width: min-content; }", ".framer-vMvkH .framer-k4hhfh { flex: none; height: 6px; position: relative; width: 6px; }", ".framer-vMvkH .framer-1pxsvus { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-vMvkH .framer-1p821an { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: flex-start; padding: 0px; position: relative; width: min-content; }", ".framer-vMvkH .framer-qd90cs-container, .framer-vMvkH .framer-hv8q6s-container, .framer-vMvkH .framer-wtxlqq-container { flex: none; height: auto; position: relative; width: auto; }", ".framer-vMvkH .framer-l853jh { flex: none; height: 1px; left: 0px; pointer-events: none; position: absolute; right: 0px; top: 0px; z-index: 2; }", ".framer-vMvkH.framer-v-1gq5xxj .framer-5272c8 { height: 76px; }", ".framer-vMvkH.framer-v-1gq5xxj .framer-h3gzx { left: 11px; top: 17px; width: 18px; }", ".framer-vMvkH.framer-v-1gq5xxj .framer-1jtqx2m { left: 11px; top: 23px; width: 11px; }", ".framer-vMvkH.framer-v-1gq5xxj .framer-1b4mohk { pointer-events: none; }", '.framer-vMvkH[data-border="true"]::after, .framer-vMvkH [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FramernRL2gSWud = withCSS4(Component4, css4, "framer-vMvkH");
var nRL2gSWud_default = FramernRL2gSWud;
FramernRL2gSWud.displayName = "Blur Navigation";
FramernRL2gSWud.defaultProps = { height: 425, width: 460 };
addPropertyControls4(FramernRL2gSWud, { variant: { options: ["rIN1Kx5Og", "IA9qV9pnv", "pN_9iGami", "V5TLZUmSX", "BU646MiG6", "o9SepsxST"], optionTitles: ["Open", "Closed", "Open \u2014 Marketplace", "Open \u2014 Sellers", "Open \u2014 Editorial", "Open \u2014 Pricing"], title: "Variant", type: ControlType4.Enum }, AshYbHZRg: { title: "On Open", type: ControlType4.EventHandler }, NUPML5eQK: { title: "On Close", type: ControlType4.EventHandler }, eCSiaI1ym: { defaultValue: "10:37", displayTextArea: false, title: "Time", type: ControlType4.String }, oneCSiaI1ymChange: { changes: "eCSiaI1ym", type: ControlType4.ChangeHandler }, j1CDkm6Yi: { defaultValue: false, description: "Set to Yes so the background blur is active when the menu opens.", title: "Show Backdrop", type: ControlType4.Boolean }, onj1CDkm6YiChange: { changes: "j1CDkm6Yi", type: ControlType4.ChangeHandler }, TbpxG5_48: { defaultValue: "ARKTER", description: "Built by Matthias \xD6lschlegel \u{1F4AA}\n[Explore more components](https://framer.link/fsd2pgh)", displayTextArea: false, placeholder: "", title: "Logo Name", type: ControlType4.String }, onTbpxG5_48Change: { changes: "TbpxG5_48", type: ControlType4.ChangeHandler } });
var variationAxes3 = [{ defaultValue: 14, maxValue: 32, minValue: 14, name: "Optical size", tag: "opsz" }, { defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
var variationAxes1 = [{ defaultValue: 400, maxValue: 900, minValue: 100, name: "Weight", tag: "wght" }];
addFonts3(FramernRL2gSWud, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/mYcqTSergLb16PdbJJQMl9ebYm4.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/ZRl8AlxwsX1m7xS1eJCiSPbztg.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/nhSQpBRqFmXNUBY2p5SENQ8NplQ.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/DYHjxG0qXjopUuruoacfl5SA.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/s7NH6sl7w4NU984r5hcmo1tPSYo.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/7lw0VWkeXrGYJT05oB3DsFy8BaY.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Inter Variable", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/wx5nfqEgOXnxuFaxB0Mn9OhmcZA.woff2", variationAxes: variationAxes3, weight: "400" }, { cssFamilyName: "Switzer Variable", source: "fontshare", style: "normal", uiFamilyName: "Switzer", url: "https://framerusercontent.com/third-party-assets/fontshare/wf/HJHZ26OECMTXRH7JXPFC7EVIHDSLT2RA/LJRNLR7WCPF3PY3SZ7B2LHNUTQMFNCHL/4MCJYGQDIOOXHWSIIB2OYNDBEALJSOGN.woff2", variationAxes: variationAxes1, weight: "400" }] }, ...MenuLinkFonts, ...NavSocialFonts], { supportsExplicitInterCodegen: true });
FramernRL2gSWud.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader(UQBzRK35A_default, {}, context), forwardLoader(RckrNKeK3_default, {}, context)]);
} };
var __FramerMetadata__ = { "exports": { "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "default": { "type": "reactComponent", "name": "FramernRL2gSWud", "slots": [], "annotations": { "framerVariables": '{"AshYbHZRg":"onOpen","NUPML5eQK":"onClose","eCSiaI1ym":"time","j1CDkm6Yi":"showBackdrop","TbpxG5_48":"logoName"}', "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]},"IA9qV9pnv":{"layout":["fixed","auto"]},"pN_9iGami":{"layout":["fixed","auto"]},"V5TLZUmSX":{"layout":["fixed","auto"]},"BU646MiG6":{"layout":["fixed","auto"]},"o9SepsxST":{"layout":["fixed","auto"]}}}', "framerIntrinsicWidth": "460", "framerColorSyntax": "true", "framerIntrinsicHeight": "425", "framerContractVersion": "1", "framerComponentViewportWidth": "true", "framerDisplayContentsDiv": "false", "framerAutoSizeImages": "true", "framerImmutableVariables": "true" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  nRL2gSWud_default as default
};
