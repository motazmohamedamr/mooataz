export function mimeTypeFromExtension(extension: string): string {
  // Normalize the extension (remove dot if present and make it lowercase)
  const ext = extension.toLowerCase().replace(/^\./, '');

  // Define a lookup object for known MIME types
  const mimeTypes: Record<string, string> = {
    html: 'text/html',
    htm: 'text/html',
    js: 'application/javascript',
    json: 'application/json',
    css: 'text/css',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    txt: 'text/plain',
    xml: 'application/xml',
    zip: 'application/zip',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    csv: 'text/csv',
    rar: 'application/x-rar-compressed',
    tar: 'application/x-tar',
    '7z': 'application/x-7z-compressed',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    flv: 'video/x-flv',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}
