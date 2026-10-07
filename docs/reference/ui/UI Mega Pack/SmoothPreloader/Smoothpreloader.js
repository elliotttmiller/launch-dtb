var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/IIsbyH3Y8j5o7lDrjf87/Tpx4G8Zbv17X5Rpqq9DA/SmoothPreloader.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, startTransition } from "react";
import { addPropertyControls, ControlType, useIsStaticRenderer } from "./_framer-runtime.js";
import { motion, AnimatePresence } from "framer-motion";
function SmoothPreloader(props) {
  const { logo = { src: "https://framerusercontent.com/images/GfGkADagM4KEibNcIiRUWlfrR0.jpg", alt: "Logo" }, logoSize, backgroundColor, counterColor, counterFont, duration, exitEffect, onComplete, style } = props;
  const [counter, setCounter] = useState(10);
  const [isVisible, setIsVisible] = useState(true);
  const isStatic = useIsStaticRenderer();
  const getExitAnimation = () => {
    switch (exitEffect) {
      case "fade":
        return { opacity: 0 };
      case "slideUp":
        return { y: "-100%" };
      case "slideDown":
        return { y: "100%" };
      default:
        return { opacity: 0 };
    }
  };
  useEffect(() => {
    if (isStatic)
      return;
    const increment = 90 / (duration * 1e3 / 50);
    const interval = setInterval(() => {
      startTransition(() => {
        setCounter((prev) => {
          const next = prev + increment;
          if (next >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              startTransition(() => {
                setIsVisible(false);
                onComplete?.();
              });
            }, 200);
            return 100;
          }
          return next;
        });
      });
    }, 50);
    return () => clearInterval(interval);
  }, [duration, onComplete, isStatic]);
  if (isStatic) {
    return /* @__PURE__ */ _jsxs("div", { style: { ...style, width: "100%", height: "100%", backgroundColor, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }, children: [/* @__PURE__ */ _jsx("img", { src: logo.src, alt: logo.alt, style: { maxWidth: `${logoSize}px`, maxHeight: `${logoSize}px`, objectFit: "contain" } }), /* @__PURE__ */ _jsx("div", { style: { position: "absolute", bottom: "40px", right: "40px", color: counterColor, ...counterFont }, children: "55%" })] });
  }
  return /* @__PURE__ */ _jsx("div", { style: { ...style, width: "100%", height: "100%", position: "relative" }, children: /* @__PURE__ */ _jsx(AnimatePresence, { children: isVisible && /* @__PURE__ */ _jsxs(motion.div, { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { ...getExitAnimation(), transition: { duration: 0.8, ease: [0.6, 0.01, 0.05, 0.95] } }, style: { position: "fixed", inset: 0, backgroundColor, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", zIndex: 9999 }, children: [/* @__PURE__ */ _jsx(motion.img, { src: logo.src, alt: logo.alt, initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.3, duration: 0.6 }, style: { maxWidth: `${logoSize}px`, maxHeight: `${logoSize}px`, objectFit: "contain" } }), /* @__PURE__ */ _jsxs(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.5, duration: 0.4 }, style: { position: "absolute", bottom: "40px", right: "40px", color: counterColor, ...counterFont }, children: [Math.round(counter), "%"] })] }) }) });
}
addPropertyControls(SmoothPreloader, { logo: { type: ControlType.ResponsiveImage, title: "Logo" }, logoSize: { type: ControlType.Number, title: "Logo Size", defaultValue: 200, min: 50, max: 500 }, backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" }, counterColor: { type: ControlType.Color, title: "Counter Color", defaultValue: "#000000" }, counterFont: { type: ControlType.Font, title: "Counter Font", controls: "extended", defaultValue: { fontSize: "80px", lineHeight: "1em", letterSpacing: "-0.02em" } }, duration: { type: ControlType.Number, title: "Duration", defaultValue: 3, min: 1, max: 10 }, exitEffect: { type: ControlType.Enum, title: "Exit Effect", options: ["fade", "slideUp", "slideDown"], optionTitles: ["Fade", "Slide Up", "Slide Down"], defaultValue: "fade" }, onComplete: { type: ControlType.EventHandler } });
var SmoothPreloader_default = SmoothPreloader;
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "SmoothPreloader", "slots": [], "annotations": { "framerContractVersion": "1", "framerSupportedLayoutWidth": "any-prefer-fixed", "framerIntrinsicHeight": "900", "framerIntrinsicWidth": "1440", "framerSupportedLayoutHeight": "any-prefer-fixed" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  SmoothPreloader_default as default
};
