import { supabase } from '../config/database.js';

export const adminOnly = async (req, res, next) => {
  try {
    const adminId = req.adminId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Check if admin exists and is active
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, role, status')
      .eq('id', adminId)
      .single();

    if (error || !admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    if (admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Admin account is inactive'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error in admin verification'
    });
  }
};

// Check if super admin
export const superAdminOnly = (req, res, next) => {
  if (req.admin?.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Super admin only.'
    });
  }
  next();
};
