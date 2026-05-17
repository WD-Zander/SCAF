-- ============================================================
-- FIX: Propagar ID_SCOPE a todas las categorías hijas
-- Las categorías hijas heredan el ID_SCOPE de su ancestro raíz
-- ============================================================

-- Propagar hasta 4 niveles de profundidad (Categoria -> Seccion -> Familia -> SubFamilia)

-- Nivel 2: hijos directos de raíz
UPDATE hijo SET hijo.ID_SCOPE = padre.ID_SCOPE
FROM CATEGORIA hijo
INNER JOIN CATEGORIA padre ON hijo.ID_PADRE = padre.ID
WHERE hijo.ID_SCOPE IS NULL AND padre.ID_SCOPE IS NOT NULL;
GO

-- Nivel 3: nietos
UPDATE nieto SET nieto.ID_SCOPE = padre.ID_SCOPE
FROM CATEGORIA nieto
INNER JOIN CATEGORIA padre ON nieto.ID_PADRE = padre.ID
WHERE nieto.ID_SCOPE IS NULL AND padre.ID_SCOPE IS NOT NULL;
GO

-- Nivel 4: bisnietos
UPDATE bisnieto SET bisnieto.ID_SCOPE = padre.ID_SCOPE
FROM CATEGORIA bisnieto
INNER JOIN CATEGORIA padre ON bisnieto.ID_PADRE = padre.ID
WHERE bisnieto.ID_SCOPE IS NULL AND padre.ID_SCOPE IS NOT NULL;
GO

PRINT 'ID_SCOPE propagado a todas las categorías hijas existentes.';
GO
