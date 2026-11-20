CREATE TABLE "QrCode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "destinationPath" TEXT NOT NULL DEFAULT '/',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QrScan" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceType" TEXT NOT NULL,
    "visitorHash" TEXT NOT NULL,

    CONSTRAINT "QrScan_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "User"
ADD COLUMN "registrationQrCodeId" TEXT,
ADD COLUMN "registrationQrScannedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "QrCode_slug_key" ON "QrCode"("slug");
CREATE INDEX "QrScan_qrCodeId_scannedAt_idx" ON "QrScan"("qrCodeId", "scannedAt");
CREATE INDEX "QrScan_qrCodeId_visitorHash_scannedAt_idx" ON "QrScan"("qrCodeId", "visitorHash", "scannedAt");
CREATE INDEX "User_registrationQrCodeId_registrationQrScannedAt_idx" ON "User"("registrationQrCodeId", "registrationQrScannedAt");

ALTER TABLE "QrScan"
ADD CONSTRAINT "QrScan_qrCodeId_fkey"
FOREIGN KEY ("qrCodeId") REFERENCES "QrCode"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "User"
ADD CONSTRAINT "User_registrationQrCodeId_fkey"
FOREIGN KEY ("registrationQrCodeId") REFERENCES "QrCode"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
