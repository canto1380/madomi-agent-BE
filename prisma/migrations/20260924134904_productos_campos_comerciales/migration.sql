-- AlterTable
ALTER TABLE "Productos" ADD COLUMN     "activoComercial" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ofertaDesde" TIMESTAMP(3),
ADD COLUMN     "ofertaHasta" TIMESTAMP(3),
ADD COLUMN     "ofertaPorcentaje" INTEGER,
ADD COLUMN     "precioMayorista" DECIMAL(12,2),
ADD COLUMN     "precioMinorista" DECIMAL(12,2),
ADD COLUMN     "stockUnidades" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unidadStock" TEXT NOT NULL DEFAULT 'un';

-- CreateIndex
CREATE INDEX "Productos_activoComercial_idx" ON "Productos"("activoComercial");
