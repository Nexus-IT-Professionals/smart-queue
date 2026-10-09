// Types for vite.config.ts, which imports the dev middleware (no @types/node here).
import type { Connect } from "vite";
export declare const PRESENTATION_CSP: string;
export declare function presentationIndexHtml(html: string): string;
export declare function copyPresentation(
  outDir: string,
  source?: string,
): Promise<string[]>;
export declare function presentationDevMiddleware(
  source?: string,
): Connect.NextHandleFunction;
