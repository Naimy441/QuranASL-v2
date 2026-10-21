// Runs inline in <head> (see layout.tsx) so the saved theme applies before first paint.
export const APPEARANCE_KEY = "qasl-appearance";

/** Inline, dependency-free version of applyAppearance() for the <head>. */
export const APPEARANCE_BOOT_SCRIPT = `(function(){try{var a=JSON.parse(localStorage.getItem('${APPEARANCE_KEY}')||'{}');var d=document.documentElement;if(a.theme==='light'||a.theme==='dark')d.setAttribute('data-theme',a.theme);if(a.contrast||localStorage.getItem('qasl-contrast')==='high')d.setAttribute('data-contrast','high');if(a.reduceMotion)d.setAttribute('data-motion','reduce');}catch(e){}})();`;
