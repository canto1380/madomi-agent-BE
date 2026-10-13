import { z } from 'zod';
import { buscarPoliticasKeyword } from '../rag/buscarPoliticas.js';

const argsSchema = z.object({
  localidad: z.string().min(2),
  departamento: z.string().min(2),
});

export const consultarEnvioTool = {
  name: 'consultarEnvio',
  description:
    'Consulta información de envío para una localidad y departamento (v1: políticas documentadas).',
  parameters: {
    type: 'object',
    properties: {
      localidad: { type: 'string' },
      departamento: { type: 'string' },
    },
    required: ['localidad', 'departamento'],
  },
  async execute(rawArgs, ctx) {
    const args = argsSchema.parse(rawArgs);
    const consulta = `envío entrega ${args.localidad} ${args.departamento} Tucumán costo plazo zona`;
    const politicas = await buscarPoliticasKeyword(ctx.empresaId, consulta, { topK: 5 });
    return {
      localidad: args.localidad,
      departamento: args.departamento,
      fuente: 'politicas_entrega',
      requiereValidacionManual: politicas.chunks.length === 0,
      politicas,
    };
  },
};
