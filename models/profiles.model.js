const db = require('../config/db');

const ProfileModel = {
  // Obtener todos los perfiles con información básica del usuario
  getAllProfiles: async () => {
    const query = `
      SELECT 
        p.profile_id, 
        p.user_id, 
        u.username, 
        u.email, 
        p.first_name, 
        p.last_name, 
        p.birthdate, 
        p.gender, 
        p.city, 
        p.country
      FROM profiles p
      JOIN users u ON p.user_id = u.user_id
      WHERE u.is_active = TRUE
    `;
    try {
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Obtener un perfil por ID
  getProfileById: async (profileId) => {
    const query = `
      SELECT 
        p.profile_id, 
        p.user_id, 
        u.username, 
        u.email, 
        p.first_name, 
        p.last_name, 
        p.birthdate, 
        p.gender, 
        p.profile_picture_url, 
        p.bio, 
        p.phone, 
        p.address, 
        p.city, 
        p.state, 
        p.country, 
        p.postal_code
      FROM profiles p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.profile_id = $1 AND u.is_active = TRUE
    `;
    try {
      const result = await db.query(query, [profileId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener perfil por user_id
  getProfileByUserId: async (userId) => {
    const query = `
      SELECT 
        p.profile_id, 
        p.user_id, 
        p.first_name, 
        p.last_name, 
        p.birthdate, 
        p.gender, 
        p.profile_picture_url, 
        p.bio, 
        p.phone, 
        p.address, 
        p.city, 
        p.state, 
        p.country, 
        p.postal_code
      FROM profiles p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.user_id = $1 AND u.is_active = TRUE
    `;
    try {
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Crear un nuevo perfil
  createProfile: async (profileData) => {
    const {
      user_id,
      first_name,
      last_name,
      birthdate,
      gender,
      profile_picture_url,
      bio,
      phone,
      address,
      city,
      state,
      country,
      postal_code
    } = profileData;

    const query = `
      INSERT INTO profiles (
        user_id,
        first_name,
        last_name,
        birthdate,
        gender,
        profile_picture_url,
        bio,
        phone,
        address,
        city,
        state,
        country,
        postal_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    try {
      const values = [
        user_id,
        first_name,
        last_name,
        birthdate,
        gender,
        profile_picture_url,
        bio,
        phone,
        address,
        city,
        state,
        country,
        postal_code
      ];
      
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Actualizar un perfil
  updateProfile: async (profileId, profileData) => {
    // Construir dinámicamente la consulta de actualización
    let query = 'UPDATE profiles SET ';
    const values = [];
    const params = [];
    
    // Añadir los campos a actualizar
    let paramIndex = 1;
    for (const [key, value] of Object.entries(profileData)) {
      if (value !== undefined) {
        params.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    // Añadir el updated_at automáticamente
    params.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Completar la consulta
    query += params.join(', ');
    query += ` WHERE profile_id = $${paramIndex} RETURNING *`;
    values.push(profileId);
    
    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener áreas de mejora de un perfil
  getProfileImprovementAreas: async (profileId) => {
    const query = `
      SELECT 
        o.option_id, 
        o.name, 
        o.description
      FROM profile_improvement_areas pia
      JOIN improvement_areas_options o ON pia.option_id = o.option_id
      WHERE pia.profile_id = $1
    `;
    try {
      const result = await db.query(query, [profileId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Añadir área de mejora a un perfil
  addProfileImprovementArea: async (profileId, optionId) => {
    const query = `
      INSERT INTO profile_improvement_areas (profile_id, option_id)
      VALUES ($1, $2)
      ON CONFLICT (profile_id, option_id) DO NOTHING
      RETURNING *
    `;
    try {
      const result = await db.query(query, [profileId, optionId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Eliminar área de mejora de un perfil
  removeProfileImprovementArea: async (profileId, optionId) => {
    const query = `
      DELETE FROM profile_improvement_areas
      WHERE profile_id = $1 AND option_id = $2
      RETURNING *
    `;
    try {
      const result = await db.query(query, [profileId, optionId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Obtener actividades de bienestar de un perfil
  getProfileWellnessActivities: async (profileId) => {
    const query = `
      SELECT 
        o.option_id, 
        o.name, 
        o.description
      FROM profile_wellness_activities pwa
      JOIN wellness_activities_options o ON pwa.option_id = o.option_id
      WHERE pwa.profile_id = $1
    `;
    try {
      const result = await db.query(query, [profileId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // Añadir actividad de bienestar a un perfil
  addProfileWellnessActivity: async (profileId, optionId) => {
    const query = `
      INSERT INTO profile_wellness_activities (profile_id, option_id)
      VALUES ($1, $2)
      ON CONFLICT (profile_id, option_id) DO NOTHING
      RETURNING *
    `;
    try {
      const result = await db.query(query, [profileId, optionId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Eliminar actividad de bienestar de un perfil
  removeProfileWellnessActivity: async (profileId, optionId) => {
    const query = `
      DELETE FROM profile_wellness_activities
      WHERE profile_id = $1 AND option_id = $2
      RETURNING *
    `;
    try {
      const result = await db.query(query, [profileId, optionId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = ProfileModel;