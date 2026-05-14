import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadToCloudinary(
  bytes: ArrayBuffer,
  folder: string,
  mimeType: string,
): Promise<string> {
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUri = `data:${mimeType};base64,${base64}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `ligakit/${folder}`,
    resource_type: "image",
  });

  return result.secure_url;
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
