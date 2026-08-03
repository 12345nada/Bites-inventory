const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_MAX_HEIGHT = 1600;
const DEFAULT_QUALITY = 0.78;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "Could not read the selected image."
        )
      );
    };

    image.src = objectUrl;
  });

const canvasToBlob = (
  canvas,
  type,
  quality
) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(
          new Error(
            "Could not compress the selected image."
          )
        );
      },
      type,
      quality
    );
  });

const getScaledSize = (
  width,
  height,
  maxWidth,
  maxHeight
) => {
  const scale = Math.min(
    1,
    maxWidth / width,
    maxHeight / height
  );

  return {
    width: Math.max(
      1,
      Math.round(width * scale)
    ),
    height: Math.max(
      1,
      Math.round(height * scale)
    ),
  };
};

const createCompressedName = (
  originalName
) => {
  const nameWithoutExtension =
    originalName.replace(
      /\.[^/.]+$/,
      ""
    );

  return `${nameWithoutExtension || "image"}.webp`;
};

export async function compressImage(
  file,
  {
    maxWidth = DEFAULT_MAX_WIDTH,
    maxHeight = DEFAULT_MAX_HEIGHT,
    quality = DEFAULT_QUALITY,
  } = {}
) {
  if (!(file instanceof File)) {
    return file;
  }

  if (!file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImage(file);

  const size = getScaledSize(
    image.naturalWidth || image.width,
    image.naturalHeight || image.height,
    maxWidth,
    maxHeight
  );

  const canvas =
    document.createElement("canvas");

  canvas.width = size.width;
  canvas.height = size.height;

  const context =
    canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Image compression is not supported in this browser."
    );
  }

  context.drawImage(
    image,
    0,
    0,
    size.width,
    size.height
  );

  const compressedBlob =
    await canvasToBlob(
      canvas,
      "image/webp",
      quality
    );

  return new File(
    [compressedBlob],
    createCompressedName(file.name),
    {
      type: "image/webp",
      lastModified: Date.now(),
    }
  );
}
