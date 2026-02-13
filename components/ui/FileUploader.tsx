
import React, { useRef } from 'react';
import { Upload, FileText, X, FileType } from 'lucide-react';

interface FileUploaderProps {
  label?: string;
  sublabel?: string;
  accept?: string;
  multiple?: boolean;
  files?: File[] | File | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: (index?: number) => void;
  variant?: 'default' | 'compact';
  icon?: React.ElementType;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  label = "Dokument(e) hier ablegen", 
  sublabel = "Unterstützt: PDF, Word (.docx), Text (.txt) - Max. 20MB", 
  accept = ".pdf,.docx,.txt", 
  multiple = false,
  files,
  onFileChange,
  onRemove,
  variant = 'default',
  icon: Icon = Upload
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize files to array for display
  const fileList = Array.isArray(files) ? files : files ? [files] : [];

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (onRemove) onRemove(index);
  };

  // If files are selected, show the "Selected State"
  if (fileList.length > 0 && !multiple) {
    // Single file display mode (replacement style)
    return (
      <div 
        onClick={handleClick}
        className="group relative w-full p-6 border-2 border-firm-navy/20 bg-firm-navy/5 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-firm-navy/10 transition-all"
      >
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 text-firm-navy shadow-sm">
           <FileText size={24} />
        </div>
        <h3 className="text-sm font-bold text-firm-navy mb-1 truncate max-w-xs">{fileList[0].name}</h3>
        <p className="text-xs text-slate-500 mb-2">{(fileList[0].size / 1024).toFixed(0)} KB • Klicken zum Austauschen</p>
        
        {onRemove && (
           <button 
             onClick={(e) => handleRemove(e, 0)}
             className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
             title="Entfernen"
           >
             <X size={16} />
           </button>
        )}
        <input 
          type="file" 
          ref={inputRef}
          className="hidden" 
          accept={accept}
          onChange={onFileChange} 
        />
      </div>
    );
  }

  // Default Empty State
  return (
    <div className="w-full">
      {/* List for multiple files if any exist */}
      {multiple && fileList.length > 0 && (
        <div className="space-y-2 mb-3">
          {fileList.map((f, idx) => (
             <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                    <FileText size={16} className="text-firm-navy shrink-0" />
                    <span className="text-sm font-medium text-slate-700 truncate">{f.name}</span>
                </div>
                {onRemove && (
                  <button onClick={(e) => handleRemove(e, idx)} className="text-slate-400 hover:text-red-500">
                    <X size={16} />
                  </button>
                )}
             </div>
          ))}
        </div>
      )}

      <div 
        onClick={handleClick}
        className={`
          relative w-full border-2 border-dashed border-slate-300 rounded-xl 
          flex flex-col items-center justify-center text-center cursor-pointer transition-all group
          hover:border-firm-navy/50 hover:bg-slate-50
          ${variant === 'compact' ? 'p-4' : 'p-8'}
        `}
      >
        <div className={`
          rounded-full bg-slate-100 text-slate-500 group-hover:bg-firm-navy group-hover:text-white transition-colors flex items-center justify-center mb-3
          ${variant === 'compact' ? 'w-8 h-8' : 'w-12 h-12'}
        `}>
           <Icon size={variant === 'compact' ? 16 : 24} />
        </div>
        
        <h3 className={`font-bold text-firm-navy ${variant === 'compact' ? 'text-xs' : 'text-sm'} mb-1`}>
            {label}
        </h3>
        
        {sublabel && (
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">{sublabel}</p>
        )}

        <input 
          type="file" 
          ref={inputRef}
          className="hidden" 
          accept={accept}
          multiple={multiple}
          onChange={onFileChange} 
        />
      </div>
    </div>
  );
};

export default FileUploader;
