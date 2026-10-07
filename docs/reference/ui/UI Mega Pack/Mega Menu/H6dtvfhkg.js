var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/HM4SuSjpi4As25a2Cdww/kotud0BuEShycI30iFUb/H6DtvFhKg.js
import { jsx as _jsx24, jsxs as _jsxs12 } from "react/jsx-runtime";
import { addFonts as addFonts9, addPropertyControls as addPropertyControls18, ComponentViewportProvider as ComponentViewportProvider6, ControlType as ControlType18, cx as cx18, getFonts as getFonts6, getLoadingLazyAtYPosition as getLoadingLazyAtYPosition2, Image as Image2, Instance as Instance2, SmartComponentScopedContainer as SmartComponentScopedContainer6, useActiveVariantCallback as useActiveVariantCallback4, useComponentViewport as useComponentViewport9, useLocaleInfo as useLocaleInfo17, useVariantState as useVariantState9, withCSS as withCSS19 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup9, motion as motion24, MotionConfigContext as MotionConfigContext9 } from "framer-motion";
import * as React22 from "react";
import { useRef as useRef16 } from "react";

// http-url:https://framerusercontent.com/modules/2QGlX864pmL5cxqknTvK/sudwzLB4XBD5Atme8MXS/UvPxI2Cnv.js
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
var svg = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 0 6 C 0 2.686 2.686 0 6 0 C 9.314 0 12 2.686 12 6 C 12 9.314 9.314 12 6 12 C 2.686 12 0 9.314 0 6 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="12px" id="cPTa10O2f" transform="translate(6 3)" width="12px"/><path d="M 0 6 C 0 2.686 2.686 0 6 0 C 9.314 0 12 2.686 12 6 C 12 9.314 9.314 12 6 12 C 2.686 12 0 9.314 0 6 Z" fill="transparent" height="12px" id="K1KJBDfjt" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(6 3)" width="12px"/><path d="M 0 5.25 C 1.816 2.112 5.114 0 9 0 C 12.886 0 16.184 2.112 18 5.25" fill="transparent" height="5.25px" id="nuzXpJw0A" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3 15)" width="18px"/></svg>';
var getProps = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component = /* @__PURE__ */ React.forwardRef(function(props, ref) {
  const { style, className: className5, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps(props);
  const href = useSVGTemplate("1327812126", svg);
  return /* @__PURE__ */ _jsx(SVG, { ...restProps, className: cx("framer-vWtJe", className5), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx("use", { href }) });
});
var css = [`.framer-vWtJe { -webkit-mask: ${mask}; aspect-ratio: 1; display: block; mask: ${mask}; width: 24px; }`];
var Icon = withCSS(Component, css, "framer-vWtJe");
Icon.displayName = "User";
var UvPxI2Cnv_default = Icon;
addPropertyControls(Icon, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType.Number } });

// http-url:https://framerusercontent.com/modules/4xJsJPc59it6XmHEERsh/koUifyDPwJ9ohyYl3uMd/itu1soPCZ.js
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
var svg2 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 0 12 L 0 0 L 16.5 0 L 16.5 12 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="12px" id="gwB_ZdJt6" transform="translate(3.75 6)" width="16.5px"/><path d="M 0 0 L 16.5 0" fill="transparent" height="1px" id="xGkn4qbwc" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3.75 12)" width="16.5px"/><path d="M 0 0 L 16.5 0" fill="transparent" height="1px" id="uQ9bOFKFt" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3.75 6)" width="16.5px"/><path d="M 0 0 L 16.5 0" fill="transparent" height="1px" id="hrURkUe9P" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3.75 18)" width="16.5px"/></svg>';
var getProps2 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component2 = /* @__PURE__ */ React2.forwardRef(function(props, ref) {
  const { style, className: className5, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps2(props);
  const href = useSVGTemplate2("3559153988", svg2);
  return /* @__PURE__ */ _jsx2(SVG2, { ...restProps, className: cx2("framer-iZmZi", className5), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx2("use", { href }) });
});
var css2 = [`.framer-iZmZi { -webkit-mask: ${mask2}; aspect-ratio: 1; display: block; mask: ${mask2}; width: 24px; }`];
var Icon2 = withCSS2(Component2, css2, "framer-iZmZi");
Icon2.displayName = "List";
var itu1soPCZ_default = Icon2;
addPropertyControls2(Icon2, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType2.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType2.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType2.Number } });

// http-url:https://framerusercontent.com/modules/78wJr0q4vFZTRbgiA8bC/Y2EfGRGz13i3kdwNCKGk/gU109MUNe.js
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
var svg3 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 0 7.5 C 0 3.358 3.358 0 7.5 0 C 11.642 0 15 3.358 15 7.5 C 15 11.642 11.642 15 7.5 15 C 3.358 15 0 11.642 0 7.5 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="15px" id="i5oDhfGPs" transform="translate(3 3)" width="15px"/><path d="M 0 7.5 C 0 3.358 3.358 0 7.5 0 C 11.642 0 15 3.358 15 7.5 C 15 11.642 11.642 15 7.5 15 C 3.358 15 0 11.642 0 7.5 Z" fill="transparent" height="15px" id="g08Nvj3MZ" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3 3)" width="15px"/><path d="M 0 0 L 5.197 5.197" fill="transparent" height="5.196562499999999px" id="NQvjzSBYl" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(15.803 15.803)" width="5.196562499999999px"/></svg>';
var getProps3 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component3 = /* @__PURE__ */ React3.forwardRef(function(props, ref) {
  const { style, className: className5, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps3(props);
  const href = useSVGTemplate3("3899066744", svg3);
  return /* @__PURE__ */ _jsx3(SVG3, { ...restProps, className: cx3("framer-In32S", className5), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx3("use", { href }) });
});
var css3 = [`.framer-In32S { -webkit-mask: ${mask3}; aspect-ratio: 1; display: block; mask: ${mask3}; width: 24px; }`];
var Icon3 = withCSS3(Component3, css3, "framer-In32S");
Icon3.displayName = "Magnifying Glass";
var gU109MUNe_default = Icon3;
addPropertyControls3(Icon3, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType3.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType3.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType3.Number } });

// http-url:https://framerusercontent.com/modules/AaUsCN2P0PhEUfriOZlw/EqZufiIdbu8zZj2HlG8e/JfaLoQZWi.js
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
var svg4 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 2.404 8.651 C 2.584 9.3 3.175 9.75 3.848 9.75 L 13.115 9.75 C 13.789 9.75 14.38 9.301 14.56 8.651 L 16.958 0 L 0 0 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="9.750000027977563px" id="JexuerWiv" transform="translate(4.792 6.75)" width="16.9584375px"/><path d="M 0 1.5 C 0 0.672 0.672 0 1.5 0 C 2.328 0 3 0.672 3 1.5 C 3 2.328 2.328 3 1.5 3 C 0.672 3 0 2.328 0 1.5 Z" fill="var(--21h8s6, rgb(0, 0, 0))" height="3px" id="QcU5ASZ8j" transform="translate(6.75 18.75)" width="3px"/><path d="M 0 1.5 C 0 0.672 0.672 0 1.5 0 C 2.328 0 3 0.672 3 1.5 C 3 2.328 2.328 3 1.5 3 C 0.672 3 0 2.328 0 1.5 Z" fill="var(--21h8s6, rgb(0, 0, 0))" height="3px" id="Q0hrPRgBc" transform="translate(16.5 18.75)" width="3px"/><path d="M 0 0 L 2.25 0 L 5.695 12.401 C 5.876 13.05 6.466 13.5 7.14 13.5 L 16.406 13.5 C 17.08 13.5 17.672 13.051 17.852 12.401 L 20.25 3.75 L 3.292 3.75" fill="transparent" height="13.500000027977558px" id="LO6i_Yl07" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(1.5 3)" width="20.25px"/></svg>';
var getProps4 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component4 = /* @__PURE__ */ React4.forwardRef(function(props, ref) {
  const { style, className: className5, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps4(props);
  const href = useSVGTemplate4("1330623165", svg4);
  return /* @__PURE__ */ _jsx4(SVG4, { ...restProps, className: cx4("framer-xo4dj", className5), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx4("use", { href }) });
});
var css4 = [`.framer-xo4dj { -webkit-mask: ${mask4}; aspect-ratio: 1; display: block; mask: ${mask4}; width: 24px; }`];
var Icon4 = withCSS4(Component4, css4, "framer-xo4dj");
Icon4.displayName = "Shopping Cart Simple";
var JfaLoQZWi_default = Icon4;
addPropertyControls4(Icon4, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType4.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType4.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType4.Number } });

// http-url:https://framerusercontent.com/modules/GwyVGSn0iusAMwVJtKfW/IC41yaDVUcUdPrhi5z7v/cmltrm2mS.js
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
var svg5 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 9.75 16.5 C 9.75 16.5 0 11.25 0 5.063 C 0 2.267 2.267 0 5.063 0 C 7.18 0 8.994 1.154 9.75 3 C 10.506 1.154 12.32 0 14.438 0 C 17.233 0 19.5 2.267 19.5 5.063 C 19.5 11.25 9.75 16.5 9.75 16.5 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="16.5px" id="H5GNydsr5" transform="translate(2.25 4.5)" width="19.5px"/><path d="M 0 2.25 L 3.75 2.25 L 5.25 0 L 8.25 4.5 L 9.75 2.25 L 12 2.25" fill="transparent" height="4.5px" id="mOt6mRmMm" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(3 10.5)" width="12px"/><path d="M 0 5.25 C 0 5.187 0 5.125 0 5.063 C 0 2.267 2.267 0 5.063 0 C 7.18 0 8.994 1.154 9.75 3 C 10.506 1.154 12.32 0 14.438 0 C 17.233 0 19.5 2.267 19.5 5.063 C 19.5 11.25 9.75 16.5 9.75 16.5 C 9.75 16.5 5.813 14.381 2.946 11.25" fill="transparent" height="16.5px" id="yY59x4w8y" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(2.25 4.5)" width="19.5px"/></svg>';
var getProps5 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component5 = /* @__PURE__ */ React5.forwardRef(function(props, ref) {
  const { style, className: className5, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps5(props);
  const href = useSVGTemplate5("1486520514", svg5);
  return /* @__PURE__ */ _jsx5(SVG5, { ...restProps, className: cx5("framer-6ZQBa", className5), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx5("use", { href }) });
});
var css5 = [`.framer-6ZQBa { -webkit-mask: ${mask5}; aspect-ratio: 1; display: block; mask: ${mask5}; width: 24px; }`];
var Icon5 = withCSS5(Component5, css5, "framer-6ZQBa");
Icon5.displayName = "Heartbeat";
var cmltrm2mS_default = Icon5;
addPropertyControls5(Icon5, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType5.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType5.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType5.Number } });

// http-url:https://framerusercontent.com/modules/IB5zXkr98p2X2ozDVUxf/s2BBSvtpUArg6QLESyAO/AjQXGkQtG.js
import { jsx as _jsx6 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls6, ControlType as ControlType6, cx as cx6, motion as motion6, useSVGTemplate as useSVGTemplate6, withCSS as withCSS6 } from "./_framer-runtime.js";
import * as React6 from "react";
import { forwardRef as forwardRef12 } from "react";
var mask6 = "var(--framer-icon-mask)";
var Base6 = /* @__PURE__ */ forwardRef12(function(props, ref) {
  return /* @__PURE__ */ _jsx6("svg", { ...props, ref, children: props.children });
});
var MotionSVG6 = motion6.create(Base6);
var SVG6 = /* @__PURE__ */ forwardRef12((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx6(MotionSVG6, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx6("svg", { ...rest, ref, children });
});
var svg6 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 1.5 19.5 C 0.672 19.5 0 18.828 0 18 L 0 1.5 C 0 0.672 0.672 0 1.5 0 L 15 0 C 15.828 0 16.5 0.672 16.5 1.5 L 16.5 18 C 16.5 18.828 15.828 19.5 15 19.5 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="19.5px" id="wR9OmJoPn" transform="translate(3.75 2.25)" width="16.5px"/><path d="M 5.25 10.5 L 5.25 9 C 8.15 9 10.5 6.985 10.5 4.5 C 10.5 2.015 8.15 0 5.25 0 C 2.35 0 0 2.015 0 4.5" fill="transparent" height="10.5px" id="OoB4WpSfR" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(6.75 4.5)" width="10.5px"/><path d="M 0 1.5 C 0 0.672 0.672 0 1.5 0 C 2.328 0 3 0.672 3 1.5 C 3 2.328 2.328 3 1.5 3 C 0.672 3 0 2.328 0 1.5 Z" fill="var(--21h8s6, rgb(0, 0, 0))" height="3px" id="eY3BK1jLi" transform="translate(10.5 18)" width="3px"/></svg>';
var getProps6 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component6 = /* @__PURE__ */ React6.forwardRef(function(props, ref) {
  const { style, className: className5, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps6(props);
  const href = useSVGTemplate6("3270379688", svg6);
  return /* @__PURE__ */ _jsx6(SVG6, { ...restProps, className: cx6("framer-EuS1Y", className5), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx6("use", { href }) });
});
var css6 = [`.framer-EuS1Y { -webkit-mask: ${mask6}; aspect-ratio: 1; display: block; mask: ${mask6}; width: 24px; }`];
var Icon6 = withCSS6(Component6, css6, "framer-EuS1Y");
Icon6.displayName = "Question Mark";
var AjQXGkQtG_default = Icon6;
addPropertyControls6(Icon6, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType6.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType6.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType6.Number } });

// http-url:https://framerusercontent.com/modules/SUBEdtCFaOJwrjN2Inhk/bznEUerLEqVVXGfsDOYE/pKERsxd4H.js
import { jsx as _jsx7 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls7, ControlType as ControlType7, cx as cx7, motion as motion7, useSVGTemplate as useSVGTemplate7, withCSS as withCSS7 } from "./_framer-runtime.js";
import * as React7 from "react";
import { forwardRef as forwardRef14 } from "react";
var mask7 = "var(--framer-icon-mask)";
var Base7 = /* @__PURE__ */ forwardRef14(function(props, ref) {
  return /* @__PURE__ */ _jsx7("svg", { ...props, ref, children: props.children });
});
var MotionSVG7 = motion7.create(Base7);
var SVG7 = /* @__PURE__ */ forwardRef14((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx7(MotionSVG7, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx7("svg", { ...rest, ref, children });
});
var svg7 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 3.75 0 L 0 11.25 L 7.5 11.25 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="11.25px" id="q_nKPtBGJ" transform="translate(2.25 6)" width="7.5px"/><path d="M 0 4.125 C 0 1.847 1.847 0 4.125 0 C 6.403 0 8.25 1.847 8.25 4.125 C 8.25 6.403 6.403 8.25 4.125 8.25 C 1.847 8.25 0 6.403 0 4.125 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="8.25px" id="MpPyBdaZ4" transform="translate(10.5 3)" width="8.25px"/><path d="M 0 5.25 L 0 0 L 8.25 0 L 8.25 5.25 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="5.25px" id="vndv5ExCK" transform="translate(12.75 14.25)" width="8.25px"/><path d="M 3.75 0 L 0 11.25 L 7.5 11.25 Z" fill="transparent" height="11.25px" id="vm9iwQat7" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(2.25 6)" width="7.5px"/><path d="M 0 4.125 C 0 1.847 1.847 0 4.125 0 C 6.403 0 8.25 1.847 8.25 4.125 C 8.25 6.403 6.403 8.25 4.125 8.25 C 1.847 8.25 0 6.403 0 4.125 Z" fill="transparent" height="8.25px" id="ZJXViX94I" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(10.5 3)" width="8.25px"/><path d="M 0 5.25 L 0 0 L 8.25 0 L 8.25 5.25 Z" fill="transparent" height="5.25px" id="sATOM9inG" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(12.75 14.25)" width="8.25px"/></svg>';
var getProps7 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component7 = /* @__PURE__ */ React7.forwardRef(function(props, ref) {
  const { style, className: className5, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps7(props);
  const href = useSVGTemplate7("3151112179", svg7);
  return /* @__PURE__ */ _jsx7(SVG7, { ...restProps, className: cx7("framer-c2uAX", className5), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx7("use", { href }) });
});
var css7 = [`.framer-c2uAX { -webkit-mask: ${mask7}; aspect-ratio: 1; display: block; mask: ${mask7}; width: 24px; }`];
var Icon7 = withCSS7(Component7, css7, "framer-c2uAX");
Icon7.displayName = "Shapes";
var pKERsxd4H_default = Icon7;
addPropertyControls7(Icon7, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType7.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType7.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType7.Number } });

// http-url:https://framerusercontent.com/modules/wbL0GysLpUpZOLelXsKU/7IhRlKXIvqCTv7OUjGRe/q95pf4lLL.js
import { jsx as _jsx8 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls8, ControlType as ControlType8, cx as cx8, motion as motion8, useSVGTemplate as useSVGTemplate8, withCSS as withCSS8 } from "./_framer-runtime.js";
import * as React8 from "react";
import { forwardRef as forwardRef16 } from "react";
var mask8 = "var(--framer-icon-mask)";
var Base8 = /* @__PURE__ */ forwardRef16(function(props, ref) {
  return /* @__PURE__ */ _jsx8("svg", { ...props, ref, children: props.children });
});
var MotionSVG8 = motion8.create(Base8);
var SVG8 = /* @__PURE__ */ forwardRef16((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx8(MotionSVG8, { ...rest, layoutId, ref, children }) : /* @__PURE__ */ _jsx8("svg", { ...rest, ref, children });
});
var svg8 = '<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 1.5 16.5 C 0.672 16.5 0 15.828 0 15 L 0 1.5 C 0 0.672 0.672 0 1.5 0 L 15 0 C 15.828 0 16.5 0.672 16.5 1.5 L 16.5 15 C 16.5 15.828 15.828 16.5 15 16.5 Z" fill-opacity="var(--1m6trwb, 0)" fill="var(--21h8s6, rgb(0, 0, 0))" height="16.5px" id="LjE0Ycn76" transform="translate(3.75 3.75)" width="16.5px"/><path d="M 13.5 0 L 0 13.5" fill="var(--21h8s6, rgb(0, 0, 0))" height="13.5px" id="oSDwjLCvX" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(5.25 5.25)" width="13.5px"/><path d="M 13.5 13.5 L 0 0" fill="var(--21h8s6, rgb(0, 0, 0))" height="13.5px" id="H9XwXWiXU" stroke-dasharray="" stroke-linecap="round" stroke-linejoin="round" stroke-width="var(--pgex8v, 1.5)" stroke="var(--21h8s6, rgb(0, 0, 0))" transform="translate(5.25 5.25)" width="13.5px"/></svg>';
var getProps8 = ({ alpha, color, height, id, width, width1, ...props }) => {
  return { ...props, ezTt3ayMo: color ?? props.ezTt3ayMo ?? "rgb(0, 0, 0)", lschgej4H: width1 ?? props.lschgej4H ?? 1.5, qxTvv_EBh: alpha ?? props.qxTvv_EBh };
};
var Component8 = /* @__PURE__ */ React8.forwardRef(function(props, ref) {
  const { style, className: className5, layoutId, variant, ezTt3ayMo, lschgej4H, qxTvv_EBh, ...restProps } = getProps8(props);
  const href = useSVGTemplate8("2202960551", svg8);
  return /* @__PURE__ */ _jsx8(SVG8, { ...restProps, className: cx8("framer-AhL2C", className5), layoutId, ref, role: "presentation", style: { "--1m6trwb": qxTvv_EBh, "--21h8s6": ezTt3ayMo, "--pgex8v": lschgej4H, ...style }, viewBox: "0 0 24 24", children: /* @__PURE__ */ _jsx8("use", { href }) });
});
var css8 = [`.framer-AhL2C { -webkit-mask: ${mask8}; aspect-ratio: 1; display: block; mask: ${mask8}; width: 24px; }`];
var Icon8 = withCSS8(Component8, css8, "framer-AhL2C");
Icon8.displayName = "X";
var q95pf4lLL_default = Icon8;
addPropertyControls8(Icon8, { ezTt3ayMo: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Color", type: ControlType8.Color }, lschgej4H: { defaultValue: 1.5, displayStepper: true, hidden: false, max: 6, min: 0, step: 0.5, title: "Width", type: ControlType8.Number }, qxTvv_EBh: { defaultValue: 0, displayStepper: true, hidden: false, max: 1, min: 0, step: 0.1, title: "Alpha", type: ControlType8.Number } });

// http-url:https://framerusercontent.com/modules/OOzFZT1jJVtmOoY91ant/lcaWIA0glUedXcFQxlTz/fE2WzAJjM.js
import { jsx as _jsx15, jsxs as _jsxs7 } from "react/jsx-runtime";
import { addFonts, ComponentViewportProvider, cx as cx9, getFonts, getFontsFromSharedStyle, RichText, SmartComponentScopedContainer, useComponentViewport, useLocaleInfo as useLocaleInfo9, useVariantState, withCSS as withCSS10 } from "./_framer-runtime.js";
import { LayoutGroup, motion as motion15, MotionConfigContext } from "framer-motion";
import * as React13 from "react";
import { useRef as useRef7 } from "react";

// http-url:https://framerusercontent.com/modules/6wAE2eMb2Tl3zrU7u4UL/mKj6QS2p4Cgdaa0WrZKY/Search.js
import { jsx as _jsx14, jsxs as _jsxs6 } from "react/jsx-runtime";
import { createPortal } from "react-dom";
import { useRef as useRef6, useState as useState10, useEffect as useEffect10, forwardRef as forwardRef21 } from "react";
import { AnimatePresence, motion as motion14 } from "framer-motion";

// http-url:https://framerusercontent.com/modules/LV9trClbmNwd5PVj9l8y/L4rFqMGNzGSwRZpGTGF3/Icons.js
import { jsx as _jsx9, jsxs as _jsxs } from "react/jsx-runtime";
import { motion as motion9 } from "framer-motion";
function SearchIcon(props) {
  return /* @__PURE__ */ _jsx9("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 256 256", width: props.width, height: props.height, style: { ...props.style, color: props.color }, children: /* @__PURE__ */ _jsx9("path", { d: "M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z", fill: "currentColor" }) });
}
function ClearIcon(props) {
  return /* @__PURE__ */ _jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 256 256", ...props, children: [/* @__PURE__ */ _jsx9("rect", { width: "256", height: "256", fill: "none" }), /* @__PURE__ */ _jsx9("path", { d: "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm37.66,130.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32L139.31,128Z", fill: "currentColor" })] });
}
function SpinnerIcon(props) {
  const borderWidth = 3;
  return /* @__PURE__ */ _jsxs("div", { style: { position: "relative", ...props.style }, children: [/* @__PURE__ */ _jsx9(motion9.div, { animate: { rotate: 360 }, transition: { ease: "linear", duration: 1, repeat: Infinity }, style: { borderRadius: 100, backgroundImage: `conic-gradient(from 270deg, transparent 0%, ${props.color} 100%)`, width: "100%", height: "100%" } }), /* @__PURE__ */ _jsx9("div", { style: { backgroundColor: props.backgroundColor, borderRadius: 100, position: "absolute", top: borderWidth, left: borderWidth, bottom: borderWidth, right: borderWidth } })] });
}

// http-url:https://framerusercontent.com/modules/6wAE2eMb2Tl3zrU7u4UL/mKj6QS2p4Cgdaa0WrZKY/Search.js
import { addPropertyControls as addPropertyControls9, ControlType as ControlType9, RenderTarget, withCSS as withCSS9 } from "./_framer-runtime.js";

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/lCNMpf6DznmmCJRndYjM/SearchModal.js
import { jsx as _jsx13, jsxs as _jsxs5 } from "react/jsx-runtime";

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/1vZ2fdkLJI4IprrVTHqR/useSearch.js
import { useLocaleInfo as useLocaleInfo7 } from "./_framer-runtime.js";
import { clamp as clamp7 } from "framer-motion";
import { useEffect as useEffect7, useState as useState7, useTransition as useTransition4 } from "react";

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/1GynhDlRW7uuXFYW1RXb/SearchModal.js
import { jsx as _jsx12, jsxs as _jsxs4 } from "react/jsx-runtime";

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/fpvHBWGoGQcWezUopJLS/useSearch.js
import { useLocaleInfo as useLocaleInfo5 } from "./_framer-runtime.js";
import { clamp as clamp5 } from "framer-motion";
import { useEffect as useEffect5, useState as useState5, useTransition as useTransition3 } from "react";

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/bsLTiXYjkHoD2XaMjabu/SearchModal.js
import { jsx as _jsx11, jsxs as _jsxs3 } from "react/jsx-runtime";

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/G59GwobMNJqwSjtPO6Pv/useSearch.js
import { useLocaleInfo as useLocaleInfo3 } from "./_framer-runtime.js";
import { clamp as clamp3 } from "framer-motion";
import { useEffect as useEffect3, useState as useState3, useTransition as useTransition2 } from "react";

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/wgITiHCOZBBo33pin0wW/SearchModal.js
import { jsx as _jsx10, jsxs as _jsxs2 } from "react/jsx-runtime";

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/IOZYtsQMauhTmjY894DM/useSearch.js
import { useLocaleInfo } from "./_framer-runtime.js";
import { clamp } from "framer-motion";
import { useEffect, useState, useTransition } from "react";

// http-url:https://framerusercontent.com/modules/3Xi2AslpcDRhfyCVPmx3/d0Oobr5BHnVqZJQyMdGn/storage.js
function Storage(name) {
  this.ready = new Promise((resolve, reject) => {
    var request = __dai_window.indexedDB.open(location.origin);
    request.onupgradeneeded = (e) => {
      this.db = e.target["result"];
      this.db.createObjectStore("store");
    };
    request.onsuccess = (e) => {
      this.db = e.target["result"];
      resolve();
    };
    request.onerror = (e) => {
      this.db = e.target["result"];
      reject(e);
    };
  });
}
Storage.prototype.get = function(key) {
  return this.ready.then(() => {
    return new Promise((resolve, reject) => {
      var request = this.getStore().get(key);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = reject;
    });
  });
};
Storage.prototype.getStore = function() {
  return this.db.transaction([
    "store"
  ], "readwrite").objectStore("store");
};
Storage.prototype.set = function(key, value) {
  return this.ready.then(() => {
    return new Promise((resolve, reject) => {
      var request = this.getStore().put(value, key);
      request.onsuccess = resolve;
      request.onerror = reject;
    });
  });
};
Storage.prototype.delete = function(key, value) {
  __dai_window.indexedDB.deleteDatabase(location.origin);
};

// http-url:https://framerusercontent.com/modules/m2nL4qHNbqX9QCxsHsGL/b9aplVZjN51x28yfNK16/cache.js
async function setCachedData(url, dataToCache, cache = new Storage("cache")) {
  const cacheKey = url;
  const data = await cache.set(cacheKey, dataToCache);
}
async function checkForCachedData(url, cache = new Storage("cache")) {
  const cacheKey = url;
  const data = await cache.get(cacheKey);
  if (data) {
    return data;
  } else {
    return null;
  }
}

// http-url:https://framerusercontent.com/modules/uU1mtMKXsrVAg8N5hW7w/v7gDLwKJgQ5vAsFHxY4H/cachedIndex.js
var VERSION = 1;
function isDefaultLocaleId(localeId) {
  return !localeId || localeId === "default";
}
var INDEX_KEY = "searchIndexCache";
function getIndexKey(localeId) {
  if (isDefaultLocaleId(localeId))
    return INDEX_KEY;
  return `${INDEX_KEY}-${localeId}`;
}
var METADATA_KEY = "searchCacheMetadata";
function getMetadataKey(localeId) {
  if (isDefaultLocaleId(localeId))
    return METADATA_KEY;
  return `${METADATA_KEY}-${localeId}`;
}
async function getCachedIndex(localeId, indexHash) {
  const metadataKey = getMetadataKey(localeId);
  const indexKey = getIndexKey(localeId);
  const [metadata, cachedIndex] = await Promise.all([checkForCachedData(metadataKey), checkForCachedData(indexKey)]);
  if (cachedIndex) {
    return { status: indexHash && metadata?.indexHash === indexHash ? "fresh" : "stale", searchIndex: cachedIndex, indexHash: metadata?.indexHash };
  }
  return { status: "miss" };
}
function setCachedIndex(localeId, index, indexHash) {
  const indexKey = getIndexKey(localeId);
  setCachedData(indexKey, index);
  const metadata = { version: VERSION, timestamp: Date.now(), indexHash };
  const metadataKey = getMetadataKey(localeId);
  setCachedData(metadataKey, metadata);
}

// http-url:https://framerusercontent.com/modules/K9JZRwJcE6slDAf8rUmh/mJ54py1Ecnn1RoC4N1m4/fakeResults.js
var fakeResults = { "/": { version: 1, title: "Example Search Result", description: "Description of search result.", keywords: "", h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], p: [], url: "/example-url/", codeblock: [] }, "/example-1": { version: 1, title: "Publish your Site to Search", description: "Try Site Search to instantly search your Framer site content.", keywords: "", h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], p: [], url: "/example-url/1/", codeblock: [] }, "/example-2": { version: 1, title: "Customise your Site Search", description: "Personalize everything from corner radius, to icon weight.", keywords: "", h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], p: [], url: "/example-url/2/", codeblock: [] } };

// http-url:https://framerusercontent.com/modules/TwRgbWuhHeB95MPifel4/YW8Hlm59FG3PajbrVsaR/fuzzySearch.js
var peq = new Uint32Array(65536);
var myers_32 = (a, b) => {
  const n = a.length;
  const m = b.length;
  const lst = 1 << n - 1;
  let pv = -1;
  let mv = 0;
  let sc = n;
  let i = n;
  while (i--) {
    peq[a.charCodeAt(i)] |= 1 << i;
  }
  for (i = 0; i < m; i++) {
    let eq = peq[b.charCodeAt(i)];
    const xv = eq | mv;
    eq |= (eq & pv) + pv ^ pv;
    mv |= ~(eq | pv);
    pv &= eq;
    if (mv & lst) {
      sc++;
    }
    if (pv & lst) {
      sc--;
    }
    mv = mv << 1 | 1;
    pv = pv << 1 | ~(xv | mv);
    mv &= xv;
  }
  i = n;
  while (i--) {
    peq[a.charCodeAt(i)] = 0;
  }
  return sc;
};
var myers_x = (b, a) => {
  const n = a.length;
  const m = b.length;
  const mhc = [];
  const phc = [];
  const hsize = Math.ceil(n / 32);
  const vsize = Math.ceil(m / 32);
  for (let i = 0; i < hsize; i++) {
    phc[i] = -1;
    mhc[i] = 0;
  }
  let j = 0;
  for (; j < vsize - 1; j++) {
    let mv = 0;
    let pv = -1;
    const start = j * 32;
    const vlen = Math.min(32, m) + start;
    for (let k = start; k < vlen; k++) {
      peq[b.charCodeAt(k)] |= 1 << k;
    }
    for (let i1 = 0; i1 < n; i1++) {
      const eq = peq[a.charCodeAt(i1)];
      const pb = phc[i1 / 32 | 0] >>> i1 & 1;
      const mb = mhc[i1 / 32 | 0] >>> i1 & 1;
      const xv = eq | mv;
      const xh = ((eq | mb) & pv) + pv ^ pv | eq | mb;
      let ph = mv | ~(xh | pv);
      let mh = pv & xh;
      if (ph >>> 31 ^ pb) {
        phc[i1 / 32 | 0] ^= 1 << i1;
      }
      if (mh >>> 31 ^ mb) {
        mhc[i1 / 32 | 0] ^= 1 << i1;
      }
      ph = ph << 1 | pb;
      mh = mh << 1 | mb;
      pv = mh | ~(xv | ph);
      mv = ph & xv;
    }
    for (let k1 = start; k1 < vlen; k1++) {
      peq[b.charCodeAt(k1)] = 0;
    }
  }
  let mv1 = 0;
  let pv1 = -1;
  const start1 = j * 32;
  const vlen1 = Math.min(32, m - start1) + start1;
  for (let k2 = start1; k2 < vlen1; k2++) {
    peq[b.charCodeAt(k2)] |= 1 << k2;
  }
  let score = m;
  for (let i2 = 0; i2 < n; i2++) {
    const eq1 = peq[a.charCodeAt(i2)];
    const pb1 = phc[i2 / 32 | 0] >>> i2 & 1;
    const mb1 = mhc[i2 / 32 | 0] >>> i2 & 1;
    const xv1 = eq1 | mv1;
    const xh1 = ((eq1 | mb1) & pv1) + pv1 ^ pv1 | eq1 | mb1;
    let ph1 = mv1 | ~(xh1 | pv1);
    let mh1 = pv1 & xh1;
    score += ph1 >>> m - 1 & 1;
    score -= mh1 >>> m - 1 & 1;
    if (ph1 >>> 31 ^ pb1) {
      phc[i2 / 32 | 0] ^= 1 << i2;
    }
    if (mh1 >>> 31 ^ mb1) {
      mhc[i2 / 32 | 0] ^= 1 << i2;
    }
    ph1 = ph1 << 1 | pb1;
    mh1 = mh1 << 1 | mb1;
    pv1 = mh1 | ~(xv1 | ph1);
    mv1 = ph1 & xv1;
  }
  for (let k3 = start1; k3 < vlen1; k3++) {
    peq[b.charCodeAt(k3)] = 0;
  }
  return score;
};
var distance = (a, b) => {
  if (a.length < b.length) {
    const tmp = b;
    b = a;
    a = tmp;
  }
  if (b.length === 0) {
    return a.length;
  }
  if (a.length <= 32) {
    return myers_32(a, b);
  }
  return myers_x(a, b);
};

// http-url:https://framerusercontent.com/modules/MWsEnYfRnoOQq31DN4ql/fxR5MNtgeSOU8Mj4iY9n/utils.js
var localStorageDebugFlag = (() => {
  try {
    return typeof __dai_window !== "undefined" && __dai_window.localStorage.__framerDebugSearch === "true";
  } catch (e) {
  }
})();
var groupsRegex = /[A-Z]{2,}|[A-Z][a-z]+|[a-z]+|[A-Z]\d*|\d+/gu;
function capitalizeFirstLetter(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function titleCase(value) {
  const groups = value.match(groupsRegex) || [];
  return groups.map(capitalizeFirstLetter).join(" ");
}
function clampText(text, maxLength) {
  const textLength = text.length;
  if (textLength <= maxLength) {
    return text;
  }
  const slicedText = text.slice(0, maxLength);
  if (textLength > maxLength) {
    return slicedText + "\u2026";
  }
  return slicedText;
}
function isEmptyObject(object) {
  return Object.keys(object).length === 0;
}
function createLogger(showOutput) {
  function log5(...data) {
    console.log(Date.now(), ...data);
  }
  function time5(label) {
    console.time(label);
  }
  function timeEnd5(label) {
    console.timeEnd(label);
  }
  function noop() {
  }
  if (!showOutput) {
    return { log: noop, time: noop, timeEnd: noop };
  }
  return { log: log5, time: time5, timeEnd: timeEnd5 };
}
var DEFAULT_FONT_FAMILY = `"Inter", system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`;
function getFontFamily(theme) {
  if (theme.inputFont?.fontFamily)
    return theme.inputFont.fontFamily;
  if (theme.titleFont?.fontFamily)
    return theme.titleFont.fontFamily;
  if (theme.subtitleFont?.fontFamily)
    return theme.subtitleFont.fontFamily;
  return DEFAULT_FONT_FAMILY;
}
function animationKeyFromLayout(layout) {
  return `${layout}Animation`;
}
var safeDocument = typeof document !== "undefined" ? document : null;
var safeWindow = typeof __dai_window !== "undefined" ? __dai_window : null;
var metaTagSelector = 'meta[name="framer-search-index"]';
function getMetaTagContent() {
  const metaTag = safeDocument?.querySelector(metaTagSelector);
  if (!metaTag)
    return void 0;
  const metaTagContent = metaTag.getAttribute("content");
  return metaTagContent;
}
var checkIfOverLimit = () => {
  return getMetaTagContent() === "limit-reached";
};
function stripLocaleSlugFromPath(url, localeSlug) {
  if (!localeSlug)
    return url;
  const localeSlugWithSlash = `/${localeSlug}`;
  if (url.startsWith(localeSlugWithSlash)) {
    return url.slice(localeSlugWithSlash.length);
  }
}
function yieldToMain(isHighPriority) {
  if ("scheduler" in __dai_window) {
    const options = { priority: isHighPriority ? "user-blocking" : "user-visible" };
    if ("yield" in scheduler)
      return scheduler.yield(options);
    if ("postTask" in scheduler)
      return scheduler.postTask(() => {
      }, options);
  }
  if (isHighPriority) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/IOZYtsQMauhTmjY894DM/useSearch.js
var { log, time, timeEnd } = createLogger(localStorageDebugFlag);
var splitWordsRegex = (() => {
  try {
    const regex = RegExp("[\\s.,;!?\\p{P}\\p{Z}]+(?<!\\p{L}&)(?!&\\p{L})", "u");
    "".split(regex);
    return regex;
  } catch {
    log("Falling back to regex without lookbehind");
    return RegExp("[\\s.,;!?\\p{P}\\p{Z}]+", "u");
  }
})();

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/wgITiHCOZBBo33pin0wW/SearchModal.js
import React9, { useEffect as useEffect2, useState as useState2, useMemo, forwardRef as forwardRef17, useRef as useRef2, useDeferredValue, useLayoutEffect, useCallback as useCallback2, useImperativeHandle } from "react";

// http-url:https://framerusercontent.com/modules/PJVBcBLmDteTEAZh3J9Z/keXJyjyE9VnzUcDMayjg/browser.js
var Browser;
(function(Browser2) {
  var isTouch = Browser2.isTouch = () => "ontouchstart" in __dai_window || __dai_navigator.maxTouchPoints > 0;
  var isChrome = Browser2.isChrome = () => __dai_navigator.userAgent.toLowerCase().includes("chrome/");
  var isWebKit = Browser2.isWebKit = () => __dai_navigator.userAgent.toLowerCase().includes("applewebkit/");
  var isSafari = Browser2.isSafari = () => isWebKit() && !isChrome();
  var isSafariDesktop = Browser2.isSafariDesktop = () => isSafari() && !isTouch();
  var isWindows = Browser2.isWindows = () => /Win/.test(__dai_navigator.platform);
  var isMacOS = Browser2.isMacOS = () => /Mac/.test(__dai_navigator.platform);
})(Browser || (Browser = {}));

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/wgITiHCOZBBo33pin0wW/SearchModal.js
import { motion as motion10, clamp as clamp2, useAnimate } from "framer-motion";

// http-url:https://framerusercontent.com/modules/Gzef0nFihI9m9vZG45th/lIUxbZcreiDm2GzUkt3y/useCallbackOnMouseMove.js
import { useRef, useCallback } from "react";
var useCallbackOnMouseMove = (callback, mousePositionRef) => {
  const prevPositionRef = useRef(null);
  return useCallback((event) => {
    if (!Browser.isSafari())
      return callback(event);
    const ref = mousePositionRef ? mousePositionRef : prevPositionRef;
    const { clientX, clientY } = event;
    const prevCursorPosition = ref.current;
    ref.current = { x: clientX, y: clientY };
    if (!prevCursorPosition) {
      return;
    }
    if (prevCursorPosition.x !== clientX || prevCursorPosition.y !== clientY) {
      return callback(event);
    }
  }, [mousePositionRef, callback]);
};

// http-url:https://framerusercontent.com/modules/eAnjm75CdfYT1Zz4BIaz/7KDSfnnyD1T3Ap75L4m8/scrollIntoView.js
function scrollIntoView(targetElement, scrollElement, { offsetTop, offsetBottom }) {
  const targetElementBounds = targetElement.getBoundingClientRect();
  const scrollElementBounds = scrollElement.getBoundingClientRect();
  if (targetElementBounds.top < scrollElementBounds.top) {
    const difference = scrollElementBounds.top - targetElementBounds.top;
    scrollElement.scrollTop = scrollElement.scrollTop - difference - offsetTop;
  } else if (targetElementBounds.bottom > scrollElementBounds.bottom) {
    const topAligned = scrollElementBounds.top - targetElementBounds.top;
    const minOffset = scrollElement.scrollTop - topAligned - offsetTop;
    const bottomAligned = targetElementBounds.bottom - scrollElementBounds.bottom;
    const offset = scrollElement.scrollTop + bottomAligned + offsetBottom;
    scrollElement.scrollTop = Math.min(minOffset, offset);
  }
}

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/wgITiHCOZBBo33pin0wW/SearchModal.js
import {
  useLocaleInfo as useLocaleInfo2,
  useRouter,
  inferInitialRouteFromPath
} from "./_framer-runtime.js";
var SearchInputClearButtonType;
(function(SearchInputClearButtonType5) {
  SearchInputClearButtonType5["Icon"] = "icon";
  SearchInputClearButtonType5["Text"] = "text";
  SearchInputClearButtonType5["None"] = "none";
})(SearchInputClearButtonType || (SearchInputClearButtonType = {}));
var SearchInputDividerType;
(function(SearchInputDividerType5) {
  SearchInputDividerType5["None"] = "none";
  SearchInputDividerType5["FullWidth"] = "fullWidth";
  SearchInputDividerType5["Contained"] = "contained";
})(SearchInputDividerType || (SearchInputDividerType = {}));
var SearchResultTitleType;
(function(SearchResultTitleType5) {
  SearchResultTitleType5["H1"] = "h1";
  SearchResultTitleType5["Title"] = "title";
})(SearchResultTitleType || (SearchResultTitleType = {}));
var SearchResultSubtitleType;
(function(SearchResultSubtitleType5) {
  SearchResultSubtitleType5["Description"] = "description";
  SearchResultSubtitleType5["Path"] = "path";
})(SearchResultSubtitleType || (SearchResultSubtitleType = {}));
var SearchResultItemType;
(function(SearchResultItemType5) {
  SearchResultItemType5["FullWidth"] = "fullWidth";
  SearchResultItemType5["Contained"] = "contained";
})(SearchResultItemType || (SearchResultItemType = {}));
var SearchLayoutType;
(function(SearchLayoutType5) {
  SearchLayoutType5["Sidebar"] = "Sidebar";
  SearchLayoutType5["FixedTop"] = "FixedTop";
  SearchLayoutType5["QuickMenu"] = "QuickMenu";
})(SearchLayoutType || (SearchLayoutType = {}));
var SearchEntryType;
(function(SearchEntryType5) {
  SearchEntryType5["Icon"] = "icon";
  SearchEntryType5["Text"] = "text";
})(SearchEntryType || (SearchEntryType = {}));
var SearchIconType;
(function(SearchIconType5) {
  SearchIconType5["Default"] = "default";
  SearchIconType5["Custom"] = "custom";
})(SearchIconType || (SearchIconType = {}));

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/G59GwobMNJqwSjtPO6Pv/useSearch.js
var { log: log2, time: time2, timeEnd: timeEnd2 } = createLogger(localStorageDebugFlag);
var splitWordsRegex2 = (() => {
  try {
    const regex = RegExp("[\\s.,;!?\\p{P}\\p{Z}]+(?<!\\p{L}&)(?!&\\p{L})", "u");
    "".split(regex);
    return regex;
  } catch {
    log2("Falling back to regex without lookbehind");
    return RegExp("[\\s.,;!?\\p{P}\\p{Z}]+", "u");
  }
})();

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/bsLTiXYjkHoD2XaMjabu/SearchModal.js
import React10, { useEffect as useEffect4, useState as useState4, useMemo as useMemo2, forwardRef as forwardRef18, useRef as useRef3, useDeferredValue as useDeferredValue2, useLayoutEffect as useLayoutEffect2, useCallback as useCallback3, useImperativeHandle as useImperativeHandle2 } from "react";
import { motion as motion11, clamp as clamp4, useAnimate as useAnimate2 } from "framer-motion";
import {
  useLocaleInfo as useLocaleInfo4,
  useRouter as useRouter2,
  inferInitialRouteFromPath as inferInitialRouteFromPath2
} from "./_framer-runtime.js";
var SearchInputClearButtonType2;
(function(SearchInputClearButtonType5) {
  SearchInputClearButtonType5["Icon"] = "icon";
  SearchInputClearButtonType5["Text"] = "text";
  SearchInputClearButtonType5["None"] = "none";
})(SearchInputClearButtonType2 || (SearchInputClearButtonType2 = {}));
var SearchInputDividerType2;
(function(SearchInputDividerType5) {
  SearchInputDividerType5["None"] = "none";
  SearchInputDividerType5["FullWidth"] = "fullWidth";
  SearchInputDividerType5["Contained"] = "contained";
})(SearchInputDividerType2 || (SearchInputDividerType2 = {}));
var SearchResultTitleType2;
(function(SearchResultTitleType5) {
  SearchResultTitleType5["H1"] = "h1";
  SearchResultTitleType5["Title"] = "title";
})(SearchResultTitleType2 || (SearchResultTitleType2 = {}));
var SearchResultSubtitleType2;
(function(SearchResultSubtitleType5) {
  SearchResultSubtitleType5["Description"] = "description";
  SearchResultSubtitleType5["Path"] = "path";
})(SearchResultSubtitleType2 || (SearchResultSubtitleType2 = {}));
var SearchResultItemType2;
(function(SearchResultItemType5) {
  SearchResultItemType5["FullWidth"] = "fullWidth";
  SearchResultItemType5["Contained"] = "contained";
})(SearchResultItemType2 || (SearchResultItemType2 = {}));
var SearchLayoutType2;
(function(SearchLayoutType5) {
  SearchLayoutType5["Sidebar"] = "Sidebar";
  SearchLayoutType5["FixedTop"] = "FixedTop";
  SearchLayoutType5["QuickMenu"] = "QuickMenu";
})(SearchLayoutType2 || (SearchLayoutType2 = {}));
var SearchEntryType2;
(function(SearchEntryType5) {
  SearchEntryType5["Icon"] = "icon";
  SearchEntryType5["Text"] = "text";
})(SearchEntryType2 || (SearchEntryType2 = {}));
var SearchIconType2;
(function(SearchIconType5) {
  SearchIconType5["Default"] = "default";
  SearchIconType5["Custom"] = "custom";
})(SearchIconType2 || (SearchIconType2 = {}));

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/fpvHBWGoGQcWezUopJLS/useSearch.js
var { log: log3, time: time3, timeEnd: timeEnd3 } = createLogger(localStorageDebugFlag);
var splitWordsRegex3 = (() => {
  try {
    const regex = RegExp("[\\s.,;!?\\p{P}\\p{Z}]+(?<!\\p{L}&)(?!&\\p{L})", "u");
    "".split(regex);
    return regex;
  } catch {
    log3("Falling back to regex without lookbehind");
    return RegExp("[\\s.,;!?\\p{P}\\p{Z}]+", "u");
  }
})();

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/1GynhDlRW7uuXFYW1RXb/SearchModal.js
import React11, { useEffect as useEffect6, useState as useState6, useMemo as useMemo3, forwardRef as forwardRef19, useRef as useRef4, useDeferredValue as useDeferredValue3, useLayoutEffect as useLayoutEffect3, useCallback as useCallback4, useImperativeHandle as useImperativeHandle3 } from "react";
import { motion as motion12, clamp as clamp6, useAnimate as useAnimate3 } from "framer-motion";
import {
  useLocaleInfo as useLocaleInfo6,
  useRouter as useRouter3,
  inferInitialRouteFromPath as inferInitialRouteFromPath3
} from "./_framer-runtime.js";
var SearchInputClearButtonType3;
(function(SearchInputClearButtonType5) {
  SearchInputClearButtonType5["Icon"] = "icon";
  SearchInputClearButtonType5["Text"] = "text";
  SearchInputClearButtonType5["None"] = "none";
})(SearchInputClearButtonType3 || (SearchInputClearButtonType3 = {}));
var SearchInputDividerType3;
(function(SearchInputDividerType5) {
  SearchInputDividerType5["None"] = "none";
  SearchInputDividerType5["FullWidth"] = "fullWidth";
  SearchInputDividerType5["Contained"] = "contained";
})(SearchInputDividerType3 || (SearchInputDividerType3 = {}));
var SearchResultTitleType3;
(function(SearchResultTitleType5) {
  SearchResultTitleType5["H1"] = "h1";
  SearchResultTitleType5["Title"] = "title";
})(SearchResultTitleType3 || (SearchResultTitleType3 = {}));
var SearchResultSubtitleType3;
(function(SearchResultSubtitleType5) {
  SearchResultSubtitleType5["Description"] = "description";
  SearchResultSubtitleType5["Path"] = "path";
})(SearchResultSubtitleType3 || (SearchResultSubtitleType3 = {}));
var SearchResultItemType3;
(function(SearchResultItemType5) {
  SearchResultItemType5["FullWidth"] = "fullWidth";
  SearchResultItemType5["Contained"] = "contained";
})(SearchResultItemType3 || (SearchResultItemType3 = {}));
var SearchLayoutType3;
(function(SearchLayoutType5) {
  SearchLayoutType5["Sidebar"] = "Sidebar";
  SearchLayoutType5["FixedTop"] = "FixedTop";
  SearchLayoutType5["QuickMenu"] = "QuickMenu";
})(SearchLayoutType3 || (SearchLayoutType3 = {}));
var SearchEntryType3;
(function(SearchEntryType5) {
  SearchEntryType5["Icon"] = "icon";
  SearchEntryType5["Text"] = "text";
})(SearchEntryType3 || (SearchEntryType3 = {}));
var SearchIconType3;
(function(SearchIconType5) {
  SearchIconType5["Default"] = "default";
  SearchIconType5["Custom"] = "custom";
})(SearchIconType3 || (SearchIconType3 = {}));

// http-url:https://framerusercontent.com/modules/MyBp84Z0p9nUcMimVMnY/1vZ2fdkLJI4IprrVTHqR/useSearch.js
var { log: log4, time: time4, timeEnd: timeEnd4 } = createLogger(localStorageDebugFlag);
var splitWordsRegex4 = (() => {
  try {
    const regex = RegExp("[\\s.,;!?\\p{P}\\p{Z}]+(?<!\\p{L}&)(?!&\\p{L})", "u");
    "".split(regex);
    return regex;
  } catch {
    log4("Falling back to regex without lookbehind");
    return RegExp("[\\s.,;!?\\p{P}\\p{Z}]+", "u");
  }
})();
function splitWords(text) {
  return text.split(splitWordsRegex4);
}
function getUniqueWords(str) {
  const words = splitWords(str).filter((word) => word.trim() && word.length > 0);
  return new Set(words);
}
var normalizeRegex = /[\u0300-\u036f]/g;
function getNormalizedString(text) {
  if (Array.isArray(text)) {
    return text.map(getNormalizedString);
  }
  return text.normalize("NFD").replace(normalizeRegex, "").toLowerCase();
}
var normalizedItemCache = /* @__PURE__ */ new WeakMap();
function getNormalizedItemFromCache(item) {
  const cached = normalizedItemCache.get(item);
  if (cached)
    return cached;
  const normalizedItem = getNormalizedItem(item);
  normalizedItemCache.set(item, normalizedItem);
  return normalizedItem;
}
function getNormalizedItem(item) {
  const normalizedItem = {};
  for (const key in item) {
    if (item.hasOwnProperty(key)) {
      const value = item[key];
      if (typeof value === "string") {
        normalizedItem[key] = getNormalizedString(value);
        continue;
      }
      if (Array.isArray(value)) {
        normalizedItem[key] = getNormalizedString(value);
        continue;
      }
      normalizedItem[key] = value;
    }
  }
  return normalizedItem;
}
function getMatchRange(currentRange, start, end) {
  const result = { ...currentRange };
  if (start < result.start) {
    result.start = start;
  }
  if (end > result.end) {
    result.end = end;
  }
  return result;
}
function getScoreForSearchIndexItem(item, query, words, fullQuery) {
  let score = 0;
  const match = { title: { start: Infinity, end: 0 }, description: { start: Infinity, end: 0 } };
  const urlWords = getUniqueWords(item.url);
  if (urlWords.has(query)) {
    score += 10;
  }
  if (words.size === 1 && urlWords.size === 1 && urlWords.values().next().value === query) {
    score += score * 5;
  }
  if (score > 0) {
    const splitLength = item.url.split("/").length;
    score += clamp7(10 - splitLength, 0, splitLength);
  }
  const titleWords = getUniqueWords(item.title);
  if (titleWords.has(query)) {
    score += 10;
  }
  const titleIndex = item.title.indexOf(query);
  if (titleIndex !== -1) {
    score += 10;
    match.title = getMatchRange(match.title, titleIndex, titleIndex + query.length);
  }
  if (distance(item.title, fullQuery) <= 2) {
    score += score * 10;
  }
  for (const titleWord of titleWords) {
    const distanceScore = distance(query, titleWord);
    if (distanceScore <= 2) {
      score += 10;
    }
  }
  const headings = [...item.h1, ...item.h2, ...item.h3, ...item.h4, ...item.h5, ...item.h6];
  for (const heading of headings) {
    const headingWords = getUniqueWords(heading);
    if (distance(heading, fullQuery) <= 2) {
      score += score * 10;
    }
    if (heading.startsWith(query)) {
      score += 10;
    }
    if (headingWords.has(query)) {
      score += 10;
    }
    if (heading.includes(query)) {
      score += 1;
    }
    for (const headingWord of headingWords) {
      const distanceScore = distance(query, headingWord);
      if (distanceScore <= 2) {
        score += 1;
      }
    }
  }
  const descriptionIndex = item.description.indexOf(query);
  if (descriptionIndex !== -1) {
    score += 10;
    match.description = getMatchRange(match.description, descriptionIndex, descriptionIndex + query.length);
  }
  for (const p of item.p) {
    if (p.includes(query)) {
      score += 0.5;
    }
  }
  for (const codeblock of item.codeblock) {
    if (distance(codeblock, fullQuery) <= 2) {
      score *= 10;
    }
    if (codeblock.includes(fullQuery)) {
      score += 10;
    }
    if (codeblock.includes(query)) {
      score += 0.5;
    }
  }
  return { score, match };
}
function getSearchIndexItemScore(item, normalizedQuery) {
  const normalizedItem = getNormalizedItemFromCache(item);
  const queryWords = getUniqueWords(normalizedQuery);
  let total = 0;
  for (const queryWord of queryWords) {
    const { score } = getScoreForSearchIndexItem(normalizedItem, queryWord, queryWords, normalizedQuery);
    total += score;
  }
  return total;
}
function useRawSearch(index, query, settings) {
  const [results, setResults] = useState7(null);
  const [, startTransition] = useTransition4();
  useEffect7(() => {
    const abortController = new AbortController();
    executeRawSearch(index, query, settings, abortController.signal).then((res) => {
      if (!abortController.signal.aborted) {
        startTransition(() => {
          setResults(res);
        });
      }
    }).catch((err) => {
      if (err.name !== "AbortError") {
        console.error("Search failed:", err);
      }
    });
    return () => {
      abortController.abort();
    };
  }, [index, query]);
  return { results: results ?? [] };
}
var QUANTUM = 32;
async function executeRawSearch(index, query, settings, signal) {
  const path = safeWindow?.location.pathname;
  time4("query");
  const normalizedQuery = getNormalizedString(query);
  const results = [];
  const items = Object.values(index);
  let deadline = performance.now() + QUANTUM;
  async function yieldToMainIfNecessary() {
    if (performance.now() >= deadline) {
      await yieldToMain();
      deadline = performance.now() + QUANTUM;
    }
  }
  for (let i = 0; i < items.length; ++i) {
    if (performance.now() >= deadline) {
      await yieldToMainIfNecessary();
      deadline = performance.now() + QUANTUM;
    }
    if (signal?.aborted)
      return [];
    const item = items[i];
    const score = getSearchIndexItemScore(item, normalizedQuery);
    if (score > (settings.minimumScore || 0) && (!path || item.url !== path)) {
      const heading = item.h1.length && item.h1[0];
      const title = settings?.titleType === SearchResultTitleType3.Title ? item.title : heading ? heading : item.title;
      results.push({ url: item.url, title, description: item.description, body: [...item.p, item.codeblock].join(" "), score });
    }
  }
  await yieldToMainIfNecessary();
  if (signal?.aborted)
    return [];
  const sorted = results.sort((itemA, itemB) => itemB.score - itemA.score);
  timeEnd4("query");
  await yieldToMainIfNecessary();
  if (signal?.aborted)
    return [];
  return results.slice(0, 20);
}
function getIndexedScopedToUrl(index, rawUrlScope, localeSlug) {
  const scopedIndex = {};
  const baseScopeUrlHasVariable = rawUrlScope.includes(":");
  const urlUpToPathVariable = rawUrlScope.split(":")[0];
  const urlScope = urlUpToPathVariable.length > 1 ? urlUpToPathVariable : "";
  for (const url in index) {
    const strippedURL = stripLocaleSlugFromPath(url, localeSlug);
    if (!strippedURL.startsWith(urlScope)) {
      continue;
    }
    if (baseScopeUrlHasVariable && url.length <= urlScope.length) {
      continue;
    }
    scopedIndex[url] = index[url];
  }
  return scopedIndex;
}
function useSearch4(query, settings) {
  const [searchIndex, _setSearchIndex] = useState7({});
  const [status, setStatus] = useState7("loading");
  const { results } = useRawSearch(searchIndex, query, settings);
  const { activeLocale } = useLocaleInfo7();
  const localeId = activeLocale?.id;
  function setSearchIndex(index, options = { ignoreScope: false }) {
    let scopedIndex = index;
    if (settings.urlScope && !options.ignoreScope) {
      scopedIndex = getIndexedScopedToUrl(index, settings.urlScope, activeLocale?.slug);
      log4("Using URL scope", settings.urlScope);
    }
    _setSearchIndex(scopedIndex);
  }
  useEffect7(() => {
    async function loadSearchIndex() {
      setStatus("loading");
      const baseUrl = getBaseUrl("framer-search-index");
      if (!baseUrl) {
        setStatus("no-meta-tag-found");
        setSearchIndex(fakeResults, { ignoreScope: true });
        log4("No meta tag found");
        return;
      }
      const cacheResult = await getCachedIndex(localeId, baseUrl);
      if (cacheResult.status === "fresh") {
        setSearchIndex(cacheResult.searchIndex);
        setStatus("success");
        log4("Using fresh cached index");
        return;
      }
      if (cacheResult.status === "stale") {
        setSearchIndex(cacheResult.searchIndex);
        setStatus("loading-with-cache");
        log4("Using stale cached index while loading a fresh one");
      }
      const searchIndexUrl = getSearchIndexUrl(baseUrl, localeId);
      const response = await fetch(searchIndexUrl);
      if (response.ok) {
        const downloadedIndex = await response.json();
        setSearchIndex(downloadedIndex);
        setCachedIndex(localeId, downloadedIndex, baseUrl);
        setStatus("success");
        log4("Using downloaded index");
        return;
      }
      const isNotFound = response.status === 403 || response.status === 404;
      if (!isNotFound) {
        throw new Error(response.statusText);
      }
      log4("Index not found");
      const fallbackBaseUrl = getBaseUrl("framer-search-index-fallback");
      if (!fallbackBaseUrl) {
        if (cacheResult.status === "miss") {
          setStatus("pending-index-generation");
          log4("No fallback, no cache");
        } else {
          setStatus("success");
          log4("No fallback, using cache");
        }
        return;
      }
      if (cacheResult.status === "stale" && cacheResult.indexHash === fallbackBaseUrl) {
        setStatus("success");
        log4("Using cached fallback index");
        return;
      }
      const fallbackSearchIndexUrl = getSearchIndexUrl(fallbackBaseUrl, localeId);
      const fallbackResponse = await fetch(fallbackSearchIndexUrl);
      if (fallbackResponse.ok) {
        const downloadedIndex = await fallbackResponse.json();
        setSearchIndex(downloadedIndex);
        setCachedIndex(localeId, downloadedIndex, fallbackBaseUrl);
        setStatus("success");
        log4("Using downloaded fallback index");
        return;
      }
      if (cacheResult.status === "miss") {
        setStatus("pending-index-generation");
        log4("Fallback failed, no cache");
      } else {
        setStatus("success");
        log4("Fallback failed, using cache");
      }
    }
    loadSearchIndex().catch((error) => {
      setStatus("error");
      log4("Failed to load search index", error);
    });
  }, [localeId]);
  log4({ status, results });
  return { results, status };
}
function getBaseUrl(name) {
  return safeDocument?.querySelector(`meta[name="${name}"]`)?.getAttribute("content");
}
function getSearchIndexUrl(baseURL, localeId) {
  if (isDefaultLocaleId(localeId))
    return baseURL;
  return baseURL.replace(".json", `-${localeId}.json`);
}

// http-url:https://framerusercontent.com/modules/tV9haTHllpHHc9Fjue2H/lCNMpf6DznmmCJRndYjM/SearchModal.js
import React12, { useEffect as useEffect8, useState as useState8, useMemo as useMemo4, forwardRef as forwardRef20, useRef as useRef5, useDeferredValue as useDeferredValue4, useLayoutEffect as useLayoutEffect4, useCallback as useCallback5, useImperativeHandle as useImperativeHandle4 } from "react";
import { motion as motion13, clamp as clamp8, useAnimate as useAnimate4 } from "framer-motion";
import {
  useLocaleInfo as useLocaleInfo8,
  useRouter as useRouter4,
  inferInitialRouteFromPath as inferInitialRouteFromPath4
} from "./_framer-runtime.js";
var MAX_DESCRIPTION_LENGTH = 120;
var MODAL_MAX_HEIGHT = 496;
var VERTICAL_SPACING_MULTIPLIER = 0.6;
function ClearButton({ theme, type, onClick, text }) {
  const shouldDisplayIcon = type === "icon";
  const iconOrText = shouldDisplayIcon ? /* @__PURE__ */ _jsx13(ClearIcon, { style: { color: theme.inputIconColor, width: theme.inputIconSize, height: theme.inputIconSize } }) : text;
  return /* @__PURE__ */ _jsx13("div", { style: { flexShrink: 0, fontSize: theme && theme.titleFont && theme.titleFont.fontSize ? theme.titleFont.fontSize : 15 }, children: /* @__PURE__ */ _jsx13("button", { className: "__framer-search-clear-button", onClick, style: { fontFamily: "inherit", border: "none", background: "none", cursor: "pointer", display: "flex", textTransform: "uppercase", color: theme.inputIconColor, fontSize: "0.75em", padding: 0 }, children: iconOrText }) });
}
function Divider({ theme, type }) {
  const styles = { background: theme.foregroundColor, height: 1, flexShrink: 0, opacity: 0.05 };
  if (type === "contained" && theme) {
    styles.marginLeft = theme.horizontalSpacing;
    styles.marginRight = theme.horizontalSpacing;
  }
  return /* @__PURE__ */ _jsx13("div", { style: styles });
}
var Input = /* @__PURE__ */ forwardRef20(function Input2(props, ref) {
  const { value = "", status, autofocus, theme, placeholder, iconType, clearButtonType, onChange } = props;
  const [inputValue, setInputValue] = useState8(value);
  const [isFocused, setIsFocused] = useState8(false);
  const inputRef = useRef5();
  useImperativeHandle4(ref, () => inputRef.current);
  React12.useLayoutEffect(() => {
    return () => {
      const inputElement = inputRef.current;
      if (!inputElement || inputElement !== document.activeElement)
        return;
      inputElement.blur();
    };
  }, []);
  const handleInputClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  const handleClearClick = () => {
    setInputValue("");
  };
  useEffect8(() => {
    onChange(inputValue);
  }, [inputValue]);
  const hasInputText = inputValue.length > 0;
  const showClearButton = inputValue.length > 0 && clearButtonType && clearButtonType !== "none";
  const verticalSpacing = Math.floor(theme ? theme.horizontalSpacing * VERTICAL_SPACING_MULTIPLIER : 0);
  const searchIcon = iconType === "custom" && theme.inputIconImage ? /* @__PURE__ */ _jsx13("img", { alt: "icon alongside the Site Search input", src: theme.inputIconImage.src, width: theme.inputIconSize, height: theme.inputIconSize, decoding: "async" }) : /* @__PURE__ */ _jsx13(SearchIcon, { color: theme.inputIconColor, width: theme.inputIconSize, height: theme.inputIconSize });
  return /* @__PURE__ */ _jsxs5("div", { role: "search", style: { ...inputContainerStyle, fontFamily: getFontFamily(theme), paddingLeft: theme && theme.horizontalSpacing, paddingRight: theme && theme.horizontalSpacing, gap: 12, paddingTop: verticalSpacing, paddingBottom: verticalSpacing, touchAction: "none" }, onClick: handleInputClick, children: [/* @__PURE__ */ _jsx13("div", { style: { flexShrink: 0, display: "flex" }, children: status === "loading" && inputValue ? /* @__PURE__ */ _jsx13(SpinnerIcon, { color: theme.inputIconColor, backgroundColor: theme.backgroundColor, style: { height: theme && theme.inputIconSize, width: theme && theme.inputIconSize } }) : searchIcon }), /* @__PURE__ */ _jsx13("input", { ref: inputRef, spellCheck: false, autoFocus: autofocus, style: {
    ...inputStyle,
    WebkitTapHighlightColor: "rgba(0,0,0,0)",
    color: theme.foregroundColor,
    lineHeight: "2em",
    verticalAlign: "baseline",
    ...theme.titleFont,
    ...theme.inputFont,
    fontSize: theme.inputFontSize,
    // @ts-ignore
    "--framer-search-placeholder-color": theme.placeholderColor
  }, onFocus: () => {
    const scrollOffset = document.documentElement.scrollTop;
    document.documentElement.scrollTop = scrollOffset;
  }, placeholder, value: inputValue, onChange: () => setInputValue(inputRef.current.value) }), showClearButton && /* @__PURE__ */ _jsx13(ClearButton, { theme, type: props.clearButtonType, text: props.clearButtonText, onClick: handleClearClick })] });
});
var inputContainerStyle = { display: "inline-flex", alignItems: "center", flexShrink: 0 };
var inputStyle = { outline: "none", border: "none", background: "transparent", fontWeight: 500, height: "2em", padding: 0, width: "100%" };
var ResultRow = /* @__PURE__ */ React12.memo(/* @__PURE__ */ React12.forwardRef(function ResultRow2(props, ref) {
  const { index, result, prevMousePositionRef, type = "contained", subtitleType = "path", selected = false, theme, localeSlug, style, onMouseMove, onPointerDown, onNavigateTo } = props;
  const { url, title, score } = result;
  const urlPath = useMemo4(() => {
    return stripLocaleSlugFromPath(url, localeSlug);
  }, [url, localeSlug]);
  const handleMouseMove = useCallbackOnMouseMove((event) => onMouseMove(event, index), prevMousePositionRef);
  const isContained = type === "contained";
  const borderRadius = isContained ? clamp8(0, Infinity, theme.borderRadius - theme.spacing) : 0;
  const subtitleText = subtitleType === "path" ? urlPath : clampText(result.description, MAX_DESCRIPTION_LENGTH);
  const handleClick = (event) => {
    event.preventDefault();
    onNavigateTo(result.url);
  };
  const focusTrap = (event) => {
    event.preventDefault();
  };
  return /* @__PURE__ */ _jsx13("a", { ref, style: { textDecoration: "none" }, href: result.url, onClick: handleClick, onMouseMove: handleMouseMove, onMouseDown: focusTrap, onPointerDown: (event) => onPointerDown(event, index), children: /* @__PURE__ */ _jsxs5("li", { style: { ...resultContainer, ...style, paddingTop: isContained ? 12 : 16, paddingBottom: isContained ? 12 : 16, color: theme.foregroundColor, position: "relative", paddingLeft: theme && theme.horizontalSpacing, paddingRight: theme && theme.horizontalSpacing }, children: [/* @__PURE__ */ _jsx13("div", { style: { backgroundColor: theme.foregroundColor, position: "absolute", opacity: selected ? 0.06 : 0, borderRadius, left: theme && isContained ? theme.spacing : 0, right: theme && isContained ? theme.spacing : 0, top: 0, bottom: 0 } }), /* @__PURE__ */ _jsxs5("div", { style: { display: "flex", flexDirection: "column", overflow: "hidden", gap: 4 }, children: [/* @__PURE__ */ _jsx13("h3", { style: { ...resultTitle, ...theme.titleFont, lineHeight: "1.4em" }, children: title }), /* @__PURE__ */ _jsxs5("p", { style: { margin: 0, color: theme.subtitleColor, ...theme.subtitleFont, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "1.4em" }, children: [localStorageDebugFlag ? score : "", " ", subtitleText] })] })] }, result.url) });
}));
function QuickMenuSpacer({ onClick }) {
  return /* @__PURE__ */ _jsx13("div", { style: { width: "100%", flexBasis: "20vh" }, onClick });
}
var layoutContainerStyle = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: 15, overflow: "visible" };
function LayoutContainer({ layoutType, theme, onKeyDown, onDismiss, children, modalOptions }) {
  const layoutStyles = getLayoutBaseStyles(layoutType, theme);
  const style = { ...layoutContainerStyle, ...layoutStyles, willChange: "transform", marginTop: layoutType === "FixedTop" ? theme.offsetTop : 0, height: layoutType === "Sidebar" ? "100%" : "auto", maxHeight: layoutType === "QuickMenu" ? "100%" : "none", justifyContent: layoutType === "Sidebar" ? "flex-end" : "flex-start", flexDirection: layoutType === "Sidebar" ? "column-reverse" : "column" };
  const innerStyle = { ...layoutContainerStyle, ...layoutStyles, height: layoutType === "Sidebar" ? "100%" : "auto", maxHeight: layoutType === "QuickMenu" ? "100%" : "none", gap: layoutType === "Sidebar" ? 0 : theme.gapBetweenStatusAndSearch, backgroundColor: layoutType === "Sidebar" ? theme.backgroundColor : "transparent", justifyContent: layoutType === "Sidebar" ? "flex-end" : "flex-start", flexDirection: layoutType === "Sidebar" ? "column-reverse" : "column", originX: 0.5, originY: 0.5 };
  function getContainerAnimation() {
    switch (layoutType) {
      case "FixedTop": {
        const key = animationKeyFromLayout("FixedTop");
        const prop = modalOptions ? modalOptions[key] : void 0;
        if (prop) {
          return prop;
        } else {
          return { y: -10, opacity: 0.2, transition: { duration: Browser.isTouch() ? 0 : 0.15 } };
        }
        break;
      }
      case "QuickMenu": {
        const key = animationKeyFromLayout("QuickMenu");
        const prop = modalOptions ? modalOptions[key] : void 0;
        if (prop) {
          return prop;
        } else {
          return { scale: 0.95, opacity: 0, y: 0, x: 0, rotate: 0, transition: { type: "spring", stiffness: 600, damping: 40 } };
        }
        break;
      }
      case "Sidebar": {
        const key = animationKeyFromLayout("Sidebar");
        const prop = modalOptions ? modalOptions[key] : void 0;
        if (prop) {
          return prop;
        } else {
          return { x: -10, opacity: 0, transition: { duration: 0.15 } };
        }
        break;
      }
    }
  }
  const containerAnimation = getContainerAnimation();
  return /* @__PURE__ */ _jsxs5("div", { style, onKeyDown, onClick: (event) => event.stopPropagation(), children: [layoutType === "QuickMenu" && /* @__PURE__ */ _jsx13(QuickMenuSpacer, { onClick: onDismiss }), /* @__PURE__ */ _jsx13(motion13.div, { initial: containerAnimation, animate: { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }, transition: containerAnimation ? containerAnimation.transition : void 0, exit: { opacity: 0, transition: { duration: 0 } }, style: innerStyle, children })] });
}
function ModalContainer({ layoutType, theme, children, heightIsStatic, heightTransition, heightDeps }) {
  const style = {
    // This `willChange` is required to avoid weird rendering issues where
    // parts of the search window won't redraw, which we observed in Safari 16.4.
    willChange: "transform",
    backgroundColor: theme.backgroundColor,
    color: theme.foregroundColor,
    borderRadius: layoutType === "QuickMenu" ? theme.borderRadius : 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    boxShadow: layoutType !== "Sidebar" ? theme.shadow : void 0,
    maxHeight: layoutType === "QuickMenu" ? `min(${MODAL_MAX_HEIGHT}px, calc(100vh - 30px))` : void 0
  };
  const [scope, animate] = useAnimate4();
  useLayoutEffect4(() => {
    if (layoutType !== "QuickMenu" || heightIsStatic)
      return;
    const prevHeight = scope.current.offsetHeight;
    scope.current.style.height = "auto";
    const height = scope.current.offsetHeight;
    scope.current.style.height = prevHeight + "px";
    animate(scope.current, { height: [prevHeight, height] }, heightTransition);
  }, heightDeps);
  return /* @__PURE__ */ _jsx13("div", { ref: scope, role: "dialog", className: layoutType === "FixedTop" ? "__framer-max-height-80dvh" : void 0, style, children });
}
var ScrollView = /* @__PURE__ */ React12.forwardRef(function ScrollView2({ theme, children }, ref) {
  const isTouch = Browser.isTouch();
  const [canScroll, setCanScroll] = React12.useState(true);
  React12.useEffect(() => {
    if (!isTouch)
      return;
    const element = ref.current;
    if (!element)
      return;
    setCanScroll(element.scrollHeight > element.clientHeight);
  });
  return /* @__PURE__ */ _jsx13("div", { ref, style: {
    width: `calc(100% + ${theme.scrollBarWidth}px)`,
    overflowY: "scroll",
    overflowX: "hidden",
    overscrollBehavior: "contain",
    touchAction: canScroll ? void 0 : "none",
    // Make the list appear slightly under the divider
    // so that the divider is still visible when the first
    // item is selected.
    marginTop: -1
  }, children });
});
var statusStyle = { backgroundColor: "#B5B5B5", color: "#FFF", boxShadow: "0px 20px 40px 0px rgba(0, 0, 0, 0.25)", fontFamily: "inherit", textAlign: "center", fontSize: 13, padding: "8px 0" };
function StatusMessage({ status, layoutType, theme }) {
  const verticalSpacing = Math.floor(theme ? theme.horizontalSpacing * VERTICAL_SPACING_MULTIPLIER : 0);
  const style = { ...statusStyle, userSelect: "none", fontFamily: getFontFamily(theme), paddingLeft: theme && theme.horizontalSpacing, paddingRight: theme && theme.horizontalSpacing, fontWeight: 500, lineHeight: `calc(${theme.inputFontSize} * 2)`, paddingTop: verticalSpacing, paddingBottom: verticalSpacing, ...theme.titleFont, zIndex: theme.zIndex + 1, maxWidth: layoutType === "FixedTop" ? "none" : theme.width, width: layoutType === "FixedTop" ? `calc(100% - ${verticalSpacing * 2}px` : "100%", boxShadow: layoutType !== "Sidebar" && statusStyle.boxShadow, borderRadius: layoutType !== "Sidebar" && theme.borderRadius };
  const previewInfoText = layoutType === "FixedTop" ? "Preview Mode" : "Preview Mode. Publish your Site to Search.";
  if (status === "no-meta-tag-found") {
    return /* @__PURE__ */ _jsx13("div", { style, children: previewInfoText });
  }
  if (status === "pending-index-generation") {
    return /* @__PURE__ */ _jsx13("div", { style, children: "Site is being indexed" });
  }
  return null;
}
var resultTitle = { textOverflow: "ellipsis", maxWidth: "100%", overflow: "hidden", fontWeight: 500, whiteSpace: "nowrap", flex: 1, margin: 0 };
var resultContainer = { padding: "16px 20px", listStyle: "none", fontWeight: 500 };
var sidebarStyles = { left: 0, width: 500 };
var fixedTopStyles = { top: 0, width: "100%" };
var quickMenuStyles = { width: 500 };
function getLayoutBaseStyles(layoutOption, theme) {
  switch (layoutOption) {
    case "Sidebar":
      return { ...sidebarStyles, width: theme.width };
    case "FixedTop":
      return fixedTopStyles;
    case "QuickMenu":
      return { ...quickMenuStyles, width: theme.width };
  }
}
var SearchInputClearButtonType4;
(function(SearchInputClearButtonType5) {
  SearchInputClearButtonType5["Icon"] = "icon";
  SearchInputClearButtonType5["Text"] = "text";
  SearchInputClearButtonType5["None"] = "none";
})(SearchInputClearButtonType4 || (SearchInputClearButtonType4 = {}));
var SearchInputDividerType4;
(function(SearchInputDividerType5) {
  SearchInputDividerType5["None"] = "none";
  SearchInputDividerType5["FullWidth"] = "fullWidth";
  SearchInputDividerType5["Contained"] = "contained";
})(SearchInputDividerType4 || (SearchInputDividerType4 = {}));
var SearchResultTitleType4;
(function(SearchResultTitleType5) {
  SearchResultTitleType5["H1"] = "h1";
  SearchResultTitleType5["Title"] = "title";
})(SearchResultTitleType4 || (SearchResultTitleType4 = {}));
var SearchResultSubtitleType4;
(function(SearchResultSubtitleType5) {
  SearchResultSubtitleType5["Description"] = "description";
  SearchResultSubtitleType5["Path"] = "path";
})(SearchResultSubtitleType4 || (SearchResultSubtitleType4 = {}));
var SearchResultItemType4;
(function(SearchResultItemType5) {
  SearchResultItemType5["FullWidth"] = "fullWidth";
  SearchResultItemType5["Contained"] = "contained";
})(SearchResultItemType4 || (SearchResultItemType4 = {}));
var SearchLayoutType4;
(function(SearchLayoutType5) {
  SearchLayoutType5["Sidebar"] = "Sidebar";
  SearchLayoutType5["FixedTop"] = "FixedTop";
  SearchLayoutType5["QuickMenu"] = "QuickMenu";
})(SearchLayoutType4 || (SearchLayoutType4 = {}));
var SearchEntryType4;
(function(SearchEntryType5) {
  SearchEntryType5["Icon"] = "icon";
  SearchEntryType5["Text"] = "text";
})(SearchEntryType4 || (SearchEntryType4 = {}));
var SearchIconType4;
(function(SearchIconType5) {
  SearchIconType5["Default"] = "default";
  SearchIconType5["Custom"] = "custom";
})(SearchIconType4 || (SearchIconType4 = {}));
function SearchModal(props) {
  const { layoutType, theme, urlScope, inputOptions, backdropOptions, modalOptions, resultOptions, onDismiss } = props;
  const { activeLocale } = useLocaleInfo8();
  const localeId = activeLocale?.id;
  const localeSlug = activeLocale?.slug;
  const input = useRef5();
  const selectedResultRow = useRef5();
  const scrollView = useRef5();
  const [selected, setSelected] = useState8({ index: 0, scroll: true });
  const prevMousePositionRef = useRef5(null);
  const [isKeyboardNavigationDisabled, setIsKeyboardNavigationDisabled] = useState8(Browser.isTouch);
  const [query, setQuery] = useState8("");
  const deferredQuery = useDeferredValue4(query);
  const { results, status } = useSearch4(deferredQuery, { minimumScore: 0, urlScope, titleType: resultOptions.titleType });
  const selectedResult = results[selected.index];
  const verticalSpacing = Math.floor(theme ? theme.horizontalSpacing * VERTICAL_SPACING_MULTIPLIER : 0);
  useEffect8(() => {
    setSelected({ index: 0, scroll: true });
  }, [deferredQuery]);
  const handleResultRowPointerDown = useCallback5((event, index) => {
    if (event.pointerType !== "touch")
      return;
    setIsKeyboardNavigationDisabled(true);
    setSelected({ index, scroll: false });
  }, []);
  const handleResultRowMouseMove = useCallback5((event, index) => {
    setSelected((previousSelected) => {
      if (previousSelected.index === index) {
        return previousSelected;
      }
      return { index, scroll: false };
    });
  }, []);
  const router = useRouter4();
  const navigateTo = useCallback5(async (url) => {
    if (status === "no-meta-tag-found") {
      return;
    }
    try {
      const { routeId, pathVariables } = inferInitialRouteFromPath4(router.routes, url);
      const route = router.getRoute?.(routeId);
      onDismiss();
      await route?.page?.preload?.();
      router.navigate?.(routeId, null, pathVariables, false);
    } catch (error) {
      __dai_window.location.href = url;
    }
  }, [status]);
  const handleKeyDown = (event) => {
    const maxIndex = results.length - 1;
    switch (event.code) {
      case "ArrowUp":
        event.preventDefault();
        if (isKeyboardNavigationDisabled) {
          setIsKeyboardNavigationDisabled(false);
          break;
        }
        setSelected((previousSelected) => ({ index: clamp8(0, maxIndex, previousSelected.index - 1), scroll: true }));
        break;
      case "ArrowDown":
        event.preventDefault();
        if (isKeyboardNavigationDisabled) {
          setIsKeyboardNavigationDisabled(false);
          break;
        }
        setSelected((previousSelected) => ({ index: clamp8(0, maxIndex, previousSelected.index + 1), scroll: true }));
        break;
      case "Escape":
        break;
      case "Enter":
        if (selectedResult) {
          navigateTo(selectedResult.url);
        }
        break;
      default:
        event.stopPropagation();
    }
  };
  const showNoResults = results.length === 0 && deferredQuery.length > 1 && status !== "loading";
  const showDivider = Boolean((deferredQuery.length > 0 && results.length > 0 || showNoResults) && status !== "loading" && props.inputOptions && props.inputOptions.dividerType !== "none");
  const isItemContained = Boolean(props.resultOptions && props.resultOptions.itemType === "contained");
  const spacing = isItemContained ? theme.spacing : 10;
  const listPaddingTop = showDivider && isItemContained ? spacing + theme.gapBetweenResults * 2 : 0;
  useEffect8(() => {
    if (!selected.scroll)
      return;
    const element = selectedResultRow.current;
    if (!element)
      return;
    scrollIntoView(element, scrollView.current, { offsetTop: showDivider && isItemContained ? listPaddingTop : 0, offsetBottom: isItemContained ? spacing : 0 });
  }, [selected]);
  return /* @__PURE__ */ _jsxs5(LayoutContainer, { layoutType, modalOptions, theme, onKeyDown: handleKeyDown, onDismiss, children: [/* @__PURE__ */ _jsxs5(ModalContainer, { layoutType, theme, heightIsStatic: modalOptions.heightIsStatic, heightTransition: modalOptions.heightTransition, heightDeps: [results.length, showNoResults], children: [/* @__PURE__ */ _jsx13(Input, { autofocus: true, ref: input, onChange: setQuery, value: query, theme, status, iconType: inputOptions.iconOptions.iconType, placeholder: inputOptions.placeholderOptions.placeholderText, clearButtonType: inputOptions ? inputOptions.clearButtonType : void 0, clearButtonText: inputOptions.clearButtonText }), showDivider && /* @__PURE__ */ _jsx13(Divider, { theme, type: inputOptions.dividerType }), /* @__PURE__ */ _jsx13(ScrollView, { ref: scrollView, theme, children: /* @__PURE__ */ _jsxs5("ul", { "aria-live": "polite", style: { display: "flex", flexDirection: "column", width: `calc(100% - ${theme.scrollBarWidth}px)`, padding: 0, paddingTop: listPaddingTop, paddingBottom: results.length && isItemContained ? spacing : 0, gap: theme.gapBetweenResults, margin: 0 }, children: [results.map((result, index) => {
    const isSelected = index === selected.index;
    return /* @__PURE__ */ _jsx13(ResultRow, { ref: isSelected ? selectedResultRow : null, index, result, prevMousePositionRef, selected: !isKeyboardNavigationDisabled && isSelected, type: props.resultOptions.itemType, subtitleType: props.resultOptions.subtitleOptions.subtitleType, theme, localeSlug, onMouseMove: handleResultRowMouseMove, onPointerDown: handleResultRowPointerDown, onNavigateTo: navigateTo }, result.url);
  }), showNoResults && /* @__PURE__ */ _jsx13("li", { style: { paddingTop: verticalSpacing - listPaddingTop, paddingBottom: verticalSpacing, lineHeight: "2em", paddingLeft: theme && theme.horizontalSpacing, paddingRight: theme && theme.horizontalSpacing, height: "Sidebar" ? "100%" : "auto" }, children: /* @__PURE__ */ _jsx13("h3", { style: { ...resultTitle, textAlign: "center", lineHeight: `calc(${theme.inputFontSize} * 2)`, color: theme.subtitleColor, ...theme.titleFont }, children: "No results" }) })] }) })] }), /* @__PURE__ */ _jsx13(StatusMessage, { status, layoutType, theme })] });
}

// http-url:https://framerusercontent.com/modules/hqEf5wXaAewP8VPuaZ98/5A0QGVeEr2cwheQpIuEG/useViewportSizeState.js
import { useEffect as useEffect9, useState as useState9 } from "react";
function getViewportSize() {
  if (typeof __dai_window === "undefined") {
    return { width: 0, height: 0 };
  }
  return { width: __dai_window.innerWidth, height: __dai_window.innerHeight };
}
function useViewportSizeState(getState) {
  const [state, setState] = useState9(() => getState(getViewportSize()));
  useEffect9(() => {
    const handleWindowResize = () => setState(getState(getViewportSize()));
    __dai_window.addEventListener("resize", handleWindowResize);
    return () => {
      __dai_window.removeEventListener("resize", handleWindowResize);
    };
  }, []);
  return state;
}

// http-url:https://framerusercontent.com/modules/6wAE2eMb2Tl3zrU7u4UL/mKj6QS2p4Cgdaa0WrZKY/Search.js
var EntryPointOptions;
(function(EntryPointOptions2) {
  EntryPointOptions2["icon"] = "Icon";
  EntryPointOptions2["input"] = "Input";
})(EntryPointOptions || (EntryPointOptions = {}));
function buildShadow(shadowProperty, fallback = "none") {
  if (!shadowProperty)
    return fallback;
  const { x, y, blur, color, spread } = shadowProperty;
  return `${x}px ${y}px ${blur}px ${spread}px ${color}`;
}
var Overlay = /* @__PURE__ */ forwardRef21(function Overlay2(props, ref) {
  const { layoutType, theme, onDismiss } = props;
  useEffect10(() => {
    const handleKeyDown = (event) => {
      if (event.code === "Escape") {
        event.stopPropagation();
        onDismiss();
      }
    };
    const handlePointerDown = (event) => {
      if (event.pointerType !== "touch")
        return;
      const isWithinSearchHeader = Boolean(event.target instanceof Element && event.target.closest("[role=search]"));
      if (isWithinSearchHeader)
        return;
      if (document.activeElement instanceof HTMLInputElement) {
        document.activeElement.blur();
      }
    };
    __dai_window.addEventListener("keydown", handleKeyDown);
    __dai_window.addEventListener("pointerdown", handlePointerDown, { capture: true });
    document.body.classList.add(bodyOverflowHidden);
    return () => {
      __dai_window.removeEventListener("keydown", handleKeyDown);
      __dai_window.removeEventListener("pointerdown", handlePointerDown, { capture: true });
      document.body.classList.remove(bodyOverflowHidden);
    };
  }, []);
  return /* @__PURE__ */ createPortal(/* @__PURE__ */ _jsxs6("div", { ref, className: "__framer-search-modal-container", role: "presentation", style: { ...backdropStyles, zIndex: props.backdropOptions.zIndex, justifyContent: layoutType === SearchLayoutType4.Sidebar ? "flex-start" : "center" }, onClick: onDismiss, children: [/* @__PURE__ */ _jsx14(motion14.div, { role: "presentation", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0 } }, transition: theme.overlayTransition, style: { top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%", boxSizing: "border-box", position: "absolute", touchAction: "none", backgroundColor: props.backdropOptions.backgroundColor } }), /* @__PURE__ */ _jsx14(SearchModal, { urlScope: props.urlScope, layoutType, inputOptions: props.inputOptions, resultOptions: props.resultOptions, modalOptions: props.modalOptions, backdropOptions: props.backdropOptions, theme: props.theme, onDismiss })] }), document.body);
});
var backdropStyles = { width: "100%", boxSizing: "border-box", willChange: "transform", position: "fixed", display: "flex", alignItems: "flex-start", top: 0, left: 0, right: 0, bottom: 0 };
var containerStyle = { height: "100%", display: "flex", borderRadius: 10, cursor: "inherit", overflow: "hidden" };
var bodyOverflowHidden = "__framer-overflow-hidden";
var EntryPoint = withCSS9(function EntryPoint2(props) {
  const overlay = useRef6(null);
  const [isOpen, setIsOpen] = useState10(false);
  const [isOverLimit, setIsOverLimit] = useState10(false);
  const [isSafariTouchDevice, setIsSafariTouchDevice] = useState10(false);
  const [isOnCanvas] = useState10(() => RenderTarget.current() === RenderTarget.canvas);
  useEffect10(() => {
    setIsOverLimit(checkIfOverLimit());
    setIsSafariTouchDevice(Browser.isSafari() && Browser.isTouch());
  }, []);
  const baseInputFontSize = props.inputOptions?.inputFont?.fontSize ? props.inputOptions.inputFont.fontSize : "16px";
  const inputFontSize = isSafariTouchDevice ? `max(16px, ${baseInputFontSize})` : baseInputFontSize;
  const layoutType = useViewportSizeState((size) => {
    if (size.width < props.modalOptions.width + 10) {
      return SearchLayoutType4.FixedTop;
    }
    return props.modalOptions.layoutType || props.layoutType;
  });
  const theme = {
    subtitleColor: props.resultOptions.subtitleOptions.subtitleColor,
    backgroundColor: props.modalOptions.backgroundColor,
    foregroundColor: props.resultOptions.titleColor,
    placeholderColor: props.inputOptions.placeholderOptions.placeholderColor,
    titleFont: props.resultOptions?.titleFont && !isEmptyObject(props.resultOptions.titleFont) ? props.resultOptions.titleFont : { fontSize: 14, fontFamily: DEFAULT_FONT_FAMILY, fontWeight: 500 },
    subtitleFont: props.resultOptions.subtitleOptions?.subtitleFont && !isEmptyObject(props.resultOptions.subtitleOptions.subtitleFont) ? props.resultOptions.subtitleOptions.subtitleFont : { fontSize: 12, fontFamily: DEFAULT_FONT_FAMILY, fontWeight: 500 },
    inputFont: props.inputOptions?.inputFont && !isEmptyObject(props.inputOptions.inputFont) ? props.inputOptions.inputFont : { fontSize: 16, fontFamily: DEFAULT_FONT_FAMILY, fontWeight: 500 },
    // Keep separate so we can more easily override
    inputFontSize,
    width: props.modalOptions.width,
    offsetTop: props.modalOptions.top,
    borderRadius: props.modalOptions.borderRadius,
    shadow: buildShadow(props.modalOptions.shadow),
    entryIconColor: props.iconColor,
    entryIconSize: props.iconSize,
    entryIconImage: props.iconImage,
    inputIconSize: props.inputOptions.iconOptions.iconSize,
    inputIconColor: props.inputOptions.iconOptions.iconColor,
    inputIconImage: props.inputOptions.iconOptions.iconImage,
    gapBetweenStatusAndSearch: 16,
    gapBetweenResults: 1,
    scrollBarWidth: 20,
    margin: 10,
    spacing: 8,
    zIndex: props.backdropOptions.zIndex,
    horizontalSpacing: 20,
    overlayTransition: props.backdropOptions.transition
  };
  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isOverLimit)
      return;
    setIsOpen(true);
  };
  return /* @__PURE__ */ _jsxs6("div", { style: { ...containerStyle, ...props.style, pointerEvents: isOverLimit ? "none" : "auto", opacity: isOverLimit ? 0.4 : 1 }, children: [/* @__PURE__ */ _jsx14("button", { "aria-label": "Search Icon", style: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "none", cursor: "inherit", color: "inherit", border: "none", borderRadius: 10, padding: 0 }, onClick: handleClick, children: props.iconType === SearchIconType4.Custom && theme.entryIconImage ? /* @__PURE__ */ _jsx14("img", { alt: "icon entry point for Site Search", src: theme.entryIconImage.src, width: theme.entryIconSize, height: theme.entryIconSize }) : /* @__PURE__ */ _jsx14(SearchIcon, { color: theme.entryIconColor, width: theme.entryIconSize, height: theme.entryIconSize }) }), /* @__PURE__ */ _jsx14(AnimatePresence, { children: isOpen && !isOnCanvas && /* @__PURE__ */ _jsx14(Overlay, { ref: overlay, layoutType, urlScope: props.urlScope, inputOptions: props.inputOptions, resultOptions: props.resultOptions, backdropOptions: props.backdropOptions, modalOptions: props.modalOptions, theme, onDismiss: () => setIsOpen(false) }) })] });
}, [
  // Prevent scrolling on iOS Safari when Input is focused.
  // From: https://gist.github.com/kiding/72721a0553fa93198ae2bb6eefaa3299
  `
        @keyframes __framer-blink-input {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }

        .__framer-search-modal-container input:focus {
            animation: __framer-blink-input 0.01s;
        }
        `,
  // Allow styling of input placeholder
  `
         .__framer-search-modal-container input::placeholder, 
         .__framer-search-modal-container input::-webkit-input-placeholder { 
            color: var(--framer-search-placeholder-color, #999999);
            opacity: 1;
        }
        `,
  // Allow fallback to 100vh when dvh unit is not supported.
  `
        .__framer-search-modal-container {
            height: 100vh;
            height: 100dvh;
        }
        .__framer-search-modal-container .__framer-max-height-80dvh {
            max-height: 80vh;
            max-height: 80dvh;
        }
        `,
  `
        body.${bodyOverflowHidden} {
            overflow: hidden;
        }`,
  // Increase hit target
  `
        button.__framer-search-clear-button {
            position: relative;
        }
        button.__framer-search-clear-button::after {
            content: "";
            position: absolute;
            top: -10px;
            right: -10px;
            bottom: -10px;
            left: -10px;
        }`
], "framer-lib-search");
var Search_default = EntryPoint;
addPropertyControls9(EntryPoint, {
  urlScope: {
    title: "Scope",
    // @ts-ignore - Internal
    type: ControlType9.PageScope
  },
  // entryType: {
  //     title: "Type",
  //     type: ControlType.Enum,
  //     options: Object.values(SearchEntryType),
  //     optionTitles: Object.values(SearchEntryType).map(titleCase),
  //     displaySegmentedControl: true,
  // },
  iconType: { title: "Icon", type: ControlType9.Enum, options: Object.values(SearchIconType4), optionTitles: Object.values(SearchIconType4).map(titleCase), displaySegmentedControl: true },
  iconColor: { title: "Color", type: ControlType9.Color, defaultValue: "#333", hidden: (props) => props.iconType === SearchIconType4.Custom },
  iconImage: { title: "File", type: ControlType9.ResponsiveImage, allowedFileTypes: ["jpg", "png", "svg"], hidden: (props) => props.iconType === SearchIconType4.Default },
  iconSize: { title: "Size", type: ControlType9.Number, displayStepper: true, defaultValue: 24 },
  inputOptions: { title: "Input", type: ControlType9.Object, buttonTitle: "Icon, Styles", controls: { iconOptions: { title: "Icon", type: ControlType9.Object, buttonTitle: "Color, Size", controls: { iconType: { title: "Icon", type: ControlType9.Enum, options: Object.values(SearchIconType4), optionTitles: Object.values(SearchIconType4).map(titleCase), displaySegmentedControl: true }, iconColor: { title: "Color", type: ControlType9.Color, defaultValue: "rgba(0, 0, 0, 0.45)", hidden: ({ iconType }) => {
    return iconType === SearchIconType4.Custom;
  } }, iconImage: { title: "File", type: ControlType9.ResponsiveImage, allowedFileTypes: ["jpg", "png", "svg"], hidden: ({ iconType }) => iconType === SearchIconType4.Default }, iconSize: { title: "Icon Size", type: ControlType9.Number, displayStepper: true, defaultValue: 18, min: 0, max: 100 } } }, inputFont: {
    title: "Font",
    // @ts-ignore – Internal
    type: ControlType9.Font,
    displayFontSize: true
  }, textColor: { title: "Color", type: ControlType9.Color, defaultValue: "#333" }, placeholderOptions: { title: "Placeholder", type: ControlType9.Object, buttonTitle: "Color, Text", controls: { placeholderText: { title: "Text", type: ControlType9.String, defaultValue: "Search..." }, placeholderColor: { title: "Color", type: ControlType9.Color, defaultValue: "rgba(0,0,0,0.4)" } } }, dividerType: { title: "Divider", type: ControlType9.Enum, options: Object.values(SearchInputDividerType4), optionTitles: Object.keys(SearchInputDividerType4).map(titleCase), defaultValue: SearchInputDividerType4.FullWidth }, clearButtonType: { title: "Clear Type", type: ControlType9.Enum, options: Object.values(SearchInputClearButtonType4), optionTitles: Object.keys(SearchInputClearButtonType4).map(titleCase), defaultValue: SearchInputClearButtonType4.Icon }, clearButtonText: { title: "Clear Text", type: ControlType9.String, defaultValue: "Clear", hidden: (props) => props.clearButtonType !== SearchInputClearButtonType4.Text } } },
  modalOptions: { title: "Modal", buttonTitle: "Layout, Width", type: ControlType9.Object, controls: { layoutType: { title: "Layout", type: ControlType9.Enum, options: Object.keys(SearchLayoutType4), optionTitles: Object.values(SearchLayoutType4).map(titleCase), defaultValue: SearchLayoutType4.QuickMenu }, width: { title: "Width", type: ControlType9.Number, defaultValue: 500, min: 200, max: 1e3, displayStepper: true, step: 5, hidden: (props) => props.layoutType === SearchLayoutType4.FixedTop }, top: { title: "Top", type: ControlType9.Number, defaultValue: 0, min: 0, max: 1e3, displayStepper: true, hidden: (props) => props.layoutType !== SearchLayoutType4.FixedTop }, heightIsStatic: { title: "Height", type: ControlType9.Boolean, enabledTitle: "Instant", disabledTitle: "Animate", hidden: ({ layoutType }) => layoutType !== SearchLayoutType4.QuickMenu }, heightTransition: { title: "Type", type: ControlType9.Transition, defaultValue: { type: "spring", stiffness: 800, damping: 60 }, hidden: ({ heightIsStatic, layoutType }) => layoutType !== SearchLayoutType4.QuickMenu || heightIsStatic }, borderRadius: { title: "Radius", type: ControlType9.Number, defaultValue: 16, displayStepper: true, min: 0, hidden: ({ layoutType }) => layoutType !== SearchLayoutType4.QuickMenu }, shadow: { buttonTitle: "Options", type: ControlType9.Object, defaultValue: { x: 0, y: 20, blur: 40, spread: 0, color: "rgba(0,0,0,0.2)" }, controls: { color: { type: ControlType9.Color, defaultValue: "rgba(0,0,0,0.2)" }, x: { type: ControlType9.Number, defaultValue: 0 }, y: { type: ControlType9.Number, defaultValue: 20 }, blur: { type: ControlType9.Number, defaultValue: 40 }, spread: { type: ControlType9.Number, defaultValue: 0 } } }, backgroundColor: { title: "Background", type: ControlType9.Color, defaultValue: "#FFF" }, [animationKeyFromLayout(SearchLayoutType4.QuickMenu)]: { title: "Animation", type: ControlType9.Object, icon: "effect", hidden: ({ layoutType }) => layoutType !== SearchLayoutType4.QuickMenu, optional: true, buttonTitle: "Options", controls: {
    opacity: { type: ControlType9.Number, defaultValue: 0.5, step: 0.1, min: 0, max: 1 },
    scale: { type: ControlType9.Number, defaultValue: 0.75, step: 0.1, min: 0, max: 2 },
    // rotate: {
    //     type: ControlType.Number,
    //     defaultValue: 0,
    //     min: -360,
    //     max: 360,
    // },
    x: { type: ControlType9.Number, defaultValue: 0, min: -500, max: 500 },
    y: { type: ControlType9.Number, defaultValue: 0, min: -500, max: 500 },
    transition: { type: ControlType9.Transition }
  } }, [animationKeyFromLayout(SearchLayoutType4.FixedTop)]: { title: "Animation", type: ControlType9.Object, icon: "effect", buttonTitle: "Options", hidden: ({ layoutType }) => layoutType !== SearchLayoutType4.FixedTop, optional: true, controls: { opacity: { type: ControlType9.Number, defaultValue: 0.8, step: 0.1, min: 0, max: 1 }, y: { type: ControlType9.Number, defaultValue: 0, min: -100, max: 100 }, transition: { type: ControlType9.Transition } } }, [animationKeyFromLayout(SearchLayoutType4.Sidebar)]: { title: "Animation", type: ControlType9.Object, icon: "effect", buttonTitle: "Options", hidden: ({ layoutType }) => layoutType !== SearchLayoutType4.Sidebar, optional: true, controls: { opacity: { type: ControlType9.Number, defaultValue: 0.8, step: 0.1, min: 0, max: 1 }, x: { type: ControlType9.Number, defaultValue: 0, min: -1e3, max: 1e3 }, transition: { type: ControlType9.Transition } } } } },
  resultOptions: {
    title: "Results",
    buttonTitle: "Fonts, Style",
    type: ControlType9.Object,
    defaultValue: {},
    // description:
    //     "Learn more about how to use Site Search [here](https://framer.com/learn/site-search)",
    controls: { itemType: { title: "Style", type: ControlType9.Enum, options: Object.values(SearchResultItemType4), optionTitles: Object.keys(SearchResultItemType4).map(titleCase), defaultValue: SearchResultItemType4.FullWidth }, titleFont: {
      title: "Title",
      // @ts-ignore - Internal
      type: ControlType9.Font,
      defaultValue: { fontSize: 15 },
      displayFontSize: true
    }, titleColor: { title: "Color", type: ControlType9.Color, defaultValue: "#333" }, titleType: { title: "Content", type: ControlType9.Enum, options: Object.values(SearchResultTitleType4), optionTitles: Object.keys(SearchResultTitleType4).map(titleCase), defaultValue: SearchResultTitleType4.H1, displaySegmentedControl: true }, subtitleOptions: { type: ControlType9.Object, title: "Subtitle", buttonTitle: "Font, Content", controls: { subtitleFont: {
      title: "Font",
      // @ts-ignore - Internal
      type: ControlType9.Font,
      defaultValue: { fontSize: 13 },
      displayFontSize: true
    }, subtitleColor: { title: "Color", type: ControlType9.Color, defaultValue: "rgba(0, 0, 0, 0.4)" }, subtitleType: { title: "Content", type: ControlType9.Enum, options: Object.values(SearchResultSubtitleType4), optionTitles: Object.keys(SearchResultSubtitleType4).map(titleCase), defaultValue: SearchResultSubtitleType4.Path } } } }
  },
  backdropOptions: { title: "Backdrop", type: ControlType9.Object, buttonTitle: "Color, Z Index", controls: { backgroundColor: { title: "Color", type: ControlType9.Color, defaultValue: "rgba(0, 0, 0, 0.8)" }, zIndex: { title: "Z Index", type: ControlType9.Number, defaultValue: 10, displayStepper: true, min: 0, max: 10 }, transition: { type: ControlType9.Transition } } }
});
EntryPoint.displayName = "Search";

// http-url:https://framerusercontent.com/modules/8eK1qtn6rVY6sQMrZGev/nRkKlG0pt9kdYGwxtW9w/r0KoeoJ3L.js
import { fontStore } from "./_framer-runtime.js";
fontStore.loadFonts(["FS;Manrope-medium", "FS;Manrope-bold"]);
var fonts = [{ explicitInter: true, fonts: [{ cssFamilyName: "Manrope", source: "fontshare", style: "normal", uiFamilyName: "Manrope", url: "https://framerusercontent.com/third-party-assets/fontshare/wf/BNWG6MUI4RTC6WEND2VPDH4MHMIVU3XZ/R5YXY5FMVG6PXU36GNEEA24MIPMEPGSM/CIM4KQCLZSMMLWPVH25IDDSTY4ENPHEY.woff2", weight: "500" }, { cssFamilyName: "Manrope", source: "fontshare", style: "normal", uiFamilyName: "Manrope", url: "https://framerusercontent.com/third-party-assets/fontshare/wf/NGBUP45ES3F7RD5XGKPEDJ6QEPO4TMOK/EXDVWJ2EDDVVV65UENMX33EDDYBX6OF7/6P4FPMFQH7CCC7RZ4UU4NKSGJ2RLF7V5.woff2", weight: "700" }] }];
var css9 = ['.framer-u2qdb .framer-styles-preset-1tx7kw:not(.rich-text-wrapper), .framer-u2qdb .framer-styles-preset-1tx7kw.rich-text-wrapper p { --framer-font-family: "Manrope", "Manrope Placeholder", sans-serif; --framer-font-family-bold: "Manrope", "Manrope Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 12px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-variation-axes: normal; --framer-font-weight: 500; --framer-font-weight-bold: 700; --framer-letter-spacing: 0em; --framer-line-height: 1.6em; --framer-paragraph-spacing: 20px; --framer-text-alignment: start; --framer-text-color: var(--token-9bf3fd56-1b46-466c-a3ae-db4f9717f0f5, #8a8a8a); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }'];
var className = "framer-u2qdb";

// http-url:https://framerusercontent.com/modules/OOzFZT1jJVtmOoY91ant/lcaWIA0glUedXcFQxlTz/fE2WzAJjM.js
var SearchFonts = getFonts(Search_default);
var MagnifyingGlassFonts = getFonts(gU109MUNe_default);
var enabledGestures = { sTa4OsxHi: { hover: true } };
var serializationHash = "framer-LMVVM";
var variantClassNames = { sTa4OsxHi: "framer-v-avx2zf" };
function addPropertyOverrides(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition1 = { delay: 0, duration: 0.3, ease: [0.44, 0, 0.56, 1], type: "tween" };
var Transition = ({ value, children }) => {
  const config = React13.useContext(MotionConfigContext);
  const transition = value ?? config.transition;
  const contextValue = React13.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx15(MotionConfigContext.Provider, { value: contextValue, children });
};
var Variants = motion15.create(React13.Fragment);
var getProps9 = ({ height, id, width, ...props }) => {
  return { ...props };
};
var createLayoutDependency = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component9 = /* @__PURE__ */ React13.forwardRef(function(props, ref) {
  const fallbackRef = useRef7(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React13.useId();
  const { activeLocale, setLocale } = useLocaleInfo9();
  const componentViewport = useComponentViewport();
  const { style, className: className5, layoutId, variant, ...restProps } = getProps9(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState({ defaultVariant: "sTa4OsxHi", enabledGestures, ref: refBinding, variant, variantClassNames });
  const layoutDependency = createLayoutDependency(props, variants);
  const sharedStyleClassNames = [className];
  const scopingClassNames = cx9(serializationHash, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx15(LayoutGroup, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx15(Variants, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx15(Transition, { value: transition1, children: /* @__PURE__ */ _jsxs7(motion15.div, { ...restProps, ...gestureHandlers, className: cx9(scopingClassNames, "framer-avx2zf", className5, classNames), "data-framer-name": "Default", layoutDependency, layoutId: "H6DtvFhKg__sTa4OsxHi", ref: refBinding, style: { backgroundColor: "var(--token-e233c1fe-1371-4e80-9a7e-9547f1402c95, rgb(242, 242, 242))", borderBottomLeftRadius: 68, borderBottomRightRadius: 68, borderTopLeftRadius: 68, borderTopRightRadius: 68, ...style }, variants: { "sTa4OsxHi-hover": { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 } }, ...addPropertyOverrides({ "sTa4OsxHi-hover": { "data-framer-name": void 0 } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx15(ComponentViewportProvider, { children: /* @__PURE__ */ _jsx15(SmartComponentScopedContainer, { className: "framer-jkzx6u-container", isAuthoredByUser: true, isModuleExternal: true, layoutDependency, layoutId: "H6DtvFhKg__g_nOFwVaZ-container", nodeId: "g_nOFwVaZ", rendersWithMotion: true, scopeId: "fE2WzAJjM", children: /* @__PURE__ */ _jsx15(Search_default, { backdropOptions: { backgroundColor: "rgba(0, 0, 0, 0.8)", transition: { damping: 60, delay: 0, mass: 1, stiffness: 500, type: "spring" }, zIndex: 10 }, height: "100%", iconColor: "var(--token-1b1e6fb9-f686-4369-89de-16170f51026a, rgb(15, 15, 15))", iconSize: 0, iconType: "default", id: "g_nOFwVaZ", inputOptions: { clearButtonText: "Clear", clearButtonType: "icon", dividerType: "fullWidth", iconOptions: { iconColor: "rgba(0, 0, 0, 0.45)", iconSize: 18, iconType: "default" }, inputFont: {}, placeholderOptions: { placeholderColor: "rgba(0, 0, 0, 0.4)", placeholderText: "Search..." }, textColor: "rgb(51, 51, 51)" }, layoutId: "H6DtvFhKg__g_nOFwVaZ", modalOptions: { backgroundColor: "rgb(255, 255, 255)", borderRadius: 16, heightIsStatic: true, heightTransition: { damping: 60, delay: 0, mass: 1, stiffness: 800, type: "spring" }, layoutType: "QuickMenu", shadow: { blur: 40, color: "rgba(0, 0, 0, 0.2)", spread: 0, x: 0, y: 20 }, top: 0, width: 500 }, resultOptions: { itemType: "fullWidth", subtitleOptions: { subtitleColor: "rgba(0, 0, 0, 0.4)", subtitleFont: {}, subtitleType: "path" }, titleColor: "rgb(51, 51, 51)", titleFont: {}, titleType: "h1" }, style: { height: "100%", width: "100%" }, width: "100%" }) }) }), /* @__PURE__ */ _jsx15(RichText, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx15(React13.Fragment, { children: /* @__PURE__ */ _jsx15(motion15.p, { className: "framer-styles-preset-1tx7kw", "data-styles-preset": "r0KoeoJ3L", children: "Search" }) }), className: "framer-rlwud3", fonts: ["Inter"], layoutDependency, layoutId: "H6DtvFhKg__sMmlq8B_t", style: { "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, variants: { "sTa4OsxHi-hover": { "--extracted-r6o4lv": "var(--token-9bf3fd56-1b46-466c-a3ae-db4f9717f0f5, rgb(138, 138, 138))" } }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides({ "sTa4OsxHi-hover": { children: /* @__PURE__ */ _jsx15(React13.Fragment, { children: /* @__PURE__ */ _jsx15(motion15.p, { className: "framer-styles-preset-1tx7kw", "data-styles-preset": "r0KoeoJ3L", style: { "--framer-text-color": "var(--extracted-r6o4lv, var(--token-9bf3fd56-1b46-466c-a3ae-db4f9717f0f5, rgb(138, 138, 138)))" }, children: /* @__PURE__ */ _jsx15(motion15.strong, { children: "Search for keyword..." }) }) }), fonts: ["Inter", "Inter-Bold"] } }, baseVariant, gestureVariant) }), /* @__PURE__ */ _jsx15(gU109MUNe_default, { animated: true, className: "framer-1c9w46i", layoutDependency, layoutId: "H6DtvFhKg__S2hS2iBHe", style: { "--1m6trwb": 0, "--21h8s6": "var(--token-9bf3fd56-1b46-466c-a3ae-db4f9717f0f5, rgb(138, 138, 138))", "--pgex8v": 1.5 }, variants: { "sTa4OsxHi-hover": { "--21h8s6": "var(--token-1b1e6fb9-f686-4369-89de-16170f51026a, rgb(15, 15, 15))" } } })] }) }) }) });
});
var css10 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-LMVVM.framer-1scfyl6, .framer-LMVVM .framer-1scfyl6 { display: block; }", ".framer-LMVVM.framer-avx2zf { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; height: auto; justify-content: space-between; overflow: visible; padding: 10px 8px 10px 10px; position: relative; width: 100%; }", ".framer-LMVVM .framer-jkzx6u-container { bottom: 0px; cursor: pointer; flex: none; left: 0px; position: absolute; right: 0px; top: 0px; z-index: 1; }", ".framer-LMVVM .framer-rlwud3 { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-LMVVM .framer-1c9w46i { flex: none; height: var(--framer-aspect-ratio-supported, 12px); position: relative; width: 12px; }", ".framer-LMVVM.framer-v-avx2zf.hover.framer-avx2zf { gap: 8px; justify-content: flex-start; width: 100%; }", ".framer-LMVVM.framer-v-avx2zf.hover .framer-jkzx6u-container { order: 0; }", ".framer-LMVVM.framer-v-avx2zf.hover .framer-rlwud3 { order: 2; }", ".framer-LMVVM.framer-v-avx2zf.hover .framer-1c9w46i { order: 1; }", ...css9];
var FramerfE2WzAJjM = withCSS10(Component9, css10, "framer-LMVVM");
var fE2WzAJjM_default = FramerfE2WzAJjM;
FramerfE2WzAJjM.displayName = "Search Bar";
FramerfE2WzAJjM.defaultProps = { height: 33, width: 130 };
addFonts(FramerfE2WzAJjM, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/DpPBYI0sL4fYLgAkX8KXOPVt7c.woff2", weight: "700" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/4RAEQdEOrcnDkhHiiCbJOw92Lk.woff2", weight: "700" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/1K3W8DizY3v4emK8Mb08YHxTbs.woff2", weight: "700" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/tUSCtfYVM1I1IchuyCwz9gDdQ.woff2", weight: "700" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/VgYFWiwsAC5OYxAycRXXvhze58.woff2", weight: "700" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/syRNPWzAMIrcJ3wIlPIP43KjQs.woff2", weight: "700" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/GIryZETIX4IFypco5pYZONKhJIo.woff2", weight: "700" }] }, ...SearchFonts, ...MagnifyingGlassFonts, ...getFontsFromSharedStyle(fonts)], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/exCUnedHQj9TocdZ7YyD/XuOyEL5MA8N2XkRtNogf/HidsWRkFi.js
import { jsx as _jsx16 } from "react/jsx-runtime";
import { addFonts as addFonts2, addPropertyControls as addPropertyControls10, ControlType as ControlType10, cx as cx10, getFontsFromSharedStyle as getFontsFromSharedStyle2, Link, RichText as RichText2, useComponentViewport as useComponentViewport2, useLocaleInfo as useLocaleInfo10, useVariantState as useVariantState2, withCSS as withCSS11 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup2, motion as motion16, MotionConfigContext as MotionConfigContext2 } from "framer-motion";
import * as React14 from "react";
import { useRef as useRef8 } from "react";

// http-url:https://framerusercontent.com/modules/e9cNIL7ALqNbYLSks8o1/3qnhSnCDvytxYmdPruoc/lMJjY3v8f.js
import { fontStore as fontStore2 } from "./_framer-runtime.js";
fontStore2.loadFonts(["GF;Zalando Sans-regular", "GF;Zalando Sans-600", "GF;Zalando Sans-700italic", "GF;Zalando Sans-italic"]);
var fonts2 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Zalando Sans", openType: true, source: "google", style: "normal", uiFamilyName: "Zalando Sans", url: "https://fonts.gstatic.com/s/zalandosans/v2/FwZ67-Asy1Em_lq_aK3hpr-RrktWHD54lnesO2lsVvrnhgw8zPbXoT87PzkWYUMEgzhp.woff2", weight: "400" }, { cssFamilyName: "Zalando Sans", openType: true, source: "google", style: "normal", uiFamilyName: "Zalando Sans", url: "https://fonts.gstatic.com/s/zalandosans/v2/FwZ67-Asy1Em_lq_aK3hpr-RrktWHD54lnesO2lsVvrnhgw8zPbXoT_lODkWYUMEgzhp.woff2", weight: "600" }, { cssFamilyName: "Zalando Sans", openType: true, source: "google", style: "italic", uiFamilyName: "Zalando Sans", url: "https://fonts.gstatic.com/s/zalandosans/v2/FwZ47-Asy1Em_lq_aK3hpr-7p3m1_EcrANmrLqEupLPVedRVp2x5pirzfDZXa0Imhihp69o.woff2", weight: "700" }, { cssFamilyName: "Zalando Sans", openType: true, source: "google", style: "italic", uiFamilyName: "Zalando Sans", url: "https://fonts.gstatic.com/s/zalandosans/v2/FwZ47-Asy1Em_lq_aK3hpr-7p3m1_EcrANmrLqEupLPVedRVp2x5pirzfNFQa0Imhihp69o.woff2", weight: "400" }] }];
var css11 = [`.framer-ipiqa .framer-styles-preset-1dnr4lh:not(.rich-text-wrapper), .framer-ipiqa .framer-styles-preset-1dnr4lh.rich-text-wrapper p { --framer-font-family: "Zalando Sans", "Zalando Sans Placeholder", sans-serif; --framer-font-family-bold: "Zalando Sans", "Zalando Sans Placeholder", sans-serif; --framer-font-family-bold-italic: "Zalando Sans", "Zalando Sans Placeholder", sans-serif; --framer-font-family-italic: "Zalando Sans", "Zalando Sans Placeholder", sans-serif; --framer-font-open-type-features: 'blwf' on, 'cv09' on, 'cv03' on, 'cv04' on, 'cv11' on; --framer-font-size: 14px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-font-weight-bold: 600; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 400; --framer-letter-spacing: 0em; --framer-line-height: 1.4em; --framer-paragraph-spacing: 20px; --framer-text-alignment: start; --framer-text-color: var(--token-1b1e6fb9-f686-4369-89de-16170f51026a, #0f0f0f); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }`];
var className2 = "framer-ipiqa";

// http-url:https://framerusercontent.com/modules/exCUnedHQj9TocdZ7YyD/XuOyEL5MA8N2XkRtNogf/HidsWRkFi.js
var enabledGestures2 = { ovo48s5PJ: { hover: true } };
var serializationHash2 = "framer-nnnG6";
var variantClassNames2 = { ovo48s5PJ: "framer-v-1bkb6u8" };
function addPropertyOverrides2(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition12 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition2 = ({ value, children }) => {
  const config = React14.useContext(MotionConfigContext2);
  const transition = value ?? config.transition;
  const contextValue = React14.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx16(MotionConfigContext2.Provider, { value: contextValue, children });
};
var Variants2 = motion16.create(React14.Fragment);
var getProps10 = ({ height, id, link, name1, width, ...props }) => {
  return { ...props, hkPmoUKcL: link ?? props.hkPmoUKcL, zae0YDC0z: name1 ?? props.zae0YDC0z ?? "Dogs" };
};
var createLayoutDependency2 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component10 = /* @__PURE__ */ React14.forwardRef(function(props, ref) {
  const fallbackRef = useRef8(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React14.useId();
  const { activeLocale, setLocale } = useLocaleInfo10();
  const componentViewport = useComponentViewport2();
  const { style, className: className5, layoutId, variant, zae0YDC0z, hkPmoUKcL, ...restProps } = getProps10(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState2({ defaultVariant: "ovo48s5PJ", enabledGestures: enabledGestures2, ref: refBinding, variant, variantClassNames: variantClassNames2 });
  const layoutDependency = createLayoutDependency2(props, variants);
  const sharedStyleClassNames = [className2];
  const scopingClassNames = cx10(serializationHash2, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx16(LayoutGroup2, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx16(Variants2, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx16(Transition2, { value: transition12, children: /* @__PURE__ */ _jsx16(Link, { href: hkPmoUKcL, motionChild: true, nodeId: "ovo48s5PJ", openInNewTab: false, scopeId: "HidsWRkFi", smoothScroll: true, children: /* @__PURE__ */ _jsx16(motion16.a, { ...restProps, ...gestureHandlers, className: `${cx10(scopingClassNames, "framer-1bkb6u8", className5, classNames)} framer-1o7o9ic`, "data-framer-name": "Default", layoutDependency, layoutId: "H6DtvFhKg__ovo48s5PJ", ref: refBinding, style: { "--border-bottom-width": "0px", "--border-color": "rgba(0, 0, 0, 0)", "--border-left-width": "0px", "--border-right-width": "0px", "--border-style": "solid", "--border-top-width": "0px", ...style }, variants: { "ovo48s5PJ-hover": { "--border-bottom-width": "1px", "--border-color": "var(--token-9bf3fd56-1b46-466c-a3ae-db4f9717f0f5, rgb(138, 138, 138))", "--border-left-width": "0px", "--border-right-width": "0px", "--border-style": "solid", "--border-top-width": "0px" } }, ...addPropertyOverrides2({ "ovo48s5PJ-hover": { "data-border": true, "data-framer-name": void 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx16(RichText2, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx16(React14.Fragment, { children: /* @__PURE__ */ _jsx16(motion16.p, { className: "framer-styles-preset-1dnr4lh", "data-styles-preset": "lMJjY3v8f", children: "Dogs" }) }), className: "framer-3yia4b", fonts: ["Inter"], layoutDependency, layoutId: "H6DtvFhKg__ob5UJuqL0", text: zae0YDC0z, verticalAlignment: "top", withExternalLayout: true }) }) }) }) }) });
});
var css12 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-nnnG6.framer-1o7o9ic, .framer-nnnG6 .framer-1o7o9ic { display: block; }", ".framer-nnnG6.framer-1bkb6u8 { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; text-decoration: none; width: min-content; }", ".framer-nnnG6 .framer-3yia4b { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ...css11, '.framer-nnnG6[data-border="true"]::after, .framer-nnnG6 [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FramerHidsWRkFi = withCSS11(Component10, css12, "framer-nnnG6");
var HidsWRkFi_default = FramerHidsWRkFi;
FramerHidsWRkFi.displayName = "Secondary Link";
FramerHidsWRkFi.defaultProps = { height: 20, width: 34 };
addPropertyControls10(FramerHidsWRkFi, { zae0YDC0z: { defaultValue: "Dogs", displayTextArea: false, title: "Name", type: ControlType10.String }, hkPmoUKcL: { title: "Link", type: ControlType10.Link } });
addFonts2(FramerHidsWRkFi, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }] }, ...getFontsFromSharedStyle2(fonts2)], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/eppxcAzLT4bEVlQI8dMN/I6QmEzTUDMkvkugJOjc8/WXSGorNXU.js
import { jsx as _jsx23, jsxs as _jsxs11, Fragment as _Fragment } from "react/jsx-runtime";
import { addFonts as addFonts8, addPropertyControls as addPropertyControls17, ComponentViewportProvider as ComponentViewportProvider5, ControlType as ControlType17, cx as cx17, Floating, getFonts as getFonts5, getFontsFromSharedStyle as getFontsFromSharedStyle7, RichText as RichText7, SmartComponentScopedContainer as SmartComponentScopedContainer5, useActiveVariantCallback as useActiveVariantCallback3, useComponentViewport as useComponentViewport8, useLocaleInfo as useLocaleInfo16, useOverlayState, useVariantState as useVariantState8, withCSS as withCSS18, withFX as withFX3 } from "./_framer-runtime.js";
import { AnimatePresence as AnimatePresence2, LayoutGroup as LayoutGroup8, motion as motion23, MotionConfigContext as MotionConfigContext8 } from "framer-motion";
import * as React21 from "react";
import { useRef as useRef15 } from "react";

// http-url:https://framerusercontent.com/modules/6YIE39d4Fd9Lt8R5iYNc/r6Kh6T7uYa4SfYrbFYgN/djdXZjS4N.js
import { jsx as _jsx17 } from "react/jsx-runtime";
import { addPropertyControls as addPropertyControls11, ControlType as ControlType11, cx as cx11, motion as motion17, withCSS as withCSS12 } from "./_framer-runtime.js";
import * as React15 from "react";
import { forwardRef as forwardRef25 } from "react";
var mask9 = `url('data:image/svg+xml,<svg display="block" role="presentation" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M 0 0 L 5 5 L 10 0 Z" fill="var(--esondr, rgb(0,0,0))" height="5px" id="Sh5xKHxIt" transform="translate(7 9.5)" width="10px"/></svg>') alpha no-repeat center / auto var(--framer-icon-mask-mode, add), var(--framer-icon-mask, none)`;
var SVG9 = /* @__PURE__ */ forwardRef25((props, ref) => {
  const { animated, layoutId, children, ...rest } = props;
  return animated ? /* @__PURE__ */ _jsx17(motion17.div, { ...rest, layoutId, ref }) : /* @__PURE__ */ _jsx17("div", { ...rest, ref });
});
var getProps11 = ({ fill, height, id, width, ...props }) => {
  return { ...props, K5AAorpEW: fill ?? props.K5AAorpEW ?? "rgb(0, 0, 0)" };
};
var Component11 = /* @__PURE__ */ React15.forwardRef(function(props, ref) {
  const { style, className: className5, layoutId, variant, K5AAorpEW, ...restProps } = getProps11(props);
  return /* @__PURE__ */ _jsx17(SVG9, { ...restProps, className: cx11("framer-hdN4F", className5), layoutId, ref, style: { "--esondr": K5AAorpEW, ...style } });
});
var css13 = [`.framer-hdN4F { -webkit-mask: ${mask9}; aspect-ratio: 1; background-color: var(--esondr); mask: ${mask9}; width: 24px; }`];
var Icon9 = withCSS12(Component11, css13, "framer-hdN4F");
Icon9.displayName = "Arrow Drop Down";
var djdXZjS4N_default = Icon9;
addPropertyControls11(Icon9, { K5AAorpEW: { defaultValue: "rgb(0, 0, 0)", hidden: false, title: "Fill", type: ControlType11.Color } });

// http-url:https://framerusercontent.com/modules/vCguV9lnoxLz6NcQJVdV/LeD4M5UiYYaBYNsp6xT0/Dvya5fqDf.js
import { fontStore as fontStore3 } from "./_framer-runtime.js";
fontStore3.loadFonts(["GF;Zalando Sans-500", "GF;Zalando Sans-600", "GF;Zalando Sans-700italic", "GF;Zalando Sans-500italic"]);
var fonts3 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Zalando Sans", openType: true, source: "google", style: "normal", uiFamilyName: "Zalando Sans", url: "https://fonts.gstatic.com/s/zalandosans/v2/FwZ67-Asy1Em_lq_aK3hpr-RrktWHD54lnesO2lsVvrnhgw8zPbXoT8JPzkWYUMEgzhp.woff2", weight: "500" }, { cssFamilyName: "Zalando Sans", openType: true, source: "google", style: "normal", uiFamilyName: "Zalando Sans", url: "https://fonts.gstatic.com/s/zalandosans/v2/FwZ67-Asy1Em_lq_aK3hpr-RrktWHD54lnesO2lsVvrnhgw8zPbXoT_lODkWYUMEgzhp.woff2", weight: "600" }, { cssFamilyName: "Zalando Sans", openType: true, source: "google", style: "italic", uiFamilyName: "Zalando Sans", url: "https://fonts.gstatic.com/s/zalandosans/v2/FwZ47-Asy1Em_lq_aK3hpr-7p3m1_EcrANmrLqEupLPVedRVp2x5pirzfDZXa0Imhihp69o.woff2", weight: "700" }, { cssFamilyName: "Zalando Sans", openType: true, source: "google", style: "italic", uiFamilyName: "Zalando Sans", url: "https://fonts.gstatic.com/s/zalandosans/v2/FwZ47-Asy1Em_lq_aK3hpr-7p3m1_EcrANmrLqEupLPVedRVp2x5pirzfONQa0Imhihp69o.woff2", weight: "500" }] }];
var css14 = [`.framer-DlQjV .framer-styles-preset-xvuzl8:not(.rich-text-wrapper), .framer-DlQjV .framer-styles-preset-xvuzl8.rich-text-wrapper p { --framer-font-family: "Zalando Sans", "Zalando Sans Placeholder", sans-serif; --framer-font-family-bold: "Zalando Sans", "Zalando Sans Placeholder", sans-serif; --framer-font-family-bold-italic: "Zalando Sans", "Zalando Sans Placeholder", sans-serif; --framer-font-family-italic: "Zalando Sans", "Zalando Sans Placeholder", sans-serif; --framer-font-open-type-features: 'blwf' on, 'cv09' on, 'cv03' on, 'cv04' on, 'cv11' on; --framer-font-size: calc(var(--framer-root-font-size, 1rem) * 1.375); --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 500; --framer-font-weight-bold: 600; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 500; --framer-letter-spacing: 0em; --framer-line-height: 1em; --framer-paragraph-spacing: 20px; --framer-text-alignment: start; --framer-text-color: var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: none; }`];
var className3 = "framer-DlQjV";

// http-url:https://framerusercontent.com/modules/Qcy3wPgIzC1HW69CRmKr/rnzgPQ29DemuvV4rBJen/gQ1nc7zls.js
import { jsx as _jsx22, jsxs as _jsxs10 } from "react/jsx-runtime";
import { addFonts as addFonts7, addPropertyControls as addPropertyControls16, ComponentViewportProvider as ComponentViewportProvider4, ControlType as ControlType16, cx as cx16, getFonts as getFonts4, SmartComponentScopedContainer as SmartComponentScopedContainer4, useComponentViewport as useComponentViewport7, useLocaleInfo as useLocaleInfo15, useVariantState as useVariantState7, withCSS as withCSS17, withFX as withFX2, withOptimizedAppearEffect as withOptimizedAppearEffect2 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup7, motion as motion22, MotionConfigContext as MotionConfigContext7 } from "framer-motion";
import * as React20 from "react";
import { useRef as useRef13 } from "react";

// http-url:https://framerusercontent.com/modules/rY46vt2Ri9PNSdplh8pR/7qZrIiLVzftkIM7o5M21/LDXuwrbTo.js
import { jsx as _jsx19, jsxs as _jsxs8 } from "react/jsx-runtime";
import { addFonts as addFonts4, addPropertyControls as addPropertyControls13, ComponentViewportProvider as ComponentViewportProvider2, ControlType as ControlType13, cx as cx13, getFonts as getFonts2, getFontsFromSharedStyle as getFontsFromSharedStyle4, getLoadingLazyAtYPosition, Image, Instance, RichText as RichText4, SmartComponentScopedContainer as SmartComponentScopedContainer2, useComponentViewport as useComponentViewport4, useLocaleInfo as useLocaleInfo12, useVariantState as useVariantState4, withCSS as withCSS14, withFX, withOptimizedAppearEffect } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup4, motion as motion19, MotionConfigContext as MotionConfigContext4 } from "framer-motion";
import * as React17 from "react";
import { useRef as useRef10 } from "react";

// http-url:https://framerusercontent.com/modules/37U9niFNgbx5WeP6rrCm/O13LLw8g7zak6lJ45jkg/Fc2cHuCXU.js
import { fontStore as fontStore4 } from "./_framer-runtime.js";
fontStore4.loadFonts(["GF;Zalando Sans-regular", "GF;Zalando Sans-700", "GF;Zalando Sans-700italic", "GF;Zalando Sans-italic"]);
var fonts4 = [{ explicitInter: true, fonts: [{ cssFamilyName: "Zalando Sans", source: "google", style: "normal", uiFamilyName: "Zalando Sans", url: "https://fonts.gstatic.com/s/zalandosans/v2/FwZ67-Asy1Em_lq_aK3hpr-RrktWHD54lnesO2lsVvrnhgw8zPbXoT87PzkWYUMEgzhp.woff2", weight: "400" }, { cssFamilyName: "Zalando Sans", source: "google", style: "normal", uiFamilyName: "Zalando Sans", url: "https://fonts.gstatic.com/s/zalandosans/v2/FwZ67-Asy1Em_lq_aK3hpr-RrktWHD54lnesO2lsVvrnhgw8zPbXoT_cODkWYUMEgzhp.woff2", weight: "700" }, { cssFamilyName: "Zalando Sans", source: "google", style: "italic", uiFamilyName: "Zalando Sans", url: "https://fonts.gstatic.com/s/zalandosans/v2/FwZ47-Asy1Em_lq_aK3hpr-7p3m1_EcrANmrLqEupLPVedRVp2x5pirzfDZXa0Imhihp69o.woff2", weight: "700" }, { cssFamilyName: "Zalando Sans", source: "google", style: "italic", uiFamilyName: "Zalando Sans", url: "https://fonts.gstatic.com/s/zalandosans/v2/FwZ47-Asy1Em_lq_aK3hpr-7p3m1_EcrANmrLqEupLPVedRVp2x5pirzfNFQa0Imhihp69o.woff2", weight: "400" }] }];
var css15 = ['.framer-Bd2uI .framer-styles-preset-11khw5m:not(.rich-text-wrapper), .framer-Bd2uI .framer-styles-preset-11khw5m.rich-text-wrapper p { --framer-font-family: "Zalando Sans", "Zalando Sans Placeholder", sans-serif; --framer-font-family-bold: "Zalando Sans", "Zalando Sans Placeholder", sans-serif; --framer-font-family-bold-italic: "Zalando Sans", "Zalando Sans Placeholder", sans-serif; --framer-font-family-italic: "Zalando Sans", "Zalando Sans Placeholder", sans-serif; --framer-font-open-type-features: normal; --framer-font-size: 10px; --framer-font-style: normal; --framer-font-style-bold: normal; --framer-font-style-bold-italic: italic; --framer-font-style-italic: italic; --framer-font-variation-axes: normal; --framer-font-weight: 400; --framer-font-weight-bold: 700; --framer-font-weight-bold-italic: 700; --framer-font-weight-italic: 400; --framer-letter-spacing: 0em; --framer-line-height: 1.5em; --framer-paragraph-spacing: 20px; --framer-text-alignment: start; --framer-text-color: var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, #000000); --framer-text-decoration: none; --framer-text-stroke-color: initial; --framer-text-stroke-width: initial; --framer-text-transform: uppercase; }'];
var className4 = "framer-Bd2uI";

// http-url:https://framerusercontent.com/modules/x1WU4cfSQGS1HxeK9vnt/xoZXdmha6SwkVDKeXb1a/uwIvHjxaY.js
import { jsx as _jsx18 } from "react/jsx-runtime";
import { addFonts as addFonts3, addPropertyControls as addPropertyControls12, ControlType as ControlType12, cx as cx12, getFontsFromSharedStyle as getFontsFromSharedStyle3, RichText as RichText3, useActiveVariantCallback, useComponentViewport as useComponentViewport3, useLocaleInfo as useLocaleInfo11, useVariantState as useVariantState3, withCSS as withCSS13 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup3, motion as motion18, MotionConfigContext as MotionConfigContext3 } from "framer-motion";
import * as React16 from "react";
import { useRef as useRef9 } from "react";
var enabledGestures3 = { MjCU9Ckcz: { hover: true }, xczElmU1c: { hover: true } };
var cycleOrder = ["MjCU9Ckcz", "xczElmU1c"];
var serializationHash3 = "framer-bRUe3";
var variantClassNames3 = { MjCU9Ckcz: "framer-v-1rv8yji", xczElmU1c: "framer-v-13uxmui" };
function addPropertyOverrides3(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var numberToPixelString = (value) => {
  if (typeof value !== "number")
    return value;
  if (!Number.isFinite(value))
    return void 0;
  return Math.max(0, value) + "px";
};
var transition13 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition3 = ({ value, children }) => {
  const config = React16.useContext(MotionConfigContext3);
  const transition = value ?? config.transition;
  const contextValue = React16.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx18(MotionConfigContext3.Provider, { value: contextValue, children });
};
var Variants3 = motion18.create(React16.Fragment);
var humanReadableVariantMap = { Primary: "MjCU9Ckcz", Secondary: "xczElmU1c" };
var getProps12 = ({ click, height, id, padding, title, width, ...props }) => {
  return { ...props, biVIu0pke: click ?? props.biVIu0pke, KS1Dij2Tl: padding ?? props.KS1Dij2Tl ?? "12px", variant: humanReadableVariantMap[props.variant] ?? props.variant ?? "MjCU9Ckcz", VLZiDyLYl: title ?? props.VLZiDyLYl ?? "Add to cart" };
};
var createLayoutDependency3 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component12 = /* @__PURE__ */ React16.forwardRef(function(props, ref) {
  const fallbackRef = useRef9(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React16.useId();
  const { activeLocale, setLocale } = useLocaleInfo11();
  const componentViewport = useComponentViewport3();
  const { style, className: className5, layoutId, variant, VLZiDyLYl, KS1Dij2Tl, biVIu0pke, ...restProps } = getProps12(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState3({ cycleOrder, defaultVariant: "MjCU9Ckcz", enabledGestures: enabledGestures3, ref: refBinding, variant, variantClassNames: variantClassNames3 });
  const layoutDependency = createLayoutDependency3(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback(baseVariant);
  const onTap4wu7t9 = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    if (biVIu0pke) {
      const res = await biVIu0pke(...args);
      if (res === false)
        return false;
    }
  });
  const sharedStyleClassNames = [className2];
  const scopingClassNames = cx12(serializationHash3, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx18(LayoutGroup3, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx18(Variants3, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx18(Transition3, { value: transition13, children: /* @__PURE__ */ _jsx18(motion18.div, { ...restProps, ...gestureHandlers, className: cx12(scopingClassNames, "framer-1rv8yji", className5, classNames), "data-border": true, "data-framer-name": "Primary", "data-highlight": true, layoutDependency, layoutId: "H6DtvFhKg__MjCU9Ckcz", onTap: onTap4wu7t9, ref: refBinding, style: { "--15t0sg": numberToPixelString(KS1Dij2Tl), "--border-bottom-width": "1px", "--border-color": "var(--token-1b1e6fb9-f686-4369-89de-16170f51026a, rgb(15, 15, 15))", "--border-left-width": "1px", "--border-right-width": "1px", "--border-style": "solid", "--border-top-width": "1px", backgroundColor: "rgba(0, 0, 0, 0)", borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8, opacity: 1, ...style }, variants: { "MjCU9Ckcz-hover": { backgroundColor: "var(--token-0834919c-05ed-4e19-9659-51e48ddfbbae, rgb(250, 250, 250))" }, "xczElmU1c-hover": { opacity: 0.8 }, xczElmU1c: { "--border-bottom-width": "0px", "--border-left-width": "0px", "--border-right-width": "0px", "--border-top-width": "0px", backgroundColor: "var(--token-7f451cbc-f6df-41cb-a0b7-b251897182b3, rgb(193, 210, 217))" } }, ...addPropertyOverrides3({ "MjCU9Ckcz-hover": { "data-framer-name": void 0 }, "xczElmU1c-hover": { "data-framer-name": void 0 }, xczElmU1c: { "data-framer-name": "Secondary" } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx18(RichText3, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx18(React16.Fragment, { children: /* @__PURE__ */ _jsx18(motion18.p, { className: "framer-styles-preset-1dnr4lh", "data-styles-preset": "lMJjY3v8f", children: "Add to cart" }) }), className: "framer-i46br3", fonts: ["Inter"], layoutDependency, layoutId: "H6DtvFhKg__h5abLCR_b", style: { "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: VLZiDyLYl, verticalAlignment: "top", withExternalLayout: true }) }) }) }) });
});
var css16 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-bRUe3.framer-1k0rk3j, .framer-bRUe3 .framer-1k0rk3j { display: block; }", ".framer-bRUe3.framer-1rv8yji { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; min-width: 130px; overflow: var(--overflow-clip-fallback, clip); padding: var(--15t0sg); position: relative; width: min-content; will-change: var(--framer-will-change-override, transform); }", ".framer-bRUe3 .framer-i46br3 { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ...css11, '.framer-bRUe3[data-border="true"]::after, .framer-bRUe3 [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FrameruwIvHjxaY = withCSS13(Component12, css16, "framer-bRUe3");
var uwIvHjxaY_default = FrameruwIvHjxaY;
FrameruwIvHjxaY.displayName = "Button";
FrameruwIvHjxaY.defaultProps = { height: 44, width: 130 };
addPropertyControls12(FrameruwIvHjxaY, { variant: { options: ["MjCU9Ckcz", "xczElmU1c"], optionTitles: ["Primary", "Secondary"], title: "Variant", type: ControlType12.Enum }, VLZiDyLYl: { defaultValue: "Add to cart", displayTextArea: false, title: "Title", type: ControlType12.String }, KS1Dij2Tl: { defaultValue: "12px", title: "Padding", type: ControlType12.Padding }, biVIu0pke: { title: "Click", type: ControlType12.EventHandler } });
addFonts3(FrameruwIvHjxaY, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }] }, ...getFontsFromSharedStyle3(fonts2)], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/rY46vt2Ri9PNSdplh8pR/7qZrIiLVzftkIM7o5M21/LDXuwrbTo.js
var ButtonFonts = getFonts2(uwIvHjxaY_default);
var MotionDivWithFXWithOptimizedAppearEffect = withOptimizedAppearEffect(withFX(motion19.div));
var serializationHash4 = "framer-x7qgb";
var variantClassNames4 = { lv0IU6o6B: "framer-v-124ppz2" };
var transition14 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var transition2 = { bounce: 0.2, delay: 0.3, duration: 0.4, type: "spring" };
var animation = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition2, x: 0, y: 0 };
var animation1 = { opacity: 1e-3, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, x: -20, y: 0 };
var isSet = (value) => {
  if (Array.isArray(value))
    return value.length > 0;
  return value !== void 0 && value !== null && value !== "";
};
var transition3 = { delay: 0.4, duration: 0.4, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation2 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition3, x: 0, y: 0 };
var animation3 = { opacity: 1e-3, rotate: 0, rotateX: 0, rotateY: 0, scale: 0.5, skewX: 0, skewY: 0, x: -40, y: 0 };
var toResponsiveImage = (value) => {
  if (typeof value === "object" && value !== null && typeof value.src === "string") {
    return value;
  }
  return typeof value === "string" ? { src: value } : void 0;
};
var Transition4 = ({ value, children }) => {
  const config = React17.useContext(MotionConfigContext4);
  const transition = value ?? config.transition;
  const contextValue = React17.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx19(MotionConfigContext4.Provider, { value: contextValue, children });
};
var Variants4 = motion19.create(React17.Fragment);
var getProps13 = ({ badge, badgeColor, badgeIcon, description, height, id, image, title, width, ...props }) => {
  return { ...props, da4YRdA46: image ?? props.da4YRdA46 ?? { pixelHeight: 668, pixelWidth: 668, src: "https://framerusercontent.com/images/rbBkH7YInKmRpxipaOTrn2pkTg.png?width=668&height=668", srcSet: "https://framerusercontent.com/images/rbBkH7YInKmRpxipaOTrn2pkTg.png?scale-down-to=512&width=668&height=668 512w,https://framerusercontent.com/images/rbBkH7YInKmRpxipaOTrn2pkTg.png?width=668&height=668 668w" }, Hn3rFsdHu: title ?? props.Hn3rFsdHu ?? "Premium salmon recipe", J7aEOY5gs: badgeColor ?? props.J7aEOY5gs ?? "rgb(255, 255, 255)", NIzV_a1C2: description ?? props.NIzV_a1C2 ?? "Grain-free formula with wild-caught salmon and superfoods for optimal health.", tGoganY_w: badgeIcon ?? props.tGoganY_w ?? pKERsxd4H_default, zlmFNV1Lm: badge ?? props.zlmFNV1Lm ?? "BESTELLER" };
};
var createLayoutDependency4 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component13 = /* @__PURE__ */ React17.forwardRef(function(props, ref) {
  const fallbackRef = useRef10(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React17.useId();
  const { activeLocale, setLocale } = useLocaleInfo12();
  const componentViewport = useComponentViewport4();
  const { style, className: className5, layoutId, variant, da4YRdA46, zlmFNV1Lm, tGoganY_w, J7aEOY5gs, Hn3rFsdHu, NIzV_a1C2, ...restProps } = getProps13(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState4({ defaultVariant: "lv0IU6o6B", ref: refBinding, variant, variantClassNames: variantClassNames4 });
  const layoutDependency = createLayoutDependency4(props, variants);
  const sharedStyleClassNames = [className4, className3, className];
  const scopingClassNames = cx13(serializationHash4, ...sharedStyleClassNames);
  const visible = isSet(zlmFNV1Lm);
  return /* @__PURE__ */ _jsx19(LayoutGroup4, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx19(Variants4, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx19(Transition4, { value: transition14, children: /* @__PURE__ */ _jsxs8(motion19.div, { ...restProps, ...gestureHandlers, className: cx13(scopingClassNames, "framer-124ppz2", className5, classNames), "data-framer-name": "Default", layoutDependency, layoutId: "H6DtvFhKg__lv0IU6o6B", ref: refBinding, style: { backgroundColor: "var(--token-e564ebb6-0b43-444a-84f3-736d54a8ff5c, rgb(240, 240, 240))", borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, boxShadow: "0px 0px 8px 0px rgba(0, 0, 0, 0.04)", ...style }, children: [/* @__PURE__ */ _jsxs8(MotionDivWithFXWithOptimizedAppearEffect, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation, className: "framer-u8ixxu", "data-framer-appear-id": "u8ixxu", initial: animation1, layoutDependency, layoutId: "H6DtvFhKg__pRcvEt4js", optimized: true, children: [/* @__PURE__ */ _jsxs8(motion19.div, { className: "framer-1d7xcwf", layoutDependency, layoutId: "H6DtvFhKg__m0Y3ik5W_", children: [visible !== false && /* @__PURE__ */ _jsxs8(motion19.div, { className: "framer-1d1ew4k", layoutDependency, layoutId: "H6DtvFhKg__tU5mpsPSd", style: { backgroundColor: J7aEOY5gs }, children: [/* @__PURE__ */ _jsx19(Instance, { animated: true, className: "framer-1do8bwl", Component: tGoganY_w, layoutDependency, layoutId: "H6DtvFhKg__iY9kdWkl1", style: { "--1m6trwb": 0, "--21h8s6": "var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, rgb(0, 0, 0))", "--pgex8v": 2 } }), /* @__PURE__ */ _jsx19(RichText4, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx19(React17.Fragment, { children: /* @__PURE__ */ _jsx19(motion19.p, { className: "framer-styles-preset-11khw5m", "data-styles-preset": "Fc2cHuCXU", children: "BESTELLER" }) }), className: "framer-1lqt8ny", fonts: ["Inter"], layoutDependency, layoutId: "H6DtvFhKg__IdyX_KncN", style: { "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: zlmFNV1Lm, verticalAlignment: "top", withExternalLayout: true })] }), /* @__PURE__ */ _jsx19(RichText4, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx19(React17.Fragment, { children: /* @__PURE__ */ _jsx19(motion19.p, { className: "framer-styles-preset-xvuzl8", "data-styles-preset": "Dvya5fqDf", children: "Premium salmon recipe" }) }), className: "framer-4aijfg", fonts: ["Inter"], layoutDependency, layoutId: "H6DtvFhKg__oii1uNj1x", style: { "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: Hn3rFsdHu, verticalAlignment: "top", withExternalLayout: true })] }), /* @__PURE__ */ _jsx19(RichText4, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx19(React17.Fragment, { children: /* @__PURE__ */ _jsx19(motion19.p, { className: "framer-styles-preset-1tx7kw", "data-styles-preset": "r0KoeoJ3L", style: { "--framer-text-color": "var(--extracted-r6o4lv, var(--token-9bf3fd56-1b46-466c-a3ae-db4f9717f0f5, rgb(138, 138, 138)))" }, children: "Grain-free formula with wild-caught salmon and superfoods for optimal health." }) }), className: "framer-181887e", fonts: ["Inter"], layoutDependency, layoutId: "H6DtvFhKg__lGKOPowye", style: { "--extracted-r6o4lv": "var(--token-9bf3fd56-1b46-466c-a3ae-db4f9717f0f5, rgb(138, 138, 138))", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: NIzV_a1C2, verticalAlignment: "top", withExternalLayout: true }), /* @__PURE__ */ _jsx19(ComponentViewportProvider2, { height: 32, y: (componentViewport?.y || 0) + (24 + ((componentViewport?.height || 398) - 48 - ((componentViewport?.height || 398) - 48) * 1) / 2) + 0 + 269, children: /* @__PURE__ */ _jsx19(SmartComponentScopedContainer2, { className: "framer-81uzgk-container", layoutDependency, layoutId: "H6DtvFhKg__qPWxxFJy3-container", nodeId: "qPWxxFJy3", rendersWithMotion: true, scopeId: "LDXuwrbTo", children: /* @__PURE__ */ _jsx19(uwIvHjxaY_default, { height: "100%", id: "qPWxxFJy3", KS1Dij2Tl: "8px", layoutId: "H6DtvFhKg__qPWxxFJy3", style: { height: "100%" }, variant: "xczElmU1c", VLZiDyLYl: "Shop now", width: "100%", y9RJvR4Km: "rgb(255, 255, 255)" }) }) })] }), /* @__PURE__ */ _jsx19(MotionDivWithFXWithOptimizedAppearEffect, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation2, className: "framer-1ezdnjl", "data-framer-appear-id": "1ezdnjl", initial: animation3, layoutDependency, layoutId: "H6DtvFhKg__oVJ5mKppi", optimized: true, children: /* @__PURE__ */ _jsx19(Image, { background: { alt: "", fit: "fill", loading: getLoadingLazyAtYPosition((componentViewport?.y || 0) + (24 + ((componentViewport?.height || 398) - 48 - 238.5) / 2) + 0 + 0), pixelHeight: 668, pixelWidth: 668, sizes: `min(max((${componentViewport?.width || "100vw"} - 48px) / 2 - 16px, 1px), 220px)`, ...toResponsiveImage(da4YRdA46) }, className: "framer-w9n1u5", layoutDependency, layoutId: "H6DtvFhKg__uzKH20m2I" }) })] }) }) }) });
});
var css17 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-x7qgb.framer-l2a9h8, .framer-x7qgb .framer-l2a9h8 { display: block; }", ".framer-x7qgb.framer-124ppz2 { align-content: center; align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 16px; height: auto; justify-content: flex-start; overflow: visible; padding: 24px; position: relative; width: 100%; }", ".framer-x7qgb .framer-u8ixxu { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 16px; height: 100%; justify-content: flex-start; max-width: 280px; overflow: visible; padding: 0px; position: relative; width: 50%; }", ".framer-x7qgb .framer-1d7xcwf { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 8px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 100%; }", ".framer-x7qgb .framer-1d1ew4k { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 4px; height: min-content; justify-content: center; overflow: visible; padding: 4px 8px 4px 4px; position: relative; width: min-content; }", ".framer-x7qgb .framer-1do8bwl { flex: none; height: var(--framer-aspect-ratio-supported, 12px); position: relative; width: 12px; }", ".framer-x7qgb .framer-1lqt8ny { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-x7qgb .framer-4aijfg { flex: none; height: auto; position: relative; white-space: pre-wrap; width: 100%; word-break: break-word; word-wrap: break-word; }", ".framer-x7qgb .framer-181887e { --framer-text-wrap-override: none; flex: none; height: auto; position: relative; width: 100%; }", ".framer-x7qgb .framer-81uzgk-container { flex: none; height: 32px; position: relative; width: auto; }", ".framer-x7qgb .framer-1ezdnjl { align-content: flex-start; align-items: flex-start; display: flex; flex: 1 0 0px; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 1px; }", ".framer-x7qgb .framer-w9n1u5 { aspect-ratio: 0.6645702306079665 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 274px); max-width: 220px; overflow: visible; position: relative; width: 100%; }", ...css15, ...css14, ...css9];
var FramerLDXuwrbTo = withCSS14(Component13, css17, "framer-x7qgb");
var LDXuwrbTo_default = FramerLDXuwrbTo;
FramerLDXuwrbTo.displayName = "Promotion Container";
FramerLDXuwrbTo.defaultProps = { height: 398, width: 444 };
addPropertyControls13(FramerLDXuwrbTo, { da4YRdA46: { __defaultAssetReference: "data:framer/asset-reference,rbBkH7YInKmRpxipaOTrn2pkTg.png?originalFilename=dog-food.png&width=668&height=668", title: "Image", type: ControlType13.ResponsiveImage }, zlmFNV1Lm: { defaultValue: "BESTELLER", displayTextArea: false, title: "Badge", type: ControlType13.String }, tGoganY_w: { defaultValue: { identifier: "module:SUBEdtCFaOJwrjN2Inhk/bznEUerLEqVVXGfsDOYE/pKERsxd4H.js:default", moduleId: "SUBEdtCFaOJwrjN2Inhk" }, setModuleId: "omX0gWFPqDwhaiWwf6ab", title: "Badge Icon", type: ControlType13.VectorSetItem }, J7aEOY5gs: { defaultValue: "rgb(255, 255, 255)", title: "Badge color", type: ControlType13.Color }, Hn3rFsdHu: { defaultValue: "Premium salmon recipe", displayTextArea: false, title: "Title", type: ControlType13.String }, NIzV_a1C2: { defaultValue: "Grain-free formula with wild-caught salmon and superfoods for optimal health.", displayTextArea: false, title: "Description", type: ControlType13.String } });
addFonts4(FramerLDXuwrbTo, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }] }, ...ButtonFonts, ...getFontsFromSharedStyle4(fonts4), ...getFontsFromSharedStyle4(fonts3), ...getFontsFromSharedStyle4(fonts)], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/c1mEpgdbfubfqqywqNej/NKrDalw4A9kgjuT21iJa/oksr8yeN3.js
import { jsx as _jsx21, jsxs as _jsxs9 } from "react/jsx-runtime";
import { addFonts as addFonts6, addPropertyControls as addPropertyControls15, ComponentViewportProvider as ComponentViewportProvider3, ControlType as ControlType15, cx as cx15, getFonts as getFonts3, getFontsFromSharedStyle as getFontsFromSharedStyle6, Link as Link3, RichText as RichText6, SmartComponentScopedContainer as SmartComponentScopedContainer3, useActiveVariantCallback as useActiveVariantCallback2, useComponentViewport as useComponentViewport6, useLocaleInfo as useLocaleInfo14, useVariantState as useVariantState6, withCSS as withCSS16 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup6, motion as motion21, MotionConfigContext as MotionConfigContext6 } from "framer-motion";
import * as React19 from "react";
import { useRef as useRef12 } from "react";

// http-url:https://framerusercontent.com/modules/NFGzcdSnathwzjbOTbrQ/BtbMnxZMRXQTVUFBR8HJ/wy_iUzbP1.js
import { jsx as _jsx20 } from "react/jsx-runtime";
import { addFonts as addFonts5, addPropertyControls as addPropertyControls14, ControlType as ControlType14, cx as cx14, getFontsFromSharedStyle as getFontsFromSharedStyle5, Link as Link2, RichText as RichText5, useComponentViewport as useComponentViewport5, useLocaleInfo as useLocaleInfo13, useVariantState as useVariantState5, withCSS as withCSS15 } from "./_framer-runtime.js";
import { LayoutGroup as LayoutGroup5, motion as motion20, MotionConfigContext as MotionConfigContext5 } from "framer-motion";
import * as React18 from "react";
import { useRef as useRef11 } from "react";
var enabledGestures4 = { fiCJH1MSM: { hover: true } };
var cycleOrder2 = ["fiCJH1MSM", "V4yX1ggJa"];
var serializationHash5 = "framer-9DTDo";
var variantClassNames5 = { fiCJH1MSM: "framer-v-1quelvh", V4yX1ggJa: "framer-v-17xne30" };
function addPropertyOverrides4(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition15 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var Transition5 = ({ value, children }) => {
  const config = React18.useContext(MotionConfigContext5);
  const transition = value ?? config.transition;
  const contextValue = React18.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx20(MotionConfigContext5.Provider, { value: contextValue, children });
};
var Variants5 = motion20.create(React18.Fragment);
var humanReadableVariantMap2 = { Desktop: "fiCJH1MSM", Phone: "V4yX1ggJa" };
var getProps14 = ({ height, id, item, link, width, ...props }) => {
  return { ...props, variant: humanReadableVariantMap2[props.variant] ?? props.variant ?? "fiCJH1MSM", wVqJYh8Lg: link ?? props.wVqJYh8Lg, Yeb61j66D: item ?? props.Yeb61j66D ?? "Dry food" };
};
var createLayoutDependency5 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component14 = /* @__PURE__ */ React18.forwardRef(function(props, ref) {
  const fallbackRef = useRef11(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React18.useId();
  const { activeLocale, setLocale } = useLocaleInfo13();
  const componentViewport = useComponentViewport5();
  const { style, className: className5, layoutId, variant, Yeb61j66D, wVqJYh8Lg, ...restProps } = getProps14(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState5({ cycleOrder: cycleOrder2, defaultVariant: "fiCJH1MSM", enabledGestures: enabledGestures4, ref: refBinding, variant, variantClassNames: variantClassNames5 });
  const layoutDependency = createLayoutDependency5(props, variants);
  const sharedStyleClassNames = [className2, className3];
  const scopingClassNames = cx14(serializationHash5, ...sharedStyleClassNames);
  return /* @__PURE__ */ _jsx20(LayoutGroup5, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx20(Variants5, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx20(Transition5, { value: transition15, children: /* @__PURE__ */ _jsx20(Link2, { href: wVqJYh8Lg, motionChild: true, nodeId: "fiCJH1MSM", openInNewTab: false, scopeId: "wy_iUzbP1", children: /* @__PURE__ */ _jsx20(motion20.a, { ...restProps, ...gestureHandlers, className: `${cx14(scopingClassNames, "framer-1quelvh", className5, classNames)} framer-5i4i6y`, "data-framer-name": "Desktop", layoutDependency, layoutId: "H6DtvFhKg__fiCJH1MSM", ref: refBinding, style: { ...style }, ...addPropertyOverrides4({ "fiCJH1MSM-hover": { "data-framer-name": void 0 }, V4yX1ggJa: { "data-framer-name": "Phone" } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx20(RichText5, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx20(React18.Fragment, { children: /* @__PURE__ */ _jsx20(motion20.p, { className: "framer-styles-preset-1dnr4lh", "data-styles-preset": "lMJjY3v8f", style: { "--framer-text-color": "var(--extracted-r6o4lv, var(--token-9bf3fd56-1b46-466c-a3ae-db4f9717f0f5, rgb(138, 138, 138)))" }, children: "Dry food" }) }), className: "framer-guupmz", fonts: ["Inter"], layoutDependency, layoutId: "H6DtvFhKg__ONVx7qicF", style: { "--extracted-r6o4lv": "var(--token-9bf3fd56-1b46-466c-a3ae-db4f9717f0f5, rgb(138, 138, 138))", "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: Yeb61j66D, variants: { "fiCJH1MSM-hover": { "--extracted-r6o4lv": "var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, rgb(0, 0, 0))" } }, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides4({ "fiCJH1MSM-hover": { children: /* @__PURE__ */ _jsx20(React18.Fragment, { children: /* @__PURE__ */ _jsx20(motion20.p, { className: "framer-styles-preset-1dnr4lh", "data-styles-preset": "lMJjY3v8f", style: { "--framer-text-color": "var(--extracted-r6o4lv, var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, rgb(0, 0, 0)))" }, children: "Dry food" }) }) }, V4yX1ggJa: { children: /* @__PURE__ */ _jsx20(React18.Fragment, { children: /* @__PURE__ */ _jsx20(motion20.p, { className: "framer-styles-preset-xvuzl8", "data-styles-preset": "Dvya5fqDf", style: { "--framer-text-color": "var(--extracted-r6o4lv, var(--token-9bf3fd56-1b46-466c-a3ae-db4f9717f0f5, rgb(138, 138, 138)))" }, children: "Dry food" }) }) } }, baseVariant, gestureVariant) }) }) }) }) }) });
});
var css18 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-9DTDo.framer-5i4i6y, .framer-9DTDo .framer-5i4i6y { display: block; }", ".framer-9DTDo.framer-1quelvh { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 8px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; text-decoration: none; width: min-content; }", ".framer-9DTDo .framer-guupmz { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-9DTDo.framer-v-17xne30.framer-1quelvh { cursor: unset; }", ...css11, ...css14];
var Framerwy_iUzbP1 = withCSS15(Component14, css18, "framer-9DTDo");
var wy_iUzbP1_default = Framerwy_iUzbP1;
Framerwy_iUzbP1.displayName = "Item link";
Framerwy_iUzbP1.defaultProps = { height: 19.5, width: 56 };
addPropertyControls14(Framerwy_iUzbP1, { variant: { options: ["fiCJH1MSM", "V4yX1ggJa"], optionTitles: ["Desktop", "Phone"], title: "Variant", type: ControlType14.Enum }, Yeb61j66D: { defaultValue: "Dry food", displayTextArea: false, title: "Item", type: ControlType14.String }, wVqJYh8Lg: { title: "Link", type: ControlType14.Link } });
addFonts5(Framerwy_iUzbP1, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }] }, ...getFontsFromSharedStyle5(fonts2), ...getFontsFromSharedStyle5(fonts3)], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/c1mEpgdbfubfqqywqNej/NKrDalw4A9kgjuT21iJa/oksr8yeN3.js
var ArrowDropDownFonts = getFonts3(djdXZjS4N_default);
var ItemLinkFonts = getFonts3(wy_iUzbP1_default);
var cycleOrder3 = ["FIMtTw1Sp", "RsICntwtA", "ale5kEwJU"];
var serializationHash6 = "framer-5ZaLI";
var variantClassNames6 = { ale5kEwJU: "framer-v-1urqh6u", FIMtTw1Sp: "framer-v-1yozzqm", RsICntwtA: "framer-v-qle6hm" };
function addPropertyOverrides5(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition16 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var isSet2 = (value) => {
  if (Array.isArray(value))
    return value.length > 0;
  return value !== void 0 && value !== null && value !== "";
};
var Transition6 = ({ value, children }) => {
  const config = React19.useContext(MotionConfigContext6);
  const transition = value ?? config.transition;
  const contextValue = React19.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx21(MotionConfigContext6.Provider, { value: contextValue, children });
};
var Variants6 = motion21.create(React19.Fragment);
var humanReadableVariantMap3 = { "Mobile Collapsed": "RsICntwtA", "Mobile Expanded": "ale5kEwJU", Desktop: "FIMtTw1Sp" };
var getProps15 = ({ height, id, item1, item2, item3, item4, item5, link1, link2, link3, link4, link5, subcategory, subcategoryLink, width, ...props }) => {
  return { ...props, b8pbow8Ls: link4 ?? props.b8pbow8Ls, BGt0yzV6o: subcategoryLink ?? props.BGt0yzV6o, hVRulLKoU: subcategory ?? props.hVRulLKoU ?? "Food & Nutrition", joGBQmonv: link3 ?? props.joGBQmonv, Jysop11hY: link5 ?? props.Jysop11hY, Lcsf800Oo: link2 ?? props.Lcsf800Oo, MKZXjkWik: item2 ?? props.MKZXjkWik ?? "Dry food", MxCXtj19q: item1 ?? props.MxCXtj19q ?? "Dry food", ooAkgJeId: item4 ?? props.ooAkgJeId ?? "Dry food", tQU9REL0Z: item5 ?? props.tQU9REL0Z ?? "Dry food", variant: humanReadableVariantMap3[props.variant] ?? props.variant ?? "FIMtTw1Sp", WenZstdsn: item3 ?? props.WenZstdsn ?? "Dry food", zOJomZjEY: link1 ?? props.zOJomZjEY };
};
var createLayoutDependency6 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component15 = /* @__PURE__ */ React19.forwardRef(function(props, ref) {
  const fallbackRef = useRef12(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React19.useId();
  const { activeLocale, setLocale } = useLocaleInfo14();
  const componentViewport = useComponentViewport6();
  const { style, className: className5, layoutId, variant, hVRulLKoU, BGt0yzV6o, MxCXtj19q, zOJomZjEY, MKZXjkWik, Lcsf800Oo, WenZstdsn, joGBQmonv, ooAkgJeId, b8pbow8Ls, tQU9REL0Z, Jysop11hY, ...restProps } = getProps15(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState6({ cycleOrder: cycleOrder3, defaultVariant: "FIMtTw1Sp", ref: refBinding, variant, variantClassNames: variantClassNames6 });
  const layoutDependency = createLayoutDependency6(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback2(baseVariant);
  const onTap5uudhn = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    setVariant("ale5kEwJU");
  });
  const onTap74whc8 = activeVariantCallback(async (...args) => {
    setVariant("RsICntwtA");
  });
  const sharedStyleClassNames = [className2, className3];
  const scopingClassNames = cx15(serializationHash6, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (["RsICntwtA", "ale5kEwJU"].includes(baseVariant))
      return true;
    return false;
  };
  const isDisplayed1 = () => {
    if (baseVariant === "RsICntwtA")
      return false;
    return true;
  };
  const visible = isSet2(MxCXtj19q);
  const visible1 = isSet2(MKZXjkWik);
  const visible2 = isSet2(WenZstdsn);
  const visible3 = isSet2(ooAkgJeId);
  const visible4 = isSet2(tQU9REL0Z);
  return /* @__PURE__ */ _jsx21(LayoutGroup6, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx21(Variants6, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx21(Transition6, { value: transition16, children: /* @__PURE__ */ _jsxs9(motion21.div, { ...restProps, ...gestureHandlers, className: cx15(scopingClassNames, "framer-1yozzqm", className5, classNames), "data-framer-name": "Desktop", layoutDependency, layoutId: "H6DtvFhKg__FIMtTw1Sp", ref: refBinding, style: { ...style }, ...addPropertyOverrides5({ ale5kEwJU: { "data-framer-name": "Mobile Expanded" }, RsICntwtA: { "data-framer-name": "Mobile Collapsed", "data-highlight": true, onTap: onTap5uudhn } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx21(Link3, { href: BGt0yzV6o, motionChild: true, nodeId: "XGEpA4D8q", openInNewTab: false, scopeId: "oksr8yeN3", children: /* @__PURE__ */ _jsxs9(motion21.a, { className: "framer-7sz0q3 framer-7at2l4", layoutDependency, layoutId: "H6DtvFhKg__XGEpA4D8q", ...addPropertyOverrides5({ ale5kEwJU: { "data-highlight": true, onTap: onTap74whc8 } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx21(RichText6, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx21(React19.Fragment, { children: /* @__PURE__ */ _jsx21(motion21.p, { className: "framer-styles-preset-1dnr4lh", "data-styles-preset": "lMJjY3v8f", children: /* @__PURE__ */ _jsx21(motion21.strong, { children: "Food & Nutrition" }) }) }), className: "framer-2wuxwf", fonts: ["Inter", "Inter-Bold"], layoutDependency, layoutId: "H6DtvFhKg__J_WgkeUYd", style: { "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: hVRulLKoU, verticalAlignment: "top", withExternalLayout: true, ...addPropertyOverrides5({ ale5kEwJU: { children: /* @__PURE__ */ _jsx21(React19.Fragment, { children: /* @__PURE__ */ _jsx21(motion21.p, { className: "framer-styles-preset-xvuzl8", "data-styles-preset": "Dvya5fqDf", children: "Food & Nutrition" }) }), fonts: ["Inter"] }, RsICntwtA: { children: /* @__PURE__ */ _jsx21(React19.Fragment, { children: /* @__PURE__ */ _jsx21(motion21.p, { className: "framer-styles-preset-xvuzl8", "data-styles-preset": "Dvya5fqDf", children: "Food & Nutrition" }) }), fonts: ["Inter"] } }, baseVariant, gestureVariant) }), isDisplayed() && /* @__PURE__ */ _jsx21(djdXZjS4N_default, { animated: true, className: "framer-14wozok", layoutDependency, layoutId: "H6DtvFhKg__EeSnPkbLJ", style: { "--esondr": "var(--token-9bf3fd56-1b46-466c-a3ae-db4f9717f0f5, rgb(138, 138, 138))", rotate: 0 }, variants: { ale5kEwJU: { rotate: 180 } } })] }) }), isDisplayed1() && /* @__PURE__ */ _jsxs9(motion21.div, { className: "framer-v2oily", "data-framer-name": "Items", layoutDependency, layoutId: "H6DtvFhKg__zyMamw1Iy", children: [visible !== false && /* @__PURE__ */ _jsx21(ComponentViewportProvider3, { height: 19, y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 178) - 0 - 174.6) / 2 + 19.6 + 12) + 0 + 77.5, ...addPropertyOverrides5({ ale5kEwJU: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 202) - 8 - 179) / 2 + 24 + 12) + 0 + 77.5 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx21(SmartComponentScopedContainer3, { className: "framer-1q3ikgi-container", layoutDependency, layoutId: "H6DtvFhKg__ilvTi6vIb-container", nodeId: "ilvTi6vIb", rendersWithMotion: true, scopeId: "oksr8yeN3", children: /* @__PURE__ */ _jsx21(wy_iUzbP1_default, { height: "100%", id: "ilvTi6vIb", layoutId: "H6DtvFhKg__ilvTi6vIb", variant: "fiCJH1MSM", width: "100%", wVqJYh8Lg: zOJomZjEY, Yeb61j66D: MxCXtj19q, ...addPropertyOverrides5({ ale5kEwJU: { variant: "V4yX1ggJa" } }, baseVariant, gestureVariant) }) }) }), visible1 !== false && /* @__PURE__ */ _jsx21(ComponentViewportProvider3, { height: 19, y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 178) - 0 - 174.6) / 2 + 19.6 + 12) + 0 + 77.5, ...addPropertyOverrides5({ ale5kEwJU: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 202) - 8 - 179) / 2 + 24 + 12) + 0 + 77.5 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx21(SmartComponentScopedContainer3, { className: "framer-1fyzjxx-container", layoutDependency, layoutId: "H6DtvFhKg__QnjQunizP-container", nodeId: "QnjQunizP", rendersWithMotion: true, scopeId: "oksr8yeN3", children: /* @__PURE__ */ _jsx21(wy_iUzbP1_default, { height: "100%", id: "QnjQunizP", layoutId: "H6DtvFhKg__QnjQunizP", variant: "fiCJH1MSM", width: "100%", wVqJYh8Lg: Lcsf800Oo, Yeb61j66D: MKZXjkWik, ...addPropertyOverrides5({ ale5kEwJU: { variant: "V4yX1ggJa" } }, baseVariant, gestureVariant) }) }) }), visible2 !== false && /* @__PURE__ */ _jsx21(ComponentViewportProvider3, { height: 19, y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 178) - 0 - 174.6) / 2 + 19.6 + 12) + 0 + 77.5, ...addPropertyOverrides5({ ale5kEwJU: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 202) - 8 - 179) / 2 + 24 + 12) + 0 + 77.5 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx21(SmartComponentScopedContainer3, { className: "framer-1crlqod-container", layoutDependency, layoutId: "H6DtvFhKg__dqmhgmUJ_-container", nodeId: "dqmhgmUJ_", rendersWithMotion: true, scopeId: "oksr8yeN3", children: /* @__PURE__ */ _jsx21(wy_iUzbP1_default, { height: "100%", id: "dqmhgmUJ_", layoutId: "H6DtvFhKg__dqmhgmUJ_", variant: "fiCJH1MSM", width: "100%", wVqJYh8Lg: joGBQmonv, Yeb61j66D: WenZstdsn, ...addPropertyOverrides5({ ale5kEwJU: { variant: "V4yX1ggJa" } }, baseVariant, gestureVariant) }) }) }), visible3 !== false && /* @__PURE__ */ _jsx21(ComponentViewportProvider3, { height: 19, y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 178) - 0 - 174.6) / 2 + 19.6 + 12) + 0 + 77.5, ...addPropertyOverrides5({ ale5kEwJU: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 202) - 8 - 179) / 2 + 24 + 12) + 0 + 77.5 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx21(SmartComponentScopedContainer3, { className: "framer-1xbid3y-container", layoutDependency, layoutId: "H6DtvFhKg__BZ8QnipFU-container", nodeId: "BZ8QnipFU", rendersWithMotion: true, scopeId: "oksr8yeN3", children: /* @__PURE__ */ _jsx21(wy_iUzbP1_default, { height: "100%", id: "BZ8QnipFU", layoutId: "H6DtvFhKg__BZ8QnipFU", variant: "fiCJH1MSM", width: "100%", wVqJYh8Lg: b8pbow8Ls, Yeb61j66D: ooAkgJeId, ...addPropertyOverrides5({ ale5kEwJU: { variant: "V4yX1ggJa" } }, baseVariant, gestureVariant) }) }) }), visible4 !== false && /* @__PURE__ */ _jsx21(ComponentViewportProvider3, { height: 19, y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 178) - 0 - 174.6) / 2 + 19.6 + 12) + 0 + 77.5, ...addPropertyOverrides5({ ale5kEwJU: { y: (componentViewport?.y || 0) + 0 + (((componentViewport?.height || 202) - 8 - 179) / 2 + 24 + 12) + 0 + 77.5 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx21(SmartComponentScopedContainer3, { className: "framer-12tkxmj-container", layoutDependency, layoutId: "H6DtvFhKg__eVUha6pvo-container", nodeId: "eVUha6pvo", rendersWithMotion: true, scopeId: "oksr8yeN3", children: /* @__PURE__ */ _jsx21(wy_iUzbP1_default, { height: "100%", id: "eVUha6pvo", layoutId: "H6DtvFhKg__eVUha6pvo", variant: "fiCJH1MSM", width: "100%", wVqJYh8Lg: Jysop11hY, Yeb61j66D: tQU9REL0Z, ...addPropertyOverrides5({ ale5kEwJU: { variant: "V4yX1ggJa" } }, baseVariant, gestureVariant) }) }) })] })] }) }) }) });
});
var css19 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-5ZaLI.framer-7at2l4, .framer-5ZaLI .framer-7at2l4 { display: block; }", ".framer-5ZaLI.framer-1yozzqm { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 12px; height: min-content; justify-content: center; overflow: visible; padding: 0px 0px 8px 0px; position: relative; width: 100%; }", ".framer-5ZaLI .framer-7sz0q3 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; overflow: visible; padding: 0px; position: relative; text-decoration: none; width: 100%; }", ".framer-5ZaLI .framer-2wuxwf { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-5ZaLI .framer-14wozok { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 24px); position: relative; width: 24px; }", ".framer-5ZaLI .framer-v2oily { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 12px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: min-content; }", ".framer-5ZaLI .framer-1q3ikgi-container, .framer-5ZaLI .framer-1fyzjxx-container, .framer-5ZaLI .framer-1crlqod-container, .framer-5ZaLI .framer-1xbid3y-container, .framer-5ZaLI .framer-12tkxmj-container { flex: none; height: auto; position: relative; width: auto; }", ".framer-5ZaLI.framer-v-qle6hm.framer-1yozzqm { cursor: pointer; gap: unset; justify-content: space-between; }", ".framer-5ZaLI.framer-v-qle6hm .framer-7sz0q3 { order: 0; }", ".framer-5ZaLI.framer-v-1urqh6u.framer-1yozzqm { padding: 0px 0px 8px 0px; }", ".framer-5ZaLI.framer-v-1urqh6u .framer-7sz0q3 { cursor: pointer; }", ...css11, ...css14];
var Frameroksr8yeN3 = withCSS16(Component15, css19, "framer-5ZaLI");
var oksr8yeN3_default = Frameroksr8yeN3;
Frameroksr8yeN3.displayName = "Subcategory Group";
Frameroksr8yeN3.defaultProps = { height: 178, width: 200 };
addPropertyControls15(Frameroksr8yeN3, { variant: { options: ["FIMtTw1Sp", "RsICntwtA", "ale5kEwJU"], optionTitles: ["Desktop", "Mobile Collapsed", "Mobile Expanded"], title: "Variant", type: ControlType15.Enum }, hVRulLKoU: { defaultValue: "Food & Nutrition", displayTextArea: false, title: "Subcategory", type: ControlType15.String }, BGt0yzV6o: { title: "Subcategory Link", type: ControlType15.Link }, MxCXtj19q: { defaultValue: "Dry food", displayTextArea: false, title: "Item 1", type: ControlType15.String }, zOJomZjEY: { title: "Link 1", type: ControlType15.Link }, MKZXjkWik: { defaultValue: "Dry food", displayTextArea: false, title: "Item 2", type: ControlType15.String }, Lcsf800Oo: { title: "Link 2", type: ControlType15.Link }, WenZstdsn: { defaultValue: "Dry food", displayTextArea: false, title: "Item 3", type: ControlType15.String }, joGBQmonv: { title: "Link 3", type: ControlType15.Link }, ooAkgJeId: { defaultValue: "Dry food", displayTextArea: false, title: "Item 4", type: ControlType15.String }, b8pbow8Ls: { title: "Link 4", type: ControlType15.Link }, tQU9REL0Z: { defaultValue: "Dry food", displayTextArea: false, title: "Item 5", type: ControlType15.String }, Jysop11hY: { title: "Link 5", type: ControlType15.Link } });
addFonts6(Frameroksr8yeN3, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/DpPBYI0sL4fYLgAkX8KXOPVt7c.woff2", weight: "700" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/4RAEQdEOrcnDkhHiiCbJOw92Lk.woff2", weight: "700" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/1K3W8DizY3v4emK8Mb08YHxTbs.woff2", weight: "700" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/tUSCtfYVM1I1IchuyCwz9gDdQ.woff2", weight: "700" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/VgYFWiwsAC5OYxAycRXXvhze58.woff2", weight: "700" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/syRNPWzAMIrcJ3wIlPIP43KjQs.woff2", weight: "700" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/GIryZETIX4IFypco5pYZONKhJIo.woff2", weight: "700" }] }, ...ArrowDropDownFonts, ...ItemLinkFonts, ...getFontsFromSharedStyle6(fonts2), ...getFontsFromSharedStyle6(fonts3)], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/Qcy3wPgIzC1HW69CRmKr/rnzgPQ29DemuvV4rBJen/gQ1nc7zls.js
var SubcategoryGroupTESTFonts = getFonts4(oksr8yeN3_default);
var SmartComponentScopedContainerWithFXWithOptimizedAppearEffect = withOptimizedAppearEffect2(withFX2(SmartComponentScopedContainer4));
var FeaturedProductTestFonts = getFonts4(LDXuwrbTo_default);
var cycleOrder4 = ["NdrwNM7RY", "T8vqY1bi7"];
var serializationHash7 = "framer-hVKug";
var variantClassNames7 = { NdrwNM7RY: "framer-v-b1brxn", T8vqY1bi7: "framer-v-1ye7q68" };
function addPropertyOverrides6(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition17 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var transition22 = { delay: 0, duration: 0.4, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation4 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition22, x: 0, y: 0 };
var animation12 = { opacity: 1e-3, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, x: -20, y: 0 };
var transition32 = { delay: 0.1, duration: 0.4, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation22 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition32, x: 0, y: 0 };
var transition4 = { delay: 0.2, duration: 0.4, ease: [0.44, 0, 0.56, 1], type: "tween" };
var animation32 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition4, x: 0, y: 0 };
var toResponsiveImage2 = (value) => {
  if (typeof value === "object" && value !== null && typeof value.src === "string") {
    return value;
  }
  return typeof value === "string" ? { src: value } : void 0;
};
var Transition7 = ({ value, children }) => {
  const config = React20.useContext(MotionConfigContext7);
  const transition = value ?? config.transition;
  const contextValue = React20.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx22(MotionConfigContext7.Provider, { value: contextValue, children });
};
var Variants7 = motion22.create(React20.Fragment);
var humanReadableVariantMap4 = { "No promotion": "T8vqY1bi7", Default: "NdrwNM7RY" };
var getProps16 = ({ aItem1, aItem2, aItem3, aItem4, aItem5, aLink1, aLink2, aLink3, aLink4, aLink5, badge, badgeColor, bItem1, bItem2, bItem3, bItem4, bItem5, bLink1, bLink2, bLink3, bLink4, bLink5, cItem1, cItem2, cItem3, cItem4, cItem5, cLink1, cLink2, cLink3, cLink4, cLink5, description, height, id, image, subcategoryA, subcategoryALink, subcategoryB, subcategoryBLink, subcategoryC, subcategoryCLink, title, vector, width, ...props }) => {
  return { ...props, akz0cgpPs: subcategoryC ?? props.akz0cgpPs ?? "Accessories", BD6QQg3tv: aItem4 ?? props.BD6QQg3tv ?? "Supplements", bIEkxkqHQ: bItem5 ?? props.bIEkxkqHQ ?? "Dental health", fdvKm0wP1: cItem2 ?? props.fdvKm0wP1 ?? "Apparel", gFttPqMLk: bLink2 ?? props.gFttPqMLk, gvujSIDxh: badgeColor ?? props.gvujSIDxh ?? "var(--token-dacc9230-b126-45d9-8410-cda89f0e6ba0, rgb(201, 217, 193))", H2Mdatcx7: aItem5 ?? props.H2Mdatcx7 ?? "Weight management", HHsicUGza: aItem3 ?? props.HHsicUGza ?? "Treats & snacks", HJxdmW4NU: bLink5 ?? props.HJxdmW4NU, JFZNnBlhv: subcategoryB ?? props.JFZNnBlhv ?? "Health & Wellness", jyyfbhpI2: subcategoryA ?? props.jyyfbhpI2 ?? "Food & Nutrition", JzIkcDv6h: image ?? props.JzIkcDv6h ?? { pixelHeight: 668, pixelWidth: 668, src: "https://framerusercontent.com/images/rbBkH7YInKmRpxipaOTrn2pkTg.png?width=668&height=668", srcSet: "https://framerusercontent.com/images/rbBkH7YInKmRpxipaOTrn2pkTg.png?scale-down-to=512&width=668&height=668 512w,https://framerusercontent.com/images/rbBkH7YInKmRpxipaOTrn2pkTg.png?width=668&height=668 668w" }, kCJC_ad0I: subcategoryCLink ?? props.kCJC_ad0I, L5XCxMk9w: bItem4 ?? props.L5XCxMk9w ?? "Joint support", lDN7RfsyH: subcategoryBLink ?? props.lDN7RfsyH, lV17lapcT: aItem1 ?? props.lV17lapcT ?? "Dry food", lZph_dNvA: bLink4 ?? props.lZph_dNvA, mziJpklgq: cItem4 ?? props.mziJpklgq ?? "Toys & enrichment", oGL2PFpoz: cLink4 ?? props.oGL2PFpoz, OpanQvSs6: badge ?? props.OpanQvSs6, OrqoH2s70: bLink1 ?? props.OrqoH2s70, qh0OYgAJ8: cItem1 ?? props.qh0OYgAJ8 ?? "Beds & furniture", qLeNWQ9LE: aItem2 ?? props.qLeNWQ9LE ?? "Wet food", RUnP3Js3Q: bItem1 ?? props.RUnP3Js3Q ?? "Vitamins", ShAwqR8jv: cLink2 ?? props.ShAwqR8jv, swlreAgp0: cItem3 ?? props.swlreAgp0 ?? "Leashes & collars", t5rUBFdQ3: subcategoryALink ?? props.t5rUBFdQ3, TGpiC0Pem: aLink3 ?? props.TGpiC0Pem, tkvZz4aVb: aLink4 ?? props.tkvZz4aVb, TKwQrsFjC: bItem3 ?? props.TKwQrsFjC ?? "Flea & tick control", TV4IHgyuu: cLink1 ?? props.TV4IHgyuu, UgVgNbwJF: aLink1 ?? props.UgVgNbwJF, uZmPElGpa: cLink3 ?? props.uZmPElGpa, vAHVsq2d0: description ?? props.vAHVsq2d0 ?? "High-protein formula with real chicken and essential taurine for optimal health.", variant: humanReadableVariantMap4[props.variant] ?? props.variant ?? "NdrwNM7RY", VDqAgC9MU: aLink5 ?? props.VDqAgC9MU, WA8hAvxuw: aLink2 ?? props.WA8hAvxuw, wPKTuVlH4: title ?? props.wPKTuVlH4 ?? "Grain-free chicken recipe", xraYf44sq: vector ?? props.xraYf44sq ?? pKERsxd4H_default, yd7OLhUku: bLink3 ?? props.yd7OLhUku, ytkE1lYl5: bItem2 ?? props.ytkE1lYl5 ?? "Grooming", yzeVRH43J: cLink5 ?? props.yzeVRH43J, ZBRfzJCvQ: cItem5 ?? props.ZBRfzJCvQ ?? "Bowls & feeders" };
};
var createLayoutDependency7 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component16 = /* @__PURE__ */ React20.forwardRef(function(props, ref) {
  const fallbackRef = useRef13(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React20.useId();
  const { activeLocale, setLocale } = useLocaleInfo15();
  const componentViewport = useComponentViewport7();
  const { style, className: className5, layoutId, variant, jyyfbhpI2, t5rUBFdQ3, lV17lapcT, UgVgNbwJF, qLeNWQ9LE, WA8hAvxuw, HHsicUGza, TGpiC0Pem, BD6QQg3tv, tkvZz4aVb, H2Mdatcx7, VDqAgC9MU, JFZNnBlhv, lDN7RfsyH, RUnP3Js3Q, OrqoH2s70, ytkE1lYl5, gFttPqMLk, TKwQrsFjC, yd7OLhUku, L5XCxMk9w, lZph_dNvA, bIEkxkqHQ, HJxdmW4NU, akz0cgpPs, kCJC_ad0I, qh0OYgAJ8, TV4IHgyuu, fdvKm0wP1, ShAwqR8jv, swlreAgp0, uZmPElGpa, mziJpklgq, oGL2PFpoz, ZBRfzJCvQ, yzeVRH43J, JzIkcDv6h, OpanQvSs6, xraYf44sq, gvujSIDxh, wPKTuVlH4, vAHVsq2d0, ...restProps } = getProps16(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState7({ cycleOrder: cycleOrder4, defaultVariant: "NdrwNM7RY", ref: refBinding, variant, variantClassNames: variantClassNames7 });
  const layoutDependency = createLayoutDependency7(props, variants);
  const sharedStyleClassNames = [];
  const scopingClassNames = cx16(serializationHash7, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (baseVariant === "T8vqY1bi7")
      return false;
    return true;
  };
  return /* @__PURE__ */ _jsx22(LayoutGroup7, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx22(Variants7, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx22(Transition7, { value: transition17, children: /* @__PURE__ */ _jsxs10(motion22.div, { ...restProps, ...gestureHandlers, className: cx16(scopingClassNames, "framer-b1brxn", className5, classNames), "data-framer-name": "Default", layoutDependency, layoutId: "H6DtvFhKg__NdrwNM7RY", ref: refBinding, style: { ...style }, ...addPropertyOverrides6({ T8vqY1bi7: { "data-framer-name": "No promotion" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsxs10(motion22.div, { className: "framer-1vifhry", "data-framer-name": "Links Container", layoutDependency, layoutId: "H6DtvFhKg__DgkpOCkq5", style: { backgroundColor: "var(--token-5c2e7b2b-ab7a-402a-8766-83648bfd6051, rgb(255, 255, 255))", borderBottomLeftRadius: 20, borderBottomRightRadius: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, boxShadow: "0px 0px 8px 0px rgba(0, 0, 0, 0.04)" }, children: [/* @__PURE__ */ _jsx22(ComponentViewportProvider4, { height: 178, width: "200px", y: (componentViewport?.y || 0) + 12 + 32, children: /* @__PURE__ */ _jsx22(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation4, className: "framer-sqsmol-container", "data-framer-appear-id": "sqsmol", initial: animation12, layoutDependency, layoutId: "H6DtvFhKg__P6HPAI9Z_-container", nodeId: "P6HPAI9Z_", optimized: true, rendersWithMotion: true, scopeId: "gQ1nc7zls", children: /* @__PURE__ */ _jsx22(oksr8yeN3_default, { b8pbow8Ls: tkvZz4aVb, BGt0yzV6o: t5rUBFdQ3, height: "100%", hVRulLKoU: jyyfbhpI2, id: "P6HPAI9Z_", joGBQmonv: TGpiC0Pem, Jysop11hY: VDqAgC9MU, layoutId: "H6DtvFhKg__P6HPAI9Z_", Lcsf800Oo: WA8hAvxuw, MKZXjkWik: qLeNWQ9LE, MxCXtj19q: lV17lapcT, ooAkgJeId: BD6QQg3tv, style: { width: "100%" }, tQU9REL0Z: H2Mdatcx7, variant: "FIMtTw1Sp", WenZstdsn: HHsicUGza, width: "100%", zOJomZjEY: UgVgNbwJF }) }) }), /* @__PURE__ */ _jsx22(ComponentViewportProvider4, { height: 178, width: "200px", y: (componentViewport?.y || 0) + 12 + 32, children: /* @__PURE__ */ _jsx22(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation22, className: "framer-h6pr4u-container", "data-framer-appear-id": "h6pr4u", initial: animation12, layoutDependency, layoutId: "H6DtvFhKg__uoixI0B77-container", nodeId: "uoixI0B77", optimized: true, rendersWithMotion: true, scopeId: "gQ1nc7zls", children: /* @__PURE__ */ _jsx22(oksr8yeN3_default, { b8pbow8Ls: lZph_dNvA, BGt0yzV6o: lDN7RfsyH, height: "100%", hVRulLKoU: JFZNnBlhv, id: "uoixI0B77", joGBQmonv: yd7OLhUku, Jysop11hY: HJxdmW4NU, layoutId: "H6DtvFhKg__uoixI0B77", Lcsf800Oo: gFttPqMLk, MKZXjkWik: ytkE1lYl5, MxCXtj19q: RUnP3Js3Q, ooAkgJeId: L5XCxMk9w, style: { width: "100%" }, tQU9REL0Z: bIEkxkqHQ, variant: "FIMtTw1Sp", WenZstdsn: TKwQrsFjC, width: "100%", zOJomZjEY: OrqoH2s70 }) }) }), /* @__PURE__ */ _jsx22(ComponentViewportProvider4, { height: 178, width: "200px", y: (componentViewport?.y || 0) + 12 + 32, children: /* @__PURE__ */ _jsx22(SmartComponentScopedContainerWithFXWithOptimizedAppearEffect, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation32, className: "framer-hz2ie-container", "data-framer-appear-id": "hz2ie", initial: animation12, layoutDependency, layoutId: "H6DtvFhKg__xdNb_9yQp-container", nodeId: "xdNb_9yQp", optimized: true, rendersWithMotion: true, scopeId: "gQ1nc7zls", children: /* @__PURE__ */ _jsx22(oksr8yeN3_default, { b8pbow8Ls: oGL2PFpoz, BGt0yzV6o: kCJC_ad0I, height: "100%", hVRulLKoU: akz0cgpPs, id: "xdNb_9yQp", joGBQmonv: uZmPElGpa, Jysop11hY: yzeVRH43J, layoutId: "H6DtvFhKg__xdNb_9yQp", Lcsf800Oo: ShAwqR8jv, MKZXjkWik: fdvKm0wP1, MxCXtj19q: qh0OYgAJ8, ooAkgJeId: mziJpklgq, style: { width: "100%" }, tQU9REL0Z: ZBRfzJCvQ, variant: "FIMtTw1Sp", WenZstdsn: swlreAgp0, width: "100%", zOJomZjEY: TV4IHgyuu }) }) })] }), isDisplayed() && /* @__PURE__ */ _jsx22(ComponentViewportProvider4, { height: ((componentViewport?.height || 360) - 12) * 1, y: (componentViewport?.y || 0) + 12, children: /* @__PURE__ */ _jsx22(SmartComponentScopedContainer4, { className: "framer-1y4de85-container", "data-framer-name": "Promotion Container", layoutDependency, layoutId: "H6DtvFhKg__LxHhemPZT-container", name: "Promotion Container", nodeId: "LxHhemPZT", rendersWithMotion: true, scopeId: "gQ1nc7zls", children: /* @__PURE__ */ _jsx22(LDXuwrbTo_default, { da4YRdA46: toResponsiveImage2(JzIkcDv6h), height: "100%", Hn3rFsdHu: wPKTuVlH4, id: "LxHhemPZT", J7aEOY5gs: gvujSIDxh, layoutId: "H6DtvFhKg__LxHhemPZT", name: "Promotion Container", NIzV_a1C2: vAHVsq2d0, style: { height: "100%", maxWidth: "100%", width: "100%" }, tGoganY_w: xraYf44sq, width: "100%", zlmFNV1Lm: OpanQvSs6 }) }) })] }) }) }) });
});
var css20 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-hVKug.framer-8kbxxh, .framer-hVKug .framer-8kbxxh { display: block; }", ".framer-hVKug.framer-b1brxn { align-content: flex-start; align-items: flex-start; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 12px; height: auto; justify-content: center; overflow: visible; padding: 12px 0px 0px 0px; position: relative; width: 100%; }", ".framer-hVKug .framer-1vifhry { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 20px; height: 100%; justify-content: flex-start; max-width: 908px; overflow: var(--overflow-clip-fallback, clip); padding: 32px 28px 28px 28px; position: relative; width: min-content; will-change: var(--framer-will-change-override, transform); }", ".framer-hVKug .framer-sqsmol-container, .framer-hVKug .framer-h6pr4u-container, .framer-hVKug .framer-hz2ie-container { flex: none; height: auto; position: relative; width: 200px; }", ".framer-hVKug .framer-1y4de85-container { flex: 1 0 0px; height: 100%; max-width: 760px; position: relative; width: 1px; }"];
var FramergQ1nc7zls = withCSS17(Component16, css20, "framer-hVKug");
var gQ1nc7zls_default = FramergQ1nc7zls;
FramergQ1nc7zls.displayName = "Dropdown Overlay";
FramergQ1nc7zls.defaultProps = { height: 360, width: 1126 };
addPropertyControls16(FramergQ1nc7zls, { variant: { options: ["NdrwNM7RY", "T8vqY1bi7"], optionTitles: ["Default", "No promotion"], title: "Variant", type: ControlType16.Enum }, jyyfbhpI2: { defaultValue: "Food & Nutrition", displayTextArea: false, title: "Subcategory A", type: ControlType16.String }, t5rUBFdQ3: { title: "Subcategory A Link", type: ControlType16.Link }, lV17lapcT: { defaultValue: "Dry food", displayTextArea: false, title: "A \xB7 Item 1", type: ControlType16.String }, UgVgNbwJF: { title: "A \xB7 Link 1", type: ControlType16.Link }, qLeNWQ9LE: { defaultValue: "Wet food", displayTextArea: false, title: "A \xB7 Item 2", type: ControlType16.String }, WA8hAvxuw: { title: "A \xB7 Link 2", type: ControlType16.Link }, HHsicUGza: { defaultValue: "Treats & snacks", displayTextArea: false, title: "A \xB7 Item 3", type: ControlType16.String }, TGpiC0Pem: { title: "A \xB7 Link 3", type: ControlType16.Link }, BD6QQg3tv: { defaultValue: "Supplements", displayTextArea: false, title: "A \xB7 Item 4", type: ControlType16.String }, tkvZz4aVb: { title: "A \xB7 Link 4", type: ControlType16.Link }, H2Mdatcx7: { defaultValue: "Weight management", displayTextArea: false, title: "A \xB7 Item 5", type: ControlType16.String }, VDqAgC9MU: { title: "A \xB7 Link 5", type: ControlType16.Link }, JFZNnBlhv: { defaultValue: "Health & Wellness", displayTextArea: false, title: "Subcategory B", type: ControlType16.String }, lDN7RfsyH: { title: "Subcategory B Link", type: ControlType16.Link }, RUnP3Js3Q: { defaultValue: "Vitamins", displayTextArea: false, title: "B \xB7 Item 1", type: ControlType16.String }, OrqoH2s70: { title: "B \xB7 Link 1", type: ControlType16.Link }, ytkE1lYl5: { defaultValue: "Grooming", displayTextArea: false, title: "B \xB7 Item 2", type: ControlType16.String }, gFttPqMLk: { title: "B \xB7 Link 2", type: ControlType16.Link }, TKwQrsFjC: { defaultValue: "Flea & tick control", displayTextArea: false, title: "B \xB7 Item 3", type: ControlType16.String }, yd7OLhUku: { title: "B \xB7 Link 3", type: ControlType16.Link }, L5XCxMk9w: { defaultValue: "Joint support", displayTextArea: false, title: "B \xB7 Item 4", type: ControlType16.String }, lZph_dNvA: { title: "B \xB7 Link 4", type: ControlType16.Link }, bIEkxkqHQ: { defaultValue: "Dental health", displayTextArea: false, title: "B \xB7 Item 5", type: ControlType16.String }, HJxdmW4NU: { title: "B \xB7 Link 5", type: ControlType16.Link }, akz0cgpPs: { defaultValue: "Accessories", displayTextArea: false, title: "Subcategory C", type: ControlType16.String }, kCJC_ad0I: { title: "Subcategory C Link", type: ControlType16.Link }, qh0OYgAJ8: { defaultValue: "Beds & furniture", displayTextArea: false, title: "C\xB7 Item 1", type: ControlType16.String }, TV4IHgyuu: { title: "C\xB7 Link 1", type: ControlType16.Link }, fdvKm0wP1: { defaultValue: "Apparel", displayTextArea: false, title: "C\xB7 Item 2", type: ControlType16.String }, ShAwqR8jv: { title: "C\xB7 Link 2", type: ControlType16.Link }, swlreAgp0: { defaultValue: "Leashes & collars", displayTextArea: false, title: "C\xB7 Item 3", type: ControlType16.String }, uZmPElGpa: { title: "C\xB7 Link 3", type: ControlType16.Link }, mziJpklgq: { defaultValue: "Toys & enrichment", displayTextArea: false, title: "C\xB7 Item 4", type: ControlType16.String }, oGL2PFpoz: { title: "C\xB7 Link 4", type: ControlType16.Link }, ZBRfzJCvQ: { defaultValue: "Bowls & feeders", displayTextArea: false, title: "C\xB7 Item 5", type: ControlType16.String }, yzeVRH43J: { title: "C\xB7 Link 5", type: ControlType16.Link }, JzIkcDv6h: { __defaultAssetReference: "data:framer/asset-reference,rbBkH7YInKmRpxipaOTrn2pkTg.png?originalFilename=dog-food.png&width=668&height=668", title: "Image", type: ControlType16.ResponsiveImage }, OpanQvSs6: { defaultValue: "", displayTextArea: false, title: "Badge", type: ControlType16.String }, xraYf44sq: { defaultValue: { identifier: "module:SUBEdtCFaOJwrjN2Inhk/bznEUerLEqVVXGfsDOYE/pKERsxd4H.js:default", moduleId: "SUBEdtCFaOJwrjN2Inhk" }, setModuleId: "omX0gWFPqDwhaiWwf6ab", title: "Vector", type: ControlType16.VectorSetItem }, gvujSIDxh: { defaultValue: 'var(--token-dacc9230-b126-45d9-8410-cda89f0e6ba0, rgb(201, 217, 193)) /* {"name":"Green"} */', title: "Badge Color", type: ControlType16.Color }, wPKTuVlH4: { defaultValue: "Grain-free chicken recipe", displayTextArea: false, title: "Title", type: ControlType16.String }, vAHVsq2d0: { defaultValue: "High-protein formula with real chicken and essential taurine for optimal health.", displayTextArea: false, title: "Description", type: ControlType16.String } });
addFonts7(FramergQ1nc7zls, [{ explicitInter: true, fonts: [] }, ...SubcategoryGroupTESTFonts, ...FeaturedProductTestFonts], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/eppxcAzLT4bEVlQI8dMN/I6QmEzTUDMkvkugJOjc8/WXSGorNXU.js
var SubcategoryGroupFonts = getFonts5(oksr8yeN3_default);
var DropdownOverlayFonts = getFonts5(gQ1nc7zls_default);
var MotionDivWithFX = withFX3(motion23.div);
var ArrowDropDownFonts2 = getFonts5(djdXZjS4N_default);
var enabledGestures5 = { so6FWD1pD: { hover: true } };
var cycleOrder5 = ["so6FWD1pD", "WopQKFEcj", "qa8cZeSaB"];
var serializationHash8 = "framer-g64i2";
var variantClassNames8 = { qa8cZeSaB: "framer-v-e7nf13", so6FWD1pD: "framer-v-1pm78o1", WopQKFEcj: "framer-v-xujted" };
function addPropertyOverrides7(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition18 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var animation5 = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition18, x: 0, y: 0 };
var animation13 = { opacity: 1, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, transition: transition18, x: 0, y: 0 };
var animation23 = { opacity: 0, rotate: 0, rotateX: 0, rotateY: 0, scale: 1, skewX: 0, skewY: 0, x: 0, y: 0 };
var toResponsiveImage3 = (value) => {
  if (typeof value === "object" && value !== null && typeof value.src === "string") {
    return value;
  }
  return typeof value === "string" ? { src: value } : void 0;
};
var Transition8 = ({ value, children }) => {
  const config = React21.useContext(MotionConfigContext8);
  const transition = value ?? config.transition;
  const contextValue = React21.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx23(MotionConfigContext8.Provider, { value: contextValue, children });
};
var Overlay3 = ({ children, blockDocumentScrolling, dismissWithEsc, enabled = true }) => {
  const [visible, setVisible] = useOverlayState({ blockDocumentScrolling, dismissWithEsc: enabled && dismissWithEsc });
  return children({ hide: () => setVisible(false), show: () => setVisible(true), toggle: () => setVisible(!visible), visible: enabled && visible });
};
var Variants8 = motion23.create(React21.Fragment);
var humanReadableVariantMap5 = { "Mobile Closed": "WopQKFEcj", "Mobile Open": "qa8cZeSaB", Desktop: "so6FWD1pD" };
var getProps17 = ({ aItem1, aItem2, aItem3, aItem4, aItem5, aLink1, aLink2, aLink3, aLink4, aLink5, badge, badgeColor, badgeIcon, bItem1, bItem2, bItem3, bItem4, bItem5, bLink1, bLink2, bLink3, bLink4, bLink5, categoryTitle, cItem1, cItem2, cItem3, cItem4, cItem5, click, cLink1, cLink2, cLink3, cLink4, cLink5, featuredProduct, height, hover, id, image, productDescription, subcategoryA, subcategoryALink, subcategoryB, subcategoryBLink, subcategoryC, subcategoryCLink, width, ...props }) => {
  return { ...props, aN8C0k_P1: subcategoryA ?? props.aN8C0k_P1 ?? "Food & Nutrition", B_8wa4JwR: bLink4 ?? props.B_8wa4JwR, B14WiGH6x: aItem3 ?? props.B14WiGH6x ?? "Treats & snacks", bsnX_LpQL: bItem4 ?? props.bsnX_LpQL ?? "Joint support", cwfoGQIKH: cLink3 ?? props.cwfoGQIKH, CziM7_j19: productDescription ?? props.CziM7_j19 ?? "High-protein formula with real chicken and essential taurine for optimal health.", dkFuHUn48: featuredProduct ?? props.dkFuHUn48 ?? "Grain-free chicken recipe", EiqA2h4UN: cItem3 ?? props.EiqA2h4UN ?? "Leashes & collars", EZY23vzkO: bItem3 ?? props.EZY23vzkO ?? "Flea & tick control", Ft4iZuDmT: aItem5 ?? props.Ft4iZuDmT ?? "Weight management", HCq__LQ10: cLink4 ?? props.HCq__LQ10, iBlqjS1Hs: aLink1 ?? props.iBlqjS1Hs, IH6qyDmmt: aLink5 ?? props.IH6qyDmmt, IvO6PwZ4U: cLink5 ?? props.IvO6PwZ4U, IxpRFXTsn: bLink5 ?? props.IxpRFXTsn, Ji8VYaY6D: cItem5 ?? props.Ji8VYaY6D ?? "Bowls & feeders", JnXFn5lDA: subcategoryCLink ?? props.JnXFn5lDA, Kc7KYtmUN: aLink4 ?? props.Kc7KYtmUN, l8YtKDxx9: cLink2 ?? props.l8YtKDxx9, lCyGeyp22: bLink1 ?? props.lCyGeyp22, LwvstiJ4c: subcategoryB ?? props.LwvstiJ4c ?? "Health & Wellness", nuQMxNxhz: aItem1 ?? props.nuQMxNxhz ?? "Dry food", oh11Y9az8: badgeColor ?? props.oh11Y9az8 ?? "var(--token-dacc9230-b126-45d9-8410-cda89f0e6ba0, rgb(201, 217, 193))", oK166sf0T: aItem2 ?? props.oK166sf0T ?? "Wet food", OS3grMcKp: cLink1 ?? props.OS3grMcKp, pHuiIzDYM: cItem4 ?? props.pHuiIzDYM ?? "Toys & enrichment", QoNywXHMy: bLink3 ?? props.QoNywXHMy, rrNjXeHir: bLink2 ?? props.rrNjXeHir, rsLB54kfP: bItem1 ?? props.rsLB54kfP ?? "Vitamins", RXo5FUtqd: aLink2 ?? props.RXo5FUtqd, RYH2D3xE4: hover ?? props.RYH2D3xE4, sHR0du_Se: subcategoryBLink ?? props.sHR0du_Se, TWe4LBo2W: bItem5 ?? props.TWe4LBo2W ?? "Dental health", uEzGjuMrs: badgeIcon ?? props.uEzGjuMrs ?? pKERsxd4H_default, variant: humanReadableVariantMap5[props.variant] ?? props.variant ?? "so6FWD1pD", vlbzFezbn: cItem2 ?? props.vlbzFezbn ?? "Apparel", W_gIZDVe4: subcategoryALink ?? props.W_gIZDVe4, w8Ih6bjZ0: subcategoryC ?? props.w8Ih6bjZ0 ?? "Accessories", We6WtJ6Kf: aItem4 ?? props.We6WtJ6Kf ?? "Supplements", WtKgHrz2U: bItem2 ?? props.WtKgHrz2U ?? "Grooming", xbjP4NdDm: image ?? props.xbjP4NdDm ?? { pixelHeight: 668, pixelWidth: 668, src: "https://framerusercontent.com/images/rbBkH7YInKmRpxipaOTrn2pkTg.png?width=668&height=668", srcSet: "https://framerusercontent.com/images/rbBkH7YInKmRpxipaOTrn2pkTg.png?scale-down-to=512&width=668&height=668 512w,https://framerusercontent.com/images/rbBkH7YInKmRpxipaOTrn2pkTg.png?width=668&height=668 668w" }, XMyxxRjUC: aLink3 ?? props.XMyxxRjUC, YCPZsBR4y: badge ?? props.YCPZsBR4y, YlYObYQnt: cItem1 ?? props.YlYObYQnt ?? "Beds & furniture", zae0YDC0z: categoryTitle ?? props.zae0YDC0z ?? "Dogs", ZRZoD8Lxv: click ?? props.ZRZoD8Lxv };
};
var createLayoutDependency8 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component17 = /* @__PURE__ */ React21.forwardRef(function(props, ref) {
  const fallbackRef = useRef15(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React21.useId();
  const { activeLocale, setLocale } = useLocaleInfo16();
  const componentViewport = useComponentViewport8();
  const { style, className: className5, layoutId, variant, RYH2D3xE4, ZRZoD8Lxv, zae0YDC0z, aN8C0k_P1, W_gIZDVe4, nuQMxNxhz, iBlqjS1Hs, oK166sf0T, RXo5FUtqd, B14WiGH6x, XMyxxRjUC, We6WtJ6Kf, Kc7KYtmUN, Ft4iZuDmT, IH6qyDmmt, LwvstiJ4c, sHR0du_Se, rsLB54kfP, lCyGeyp22, WtKgHrz2U, rrNjXeHir, EZY23vzkO, QoNywXHMy, bsnX_LpQL, B_8wa4JwR, TWe4LBo2W, IxpRFXTsn, w8Ih6bjZ0, JnXFn5lDA, YlYObYQnt, OS3grMcKp, vlbzFezbn, l8YtKDxx9, EiqA2h4UN, cwfoGQIKH, pHuiIzDYM, HCq__LQ10, Ji8VYaY6D, IvO6PwZ4U, dkFuHUn48, CziM7_j19, xbjP4NdDm, YCPZsBR4y, uEzGjuMrs, oh11Y9az8, ...restProps } = getProps17(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState8({ cycleOrder: cycleOrder5, defaultVariant: "so6FWD1pD", enabledGestures: enabledGestures5, ref: refBinding, variant, variantClassNames: variantClassNames8 });
  const layoutDependency = createLayoutDependency8(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback3(baseVariant);
  const onMouseEnterujujp2 = ({ overlay }) => activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: true });
    overlay.show();
  });
  const onTap1roqr3a = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    setVariant("qa8cZeSaB");
  });
  const onTapf1m7da = activeVariantCallback(async (...args) => {
    setGestureState({ isPressed: false });
    if (ZRZoD8Lxv) {
      const res = await ZRZoD8Lxv(...args);
      if (res === false)
        return false;
    }
  });
  const onMouseEnter1i9hxgm = activeVariantCallback(async (...args) => {
    if (RYH2D3xE4) {
      const res = await RYH2D3xE4(...args);
      if (res === false)
        return false;
    }
  });
  const onTaphyyejx = activeVariantCallback(async (...args) => {
    setVariant("WopQKFEcj");
  });
  const sharedStyleClassNames = [className2, className3];
  const scopingClassNames = cx17(serializationHash8, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (["WopQKFEcj", "qa8cZeSaB"].includes(baseVariant))
      return false;
    return true;
  };
  const isDisplayed1 = () => {
    if (baseVariant === "qa8cZeSaB")
      return true;
    return false;
  };
  const ref1 = React21.useRef(null);
  const isDisplayed2 = () => {
    if (["WopQKFEcj", "qa8cZeSaB"].includes(baseVariant))
      return true;
    return false;
  };
  const isDisplayed3 = () => {
    if (baseVariant === "WopQKFEcj")
      return true;
    return false;
  };
  return /* @__PURE__ */ _jsx23(LayoutGroup8, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx23(Variants8, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx23(Overlay3, { blockDocumentScrolling: false, dismissWithEsc: false, enabled: isDisplayed(), children: (overlay) => /* @__PURE__ */ _jsx23(_Fragment, { children: /* @__PURE__ */ _jsx23(Transition8, { value: transition18, children: /* @__PURE__ */ _jsxs11(motion23.div, { ...restProps, ...gestureHandlers, className: cx17(scopingClassNames, "framer-1pm78o1", className5, classNames), "data-framer-name": "Desktop", "data-highlight": true, id: `${layoutId}-1pm78o1`, layoutDependency, layoutId: "H6DtvFhKg__so6FWD1pD", onMouseEnter: onMouseEnterujujp2({ overlay }), ref: refBinding, style: { "--border-bottom-width": "0px", "--border-color": "rgba(0, 0, 0, 0)", "--border-left-width": "0px", "--border-right-width": "0px", "--border-style": "solid", "--border-top-width": "0px", ...style }, variants: { "so6FWD1pD-hover": { "--border-bottom-width": "1px", "--border-color": "var(--token-9bf3fd56-1b46-466c-a3ae-db4f9717f0f5, rgb(138, 138, 138))", "--border-left-width": "0px", "--border-right-width": "0px", "--border-style": "solid", "--border-top-width": "0px" } }, ...addPropertyOverrides7({ "so6FWD1pD-hover": { "data-border": true, "data-framer-name": void 0 }, qa8cZeSaB: { "data-framer-name": "Mobile Open", onTap: onTapf1m7da }, WopQKFEcj: { "data-framer-name": "Mobile Closed", onTap: onTap1roqr3a } }, baseVariant, gestureVariant), children: [isDisplayed() && /* @__PURE__ */ _jsx23(RichText7, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx23(React21.Fragment, { children: /* @__PURE__ */ _jsx23(motion23.p, { className: "framer-styles-preset-1dnr4lh", "data-styles-preset": "lMJjY3v8f", children: "Dogs" }) }), className: "framer-1ddw7or", "data-highlight": true, fonts: ["Inter"], layoutDependency, layoutId: "H6DtvFhKg__Yg9HAKDwc", onMouseEnter: onMouseEnter1i9hxgm, style: { "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: zae0YDC0z, verticalAlignment: "top", withExternalLayout: true }), isDisplayed1() && /* @__PURE__ */ _jsxs11(motion23.div, { className: "framer-1fufrk6", layoutDependency, layoutId: "H6DtvFhKg__W_EEBogLW", children: [isDisplayed1() && /* @__PURE__ */ _jsx23(ComponentViewportProvider5, { ...addPropertyOverrides7({ qa8cZeSaB: { height: 178, width: `calc(${componentViewport?.width || "100vw"} - 8px)`, y: (componentViewport?.y || 0) + 0 + 32 + 8 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx23(SmartComponentScopedContainer5, { className: "framer-1b970lh-container", layoutDependency, layoutId: "H6DtvFhKg__q2b401VvV-container", nodeId: "q2b401VvV", rendersWithMotion: true, scopeId: "WXSGorNXU", children: /* @__PURE__ */ _jsx23(oksr8yeN3_default, { b8pbow8Ls: Kc7KYtmUN, BGt0yzV6o: W_gIZDVe4, height: "100%", hVRulLKoU: aN8C0k_P1, id: "q2b401VvV", joGBQmonv: XMyxxRjUC, Jysop11hY: IH6qyDmmt, layoutId: "H6DtvFhKg__q2b401VvV", Lcsf800Oo: RXo5FUtqd, MKZXjkWik: oK166sf0T, MxCXtj19q: nuQMxNxhz, ooAkgJeId: We6WtJ6Kf, style: { width: "100%" }, tQU9REL0Z: Ft4iZuDmT, variant: "RsICntwtA", WenZstdsn: B14WiGH6x, width: "100%", zOJomZjEY: iBlqjS1Hs }) }) }), isDisplayed1() && /* @__PURE__ */ _jsx23(ComponentViewportProvider5, { ...addPropertyOverrides7({ qa8cZeSaB: { height: 178, width: `calc(${componentViewport?.width || "100vw"} - 8px)`, y: (componentViewport?.y || 0) + 0 + 32 + 8 + 198 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx23(SmartComponentScopedContainer5, { className: "framer-zfffd6-container", layoutDependency, layoutId: "H6DtvFhKg__vCjEDJGsp-container", nodeId: "vCjEDJGsp", rendersWithMotion: true, scopeId: "WXSGorNXU", children: /* @__PURE__ */ _jsx23(oksr8yeN3_default, { b8pbow8Ls: B_8wa4JwR, BGt0yzV6o: sHR0du_Se, height: "100%", hVRulLKoU: LwvstiJ4c, id: "vCjEDJGsp", joGBQmonv: QoNywXHMy, Jysop11hY: IxpRFXTsn, layoutId: "H6DtvFhKg__vCjEDJGsp", Lcsf800Oo: rrNjXeHir, MKZXjkWik: WtKgHrz2U, MxCXtj19q: rsLB54kfP, ooAkgJeId: bsnX_LpQL, style: { width: "100%" }, tQU9REL0Z: TWe4LBo2W, variant: "RsICntwtA", WenZstdsn: EZY23vzkO, width: "100%", zOJomZjEY: lCyGeyp22 }) }) }), isDisplayed1() && /* @__PURE__ */ _jsx23(ComponentViewportProvider5, { ...addPropertyOverrides7({ qa8cZeSaB: { height: 178, width: `calc(${componentViewport?.width || "100vw"} - 8px)`, y: (componentViewport?.y || 0) + 0 + 32 + 8 + 396 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx23(SmartComponentScopedContainer5, { className: "framer-6r4ive-container", layoutDependency, layoutId: "H6DtvFhKg__PedoBaMCE-container", nodeId: "PedoBaMCE", rendersWithMotion: true, scopeId: "WXSGorNXU", children: /* @__PURE__ */ _jsx23(oksr8yeN3_default, { b8pbow8Ls: HCq__LQ10, BGt0yzV6o: JnXFn5lDA, height: "100%", hVRulLKoU: w8Ih6bjZ0, id: "PedoBaMCE", joGBQmonv: cwfoGQIKH, Jysop11hY: IvO6PwZ4U, layoutId: "H6DtvFhKg__PedoBaMCE", Lcsf800Oo: l8YtKDxx9, MKZXjkWik: vlbzFezbn, MxCXtj19q: YlYObYQnt, ooAkgJeId: pHuiIzDYM, style: { width: "100%" }, tQU9REL0Z: Ji8VYaY6D, variant: "RsICntwtA", WenZstdsn: EiqA2h4UN, width: "100%", zOJomZjEY: OS3grMcKp }) }) })] }), isDisplayed() && /* @__PURE__ */ _jsx23(AnimatePresence2, { children: overlay.visible && /* @__PURE__ */ _jsx23(Floating, { alignment: "center", anchorRef: refBinding, className: cx17(scopingClassNames, classNames), collisionDetection: true, collisionDetectionPadding: 20, "data-framer-portal-id": `${layoutId}-1pm78o1`, offsetX: 0, offsetY: 22, onDismiss: overlay.hide, placement: "bottom", safeArea: true, zIndex: 11, children: /* @__PURE__ */ _jsx23(MotionDivWithFX, { __perspectiveFX: false, __smartComponentFX: true, __targetOpacity: 1, animate: animation13, className: "framer-ljrmg3", exit: animation5, initial: animation23, layoutDependency, layoutId: "H6DtvFhKg__YsJtfoTUz", ref: ref1, role: "dialog", style: { borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10 }, children: /* @__PURE__ */ _jsx23(ComponentViewportProvider5, { width: "1126px", children: /* @__PURE__ */ _jsx23(SmartComponentScopedContainer5, { className: "framer-17lqbdh-container", layoutDependency, layoutId: "H6DtvFhKg__P2pvUlOMv-container", nodeId: "P2pvUlOMv", rendersWithMotion: true, scopeId: "WXSGorNXU", children: /* @__PURE__ */ _jsx23(gQ1nc7zls_default, { akz0cgpPs: w8Ih6bjZ0, BD6QQg3tv: We6WtJ6Kf, bIEkxkqHQ: TWe4LBo2W, fdvKm0wP1: vlbzFezbn, gFttPqMLk: rrNjXeHir, gvujSIDxh: oh11Y9az8, H2Mdatcx7: Ft4iZuDmT, height: "100%", HHsicUGza: B14WiGH6x, HJxdmW4NU: IxpRFXTsn, id: "P2pvUlOMv", JFZNnBlhv: LwvstiJ4c, jyyfbhpI2: aN8C0k_P1, JzIkcDv6h: toResponsiveImage3(xbjP4NdDm), kCJC_ad0I: JnXFn5lDA, L5XCxMk9w: bsnX_LpQL, layoutId: "H6DtvFhKg__P2pvUlOMv", lDN7RfsyH: sHR0du_Se, lV17lapcT: nuQMxNxhz, lZph_dNvA: B_8wa4JwR, mziJpklgq: pHuiIzDYM, oGL2PFpoz: HCq__LQ10, OpanQvSs6: YCPZsBR4y, OrqoH2s70: lCyGeyp22, qh0OYgAJ8: YlYObYQnt, qLeNWQ9LE: oK166sf0T, RUnP3Js3Q: rsLB54kfP, ShAwqR8jv: l8YtKDxx9, style: { height: "100%", width: "100%" }, swlreAgp0: EiqA2h4UN, t5rUBFdQ3: W_gIZDVe4, TGpiC0Pem: XMyxxRjUC, tkvZz4aVb: Kc7KYtmUN, TKwQrsFjC: EZY23vzkO, TV4IHgyuu: OS3grMcKp, UgVgNbwJF: iBlqjS1Hs, uZmPElGpa: cwfoGQIKH, vAHVsq2d0: CziM7_j19, variant: "NdrwNM7RY", VDqAgC9MU: IH6qyDmmt, WA8hAvxuw: RXo5FUtqd, width: "100%", wPKTuVlH4: dkFuHUn48, xraYf44sq: uEzGjuMrs, yd7OLhUku: QoNywXHMy, ytkE1lYl5: WtKgHrz2U, yzeVRH43J: IvO6PwZ4U, ZBRfzJCvQ: Ji8VYaY6D }) }) }) }) }) }), isDisplayed2() && /* @__PURE__ */ _jsxs11(motion23.div, { className: "framer-xkrpgg", layoutDependency, layoutId: "H6DtvFhKg__Jc269E5WK", ...addPropertyOverrides7({ qa8cZeSaB: { "data-highlight": true, onTap: onTaphyyejx } }, baseVariant, gestureVariant), children: [isDisplayed2() && /* @__PURE__ */ _jsx23(RichText7, { __fromCanvasComponent: true, children: /* @__PURE__ */ _jsx23(React21.Fragment, { children: /* @__PURE__ */ _jsx23(motion23.p, { className: "framer-styles-preset-xvuzl8", "data-styles-preset": "Dvya5fqDf", children: "Dogs" }) }), className: "framer-1tvo6tt", "data-highlight": true, fonts: ["Inter"], layoutDependency, layoutId: "H6DtvFhKg__PDy5WHfD5", onMouseEnter: onMouseEnter1i9hxgm, style: { "--framer-link-text-color": "rgb(0, 153, 255)", "--framer-link-text-decoration": "underline" }, text: zae0YDC0z, verticalAlignment: "top", withExternalLayout: true }), isDisplayed1() && /* @__PURE__ */ _jsx23(djdXZjS4N_default, { animated: true, className: "framer-7zh5fn", layoutDependency, layoutId: "H6DtvFhKg__lq2KisrJX", style: { "--esondr": "var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, rgb(0, 0, 0))", rotate: 180 } }), isDisplayed3() && /* @__PURE__ */ _jsx23(djdXZjS4N_default, { animated: true, className: "framer-1bt0sp1", layoutDependency, layoutId: "H6DtvFhKg__GCG0C3WuE", style: { "--esondr": "var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, rgb(0, 0, 0))" } })] })] }) }) }) }) }) });
});
var css21 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-g64i2.framer-uj3r03, .framer-g64i2 .framer-uj3r03 { display: block; }", ".framer-g64i2.framer-1pm78o1 { align-content: center; align-items: center; cursor: pointer; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: min-content; }", ".framer-g64i2 .framer-1ddw7or, .framer-g64i2 .framer-1tvo6tt { flex: none; height: auto; position: relative; white-space: pre; width: auto; }", ".framer-g64i2 .framer-1fufrk6 { align-content: center; align-items: center; align-self: stretch; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 20px; height: min-content; justify-content: center; min-height: 96px; overflow: visible; padding: 8px 0px 8px 8px; position: relative; width: auto; }", ".framer-g64i2 .framer-1b970lh-container, .framer-g64i2 .framer-zfffd6-container, .framer-g64i2 .framer-6r4ive-container { flex: none; height: auto; position: relative; width: 100%; }", ".framer-g64i2 .framer-ljrmg3 { align-content: center; align-items: center; display: flex; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; min-height: 335px; overflow: visible; padding: 0px; position: relative; width: 1126px; }", ".framer-g64i2 .framer-17lqbdh-container { bottom: 0px; flex: none; left: calc(50.00000000000002% - 100% / 2); position: absolute; top: 0px; width: 100%; z-index: 1; }", ".framer-g64i2 .framer-xkrpgg { align-content: center; align-items: center; align-self: stretch; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; min-height: 800px; overflow: visible; padding: 0px; position: relative; width: auto; }", ".framer-g64i2 .framer-7zh5fn { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 24px); position: relative; width: 24px; }", ".framer-g64i2 .framer-1bt0sp1 { flex: none; height: var(--framer-aspect-ratio-supported, 200px); position: relative; }", ".framer-g64i2.framer-v-xujted.framer-1pm78o1 { flex-direction: row; gap: unset; justify-content: space-between; width: 380px; }", ".framer-g64i2.framer-v-xujted .framer-xkrpgg { align-self: unset; flex: 1 0 0px; min-height: unset; order: 3; width: 1px; }", ".framer-g64i2.framer-v-xujted .framer-1bt0sp1 { height: var(--framer-aspect-ratio-supported, 24px); }", ".framer-g64i2.framer-v-e7nf13.framer-1pm78o1 { gap: 8px; justify-content: flex-start; width: 380px; }", ".framer-g64i2.framer-v-e7nf13 .framer-1fufrk6 { align-self: unset; min-height: unset; order: 3; width: 100%; }", ".framer-g64i2.framer-v-e7nf13 .framer-xkrpgg { align-self: unset; cursor: pointer; min-height: unset; order: 2; width: 100%; }", ...css11, ...css14, '.framer-g64i2[data-border="true"]::after, .framer-g64i2 [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FramerWXSGorNXU = withCSS18(Component17, css21, "framer-g64i2");
var WXSGorNXU_default = FramerWXSGorNXU;
FramerWXSGorNXU.displayName = "Category Link";
FramerWXSGorNXU.defaultProps = { height: 20, width: 34 };
addPropertyControls17(FramerWXSGorNXU, { variant: { options: ["so6FWD1pD", "WopQKFEcj", "qa8cZeSaB"], optionTitles: ["Desktop", "Mobile Closed", "Mobile Open"], title: "Variant", type: ControlType17.Enum }, RYH2D3xE4: { title: "Hover", type: ControlType17.EventHandler }, ZRZoD8Lxv: { title: "Click", type: ControlType17.EventHandler }, zae0YDC0z: { defaultValue: "Dogs", displayTextArea: false, title: "Category Title", type: ControlType17.String }, aN8C0k_P1: { defaultValue: "Food & Nutrition", displayTextArea: false, title: "Subcategory A", type: ControlType17.String }, W_gIZDVe4: { title: "Subcategory A Link", type: ControlType17.Link }, nuQMxNxhz: { defaultValue: "Dry food", displayTextArea: false, title: "A Item 1", type: ControlType17.String }, iBlqjS1Hs: { title: "A Link 1", type: ControlType17.Link }, oK166sf0T: { defaultValue: "Wet food", displayTextArea: false, title: "A Item 2", type: ControlType17.String }, RXo5FUtqd: { title: "A Link 2", type: ControlType17.Link }, B14WiGH6x: { defaultValue: "Treats & snacks", displayTextArea: false, title: "A Item 3", type: ControlType17.String }, XMyxxRjUC: { title: "A Link 3", type: ControlType17.Link }, We6WtJ6Kf: { defaultValue: "Supplements", displayTextArea: false, title: "A Item 4", type: ControlType17.String }, Kc7KYtmUN: { title: "A Link 4", type: ControlType17.Link }, Ft4iZuDmT: { defaultValue: "Weight management", displayTextArea: false, title: "A Item 5", type: ControlType17.String }, IH6qyDmmt: { title: "A Link 5", type: ControlType17.Link }, LwvstiJ4c: { defaultValue: "Health & Wellness", displayTextArea: false, title: "Subcategory B", type: ControlType17.String }, sHR0du_Se: { title: "Subcategory B Link", type: ControlType17.Link }, rsLB54kfP: { defaultValue: "Vitamins", displayTextArea: false, title: "B Item 1", type: ControlType17.String }, lCyGeyp22: { title: "B Link 1", type: ControlType17.Link }, WtKgHrz2U: { defaultValue: "Grooming", displayTextArea: false, title: "B Item 2", type: ControlType17.String }, rrNjXeHir: { title: "B Link 2", type: ControlType17.Link }, EZY23vzkO: { defaultValue: "Flea & tick control", displayTextArea: false, title: "B Item 3", type: ControlType17.String }, QoNywXHMy: { title: "B Link 3", type: ControlType17.Link }, bsnX_LpQL: { defaultValue: "Joint support", displayTextArea: false, title: "B Item 4", type: ControlType17.String }, B_8wa4JwR: { title: "B Link 4", type: ControlType17.Link }, TWe4LBo2W: { defaultValue: "Dental health", displayTextArea: false, title: "B Item 5", type: ControlType17.String }, IxpRFXTsn: { title: "B Link 5", type: ControlType17.Link }, w8Ih6bjZ0: { defaultValue: "Accessories", displayTextArea: false, title: "Subcategory C", type: ControlType17.String }, JnXFn5lDA: { title: "Subcategory C Link", type: ControlType17.Link }, YlYObYQnt: { defaultValue: "Beds & furniture", displayTextArea: false, title: "C Item 1", type: ControlType17.String }, OS3grMcKp: { title: "C Link 1", type: ControlType17.Link }, vlbzFezbn: { defaultValue: "Apparel", displayTextArea: false, title: "C Item 2", type: ControlType17.String }, l8YtKDxx9: { title: "C Link 2", type: ControlType17.Link }, EiqA2h4UN: { defaultValue: "Leashes & collars", displayTextArea: false, title: "C Item 3", type: ControlType17.String }, cwfoGQIKH: { title: "C Link 3", type: ControlType17.Link }, pHuiIzDYM: { defaultValue: "Toys & enrichment", displayTextArea: false, title: "C Item 4", type: ControlType17.String }, HCq__LQ10: { title: "C Link 4", type: ControlType17.Link }, Ji8VYaY6D: { defaultValue: "Bowls & feeders", displayTextArea: false, title: "C Item 5", type: ControlType17.String }, IvO6PwZ4U: { title: "C Link 5", type: ControlType17.Link }, dkFuHUn48: { defaultValue: "Grain-free chicken recipe", displayTextArea: false, title: "Featured product", type: ControlType17.String }, CziM7_j19: { defaultValue: "High-protein formula with real chicken and essential taurine for optimal health.", displayTextArea: false, title: "Product Description", type: ControlType17.String }, xbjP4NdDm: { __defaultAssetReference: "data:framer/asset-reference,rbBkH7YInKmRpxipaOTrn2pkTg.png?originalFilename=dog-food.png&width=668&height=668", title: "Image", type: ControlType17.ResponsiveImage }, YCPZsBR4y: { defaultValue: "", displayTextArea: false, title: "Badge", type: ControlType17.String }, uEzGjuMrs: { defaultValue: { identifier: "module:SUBEdtCFaOJwrjN2Inhk/bznEUerLEqVVXGfsDOYE/pKERsxd4H.js:default", moduleId: "SUBEdtCFaOJwrjN2Inhk" }, setModuleId: "omX0gWFPqDwhaiWwf6ab", title: "Badge Icon", type: ControlType17.VectorSetItem }, oh11Y9az8: { defaultValue: 'var(--token-dacc9230-b126-45d9-8410-cda89f0e6ba0, rgb(201, 217, 193)) /* {"name":"Green"} */', title: "Badge Color", type: ControlType17.Color } });
addFonts8(FramerWXSGorNXU, [{ explicitInter: true, fonts: [{ cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0460-052F, U+1C80-1C88, U+20B4, U+2DE0-2DFF, U+A640-A69F, U+FE2E-FE2F", url: "https://framerusercontent.com/assets/5vvr9Vy74if2I6bQbJvbw7SY1pQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116", url: "https://framerusercontent.com/assets/EOr0mi4hNtlgWNn9if640EZzXCo.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+1F00-1FFF", url: "https://framerusercontent.com/assets/Y9k9QrlZAqio88Klkmbd8VoMQc.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0370-03FF", url: "https://framerusercontent.com/assets/OYrD2tBIBPvoJXiIHnLoOXnY9M.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF", url: "https://framerusercontent.com/assets/JeYwfuaPfZHQhEG8U5gtPDZ7WQ.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2070, U+2074-207E, U+2080-208E, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD", url: "https://framerusercontent.com/assets/GrgcKwrN6d3Uz8EwcLHZxwEfC4.woff2", weight: "400" }, { cssFamilyName: "Inter", source: "framer", style: "normal", uiFamilyName: "Inter", unicodeRange: "U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB", url: "https://framerusercontent.com/assets/b6Y37FthZeALduNqHicBT6FutY.woff2", weight: "400" }] }, ...SubcategoryGroupFonts, ...DropdownOverlayFonts, ...ArrowDropDownFonts2, ...getFontsFromSharedStyle7(fonts2), ...getFontsFromSharedStyle7(fonts3)], { supportsExplicitInterCodegen: true });

// http-url:https://framerusercontent.com/modules/HM4SuSjpi4As25a2Cdww/kotud0BuEShycI30iFUb/H6DtvFhKg.js
var CategoryLinkFonts = getFonts6(WXSGorNXU_default);
var SecondaryLinkFonts = getFonts6(HidsWRkFi_default);
var SearchBarFonts = getFonts6(fE2WzAJjM_default);
var ShoppingCartSimpleFonts = getFonts6(JfaLoQZWi_default);
var UserFonts = getFonts6(UvPxI2Cnv_default);
var QuestionMarkFonts = getFonts6(AjQXGkQtG_default);
var cycleOrder6 = ["B3fJHLeg5", "EeqiGoNag", "mi47f6Hr1"];
var serializationHash9 = "framer-ODfxm";
var variantClassNames9 = { B3fJHLeg5: "framer-v-hidwr8", EeqiGoNag: "framer-v-d2a12q", mi47f6Hr1: "framer-v-zkpy58" };
function addPropertyOverrides8(overrides, ...variants) {
  const nextOverrides = {};
  variants?.forEach((variant) => variant && Object.assign(nextOverrides, overrides[variant]));
  return nextOverrides;
}
var transition19 = { bounce: 0.2, delay: 0, duration: 0.4, type: "spring" };
var transition23 = { delay: 0, duration: 0.4, ease: [0.44, 0, 0.56, 1], type: "tween" };
var addImageAlt = (image, alt) => {
  if (!image || typeof image !== "object") {
    return;
  }
  return { ...image, alt };
};
var Transition9 = ({ value, children }) => {
  const config = React22.useContext(MotionConfigContext9);
  const transition = value ?? config.transition;
  const contextValue = React22.useMemo(() => ({ ...config, transition }), [JSON.stringify(transition)]);
  return /* @__PURE__ */ _jsx24(MotionConfigContext9.Provider, { value: contextValue, children });
};
var Variants9 = motion24.create(React22.Fragment);
var humanReadableVariantMap6 = { "Phone Closed": "EeqiGoNag", "Phone Open": "mi47f6Hr1", Default: "B3fJHLeg5" };
var getProps18 = ({ closeOverlay, height, hover, id, overlayOpen, width, ...props }) => {
  return { ...props, HA0uEybAq: closeOverlay ?? props.HA0uEybAq, IhIMzyMCl: hover ?? props.IhIMzyMCl, sQjDHOrde: overlayOpen ?? props.sQjDHOrde, variant: humanReadableVariantMap6[props.variant] ?? props.variant ?? "B3fJHLeg5" };
};
var createLayoutDependency9 = (props, variants) => {
  if (props.layoutDependency)
    return variants.join("-") + props.layoutDependency;
  return variants.join("-");
};
var Component18 = /* @__PURE__ */ React22.forwardRef(function(props, ref) {
  const fallbackRef = useRef16(null);
  const refBinding = ref ?? fallbackRef;
  const defaultLayoutId = React22.useId();
  const { activeLocale, setLocale } = useLocaleInfo17();
  const componentViewport = useComponentViewport9();
  const { style, className: className5, layoutId, variant, sQjDHOrde, IhIMzyMCl, HA0uEybAq, ...restProps } = getProps18(props);
  const { baseVariant, classNames, clearLoadingGesture, gestureHandlers, gestureVariant, isLoading, setGestureState, setVariant, variants } = useVariantState9({ cycleOrder: cycleOrder6, defaultVariant: "B3fJHLeg5", ref: refBinding, variant, variantClassNames: variantClassNames9 });
  const layoutDependency = createLayoutDependency9(props, variants);
  const { activeVariantCallback, delay } = useActiveVariantCallback4(baseVariant);
  const onMouseEnter51a600 = activeVariantCallback(async (...args) => {
    setGestureState({ isHovered: true });
    if (IhIMzyMCl) {
      const res = await IhIMzyMCl(...args);
      if (res === false)
        return false;
    }
  });
  const onTap1tog6c6 = activeVariantCallback(async (...args) => {
    if (HA0uEybAq) {
      const res = await HA0uEybAq(...args);
      if (res === false)
        return false;
    }
  });
  const onTapkmtwkc = activeVariantCallback(async (...args) => {
    if (sQjDHOrde) {
      const res = await sQjDHOrde(...args);
      if (res === false)
        return false;
    }
  });
  const sharedStyleClassNames = [];
  const scopingClassNames = cx18(serializationHash9, ...sharedStyleClassNames);
  const isDisplayed = () => {
    if (baseVariant === "mi47f6Hr1")
      return false;
    return true;
  };
  const isDisplayed1 = () => {
    if (baseVariant === "EeqiGoNag")
      return false;
    return true;
  };
  const isDisplayed2 = () => {
    if (["EeqiGoNag", "mi47f6Hr1"].includes(baseVariant))
      return false;
    return true;
  };
  const isDisplayed3 = () => {
    if (["EeqiGoNag", "mi47f6Hr1"].includes(baseVariant))
      return true;
    return false;
  };
  const isDisplayed4 = () => {
    if (baseVariant === "mi47f6Hr1")
      return true;
    return false;
  };
  return /* @__PURE__ */ _jsx24(LayoutGroup9, { id: layoutId ?? defaultLayoutId, children: /* @__PURE__ */ _jsx24(Variants9, { animate: variants, initial: false, children: /* @__PURE__ */ _jsx24(Transition9, { value: transition19, ...addPropertyOverrides8({ EeqiGoNag: { value: transition23 }, mi47f6Hr1: { value: transition23 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsxs12(motion24.div, { ...restProps, ...gestureHandlers, className: cx18(scopingClassNames, "framer-hidwr8", className5, classNames), "data-framer-name": "Default", "data-highlight": true, layoutDependency, layoutId: "H6DtvFhKg__B3fJHLeg5", onMouseEnter: onMouseEnter51a600, ref: refBinding, style: { backgroundColor: "var(--token-5c2e7b2b-ab7a-402a-8766-83648bfd6051, rgb(255, 255, 255))", ...style }, ...addPropertyOverrides8({ EeqiGoNag: { "data-framer-name": "Phone Closed", "data-highlight": void 0, onMouseEnter: void 0 }, mi47f6Hr1: { "data-framer-name": "Phone Open" } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx24(motion24.div, { className: "framer-1biumxw", layoutDependency, layoutId: "H6DtvFhKg__pDgNyyugY", children: /* @__PURE__ */ _jsxs12(motion24.div, { className: "framer-1auu0us", layoutDependency, layoutId: "H6DtvFhKg__Y2xqWMYAq", children: [isDisplayed() && /* @__PURE__ */ _jsx24(motion24.div, { className: "framer-10sxkvs", "data-framer-name": "Logo", layoutDependency, layoutId: "H6DtvFhKg__ePTVKaBcV", children: /* @__PURE__ */ _jsx24(Image2, { background: { alt: "", fit: "fill", loading: getLoadingLazyAtYPosition2((componentViewport?.y || 0) + 0 + 0 + 15.5 + 4.5 + 0), pixelHeight: 192, pixelWidth: 1095, sizes: "136.875px", src: "https://framerusercontent.com/images/sw0K6W8pKtlL8FeOlfRX88wENxs.png?width=1095&height=192", srcSet: "https://framerusercontent.com/images/sw0K6W8pKtlL8FeOlfRX88wENxs.png?scale-down-to=512&width=1095&height=192 512w,https://framerusercontent.com/images/sw0K6W8pKtlL8FeOlfRX88wENxs.png?scale-down-to=1024&width=1095&height=192 1024w,https://framerusercontent.com/images/sw0K6W8pKtlL8FeOlfRX88wENxs.png?width=1095&height=192 1095w" }, className: "framer-12ocsl7", "data-framer-name": "Logo", fitImageDimension: "width", layoutDependency, layoutId: "H6DtvFhKg__NtczQ8UpT", ...addPropertyOverrides8({ EeqiGoNag: { background: { alt: "", fit: "fill", loading: getLoadingLazyAtYPosition2((componentViewport?.y || 0) + 0 + 0 + 21.5 + 2.5 + 0), pixelHeight: 192, pixelWidth: 1095, sizes: "91.25px", src: "https://framerusercontent.com/images/sw0K6W8pKtlL8FeOlfRX88wENxs.png?width=1095&height=192", srcSet: "https://framerusercontent.com/images/sw0K6W8pKtlL8FeOlfRX88wENxs.png?scale-down-to=512&width=1095&height=192 512w,https://framerusercontent.com/images/sw0K6W8pKtlL8FeOlfRX88wENxs.png?scale-down-to=1024&width=1095&height=192 1024w,https://framerusercontent.com/images/sw0K6W8pKtlL8FeOlfRX88wENxs.png?width=1095&height=192 1095w" } } }, baseVariant, gestureVariant) }) }), isDisplayed1() && /* @__PURE__ */ _jsxs12(motion24.div, { className: "framer-1r5hpno", "data-framer-name": "Category Links", layoutDependency, layoutId: "H6DtvFhKg__ESxK1AC98", children: [/* @__PURE__ */ _jsx24(ComponentViewportProvider6, { height: 20, y: (componentViewport?.y || 0) + 0 + 0 + 15.5 + 6.5 + 0, ...addPropertyOverrides8({ mi47f6Hr1: { width: `min(max(${componentViewport?.width || "100vw"} - 32px, 1px), 1400px)`, y: (componentViewport?.y || 0) + 16 + 0 + 0 + 0 + 64 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx24(SmartComponentScopedContainer6, { className: "framer-1jqr2up-container", layoutDependency, layoutId: "H6DtvFhKg__b_yhbrFFD-container", nodeId: "b_yhbrFFD", rendersWithMotion: true, scopeId: "H6DtvFhKg", children: /* @__PURE__ */ _jsx24(WXSGorNXU_default, { aN8C0k_P1: "Food & Nutrition", B14WiGH6x: "Treats & snacks", bsnX_LpQL: "Joint support", CziM7_j19: "High-protein formula with real chicken and essential taurine for optimal health.", dkFuHUn48: "Grain-free chicken recipe", EiqA2h4UN: "Leashes & collars", EZY23vzkO: "Flea & tick control", Ft4iZuDmT: "Weight management", height: "100%", id: "b_yhbrFFD", Ji8VYaY6D: "Bowls & feeders", layoutId: "H6DtvFhKg__b_yhbrFFD", LwvstiJ4c: "Health & Wellness", nuQMxNxhz: "Dry food", oh11Y9az8: "var(--token-dacc9230-b126-45d9-8410-cda89f0e6ba0, rgb(201, 217, 193))", oK166sf0T: "Wet food", pHuiIzDYM: "Toys & enrichment", rsLB54kfP: "Vitamins", TWe4LBo2W: "Dental health", uEzGjuMrs: pKERsxd4H_default, variant: "so6FWD1pD", vlbzFezbn: "Apparel", w8Ih6bjZ0: "Accessories", We6WtJ6Kf: "Supplements", width: "100%", WtKgHrz2U: "Grooming", YCPZsBR4y: "", YlYObYQnt: "Beds & furniture", zae0YDC0z: "Dogs", ...addPropertyOverrides8({ mi47f6Hr1: { style: { width: "100%" }, variant: "WopQKFEcj" } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx24(ComponentViewportProvider6, { height: 20, y: (componentViewport?.y || 0) + 0 + 0 + 15.5 + 6.5 + 0, ...addPropertyOverrides8({ mi47f6Hr1: { width: `min(max(${componentViewport?.width || "100vw"} - 32px, 1px), 1400px)`, y: (componentViewport?.y || 0) + 16 + 0 + 0 + 0 + 64 + 0 + 32 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx24(SmartComponentScopedContainer6, { className: "framer-1cmyvxb-container", layoutDependency, layoutId: "H6DtvFhKg__AQtRAmulG-container", nodeId: "AQtRAmulG", rendersWithMotion: true, scopeId: "H6DtvFhKg", children: /* @__PURE__ */ _jsx24(WXSGorNXU_default, { aN8C0k_P1: "Food & Nutrition", B14WiGH6x: "Hey & forage", bsnX_LpQL: "Exercise wheels", CziM7_j19: "High-fiber nutrition specially grown for rabbits and guinea pigs' dental health.", dkFuHUn48: "Orchard grass hay", EiqA2h4UN: "Heating & cooling", EZY23vzkO: "Water bottles & bowls", Ft4iZuDmT: "", height: "100%", id: "AQtRAmulG", Ji8VYaY6D: "", layoutId: "H6DtvFhKg__AQtRAmulG", LwvstiJ4c: "Habitat", nuQMxNxhz: "Rabbit food", oh11Y9az8: "var(--token-dacc9230-b126-45d9-8410-cda89f0e6ba0, rgb(201, 217, 193))", oK166sf0T: "Guinea pig food", pHuiIzDYM: "", rsLB54kfP: "Cages & hutches", TWe4LBo2W: "", uEzGjuMrs: cmltrm2mS_default, variant: "so6FWD1pD", vlbzFezbn: "Grooming", w8Ih6bjZ0: "Care", We6WtJ6Kf: "Treats", width: "100%", WtKgHrz2U: "Bedding & nesting", xbjP4NdDm: addImageAlt({ pixelHeight: 668, pixelWidth: 668, src: "https://framerusercontent.com/images/FoarUb5Vu7OYUyUeJOJBIaBTqo.png?width=668&height=668", srcSet: "https://framerusercontent.com/images/FoarUb5Vu7OYUyUeJOJBIaBTqo.png?scale-down-to=512&width=668&height=668 512w,https://framerusercontent.com/images/FoarUb5Vu7OYUyUeJOJBIaBTqo.png?width=668&height=668 668w" }, ""), YCPZsBR4y: "VET RECOMMENDED", YlYObYQnt: "Habitat cleaners", zae0YDC0z: "Rodents", ...addPropertyOverrides8({ mi47f6Hr1: { style: { width: "100%" }, variant: "WopQKFEcj" } }, baseVariant, gestureVariant) }) }) }), /* @__PURE__ */ _jsx24(ComponentViewportProvider6, { height: 20, y: (componentViewport?.y || 0) + 0 + 0 + 15.5 + 6.5 + 0, ...addPropertyOverrides8({ mi47f6Hr1: { width: `min(max(${componentViewport?.width || "100vw"} - 32px, 1px), 1400px)`, y: (componentViewport?.y || 0) + 16 + 0 + 0 + 0 + 64 + 0 + 64 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx24(SmartComponentScopedContainer6, { className: "framer-sb9rag-container", layoutDependency, layoutId: "H6DtvFhKg__Na2cipxUy-container", nodeId: "Na2cipxUy", rendersWithMotion: true, scopeId: "H6DtvFhKg", children: /* @__PURE__ */ _jsx24(WXSGorNXU_default, { aN8C0k_P1: "Food & Nutrition", B14WiGH6x: "Treats & snacks", bsnX_LpQL: "Calming solutions", CziM7_j19: "Grain-free formula with wild-caught salmon and superfoods for feline health.", dkFuHUn48: "Premium salmon recipe", EiqA2h4UN: "Trees & scratching", EZY23vzkO: "Flea & tick control", Ft4iZuDmT: "Weight management", height: "100%", id: "Na2cipxUy", Ji8VYaY6D: "", layoutId: "H6DtvFhKg__Na2cipxUy", LwvstiJ4c: "Health & Wellness", nuQMxNxhz: "Dry food", oh11Y9az8: "var(--token-dacc9230-b126-45d9-8410-cda89f0e6ba0, rgb(201, 217, 193))", oK166sf0T: "Wet food", pHuiIzDYM: "Harnesses & carriers", rsLB54kfP: "Vitamins", TWe4LBo2W: "Dental health", uEzGjuMrs: pKERsxd4H_default, variant: "so6FWD1pD", vlbzFezbn: "Beds", w8Ih6bjZ0: "Accessories", We6WtJ6Kf: "Supplements", width: "100%", WtKgHrz2U: "Grooming", xbjP4NdDm: addImageAlt({ pixelHeight: 668, pixelWidth: 668, src: "https://framerusercontent.com/images/vdl8hvE1YclfMV3XKWv3hSsxGA.png?width=668&height=668", srcSet: "https://framerusercontent.com/images/vdl8hvE1YclfMV3XKWv3hSsxGA.png?scale-down-to=512&width=668&height=668 512w,https://framerusercontent.com/images/vdl8hvE1YclfMV3XKWv3hSsxGA.png?width=668&height=668 668w" }, ""), YCPZsBR4y: "", YlYObYQnt: "Litter & boxes", zae0YDC0z: "Cats", ...addPropertyOverrides8({ mi47f6Hr1: { style: { width: "100%" }, variant: "WopQKFEcj" } }, baseVariant, gestureVariant) }) }) })] }), /* @__PURE__ */ _jsxs12(motion24.div, { className: "framer-nsfebg", "data-framer-name": "Actions", layoutDependency, layoutId: "H6DtvFhKg__uXhbXh8Yu", children: [isDisplayed2() && /* @__PURE__ */ _jsx24(ComponentViewportProvider6, { height: 20, y: (componentViewport?.y || 0) + 0 + 0 + 15.5 + 0 + 6.5, children: /* @__PURE__ */ _jsx24(SmartComponentScopedContainer6, { className: "framer-vudif1-container", layoutDependency, layoutId: "H6DtvFhKg__NJK25pBoe-container", nodeId: "NJK25pBoe", rendersWithMotion: true, scopeId: "H6DtvFhKg", children: /* @__PURE__ */ _jsx24(HidsWRkFi_default, { height: "100%", id: "NJK25pBoe", layoutId: "H6DtvFhKg__NJK25pBoe", width: "100%", zae0YDC0z: "About" }) }) }), isDisplayed2() && /* @__PURE__ */ _jsx24(ComponentViewportProvider6, { height: 33, y: (componentViewport?.y || 0) + 0 + 0 + 15.5 + 0 + 0, children: /* @__PURE__ */ _jsx24(SmartComponentScopedContainer6, { className: "framer-4mywhq-container", layoutDependency, layoutId: "H6DtvFhKg__vZRoetykQ-container", nodeId: "vZRoetykQ", rendersWithMotion: true, scopeId: "H6DtvFhKg", children: /* @__PURE__ */ _jsx24(fE2WzAJjM_default, { height: "100%", id: "vZRoetykQ", layoutId: "H6DtvFhKg__vZRoetykQ", width: "100%" }) }) }), /* @__PURE__ */ _jsx24(motion24.div, { className: "framer-n5jf9a", "data-framer-name": "Account", layoutDependency, layoutId: "H6DtvFhKg__dzHBs33Aj", children: /* @__PURE__ */ _jsx24(Instance2, { animated: true, className: "framer-owtuam", Component: UvPxI2Cnv_default, layoutDependency, layoutId: "H6DtvFhKg__ErgdJvVFL", style: { "--1m6trwb": 0, "--21h8s6": "var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, rgb(0, 0, 0))", "--pgex8v": 1.5, opacity: 1 }, variants: { mi47f6Hr1: { opacity: 0 } }, ...addPropertyOverrides8({ EeqiGoNag: { Component: gU109MUNe_default }, mi47f6Hr1: { Component: gU109MUNe_default } }, baseVariant, gestureVariant) }) }), /* @__PURE__ */ _jsx24(motion24.div, { className: "framer-192bvaf", "data-framer-name": "Cart", layoutDependency, layoutId: "H6DtvFhKg__QDnZSrNWS", children: /* @__PURE__ */ _jsx24(JfaLoQZWi_default, { animated: true, className: "framer-16h10z", layoutDependency, layoutId: "H6DtvFhKg__augUXhEDt", style: { "--1m6trwb": 0, "--21h8s6": "var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, rgb(0, 0, 0))", "--pgex8v": 1.5, opacity: 1 }, variants: { mi47f6Hr1: { opacity: 0 } } }) }), isDisplayed3() && /* @__PURE__ */ _jsx24(motion24.div, { className: "framer-8k8eah", "data-framer-name": "Mobile Menu", "data-highlight": true, layoutDependency, layoutId: "H6DtvFhKg__lLC_CkdY3", onTap: onTap1tog6c6, style: { backgroundColor: "var(--token-5c2e7b2b-ab7a-402a-8766-83648bfd6051, rgb(255, 255, 255))" }, ...addPropertyOverrides8({ EeqiGoNag: { onTap: onTapkmtwkc } }, baseVariant, gestureVariant), children: isDisplayed3() && /* @__PURE__ */ _jsx24(Instance2, { animated: true, className: "framer-177u5hb", Component: itu1soPCZ_default, layoutDependency, layoutId: "H6DtvFhKg__I9zq5ztxr", style: { "--1m6trwb": 0, "--21h8s6": "var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, rgb(0, 0, 0))", "--pgex8v": 1.5 }, ...addPropertyOverrides8({ mi47f6Hr1: { Component: q95pf4lLL_default } }, baseVariant, gestureVariant) }) })] })] }) }), isDisplayed4() && /* @__PURE__ */ _jsxs12(motion24.div, { className: "framer-ysl7lx", "data-framer-name": "Secondary menu", layoutDependency, layoutId: "H6DtvFhKg__XNLSTk404", style: { "--border-bottom-width": "0px", "--border-color": "rgba(0, 0, 0, 0)", "--border-left-width": "0px", "--border-right-width": "0px", "--border-style": "solid", "--border-top-width": "0px" }, variants: { mi47f6Hr1: { "--border-bottom-width": "0px", "--border-color": "var(--token-eb7f8585-083c-4ae9-8d64-907c7927916e, rgb(230, 230, 230))", "--border-left-width": "0px", "--border-right-width": "0px", "--border-style": "solid", "--border-top-width": "1px" } }, ...addPropertyOverrides8({ mi47f6Hr1: { "data-border": true } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsx24(ComponentViewportProvider6, { height: 20, ...addPropertyOverrides8({ mi47f6Hr1: { y: (componentViewport?.y || 0) + 16 + 180 + 32 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx24(SmartComponentScopedContainer6, { className: "framer-1m9xdmk-container", layoutDependency, layoutId: "H6DtvFhKg__MziMtty1M-container", nodeId: "MziMtty1M", rendersWithMotion: true, scopeId: "H6DtvFhKg", children: /* @__PURE__ */ _jsx24(HidsWRkFi_default, { height: "100%", id: "MziMtty1M", layoutId: "H6DtvFhKg__MziMtty1M", width: "100%", zae0YDC0z: "About" }) }) }), /* @__PURE__ */ _jsx24(ComponentViewportProvider6, { height: 20, ...addPropertyOverrides8({ mi47f6Hr1: { y: (componentViewport?.y || 0) + 16 + 180 + 32 + 32 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx24(SmartComponentScopedContainer6, { className: "framer-1os4rbw-container", layoutDependency, layoutId: "H6DtvFhKg__PPK8FAcb2-container", nodeId: "PPK8FAcb2", rendersWithMotion: true, scopeId: "H6DtvFhKg", children: /* @__PURE__ */ _jsx24(HidsWRkFi_default, { height: "100%", id: "PPK8FAcb2", layoutId: "H6DtvFhKg__PPK8FAcb2", width: "100%", zae0YDC0z: "Pricing" }) }) }), /* @__PURE__ */ _jsx24(ComponentViewportProvider6, { height: 20, ...addPropertyOverrides8({ mi47f6Hr1: { y: (componentViewport?.y || 0) + 16 + 180 + 32 + 64 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx24(SmartComponentScopedContainer6, { className: "framer-1ietm93-container", layoutDependency, layoutId: "H6DtvFhKg__fB9yFqUo9-container", nodeId: "fB9yFqUo9", rendersWithMotion: true, scopeId: "H6DtvFhKg", children: /* @__PURE__ */ _jsx24(HidsWRkFi_default, { height: "100%", id: "fB9yFqUo9", layoutId: "H6DtvFhKg__fB9yFqUo9", width: "100%", zae0YDC0z: "Legal" }) }) })] }), isDisplayed4() && /* @__PURE__ */ _jsxs12(motion24.div, { className: "framer-1u8n5jy", "data-framer-name": "Additional links", layoutDependency, layoutId: "H6DtvFhKg__lHc3Q5rCS", style: { "--border-bottom-width": "0px", "--border-color": "rgba(0, 0, 0, 0)", "--border-left-width": "0px", "--border-right-width": "0px", "--border-style": "solid", "--border-top-width": "0px" }, variants: { mi47f6Hr1: { "--border-bottom-width": "0px", "--border-color": "var(--token-eb7f8585-083c-4ae9-8d64-907c7927916e, rgb(230, 230, 230))", "--border-left-width": "0px", "--border-right-width": "0px", "--border-style": "solid", "--border-top-width": "1px" } }, ...addPropertyOverrides8({ mi47f6Hr1: { "data-border": true } }, baseVariant, gestureVariant), children: [/* @__PURE__ */ _jsxs12(motion24.div, { className: "framer-zwi7uj", "data-framer-name": "Sign in", layoutDependency, layoutId: "H6DtvFhKg__uJBqa5Qvj", children: [/* @__PURE__ */ _jsx24(UvPxI2Cnv_default, { animated: true, className: "framer-1yp498r", layoutDependency, layoutId: "H6DtvFhKg__ldnY34oPn", style: { "--1m6trwb": 0, "--21h8s6": "var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, rgb(0, 0, 0))", "--pgex8v": 1.5 } }), /* @__PURE__ */ _jsx24(ComponentViewportProvider6, { height: 20, ...addPropertyOverrides8({ mi47f6Hr1: { y: (componentViewport?.y || 0) + 16 + 328 + 32 + 0 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx24(SmartComponentScopedContainer6, { className: "framer-o4op4z-container", layoutDependency, layoutId: "H6DtvFhKg__sL2FC8cWS-container", nodeId: "sL2FC8cWS", rendersWithMotion: true, scopeId: "H6DtvFhKg", children: /* @__PURE__ */ _jsx24(HidsWRkFi_default, { height: "100%", id: "sL2FC8cWS", layoutId: "H6DtvFhKg__sL2FC8cWS", width: "100%", zae0YDC0z: "Sign in" }) }) })] }), /* @__PURE__ */ _jsxs12(motion24.div, { className: "framer-1p5l94f", "data-framer-name": "Cart", layoutDependency, layoutId: "H6DtvFhKg__aBzPwoM66", children: [/* @__PURE__ */ _jsx24(JfaLoQZWi_default, { animated: true, className: "framer-1wh7ur9", layoutDependency, layoutId: "H6DtvFhKg__qel1VALPl", style: { "--1m6trwb": 0, "--21h8s6": "var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, rgb(0, 0, 0))", "--pgex8v": 1.5 } }), /* @__PURE__ */ _jsx24(ComponentViewportProvider6, { height: 20, ...addPropertyOverrides8({ mi47f6Hr1: { y: (componentViewport?.y || 0) + 16 + 328 + 32 + 32 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx24(SmartComponentScopedContainer6, { className: "framer-9myel5-container", layoutDependency, layoutId: "H6DtvFhKg__Ig72HdUiv-container", nodeId: "Ig72HdUiv", rendersWithMotion: true, scopeId: "H6DtvFhKg", children: /* @__PURE__ */ _jsx24(HidsWRkFi_default, { height: "100%", id: "Ig72HdUiv", layoutId: "H6DtvFhKg__Ig72HdUiv", width: "100%", zae0YDC0z: "Cart" }) }) })] }), /* @__PURE__ */ _jsxs12(motion24.div, { className: "framer-182mlf5", "data-framer-name": "FAQs", layoutDependency, layoutId: "H6DtvFhKg__OohiyYy5b", children: [/* @__PURE__ */ _jsx24(AjQXGkQtG_default, { animated: true, className: "framer-1nwx1op", layoutDependency, layoutId: "H6DtvFhKg__N9LNCIOR8", style: { "--1m6trwb": 0, "--21h8s6": "var(--token-e2c6fac9-1508-4db3-851c-63064359ccc0, rgb(0, 0, 0))", "--pgex8v": 1.5 } }), /* @__PURE__ */ _jsx24(ComponentViewportProvider6, { height: 20, ...addPropertyOverrides8({ mi47f6Hr1: { y: (componentViewport?.y || 0) + 16 + 328 + 32 + 64 + 0 } }, baseVariant, gestureVariant), children: /* @__PURE__ */ _jsx24(SmartComponentScopedContainer6, { className: "framer-egxlnb-container", layoutDependency, layoutId: "H6DtvFhKg__bO7J0kMAT-container", nodeId: "bO7J0kMAT", rendersWithMotion: true, scopeId: "H6DtvFhKg", children: /* @__PURE__ */ _jsx24(HidsWRkFi_default, { height: "100%", id: "bO7J0kMAT", layoutId: "H6DtvFhKg__bO7J0kMAT", width: "100%", zae0YDC0z: "FAQs" }) }) })] })] })] }) }) }) });
});
var css22 = ["@supports (aspect-ratio: 1) { body { --framer-aspect-ratio-supported: auto; } }", ".framer-ODfxm.framer-1ws82xc, .framer-ODfxm .framer-1ws82xc { display: block; }", ".framer-ODfxm.framer-hidwr8 { align-content: center; align-items: center; display: flex; flex-direction: column; flex-wrap: nowrap; gap: 10px; height: auto; justify-content: flex-start; overflow: visible; padding: 16px; position: relative; width: 100%; }", ".framer-ODfxm .framer-1biumxw { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: 64px; justify-content: center; overflow: visible; padding: 14px 48px 14px 48px; position: relative; width: 100%; }", ".framer-ODfxm .framer-1auu0us { align-content: center; align-items: center; display: flex; flex: 1 0 0px; flex-direction: row; flex-wrap: nowrap; height: min-content; justify-content: space-between; max-width: 1400px; overflow: visible; padding: 0px 0px 32px 0px; position: relative; width: 1px; }", ".framer-ODfxm .framer-10sxkvs { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: flex-start; overflow: visible; padding: 0px; position: relative; width: 25%; }", ".framer-ODfxm .framer-12ocsl7 { flex: none; height: 24px; overflow: visible; position: relative; width: auto; }", ".framer-ODfxm .framer-1r5hpno { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 20px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: 286px; }", ".framer-ODfxm .framer-1jqr2up-container, .framer-ODfxm .framer-1cmyvxb-container, .framer-ODfxm .framer-sb9rag-container, .framer-ODfxm .framer-vudif1-container, .framer-ODfxm .framer-4mywhq-container, .framer-ODfxm .framer-1m9xdmk-container, .framer-ODfxm .framer-1os4rbw-container, .framer-ODfxm .framer-1ietm93-container, .framer-ODfxm .framer-o4op4z-container, .framer-ODfxm .framer-9myel5-container, .framer-ODfxm .framer-egxlnb-container { flex: none; height: auto; position: relative; width: auto; }", ".framer-ODfxm .framer-nsfebg { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 20px; height: min-content; justify-content: flex-end; overflow: visible; padding: 0px; position: relative; width: 25%; }", ".framer-ODfxm .framer-n5jf9a, .framer-ODfxm .framer-192bvaf, .framer-ODfxm .framer-zwi7uj, .framer-ODfxm .framer-1p5l94f, .framer-ODfxm .framer-182mlf5 { align-content: center; align-items: center; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; overflow: visible; padding: 0px; position: relative; width: min-content; }", ".framer-ODfxm .framer-owtuam, .framer-ODfxm .framer-16h10z, .framer-ODfxm .framer-1yp498r, .framer-ODfxm .framer-1wh7ur9, .framer-ODfxm .framer-1nwx1op { aspect-ratio: 1 / 1; flex: none; height: var(--framer-aspect-ratio-supported, 20px); position: relative; width: 20px; }", ".framer-ODfxm .framer-8k8eah { align-content: center; align-items: center; cursor: pointer; display: flex; flex: none; flex-direction: row; flex-wrap: nowrap; gap: 10px; height: min-content; justify-content: center; min-height: 25px; min-width: 24px; overflow: visible; padding: 0px; position: relative; width: min-content; }", ".framer-ODfxm .framer-177u5hb { flex: none; height: var(--framer-aspect-ratio-supported, 25px); position: relative; width: 24px; }", ".framer-ODfxm .framer-ysl7lx, .framer-ODfxm .framer-1u8n5jy { align-content: flex-start; align-items: flex-start; display: flex; flex: none; flex-direction: column; flex-wrap: nowrap; gap: 12px; height: min-content; justify-content: flex-start; overflow: visible; padding: 16px; position: relative; width: 100%; }", ".framer-ODfxm.framer-v-d2a12q.framer-hidwr8 { height: min-content; width: 100%; }", ".framer-ODfxm.framer-v-d2a12q .framer-1biumxw { padding: 16px; }", ".framer-ODfxm.framer-v-d2a12q .framer-12ocsl7 { height: 16px; }", ".framer-ODfxm.framer-v-d2a12q .framer-nsfebg { gap: 16px; height: 21px; width: min-content; }", ".framer-ODfxm.framer-v-d2a12q .framer-8k8eah { min-height: unset; min-width: unset; }", ".framer-ODfxm.framer-v-d2a12q .framer-177u5hb, .framer-ODfxm.framer-v-zkpy58 .framer-177u5hb { height: var(--framer-aspect-ratio-supported, 24px); }", ".framer-ODfxm.framer-v-zkpy58.framer-hidwr8 { align-content: flex-start; align-items: flex-start; gap: 0px; height: auto; overflow: hidden; overflow-y: auto; padding: 16px; width: 100%; }", ".framer-ODfxm.framer-v-zkpy58 .framer-1biumxw { align-content: flex-start; align-items: flex-start; height: min-content; justify-content: flex-end; padding: 0px; }", ".framer-ODfxm.framer-v-zkpy58 .framer-1auu0us { align-content: flex-start; align-items: flex-start; flex-direction: column; gap: 40px; justify-content: flex-start; padding: 0px 0px 32px 0px; }", ".framer-ODfxm.framer-v-zkpy58 .framer-1r5hpno { align-content: flex-start; align-items: flex-start; flex-direction: column; gap: 12px; order: 2; width: 100%; }", ".framer-ODfxm.framer-v-zkpy58 .framer-1jqr2up-container, .framer-ODfxm.framer-v-zkpy58 .framer-1cmyvxb-container, .framer-ODfxm.framer-v-zkpy58 .framer-sb9rag-container { width: 100%; }", ".framer-ODfxm.framer-v-zkpy58 .framer-nsfebg { align-content: flex-start; align-items: flex-start; gap: 10px; order: 1; width: 100%; }", ".framer-ODfxm.framer-v-zkpy58 .framer-8k8eah { height: 24px; min-height: unset; min-width: unset; }", ".framer-ODfxm.framer-v-zkpy58 .framer-ysl7lx, .framer-ODfxm.framer-v-zkpy58 .framer-1u8n5jy { padding: 32px 0px 32px 0px; }", ".framer-ODfxm.framer-v-zkpy58 .framer-1m9xdmk-container, .framer-ODfxm.framer-v-zkpy58 .framer-zwi7uj { order: 0; }", ".framer-ODfxm.framer-v-zkpy58 .framer-1os4rbw-container, .framer-ODfxm.framer-v-zkpy58 .framer-1p5l94f { order: 1; }", ".framer-ODfxm.framer-v-zkpy58 .framer-1ietm93-container, .framer-ODfxm.framer-v-zkpy58 .framer-182mlf5 { order: 2; }", '.framer-ODfxm[data-border="true"]::after, .framer-ODfxm [data-border="true"]::after { content: ""; border-width: var(--border-top-width, 0) var(--border-right-width, 0) var(--border-bottom-width, 0) var(--border-left-width, 0); border-color: var(--border-color, none); border-style: var(--border-style, none); width: 100%; height: 100%; position: absolute; box-sizing: border-box; left: 0; top: 0; border-radius: inherit; corner-shape: inherit; pointer-events: none; }'];
var FramerH6DtvFhKg = withCSS19(Component18, css22, "framer-ODfxm");
var H6DtvFhKg_default = FramerH6DtvFhKg;
FramerH6DtvFhKg.displayName = "Mega Menu";
FramerH6DtvFhKg.defaultProps = { height: 64, width: 1400 };
addPropertyControls18(FramerH6DtvFhKg, { variant: { options: ["B3fJHLeg5", "EeqiGoNag", "mi47f6Hr1"], optionTitles: ["Default", "Phone Closed", "Phone Open"], title: "Variant", type: ControlType18.Enum }, sQjDHOrde: { title: "Overlay Open", type: ControlType18.EventHandler }, IhIMzyMCl: { title: "Hover", type: ControlType18.EventHandler }, HA0uEybAq: { title: "Close Overlay", type: ControlType18.EventHandler } });
addFonts9(FramerH6DtvFhKg, [{ explicitInter: true, fonts: [] }, ...CategoryLinkFonts, ...SecondaryLinkFonts, ...SearchBarFonts, ...ShoppingCartSimpleFonts, ...UserFonts, ...QuestionMarkFonts], { supportsExplicitInterCodegen: true });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "FramerH6DtvFhKg", "slots": [], "annotations": { "framerImmutableVariables": "true", "framerIntrinsicHeight": "64", "framerAutoSizeImages": "true", "framerDisplayContentsDiv": "false", "framerColorSyntax": "true", "framerContractVersion": "1", "framerVariables": '{"sQjDHOrde":"overlayOpen","IhIMzyMCl":"hover","HA0uEybAq":"closeOverlay"}', "framerComponentViewportWidth": "true", "framerIntrinsicWidth": "1400", "framerCanvasComponentVariantDetails": '{"propertyName":"variant","data":{"default":{"layout":["fixed","fixed"]},"EeqiGoNag":{"layout":["fixed","auto"]},"mi47f6Hr1":{"layout":["fixed","fixed"]}}}' } }, "Props": { "type": "tsType", "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  H6DtvFhKg_default as default
};
