import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env';

const connectDB = async (): Promise<void> => {
  const { mongoUri, customDnsServers } = env();

  // Some hosts (and some ISPs) cannot resolve SRV records for MongoDB Atlas.
  // Overriding DNS is opt-in via DNS_SERVERS instead of hardcoded.
  if (customDnsServers.length > 0) {
    dns.setServers(customDnsServers);
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 15000 });
  console.log('MongoDB connected');
};

export default connectDB;
