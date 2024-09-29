import mongoose from "mongoose";

// Function to start a session and transaction
const startSession = async () => {
  const session = await mongoose.startSession();
  session.startTransaction();
  return session;
};

// Function to commit a transaction and end the session
const commitSession = async (session) => {
  await session.commitTransaction();
  session.endSession();
};

// Function to abort a transaction and end the session
const abortSession = async (session) => {
  await session.abortTransaction();
  session.endSession();
};

export { startSession, commitSession, abortSession };
