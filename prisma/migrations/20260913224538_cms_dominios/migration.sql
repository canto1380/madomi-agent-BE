-- CreateTable
CREATE TABLE "Categorias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContenidoTextos" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "seccion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'texto',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContenidoTextos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionBranding" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "colorPrimario" TEXT NOT NULL,
    "colorPrimarioOscuro" TEXT NOT NULL,
    "colorSecundario" TEXT NOT NULL,
    "colorAcento" TEXT NOT NULL,
    "colorFondo" TEXT NOT NULL,
    "colorFondoOscuro" TEXT NOT NULL,
    "colorTexto" TEXT NOT NULL,
    "colorTextoClaro" TEXT NOT NULL,
    "colorError" TEXT NOT NULL,
    "colorExito" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "logoAlt" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionBranding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracionContacto" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "telefono" TEXT NOT NULL,
    "telefonoLink" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "horario" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracionContacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductosDestacados" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "seccion" TEXT NOT NULL DEFAULT 'lo_ultimo',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductosDestacados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAssets" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAssets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RedesSociales" (
    "id" TEXT NOT NULL,
    "plataforma" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RedesSociales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Categorias_slug_key" ON "Categorias"("slug");

-- CreateIndex
CREATE INDEX "Categorias_activo_idx" ON "Categorias"("activo");

-- CreateIndex
CREATE INDEX "Categorias_orden_idx" ON "Categorias"("orden");

-- CreateIndex
CREATE UNIQUE INDEX "ContenidoTextos_clave_key" ON "ContenidoTextos"("clave");

-- CreateIndex
CREATE INDEX "ContenidoTextos_seccion_idx" ON "ContenidoTextos"("seccion");

-- CreateIndex
CREATE INDEX "ContenidoTextos_activo_idx" ON "ContenidoTextos"("activo");

-- CreateIndex
CREATE INDEX "ProductosDestacados_seccion_activo_idx" ON "ProductosDestacados"("seccion", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "ProductosDestacados_productoId_seccion_key" ON "ProductosDestacados"("productoId", "seccion");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAssets_clave_key" ON "MediaAssets"("clave");

-- CreateIndex
CREATE INDEX "MediaAssets_activo_idx" ON "MediaAssets"("activo");

-- CreateIndex
CREATE INDEX "MediaAssets_tipo_idx" ON "MediaAssets"("tipo");

-- CreateIndex
CREATE INDEX "RedesSociales_activo_idx" ON "RedesSociales"("activo");

-- CreateIndex
CREATE INDEX "RedesSociales_orden_idx" ON "RedesSociales"("orden");

-- AddForeignKey
ALTER TABLE "ProductosDestacados" ADD CONSTRAINT "ProductosDestacados_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
