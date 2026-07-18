const mongoose = require('mongoose');
const logger = require('./logger');

const startSession = async () => {
  const client = mongoose.connection.client;
  
  // Standalone MongoDB connections (Single topology) do not support transactions/sessions
  const topologyType = client?.topology?.description?.type;
  const isReplicaSetOrSharded = topologyType?.includes('ReplicaSet') || 
                                topologyType?.includes('Sharded');

  if (!isReplicaSetOrSharded) {
    return null; 
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
  } catch (err) {
    logger.warn('Failed to start transaction session: ' + err.message);
    return null;
  }
};

const commitTransaction = async (session) => {
  if (session) {
    await session.commitTransaction();
    session.endSession();
  }
};

const abortTransaction = async (session) => {
  if (session) {
    try {
      await session.abortTransaction();
    } catch (err) {
      // Ignore abort errors if transaction is already resolved
    }
    session.endSession();
  }
};

module.exports = {
  startSession,
  commitTransaction,
  abortTransaction
};
