import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface FileUploaderProps {
  onFileUploaded?: (url: string, file: File) => void;
  acceptedFormats?: string;
  maxSizeMB?: number;
}

export function FileUploader({
  onFileUploaded,
  acceptedFormats = "image/*",
  maxSizeMB = 5,
}: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; name: string }>>([])
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(files: FileList | null) {
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      toast.error(`Arquivo excede ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Erro ao fazer upload");

      const data = await res.json();
      const fileUrl = data.url || data.path || "";

      if (fileUrl) {
        setUploadedFiles((prev) => [...prev, { url: fileUrl, name: file.name }]);
        onFileUploaded?.(fileUrl, file);
        toast.success("Arquivo enviado com sucesso!");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      toast.error(err.message || "Erro no upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeFile(index: number) {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={acceptedFormats}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Enviando..." : "Fazer Upload"}
        </Button>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded border">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate flex-1"
              >
                {file.name}
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(idx)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
