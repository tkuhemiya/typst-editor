import { useEffect, useRef } from "react";
import { useTypst } from "@/hooks/use-typst";
import { getImages } from "@/store";

interface TypstViewProps {
  buffer: string;
}

const TypstView = ({ buffer }: TypstViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isCompiling = useRef(false);
  const { compilerRef, rendererRef, isReady } = useTypst(containerRef);

  useEffect(() => {
    const run = async () => {
      if (!compilerRef.current || !rendererRef.current || isCompiling.current) {
        return;
      }

      isCompiling.current = true;
      const compiler = compilerRef.current;
      const renderer = rendererRef.current;

      try {
        const imgs = await getImages();
        if (imgs instanceof Map) {
          imgs.forEach((img, imgName) => {
            console.log("Mapping image to compiler:", imgName);
            compiler.mapShadow(`/${imgName}`, img as Uint8Array);
          });
        }
        console.log("compiling:", buffer);
        compiler.addSource("/main.typ", buffer);

        const artifact = await compiler.compile({
          mainFilePath: "/main.typ",
        });

        if (!artifact.result) throw new Error("NO ARTIFACTS!!!");

        await renderer.renderToSvg({
          container: containerRef.current!,
          artifactContent: artifact.result,
          format: "vector",
        });
      } catch (e) {
        console.error(e);
      } finally {
        await compiler.reset();
        isCompiling.current = false;
      }
    };

    run();
  }, [buffer, isReady]);

  return (
    <div ref={containerRef} className="w-1/2 h-full p-0 overflow-auto"></div>
  );
};

export default TypstView;
