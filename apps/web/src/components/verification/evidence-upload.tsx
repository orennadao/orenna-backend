'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button, Card, CardContent } from '@orenna/ui';
import { type EvidenceSubmission, VWBA_EVIDENCE_TYPES } from '@orenna/api-client';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Download,
  MapPin,
  Calendar
} from 'lucide-react';

interface EvidenceUploadProps {
  requiredTypes: string[];
  onFilesChange: (files: EvidenceSubmission[]) => void;
  files: EvidenceSubmission[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  evidenceType: string;
  metadata: Record<string, any>;
  captureDate?: string;
  captureLocation?: {
    latitude: number;
    longitude: number;
  };
  captureDevice?: string;
}

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  WATER_MEASUREMENT_DATA: 'Water Measurement Data',
  BASELINE_ASSESSMENT: 'Baseline Assessment',
  SITE_VERIFICATION: 'Site Verification',
  GPS_COORDINATES: 'GPS Coordinates',
  METHODOLOGY_DOCUMENTATION: 'Methodology Documentation',
};

const ACCEPTED_FILE_TYPES = {
  'text/csv': ['.csv'],
  'application/json': ['.json'],
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/plain': ['.txt'],
};

export function EvidenceUpload({ 
  requiredTypes, 
  onFilesChange, 
  files,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 10
}: EvidenceUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const processFiles = useCallback(async (acceptedFiles: File[]) => {
    const newErrors: string[] = [];
    const newFiles: FileWithPreview[] = [];

    for (const file of acceptedFiles) {
      // Validate file size
      if (file.size > maxFileSize) {
        newErrors.push(`${file.name}: File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`);
        continue;
      }

      // Check total file count
      if (uploadedFiles.length + newFiles.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      // Create file preview for images
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      // Default evidence type (user can change later)
      const evidenceType = requiredTypes[0] || 'METHODOLOGY_DOCUMENTATION';

      newFiles.push({
        file,
        preview,
        evidenceType,
        metadata: {
          originalSize: file.size,
          uploadedAt: new Date().toISOString(),
        },
        captureDate: new Date().toISOString(),
      });
    }

    setErrors(newErrors);
    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    
    // Convert to EvidenceSubmission format
    const evidenceSubmissions = await Promise.all(
      updatedFiles.map(async (fileWithPreview) => {
        const base64Content = await fileToBase64(fileWithPreview.file);
        return {
          evidenceType: fileWithPreview.evidenceType,
          fileName: fileWithPreview.file.name,
          fileContent: base64Content,
          mimeType: fileWithPreview.file.type,
          captureDate: fileWithPreview.captureDate,
          captureLocation: fileWithPreview.captureLocation,
          captureDevice: fileWithPreview.captureDevice,
          metadata: fileWithPreview.metadata,
        };
      })
    );

    onFilesChange(evidenceSubmissions);
  }, [uploadedFiles, maxFileSize, maxFiles, requiredTypes, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: processFiles,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: maxFileSize,
    disabled: uploadedFiles.length >= maxFiles,
  });

  const removeFile = (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    
    // Clean up preview URLs
    if (uploadedFiles[index].preview) {
      URL.revokeObjectURL(uploadedFiles[index].preview!);
    }
    
    // Update evidence submissions
    const evidenceSubmissions = files.filter((_, i) => i !== index);
    onFilesChange(evidenceSubmissions);
  };

  const updateFileMetadata = (index: number, updates: Partial<FileWithPreview>) => {
    const updatedFiles = [...uploadedFiles];
    updatedFiles[index] = { ...updatedFiles[index], ...updates };
    setUploadedFiles(updatedFiles);
    
    // Update evidence submissions
    const updatedEvidence = [...files];
    if (updatedEvidence[index]) {
      updatedEvidence[index] = {
        ...updatedEvidence[index],
        evidenceType: updates.evidenceType || updatedEvidence[index].evidenceType,
        captureDate: updates.captureDate || updatedEvidence[index].captureDate,
        captureLocation: updates.captureLocation || updatedEvidence[index].captureLocation,
        captureDevice: updates.captureDevice || updatedEvidence[index].captureDevice,
        metadata: { ...updatedEvidence[index].metadata, ...updates.metadata },
      };
    }
    onFilesChange(updatedEvidence);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5" />;
    if (mimeType.includes('csv') || mimeType.includes('excel') || mimeType.includes('sheet')) 
      return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50'
        } ${uploadedFiles.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-primary">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-sm font-medium">
              Drop evidence files here, or click to select
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports CSV, JSON, PDF, Images, Excel files up to {Math.round(maxFileSize / 1024 / 1024)}MB
            </p>
            <p className="text-xs text-muted-foreground">
              Maximum {maxFiles} files • {uploadedFiles.length}/{maxFiles} uploaded
            </p>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Required Evidence Types */}
      <div className="p-4 border border-border rounded-lg bg-muted/50">
        <h4 className="font-medium mb-2">Required Evidence Types</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {requiredTypes.map((type) => {
            const hasFile = uploadedFiles.some(f => f.evidenceType === type);
            return (
              <div key={type} className="flex items-center gap-2 text-sm">
                {hasFile ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <div className="h-4 w-4 border border-muted-foreground rounded-full" />
                )}
                <span className={hasFile ? 'text-green-700' : 'text-muted-foreground'}>
                  {EVIDENCE_TYPE_LABELS[type] || type}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Uploaded Files ({uploadedFiles.length})</h4>
          {uploadedFiles.map((fileWithPreview, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* File Preview */}
                  <div className="flex-shrink-0">
                    {fileWithPreview.preview ? (
                      <img
                        src={fileWithPreview.preview}
                        alt={fileWithPreview.file.name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 border border-border rounded flex items-center justify-center">
                        {getFileIcon(fileWithPreview.file.type)}
                      </div>
                    )}
                  </div>

                  {/* File Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium truncate">{fileWithPreview.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(fileWithPreview.file.size)} • {fileWithPreview.file.type}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Evidence Type Selector */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Evidence Type
                        </label>
                        <select
                          value={fileWithPreview.evidenceType}
                          onChange={(e) => updateFileMetadata(index, { evidenceType: e.target.value })}
                          className="w-full mt-1 px-2 py-1 text-sm border border-border rounded"
                        >
                          {requiredTypes.map((type) => (
                            <option key={type} value={type}>
                              {EVIDENCE_TYPE_LABELS[type] || type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Capture Date
                        </label>
                        <input
                          type="datetime-local"
                          value={fileWithPreview.captureDate?.slice(0, 16) || ''}
                          onChange={(e) => updateFileMetadata(index, { 
                            captureDate: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                          })}
                          className="w-full mt-1 px-2 py-1 text-sm border border-border rounded"
                        />
                      </div>
                    </div>

                    {/* Optional Metadata */}
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          Capture Device (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Flow Meter Model XYZ-123"
                          value={fileWithPreview.captureDevice || ''}
                          onChange={(e) => updateFileMetadata(index, { captureDevice: e.target.value })}
                          className="w-full mt-1 px-2 py-1 text-sm border border-border rounded"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium text-muted-foreground">
                          GPS Coordinates (Optional)
                        </label>
                        <div className="flex gap-1 mt-1">
                          <input
                            type="number"
                            placeholder="Lat"
                            step="any"
                            value={fileWithPreview.captureLocation?.latitude || ''}
                            onChange={(e) => updateFileMetadata(index, {
                              captureLocation: {
                                ...fileWithPreview.captureLocation,
                                latitude: parseFloat(e.target.value) || 0,
                                longitude: fileWithPreview.captureLocation?.longitude || 0,
                              }
                            })}
                            className="w-full px-2 py-1 text-xs border border-border rounded"
                          />
                          <input
                            type="number"
                            placeholder="Lng"
                            step="any"
                            value={fileWithPreview.captureLocation?.longitude || ''}
                            onChange={(e) => updateFileMetadata(index, {
                              captureLocation: {
                                latitude: fileWithPreview.captureLocation?.latitude || 0,
                                longitude: parseFloat(e.target.value) || 0,
                              }
                            })}
                            className="w-full px-2 py-1 text-xs border border-border rounded"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Progress/Status */}
      {uploadedFiles.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>
              {uploadedFiles.length} file(s) ready for submission
            </span>
          </div>
          <p className="text-xs mt-1">
            Files will be uploaded to IPFS when the verification request is submitted
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:text/csv;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}