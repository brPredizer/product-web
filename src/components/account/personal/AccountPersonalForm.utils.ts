export const CROP_SIZE = 280;
export const OUTPUT_SIZE = 512;
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;
export const ZOOM_STEP = 0.12;

export const revokeIfBlob = (url?: string | null) => {
  if (url && typeof url === "string" && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });

export type CropToSquareParams = {
  src: string;
  offsetX: number;
  offsetY: number;
  zoom: number;
};

export const cropToSquare = async ({
  src,
  offsetX,
  offsetY,
  zoom,
}: CropToSquareParams): Promise<Blob> => {
  const img = await loadImage(src);

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const baseScale = Math.max(CROP_SIZE / iw, CROP_SIZE / ih);
  const s = baseScale * zoom;

  const dw = iw * s;
  const dh = ih * s;

  const canvas = document.createElement("canvas");
  canvas.width = CROP_SIZE;
  canvas.height = CROP_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--canvas-fill") || "#fff";
  ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

  const dx = CROP_SIZE / 2 + offsetX - dw / 2;
  const dy = CROP_SIZE / 2 + offsetY - dh / 2;

  ctx.drawImage(img, dx, dy, dw, dh);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = OUTPUT_SIZE;
  outCanvas.height = OUTPUT_SIZE;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) throw new Error("Canvas 2D context not available");
  outCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--canvas-fill") || "#fff";
  outCtx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  outCtx.drawImage(canvas, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  return await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Failed to create blob"));
    }, "image/jpeg", 0.92);
  });
};
