/**
 * PDF.js module worker initializer.
 *
 * Forces isOffscreenCanvasSupported = false so pdfjs-dist uses the standard
 * Canvas 2D rendering path instead of OffscreenCanvas, which causes blank
 * pages or "Cannot assign to read only property" TypeErrors in Electron.
 */
const _origDefineProperty = Object.defineProperty;
Object.defineProperty = function _patched(obj, prop, desc) {
  if ((obj === globalThis || obj === self) && prop === 'isOffscreenCanvasSupported') {
    const d = Object.assign({}, desc);
    delete d.get;
    delete d.set;
    d.value = false;
    d.writable = true;
    d.configurable = true;
    return _origDefineProperty.call(Object, obj, prop, d);
  }
  return _origDefineProperty.call(Object, obj, prop, desc);
};

const { WorkerMessageHandler } = await import('./pdf.worker.min.mjs');
WorkerMessageHandler.initializeFromPort(self);
