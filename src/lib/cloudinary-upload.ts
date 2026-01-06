// cloudinary upload utility for blobs and files

const CLOUDINARY_CLOUD_NAME = "dewj8he1y";
const CLOUDINARY_UPLOAD_PRESET = "arture-upload-present";

interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  thumbnail: string;
  width: number;
  height: number;
}

// uploads a blob to cloudinary
export async function uploadBlobToCloudinary(
  blob: Blob,
  filename?: string,
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();

  const file = new File([blob], filename || `image-${Date.now()}.png`, {
    type: blob.type || "image/png",
  });

  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Cloudinary upload error:", errorData);
    throw new Error(
      errorData.error?.message ||
        `Upload failed: ${response.status} - ${JSON.stringify(errorData)}`,
    );
  }

  const data = await response.json();

  if (!data.secure_url) {
    throw new Error(data.error?.message || "Upload failed: no URL returned");
  }

  const url: string = data.secure_url;
  const publicId: string = data.public_id || "";
  const width: number = data.width || 0;
  const height: number = data.height || 0;

  const thumbnail = url.includes("/upload/")
    ? url.replace("/upload/", "/upload/w_200,h_200,c_fill/")
    : url;

  return { url, publicId, thumbnail, width, height };
}

// uploads a file to cloudinary
export async function uploadFileToCloudinary(
  file: File,
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Cloudinary upload error:", errorData);
    throw new Error(
      errorData.error?.message ||
        `Upload failed: ${response.status} - ${JSON.stringify(errorData)}`,
    );
  }

  const data = await response.json();

  if (!data.secure_url) {
    throw new Error(data.error?.message || "Upload failed: no URL returned");
  }

  const url: string = data.secure_url;
  const publicId: string = data.public_id || "";
  const width: number = data.width || 0;
  const height: number = data.height || 0;

  const thumbnail = url.includes("/upload/")
    ? url.replace("/upload/", "/upload/w_200,h_200,c_fill/")
    : url;

  return { url, publicId, thumbnail, width, height };
}

// uploads a data url to cloudinary
export async function uploadDataUrlToCloudinary(
  dataUrl: string,
  filename?: string,
): Promise<CloudinaryUploadResult> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return uploadBlobToCloudinary(blob, filename);
}
