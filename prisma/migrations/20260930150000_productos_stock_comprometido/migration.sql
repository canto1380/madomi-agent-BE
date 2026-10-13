-- Stock reservado al cerrar venta (hasta entrega o cancelación).
ALTER TABLE "Productos" ADD COLUMN "stockComprometidoUnidades" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "Productos_stockComprometidoUnidades_idx" ON "Productos"("stockComprometidoUnidades");
