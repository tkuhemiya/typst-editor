import { useEffect, useRef, useState } from "react";
import {
  createTypstCompiler,
  createTypstRenderer,
  createTypstFontBuilder,
} from "@myriaddreamin/typst.ts";
import type { TypstCompiler } from "@myriaddreamin/typst.ts/dist/esm/compiler";
import type { TypstRenderer } from "@myriaddreamin/typst.ts/dist/esm/renderer";

import compilerWasmUrl from "../assets/typst_ts_web_compiler_bg.wasm" with { type: "file" };
import rendererWasmUrl from "../assets/typst_ts_renderer_bg.wasm" with { type: "file" };
import fontFileUrl from "../assets/Geist-Regular.ttf" with { type: "file" };

export function useTypst(containerRef: React.RefObject<HTMLDivElement | null>) {
  const compilerRef = useRef<TypstCompiler | null>(null);
  const rendererRef = useRef<TypstRenderer | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      const fontBuilder = createTypstFontBuilder();
      await fontBuilder.init({
        getModule: () => compilerWasmUrl,
      });
      const fontRes = await fetch(fontFileUrl);
      const fontBuffer = new Uint8Array(await fontRes.arrayBuffer());
      await fontBuilder.addFontData(fontBuffer);

      const compiler = createTypstCompiler();
      const renderer = createTypstRenderer();

      await Promise.all([
        compiler.init({ getModule: () => compilerWasmUrl }),
        renderer.init({ getModule: () => rendererWasmUrl }),
      ]);

      await fontBuilder.build(async (resolver) => {
        await compiler.setFonts(resolver);
        await renderer.loadGlyphPack(resolver);
      });

      compilerRef.current = compiler;
      rendererRef.current = renderer;
      setIsReady(true);
    };
    init();
  }, []);

  return { compilerRef, rendererRef, isReady };
}
