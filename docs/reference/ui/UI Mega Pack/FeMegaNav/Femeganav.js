var __dai_window=typeof window!=="undefined"?window:undefined;var __dai_navigator=typeof __dai_window!=="undefined"?navigator:undefined;

// http-url:https://framerusercontent.com/modules/eLy3hia946kR6hmAxhPe/DHS9c1beKlL8xBaYHELv/FeMegaNav.js
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { addPropertyControls, ControlType, useIsStaticRenderer } from "./_framer-runtime.js";
import { useState, useEffect, useRef } from "react";
var fontStack = '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
var serifStack = '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
var scriptStack = '"Pacifico", "Brush Script MT", cursive';
var FALLBACK_LEFT = "https://framerusercontent.com/images/gje1HRNzD6GsDfnJDSWWMuDXHU.png";
var FALLBACK_RIGHT = "https://framerusercontent.com/images/HszyAuRS8fcqSx0fN0GpFygB2AM.png";
var FALLBACK_FEATURE_MEN = "https://framerusercontent.com/images/pQal0mnKLaMWwuXsnIIXfGSOg.png";
var FALLBACK_FEATURE_WOMEN = "https://framerusercontent.com/images/rYVGXzS5EVgK0Npbhb55Y1418.png";
var MEN_MENU = { menuItems: [{ label: "Polo Shirts" }, { label: "Hoodies & Sweatshirts" }, { label: "Jackets & Coats" }, { label: "Ethnic Wear" }], shopAllLabel: "Shop all Mens", feature: { image: FALLBACK_FEATURE_MEN, title: "The Sport Coat", subtitle: "Our new merino midlayer designed for powder days and apr\xE8s", buttonLabel: "Explore" } };
var WOMEN_MENU = { menuItems: [{ label: "Tops & T-Shirts" }, { label: "Trousers" }, { label: "Sweaters & Knitwear" }, { label: "Skirts & Shorts" }], shopAllLabel: "Shop all Womens", feature: { image: FALLBACK_FEATURE_WOMEN, title: "The Dinner Sweater", subtitle: "Cozy alpaca wool for late nights off the mountain", buttonLabel: "Explore" } };
var FALLBACK_FEATURE_ACCESSORIES = "https://framerusercontent.com/images/lTz3B0LCx0SeuN61gS4JBw9hI.png";
var FALLBACK_FEATURE_BRANDS = "https://framerusercontent.com/images/GxjxUSoPKUuTy0ziUBVOdvQYaM.png";
var ACCESSORIES_MENU = { menuItems: [{ label: "Bag" }, { label: "Ski Poles" }, { label: "MagStrap" }, { label: "Extras" }], shopAllLabel: "Shop all ", feature: { image: FALLBACK_FEATURE_ACCESSORIES, title: "The Day Bag", subtitle: "30L of clever storage for epic days out", buttonLabel: "Explore" } };
var BRANDS_MENU = { menuItems: [{ label: "Velora" }, { label: "Urban Aura" }, { label: "Luxora" }, { label: "Elaris" }], shopAllLabel: "Shop all Brands", feature: { image: FALLBACK_FEATURE_BRANDS, title: "The Field Watch", subtitle: "Built for the trail and the bar", buttonLabel: "Explore" } };
function resolveMenu(provided, builtin) {
  const hasItems = provided?.menuItems && provided.menuItems.length > 0;
  return { menuItems: hasItems ? provided.menuItems : builtin.menuItems, shopAllLabel: provided?.shopAllLabel || builtin.shopAllLabel, feature: provided?.feature && provided.feature.title ? provided.feature : builtin.feature };
}
function Panel({ panel, fallbackImage, textColor, buttonColor, buttonTextColor, titleSize, stacked, panelWidth, panelHeight, btnWidth, btnHeight, btnRadius }) {
  const imageUrl = panel?.image || fallbackImage;
  return /* @__PURE__ */ _jsxs("div", { style: {
    position: "relative",
    // When a width is set (> 0) the panel uses that fixed width and
    // stops flex-growing; otherwise it splits the row evenly (flex: 1).
    flex: panelWidth > 0 ? "0 0 auto" : 1,
    width: panelWidth > 0 ? panelWidth : void 0,
    minWidth: 0,
    // Explicit height when set (> 0), else keep the original behavior.
    height: panelHeight > 0 ? panelHeight : void 0,
    minHeight: panelHeight > 0 ? panelHeight : stacked ? 300 : 0,
    overflow: "hidden",
    backgroundImage: `url("${imageUrl}")`,
    backgroundColor: "#1A1A1A",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 56,
    gap: 18
  }, children: [/* @__PURE__ */ _jsx("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 45%)", pointerEvents: "none" } }), /* @__PURE__ */ _jsx("h2", { style: { position: "relative", margin: 0, color: textColor, fontFamily: fontStack, fontSize: titleSize, fontWeight: 700, lineHeight: 1, letterSpacing: "-0.01em", textAlign: "center" }, children: panel.title }), /* @__PURE__ */ _jsx("button", { style: {
    position: "relative",
    border: "none",
    cursor: "pointer",
    backgroundColor: buttonColor,
    color: buttonTextColor,
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: "0",
    // Fixed size when set (> 0), else auto from padding.
    width: btnWidth > 0 ? btnWidth : void 0,
    height: btnHeight > 0 ? btnHeight : void 0,
    padding: btnWidth > 0 ? 0 : "10px 22px",
    borderRadius: btnRadius,
    boxSizing: "border-box"
  }, children: panel.buttonLabel })] });
}
function MegaMenu({ items, shopAllLabel, feature, fallbackFeature, stack, tablet, menuHeight, featureWidth, featureHeight, featureRadius, menuFontSize, featureTitleSize, menuItemGap }) {
  const featureImage = feature?.image || fallbackFeature;
  const [hovered, setHovered] = useState(null);
  const isStatic = useIsStaticRenderer();
  const activeImage = hovered !== null && items?.[hovered]?.image ? items[hovered].image : featureImage;
  const fadeMs = 500;
  const [baseImage, setBaseImage] = useState(activeImage);
  const [reveal, setReveal] = useState(false);
  useEffect(() => {
    if (activeImage === baseImage)
      return;
    if (isStatic) {
      setBaseImage(activeImage);
      setReveal(false);
      return;
    }
    setReveal(true);
    const t = setTimeout(() => {
      setBaseImage(activeImage);
      setReveal(false);
    }, fadeMs);
    return () => clearTimeout(t);
  }, [activeImage, baseImage, isStatic]);
  return /* @__PURE__ */ _jsxs("div", { style: {
    display: "flex",
    flexDirection: stack ? "column" : "row",
    gap: stack ? 24 : tablet ? 28 : 40,
    // Vertical padding tuned so the locked 500px image fits exactly
    // inside the 559px content (30 + 500 + 29 = 559). Tablet uses
    // a slightly tighter pad and lets the height be auto.
    // Desktop: right gap (30) matches the bottom gap (29) so the
    // image is inset evenly from the panel's right/bottom edges.
    padding: stack ? "24px 20px 28px" : tablet ? "26px 28px 28px" : "30px 30px 29px 48px",
    backgroundColor: "#FFFFFF",
    fontFamily: serifStack,
    // Dropdown content locked to 559px so the whole white panel is
    // ~623px tall (64px nav + 559px content). Hardcoded so it
    // ignores the per-instance "Menu Height" slider in Framer.
    // Tablet (side-by-side but smaller image) sizes to content.
    height: stack || tablet ? void 0 : 559,
    boxSizing: "border-box"
  }, children: [/* @__PURE__ */ _jsxs("div", { style: { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }, children: [/* @__PURE__ */ _jsx("div", { style: { display: "flex", flexDirection: "column", gap: menuItemGap }, children: (items || []).map((item, i) => /* @__PURE__ */ _jsxs("span", { onMouseEnter: () => setHovered(i), onMouseLeave: () => setHovered(null), style: {
    position: "relative",
    // Shrink to the text width so the underline
    // only spans the label (not the whole column).
    alignSelf: "flex-start",
    fontFamily: '"Mozilla Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    // Locked to 34px (≈106×41 box for "Velora") so
    // it ignores the per-instance "Menu Font Size"
    // slider stored in Framer.
    fontSize: 34,
    fontWeight: 600,
    lineHeight: 1,
    color: "#000000",
    cursor: "pointer"
  }, children: [item.label, /* @__PURE__ */ _jsx("span", { style: { position: "absolute", left: 0, bottom: -3, width: "100%", height: 2, backgroundColor: "#000000", transform: hovered === i ? "scaleX(1)" : "scaleX(0)", transformOrigin: hovered === i ? "left" : "right", transition: isStatic ? "none" : hovered === i ? "transform 0.45s ease" : "transform 0.25s ease", pointerEvents: "none" } })] }, i)) }), /* @__PURE__ */ _jsx("span", { style: {
    marginTop: 32,
    fontFamily: '"Satoshi", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    // ≈90×32 box for "Shop All".
    fontSize: 24,
    fontWeight: 600,
    color: "#111111",
    cursor: "pointer"
  }, children: shopAllLabel })] }), /* @__PURE__ */ _jsxs("div", { style: {
    // Desktop: fixed 890 × 500 (won't grow/shrink). Tablet:
    // 55% of the row so it scales with the frame and never
    // overflows. Mobile: full width, stacked above/below.
    flex: tablet ? "0 0 55%" : "none",
    // Dropdown image locked to 890 × 500 (radius 24) on
    // desktop; full-width on mobile. Hardcoded so it ignores
    // the per-instance slider values stored in Framer.
    width: stack ? "100%" : tablet ? "auto" : 890,
    minWidth: 0,
    position: "relative",
    minHeight: stack ? 200 : 0,
    height: stack ? void 0 : tablet ? 360 : 500,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "flex-start",
    padding: 28,
    gap: 12
  }, children: [/* @__PURE__ */ _jsx("div", { style: { position: "absolute", inset: 0, backgroundImage: `url("${baseImage}")`, backgroundSize: "cover", backgroundPosition: "center", pointerEvents: "none" } }), /* @__PURE__ */ _jsx("div", { style: { position: "absolute", inset: 0, backgroundImage: `url("${activeImage}")`, backgroundSize: "cover", backgroundPosition: "center", opacity: reveal ? 1 : 0, transition: isStatic ? "none" : `opacity ${fadeMs}ms ease`, pointerEvents: "none" } }, baseImage), /* @__PURE__ */ _jsx("div", { style: { position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 50%)", pointerEvents: "none" } }), /* @__PURE__ */ _jsx("h3", { style: {
    position: "relative",
    margin: 0,
    color: "#FFFFFF",
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    // Locked to 36px (≈350×41 box for "Curated Accessories")
    // so it ignores the per-instance slider in Framer.
    fontSize: 36,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: "0"
  }, children: feature?.title }), feature?.subtitle ? /* @__PURE__ */ _jsx("p", { style: {
    position: "relative",
    margin: 0,
    color: "#FFFFFF",
    fontFamily: '"Satoshi", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: tablet ? 15 : 18,
    fontWeight: 500,
    // Desktop keeps it on one line (wide image). Tablet's
    // image is narrower, so the subtitle wraps instead of
    // being clipped at the edge.
    lineHeight: tablet ? 1.35 : 1,
    letterSpacing: "0",
    opacity: 0.9,
    whiteSpace: tablet ? "normal" : "nowrap"
  }, children: feature.subtitle }) : null, /* @__PURE__ */ _jsx("button", { style: {
    position: "relative",
    marginTop: 6,
    border: "none",
    cursor: "pointer",
    backgroundColor: "#FFFFFF",
    color: "#111111",
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: "0",
    // Fixed size to match Figma (129 × 45, radius 6).
    width: 129,
    height: 45,
    padding: 0,
    borderRadius: 6,
    boxSizing: "border-box"
  }, children: feature?.buttonLabel })] })] });
}
function FeMegaNav(props) {
  const { navLinks, logoText, logoImage, bagLabel, accessoriesMenu, menMenu, womenMenu, brandsMenu, leftPanel, rightPanel, leftPanelWidth = 0, leftPanelHeight = 0, rightPanelWidth = 0, rightPanelHeight = 0, backgroundColor, textColor, buttonColor, buttonTextColor, titleSize = 34, headerHeight = 64, headerRadius = 24, headerInset = 24, menuHeight = 534, featureWidth = 890, featureHeight = 500, featureRadius = 24, menuFontSize = 34, featureTitleSize = 34, menuItemGap = 30, logoWidth = 126, logoHeight = 84, heroBtnWidth = 129, heroBtnHeight = 45, heroBtnRadius = 6, navFontSize = 16, style } = props;
  const MENU_BUILTINS = { accessories: ACCESSORIES_MENU, equipment: ACCESSORIES_MENU, men: MEN_MENU, women: WOMEN_MENU, brands: BRANDS_MENU, stuff: BRANDS_MENU };
  const MENU_OVERRIDES = { accessories: accessoriesMenu, equipment: accessoriesMenu, men: menMenu, women: womenMenu, brands: brandsMenu, stuff: brandsMenu };
  const MENU_FALLBACK_IMAGES = { accessories: FALLBACK_FEATURE_ACCESSORIES, equipment: FALLBACK_FEATURE_ACCESSORIES, men: FALLBACK_FEATURE_MEN, women: FALLBACK_FEATURE_WOMEN, brands: FALLBACK_FEATURE_BRANDS, stuff: FALLBACK_FEATURE_BRANDS };
  const [openKey, setOpenKey] = useState(null);
  const [displayKey, setDisplayKey] = useState(null);
  const [headerHovered, setHeaderHovered] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expandedKey, setExpandedKey] = useState(null);
  const carouselRef = useRef(null);
  const carDrag = useRef({ down: false, startX: 0, startScroll: 0 });
  const onCarPointerDown = (e) => {
    if (e.pointerType !== "mouse")
      return;
    const el = carouselRef.current;
    if (!el)
      return;
    carDrag.current = { down: true, startX: e.clientX, startScroll: el.scrollLeft };
  };
  const onCarPointerMove = (e) => {
    if (e.pointerType !== "mouse" || !carDrag.current.down)
      return;
    const el = carouselRef.current;
    if (!el)
      return;
    el.scrollLeft = carDrag.current.startScroll - (e.clientX - carDrag.current.startX);
  };
  const onCarPointerEnd = (e) => {
    if (e.pointerType !== "mouse")
      return;
    carDrag.current.down = false;
  };
  const onCarWheel = (e) => {
    const el = carouselRef.current;
    if (!el)
      return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX))
      el.scrollLeft += e.deltaY;
  };
  const handleOpen = (key) => {
    setOpenKey(key);
    if (key)
      setDisplayKey(key);
  };
  const isStatic = useIsStaticRenderer();
  const closeTimer = useRef(null);
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => {
      setHeaderHovered(false);
      setOpenKey(null);
    }, 180);
  };
  const isOpen = openKey !== null;
  const activeMenu = displayKey ? resolveMenu(MENU_OVERRIDES[displayKey], MENU_BUILTINS[displayKey]) : null;
  const activeFallbackFeature = displayKey && MENU_FALLBACK_IMAGES[displayKey] || FALLBACK_FEATURE_MEN;
  const crossfadeMs = 1e3;
  const crossfadeDelayMs = 100;
  const [prevKey, setPrevKey] = useState(null);
  const lastKeyRef = useRef(displayKey);
  useEffect(() => {
    if (displayKey === lastKeyRef.current)
      return;
    const old = lastKeyRef.current;
    lastKeyRef.current = displayKey;
    if (old && displayKey && old !== displayKey && !isStatic) {
      setPrevKey(old);
      const t = setTimeout(() => setPrevKey(null), crossfadeMs + crossfadeDelayMs);
      return () => clearTimeout(t);
    }
    setPrevKey(null);
  }, [displayKey, isStatic]);
  const prevMenu = prevKey ? resolveMenu(MENU_OVERRIDES[prevKey], MENU_BUILTINS[prevKey]) : null;
  const prevFallbackFeature = prevKey && MENU_FALLBACK_IMAGES[prevKey] || FALLBACK_FEATURE_MEN;
  const rootRef = useRef(null);
  const [vw, setVw] = useState(1200);
  useEffect(() => {
    const el = rootRef.current;
    if (!el)
      return;
    const update = () => {
      const winW = typeof __dai_window !== "undefined" && __dai_window.innerWidth ? __dai_window.innerWidth : el.offsetWidth;
      setVw(Math.min(el.offsetWidth, winW));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    if (typeof __dai_window !== "undefined")
      __dai_window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      if (typeof __dai_window !== "undefined")
        __dai_window.removeEventListener("resize", update);
    };
  }, []);
  const phoneBp = vw < 600;
  useEffect(() => {
    setHeaderHovered(false);
    setOpenKey(null);
    setMobileNavOpen(false);
    setExpandedKey(null);
  }, [phoneBp]);
  useEffect(() => {
    if (typeof document === "undefined")
      return;
    const id = "fmn-script-font";
    const href = "https://fonts.googleapis.com/css2?family=Pacifico&family=Poppins:wght@400;500;600;700&family=Mozilla+Text:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap";
    let link = document.getElementById(id);
    if (link) {
      if (link.href !== href)
        link.href = href;
      return;
    }
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, []);
  useEffect(() => {
    if (typeof document === "undefined")
      return;
    const id = "fmn-satoshi-font";
    const href = "https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap";
    let link = document.getElementById(id);
    if (link) {
      if (link.href !== href)
        link.href = href;
      return;
    }
    link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, []);
  useEffect(() => {
    if (typeof document === "undefined")
      return;
    const id = "fmn-megamenu-anim";
    if (document.getElementById(id))
      return;
    const styleEl = document.createElement("style");
    styleEl.id = id;
    styleEl.textContent = "@keyframes mwFadeIn{from{opacity:0}to{opacity:1}}@keyframes mwFadeOut{from{opacity:1}to{opacity:0}}.mw-no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}.mw-no-scrollbar::-webkit-scrollbar{display:none;width:0;height:0}";
    document.head.appendChild(styleEl);
  }, []);
  const isTablet = vw < 1024;
  const headerActive = headerHovered || isOpen || vw < 600;
  const panelBg = headerActive ? "rgba(255, 255, 255, 1)" : "rgba(255, 255, 255, 0)";
  const navText = headerActive ? "#111111" : textColor;
  const showHamburger = vw < 600;
  const mobileFull = showHamburger && mobileNavOpen;
  const isNavCompact = vw < 1024;
  const isTabletNav = isNavCompact && !showHamburger;
  const navPad = showHamburger ? "6px 16px" : isTabletNav ? "8px 18px" : "8px 28px";
  const linkGap = showHamburger ? 14 : isTabletNav ? 16 : 28;
  const linkFont = showHamburger ? 12 : isTabletNav ? 14 : navFontSize;
  const logoFont = showHamburger ? 17 : 22;
  const renderNavLink = (link, i, vertical) => {
    const key = link.label.toLowerCase();
    const linkMenuKey = MENU_BUILTINS[key] ? key : null;
    return /* @__PURE__ */ _jsx("span", { onMouseEnter: showHamburger ? void 0 : () => handleOpen(linkMenuKey), onClick: showHamburger ? () => {
      if (linkMenuKey && openKey === linkMenuKey)
        setOpenKey(null);
      else
        handleOpen(linkMenuKey);
    } : void 0, style: { color: navText, fontFamily: '"Satoshi", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontSize: vertical ? 16 : linkFont, fontWeight: vertical ? 500 : 400, cursor: "pointer", borderBottom: linkMenuKey && openKey === linkMenuKey ? `1px solid ${navText}` : "1px solid transparent", paddingBottom: 2, transition: isStatic ? "none" : "color 0.28s ease", whiteSpace: "nowrap" }, children: link.label }, i);
  };
  return /* @__PURE__ */ _jsxs("div", { ref: rootRef, style: { ...style, width: "100%", height: "100%", backgroundColor, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }, children: [/* @__PURE__ */ _jsx("div", { style: { position: "absolute", inset: 0, zIndex: 10, backgroundColor: isOpen ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0)", backdropFilter: isOpen ? "blur(8px)" : "blur(0px)", WebkitBackdropFilter: isOpen ? "blur(8px)" : "blur(0px)", opacity: isOpen ? 1 : 0, pointerEvents: "none", transition: isStatic ? "none" : "background-color 0.35s ease, backdrop-filter 0.35s ease, opacity 0.35s ease" } }), /* @__PURE__ */ _jsx("div", { onMouseEnter: () => {
    cancelClose();
    setHeaderHovered(true);
  }, onMouseLeave: scheduleClose, style: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    // Full-screen when the phone menu is open: span to the
    // bottom with no inset so the white panel fills the page.
    bottom: mobileFull ? 0 : void 0,
    zIndex: 20,
    // Phone: a full-width bar flush to the top (no inset),
    // matching the reference. Tablet/desktop: the floating pill
    // with its inset margin.
    padding: showHamburger ? 0 : headerInset
  }, children: /* @__PURE__ */ _jsxs("div", { style: {
    backgroundColor: panelBg,
    // Phone: square corners, flush full-width bar (and full
    // height when the menu is open). Tablet/desktop: rounded
    // floating pill.
    borderRadius: showHamburger ? 0 : headerRadius,
    height: mobileFull ? "100%" : void 0,
    display: mobileFull ? "flex" : void 0,
    flexDirection: mobileFull ? "column" : void 0,
    overflow: "hidden",
    // Phone: only a bottom divider (no frame around the bar).
    // Tablet/desktop: a full 1px border when active.
    border: showHamburger ? "none" : headerActive ? "1px solid rgba(0,0,0,0.10)" : "1px solid rgba(0,0,0,0)",
    borderBottom: showHamburger ? "1px solid rgba(0,0,0,0.08)" : void 0,
    boxShadow: showHamburger ? "0 2px 10px rgba(0,0,0,0.06)" : headerActive ? "0 16px 40px rgba(0,0,0,0.18)" : "0 16px 40px rgba(0,0,0,0)",
    // Only paint properties animate -> buttery smooth.
    transition: isStatic ? "none" : "background-color 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease"
  }, children: [/* @__PURE__ */ _jsxs("nav", { style: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: navPad,
    fontFamily: fontStack,
    // Fixed bar height when set (> 0), else auto from padding.
    height: headerHeight > 0 ? headerHeight : void 0,
    boxSizing: "border-box"
  }, children: [showHamburger ? (
    // Phone: hamburger (closed) / ✕ (open) on the left
    /* @__PURE__ */ _jsx("div", { style: { flex: 1, display: "flex" }, children: /* @__PURE__ */ _jsxs("button", { onClick: () => {
      const next = !mobileNavOpen;
      setMobileNavOpen(next);
      if (!next) {
        setOpenKey(null);
        setExpandedKey(null);
      }
    }, "aria-label": mobileNavOpen ? "Close" : "Menu", style: { position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4, width: 32, height: 24, display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 }, children: [/* @__PURE__ */ _jsx("span", { style: { position: "absolute", left: 4, width: 24, height: 2, backgroundColor: navText, transform: mobileNavOpen ? "translateY(0) rotate(45deg)" : "translateY(-7px) rotate(0)", transition: isStatic ? "none" : "transform 0.3s ease, background-color 0.28s ease" } }), /* @__PURE__ */ _jsx("span", { style: { position: "absolute", left: 4, width: 24, height: 2, backgroundColor: navText, opacity: mobileNavOpen ? 0 : 1, transition: isStatic ? "none" : "opacity 0.2s ease, background-color 0.28s ease" } }), /* @__PURE__ */ _jsx("span", { style: { position: "absolute", left: 4, width: 24, height: 2, backgroundColor: navText, transform: mobileNavOpen ? "translateY(0) rotate(-45deg)" : "translateY(7px) rotate(0)", transition: isStatic ? "none" : "transform 0.3s ease, background-color 0.28s ease" } })] }) })
  ) : (
    // Desktop: nav links in a row
    /* @__PURE__ */ _jsx("div", { style: {
      display: "flex",
      gap: linkGap,
      // Desktop splits the bar into thirds (logo
      // perfectly centered). On tablet the links
      // size to their content and never wrap, so
      // "Brands" stays on the same row.
      flex: isNavCompact ? "0 0 auto" : 1,
      flexWrap: isNavCompact ? "nowrap" : "wrap",
      whiteSpace: "nowrap"
    }, children: navLinks.map((link, i) => renderNavLink(link, i, false)) })
  ), /* @__PURE__ */ _jsx("div", { style: {
    // Tablet: absolutely centered over the bar so
    // unequal side widths can't shift it. Phone &
    // desktop: a flex:1 middle column (equal thirds).
    ...isTabletNav ? { position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" } : { flex: 1 },
    // minWidth:0 lets this column stay exactly 1/3
    // of the bar so the logo is truly centered (and
    // a slightly-too-wide logo overflows into the
    // gaps, not onto the hamburger/bag).
    minWidth: 0,
    textAlign: "center",
    color: navText,
    // Smaller logo on phone/tablet so it fits the
    // middle without colliding with the links/bag.
    fontSize: showHamburger ? 22 : isTabletNav ? 30 : logoFont + 16,
    fontStyle: "normal",
    fontFamily: scriptStack,
    fontWeight: 400,
    transition: isStatic ? "none" : "color 0.28s ease",
    whiteSpace: "nowrap",
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }, children: logoImage ? /* @__PURE__ */ _jsx("img", { src: logoImage, alt: logoText, style: {
    // Explicit size when set (> 0), else
    // fall back to the auto-scaled logo.
    height: logoHeight > 0 ? logoHeight : logoFont + 34,
    width: logoWidth > 0 ? logoWidth : "auto",
    objectFit: "contain",
    display: "block",
    // White logo by default; turns BLACK when
    // the header is hovered/open (white bar).
    // brightness(0) = solid black silhouette;
    // adding invert(1) flips it to white.
    filter: headerActive ? "brightness(0)" : "brightness(0) invert(1)",
    transition: isStatic ? "none" : "filter 0.28s ease"
  } }) : logoText }), /* @__PURE__ */ _jsx("div", { style: {
    // Phone: equal thirds (flex:1) so the bag column
    // matches the hamburger column and the logo is
    // perfectly centered. Tablet: content-width so
    // the logo takes the slack. Desktop: thirds.
    flex: showHamburger ? 1 : isNavCompact ? "0 0 auto" : 1,
    minWidth: 0,
    textAlign: "right",
    color: navText,
    fontSize: linkFont,
    cursor: "pointer",
    transition: isStatic ? "none" : "color 0.28s ease",
    whiteSpace: "nowrap"
  }, children: bagLabel })] }), showHamburger && mobileNavOpen ? /* @__PURE__ */ _jsxs("div", { className: "mw-no-scrollbar", style: {
    padding: "8px 0 20px",
    fontFamily: serifStack,
    // Fill the remaining screen height and scroll
    // internally so long menus stay usable.
    flex: 1,
    minHeight: 0,
    overflowY: "auto"
  }, children: [/* @__PURE__ */ _jsx("div", { style: { padding: "0 20px" }, children: navLinks.map((link, i) => {
    const key = link.label.toLowerCase();
    const hasMenu = !!MENU_BUILTINS[key];
    const menu = hasMenu ? resolveMenu(MENU_OVERRIDES[key], MENU_BUILTINS[key]) : null;
    const expanded = expandedKey === link.label;
    return /* @__PURE__ */ _jsxs("div", { style: { borderBottom: "1px solid rgba(0,0,0,0.08)" }, children: [/* @__PURE__ */ _jsxs("button", { onClick: () => {
      if (!menu)
        return;
      setExpandedKey(expanded ? null : link.label);
    }, style: { width: "100%", background: "none", border: "none", cursor: menu ? "pointer" : "default", padding: "14px 0", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: '"Mozilla Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontSize: 30, fontWeight: 600, color: "#000000", lineHeight: 1 }, children: [/* @__PURE__ */ _jsx("span", { children: link.label }), menu ? /* @__PURE__ */ _jsx("span", { style: { fontSize: 26, fontWeight: 400, lineHeight: 1, color: "#333" }, children: expanded ? "\u2013" : "+" }) : null] }), /* @__PURE__ */ _jsx("div", { style: { display: "grid", gridTemplateRows: expanded ? "1fr" : "0fr", transition: isStatic ? "none" : "grid-template-rows 0.32s cubic-bezier(0.22, 1, 0.36, 1)" }, children: /* @__PURE__ */ _jsx("div", { style: { overflow: "hidden", minHeight: 0 }, children: /* @__PURE__ */ _jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12, padding: "2px 0 18px", fontFamily: '"Satoshi", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }, children: [(menu?.menuItems || []).map((it, j) => /* @__PURE__ */ _jsx("span", { style: { fontSize: 17, fontWeight: 500, color: "#222", cursor: "pointer" }, children: it.label }, j)), /* @__PURE__ */ _jsx("span", { style: { fontSize: 17, fontWeight: 700, color: "#000", cursor: "pointer" }, children: menu?.shopAllLabel })] }) }) })] }, i);
  }) }), /* @__PURE__ */ _jsx("div", { ref: carouselRef, className: "mw-no-scrollbar", onPointerDown: onCarPointerDown, onPointerMove: onCarPointerMove, onPointerUp: onCarPointerEnd, onPointerLeave: onCarPointerEnd, onWheel: onCarWheel, style: {
    display: "flex",
    gap: 16,
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
    padding: "28px 20px 4px",
    marginTop: 8,
    cursor: "grab",
    touchAction: "pan-x",
    // No scroll-snap — free, smooth scrolling.
    // userSelect off so dragging never starts a
    // text/image selection that jitters the drag.
    userSelect: "none",
    WebkitUserSelect: "none"
  }, children: navLinks.map((link) => {
    const key = link.label.toLowerCase();
    if (!MENU_BUILTINS[key])
      return null;
    const menu = resolveMenu(MENU_OVERRIDES[key], MENU_BUILTINS[key]);
    const img = menu.feature?.image || MENU_FALLBACK_IMAGES[key] || FALLBACK_FEATURE_MEN;
    return { key, menu, img };
  }).filter(Boolean).map((entry, i) => {
    const { menu, img } = entry;
    return /* @__PURE__ */ _jsxs("div", { style: { flex: "0 0 78%", display: "flex", flexDirection: "column" }, children: [/* @__PURE__ */ _jsx("div", { style: { position: "relative", width: "100%", height: 340, borderRadius: 14, overflow: "hidden", backgroundImage: `url("${img}")`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "#1A1A1A" } }), /* @__PURE__ */ _jsx("h3", { style: { margin: "14px 0 0", fontFamily: '"Mozilla Text", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontSize: 20, fontWeight: 600, color: "#000", lineHeight: 1.1 }, children: menu.feature?.title }), menu.feature?.subtitle ? /* @__PURE__ */ _jsx("p", { style: { margin: "6px 0 0", fontFamily: '"Satoshi", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontSize: 13, fontWeight: 500, color: "#666", lineHeight: 1.4 }, children: menu.feature.subtitle }) : null, /* @__PURE__ */ _jsx("span", { style: { marginTop: 10, fontFamily: '"Satoshi", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', fontSize: 14, fontWeight: 600, color: "#000", textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer", alignSelf: "flex-start" }, children: menu.feature?.buttonLabel || "Explore" })] }, i);
  }) })] }) : null, /* @__PURE__ */ _jsx("div", { style: { display: "grid", gridTemplateRows: isOpen ? "1fr" : "0fr", opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none", transition: isStatic ? "none" : "grid-template-rows 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease" }, children: /* @__PURE__ */ _jsxs("div", { style: { overflow: "hidden", minHeight: 0, position: "relative" }, children: [prevMenu ? /* @__PURE__ */ _jsx("div", { style: { position: "absolute", inset: 0, pointerEvents: "none", animation: isStatic ? "none" : `mwFadeOut ${crossfadeMs}ms ease ${crossfadeDelayMs}ms both` }, children: /* @__PURE__ */ _jsx(MegaMenu, { items: prevMenu.menuItems, shopAllLabel: prevMenu.shopAllLabel, feature: prevMenu.feature, fallbackFeature: prevFallbackFeature, stack: showHamburger, tablet: isTablet && !showHamburger, menuHeight, featureWidth, featureHeight, featureRadius, menuFontSize, featureTitleSize, menuItemGap }) }, "prev-" + prevKey) : null, activeMenu ? /* @__PURE__ */ _jsx("div", { style: { animation: isStatic ? "none" : `mwFadeIn ${crossfadeMs}ms ease ${crossfadeDelayMs}ms both` }, children: /* @__PURE__ */ _jsx(MegaMenu, { items: activeMenu.menuItems, shopAllLabel: activeMenu.shopAllLabel, feature: activeMenu.feature, fallbackFeature: activeFallbackFeature, stack: showHamburger, tablet: isTablet && !showHamburger, menuHeight, featureWidth, featureHeight, featureRadius, menuFontSize, featureTitleSize, menuItemGap }) }, "cur-" + displayKey) : null] }) })] }) }), /* @__PURE__ */ _jsxs("div", { style: { display: "flex", flexDirection: isTablet ? "column" : "row", flex: 1, minHeight: 0 }, children: [/* @__PURE__ */ _jsx(Panel, { panel: leftPanel, fallbackImage: FALLBACK_LEFT, textColor, buttonColor, buttonTextColor, titleSize, stacked: isTablet, panelWidth: leftPanelWidth, panelHeight: leftPanelHeight, btnWidth: heroBtnWidth, btnHeight: heroBtnHeight, btnRadius: heroBtnRadius }), !isTablet ? /* @__PURE__ */ _jsx(Panel, { panel: rightPanel, fallbackImage: FALLBACK_RIGHT, textColor, buttonColor, buttonTextColor, titleSize, stacked: isTablet, panelWidth: rightPanelWidth, panelHeight: rightPanelHeight, btnWidth: heroBtnWidth, btnHeight: heroBtnHeight, btnRadius: heroBtnRadius }) : null] })] });
}
function menuControl(title, defaultValue, shopAll, featureTitle, featureSubtitle) {
  return { type: ControlType.Object, title, defaultValue, controls: { menuItems: { type: ControlType.Array, title: "Items", control: { type: ControlType.Object, controls: { label: { type: ControlType.String, title: "Label", defaultValue: "Category" }, image: { type: ControlType.Image, title: "Hover Image" } } } }, shopAllLabel: { type: ControlType.String, title: "Shop All", defaultValue: shopAll }, feature: { type: ControlType.Object, title: "Feature", controls: { image: { type: ControlType.Image, title: "Image" }, title: { type: ControlType.String, title: "Title", defaultValue: featureTitle }, subtitle: { type: ControlType.String, title: "Subtitle", defaultValue: featureSubtitle }, buttonLabel: { type: ControlType.String, title: "Button", defaultValue: "Explore" } } } } };
}
addPropertyControls(FeMegaNav, { navLinks: { type: ControlType.Array, title: "Nav Links", control: { type: ControlType.Object, controls: { label: { type: ControlType.String, title: "Label", defaultValue: "Link" } } }, defaultValue: [{ label: "Men" }, { label: "Women" }, { label: "Accessories" }, { label: "Brands" }] }, logoText: { type: ControlType.String, title: "Logo", defaultValue: "FeCommerce" }, logoImage: { type: ControlType.Image, title: "Logo Image" }, bagLabel: { type: ControlType.String, title: "Bag", defaultValue: "Bag (0)" }, accessoriesMenu: menuControl("Accessories Menu", ACCESSORIES_MENU, "Shop all", "The Day Bag", "30L of clever storage for epic days out"), menMenu: menuControl("Men Menu", MEN_MENU, "Shop all Mens", "The Sport Coat", "Our new merino midlayer designed for powder days and apr\xE8s"), womenMenu: menuControl("Women Menu", WOMEN_MENU, "Shop all Womens", "The Dinner Sweater", "Cozy alpaca wool for late nights off the mountain"), brandsMenu: menuControl("Brands Menu", BRANDS_MENU, "Shop all Brands", "The Field Watch", "Built for the trail and the bar"), leftPanel: { type: ControlType.Object, title: "Left Panel", defaultValue: { image: FALLBACK_LEFT, title: "Timeless Grace", buttonLabel: "Shop Now" }, controls: { image: { type: ControlType.Image, title: "Image" }, title: { type: ControlType.String, title: "Title", defaultValue: "Timeless Grace" }, buttonLabel: { type: ControlType.String, title: "Button", defaultValue: "Shop Now" } } }, rightPanel: { type: ControlType.Object, title: "Right Panel", defaultValue: { image: FALLBACK_RIGHT, title: "Modern Outerwear", buttonLabel: "Shop Now" }, controls: { image: { type: ControlType.Image, title: "Image" }, title: { type: ControlType.String, title: "Title", defaultValue: "Modern Outerwear" }, buttonLabel: { type: ControlType.String, title: "Button", defaultValue: "Shop Now" } } }, backgroundColor: { type: ControlType.Color, title: "Background", defaultValue: "#1A1A1A" }, textColor: { type: ControlType.Color, title: "Text", defaultValue: "#FFFFFF" }, buttonColor: { type: ControlType.Color, title: "Button BG", defaultValue: "#FFFFFF" }, buttonTextColor: { type: ControlType.Color, title: "Button Text", defaultValue: "#1A1A1A" }, titleSize: { type: ControlType.Number, title: "Title Size", defaultValue: 34, min: 12, max: 64, step: 1, unit: "px" }, headerHeight: { type: ControlType.Number, title: "Header Height", defaultValue: 64, min: 0, max: 160, step: 2, unit: "px", description: "0 = auto" }, headerRadius: { type: ControlType.Number, title: "Header Radius", defaultValue: 24, min: 0, max: 60, step: 1, unit: "px" }, headerInset: { type: ControlType.Number, title: "Header Inset", defaultValue: 24, min: 0, max: 80, step: 1, unit: "px", description: "Top/left margin around the bar" }, menuHeight: { type: ControlType.Number, title: "Menu Height", defaultValue: 534, min: 0, max: 1e3, step: 10, unit: "px", description: "Open dropdown height (0 = auto)" }, featureWidth: { type: ControlType.Number, title: "Dropdown Img W", defaultValue: 890, min: 100, max: 1200, step: 2, unit: "px" }, featureHeight: { type: ControlType.Number, title: "Dropdown Img H", defaultValue: 500, min: 100, max: 1e3, step: 2, unit: "px" }, featureRadius: { type: ControlType.Number, title: "Dropdown Img Radius", defaultValue: 24, min: 0, max: 60, step: 1, unit: "px" }, menuFontSize: { type: ControlType.Number, title: "Menu Font Size", defaultValue: 34, min: 12, max: 80, step: 1, unit: "px" }, featureTitleSize: { type: ControlType.Number, title: "Dropdown Title Size", defaultValue: 34, min: 12, max: 80, step: 1, unit: "px" }, menuItemGap: { type: ControlType.Number, title: "Menu Item Gap", defaultValue: 30, min: 0, max: 80, step: 2, unit: "px", description: "Space between dropdown lines" }, logoWidth: { type: ControlType.Number, title: "Logo Width", defaultValue: 126, min: 0, max: 600, step: 2, unit: "px", description: "0 = auto" }, logoHeight: { type: ControlType.Number, title: "Logo Height", defaultValue: 84, min: 0, max: 400, step: 2, unit: "px", description: "0 = auto" }, heroBtnWidth: { type: ControlType.Number, title: "Hero Btn Width", defaultValue: 129, min: 0, max: 400, step: 1, unit: "px", description: "0 = auto" }, heroBtnHeight: { type: ControlType.Number, title: "Hero Btn Height", defaultValue: 45, min: 0, max: 120, step: 1, unit: "px", description: "0 = auto" }, heroBtnRadius: { type: ControlType.Number, title: "Hero Btn Radius", defaultValue: 6, min: 0, max: 40, step: 1, unit: "px" }, navFontSize: { type: ControlType.Number, title: "Nav Font Size", defaultValue: 16, min: 8, max: 40, step: 1, unit: "px" }, leftPanelWidth: { type: ControlType.Number, title: "Left Width", defaultValue: 0, min: 0, max: 2e3, step: 10, unit: "px", description: "0 = auto (fills half the row)" }, leftPanelHeight: { type: ControlType.Number, title: "Left Height", defaultValue: 0, min: 0, max: 2e3, step: 10, unit: "px", description: "0 = auto" }, rightPanelWidth: { type: ControlType.Number, title: "Right Width", defaultValue: 0, min: 0, max: 2e3, step: 10, unit: "px", description: "0 = auto (fills half the row)" }, rightPanelHeight: { type: ControlType.Number, title: "Right Height", defaultValue: 0, min: 0, max: 2e3, step: 10, unit: "px", description: "0 = auto" } });
var __FramerMetadata__ = { "exports": { "default": { "type": "reactComponent", "name": "FeMegaNav", "slots": [], "annotations": { "framerSupportedLayoutHeight": "any-prefer-fixed", "framerContractVersion": "1", "framerIntrinsicWidth": "1440", "framerIntrinsicHeight": "1152", "framerSupportedLayoutWidth": "any-prefer-fixed" } }, "__FramerMetadata__": { "type": "variable" } } };
export {
  __FramerMetadata__,
  FeMegaNav as default
};
