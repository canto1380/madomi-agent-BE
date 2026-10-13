/** Códigos de permiso — sincronizar con seed y frontend `permisosAdmin.js` */

export const PERMISOS_CMS = {
  LEER: 'cms.leer',
  EDITAR: 'cms.editar',
};

export const PERMISOS_COMERCIAL = {
  LEER: 'comercial.leer',
  ESCRIBIR: 'comercial.escribir',
  CONTEXTO_PUBLICAR: 'comercial.contexto.publicar',
};

export const PERMISOS_PANEL_SEED = [
  { codigo: PERMISOS_CMS.LEER, descripcion: 'Ver panel CMS (contenido del sitio)' },
  { codigo: PERMISOS_CMS.EDITAR, descripcion: 'Crear y editar contenido del sitio' },
  { codigo: PERMISOS_COMERCIAL.LEER, descripcion: 'Ver CRM: leads, pedidos, conversaciones y métricas' },
  { codigo: PERMISOS_COMERCIAL.ESCRIBIR, descripcion: 'Actualizar leads, pedidos y notas comerciales' },
  {
    codigo: PERMISOS_COMERCIAL.CONTEXTO_PUBLICAR,
    descripcion: 'Publicar políticas y contexto del asistente (MD/PDF)',
  },
];
