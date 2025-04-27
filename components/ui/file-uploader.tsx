"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FileUploaderProps {
  onFilesSelected: (files: FileList | null) => void
  accept?: string
  maxSize?: number
  multiple?: boolean
  id?: string
}

export function FileUploader({
  onFilesSelected,
  accept = "*",
  maxSize = 100, // Default 100MB for larger files
  multiple = true,
  id = "file-uploader",
}: FileUploaderProps) {
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    validateAndProcessFiles(files)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    validateAndProcessFiles(files)
  }

  const validateAndProcessFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    // Check file size - increased to support larger files
    const oversizedFiles = Array.from(files).filter((file) => file.size > maxSize * 1024 * 1024)

    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: `Some files exceed the maximum size of ${maxSize}MB.`,
        variant: "destructive",
      })
      return
    }

    onFilesSelected(files)
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center gap-2">
        <Upload className="h-10 w-10 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Drag and drop files here, or click to select</p>
          <p className="text-xs text-muted-foreground">
            {multiple ? "Files" : "File"} up to {maxSize}MB
            {accept !== "*" && ` (${accept.replace(/\./g, "").toUpperCase()})`}
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleButtonClick}>
          Select File{multiple && "s"}
        </Button>
      </div>
    </div>
  )
}
