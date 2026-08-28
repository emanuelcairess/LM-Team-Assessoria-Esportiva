/**
 * Image compression and formatting utility for LM Team.
 * Resizes, crops to square, and compresses uploaded photos to compact Base64 strings.
 * Built with robust multi-strategy decoders (createImageBitmap, ObjectURL, FileReader)
 * and fail-safe fallbacks.
 */

export function isImageFile(file: File): boolean {
  if (!file) return false;
  if (file.type && file.type.startsWith('image/')) return true;
  // Match common image file extensions in case MIME type is missing or generic
  return /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif|svg)$/i.test(file.name || '');
}

/**
 * Compresses an image file to a lightweight square Base64 JPEG data URL (~25-50KB).
 */
export async function compressImageFile(
  file: File,
  maxDimension = 400,
  quality = 0.82
): Promise<string> {
  if (!file) {
    throw new Error('Nenhum arquivo fornecido.');
  }

  // 1. Validate that the file is an image
  if (!isImageFile(file)) {
    throw new Error('O arquivo selecionado não é uma imagem válida (JPG, PNG, WebP, etc).');
  }

  // 2. Try Strategy A: Modern createImageBitmap (fastest, low memory, automatic EXIF orientation)
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      try {
        const result = renderBitmapToCanvas(bitmap, maxDimension, quality);
        bitmap.close();
        return result;
      } catch {
        bitmap.close();
      }
    } catch {
      // Fallback to Strategy B
    }
  }

  // 3. Try Strategy B: URL.createObjectURL + HTMLImageElement
  try {
    const result = await loadImageViaObjectURL(file, maxDimension, quality);
    return result;
  } catch {
    // Fallback to Strategy C
  }

  // 4. Try Strategy C: FileReader readAsDataURL + HTMLImageElement
  try {
    const result = await loadImageViaFileReader(file, maxDimension, quality);
    return result;
  } catch (err: any) {
    // 5. Ultimate Fallback: Just read as raw Data URL if canvas fails
    return await readAsRawDataUrl(file);
  }
}

/**
 * Renders an ImageBitmap or HTMLImageElement onto a square canvas with center crop and solid background.
 */
function renderBitmapToCanvas(
  source: ImageBitmap | HTMLImageElement,
  maxDimension: number,
  quality: number
): string {
  const width = source.width;
  const height = source.height;

  if (!width || !height) {
    throw new Error('Dimensões inválidas da imagem.');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: false });

  if (!ctx) {
    throw new Error('Contexto 2D do Canvas indisponível.');
  }

  // Calculate center square crop
  const minSide = Math.min(width, height);
  const startX = (width - minSide) / 2;
  const startY = (height - minSide) / 2;

  const targetSize = Math.min(minSide, maxDimension);
  canvas.width = targetSize;
  canvas.height = targetSize;

  // Fill background with a dark neutral slate to keep transparent PNGs clean
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Enable high-quality smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw cropped and centered image
  ctx.drawImage(
    source,
    startX,
    startY,
    minSide,
    minSide,
    0,
    0,
    targetSize,
    targetSize
  );

  // Export as compact JPEG
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Strategy B: Object URL decoder
 */
function loadImageViaObjectURL(
  file: File,
  maxDimension: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch (e) {
      reject(e);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const cleanup = () => {
      try {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      } catch {}
    };

    img.onload = () => {
      try {
        const dataUrl = renderBitmapToCanvas(img, maxDimension, quality);
        cleanup();
        resolve(dataUrl);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Falha ao decodificar imagem via ObjectURL.'));
    };

    img.src = objectUrl;
  });
}

/**
 * Strategy C: FileReader decoder
 */
function loadImageViaFileReader(
  file: File,
  maxDimension: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Erro de leitura do arquivo no navegador.'));
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('Dados do arquivo vazios.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const dataUrl = renderBitmapToCanvas(img, maxDimension, quality);
          resolve(dataUrl);
        } catch (err) {
          // If canvas fails, return raw dataUrl as fallback
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => {
        // Fallback to raw data url
        resolve(rawDataUrl);
      };
      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Strategy D: Fallback directly to raw Data URL
 */
function readAsRawDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
