var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/AoQAFDY644LDNQ7s3szT/3u60lLOoADWXFvcvY5Ek/StickyScrollStory_2.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addPropertyControls, ControlType, useIsStaticRenderer } from "./_framer-runtime.js";
import { useEffect, useRef, useState, startTransition } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
var DEFAULT_TEXTS = ["Struggling with poor conversion or high CAC? You're probably not feeding the algorithm enough quality statics.", "While video ads are great at bringing people into the funnel, statics are fundamental for bottom-of-funnel conversion.", "The data proves it. An analysis of 25 top D2C brands shows that 62% of their top-performing ads are statics.", "And with Meta's new persona-based targeting algorithm, the demand for varied statics is only going to become greater.", "AI can help with the production of statics, but the technology is not yet advanced enough to deliver the complete package."];
function getSafeTexts(texts) {
  if (!Array.isArray(texts) || texts.length === 0)
    return DEFAULT_TEXTS;
  return texts.slice(0, 5);
}
function clampIndex(index, total) {
  return Math.min(Math.max(Math.round(index || 0), 0), Math.max(total - 1, 0));
}
function AnimatedText({ text, index, total, scrollYProgress, textColor, font, isMobile, mobileFontSize }) {
  const segment = 1 / total;
  const startProgress = index * segment;
  const midProgress = Math.min(startProgress + segment * 0.3, 1);
  const endProgress = Math.min(startProgress + segment * 0.7, 1);
  const opacity = useTransform(scrollYProgress, [startProgress, midProgress, endProgress], [0, 1, 0]);
  const y = useTransform(scrollYProgress, [startProgress, midProgress, endProgress], [30, 0, -30]);
  return /* @__PURE__ */ _jsx(motion.div, { style: { position: "absolute", top: 0, left: 0, right: 0, color: textColor, textAlign: "center", ...font, ...isMobile && { fontSize: mobileFontSize }, opacity, y }, children: text });
}
function StaticStickyScrollStory(props) {
  const { activeIndex = 0, textColor = "#000000", backgroundColor = "#FFFFFF", activeDotColor = "#707070", inactiveDotColor = "#D9D9D9", font = {}, style } = props;
  const texts = getSafeTexts(props.texts);
  const previewIndex = clampIndex(activeIndex, texts.length);
  return /* @__PURE__ */ _jsxs("div", { style: { ...style, width: "100%", height: "100%", minHeight: 400, position: "relative", overflow: "hidden", backgroundColor, display: "flex", alignItems: "center", justifyContent: "center" }, children: [/* @__PURE__ */ _jsx("div", { style: { position: "absolute", left: "clamp(24px, 5vw, 80px)", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }, children: texts.map((_, index) => /* @__PURE__ */ _jsx("div", { style: { width: 13, height: 13, borderRadius: 999, backgroundColor: index === previewIndex ? activeDotColor : inactiveDotColor } }, index)) }), /* @__PURE__ */ _jsx("div", { style: { width: "calc(100% - 200px)", maxWidth: 760, padding: "0 24px", boxSizing: "border-box", color: textColor, textAlign: "center", ...font }, children: texts[previewIndex] })] });
}
function InteractiveStickyScrollStory(props) {
  const { textColor = "#000000", backgroundColor = "#FFFFFF", activeDotColor = "#707070", inactiveDotColor = "#D9D9D9", font = {}, mobileFontSize = "24px", style } = props;
  const texts = getSafeTexts(props.texts);
  const sectionRef = useRef(null);
  const [currentActiveIndex, setCurrentActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof __dai_window === "undefined")
      return;
    const checkMobile = () => {
      startTransition(() => {
        setIsMobile(__dai_window.innerWidth < 1024);
      });
    };
    checkMobile();
    __dai_window.addEventListener("resize", checkMobile);
    return () => {
      __dai_window.removeEventListener("resize", checkMobile);
    };
  }, []);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      const newIndex = Math.min(Math.floor(latest * texts.length), texts.length - 1);
      startTransition(() => {
        setCurrentActiveIndex(Math.max(newIndex, 0));
      });
    });
  }, [scrollYProgress, texts.length]);
  const dotsOpacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  return /* @__PURE__ */ _jsx("div", { ref: sectionRef, style: { ...style, height: "800vh", backgroundColor, position: "relative", overflow: "clip" }, children: /* @__PURE__ */ _jsxs("div", { style: { position: "sticky", top: 0, width: "100%", height: "100vh", backgroundColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: isMobile ? "flex-start" : "center", zIndex: 1, overflow: "clip", paddingTop: isMobile ? "38vh" : 0, boxSizing: "border-box" }, children: [!isMobile && /* @__PURE__ */ _jsx(motion.div, { style: { position: "absolute", left: 80, top: "50%", transform: "translateY(calc(-50% - 27px))", display: "flex", flexDirection: "column", gap: 10, alignItems: "center", opacity: dotsOpacity }, children: texts.map((_, index) => /* @__PURE__ */ _jsx("div", { style: { width: 13, height: 13, borderRadius: 999, backgroundColor: index === currentActiveIndex ? activeDotColor : inactiveDotColor, transition: "background-color 0.3s ease" } }, index)) }), /* @__PURE__ */ _jsx("div", { style: { maxWidth: isMobile ? "100%" : 760, width: isMobile ? "100%" : 760, display: "flex", flexDirection: "column", alignItems: "center", ...isMobile && { padding: "0 24px", boxSizing: "border-box" } }, children: /* @__PURE__ */ _jsx("div", { style: { color: textColor, textAlign: "center", ...font, ...isMobile && { fontSize: mobileFontSize }, position: "relative", width: "100%", minHeight: 200 }, children: texts.map((text, index) => /* @__PURE__ */ _jsx(AnimatedText, { text, index, total: texts.length, scrollYProgress, textColor, font, isMobile, mobileFontSize }, `${index}-${text}`)) }) }), isMobile && /* @__PURE__ */ _jsx(motion.div, { style: { position: "absolute", bottom: 60, left: 0, right: 0, margin: "auto", display: "flex", flexDirection: "column", gap: 5, alignItems: "center", opacity: dotsOpacity }, children: texts.map((_, index) => /* @__PURE__ */ _jsx("div", { style: { width: 18, height: index === currentActiveIndex ? 2 : 1.5, borderRadius: 1, backgroundColor: index === currentActiveIndex ? activeDotColor : inactiveDotColor, transition: "background-color 0.3s ease, height 0.3s ease" } }, index)) })] }) });
}
function StickyScrollStory(props) {
  const isStaticRenderer = useIsStaticRenderer();
  if (isStaticRenderer) {
    return /* @__PURE__ */ _jsx(StaticStickyScrollStory, { ...props });
  }
  return /* @__PURE__ */ _jsx(InteractiveStickyScrollStory, { ...props });
}
addPropertyControls(StickyScrollStory, { texts: { type: ControlType.Array, title: "Texts", control: { type: ControlType.String, displayTextArea: true }, defaultValue: DEFAULT_TEXTS, maxCount: 5 }, activeIndex: { type: ControlType.Number, title: "Canvas Preview", defaultValue: 0, min: 0, max: 4, step: 1, displayStepper: true }, font: { type: ControlType.Font, title: "Font", controls: "extended", defaultFontType: "sans-serif", defaultValue: { fontSize: "38px", variant: "Regular", letterSpacing: "-0.04em", lineHeight: "1.2em" } }, textColor: { type: ControlType.Color, title: "Text Color", defaultValue: "#000000" }, backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#FFFFFF" }, activeDotColor: { type: ControlType.Color, title: "Active Dot", defaultValue: "#707070" }, inactiveDotColor: { type: ControlType.Color, title: "Inactive Dots", defaultValue: "#D9D9D9" }, mobileFontSize: { type: ControlType.String, title: "Mobile Font Size", defaultValue: "24px" } });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "StickyScrollStory", "slots": [], "annotations": { "framerContractVersion": "1", "framerSupportedLayoutWidth": "fixed", "framerSupportedLayoutHeight": "fixed" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  StickyScrollStory as default
};
