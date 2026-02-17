import { get, set } from "idb-keyval";

const VERSION = "v1";

export const storeBuffer = async (buffer: string) => {
  await set(`${VERSION}:buffer`, buffer);
};
export const getBuffer = async () => {
  return await get(`${VERSION}:buffer`);
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
