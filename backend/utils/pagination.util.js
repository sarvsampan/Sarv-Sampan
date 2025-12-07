/**
 * Calculate pagination metadata
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Pagination metadata
 */
export const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

/**
 * Get pagination offset
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {number} - Offset for database query
 */
export const getPaginationOffset = (page, limit) => {
  return (Number(page) - 1) * Number(limit);
};

/**
 * Build paginated response
 * @param {Array} data - Data array
 * @param {Object} meta - Pagination metadata
 * @returns {Object} - Paginated response
 */
export const buildPaginatedResponse = (data, meta) => {
  return {
    success: true,
    data,
    meta
  };
};
