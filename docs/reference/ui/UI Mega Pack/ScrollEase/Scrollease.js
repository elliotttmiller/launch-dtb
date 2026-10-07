var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/QLp9LRxMUqxTvwtzVNvV/iQST5pD9bigV35DdY0He/ScrollEase.js
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
import { addPropertyControls, ControlType, useIsStaticRenderer } from "./_framer-runtime.js";
var manager = { instances: /* @__PURE__ */ new Map(), nextId: 1, targetY: 0, currentY: 0, running: false, rafId: 0 };
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function getEffectiveIntensity() {
  if (manager.instances.size === 0)
    return 70;
  let max = 0;
  manager.instances.forEach((value) => {
    if (value > max)
      max = value;
  });
  return clamp(max, 0, 100);
}
function isEditableElement(target) {
  if (!(target instanceof Element))
    return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]'));
}
function isScrollableStyle(overflowY) {
  return overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
}
function canNestedScrollableConsumeDelta(target, deltaY) {
  if (!(target instanceof Element) || typeof __dai_window === "undefined")
    return false;
  let node = target;
  while (node && node !== document.body && node !== document.documentElement) {
    if (node instanceof HTMLElement) {
      const style = __dai_window.getComputedStyle(node);
      const overflowY = style.overflowY;
      if (isScrollableStyle(overflowY) && node.scrollHeight > node.clientHeight) {
        if (deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight)
          return true;
        if (deltaY < 0 && node.scrollTop > 0)
          return true;
      }
    }
    node = node.parentElement;
  }
  return false;
}
function getPageMaxScroll() {
  if (typeof __dai_window === "undefined" || typeof document === "undefined")
    return 0;
  const doc = document.documentElement;
  const body = document.body;
  const scrollHeight = Math.max(doc?.scrollHeight ?? 0, body?.scrollHeight ?? 0, doc?.offsetHeight ?? 0, body?.offsetHeight ?? 0);
  return Math.max(0, scrollHeight - __dai_window.innerHeight);
}
function stopAnimation() {
  if (typeof __dai_window === "undefined")
    return;
  if (manager.rafId)
    __dai_window.cancelAnimationFrame(manager.rafId);
  manager.running = false;
  manager.rafId = 0;
}
function startAnimation() {
  if (typeof __dai_window === "undefined")
    return;
  if (manager.running)
    return;
  manager.running = true;
  const animate = () => {
    const intensity = getEffectiveIntensity();
    const ease = 0.16 - intensity / 100 * 0.14;
    manager.currentY += (manager.targetY - manager.currentY) * ease;
    if (Math.abs(manager.targetY - manager.currentY) < 0.5) {
      manager.currentY = manager.targetY;
      __dai_window.scrollTo(0, manager.currentY);
      stopAnimation();
      return;
    }
    __dai_window.scrollTo(0, manager.currentY);
    manager.rafId = __dai_window.requestAnimationFrame(animate);
  };
  manager.rafId = __dai_window.requestAnimationFrame(animate);
}
function attachGlobalBehavior() {
  if (typeof __dai_window === "undefined" || typeof document === "undefined")
    return;
  if (manager.wheelListener)
    return;
  manager.targetY = __dai_window.scrollY || __dai_window.pageYOffset || 0;
  manager.currentY = manager.targetY;
  manager.wheelListener = (event) => {
    if (event.defaultPrevented)
      return;
    if (event.ctrlKey || event.metaKey)
      return;
    if (isEditableElement(event.target))
      return;
    if (canNestedScrollableConsumeDelta(event.target, event.deltaY))
      return;
    const reducedMotion = __dai_window.matchMedia ? __dai_window.matchMedia("(prefers-reduced-motion: reduce)").matches : false;
    if (reducedMotion)
      return;
    const max = getPageMaxScroll();
    if (max <= 0)
      return;
    if (!manager.running) {
      const y = __dai_window.scrollY || __dai_window.pageYOffset || 0;
      manager.currentY = y;
      manager.targetY = y;
    }
    const intensity = getEffectiveIntensity();
    const wheelMult = 1 - intensity / 100 * 0.4;
    const next = clamp(manager.targetY + event.deltaY * wheelMult, 0, getPageMaxScroll());
    if (next === manager.targetY)
      return;
    event.preventDefault();
    manager.targetY = next;
    startAnimation();
  };
  manager.visibilityListener = () => {
    if (typeof document === "undefined")
      return;
    if (document.visibilityState !== "visible")
      stopAnimation();
  };
  __dai_window.addEventListener("wheel", manager.wheelListener, { passive: false });
  document.addEventListener("visibilitychange", manager.visibilityListener);
}
function detachGlobalBehavior() {
  if (typeof __dai_window === "undefined" || typeof document === "undefined")
    return;
  stopAnimation();
  if (manager.wheelListener) {
    __dai_window.removeEventListener("wheel", manager.wheelListener);
    manager.wheelListener = void 0;
  }
  if (manager.visibilityListener) {
    document.removeEventListener("visibilitychange", manager.visibilityListener);
    manager.visibilityListener = void 0;
  }
}
function ScrollEase(props) {
  const { intensity = 70 } = props;
  const isStatic = useIsStaticRenderer();
  useEffect(() => {
    const clampedIntensity = clamp(intensity, 0, 100);
    if (isStatic || typeof __dai_window === "undefined")
      return;
    const id = manager.nextId++;
    manager.instances.set(id, clampedIntensity);
    attachGlobalBehavior();
    return () => {
      manager.instances.delete(id);
      if (manager.instances.size === 0)
        detachGlobalBehavior();
    };
  }, [intensity, isStatic]);
  if (!isStatic)
    return null;
  return /* @__PURE__ */ _jsx("div", { style: { position: "relative", backgroundColor: "transparent", border: "none", borderRadius: 0, color: "transparent", fontSize: 0, lineHeight: 0, ...props.style, width: 100, height: 100 } });
}
addPropertyControls(ScrollEase, { intensity: { type: ControlType.Number, title: "Intensity", defaultValue: 70, min: 0, max: 100, step: 1, unit: "%" } });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "ScrollEase", "slots": [], "annotations": { "framerContractVersion": "1", "framerSupportedLayoutHeight": "fixed", "framerSupportedLayoutWidth": "fixed", "framerIntrinsicWidth": "100", "framerIntrinsicHeight": "100" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  ScrollEase as default
};
