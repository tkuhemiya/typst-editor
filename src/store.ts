import { get, set } from "idb-keyval";

const VERSION = "v1";

export const storeBuffer = async (buffer: string) => {
  await set(`${VERSION}:buffer`, buffer);
};
export const getBuffer = async () => {
  let bufStore = await get(`${VERSION}:buffer`);
  if ( bufStore == null ){
    bufStore = typstExample
  }
  return bufStore
};

export const storeImage = async (name: string, image: Uint8Array) => {
  const imgMap: Map<string, Uint8Array> =
    (await get(`${VERSION}:img`)) || new Map();

  imgMap.set(name, image);

  await set(`${VERSION}:img`, imgMap);
};

export const getImages = async (): Promise<Map<string, Uint8Array> | null> => {
  const imgMap: Map<string, Uint8Array> | undefined = await get(
    `${VERSION}:img`
  );

  if (!imgMap || imgMap.size === 0) {
    return null;
  }

  return imgMap;
};

export const getImageByName = async (
  name: string
): Promise<Uint8Array | undefined> => {
  const imgMap = await getImages();
  return imgMap?.get(name);
};

const typstExample = `
= Hello

#let star-tile = tiling(
  size: (40pt, 40pt),
  relative: "parent",
  {
    place(circle(radius: 8pt, stroke: 1.5pt + rgb("#c0852a"), fill: none))
    place(dx: 20pt, circle(radius: 8pt, stroke: 1.5pt + rgb("#c0852a"), fill: none))
    place(dy: 20pt, circle(radius: 8pt, stroke: 1.5pt + rgb("#c0852a"), fill: none))
    place(dx: 20pt, circle(radius: 8pt, stroke: 1.5pt + rgb("#c0852a"), fill: none))
    place(
      dx: 20pt, dy: 20pt,
      rotate(45deg, rect(width: 14pt, height: 14pt, stroke: 1pt + rgb("#1a3a5c"), fill: rgb("#1a3a5c").lighten(80%)))
    )
  }
)

#rect(width: 100%, height: 100pt, fill: star-tile, stroke: 2pt + black)

#let star-tile = tiling(
  size: (40pt, 40pt),
  relative: "parent",
  {
    place(circle(radius: 8pt, stroke: 1.5pt + rgb("#7F22FE"), fill: none))
    place(dy: 20pt, circle(radius: 8pt, stroke: 1.5pt + rgb("#7F22FE"), fill: none))
    place(dx: 20pt, circle(radius: 8pt, stroke: 1.5pt + rgb("#7F22FE"), fill: none))
    place(
      dx: 20pt, dy: 20pt,
      rotate(45deg, rect(width: 14pt, height: 14pt, stroke: 1pt + rgb("#FF2056"), fill: rgb("#FF2056").lighten(80%)))
    )
  }
)

#rect(width: 100%, height: 100pt, fill: star-tile, stroke: 2pt + black)

#let star-tile = tiling(
  size: (40pt, 40pt),
  relative: "parent",
  {
    place(circle(radius: 8pt, stroke: 1.5pt + rgb("#2AA63E"), fill: none))
    place(dy: 20pt, circle(radius: 8pt, stroke: 1.5pt + rgb("#2AA63E"), fill: none))
    place(dx: 20pt, circle(radius: 8pt, stroke: 1.5pt + rgb("#2AA63E"), fill: none))
    place(
      dx: 20pt, dy: 20pt,
      rotate(45deg, rect(width: 14pt, height: 14pt, stroke: 1pt + rgb("#4F39F6"), fill: rgb("#4F39F6").lighten(80%)))
    )
  }
)

#rect(width: 100%, height: 100pt, fill: star-tile, stroke: 2pt + black)
`
