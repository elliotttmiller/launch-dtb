var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/3WRiMkHquBk2OsQmTbr6/c5rKhvRAWxFW6SOJUnqn/lSNB1eKsK.js
import { jsx as _jsx15, jsxs as _jsxs5, Fragment as _Fragment } from "react/jsx-runtime";
import { addFonts as addFonts6, ComponentViewportProvider as ComponentViewportProvider3, cx as cx15, Floating, forwardLoader as forwardLoader3, getFonts as getFonts3, Link as Link4, SmartComponentScopedContainer as SmartComponentScopedContainer3, SVG as SVG11, useActiveVariantCallback as useActiveVariantCallback2, useComponentViewport as useComponentViewport6, useLocaleInfo as useLocaleInfo6, useOverlayState, useVariantState as useVariantState6, withCSS as withCSS15 } from "./_framer-runtime.js";
import { AnimatePresence, LayoutGroup as LayoutGroup6, motion as motion15, MotionConfigContext as MotionConfigContext6 } from "framer-motion";
import * as React15 from "react";
import { useRef as useRef7 } from "react";

// http-url:https://framerusercontent.com/modules/XZPB87ph1vRzeqCdN9Zh/tMOxced9WIHWA0KBddR2/BlueJ5Iqo.js
import { jsx as _jsx7, jsxs as _jsxs2 } from "react/jsx-runtime";
import { addFonts as addFonts2, ComponentViewportProvider, cx as cx7, forwardLoader, getFonts, SmartComponentScopedContainer, useComponentViewport as useComponentViewport2, useLocaleInfo as useLocaleInfo2, useVariantState as useVariantState2, withCSS as withCSS7, withFX, withOptimizedAppearEffect } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup2, motion as motion7, MotionConfigContext as MotionConfigContext2 } from "framer-motion";
import * as React7 from "react";
import { useRef as useRef2 } from "react";

// http-url:https://framerusercontent.com/modules/dIG7XN9KAmImdjhERNf1/nLNsEBRnziRZ9V6ywacR/f40ONlxDn.js
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
var svg = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 16.5 6 L 16.5 0.75 C 16.5 0.336 16.164 0 15.75 0 L 0.75 0 C 0.336 0 0 0.336 0 0.75 L 0 6 C 0 15 8.25 17.25 8.25 17.25 C 8.25 17.25 16.5 15 16.5 6 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="17.25px" id="dnXAEWy2v" transform="translate(3.75 4.5)" width="16.5px"/><path d="M 16.5 6 L 16.5 0.75 C 16.5 0.336 16.164 0 15.75 0 L 0.75 0 C 0.336 0 0 0.336 0 0.75 L 0 6 C 0 15 8.25 17.25 8.25 17.25 C 8.25 17.25 16.5 15 16.5 6 Z" fill="transparent" height="17.25px" id="eVavSOlBM" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3.75 4.5)" width="16.5px"/><path d="M 0 3 L 2.25 5.25 L 7.5 0" fill="transparent" height="5.25px" id="xoBw5M0M6" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(8.25 9.75)" width="7.5px"/></svg>';
var getProps = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component = /* @__PURE__ */ React.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps(props);
  const href = useSVGTemplate("1430394497", svg);
  return /* @__PURE__ */ _jsx(SVG, { ...restProps, className: cx("framer-DK6PS", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx("use", { href }) });
});
var css = [`.framer-DK6PS { -webkit-mask: ${mask}; aspect-ratio: 1; display: block; mask: ${mask}; width: 24px; }`];
var Icon = withCSS(Component, css, "framer-DK6PS");
Icon.displayName = "Shield Check";
var f40ONlxDn_default = Icon;
addPropertyControls(Icon, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType.Number } });

// http-url:https://framerusercontent.com/modules/i7FytJYRCoPtaoTYeLg1/Aaus265UU8PihgRMgqCM/NpA4cFHvp.js
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
var svg2 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 5.909 11.341 C 5.031 12.22 3.606 12.22 2.727 11.341 L 0.659 9.273 C -0.22 8.394 -0.22 6.97 0.659 6.091 L 6.091 0.659 C 6.97 -0.22 8.394 -0.22 9.273 0.659 L 11.341 2.727 C 12.22 3.606 12.22 5.031 11.341 5.909 Z" fill="transparent" height="12.000193239698056px" id="VrH06YzEx" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(6 6)" width="12.000193239698056px"/><path d="M 0 0 L 7.5 7.5" fill="transparent" height="7.5px" id="QEuVL0QRQ" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(8.25 8.25)" width="7.5px"/><path d="M 5.443 0 L 0 5.443" fill="transparent" height="5.443125000000002px" id="I00KS1d4V" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(16.307 2.25)" width="5.443125000000009px"/><path d="M 5.443 0 L 0 5.443" fill="transparent" height="5.443125000000009px" id="d3T4qa9GH" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(2.25 16.307)" width="5.443125000000002px"/><path d="M 0 0 L 0.75 1.875" fill="transparent" height="1.875px" id="YixFxfS8c" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(9 3)" width="1px"/><path d="M 0 0 L 1.875 0.75" fill="transparent" height="1px" id="Zx6L2lBFZ" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3 9)" width="1.875px"/><path d="M 0 0 L 1.875 0.75" fill="transparent" height="1px" id="LrjL3dPDI" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(19.125 14.25)" width="1.875px"/><path d="M 0 0 L 0.75 1.875" fill="transparent" height="1.875px" id="ok_cH7gR6" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(14.25 19.125)" width="1px"/></svg>';
var getProps2 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component2 = /* @__PURE__ */ React2.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps2(props);
  const href = useSVGTemplate2("1312851439", svg2);
  return /* @__PURE__ */ _jsx2(SVG2, { ...restProps, className: cx2("framer-VME8T", className), layoutId, ref, role: "presentation", style: { "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx2("use", { href }) });
});
var css2 = [`.framer-VME8T { -webkit-mask: ${mask2}; aspect-ratio: 1; display: block; mask: ${mask2}; width: 24px; }`];
var Icon2 = withCSS2(Component2, css2, "framer-VME8T");
Icon2.displayName = "Plugs Connected";
var NpA4cFHvp_default = Icon2;
addPropertyControls2(Icon2, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType2.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType2.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: true, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType2.Number } });

// http-url:https://framerusercontent.com/modules/q6AdYuVdn7nqnxRYPtBb/OYrLlDFAClRhsX9vzOMl/bDZjksbCJ.js
import { jsx as _jsx3 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls3, ControlType as ControlType3, cx as cx3, motion as motion3, useSVGTemplate as useSVGTemplate3, withCSS as withCSS3 } from "./_framer-runtime.js";
import * as React3 from "react";
import { forwardRef as forwardRef6 } from "react";
var mask3 = "var(--framer-icon-mask)";
var Base3 = /* @__PURE__ */ forwardRef6(function(props, ref) {
  return /* @__PURE__ */ _jsx3("svg", { ...props, ref, children: props.children });
});
var MotionSVG3 = motion3.create(Base3);
var SVG3 = /* @__PURE__ */ forwardRef6((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx3(MotionSVG3, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx3("svg", { ...rest, ref, children });
});
var svg3 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L 16.5 0 C 17.328 0 18 0.672 18 1.5 L 18 15 L 18 15 L 0 15 L 0 15 L 0 0 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="15px" id="p1fpTQK7F" transform="translate(3 4.5)" width="18px"/><path d="M 18 15 L 0 15 L 0 0" fill="transparent" height="15px" id="LOKQVnF_E" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3 4.5)" width="18px"/><path d="M 15.75 0 L 9 6.75 L 6 3.75 L 0 9.75" fill="transparent" height="9.75px" id="YJGYU62So" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3 6.75)" width="15.75px"/><path d="M 3.75 3.75 L 3.75 0 L 0 0" fill="transparent" height="3.75px" id="LN0V1ajm1" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(15 6.75)" width="3.75px"/></svg>';
var getProps3 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component3 = /* @__PURE__ */ React3.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps3(props);
  const href = useSVGTemplate3("987190984", svg3);
  return /* @__PURE__ */ _jsx3(SVG3, { ...restProps, className: cx3("framer-DkID7", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx3("use", { href }) });
});
var css3 = [`.framer-DkID7 { -webkit-mask: ${mask3}; aspect-ratio: 1; display: block; mask: ${mask3}; width: 24px; }`];
var Icon3 = withCSS3(Component3, css3, "framer-DkID7");
Icon3.displayName = "Chart Line Up";
var bDZjksbCJ_default = Icon3;
addPropertyControls3(Icon3, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType3.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType3.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType3.Number } });

// http-url:https://framerusercontent.com/modules/smOnX6lSe51znTkuEiB9/HXIn4qV0zyNoXYDNOWxJ/EUx6SozYk.js
import { jsx as _jsx4 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls4, ControlType as ControlType4, cx as cx4, motion as motion4, useSVGTemplate as useSVGTemplate4, withCSS as withCSS4 } from "./_framer-runtime.js";
import * as React4 from "react";
import { forwardRef as forwardRef8 } from "react";
var mask4 = "var(--framer-icon-mask)";
var Base4 = /* @__PURE__ */ forwardRef8(function(props, ref) {
  return /* @__PURE__ */ _jsx4("svg", { ...props, ref, children: props.children });
});
var MotionSVG4 = motion4.create(Base4);
var SVG4 = /* @__PURE__ */ forwardRef8((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx4(MotionSVG4, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx4("svg", { ...rest, ref, children });
});
var svg4 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 0 9 C 0 4.029 4.029 0 9 0 C 13.971 0 18 4.029 18 9 C 18 13.971 13.971 18 9 18 C 4.029 18 0 13.971 0 9 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="18px" id="zw8C7iwC3" transform="translate(3 3)" width="18px"/><path d="M 0 9 C 0 4.029 4.029 0 9 0 C 13.971 0 18 4.029 18 9 C 18 13.971 13.971 18 9 18 C 4.029 18 0 13.971 0 9 Z" fill="transparent" height="18px" id="dmUDB14V1" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3 3)" width="18px"/><path d="M 0 0 L 3.75 3.75 L 0 7.5" fill="transparent" height="7.5px" id="StMbQcFIN" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(10.5 8.25)" width="3.75px"/></svg>';
var getProps4 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component4 = /* @__PURE__ */ React4.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps4(props);
  const href = useSVGTemplate4("1191703857", svg4);
  return /* @__PURE__ */ _jsx4(SVG4, { ...restProps, className: cx4("framer-bo8Op", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx4("use", { href }) });
});
var css4 = [`.framer-bo8Op { -webkit-mask: ${mask4}; aspect-ratio: 1; display: block; mask: ${mask4}; width: 24px; }`];
var Icon4 = withCSS4(Component4, css4, "framer-bo8Op");
Icon4.displayName = "Caret Circle Right";
var EUx6SozYk_default = Icon4;
addPropertyControls4(Icon4, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType4.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType4.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType4.Number } });

// http-url:https://framerusercontent.com/modules/Z3SvZ0jTKaMZmlhJRmcE/mkaBUKIOEu7xMwHKV3w4/O8tBtOdoQ.js
import { jsx as _jsx5 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls5, ControlType as ControlType5, cx as cx5, motion as motion5, useSVGTemplate as useSVGTemplate5, withCSS as withCSS5 } from "./_framer-runtime.js";
import * as React5 from "react";
import { forwardRef as forwardRef10 } from "react";
var mask5 = "var(--framer-icon-mask)";
var Base5 = /* @__PURE__ */ forwardRef10(function(props, ref) {
  return /* @__PURE__ */ _jsx5("svg", { ...props, ref, children: props.children });
});
var MotionSVG5 = motion5.create(Base5);
var SVG5 = /* @__PURE__ */ forwardRef10((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx5(MotionSVG5, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx5("svg", { ...rest, ref, children });
});
var svg5 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 9 4.89 L 9 14.538 C 8.874 14.537 8.75 14.505 8.64 14.444 L 0.39 9.929 C 0.15 9.798 0.001 9.546 0 9.273 L 0 0.307 C 0 0.201 0.022 0.096 0.066 0 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="14.537812500000001px" id="o9ypHGnGn" transform="translate(3 7.212)" width="9px"/><path d="M 0 0 L 8.934 4.89 L 17.869 0" fill="transparent" height="4.890000000000001px" id="LzV3sO6UL" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3.066 7.211)" width="17.868750000000002px"/><path d="M 9.36 0.092 L 17.61 4.609 C 17.85 4.74 17.999 4.992 18 5.265 L 18 14.231 C 17.999 14.505 17.85 14.756 17.61 14.888 L 9.36 19.405 C 9.136 19.527 8.864 19.527 8.64 19.405 L 0.39 14.888 C 0.15 14.756 0.001 14.505 0 14.231 L 0 5.265 C 0.001 4.992 0.15 4.74 0.39 4.609 L 8.64 0.092 C 8.864 -0.031 9.136 -0.031 9.36 0.092 Z" fill="transparent" height="19.49659726803232px" id="vvoCjHKQ0" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3 2.252)" width="18px"/><path d="M 0 0 L 0 9.648" fill="transparent" height="9.6478125px" id="xWcSfrjmH" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(12 12.102)" width="1px"/></svg>';
var getProps5 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component5 = /* @__PURE__ */ React5.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps5(props);
  const href = useSVGTemplate5("3494739676", svg5);
  return /* @__PURE__ */ _jsx5(SVG5, { ...restProps, className: cx5("framer-p3lRU", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx5("use", { href }) });
});
var css5 = [`.framer-p3lRU { -webkit-mask: ${mask5}; aspect-ratio: 1; display: block; mask: ${mask5}; width: 24px; }`];
var Icon5 = withCSS5(Component5, css5, "framer-p3lRU");
Icon5.displayName = "Cube";
var O8tBtOdoQ_default = Icon5;
addPropertyControls5(Icon5, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType5.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType5.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType5.Number } });

// http-url:https://framerusercontent.com/modules/F054iThrAoInQY1H9O4S/IcvCtqeFbIukTrdgFp9a/L6DNiaEnk.js
import { jsx as _jsx6, jsxs as _jsxs } from "react/jsx-runtime";
import { addFonts, addPropertyControls as addPropertyControls6, ControlType as ControlType6, cx as cx6, Instance, Link, RichText, useComponentViewport, useLocaleInfo, useVariantState, withCSS as withCSS6 } from "./_framer-runtime.js";
import { LayoutGroup, motion as motion6, MotionConfigContext } from "framer-motion";
import * as React6 from "react";
import { useRef } from "react";
var enabledGestures = { CpGGGh2Jv: { hover: true }, eRxYth9g1: { hover: true } };
var cycleOrder = ["eRxYth9g1", "CpGGGh2Jv"];
var serializationHash = "framer-mUJsl";
var variantClassNames = { CpGGGh2Jv: "framer-v-17wwwm", eRxYth9g1: "framer-v-1676l0h" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var isSet = (value) => {
  if (Array.isArray(value))
    return value.length > 0;
  return value !== void 0 && value !== null && value !== "";
};
var Transition = ({ value, children }) => {
  const config = React6.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React6.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx6(MotionConfigContext.Provider, { value: contextValue, children });
};
var humanReadableVariantMap = { Default: "eRxYth9g1", Small: "CpGGGh2Jv" };
var Variants = motion6.create(React6.Fragment);
var getProps6 = ({ badgeText, description, height, icon, id, link, newTab, smoothScroll, title, width, ...props }) => {
  return { ...props, EuCQWp3TU: smoothScroll ?? props.EuCQWp3TU, L2DDfU8sP: newTab ?? props.L2DDfU8sP, nKXElAIlG: title ?? props.nKXElAIlG ?? "Title", Qwq1QMbxB: description ?? props.Qwq1QMbxB ?? "Description", tg6u3jl0R: icon ?? props.tg6u3jl0R ?? O8tBtOdoQ_default, ukadVc3D1: badgeText ?? props.ukadVc3D1, variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "eRxYth9g1", ZKAkDHy0S: link ?? props.ZKAkDHy0S };
};
var createLayoutDependency = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component6 = /* @__PURE__ */ React6.forwardRef(function(props, ref) {
  const fallbackRef = useRef(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React6.useId();
  const { activeLocale, setLocale } = useLocaleInfo();
  const componentViewport = useComponentViewport();
  const { style, className, layoutId, variant, nKXElAIlG, Qwq1QMbxB, tg6u3jl0R, ukadVc3D1, ZKAkDHy0S, L2DDfU8sP, EuCQWp3TU, ...restProps } = getProps6(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ cycleOrder, defaultVariant: "eRxYth9g1", enabledGestures, ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx6(serializationHash, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (gestureVariant === "CpGGGh2Jv-hover")
      return false;
    if (baseVariant === "CpGGGh2Jv")
      return false;
    return true;
  };
  const visible = isSet(ukadVc3D1);
  return /* @__PURE__ */ _jsx6(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx6(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx6(Transition, { value: transition1, children: /* @__PURE__ */ _jsx6(Link, { href: ZKAkDHy0S, motionChild: true, nodeId: "eRxYth9g1", openInNewTab: L2DDfU8sP, scopeId: "L6DNiaEnk", smoothScroll: EuCQWp3TU, children: /* @__PURE__ */ _jsxs(motion6.a, { ...restProps, ...gestureHandlers, className: `${cx6(scopingClassNames, "framer-1676l0h", className, classNames)} framer-1ld6elg`, "data-framer-name": "Default", layoutDependency, layoutId: "lSNB1eKsK__eRxYth9g1", ref: refBinding, style: { backgroundColor: "rgba(255, 255, 255, 0)", borderBottomLeftRadius: 2, borderBottomRightRadius: 2, borderTopLeftRadius: 2, borderTopRightRadius: 2, ...style }, variants: { "CpGGGh2Jv-hover": { backgroundColor: "rgba(255, 255, 255, 0.05)" }, "eRxYth9g1-hover": { backgroundColor: "rgba(255, 255, 255, 0.05)" } }, ...addPropertyOverrides({ "CpGGGh2Jv-hover": { "data-framer-name": void 0 }, "eRxYth9g1-hover": { "data-framer-name": void 0 }, CpGGGh2Jv: { "data-framer-name": "Small" } }, baseVariant, gestureVariant), children: [isDisplayed() && /* @__PURE__ */ _jsx6(motion6.div, { className: "framer-1sroi76", "data-framer-name": "Icon", layoutDependency, layoutId: "lSNB1eKsK__FQ9jZ3p_I", children: /* @__PURE__ */ _jsx6(Instance, { animated: true, className: "framer-9nbvm4", Component: tg6u3jl0R, layoutDependency, layoutId: "lSNB1eKsK__HdlI15A1u", style: { "--1m6trwb": 0, "--21h8s6": "rgb(255, 255, 255)", "--pgex8v": 1.5 }, variants: { "eRxYth9g1-hover": { "--21h8s6": "rgb(255, 253, 125)" } } }) }), /* @__PURE__ */ _jsxs(motion6.div, { className: "framer-1j6zg7v", "data-framer-name": "Text", layoutDependency, layoutId: "lSNB1eKsK__DiPfWtF6H", children: [/* @__PURE__ */ _jsxs(motion6.div, { className: "framer-1n6l6vk", "data-framer-name": "Top", layoutDependency, layoutId: "lSNB1eKsK__OD1tlpJLG", children: [/* @__PURE__ */ _jsx6(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx6(React6.Fragment, { children: /* @__PURE__ */ _jsx6(motion6.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtcmVndWxhcg==", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(255, 255, 255))" }, children: "Platform" }) }), className: "framer-2hqoy4", fonts: ["GF;Geist-regular"], layoutDependency, layoutId: "lSNB1eKsK__z5oh3fXVH", style: { "--extracted-r6o4lv": "rgb(255, 255, 255)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: nKXElAIlG, variants: { "CpGGGh2Jv-hover": { "--extracted-r6o4lv": "rgb(255, 253, 125)" }, "eRxYth9g1-hover": { "--extracted-r6o4lv": "rgb(255, 253, 125)" } }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides({ "CpGGGh2Jv-hover": { children: /* @__PURE__ */ _jsx6(React6.Fragment, { children: /* @__PURE__ */ _jsx6(motion6.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtcmVndWxhcg==", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(255, 253, 125))" }, children: "Title" }) }) }, "eRxYth9g1-hover": { children: /* @__PURE__ */ _jsx6(React6.Fragment, { children: /* @__PURE__ */ _jsx6(motion6.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtcmVndWxhcg==", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(255, 253, 125))" }, children: "Title" }) }) } }, baseVariant, gestureVariant) }), visible !== false && /* @__PURE__ */ _jsx6(motion6.div, { className: "framer-12gcuau", "data-framer-name": "Badge", layoutDependency, layoutId: "lSNB1eKsK__iwQiJj6LC", style: { backgroundColor: "rgba(255, 253, 125, 0.1)", borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }, children: /* @__PURE__ */ _jsx6(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx6(React6.Fragment, { children: /* @__PURE__ */ _jsx6(motion6.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtcmVndWxhcg==", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-size": "10px", "--framer-text-color": "var(--extracted-r6o4lv, rgb(255, 253, 125))" }, children: "Popular" }) }), className: "framer-1w7u65q", fonts: ["GF;Geist-regular"], layoutDependency, layoutId: "lSNB1eKsK__qaOxUD7LS", style: { "--extracted-r6o4lv": "rgb(255, 253, 125)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: ukadVc3D1, verticalAlignment: "top", withExternalLayout: true }) })] }), isDisplayed() && /* @__PURE__ */ _jsx6(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx6(React6.Fragment, { children: /* @__PURE__ */ _jsx6(motion6.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtcmVndWxhcg==", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(158, 158, 158))" }, children: "Description" }) }), className: "framer-18io96r", fonts: ["GF;Geist-regular"], layoutDependency, layoutId: "lSNB1eKsK__mkg3eBnQU", style: { "--extracted-r6o4lv": "rgb(158, 158, 158)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: Qwq1QMbxB, verticalAlignment: "top", withExternalLayout: true })] })] }) }) }) }) });
});
var css6 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-mUJsl.framer-1ld6elg, .framer-mUJsl .framer-1ld6elg { display: block; }", ".framer-mUJsl.framer-1676l0h { align-content: flex-start; align-items: flex-start; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 12px; height: min-content; justify-content: flex-start; overflow: visible; padding: 12px; position: relative; text-decoration: none; width: 310px; }", ".framer-mUJsl .framer-1sroi76 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: min-content; }", ".framer-mUJsl .framer-9nbvm4 { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 18px); position: relative; width: 18px; }", ".framer-mUJsl .framer-1j6zg7v { align-content: flex-start; align-items: flex-start; display: flex; flex: 1 0 0px; flex-direction: column; flex-wrap: nowrap; gap: 4px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 1px; }", ".framer-mUJsl .framer-1n6l6vk { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 8px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-mUJsl .framer-2hqoy4, .framer-mUJsl .framer-1w7u65q { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-mUJsl .framer-12gcuau { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 2px 6px 2px 6px; position: relative; width: min-content; }", ".framer-mUJsl .framer-18io96r { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; }", ".framer-mUJsl.framer-v-17wwwm.framer-1676l0h { align-content: center; align-items: center; }"];
var FramerL6DNiaEnk = withCSS6(Component6, css6, "framer-mUJsl");
var L6DNiaEnk_default = FramerL6DNiaEnk;
FramerL6DNiaEnk.displayName = "Menu Item";
FramerL6DNiaEnk.defaultProps = { height: 61.5, width: 310 };
addPropertyControls6(FramerL6DNiaEnk, { variant: { options: ["eRxYth9g1", "CpGGGh2Jv"], optionTitles: ["Default", "Small"], title: "Variant", type: ControlType6.Enum }, nKXElAIlG: { defaultValue: "Title", displayTextArea: false, title: "Title", type: ControlType6.String }, onnKXElAIlGChange: { changes: "nKXElAIlG", type: ControlType6.ChangeHandler }, Qwq1QMbxB: { defaultValue: "Description", displayTextArea: false, title: "Description", type: ControlType6.String }, onQwq1QMbxBChange: { changes: "Qwq1QMbxB", type: ControlType6.ChangeHandler }, tg6u3jl0R: { defaultValue: { identifier: "module:Z3SvZ0jTKaMZmlhJRmcE/mkaBUKIOEu7xMwHKV3w4/O8tBtOdoQ.js:default", moduleId: "Z3SvZ0jTKaMZmlhJRmcE" }, setModuleId: "omX0gWFPqDwhaiWwf6ab", title: "Icon", type: ControlType6.VectorSetItem }, ukadVc3D1: { displayTextArea: false, optional: true, placeholder: "Badge", title: "Badge Text", type: ControlType6.String }, onukadVc3D1Change: { changes: "ukadVc3D1", type: ControlType6.ChangeHandler }, ZKAkDHy0S: { title: "Link", type: ControlType6.Link }, L2DDfU8sP: { defaultValue: false, title: "New Tab", type: ControlType6.Boolean }, onL2DDfU8sPChange: { changes: "L2DDfU8sP", type: ControlType6.ChangeHandler }, EuCQWp3TU: { defaultValue: false, title: "Smooth Scroll", type: ControlType6.Boolean }, onEuCQWp3TUChange: { changes: "EuCQWp3TU", type: ControlType6.ChangeHandler } });
addFonts(FramerL6DNiaEnk, [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", openType: true, source: "google", style: "normal", uiFamilyName: "Geist", url: "https://fonts.gstatic.com/s/geist/v5/gyBhhwUxId8gMGYQMKR3pzfaWI_RnOM4mJPby1QNtA.woff2", weight: "400" }] }], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/XZPB87ph1vRzeqCdN9Zh/tMOxced9WIHWA0KBddR2/BlueJ5Iqo.js
var MenuItemFonts = getFonts(L6DNiaEnk_default);
var SmartComponentScopedContainerWithFXWithOptimizedAppearEffect = withOptimizedAppearEffect(withFX(SmartComponentScopedContainer));
var MotionDivWithFXWithOptimizedAppearEffect = withOptimizedAppearEffect(withFX(motion7.div));
var serializationHash2 = "framer-IwCBk";
var variantClassNames2 = { JyfBmEK3F: "framer-v-10gss0d" };
var transition12 = { delay: 0, duration: 0.6, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition12, x: 0, y: 0 };
var animation1 = { opacity: 1e-3, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, x: 0, y: 0 };
var transition2 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var transition3 = { delay: 0, duration: 0.8, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation2 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition3, x: 0, y: 0 };
var matchVariant = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var transition4 = { delay: 0.1, duration: 0.8, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation3 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition4, x: 0, y: 0 };
var transition5 = { delay: 0.2, duration: 0.8, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation4 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition5, x: 0, y: 0 };
var transition6 = { delay: 0.3, duration: 0.8, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation5 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition6, x: 0, y: 0 };
var transition7 = { delay: 0.4, duration: 0.8, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation6 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition7, x: 0, y: 0 };
var Transition2 = ({ value, children }) => {
  const config = React7.useContext(MotionConfigContext2);
  const transition = value ?? config.transition;
  const contextValue = React7.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx7(MotionConfigContext2.Provider, { value: contextValue, children });
};
var Variants2 = motion7.create(React7.Fragment);
var getProps7 = ({ height, id, width, ...props }) => {
  return { ...props };
};
var createLayoutDependency2 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component7 = /* @__PURE__ */ React7.forwardRef(function(props, ref) {
  const fallbackRef = useRef2(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React7.useId();
  const { activeLocale, setLocale } = useLocaleInfo2();
  const componentViewport = useComponentViewport2();
  const { style, className, layoutId, variant, ...restProps } = getProps7(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState2({ defaultVariant: "JyfBmEK3F", ref: refBinding, variant, variantClassNames: variantClassNames2 });
  const layoutDependency = createLayoutDependency2(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx7(serializationHash2, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx7(LayoutGroup2, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx7(Variants2, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx7(Transition2, { value: transition2, children: /* @__PURE__ */ _jsxs2(MotionDivWithFXWithOptimizedAppearEffect, { ...restProps, ...gestureHandlers, __framer__presenceAnimate: animation, __framer__presenceInitial: animation1, __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, className: cx7(scopingClassNames, "framer-10gss0d", className, classNames), "data-border": true, "data-framer-appear-id": "10gss0d", "data-framer-name": "Default", layoutDependency, layoutId: "lSNB1eKsK__JyfBmEK3F", optimized: true, ref: refBinding, style: { "--border-bottom-width": "1px", "--border-color": "rgba(255, 255, 255, 0.06)", "--border-left-width": "1px", "--border-right-width": "1px", "--border-style": "solid", "--border-top-width": "1px", background: "radial-gradient(100% 100% at 99.2% 0%, rgb(50, 50, 52) 0%, rgb(37, 37, 39) 100%)", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4, ...style }, children: [/* @__PURE__ */ _jsxs2(motion7.div, { className: "framer-1blpp6", "data-framer-name": "Menu Items", layoutDependency, layoutId: "lSNB1eKsK__NoiF2wEq1", children: [/* @__PURE__ */ _jsx7(ComponentViewportProvider, { height: 62, width: "310px", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 312) - 0 - 335) / 2 + 0 + 0) + 6 + 0, children: /* @__PURE__ */ _jsx7(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation2, className: "framer-1hwdszc-container", "data-framer-appear-id": "1hwdszc", initial: animation1, layoutDependency, layoutId: "lSNB1eKsK__T1ULjH66M-container", nodeId: "T1ULjH66M", optimized: true, rendersWithMotion: true, scopeId: "BlueJ5Iqo", children: /* @__PURE__ */ _jsx7(L6DNiaEnk_default, { EuCQWp3TU: false, height: "100%", id: "T1ULjH66M", L2DDfU8sP: true, layoutId: "lSNB1eKsK__T1ULjH66M", nKXElAIlG: "Platform", Qwq1QMbxB: "Build and scale your infrastructure", style: { width: "100%" }, tg6u3jl0R: O8tBtOdoQ_default, ukadVc3D1: "Popular", variant: matchVariant("eRxYth9g1"), width: "100%", ZKAkDHy0S: "https://framer.link/val-casanova" }) }) }), /* @__PURE__ */ _jsx7(ComponentViewportProvider, { height: 62, width: "310px", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 312) - 0 - 335) / 2 + 0 + 0) + 6 + 62, children: /* @__PURE__ */ _jsx7(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation3, className: "framer-1st57k9-container", "data-framer-appear-id": "1st57k9", initial: animation1, layoutDependency, layoutId: "lSNB1eKsK__NvB579in6-container", nodeId: "NvB579in6", optimized: true, rendersWithMotion: true, scopeId: "BlueJ5Iqo", children: /* @__PURE__ */ _jsx7(L6DNiaEnk_default, { EuCQWp3TU: false, height: "100%", id: "NvB579in6", L2DDfU8sP: true, layoutId: "lSNB1eKsK__NvB579in6", nKXElAIlG: "API", Qwq1QMbxB: "Integrate with a single endpoint", style: { width: "100%" }, tg6u3jl0R: NpA4cFHvp_default, variant: matchVariant("eRxYth9g1"), width: "100%", ZKAkDHy0S: "https://framer.link/val-casanova" }) }) }), /* @__PURE__ */ _jsx7(ComponentViewportProvider, { height: 62, width: "310px", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 312) - 0 - 335) / 2 + 0 + 0) + 6 + 124, children: /* @__PURE__ */ _jsx7(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation4, className: "framer-ggbg44-container", "data-framer-appear-id": "ggbg44", initial: animation1, layoutDependency, layoutId: "lSNB1eKsK__e_uU4qA7N-container", nodeId: "e_uU4qA7N", optimized: true, rendersWithMotion: true, scopeId: "BlueJ5Iqo", children: /* @__PURE__ */ _jsx7(L6DNiaEnk_default, { EuCQWp3TU: false, height: "100%", id: "e_uU4qA7N", L2DDfU8sP: true, layoutId: "lSNB1eKsK__e_uU4qA7N", nKXElAIlG: "Analytics", Qwq1QMbxB: "Real-time metrics and usage insights", style: { width: "100%" }, tg6u3jl0R: bDZjksbCJ_default, variant: matchVariant("eRxYth9g1"), width: "100%", ZKAkDHy0S: "https://framer.link/val-casanova" }) }) }), /* @__PURE__ */ _jsx7(ComponentViewportProvider, { height: 62, width: "310px", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 312) - 0 - 335) / 2 + 0 + 0) + 6 + 186, children: /* @__PURE__ */ _jsx7(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation5, className: "framer-11dgz4b-container", "data-framer-appear-id": "11dgz4b", initial: animation1, layoutDependency, layoutId: "lSNB1eKsK__SqVZvpy4B-container", nodeId: "SqVZvpy4B", optimized: true, rendersWithMotion: true, scopeId: "BlueJ5Iqo", children: /* @__PURE__ */ _jsx7(L6DNiaEnk_default, { EuCQWp3TU: false, height: "100%", id: "SqVZvpy4B", L2DDfU8sP: true, layoutId: "lSNB1eKsK__SqVZvpy4B", nKXElAIlG: "Security", Qwq1QMbxB: "Enterprise-grade access control", style: { width: "100%" }, tg6u3jl0R: f40ONlxDn_default, variant: matchVariant("eRxYth9g1"), width: "100%", ZKAkDHy0S: "https://framer.link/val-casanova" }) }) })] }), /* @__PURE__ */ _jsx7(motion7.div, { className: "framer-1h9uxre", "data-framer-name": "Line", layoutDependency, layoutId: "lSNB1eKsK__KwZh2QxTy", style: { backgroundColor: "rgba(255, 255, 255, 0.04)" } }), /* @__PURE__ */ _jsx7(motion7.div, { className: "framer-sbyxnk", "data-framer-name": "CTA", layoutDependency, layoutId: "lSNB1eKsK__hdOipqAav", children: /* @__PURE__ */ _jsx7(ComponentViewportProvider, { height: 62, width: "310px", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 312) - 0 - 335) / 2 + 261 + 0) + 6 + 0, children: /* @__PURE__ */ _jsx7(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation6, className: "framer-um8604-container", "data-framer-appear-id": "um8604", initial: animation1, layoutDependency, layoutId: "lSNB1eKsK__wOPE4_8np-container", nodeId: "wOPE4_8np", optimized: true, rendersWithMotion: true, scopeId: "BlueJ5Iqo", children: /* @__PURE__ */ _jsx7(L6DNiaEnk_default, { EuCQWp3TU: false, height: "100%", id: "wOPE4_8np", L2DDfU8sP: true, layoutId: "lSNB1eKsK__wOPE4_8np", nKXElAIlG: "Explore all products", Qwq1QMbxB: "Enterprise-grade access control", style: { width: "100%" }, tg6u3jl0R: EUx6SozYk_default, variant: matchVariant("CpGGGh2Jv"), width: "100%", ZKAkDHy0S: "https://framer.link/val-casanova" }) }) }) })] }) }) }) });
});
var css7 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-IwCBk.framer-1d01m18, .framer-IwCBk .framer-1d01m18 { display: block; }", ".framer-IwCBk.framer-10gss0d { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: min-content; will-change: var(--framer-will-change-override, transform); }", ".framer-IwCBk .framer-1blpp6, .framer-IwCBk .framer-sbyxnk { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: center; overflow: visible; padding: 6px; position: relative; width: min-content; }", ".framer-IwCBk .framer-1hwdszc-container, .framer-IwCBk .framer-1st57k9-container, .framer-IwCBk .framer-ggbg44-container, .framer-IwCBk .framer-11dgz4b-container, .framer-IwCBk .framer-um8604-container { flex: none; height: auto; position: relative; width: 310px; }", ".framer-IwCBk .framer-1h9uxre { align-self: stretch; flex: none; height: 1px; overflow: var(--overflow-clip-fallback, clip); position: relative; width: auto; }", '.framer-IwCBk[data-border="true"]::after, .framer-IwCBk [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FramerBlueJ5Iqo = withCSS7(Component7, css7, "framer-IwCBk");
var BlueJ5Iqo_default = FramerBlueJ5Iqo;
FramerBlueJ5Iqo.displayName = "Products Dropdown";
FramerBlueJ5Iqo.defaultProps = { height: 312, width: 322 };
addFonts2(FramerBlueJ5Iqo, [{ explicitInter: true, fonts: [] }, ...MenuItemFonts], { supportsExplicitInterCodegen: true });
FramerBlueJ5Iqo.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader(L6DNiaEnk_default, {}, context)]);
} };

// http-url:https://framerusercontent.com/modules/1QmwogBk7ZMOd48pEYIA/ddKXri6nmQl3ua5q1i99/k2Tdu6hoT.js
import { jsx as _jsx8 } from "react/jsx-runtime";
import { addFonts as addFonts3, addPropertyControls as addPropertyControls7, ControlType as ControlType7, cx as cx8, Link as Link2, RichText as RichText2, useComponentViewport as useComponentViewport3, useLocaleInfo as useLocaleInfo3, useVariantState as useVariantState3, withCSS as withCSS8 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup3, motion as motion8, MotionConfigContext as MotionConfigContext3 } from "framer-motion";
import * as React8 from "react";
import { useRef as useRef3 } from "react";
var enabledGestures2 = { dIxDHbLeh: { hover: true } };
var serializationHash3 = "framer-Z9mKs";
var variantClassNames3 = { dIxDHbLeh: "framer-v-18eaosy" };
function addPropertyOverrides2(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition13 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition3 = ({ value, children }) => {
  const config = React8.useContext(MotionConfigContext3);
  const transition = value ?? config.transition;
  const contextValue = React8.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx8(MotionConfigContext3.Provider, { value: contextValue, children });
};
var Variants3 = motion8.create(React8.Fragment);
var getProps8 = ({ height, id, link, newTab, smoothScroll, text, width, ...props }) => {
  return { ...props, d_FuDun9g: link ?? props.d_FuDun9g, SbnDmc0Ms: text ?? props.SbnDmc0Ms ?? "Nav Item", ULJGTSS6d: newTab ?? props.ULJGTSS6d, XTagc2kEU: smoothScroll ?? props.XTagc2kEU };
};
var createLayoutDependency3 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component8 = /* @__PURE__ */ React8.forwardRef(function(props, ref) {
  const fallbackRef = useRef3(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React8.useId();
  const { activeLocale, setLocale } = useLocaleInfo3();
  const componentViewport = useComponentViewport3();
  const { style, className, layoutId, variant, SbnDmc0Ms, d_FuDun9g, ULJGTSS6d, XTagc2kEU, ...restProps } = getProps8(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState3({ defaultVariant: "dIxDHbLeh", enabledGestures: enabledGestures2, ref: refBinding, variant, variantClassNames: variantClassNames3 });
  const layoutDependency = createLayoutDependency3(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx8(serializationHash3, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx8(LayoutGroup3, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx8(Variants3, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx8(Transition3, { value: transition13, children: /* @__PURE__ */ _jsx8(Link2, { href: d_FuDun9g, motionChild: true, nodeId: "dIxDHbLeh", openInNewTab: ULJGTSS6d, scopeId: "k2Tdu6hoT", smoothScroll: XTagc2kEU, children: /* @__PURE__ */ _jsx8(motion8.a, { ...restProps, ...gestureHandlers, className: `${cx8(scopingClassNames, "framer-18eaosy", className, classNames)} framer-f7kxvx`, "data-framer-name": "Default", layoutDependency, layoutId: "lSNB1eKsK__dIxDHbLeh", ref: refBinding, style: { backgroundColor: "rgb(255, 253, 125)", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4, ...style }, variants: { "dIxDHbLeh-hover": { backgroundColor: "rgb(255, 253, 153)" } }, ...addPropertyOverrides2({ "dIxDHbLeh-hover": { "data-framer-name": void 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx8(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx8(React8.Fragment, { children: /* @__PURE__ */ _jsx8(motion8.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtcmVndWxhcg==", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-letter-spacing": "-0.02em" }, children: "Nav Item" }) }), className: "framer-3i2cao", fonts: ["GF;Geist-regular"], layoutDependency, layoutId: "lSNB1eKsK__RLMzkxAu1", style: { "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: SbnDmc0Ms, verticalAlignment: "top", withExternalLayout: true }) }) }) }) }) });
});
var css8 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-Z9mKs.framer-f7kxvx, .framer-Z9mKs .framer-f7kxvx { display: block; }", ".framer-Z9mKs.framer-18eaosy { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 4px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 8px 16px 8px 16px; position: relative; text-decoration: none; width: min-content; will-change: var(--framer-will-change-override, transform); }", ".framer-Z9mKs .framer-3i2cao { flex: none; height: auto; position: relative; white-space: pre; width: auto; }"];
var Framerk2Tdu6hoT = withCSS8(Component8, css8, "framer-Z9mKs");
var k2Tdu6hoT_default = Framerk2Tdu6hoT;
Framerk2Tdu6hoT.displayName = "Button";
Framerk2Tdu6hoT.defaultProps = { height: 33, width: 87 };
addPropertyControls7(Framerk2Tdu6hoT, { SbnDmc0Ms: { defaultValue: "Nav Item", displayTextArea: false, title: "Text", type: ControlType7.String }, onSbnDmc0MsChange: { changes: "SbnDmc0Ms", type: ControlType7.ChangeHandler }, d_FuDun9g: { description: "", title: "Link", type: ControlType7.Link }, ULJGTSS6d: { defaultValue: false, title: "New Tab", type: ControlType7.Boolean }, onULJGTSS6dChange: { changes: "ULJGTSS6d", type: ControlType7.ChangeHandler }, XTagc2kEU: { defaultValue: false, title: "Smooth Scroll", type: ControlType7.Boolean }, onXTagc2kEUChange: { changes: "XTagc2kEU", type: ControlType7.ChangeHandler } });
addFonts3(Framerk2Tdu6hoT, [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", openType: true, source: "google", style: "normal", uiFamilyName: "Geist", url: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RnOM4mJPby1QNtA.woff2", weight: "400" }] }], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/0CdvNOOhc9h2xJXsk0W7/TCV3mJQEP4wIa0tPman5/qgOVWZLqn.js
import { jsx as _jsx13, jsxs as _jsxs3 } from "react/jsx-runtime";
import { addFonts as addFonts4, ComponentViewportProvider as ComponentViewportProvider2, cx as cx13, forwardLoader as forwardLoader2, getFonts as getFonts2, SmartComponentScopedContainer as SmartComponentScopedContainer2, useComponentViewport as useComponentViewport4, useLocaleInfo as useLocaleInfo4, useVariantState as useVariantState4, withCSS as withCSS13, withFX as withFX2, withOptimizedAppearEffect as withOptimizedAppearEffect2 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup4, motion as motion13, MotionConfigContext as MotionConfigContext4 } from "framer-motion";
import * as React13 from "react";
import { useRef as useRef4 } from "react";

// http-url:https://framerusercontent.com/modules/4aDAOGy8TZoXOUt2Vkda/uFD3ECXDBegfUhNNEG0d/sFjCGjy1B.js
import { jsx as _jsx9 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls8, ControlType as ControlType8, cx as cx9, motion as motion9, useSVGTemplate as useSVGTemplate6, withCSS as withCSS9 } from "./_framer-runtime.js";
import * as React9 from "react";
import { forwardRef as forwardRef15 } from "react";
var mask6 = "var(--framer-icon-mask)";
var Base6 = /* @__PURE__ */ forwardRef15(function(props, ref) {
  return /* @__PURE__ */ _jsx9("svg", { ...props, ref, children: props.children });
});
var MotionSVG6 = motion9.create(Base6);
var SVG6 = /* @__PURE__ */ forwardRef15((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx9(MotionSVG6, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx9("svg", { ...rest, ref, children });
});
var svg6 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 5.25 0 L 5.25 5.78 C 5.25 5.978 5.171 6.169 5.031 6.309 L 1.81 9.53 C 1.609 9.73 1.312 9.8 1.043 9.71 C 0.774 9.62 0.578 9.386 0.538 9.105 L 0 5.25 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="9.7487961692037px" id="ugallOpxe" transform="translate(12 11.25)" width="5.25px"/><path d="M 9.749 0 L 3.969 0 C 3.77 0 3.58 0.079 3.439 0.219 L 0.219 3.44 C 0.019 3.641 -0.051 3.938 0.039 4.207 C 0.129 4.476 0.363 4.672 0.644 4.712 L 4.499 5.25 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="5.25px" id="lQV3eI5uT" transform="translate(3.001 6.75)" width="9.7487961692037px"/><path d="M 5.115 2.473 C 4.752 3.269 3.53 5.115 0 5.115 C 0 1.585 1.846 0.363 2.642 0 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="5.115000000000009px" id="Rol3EuQGC" transform="translate(3.75 15.135)" width="5.115000000000002px"/><path d="M 10.417 6.833 C 12.667 4.583 12.807 1.907 12.737 0.713 C 12.713 0.337 12.413 0.037 12.037 0.013 C 10.843 -0.057 8.168 0.082 5.917 2.333 L 0 8.25 L 4.5 12.75 Z" fill="transparent" height="12.749957776566365px" id="T1dzJH3_E" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(7.5 3.75)" width="12.74989583333332px"/><path d="M 9.749 0 L 3.969 0 C 3.77 0 3.58 0.079 3.439 0.219 L 0.219 3.44 C 0.019 3.641 -0.051 3.938 0.039 4.207 C 0.129 4.476 0.363 4.672 0.644 4.712 L 4.499 5.25" fill="transparent" height="5.25px" id="Xo_c2m9KI" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3.001 6.75)" width="9.7487961692037px"/><path d="M 5.25 0 L 5.25 5.78 C 5.25 5.978 5.171 6.169 5.031 6.309 L 1.81 9.53 C 1.609 9.73 1.312 9.8 1.043 9.71 C 0.774 9.62 0.578 9.386 0.538 9.105 L 0 5.25" fill="transparent" height="9.7487961692037px" id="puaO4cp7A" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(12 11.25)" width="5.25px"/><path d="M 5.115 2.473 C 4.752 3.269 3.53 5.115 0 5.115 C 0 1.585 1.846 0.363 2.642 0" fill="transparent" height="5.115000000000009px" id="lMY7FBQMB" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3.75 15.135)" width="5.115000000000002px"/></svg>';
var getProps9 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component9 = /* @__PURE__ */ React9.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps9(props);
  const href = useSVGTemplate6("1175745045", svg6);
  return /* @__PURE__ */ _jsx9(SVG6, { ...restProps, className: cx9("framer-1ipic", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx9("use", { href }) });
});
var css9 = [`.framer-1ipic { -webkit-mask: ${mask6}; aspect-ratio: 1; display: block; mask: ${mask6}; width: 24px; }`];
var Icon6 = withCSS9(Component9, css9, "framer-1ipic");
Icon6.displayName = "Rocket Launch";
var sFjCGjy1B_default = Icon6;
addPropertyControls8(Icon6, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType8.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType8.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType8.Number } });

// http-url:https://framerusercontent.com/modules/E50m9zmkPFqxC82t2ETz/FsDtqbhzVRRGMr8uTdW7/o7Li4LGej.js
import { jsx as _jsx10 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls9, ControlType as ControlType9, cx as cx10, motion as motion10, useSVGTemplate as useSVGTemplate7, withCSS as withCSS10 } from "./_framer-runtime.js";
import * as React10 from "react";
import { forwardRef as forwardRef17 } from "react";
var mask7 = "var(--framer-icon-mask)";
var Base7 = /* @__PURE__ */ forwardRef17(function(props, ref) {
  return /* @__PURE__ */ _jsx10("svg", { ...props, ref, children: props.children });
});
var MotionSVG7 = motion10.create(Base7);
var SVG7 = /* @__PURE__ */ forwardRef17((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx10(MotionSVG7, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx10("svg", { ...rest, ref, children });
});
var svg7 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 9 18 L 9 0.75 C 9 0.473 8.847 0.219 8.604 0.089 C 8.36 -0.042 8.064 -0.027 7.834 0.126 L 0.334 5.126 C 0.125 5.265 0 5.5 0 5.751 L 0 18 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="17.99955101896263px" id="I72hVnK2r" transform="translate(3.75 2.25)" width="9.000001356267717px"/><path d="M 9 18 L 9 0.75 C 9 0.473 8.847 0.219 8.604 0.089 C 8.36 -0.042 8.064 -0.027 7.834 0.126 L 0.334 5.126 C 0.125 5.265 0 5.5 0 5.751 L 0 18" fill="transparent" height="17.99955101896263px" id="cyuU4IxIq" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3.75 2.25)" width="9.000001356267717px"/><path d="M 0 0 L 6.75 0 C 7.164 0 7.5 0.336 7.5 0.75 L 7.5 12" fill="transparent" height="12px" id="AwzURu_Ok" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(12.75 8.25)" width="7.5px"/><path d="M 0 0 L 21 0" fill="transparent" height="1px" id="KYqWRVaAu" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(1.5 20.25)" width="21px"/><path d="M 0 0 L 0 1.5" fill="transparent" height="1.5px" id="kfj6ibSuN" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(9.75 10.5)" width="1px"/><path d="M 0 0 L 0 1.5" fill="transparent" height="1.5px" id="Kc4XiIexT" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(6.75 10.5)" width="1px"/><path d="M 0 0 L 0 1.5" fill="transparent" height="1.5px" id="Z4LIMWfRN" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(6.75 15.75)" width="1px"/><path d="M 0 0 L 0 1.5" fill="transparent" height="1.5px" id="mWPTr5R6Z" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(9.75 15.75)" width="1px"/></svg>';
var getProps10 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component10 = /* @__PURE__ */ React10.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps10(props);
  const href = useSVGTemplate7("1092509595", svg7);
  return /* @__PURE__ */ _jsx10(SVG7, { ...restProps, className: cx10("framer-VNFl5", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx10("use", { href }) });
});
var css10 = [`.framer-VNFl5 { -webkit-mask: ${mask7}; aspect-ratio: 1; display: block; mask: ${mask7}; width: 24px; }`];
var Icon7 = withCSS10(Component10, css10, "framer-VNFl5");
Icon7.displayName = "Buildings";
var o7Li4LGej_default = Icon7;
addPropertyControls9(Icon7, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType9.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType9.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType9.Number } });

// http-url:https://framerusercontent.com/modules/iFqcRxF8ZZEGF7diwteW/imM74r1wvRz3ZLLPqMiF/fYS5GjO1m.js
import { jsx as _jsx11 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls10, ControlType as ControlType10, cx as cx11, motion as motion11, useSVGTemplate as useSVGTemplate8, withCSS as withCSS11 } from "./_framer-runtime.js";
import * as React11 from "react";
import { forwardRef as forwardRef19 } from "react";
var mask8 = "var(--framer-icon-mask)";
var Base8 = /* @__PURE__ */ forwardRef19(function(props, ref) {
  return /* @__PURE__ */ _jsx11("svg", { ...props, ref, children: props.children });
});
var MotionSVG8 = motion11.create(Base8);
var SVG8 = /* @__PURE__ */ forwardRef19((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx11(MotionSVG8, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx11("svg", { ...rest, ref, children });
});
var svg8 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 9 2.408 C 5.84 2.413 2.735 1.583 0 0.001 L 0 0.001 L 0 7.658 C 0 8.073 0.336 8.408 0.75 8.408 L 17.25 8.408 C 17.664 8.408 18 8.073 18 7.658 L 18 0 C 15.265 1.583 12.16 2.413 9 2.408 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="8.408437499999991px" id="yZxSY5tM2" transform="translate(3 11.092)" width="18px"/><path d="M 0 0 L 3 0" fill="transparent" height="1px" id="ZO1T9W9Kn" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(10.5 10.5)" width="3px"/><path d="M 0.75 13.5 C 0.336 13.5 0 13.164 0 12.75 L 0 0.75 C 0 0.336 0.336 0 0.75 0 L 17.25 0 C 17.664 0 18 0.336 18 0.75 L 18 12.75 C 18 13.164 17.664 13.5 17.25 13.5 Z" fill="transparent" height="13.5px" id="U1X8jGTeU" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3 6)" width="18px"/><path d="M 7.5 3 L 7.5 1.5 C 7.5 0.672 6.828 0 6 0 L 1.5 0 C 0.672 0 0 0.672 0 1.5 L 0 3" fill="transparent" height="3px" id="NHVMwj9J3" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(8.25 3)" width="7.5px"/><path d="M 18 0 C 15.265 1.583 12.16 2.413 9 2.408 C 5.84 2.413 2.735 1.583 0 0.001" fill="transparent" height="2.408460292330787px" id="gCBdRGdgX" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3 11.092)" width="18px"/></svg>';
var getProps11 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component11 = /* @__PURE__ */ React11.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps11(props);
  const href = useSVGTemplate8("405654161", svg8);
  return /* @__PURE__ */ _jsx11(SVG8, { ...restProps, className: cx11("framer-ddSE1", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx11("use", { href }) });
});
var css11 = [`.framer-ddSE1 { -webkit-mask: ${mask8}; aspect-ratio: 1; display: block; mask: ${mask8}; width: 24px; }`];
var Icon8 = withCSS11(Component11, css11, "framer-ddSE1");
Icon8.displayName = "Briefcase";
var fYS5GjO1m_default = Icon8;
addPropertyControls10(Icon8, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType10.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType10.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType10.Number } });

// http-url:https://framerusercontent.com/modules/SFOb659v0oyLAL8IWKtl/BcsvSbOgi7HYz9DlFaJH/RS9sgHZJX.js
import { jsx as _jsx12 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls11, ControlType as ControlType11, cx as cx12, motion as motion12, useSVGTemplate as useSVGTemplate9, withCSS as withCSS12 } from "./_framer-runtime.js";
import * as React12 from "react";
import { forwardRef as forwardRef21 } from "react";
var mask9 = "var(--framer-icon-mask)";
var Base9 = /* @__PURE__ */ forwardRef21(function(props, ref) {
  return /* @__PURE__ */ _jsx12("svg", { ...props, ref, children: props.children });
});
var MotionSVG9 = motion12.create(Base9);
var SVG9 = /* @__PURE__ */ forwardRef21((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx12(MotionSVG9, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx12("svg", { ...rest, ref, children });
});
var svg9 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 0.75 15 C 0.336 15 0 14.664 0 14.25 L 0 0.75 C 0 0.336 0.336 0 0.75 0 L 17.25 0 C 17.664 0 18 0.336 18 0.75 L 18 14.25 C 18 14.664 17.664 15 17.25 15 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="15px" id="BzomGKGE4" transform="translate(3 4.5)" width="18px"/><path d="M 0 0 L 3.75 3 L 0 6" fill="transparent" height="6px" id="FY0CER7i7" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(7.5 9)" width="3.75px"/><path d="M 0 0 L 3.75 0" fill="transparent" height="1px" id="EbeKLWLQR" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(12.75 15)" width="3.75px"/><path d="M 0.75 15 C 0.336 15 0 14.664 0 14.25 L 0 0.75 C 0 0.336 0.336 0 0.75 0 L 17.25 0 C 17.664 0 18 0.336 18 0.75 L 18 14.25 C 18 14.664 17.664 15 17.25 15 Z" fill="transparent" height="15px" id="ULQtvbERG" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3 4.5)" width="18px"/></svg>';
var getProps12 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component12 = /* @__PURE__ */ React12.forwardRef(function(props, ref) {
  const { style, className, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps12(props);
  const href = useSVGTemplate9("43496093", svg9);
  return /* @__PURE__ */ _jsx12(SVG9, { ...restProps, className: cx12("framer-Qip03", className), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx12("use", { href }) });
});
var css12 = [`.framer-Qip03 { -webkit-mask: ${mask9}; aspect-ratio: 1; display: block; mask: ${mask9}; width: 24px; }`];
var Icon9 = withCSS12(Component12, css12, "framer-Qip03");
Icon9.displayName = "Terminal Window";
var RS9sgHZJX_default = Icon9;
addPropertyControls11(Icon9, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType11.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType11.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType11.Number } });

// http-url:https://framerusercontent.com/modules/0CdvNOOhc9h2xJXsk0W7/TCV3mJQEP4wIa0tPman5/qgOVWZLqn.js
var MenuItemFonts2 = getFonts2(L6DNiaEnk_default);
var SmartComponentScopedContainerWithFXWithOptimizedAppearEffect2 = withOptimizedAppearEffect2(withFX2(SmartComponentScopedContainer2));
var MotionDivWithFXWithOptimizedAppearEffect2 = withOptimizedAppearEffect2(withFX2(motion13.div));
var serializationHash4 = "framer-IEkNE";
var variantClassNames4 = { a7ZzyVte7: "framer-v-ejaync" };
var transition14 = { delay: 0, duration: 0.6, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation7 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition14, x: 0, y: 0 };
var animation12 = { opacity: 1e-3, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, x: 0, y: 0 };
var transition22 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var transition32 = { delay: 0, duration: 0.8, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation22 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition32, x: 0, y: 0 };
var matchVariant2 = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var transition42 = { delay: 0.1, duration: 0.8, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation32 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition42, x: 0, y: 0 };
var transition52 = { delay: 0.2, duration: 0.8, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation42 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition52, x: 0, y: 0 };
var transition62 = { delay: 0.3, duration: 0.8, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation52 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition62, x: 0, y: 0 };
var transition72 = { delay: 0.4, duration: 0.8, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation62 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition72, x: 0, y: 0 };
var Transition4 = ({ value, children }) => {
  const config = React13.useContext(MotionConfigContext4);
  const transition = value ?? config.transition;
  const contextValue = React13.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx13(MotionConfigContext4.Provider, { value: contextValue, children });
};
var Variants4 = motion13.create(React13.Fragment);
var getProps13 = ({ height, id, width, ...props }) => {
  return { ...props };
};
var createLayoutDependency4 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component13 = /* @__PURE__ */ React13.forwardRef(function(props, ref) {
  const fallbackRef = useRef4(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React13.useId();
  const { activeLocale, setLocale } = useLocaleInfo4();
  const componentViewport = useComponentViewport4();
  const { style, className, layoutId, variant, ...restProps } = getProps13(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState4({ defaultVariant: "a7ZzyVte7", ref: refBinding, variant, variantClassNames: variantClassNames4 });
  const layoutDependency = createLayoutDependency4(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx13(serializationHash4, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx13(LayoutGroup4, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx13(Variants4, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx13(Transition4, { value: transition22, children: /* @__PURE__ */ _jsxs3(MotionDivWithFXWithOptimizedAppearEffect2, { ...restProps, ...gestureHandlers, __framer__presenceAnimate: animation7, __framer__presenceInitial: animation12, __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, className: cx13(scopingClassNames, "framer-ejaync", className, classNames), "data-border": true, "data-framer-appear-id": "ejaync", "data-framer-name": "Default", layoutDependency, layoutId: "lSNB1eKsK__a7ZzyVte7", optimized: true, ref: refBinding, style: { "--border-bottom-width": "1px", "--border-color": "rgba(255, 255, 255, 0.06)", "--border-left-width": "1px", "--border-right-width": "1px", "--border-style": "solid", "--border-top-width": "1px", background: "radial-gradient(100% 100% at 99.2% 0%, rgb(50, 50, 52) 0%, rgb(37, 37, 39) 100%)", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4, ...style }, children: [/* @__PURE__ */ _jsxs3(motion13.div, { className: "framer-1by80tv", "data-framer-name": "Menu Items", layoutDependency, layoutId: "lSNB1eKsK__J6zbzX4bV", children: [/* @__PURE__ */ _jsx13(ComponentViewportProvider2, { height: 62, width: "310px", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 312) - 0 - 335) / 2 + 0 + 0) + 6 + 0, children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect2, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation22, className: "framer-tnb6ye-container", "data-framer-appear-id": "tnb6ye", initial: animation12, layoutDependency, layoutId: "lSNB1eKsK__W8zQ_Rtzu-container", nodeId: "W8zQ_Rtzu", optimized: true, rendersWithMotion: true, scopeId: "qgOVWZLqn", children: /* @__PURE__ */ _jsx13(L6DNiaEnk_default, { EuCQWp3TU: false, height: "100%", id: "W8zQ_Rtzu", L2DDfU8sP: true, layoutId: "lSNB1eKsK__W8zQ_Rtzu", nKXElAIlG: "Startups", Qwq1QMbxB: "Ship faster with flexible pricing", style: { width: "100%" }, tg6u3jl0R: sFjCGjy1B_default, variant: matchVariant2("eRxYth9g1"), width: "100%", ZKAkDHy0S: "https://framer.link/val-casanova" }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider2, { height: 62, width: "310px", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 312) - 0 - 335) / 2 + 0 + 0) + 6 + 62, children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect2, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation32, className: "framer-15hxyjf-container", "data-framer-appear-id": "15hxyjf", initial: animation12, layoutDependency, layoutId: "lSNB1eKsK__uI79WAuB3-container", nodeId: "uI79WAuB3", optimized: true, rendersWithMotion: true, scopeId: "qgOVWZLqn", children: /* @__PURE__ */ _jsx13(L6DNiaEnk_default, { EuCQWp3TU: false, height: "100%", id: "uI79WAuB3", L2DDfU8sP: true, layoutId: "lSNB1eKsK__uI79WAuB3", nKXElAIlG: "Developers", Qwq1QMbxB: "Open-source tools and full API access", style: { width: "100%" }, tg6u3jl0R: RS9sgHZJX_default, variant: matchVariant2("eRxYth9g1"), width: "100%", ZKAkDHy0S: "https://framer.link/val-casanova" }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider2, { height: 62, width: "310px", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 312) - 0 - 335) / 2 + 0 + 0) + 6 + 124, children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect2, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation42, className: "framer-17noz34-container", "data-framer-appear-id": "17noz34", initial: animation12, layoutDependency, layoutId: "lSNB1eKsK__ypjbdxSEX-container", nodeId: "ypjbdxSEX", optimized: true, rendersWithMotion: true, scopeId: "qgOVWZLqn", children: /* @__PURE__ */ _jsx13(L6DNiaEnk_default, { EuCQWp3TU: false, height: "100%", id: "ypjbdxSEX", L2DDfU8sP: true, layoutId: "lSNB1eKsK__ypjbdxSEX", nKXElAIlG: "Agencies", Qwq1QMbxB: "White-label and multi-client management", style: { width: "100%" }, tg6u3jl0R: fYS5GjO1m_default, ukadVc3D1: "Beta", variant: matchVariant2("eRxYth9g1"), width: "100%", ZKAkDHy0S: "https://framer.link/val-casanova" }) }) }), /* @__PURE__ */ _jsx13(ComponentViewportProvider2, { height: 62, width: "310px", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 312) - 0 - 335) / 2 + 0 + 0) + 6 + 186, children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect2, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation52, className: "framer-plo025-container", "data-framer-appear-id": "plo025", initial: animation12, layoutDependency, layoutId: "lSNB1eKsK__Zb6BCq2Q2-container", nodeId: "Zb6BCq2Q2", optimized: true, rendersWithMotion: true, scopeId: "qgOVWZLqn", children: /* @__PURE__ */ _jsx13(L6DNiaEnk_default, { EuCQWp3TU: false, height: "100%", id: "Zb6BCq2Q2", L2DDfU8sP: true, layoutId: "lSNB1eKsK__Zb6BCq2Q2", nKXElAIlG: "Enterprise", Qwq1QMbxB: "Custom contracts and dedicated support", style: { width: "100%" }, tg6u3jl0R: o7Li4LGej_default, variant: matchVariant2("eRxYth9g1"), width: "100%", ZKAkDHy0S: "https://framer.link/val-casanova" }) }) })] }), /* @__PURE__ */ _jsx13(motion13.div, { className: "framer-16h71mb", "data-framer-name": "Line", layoutDependency, layoutId: "lSNB1eKsK__J3EaDv3YS", style: { backgroundColor: "rgba(255, 255, 255, 0.04)" } }), /* @__PURE__ */ _jsx13(motion13.div, { className: "framer-ksyx1x", "data-framer-name": "CTA", layoutDependency, layoutId: "lSNB1eKsK__etJsjnAvw", children: /* @__PURE__ */ _jsx13(ComponentViewportProvider2, { height: 62, width: "310px", y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 312) - 0 - 335) / 2 + 261 + 0) + 6 + 0, children: /* @__PURE__ */ _jsx13(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect2, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation62, className: "framer-1jptlr1-container", "data-framer-appear-id": "1jptlr1", initial: animation12, layoutDependency, layoutId: "lSNB1eKsK__tLjlK7zaq-container", nodeId: "tLjlK7zaq", optimized: true, rendersWithMotion: true, scopeId: "qgOVWZLqn", children: /* @__PURE__ */ _jsx13(L6DNiaEnk_default, { EuCQWp3TU: false, height: "100%", id: "tLjlK7zaq", L2DDfU8sP: true, layoutId: "lSNB1eKsK__tLjlK7zaq", nKXElAIlG: "Explore all solutions", Qwq1QMbxB: "Enterprise-grade access control", style: { width: "100%" }, tg6u3jl0R: EUx6SozYk_default, variant: matchVariant2("CpGGGh2Jv"), width: "100%", ZKAkDHy0S: "https://framer.link/val-casanova" }) }) }) })] }) }) }) });
});
var css13 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-IEkNE.framer-lorirs, .framer-IEkNE .framer-lorirs { display: block; }", ".framer-IEkNE.framer-ejaync { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: min-content; will-change: var(--framer-will-change-override, transform); }", ".framer-IEkNE .framer-1by80tv { align-content: center; align-items: center; align-self: stretch; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: center; overflow: visible; padding: 6px; position: relative; width: auto; }", ".framer-IEkNE .framer-tnb6ye-container, .framer-IEkNE .framer-15hxyjf-container, .framer-IEkNE .framer-17noz34-container, .framer-IEkNE .framer-plo025-container, .framer-IEkNE .framer-1jptlr1-container { flex: none; height: auto; position: relative; width: 310px; }", ".framer-IEkNE .framer-16h71mb { flex: none; height: 1px; overflow: var(--overflow-clip-fallback, clip); position: relative; width: 100px; }", ".framer-IEkNE .framer-ksyx1x { align-content: center; align-items: center; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 0px; height: min-content; justify-content: center; overflow: visible; padding: 6px; position: relative; width: min-content; }", '.framer-IEkNE[data-border="true"]::after, .framer-IEkNE [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FramerqgOVWZLqn = withCSS13(Component13, css13, "framer-IEkNE");
var qgOVWZLqn_default = FramerqgOVWZLqn;
FramerqgOVWZLqn.displayName = "Solutions Dropdown";
FramerqgOVWZLqn.defaultProps = { height: 312, width: 322 };
addFonts4(FramerqgOVWZLqn, [{ explicitInter: true, fonts: [] }, ...MenuItemFonts2], { supportsExplicitInterCodegen: true });
FramerqgOVWZLqn.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader2(L6DNiaEnk_default, {}, context)]);
} };

// http-url:https://framerusercontent.com/modules/c2a9PtLo0kDusoLOn2js/PXV61fFpzyP33qxxLwgZ/xGJXrS4PW.js
import { jsx as _jsx14, jsxs as _jsxs4 } from "react/jsx-runtime";
import { addFonts as addFonts5, addPropertyControls as addPropertyControls12, ControlType as ControlType12, cx as cx14, Link as Link3, RichText as RichText3, SVG as SVG10, useActiveVariantCallback, useComponentViewport as useComponentViewport5, useLocaleInfo as useLocaleInfo5, useVariantState as useVariantState5, withCSS as withCSS14 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup5, motion as motion14, MotionConfigContext as MotionConfigContext5 } from "framer-motion";
import * as React14 from "react";
import { useRef as useRef5 } from "react";
var enabledGestures3 = { SWPshR54w: { hover: true } };
var cycleOrder2 = ["AyQhRBjEz", "oHaEO7K78", "SWPshR54w"];
var serializationHash5 = "framer-OCHYX";
var variantClassNames5 = { AyQhRBjEz: "framer-v-1xf0wkg", oHaEO7K78: "framer-v-wo5mnm", SWPshR54w: "framer-v-z9474s" };
function addPropertyOverrides3(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition15 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition5 = ({ value, children }) => {
  const config = React14.useContext(MotionConfigContext5);
  const transition = value ?? config.transition;
  const contextValue = React14.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx14(MotionConfigContext5.Provider, { value: contextValue, children });
};
var humanReadableVariantMap2 = { "Dropdown Closed": "AyQhRBjEz", "Dropdown Open": "oHaEO7K78", Default: "SWPshR54w" };
var Variants5 = motion14.create(React14.Fragment);
var getProps14 = ({ height, hover, id, link, newTab, smoothScroll, text, width, ...props }) => {
  return { ...props, d_FuDun9g: link ?? props.d_FuDun9g, SbnDmc0Ms: text ?? props.SbnDmc0Ms ?? "Nav Item", sg68ziib2: hover ?? props.sg68ziib2, ULJGTSS6d: newTab ?? props.ULJGTSS6d, variant: humanReadableVariantMap2[props.variant] ?? props.variant ?? "AyQhRBjEz", XTagc2kEU: smoothScroll ?? props.XTagc2kEU };
};
var createLayoutDependency5 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component14 = /* @__PURE__ */ React14.forwardRef(function(props, ref) {
  const fallbackRef = useRef5(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React14.useId();
  const { activeLocale, setLocale } = useLocaleInfo5();
  const componentViewport = useComponentViewport5();
  const { style, className, layoutId, variant, sg68ziib2, SbnDmc0Ms, d_FuDun9g, ULJGTSS6d, XTagc2kEU, ...restProps } = getProps14(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState5({ cycleOrder: cycleOrder2, defaultVariant: "AyQhRBjEz", enabledGestures: enabledGestures3, ref: refBinding, variant, variantClassNames: variantClassNames5 });
  const layoutDependency = createLayoutDependency5(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback(baseVariant);
  const onMouseEnter1kuq7vk = activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: true });
    if (sg68ziib2) {
      const res = await sg68ziib2(...args);
      if (res === false)
        return false;
    }
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx14(serializationHash5, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (gestureVariant === "SWPshR54w-hover")
      return false;
    if (baseVariant === "SWPshR54w")
      return false;
    return true;
  };
  return /* @__PURE__ */ _jsx14(LayoutGroup5, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx14(Variants5, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx14(Transition5, { value: transition15, children: /* @__PURE__ */ _jsx14(Link3, { motionChild: true, nodeId: "AyQhRBjEz", scopeId: "xGJXrS4PW", ...addPropertyOverrides3({ SWPshR54w: { href: d_FuDun9g, openInNewTab: ULJGTSS6d, smoothScroll: XTagc2kEU } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsxs4(motion14.a, { ...restProps, ...gestureHandlers, className: `${cx14(scopingClassNames, "framer-1xf0wkg", className, classNames)} framer-fs2ic3`, "data-framer-name": "Dropdown Closed", "data-highlight": true, layoutDependency, layoutId: "lSNB1eKsK__AyQhRBjEz", onMouseEnter: onMouseEnter1kuq7vk, ref: refBinding, style: { borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4, ...style }, ...addPropertyOverrides3({ "SWPshR54w-hover": { "data-framer-name": void 0 }, oHaEO7K78: { "data-framer-name": "Dropdown Open" }, SWPshR54w: { "data-framer-name": "Default" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx14(RichText3, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx14(React14.Fragment, { children: /* @__PURE__ */ _jsx14(motion14.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtcmVndWxhcg==", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(204, 204, 204))" }, children: "Nav Item" }) }), className: "framer-17b7bde", fonts: ["GF;Geist-regular"], layoutDependency, layoutId: "lSNB1eKsK__jafJdwQXe", style: { "--extracted-r6o4lv": "rgb(204, 204, 204)", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: SbnDmc0Ms, variants: { "SWPshR54w-hover": { "--extracted-r6o4lv": "rgb(255, 255, 255)" }, oHaEO7K78: { "--extracted-r6o4lv": "rgb(255, 255, 255)" } }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides3({ "SWPshR54w-hover": { children: /* @__PURE__ */ _jsx14(React14.Fragment, { children: /* @__PURE__ */ _jsx14(motion14.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtcmVndWxhcg==", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(255, 255, 255))" }, children: "Nav Item" }) }) }, oHaEO7K78: { children: /* @__PURE__ */ _jsx14(React14.Fragment, { children: /* @__PURE__ */ _jsx14(motion14.p, { dir: "auto", style: { "--font-selector": "R0Y7R2Vpc3QtcmVndWxhcg==", "--framer-font-family": '"Geist", "Geist Placeholder", sans-serif', "--framer-font-open-type-features": "'blwf' on, 'cv03' on, 'cv04' on, 'cv09' on, 'cv11' on", "--framer-font-size": "14px", "--framer-letter-spacing": "-0.02em", "--framer-text-color": "var(--extracted-r6o4lv, rgb(255, 255, 255))" }, children: "Nav Item" }) }) } }, baseVariant, gestureVariant) }), isDisplayed() && /* @__PURE__ */ _jsx14(motion14.div, { className: "framer-ytpc6s", "data-framer-name": "Caret", layoutDependency, layoutId: "lSNB1eKsK__GdGhUweD4", style: { rotate: 0 }, variants: { oHaEO7K78: { rotate: -180 } }, children: /* @__PURE__ */ _jsx14(SVG10, { className: "framer-1y06s65", "data-framer-name": "Icon", layout: "position", layoutDependency, layoutId: "lSNB1eKsK__q4p8v6Ncz", opacity: 1, svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 14 14"><path d="M 3 5.5 L 7 9.5 L 11 5.5" fill="transparent" stroke-width="1.2" stroke="rgb(204, 204, 204)" stroke-linecap="round" stroke-linejoin="round"></path></svg>', svgContentId: 10714125341, withExternalLayout: true, ...addPropertyOverrides3({ oHaEO7K78: { svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 14 14"><path d="M 3 5.5 L 7 9.5 L 11 5.5" fill="transparent" stroke-width="1.2" stroke="rgb(255, 255, 255)" stroke-linecap="round" stroke-linejoin="round"></path></svg>', svgContentId: 9577380803 } }, baseVariant, gestureVariant) }) })] }) }) }) }) });
});
var css14 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-OCHYX.framer-fs2ic3, .framer-OCHYX .framer-fs2ic3 { display: block; }", ".framer-OCHYX.framer-1xf0wkg { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 4px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 8px 16px 8px 16px; position: relative; width: min-content; will-change: var(--framer-will-change-override, transform); }", ".framer-OCHYX .framer-17b7bde { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-OCHYX .framer-ytpc6s { flex: none; height: 14px; overflow: visible; position: relative; width: 14px; }", ".framer-OCHYX .framer-1y06s65 { flex: none; height: 14px; left: calc(50.00000000000002% - 14px / 2); position: absolute; top: calc(50.00000000000002% - 14px / 2); width: 14px; }", ".framer-OCHYX.framer-v-z9474s.framer-1xf0wkg { text-decoration: none; }"];
var FramerxGJXrS4PW = withCSS14(Component14, css14, "framer-OCHYX");
var xGJXrS4PW_default = FramerxGJXrS4PW;
FramerxGJXrS4PW.displayName = "Menu Link";
FramerxGJXrS4PW.defaultProps = { height: 33, width: 105 };
addPropertyControls12(FramerxGJXrS4PW, { variant: { options: ["AyQhRBjEz", "oHaEO7K78", "SWPshR54w"], optionTitles: ["Dropdown Closed", "Dropdown Open", "Default"], title: "Variant", type: ControlType12.Enum }, sg68ziib2: { title: "Hover", type: ControlType12.EventHandler }, SbnDmc0Ms: { defaultValue: "Nav Item", displayTextArea: false, title: "Text", type: ControlType12.String }, onSbnDmc0MsChange: { changes: "SbnDmc0Ms", type: ControlType12.ChangeHandler }, d_FuDun9g: { description: "Works only in regular variant", title: "Link", type: ControlType12.Link }, ULJGTSS6d: { defaultValue: false, title: "New Tab", type: ControlType12.Boolean }, onULJGTSS6dChange: { changes: "ULJGTSS6d", type: ControlType12.ChangeHandler }, XTagc2kEU: { defaultValue: false, title: "Smooth Scroll", type: ControlType12.Boolean }, onXTagc2kEUChange: { changes: "XTagc2kEU", type: ControlType12.ChangeHandler } });
addFonts5(FramerxGJXrS4PW, [{ explicitInter: true, fonts: [{ cssFamilyName: "Geist", openType: true, source: "google", style: "normal", uiFamilyName: "Geist", url: "https://fonts.gstatic.com/s/geist/v4/gyBhhwUxId8gMGYQMKR3pzfaWI_RnOM4mJPby1QNtA.woff2", weight: "400" }] }], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/3WRiMkHquBk2OsQmTbr6/c5rKhvRAWxFW6SOJUnqn/lSNB1eKsK.js
var MenuLinkFonts = getFonts3(xGJXrS4PW_default);
var ProductsDropdownFonts = getFonts3(BlueJ5Iqo_default);
var SolutionsDropdownFonts = getFonts3(qgOVWZLqn_default);
var ButtonFonts = getFonts3(k2Tdu6hoT_default);
var serializationHash6 = "framer-94OeZ";
var variantClassNames6 = { ixchcr7jJ: "framer-v-1r2bmv0" };
var transition16 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var matchVariant3 = (...args) => {
  for (const arg of args) {
    if (arg && typeof arg === "string")
      return arg;
  }
  return void 0;
};
var Overlay = ({ children, blockDocumentScrolling, dismissWithEsc, enabled = true }) => {
  const [visible, setVisible] = useOverlayState({ blockDocumentScrolling, dismissWithEsc: enabled && dismissWithEsc });
  return children({ hide: () => setVisible(false), show: () => setVisible(true), toggle: () => setVisible(!visible), visible: enabled && visible });
};
var Transition6 = ({ value, children }) => {
  const config = React15.useContext(MotionConfigContext6);
  const transition = value ?? config.transition;
  const contextValue = React15.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx15(MotionConfigContext6.Provider, { value: contextValue, children });
};
var Variants6 = motion15.create(React15.Fragment);
var getProps15 = ({ height, id, width, ...props }) => {
  return { ...props };
};
var createLayoutDependency6 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component15 = /* @__PURE__ */ React15.forwardRef(function(props, ref) {
  const fallbackRef = useRef7(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React15.useId();
  const { activeLocale, setLocale } = useLocaleInfo6();
  const componentViewport = useComponentViewport6();
  const { style, className, layoutId, variant, ...restProps } = getProps15(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState6({ defaultVariant: "ixchcr7jJ", ref: refBinding, variant, variantClassNames: variantClassNames6 });
  const layoutDependency = createLayoutDependency6(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback2(baseVariant);
  const sg68ziib213elrgn = ({ overlay }) => activeVariantCallback(async (...args) => {
    overlay.show();
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx15(serializationHash6, ...sharedStyleClassNames);
  const ref1 = React15.useRef(null);
  const ref2 = React15.useRef(null);
  const ref3 = React15.useRef(null);
  const ref4 = React15.useRef(null);
  return /* @__PURE__ */ _jsx15(LayoutGroup6, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx15(Variants6, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx15(Transition6, { value: transition16, children: /* @__PURE__ */ _jsx15(motion15.div, { ...restProps, ...gestureHandlers, className: cx15(scopingClassNames, "framer-1r2bmv0", className, classNames), "data-framer-name": "Desktop", layoutDependency, layoutId: "lSNB1eKsK__ixchcr7jJ", ref: refBinding, style: { ...style }, children: /* @__PURE__ */ _jsxs5(motion15.div, { className: "framer-dsz4uk", "data-framer-name": "Nav Container", layoutDependency, layoutId: "lSNB1eKsK__k_PI4YsAb", children: [/* @__PURE__ */ _jsx15(motion15.div, { className: "framer-is904c", "data-framer-name": "Logo Container", layoutDependency, layoutId: "lSNB1eKsK__KyYNRa9Tu", children: /* @__PURE__ */ _jsx15(Link4, { href: "https://framer.link/val-casanova", motionChild: true, nodeId: "ZQb26sVb1", openInNewTab: true, scopeId: "lSNB1eKsK", children: /* @__PURE__ */ _jsx15(motion15.a, { className: "framer-1u34er1 framer-1agvpkw", "data-framer-name": "Placeholder Logo", layoutDependency, layoutId: "lSNB1eKsK__ZQb26sVb1", children: /* @__PURE__ */ _jsxs5(SVG11, { className: "framer-z7oopu", layoutDependency, layoutId: "lSNB1eKsK__hfcZC9h5_", requiresOverflowVisible: false, svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 23.976 23.976" overflow="visible"><path d="M 12.158 17.897 C 8.8 17.897 6.079 20.619 6.079 23.976 L 0 23.976 C 0 17.262 5.443 11.819 12.158 11.819 Z M 23.976 11.819 C 23.976 18.533 18.533 23.976 11.819 23.976 L 11.819 17.897 C 15.176 17.897 17.897 15.176 17.897 11.819 Z M 12.158 6.079 C 8.8 6.079 6.079 8.8 6.079 12.158 L 0 12.158 C 0 5.443 5.443 0 12.158 0 Z M 23.976 0 C 23.976 6.714 18.533 12.158 11.819 12.158 L 11.819 6.079 C 15.176 6.079 17.897 3.357 17.897 0 Z" fill="rgb(255, 253, 125)"></path></svg>', withExternalLayout: true, children: [/* @__PURE__ */ _jsx15(SVG11, { className: "framer-1ne6v4t", layoutDependency, layoutId: "lSNB1eKsK__mLOaDYDD0", requiresOverflowVisible: false, svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 12.158 12.158" overflow="visible"><path d="M 12.158 6.079 C 8.8 6.079 6.079 8.8 6.079 12.158 L 0 12.158 C 0 5.443 5.443 0 12.158 0 Z" fill="transparent"></path></svg>', withExternalLayout: true }), /* @__PURE__ */ _jsx15(SVG11, { className: "framer-19wherl", layoutDependency, layoutId: "lSNB1eKsK__Ackxmh3Vi", requiresOverflowVisible: false, svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 12.158 12.158" overflow="visible"><path d="M 12.158 0 C 12.158 6.714 6.714 12.158 0 12.158 L 0 6.079 C 3.357 6.079 6.079 3.357 6.079 0 Z" fill="transparent"></path></svg>', withExternalLayout: true }), /* @__PURE__ */ _jsx15(SVG11, { className: "framer-1sstyxj", layoutDependency, layoutId: "lSNB1eKsK__Dh0cOx_e_", requiresOverflowVisible: false, svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 12.158 12.158" overflow="visible"><path d="M 12.158 6.079 C 8.8 6.079 6.079 8.8 6.079 12.158 L 0 12.158 C 0 5.443 5.443 0 12.158 0 Z" fill="transparent"></path></svg>', withExternalLayout: true }), /* @__PURE__ */ _jsx15(SVG11, { className: "framer-1x0wbyz", layoutDependency, layoutId: "lSNB1eKsK__DJS4hXT07", requiresOverflowVisible: false, svg: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 12.158 12.158" overflow="visible"><path d="M 12.158 0 C 12.158 6.714 6.714 12.158 0 12.158 L 0 6.079 C 3.357 6.079 6.079 3.357 6.079 0 Z" fill="transparent"></path></svg>', withExternalLayout: true })] }) }) }) }), /* @__PURE__ */ _jsxs5(motion15.div, { className: "framer-zfvfdf", "data-framer-name": "Menu", layoutDependency, layoutId: "lSNB1eKsK__XxtYTVoFh", children: [/* @__PURE__ */ _jsx15(Overlay, { blockDocumentScrolling: false, dismissWithEsc: false, children: (overlay) => /* @__PURE__ */ _jsx15(_Fragment, { children: /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 33, y: (componentViewport?.y || 0) + (0 + ((componentViewport?.height || 65) - 0 - 65) / 2) + 16 + 0, children: /* @__PURE__ */ _jsxs5(SmartComponentScopedContainer3, { className: "framer-11vnknx-container", "data-framer-name": "Menu Link", id: `${layoutId}-11vnknx`, layoutDependency, layoutId: "lSNB1eKsK__NkVNdY2Or-container", name: "Menu Link", nodeId: "NkVNdY2Or", ref: ref1, rendersWithMotion: true, scopeId: "lSNB1eKsK", children: [/* @__PURE__ */ _jsx15(xGJXrS4PW_default, { height: "100%", id: "NkVNdY2Or", layoutId: "lSNB1eKsK__NkVNdY2Or", name: "Menu Link", SbnDmc0Ms: "Products", sg68ziib2: sg68ziib213elrgn({ overlay }), ULJGTSS6d: false, variant: matchVariant3(overlay.visible && "oHaEO7K78", overlay.visible ? "oHaEO7K78" : "AyQhRBjEz"), width: "100%", XTagc2kEU: false }), /* @__PURE__ */ _jsx15(AnimatePresence, { children: overlay.visible && /* @__PURE__ */ _jsx15(Floating, { alignment: "start", anchorRef: ref1, className: cx15(scopingClassNames, classNames), collisionDetection: true, collisionDetectionPadding: 20, "data-framer-portal-id": `${layoutId}-11vnknx`, offsetX: 0, offsetY: 16, onDismiss: overlay.hide, placement: "bottom", safeArea: true, zIndex: 11, children: /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 312, y: (componentViewport?.y || 0) + (0 + ((componentViewport?.height || 65) - 0 - 65) / 2) + 16 + 0 + 0, children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-5n6s0b-container", inComponentSlot: true, layoutDependency, layoutId: "lSNB1eKsK__B9BYxS02F-container", nodeId: "B9BYxS02F", ref: ref2, rendersWithMotion: true, role: "dialog", scopeId: "lSNB1eKsK", children: /* @__PURE__ */ _jsx15(BlueJ5Iqo_default, { height: "100%", id: "B9BYxS02F", layoutId: "lSNB1eKsK__B9BYxS02F", width: "100%" }) }) }) }) })] }) }) }) }), /* @__PURE__ */ _jsx15(motion15.div, { className: "framer-razuyp", "data-framer-name": "Line", layoutDependency, layoutId: "lSNB1eKsK__Y54RrwIk5", style: { backgroundColor: "rgba(255, 255, 255, 0.2)" } }), /* @__PURE__ */ _jsx15(Overlay, { blockDocumentScrolling: false, dismissWithEsc: false, children: (overlay1) => /* @__PURE__ */ _jsx15(_Fragment, { children: /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 33, y: (componentViewport?.y || 0) + (0 + ((componentViewport?.height || 65) - 0 - 65) / 2) + 16 + 0, children: /* @__PURE__ */ _jsxs5(SmartComponentScopedContainer3, { className: "framer-o1y7n1-container", "data-framer-name": "Menu Link", id: `${layoutId}-o1y7n1`, layoutDependency, layoutId: "lSNB1eKsK__SGJGBWOBl-container", name: "Menu Link", nodeId: "SGJGBWOBl", ref: ref3, rendersWithMotion: true, scopeId: "lSNB1eKsK", children: [/* @__PURE__ */ _jsx15(xGJXrS4PW_default, { height: "100%", id: "SGJGBWOBl", layoutId: "lSNB1eKsK__SGJGBWOBl", name: "Menu Link", SbnDmc0Ms: "Solutions", sg68ziib2: sg68ziib213elrgn({ overlay: overlay1 }), ULJGTSS6d: false, variant: matchVariant3(overlay1.visible && "oHaEO7K78", overlay1.visible ? "oHaEO7K78" : "AyQhRBjEz"), width: "100%", XTagc2kEU: false }), /* @__PURE__ */ _jsx15(AnimatePresence, { children: overlay1.visible && /* @__PURE__ */ _jsx15(Floating, { alignment: "start", anchorRef: ref3, className: cx15(scopingClassNames, classNames), collisionDetection: true, collisionDetectionPadding: 20, "data-framer-portal-id": `${layoutId}-o1y7n1`, offsetX: 0, offsetY: 16, onDismiss: overlay1.hide, placement: "bottom", safeArea: true, zIndex: 11, children: /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 312, y: (componentViewport?.y || 0) + (0 + ((componentViewport?.height || 65) - 0 - 65) / 2) + 16 + 0 + 0, children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-1lmxpid-container", inComponentSlot: true, layoutDependency, layoutId: "lSNB1eKsK__UxMOWPUUr-container", nodeId: "UxMOWPUUr", ref: ref4, rendersWithMotion: true, role: "dialog", scopeId: "lSNB1eKsK", children: /* @__PURE__ */ _jsx15(qgOVWZLqn_default, { height: "100%", id: "UxMOWPUUr", layoutId: "lSNB1eKsK__UxMOWPUUr", width: "100%" }) }) }) }) })] }) }) }) }), /* @__PURE__ */ _jsx15(motion15.div, { className: "framer-9zcq0q", "data-framer-name": "Line", layoutDependency, layoutId: "lSNB1eKsK__yMl7NAZ9j", style: { backgroundColor: "rgba(255, 255, 255, 0.2)" } }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 33, y: (componentViewport?.y || 0) + (0 + ((componentViewport?.height || 65) - 0 - 65) / 2) + 16 + 0, children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-1gzsikj-container", "data-framer-name": "Menu Link", layoutDependency, layoutId: "lSNB1eKsK__pJRLkxBqD-container", name: "Menu Link", nodeId: "pJRLkxBqD", rendersWithMotion: true, scopeId: "lSNB1eKsK", children: /* @__PURE__ */ _jsx15(xGJXrS4PW_default, { d_FuDun9g: "https://framer.link/val-casanova", height: "100%", id: "pJRLkxBqD", layoutId: "lSNB1eKsK__pJRLkxBqD", name: "Menu Link", SbnDmc0Ms: "Pricing", ULJGTSS6d: true, variant: matchVariant3("SWPshR54w"), width: "100%", XTagc2kEU: false }) }) }), /* @__PURE__ */ _jsx15(motion15.div, { className: "framer-b2snqd", "data-framer-name": "Line", layoutDependency, layoutId: "lSNB1eKsK__WI2xwRKIg", style: { backgroundColor: "rgba(255, 255, 255, 0.2)" } }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 33, y: (componentViewport?.y || 0) + (0 + ((componentViewport?.height || 65) - 0 - 65) / 2) + 16 + 0, children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-1kdao4-container", "data-framer-name": "Menu Link", layoutDependency, layoutId: "lSNB1eKsK__CamWLTURZ-container", name: "Menu Link", nodeId: "CamWLTURZ", rendersWithMotion: true, scopeId: "lSNB1eKsK", children: /* @__PURE__ */ _jsx15(xGJXrS4PW_default, { d_FuDun9g: "https://framer.link/val-casanova", height: "100%", id: "CamWLTURZ", layoutId: "lSNB1eKsK__CamWLTURZ", name: "Menu Link", SbnDmc0Ms: "Students", ULJGTSS6d: true, variant: matchVariant3("SWPshR54w"), width: "100%", XTagc2kEU: false }) }) }), /* @__PURE__ */ _jsx15(motion15.div, { className: "framer-5jrv4j", "data-framer-name": "Line", layoutDependency, layoutId: "lSNB1eKsK__QE4KqTCLI", style: { backgroundColor: "rgba(255, 255, 255, 0.2)" } }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 33, y: (componentViewport?.y || 0) + (0 + ((componentViewport?.height || 65) - 0 - 65) / 2) + 16 + 0, children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-chiw9z-container", "data-framer-name": "Menu Link", layoutDependency, layoutId: "lSNB1eKsK__jPB0lbAsn-container", name: "Menu Link", nodeId: "jPB0lbAsn", rendersWithMotion: true, scopeId: "lSNB1eKsK", children: /* @__PURE__ */ _jsx15(xGJXrS4PW_default, { d_FuDun9g: "https://framer.link/val-casanova", height: "100%", id: "jPB0lbAsn", layoutId: "lSNB1eKsK__jPB0lbAsn", name: "Menu Link", SbnDmc0Ms: "App", ULJGTSS6d: true, variant: matchVariant3("SWPshR54w"), width: "100%", XTagc2kEU: false }) }) })] }), /* @__PURE__ */ _jsxs5(motion15.div, { className: "framer-1lprhs8", "data-framer-name": "CTAs", layoutDependency, layoutId: "lSNB1eKsK__EIaFkA2Fe", children: [/* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 33, y: (componentViewport?.y || 0) + (0 + ((componentViewport?.height || 65) - 0 - 65) / 2) + 16 + 0, children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-6br6fk-container", "data-framer-name": "Menu Link", layoutDependency, layoutId: "lSNB1eKsK__IUY63cfMt-container", name: "Menu Link", nodeId: "IUY63cfMt", rendersWithMotion: true, scopeId: "lSNB1eKsK", children: /* @__PURE__ */ _jsx15(xGJXrS4PW_default, { d_FuDun9g: "https://framer.link/val-casanova", height: "100%", id: "IUY63cfMt", layoutId: "lSNB1eKsK__IUY63cfMt", name: "Menu Link", SbnDmc0Ms: "Sign In", ULJGTSS6d: true, variant: matchVariant3("SWPshR54w"), width: "100%", XTagc2kEU: false }) }) }), /* @__PURE__ */ _jsx15(ComponentViewportProvider3, { height: 33, y: (componentViewport?.y || 0) + (0 + ((componentViewport?.height || 65) - 0 - 65) / 2) + 16 + 0, children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer3, { className: "framer-14kzzrc-container", layoutDependency, layoutId: "lSNB1eKsK__uW6DqYsdD-container", nodeId: "uW6DqYsdD", rendersWithMotion: true, scopeId: "lSNB1eKsK", children: /* @__PURE__ */ _jsx15(k2Tdu6hoT_default, { d_FuDun9g: "https://framer.link/val-casanova", height: "100%", id: "uW6DqYsdD", layoutId: "lSNB1eKsK__uW6DqYsdD", SbnDmc0Ms: "Start for free", ULJGTSS6d: true, width: "100%", XTagc2kEU: false }) }) })] })] }) }) }) }) });
});
var css15 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-94OeZ.framer-1agvpkw, .framer-94OeZ .framer-1agvpkw { display: block; }", ".framer-94OeZ.framer-1r2bmv0 { align-content: center; align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 100%; }", ".framer-94OeZ .framer-dsz4uk { align-content: center; align-items: center; display: flex; flex: 1 0 0px; flex-direction: row; flex-wrap: nowrap; gap: 24px; height: min-content; justify-content: flex-start; max-width: 1400px; overflow: var(--overflow-clip-fallback, clip); padding: 16px; position: relative; width: 1px; }", ".framer-94OeZ .framer-is904c { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: min-content; }", ".framer-94OeZ .framer-1u34er1 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; text-decoration: none; width: min-content; }", ".framer-94OeZ .framer-z7oopu { height: 24px; position: relative; width: 24px; }", ".framer-94OeZ .framer-1ne6v4t { height: 12px; left: 0px; position: absolute; top: 12px; width: 12px; }", ".framer-94OeZ .framer-19wherl { height: 12px; left: 12px; position: absolute; top: 12px; width: 12px; }", ".framer-94OeZ .framer-1sstyxj { height: 12px; left: 0px; position: absolute; top: 0px; width: 12px; }", ".framer-94OeZ .framer-1x0wbyz { height: 12px; left: 12px; position: absolute; top: 0px; width: 12px; }", ".framer-94OeZ .framer-zfvfdf { align-content: center; align-items: center; display: flex; flex: 1 0 0px; flex-direction: row; flex-wrap: nowrap; gap: 4px; height: min-content; justify-content: flex-start; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: 1px; }", ".framer-94OeZ .framer-11vnknx-container, .framer-94OeZ .framer-o1y7n1-container, .framer-94OeZ .framer-1gzsikj-container, .framer-94OeZ .framer-1kdao4-container, .framer-94OeZ .framer-chiw9z-container, .framer-94OeZ .framer-6br6fk-container, .framer-94OeZ .framer-14kzzrc-container { flex: none; height: auto; position: relative; width: auto; }", ".framer-94OeZ .framer-5n6s0b-container, .framer-94OeZ .framer-1lmxpid-container { height: auto; position: relative; width: auto; }", ".framer-94OeZ .framer-razuyp, .framer-94OeZ .framer-9zcq0q, .framer-94OeZ .framer-b2snqd, .framer-94OeZ .framer-5jrv4j { flex: none; height: 10px; overflow: var(--overflow-clip-fallback, clip); position: relative; width: 1px; }", ".framer-94OeZ .framer-1lprhs8 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 8px; height: min-content; justify-content: center; overflow: var(--overflow-clip-fallback, clip); padding: 0px; position: relative; width: min-content; }"];
var FramerlSNB1eKsK = withCSS15(Component15, css15, "framer-94OeZ");
var lSNB1eKsK_default = FramerlSNB1eKsK;
FramerlSNB1eKsK.displayName = "Smooth Dropdown Nav";
FramerlSNB1eKsK.defaultProps = { height: 65, width: 1200 };
addFonts6(FramerlSNB1eKsK, [{ explicitInter: true, fonts: [] }, ...MenuLinkFonts, ...ProductsDropdownFonts, ...SolutionsDropdownFonts, ...ButtonFonts], { supportsExplicitInterCodegen: true });
FramerlSNB1eKsK.loader = { load: (props, context) => {
  const locale = context.locale;
  return Promise.allSettled([forwardLoader3(xGJXrS4PW_default, {}, context), forwardLoader3(BlueJ5Iqo_default, {}, context), forwardLoader3(qgOVWZLqn_default, {}, context), forwardLoader3(k2Tdu6hoT_default, {}, context)]);
} };
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "FramerlSNB1eKsK", "slots": [], "annotations": { "framerIntrinsicWidth": "1200", "framerIntrinsicHeight": "65", "framerComponentViewportWidth": "true", "framerColorSyntax": "true", "framerAutoSizeImages": "true", "framerImmutableVariables": "true", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","auto"]}}}', "framerDisplayContentsDiv": "false", "framerContractVersion": "1" } }, "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  lSNB1eKsK_default as default
};
