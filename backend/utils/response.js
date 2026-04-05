/**
 * Standardised API response helpers.
 * All controllers use these to ensure consistent response shape.
 */

/**
 * Send a 200 OK response.
 * @param {Response} res - Express response
 * @param {*} data - Payload to return
 * @param {string} [message] - Optional human-readable message
 */
function success(res, data = null, message = 'OK') {
  return res.status(200).json({ success: true, message, data });
}

/**
 * Send a 201 Created response.
 * @param {Response} res
 * @param {*} data
 * @param {string} [message]
 */
function created(res, data = null, message = 'Resource created') {
  return res.status(201).json({ success: true, message, data });
}

/**
 * Send an error response (defaults to 500).
 * @param {Response} res
 * @param {string} message - Human-readable error message
 * @param {number} [statusCode=500]
 * @param {string} [error] - technical detail (omitted in prod)
 */
function error(res, message = 'Internal server error', statusCode = 500, errDetail = null) {
  const payload = { success: false, message };
  if (errDetail && process.env.NODE_ENV !== 'production') {
    payload.error = errDetail;
  }
  return res.status(statusCode).json(payload);
}

/**
 * 400 Bad Request helper
 */
function badRequest(res, message = 'Bad request') {
  return error(res, message, 400);
}

/**
 * 401 Unauthorized helper
 */
function unauthorized(res, message = 'Unauthorized') {
  return error(res, message, 401);
}

/**
 * 403 Forbidden helper
 */
function forbidden(res, message = 'Forbidden') {
  return error(res, message, 403);
}

/**
 * 404 Not Found helper
 */
function notFound(res, message = 'Resource not found') {
  return error(res, message, 404);
}

module.exports = { success, created, error, badRequest, unauthorized, forbidden, notFound };
