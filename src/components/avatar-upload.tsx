"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Camera, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarUploadProps {
  currentImage?: string | null;
  name?: string | null;
  email?: string | null;
  locale: string;
}

export function AvatarUpload({ currentImage, name, email, locale }: AvatarUploadProps) {
  const { update: updateSession } = useSession();
  const [image, setImage] = useState(currentImage ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCS = locale === "cs";

  const initials = name
    ? name.slice(0, 2).toUpperCase()
    : email
    ? email.slice(0, 2).toUpperCase()
    : "U";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(isCS ? "Soubor je příliš velký (max 2 MB)" : "File too large (max 2 MB)");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setIsUploading(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        toast.error(isCS ? "Chyba při nahrávání" : "Upload failed");
        return;
      }
      setImage(data.imageUrl);
      await updateSession({ image: data.imageUrl });
      toast.success(isCS ? "Profilový obrázek aktualizován" : "Profile picture updated");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await fetch("/api/profile/avatar", { method: "DELETE" });
      setImage(null);
      await updateSession({ image: null });
      toast.success(isCS ? "Profilový obrázek odstraněn" : "Profile picture removed");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <Avatar className="size-16">
          <AvatarImage src={image ?? undefined} alt={name ?? email ?? ""} />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="absolute -bottom-1 -right-1 flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
          title={isCS ? "Nahrát obrázek" : "Upload picture"}
        >
          {isUploading ? <Loader2 className="size-3 animate-spin" /> : <Camera className="size-3" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{isCS ? "Profilový obrázek" : "Profile picture"}</p>
        <p className="text-xs text-muted-foreground">
          {isCS ? "PNG, JPG, WebP nebo GIF · max 2 MB" : "PNG, JPG, WebP or GIF · max 2 MB"}
        </p>
        {image && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isRemoving}
            className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
          >
            {isRemoving ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
            {isCS ? "Odstranit" : "Remove"}
          </button>
        )}
      </div>
    </div>
  );
}
