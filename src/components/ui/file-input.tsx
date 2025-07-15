
"use client";

import * as React from "react";
import { Upload } from "lucide-react";

import { cn } from "@/lib/utils";

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onSelect'> {
  onFileSelect: (files: FileList | null) => void;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ className, onFileSelect, ...props }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const finalRef = (ref || internalRef) as React.RefObject<HTMLInputElement>;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onFileSelect(e.target.files);
    };

    return (
      <div className="flex-1">
        <input
          type="file"
          className="sr-only"
          ref={finalRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          {...props}
        />
        <label
          htmlFor={props.id}
          onClick={() => finalRef.current?.click()}
          className={cn(
            "flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer hover:bg-accent hover:text-accent-foreground",
            className
          )}
        >
          <Upload className="mr-2 h-4 w-4" />
          <span>Upload Image</span>
        </label>
      </div>
    );
  }
);
FileInput.displayName = "FileInput";

export { FileInput };
