
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
        className="group relative w-full p-6 border-2 border-firm-slate/15 bg-firm-paper/30 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-firm-accent hover:bg-firm-paper/80 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]"
      >
        <div className="w-14 h-14 bg-firm-card rounded-2xl flex items-center justify-center mb-4 text-firm-navy shadow-sm border border-firm-slate/5 group-hover:scale-105 transition-transform duration-300">
          <FileText size={26} strokeWidth={1.5} />
        </div>
        <h3 className="text-[14px] font-bold text-firm-navy mb-1.5 truncate max-w-xs">{fileList[0].name}</h3>
        <p className="text-[12px] font-medium text-firm-slate/50 mb-2 uppercase tracking-wider">{(fileList[0].size / 1024).toFixed(0)} KB • Klicken zum Austauschen</p>

        {onRemove && (
          <button
            onClick={(e) => handleRemove(e, 0)}
            className="absolute top-4 right-4 p-2 text-firm-slate/40 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            title="Entfernen"
          >
            <X size={18} />
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
        <div className="space-y-3 mb-4">
          {fileList.map((f, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-firm-card border border-firm-slate/10 rounded-xl shadow-sm hover:border-firm-slate/20 transition-colors">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="p-2 bg-firm-paper rounded-lg">
                  <FileText size={18} className="text-firm-navy shrink-0" strokeWidth={1.5} />
                </div>
                <span className="text-[14px] font-medium text-firm-navy truncate">{f.name}</span>
              </div>
              {onRemove && (
                <button onClick={(e) => handleRemove(e, idx)} className="text-firm-slate/40 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        onClick={handleClick}
        className={`
          relative w-full border-2 border-dashed border-firm-slate/20 rounded-2xl 
          flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 group
          hover:border-firm-accent hover:bg-firm-paper/30
          ${variant === 'compact' ? 'p-5' : 'p-10'}
        `}
      >
        <div className={`
          rounded-2xl bg-firm-paper border border-firm-slate/5 text-firm-navy group-hover:bg-[#05050A] group-hover:border-[#05050A] group-hover:text-white dark:group-hover:bg-firm-accent dark:group-hover:text-[#05050A] transition-all duration-300 flex items-center justify-center mb-4 shadow-sm group-hover:shadow group-hover:scale-105
          ${variant === 'compact' ? 'w-10 h-10' : 'w-14 h-14'}
        `}>
          <Icon size={variant === 'compact' ? 20 : 28} strokeWidth={1.5} />
        </div>

        <h3 className={`font-bold text-firm-navy ${variant === 'compact' ? 'text-[13px] uppercase tracking-wider' : 'text-base tracking-wide'} mb-2`}>
          {label}
        </h3>

        {sublabel && (
          <p className="text-[13px] text-firm-slate/60 max-w-sm mx-auto leading-relaxed font-medium">{sublabel}</p>
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
