export function invitationShareText(message: string, url: string): string {
  const text = message.trim().replaceAll('[link]', url);
  return text.includes(url) ? text : `${text}\n\n${url}`;
}
export async function shareCollectionLink(
  title: string,
  url: string,
  message?: string,
): Promise<string> {
  try {
    if (navigator.share) {
      await navigator.share(
        message ? { title, text: invitationShareText(message, url) } : { title, url },
      );
      return 'Share sheet opened.';
    }
    await navigator.clipboard.writeText(message ? invitationShareText(message, url) : url);
    return message
      ? 'Invitation and link copied. Share them in your favourite app.'
      : 'Link copied. Share it in your favourite app.';
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === 'AbortError') return '';
    return 'Sharing is unavailable. Use Copy link instead.';
  }
}

/** Shares a QR image through the OS share sheet, without saving a download. */
export async function shareCollectionQr(
  svg: SVGSVGElement,
  title: string,
  url: string,
): Promise<string> {
  try {
    if (!navigator.canShare || !navigator.share)
      return 'Show this QR code to scan it, or share the link.';
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const size = svg.viewBox.baseVal.width;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('viewBox', `-4 -4 ${size + 8} ${size + 8}`);
    clone.setAttribute('width', '512');
    clone.setAttribute('height', '512');
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('x', '-4');
    background.setAttribute('y', '-4');
    background.setAttribute('width', String(size + 8));
    background.setAttribute('height', String(size + 8));
    background.setAttribute('fill', '#fff');
    clone.prepend(background);
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (!context) return 'Show this QR code to scan it, or share the link.';
    context.drawImage(img, 0, 0, 512, 512);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) return 'Show this QR code to scan it, or share the link.';
    const files = [new File([blob], 'chip-in-qr.png', { type: 'image/png' })];
    if (!navigator.canShare({ files }))
      return 'QR image sharing is unavailable here. Share the link or scan this code.';
    await navigator.share({ title, text: url, files });
    return 'QR share sheet opened.';
  } catch (reason) {
    if (reason instanceof DOMException && reason.name === 'AbortError') return '';
    return 'QR image sharing is unavailable here. Share the link or scan this code.';
  }
}
