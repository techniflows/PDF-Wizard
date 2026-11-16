export interface NamedBlob {
  name: string;
  blob: Blob;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  // iOS Safari cancels the download when the URL is revoked in the same tick.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function downloadFilesOrZip(files: NamedBlob[], zipName: string) {
  if (files.length === 1) {
    downloadBlob(files[0].blob, files[0].name);
    return;
  }

  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const { name, blob } of files) {
    zip.file(name, blob);
  }
  downloadBlob(await zip.generateAsync({ type: 'blob' }), zipName);
}
