const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const SupportMessage = require('../models/SupportMessage');

const getSupportMessages = asyncHandler(async (req, res) => {
  let targetUserId = req.user._id;

  // Admin can query messages of a specific user
  if (req.user.role === 'admin') {
    if (!req.query.userId) {
      throw new ApiError(400, 'userId query parameter is required for admin');
    }
    targetUserId = req.query.userId;
  }

  const messages = await SupportMessage.find({ userId: targetUserId })
    .sort({ createdAt: 1 })
    .populate('userId', 'name email profilePhotoUrl');

  res.status(200).json(new ApiResponse(200, messages, 'Support messages retrieved successfully'));
});

const sendSupportMessage = asyncHandler(async (req, res) => {
  const { content, attachments } = req.body;
  let userId = req.user._id;
  let senderRole = 'employee';

  if (req.user.role === 'admin') {
    if (!req.body.userId) {
      throw new ApiError(400, 'userId is required in the body for admin messages');
    }
    userId = req.body.userId;
    senderRole = 'admin';
  }

  const newMessage = await SupportMessage.create({
    userId,
    senderRole,
    content,
    attachments: attachments || [],
    read: false
  });

  const populated = await newMessage.populate('userId', 'name email profilePhotoUrl');

  // Trigger realtime event through Socket.io if available
  try {
    const { getIo } = require('../sockets/socketManager');
    const io = getIo();
    if (io) {
      // Send to the room specific to the user's support chat
      io.to(`support_${userId}`).emit('support:message_received', populated);
      // Also broadcast to admin room so admins can receive notifications
      io.to('admin_room').emit('support:message_received', populated);
    }
  } catch (err) {
    console.error('Socket notification for support message failed', err);
  }

  res.status(201).json(new ApiResponse(201, populated, 'Message sent successfully'));
});

const markMessagesRead = asyncHandler(async (req, res) => {
  let userId = req.user._id;

  if (req.user.role === 'admin') {
    if (!req.body.userId) {
      throw new ApiError(400, 'userId is required');
    }
    userId = req.body.userId;
  }

  // Update read status
  const filter = { userId };
  if (req.user.role === 'admin') {
    filter.senderRole = 'employee'; // Mark client messages as read by admin
  } else {
    filter.senderRole = 'admin'; // Mark admin messages as read by client
  }

  await SupportMessage.updateMany(filter, { $set: { read: true } });

  res.status(200).json(new ApiResponse(200, null, 'Messages marked as read'));
});

module.exports = {
  getSupportMessages,
  sendSupportMessage,
  markMessagesRead
};
