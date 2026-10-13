import { z } from 'zod';
import { listarProductosComercialesRepositorio } from '../../repositories/productos.repository.js';
import { mapearProductoComercialTool } from '../productoComercial.js';
import { listarIdsProductosNovedades } from '../novedades/listarIdsNovedades.js';
import { normalizarTerminoBusqueda } from '../intent/normalizarTerminoBusqueda.js';
import { listarCategoriasActivasRepositorio } from '../../repositories/categorias.repository.js';
import { resolverCategoriaDesdeTexto } from '../busqueda/resolverCategoriaBusqueda.js';
import { agregarProductoInteresLeadRepositorio } from '../../mongo/repositories/leads.repository.js';

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
    'Busca productos activos comercialmente por texto (tolera typos y nombres parecidos) o categoría activa en Postgres.',
  parameters: {
    type: 'object',
    properties: {
      search: { type: 'string', description: 'Texto a buscar en nombre, categoría o id' },
      categoria: { type: 'string', description: 'Filtrar por categoría exacta' },
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

    const rows = await listarProductosComercialesRepositorio({
      search: args.listarCatalogo || args.novedades ? undefined : searchNorm,
      categoria: categoriaFiltro,
      ids: idsNovedades,
      limit: args.novedades ? Math.max(idsNovedades?.length ?? 0, 1) : limit,
    });

    if (ctx.leadId) {
      for (const row of rows.slice(0, 8)) {
        await agregarProductoInteresLeadRepositorio(ctx.leadId, {
          productoId: row.id,
          nombreSnapshot: row.nombre,
          categoriaSnapshot: row.categoria,
        });
      }
    }

    return {
      total: rows.length,
      productos: rows.map(mapearProductoComercialTool),
    };
  },
};
