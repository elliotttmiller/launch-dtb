var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/GuVqBjnwSPBoSsmhqmyf/w3sxNjO9FeiTIZ6c6Mhm/GoogleMapEmbed.js
import { jsx as _jsx } from "react/jsx-runtime";
import { addPropertyControls, ControlType } from "./_framer-runtime.js";
var MAP_TYPE_CODES = { roadmap: "m", satellite: "k" };
function GoogleMapEmbed(props) {
  const { address, zoom, mapType, grayscale, borderRadius } = props;
  const encodedAddress = encodeURIComponent(address || "Eiffel Tower, Paris");
  const typeCode = MAP_TYPE_CODES[mapType] || "m";
  const src = `https://maps.google.com/maps?q=${encodedAddress}&z=${zoom}&t=${typeCode}&output=embed`;
  return /* @__PURE__ */ _jsx("div", { style: { width: "100%", height: "100%", overflow: "hidden", borderRadius, filter: grayscale ? "grayscale(1)" : "none" }, children: /* @__PURE__ */ _jsx("iframe", { title: "Google Map", src, width: "100%", height: "100%", style: { border: 0 }, loading: "lazy", referrerPolicy: "no-referrer-when-downgrade", allowFullScreen: true }) });
}
GoogleMapEmbed.defaultProps = { address: "Eiffel Tower, Paris", zoom: 14, mapType: "roadmap", grayscale: false, borderRadius: 0 };
addPropertyControls(GoogleMapEmbed, { address: { type: ControlType.String, title: "Address", defaultValue: "Los Angeles", placeholder: "Enter address or place name" }, zoom: { type: ControlType.Number, title: "Zoom", defaultValue: 14, min: 1, max: 21, step: 1 }, mapType: { type: ControlType.Enum, title: "Map Type", options: ["roadmap", "satellite"], optionTitles: ["Roadmap", "Satellite"], defaultValue: "roadmap" }, grayscale: { type: ControlType.Boolean, title: "Grayscale", defaultValue: false }, borderRadius: { type: ControlType.Number, title: "Radius", defaultValue: 0, min: 0, max: 100 } });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "GoogleMapEmbed", "slots": [], "annotations": { "framerContractVersion": "1" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  GoogleMapEmbed as default
};
