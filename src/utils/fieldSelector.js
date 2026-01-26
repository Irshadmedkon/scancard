/**
 * Field Selection Utility
 * Allows API consumers to select specific fields in responses
 */

/**
 * Parse fields from query string
 * @param {string} fieldsQuery - Comma-separated fields (e.g., "name,email,phone")
 * @param {Array} allowedFields - List of allowed fields
 * @returns {Array} - Array of valid fields
 */
function parseFields(fieldsQuery, allowedFields = []) {
  if (!fieldsQuery) {
    return allowedFields.length > 0 ? allowedFields : ['*'];
  }

  const requestedFields = fieldsQuery.split(',').map(f => f.trim());

  // If no allowed fields specified, return all requested
  if (allowedFields.length === 0) {
    return requestedFields;
  }

  // Filter only allowed fields
  return requestedFields.filter(field => allowedFields.includes(field));
}

/**
 * Build SELECT clause from fields
 * @param {Array} fields - Array of field names
 * @param {string} tableAlias - Optional table alias
 * @returns {string} - SQL SELECT clause
 */
function buildSelectClause(fields, tableAlias = '') {
  if (!fields || fields.length === 0 || fields.includes('*')) {
    return tableAlias ? `${tableAlias}.*` : '*';
  }

  const prefix = tableAlias ? `${tableAlias}.` : '';
  return fields.map(field => `${prefix}${field}`).join(', ');
}

/**
 * Filter object to include only specified fields
 * @param {Object} obj - Object to filter
 * @param {Array} fields - Fields to include
 * @returns {Object} - Filtered object
 */
function filterFields(obj, fields) {
  if (!fields || fields.length === 0 || fields.includes('*')) {
    return obj;
  }

  const filtered = {};
  fields.forEach(field => {
    if (obj.hasOwnProperty(field)) {
      filtered[field] = obj[field];
    }
  });

  return filtered;
}

/**
 * Filter array of objects
 * @param {Array} arr - Array of objects
 * @param {Array} fields - Fields to include
 * @returns {Array} - Filtered array
 */
function filterArrayFields(arr, fields) {
  if (!Array.isArray(arr)) {
    return arr;
  }

  return arr.map(obj => filterFields(obj, fields));
}

/**
 * Middleware for field selection
 */
function fieldSelectorMiddleware(allowedFields = []) {
  return (req, res, next) => {
    // Parse fields from query
    const fields = parseFields(req.query.fields, allowedFields);
    
    // Attach to request
    req.selectedFields = fields;
    req.selectClause = buildSelectClause(fields);

    // Override res.json to filter fields
    const originalJson = res.json;
    res.json = function (data) {
      if (data && data.data) {
        if (Array.isArray(data.data)) {
          data.data = filterArrayFields(data.data, fields);
        } else if (typeof data.data === 'object') {
          data.data = filterFields(data.data, fields);
        }
      }
      return originalJson.call(this, data);
    };

    next();
  };
}

module.exports = {
  parseFields,
  buildSelectClause,
  filterFields,
  filterArrayFields,
  fieldSelectorMiddleware
};
