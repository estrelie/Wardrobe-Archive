/* ---------------------------------------------------------
   Image compression
--------------------------------------------------------- */
export function fileToCompressedDataUrl(file: File, maxDim: number = 1000, quality: number = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round(height * (maxDim / width)); width = maxDim; }
        else if (height > maxDim) { width = Math.round(width * (maxDim / height)); height = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("file read failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * 구매 기록에 남길 작은 썸네일(4:5)을 만든다.
 *  - 외부 이미지 주소(샘플 이미지 등)는 주소만 그대로 돌려준다.
 *  - 만들지 못하면(디코딩 실패·시간 초과) 빈 문자열을 돌려준다. 구매 기록 자체에는 영향이 없다.
 */
export function makeThumbnail(src: string, w: number = 96, h: number = 120, quality: number = 0.7): Promise<string> {
  if (!src) return Promise.resolve("");
  if (!src.startsWith("data:")) return Promise.resolve(src);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(""), 2000);
    const img = new window.Image();
    img.onload = () => {
      clearTimeout(timer);
      try {
        const scale = Math.max(w / img.width, h / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(""); return; }
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve("");
      }
    };
    img.onerror = () => { clearTimeout(timer); resolve(""); };
    img.src = src;
  });
}

export interface CompressResult {
  /** 잘 처리된 이미지 */
  urls: string[];
  /** 읽을 수 없어 건너뛴 파일 수 */
  failed: number;
  /** 남은 자리를 넘어 버려진 파일 수 */
  overLimit: number;
}

/**
 * 여러 파일을 하나씩 처리한다. 하나가 실패해도 나머지는 그대로 추가하고,
 * 남은 자리(available)를 넘는 파일은 버린다. (예전에는 한 장만 실패해도 전부 무시됐다)
 */
export async function compressFiles(
  files: File[],
  available: number,
  compress: (f: File) => Promise<string>
): Promise<CompressResult> {
  const target = files.slice(0, Math.max(0, available));
  const overLimit = files.length - target.length;
  const settled = await Promise.allSettled(target.map((f) => compress(f)));
  const urls: string[] = [];
  let failed = 0;
  for (const r of settled) {
    if (r.status === "fulfilled" && r.value) urls.push(r.value);
    else failed++;
  }
  return { urls, failed, overLimit };
}

/** 업로드 결과를 사용자에게 보여줄 한 줄로 만든다. 모두 잘 됐으면 null */
export function uploadNotice(r: CompressResult, limit: number): string | null {
  const parts: string[] = [];
  if (r.failed > 0) parts.push(`${r.failed} file${r.failed > 1 ? "s" : ""} couldn't be read`);
  if (r.overLimit > 0) parts.push(`${r.overLimit} skipped (max ${limit})`);
  return parts.length ? parts.join(" · ") : null;
}
