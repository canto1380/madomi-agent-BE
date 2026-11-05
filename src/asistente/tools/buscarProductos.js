import { z } from 'zod';
import { mapearProductoComercialTool } from '../productoComercial.js';
import { listarIdsProductosNovedades } from '../novedades/listarIdsNovedades.js';
import { normalizarTerminoBusqueda } from '../intent/normalizarTerminoBusqueda.js';
import { listarCategoriasActivasRepositorio } from '../../repositories/categorias.repository.js';
import { resolverCategoriaDesdeTexto } from '../busqueda/resolverCategoriaBusqueda.js';
import { agregarProductoInteresLeadRepositorio } from '../../mongo/repositories/leads.repository.js';
import { buscarProductosComercial } from '../busqueda/buscarProductosComercial.js';

const argsSchema = z.object({
  search: z.string().optional(),
  categoria: z.string().optional(),
  listarCatalogo: z.boolean().optional(),
  novedades: z.boolean().optional(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const buscarProductosTool = {
  name: 'buscarProductos',
  description:
    'Catálogo comercial en Postgres (todos los productos activos comercialmente, actuales y futuros). Busca por texto en nombre/categoría/descripción/id (similitud en backend) o listado/novedades.',
  parameters: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Texto a buscar en nombre, categoría o id' },
      categoria: { type: 'string', description: 'Filtrar por categoría exacta' },
      listarCatalogo: {
        type: 'boolean',
        description: 'true = listado general del catálogo (sin search)',
      },
      novedades: {
        type: 'boolean',
        description: 'true = productos destacados sección novedades (lo_ultimo)',
      },
      limit: { type: 'number', description: 'Máximo resultados (default 20)' },
    },
  },
  async execute(rawArgs, ctx) {
    const args = argsSchema.parse(rawArgs);
    const limit = args.listarCatalogo ? 80 : args.limit ?? 20;
    const searchNorm = args.search ? normalizarTerminoBusqueda(args.search) : undefined;

    let categoriaFiltro = args.categoria;
    if (!categoriaFiltro && searchNorm) {
      const categoriasActivas = await listarCategoriasActivasRepositorio();
      categoriaFiltro = resolverCategoriaDesdeTexto(searchNorm, categoriasActivas) ?? undefined;
    }

    const idsNovedades = args.novedades ? await listarIdsProductosNovedades() : undefined;

    const busqueda = await buscarProductosComercial({
      search: args.listarCatalogo || args.novedades ? undefined : args.search,
      categoria: categoriaFiltro,
      limit: args.novedades ? Math.max(idsNovedades?.length ?? 0, 1) : limit,
      ids: idsNovedades,
      listarCatalogo: args.listarCatalogo,
      novedades: args.novedades,
      idsNovedades,
    });

    const rows = busqueda.rows;

    if (ctx.leadId) {
      for (const row of rows.slice(0, 8)) {
        await agregarProductoInteresLeadRepositorio(ctx.leadId, {
          productoId: row.id,
          nombreSnapshot: row.nombre,
          categoriaSnapshot: row.categoria,
        });
      }
    }

    const productos = rows.map(mapearProductoComercialTool);

    return {
      status: productos.length > 0 ? 'coincidencias' : 'sin_coincidencias',
      consulta: busqueda.consultaOriginal,
      consultaNormalizada: busqueda.consultaNormalizada,
      total: productos.length,
      productos,
    };
  },
};
