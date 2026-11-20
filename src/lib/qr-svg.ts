import QRCode from "qrcode";

const QR_SIZE = 1024;
const QUIET_ZONE = 4;
const QR_DARK = "#003b70";
const QR_LIGHT = "#ffffff";

export function createQrSvg(value: string) {
  const matrix = QRCode.create(value, { errorCorrectionLevel: "H" });
  const gridSize = matrix.modules.size;
  const qrSize = gridSize + QUIET_ZONE * 2;
  const viewHeight = qrSize + 5;
  const height = Math.ceil((QR_SIZE * viewHeight) / qrSize);
  let path = "";

  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      if (matrix.modules.get(row, column)) {
        const x = column + QUIET_ZONE;
        const y = row + QUIET_ZONE;
        path += `M${x} ${y}h1v1h-1z`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${QR_SIZE}" height="${height}" viewBox="0 0 ${qrSize} ${viewHeight}"><title>Girls in Tech QR code</title><rect width="${qrSize}" height="${viewHeight}" fill="${QR_LIGHT}"/><path d="${path}" fill="${QR_DARK}" shape-rendering="crispEdges"/><text x="${qrSize / 2}" y="${qrSize + 3.2}" fill="${QR_DARK}" font-family="Arial, sans-serif" font-size="1.5" text-anchor="middle">Scan to join Girls in Tech</text></svg>`;
}
