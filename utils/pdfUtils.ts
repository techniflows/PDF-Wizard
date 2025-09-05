export const loadPdfJs = async () => {
  if (typeof window === 'undefined') return null;
  
  const pdfjsLib = await import('pdfjs-dist');
  
  // Use local worker file
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  
  return pdfjsLib;
};

// Generate thumbnail for a PDF page
const generatePageThumbnail = async (pdf: any, pageNumber: number): Promise<string> => {
  try {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 }); // Higher scale for better quality thumbnail
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Set high quality rendering
    if (context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
    }
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    return canvas.toDataURL('image/png'); // Use PNG for better quality (no compression)
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error);
    return ''; // Return empty string if thumbnail generation fails
  }
};

export const extractPdfPages = async (file: File) => {
  const pdfjsLib = await loadPdfJs();
  if (!pdfjsLib) return [];
  
  // Use a fresh ArrayBuffer for PDF.js processing
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  
  const pages = [];
  const pdfGroupId = `pdf-${Date.now()}-${Math.random()}`;
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    // Generate thumbnail for this page
    const thumbnailUrl = await generatePageThumbnail(pdf, pageNum);
    
    pages.push({
      id: `${Date.now()}-${Math.random()}-page-${pageNum}`,
      name: `Page ${pageNum}/${numPages}`,
      type: file.type,
      url: thumbnailUrl || URL.createObjectURL(file), // Use thumbnail or fallback to blob URL
      blob: file, // Store the original blob for generating fresh ArrayBuffers
      arrayBuffer: undefined, // Don't store ArrayBuffer, generate fresh ones when needed
      pageNumber: pageNum,
      totalPages: numPages,
      pdfGroupId: pdfGroupId,
      originalFileName: file.name,
      thumbnailUrl: thumbnailUrl, // Store thumbnail URL separately
    });
  }
  
  return pages;
};