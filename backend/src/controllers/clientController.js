import ClientProfile from '../models/ClientProfile.js';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { logAudit } from '../utils/auditLogger.js';

export const updateClientProfile = asyncHandler(async (req, res) => {
  const { phone, city, address, preferredLanguage, projectInterests } = req.body;

  let profile = await ClientProfile.findOne({ user: req.user._id });
  if (!profile) {
    profile = new ClientProfile({ user: req.user._id });
  }

  if (address) profile.address = address;
  if (preferredLanguage) profile.preferredLanguage = preferredLanguage;
  if (projectInterests) profile.projectInterests = projectInterests;

  await profile.save();

  const user = await User.findById(req.user._id);
  if (phone) user.phone = phone;
  if (city) user.city = city;
  user.isOnboarded = true;
  await user.save();

  await logAudit({
    actorId: req.user._id,
    action: 'UPDATE_CLIENT_PROFILE',
    resource: 'ClientProfile',
    resourceId: profile._id,
    req,
  });

  res.json({
    success: true,
    message: 'Client profile updated successfully',
    profile,
  });
});
