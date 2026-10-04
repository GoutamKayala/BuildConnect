import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({ actorId, action, resource, resourceId = null, req = null, metadata = {} }) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    await AuditLog.create({
      actor: actorId,
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : null,
      ipAddress,
      userAgent,
      metadata,
    });
  } catch (error) {
    console.error(`[AuditLogger Error]: ${error.message}`);
  }
};
