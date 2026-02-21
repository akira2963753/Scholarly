/**
 * PDF.js module worker initializer.
 * PDF.js 4.x creates module workers and expects this module to set up
 * WorkerMessageHandler before the message handshake begins.
 */
import { WorkerMessageHandler } from "./pdf.worker.min.mjs";
WorkerMessageHandler.initializeFromPort(self);
