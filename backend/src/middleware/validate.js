'use strict';
const { ApiError } = require('./errorHandler');

/**
 * validate({ body, query, params }) — each value is a Zod schema. Parses and
 * REPLACES req.body/query/params with the parsed (typed, defaulted) result,
 * so downstream code can trust its shape. Every route in this project
 * validates its input through this — no endpoint trusts raw req.body.
 */
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (err) {
      const issues = err.issues ? err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) : undefined;
      next(new ApiError(400, 'invalid_request', 'Request failed validation.', issues));
    }
  };
}

module.exports = { validate };
