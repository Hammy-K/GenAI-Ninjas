import { Response } from "express";

/**
 * Standardized response envelope format across all API routes
 *
 * Success: { success: true, data: {...} }
 * Error: { success: false, error: "error message" }
 */

/**
 * Send a successful response with standardized envelope
 * @param res Express Response object
 * @param data The response data payload
 * @param statusCode HTTP status code (default: 200)
 */
export const sendSuccess = (
  res: Response,
  data: any,
  statusCode: number = 200
) => {
  return res.status(statusCode).json({ success: true, data });
};

/**
 * Send an error response with standardized envelope
 * @param res Express Response object
 * @param message Error message
 * @param statusCode HTTP status code (default: 500)
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500
) => {
  return res.status(statusCode).json({ success: false, error: message });
};

/**
 * Send a response for created resources (201)
 * @param res Express Response object
 * @param data The created resource data
 */
export const sendCreated = (res: Response, data: any) => {
  return sendSuccess(res, data, 201);
};

/**
 * Send a bad request error (400)
 * @param res Express Response object
 * @param message Error message
 */
export const sendBadRequest = (res: Response, message: string) => {
  return sendError(res, message, 400);
};

/**
 * Send an unauthorized error (401)
 * @param res Express Response object
 * @param message Error message
 */
export const sendUnauthorized = (
  res: Response,
  message: string = "Unauthorized"
) => {
  return sendError(res, message, 401);
};

/**
 * Send a forbidden error (403)
 * @param res Express Response object
 * @param message Error message
 */
export const sendForbidden = (
  res: Response,
  message: string = "Forbidden"
) => {
  return sendError(res, message, 403);
};

/**
 * Send a not found error (404)
 * @param res Express Response object
 * @param message Error message
 */
export const sendNotFound = (res: Response, message: string = "Not found") => {
  return sendError(res, message, 404);
};

/**
 * Send a server error (500)
 * @param res Express Response object
 * @param message Error message
 */
export const sendServerError = (
  res: Response,
  message: string = "Internal server error"
) => {
  return sendError(res, message, 500);
};
