
import { marked } from 'marked';

/**
 * Copies Markdown content to clipboard as both Rich Text (HTML) and Plain Text.
 * Optimized for pasting into Microsoft Word / Outlook (Kanzlei-Standard).
 */
export const copyRichText = async (markdown: string): Promise<boolean> => {
  try {
    // 1. Convert Markdown to HTML
    const rawHtml = await marked.parse(markdown);
    
    // 2. Wrap in a styling shell to ensure it looks professional in Word
    // "Kanzlei-Style": Arial/Calibri, clean headers, no weird backgrounds.
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
      <meta charset='utf-8'>
      <style>
        body { 
            font-family: 'Arial', 'Calibri', sans-serif; 
            font-size: 11pt; 
            color: #000000; 
            line-height: 1.3;
        }
        h1 { 
            font-size: 14pt; 
            font-weight: bold; 
            color: #202124; 
            margin-bottom: 12px; 
            margin-top: 0;
        }
        h2 { 
            font-size: 12pt; 
            font-weight: bold; 
            color: #202124; 
            margin-top: 18px; 
            margin-bottom: 6px; 
            text-decoration: underline;
        }
        h3 { 
            font-size: 11pt; 
            font-weight: bold; 
            color: #202124; 
            margin-top: 12px; 
            margin-bottom: 4px; 
        }
        p { margin-bottom: 8px; margin-top: 0; }
        ul { margin-bottom: 8px; margin-top: 0; padding-left: 24px; }
        li { margin-bottom: 4px; }
        
        /* Remove code block styling for cleaner Word paste */
        code { font-family: 'Courier New', monospace; font-size: 10pt; }
        pre { background: none; border: none; padding: 0; }
        
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin-bottom: 12px; 
            font-size: 10pt;
            border: 1px solid #d1d5db;
        }
        th { 
            border: 1px solid #d1d5db; 
            text-align: left; 
            padding: 6px; 
            font-weight: bold; 
            background-color: #f3f4f6;
        }
        td { 
            border: 1px solid #d1d5db; 
            padding: 6px; 
            vertical-align: top; 
        }
        blockquote {
            border-left: 3px solid #9ca3af;
            margin-left: 12px;
            padding-left: 12px;
            color: #374151;
            font-style: italic;
        }
        /* Highlight specific red/green colors if used in spans */
        .text-red-600 { color: #dc2626; }
        .text-emerald-600 { color: #059669; }
      </style>
      </head>
      <body>
        ${rawHtml}
        <br>
        <p style="font-size: 8pt; color: #6b7280; margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 6px;">
            Erstellt mit LegalThink (KI-Assistenz für Rechtsanwälte). Freigegeben durch: [Name]
        </p>
      </body>
      </html>
    `;

    // 3. Create Blobs
    const blobHtml = new Blob([fullHtml], { type: "text/html" });
    const blobText = new Blob([markdown], { type: "text/plain" });

    // 4. Write to Clipboard using Clipboard API
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": blobHtml,
        "text/plain": blobText,
      }),
    ]);
    
    return true;
  } catch (err) {
    console.error("Rich text copy failed, falling back to plain text", err);
    // Fallback logic
    try {
        await navigator.clipboard.writeText(markdown);
        return true;
    } catch (e) {
        return false;
    }
  }
};
