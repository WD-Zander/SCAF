import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool, sql } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET;

export const login = async (req, res) => {
  // Acepta campo 'username' (nuevo) o 'email' (compatibilidad hacia atrás)
  const { username, email, password } = req.body;
  const loginId = (username || email || '').trim();

  if (!loginId || !password) return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });

  try {
    const db = await getPool();
    const result = await db.request()
      .input('loginId', sql.VarChar, loginId)
      .query(`
        SELECT u.ID, u.NOMBRE, u.CORREO, u.USERNAME, u.PASSWORD_HASH, u.ACTIVO,
               r.ID as rolId, r.PERMISOS as permisos
        FROM USUARIO u
        LEFT JOIN ROL r ON u.ID_ROL = r.ID
        WHERE u.USERNAME = @loginId OR u.CORREO = @loginId
      `);

    if (result.recordset.length === 0) {
      console.log('Login fallido: Usuario no encontrado:', loginId);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.recordset[0];

    if (!user.ACTIVO) {
      return res.status(403).json({ error: 'Tu cuenta está desactivada' });
    }

    const isMatch = await bcrypt.compare(password, user.PASSWORD_HASH || '');
    if (!isMatch) {
      console.log('Login fallido: Contraseña incorrecta para:', loginId);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.ID, nombre: user.NOMBRE, rol: user.rolId, permisos: JSON.parse(user.permisos || '[]') },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.ID,
        name: user.NOMBRE,
        username: user.USERNAME || user.CORREO,
        email: user.CORREO,
        role: {
          id: user.rolId,
          name: user.rolId,
          permissions: JSON.parse(user.permisos || '[]')
        },
        avatar: (user.NOMBRE || user.USERNAME || 'AD').substring(0, 2).toUpperCase()
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error del servidor durante el login' });
  }
};