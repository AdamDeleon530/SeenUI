/**
 * OPTIONS /api/embed/:tenantId/submit
 * Handles CORS preflight for the public embed widget submission endpoint.
 */
export default defineEventHandler((event) => {
  setResponseHeaders(event, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
  })
  sendNoContent(event, 204)
})
