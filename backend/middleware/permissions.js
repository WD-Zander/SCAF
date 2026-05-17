/**
 * requirePermission(...requiredPerms)
 *
 * Verifica que el usuario autenticado tenga AL MENOS UNO de los permisos listados.
 * El wildcard "all" siempre pasa (SuperAdmin).
 *
 * Uso: router.delete('/:id', requirePermission('inventory_delete'), deleteAsset);
 * Uso: router.get('/', requirePermission('inventory_view', 'inventory_edit'), getAssets);
 */
export const requirePermission = (...requiredPerms) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado.' });
  }

  const userPerms = req.user.permisos || [];

  // "all" = superadmin bypass
  if (userPerms.includes('all')) return next();

  const hasAny = requiredPerms.some(p => userPerms.includes(p));
  if (!hasAny) {
    return res.status(403).json({ error: 'No tienes permisos para esta acción.' });
  }

  next();
};
