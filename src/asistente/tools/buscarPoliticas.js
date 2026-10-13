import { z } from 'zod';
import { buscarPoliticasKeyword } from '../rag/buscarPoliticas.js';

const argsSchema = z.object({
  consulta: z.string().min(2),
});

export const buscarPoliticasTool = {
  name: 'buscarPoliticas',
  description: 'Busca información de políticas de entrega, demoras, zonas y FAQ.',
  parameters: {
    type: 'object',
    properties: {
      consulta: { type: 'string', description: 'Pregunta o tema sobre envíos y logística' },
    },
    required: ['consulta'],
  },
  async execute(rawArgs, ctx) {
    const args = argsSchema.parse(rawArgs);
    const resultado = await buscarPoliticasKeyword(ctx.empresaId, args.consulta);
    return resultado;
  },
};
