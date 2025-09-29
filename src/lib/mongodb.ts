import { MongoClient, MongoClientOptions, Db } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  appName: 'devrel.vercel.integration',
  // Speed up failures in dev when Atlas is unreachable
  serverSelectionTimeoutMS: 5000,
};

let client: MongoClient | undefined;

if (uri) {
  if (process.env.NODE_ENV === 'development') {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClient?: MongoClient;
    };

    if (!globalWithMongo._mongoClient) {
      client = new MongoClient(uri, options);
      globalWithMongo._mongoClient = client;
    }
    client = globalWithMongo._mongoClient;
  } else {
    client = new MongoClient(uri, options);
    // Attach the client to ensure proper cleanup on function suspension
    attachDatabasePool(client);
  }
}

export default client as MongoClient;

// Ensure client is connected; if closed or first use, (re)connect.
async function ensureConnected(): Promise<MongoClient> {
  if (!client) throw new Error('Missing MONGODB_URI or client not initialized');
  try {
    // Ping triggers lazy connect on first use
    await client.db('admin').command({ ping: 1 });
    return client;
  } catch (err) {
    try {
      // Attempt to (re)connect this client
      await client.connect();
      return client;
    } catch {
      // As a last resort, create a new client instance
      const uri = process.env.MONGODB_URI;
      if (!uri) throw new Error('Missing MONGODB_URI');
      const newClient = new MongoClient(uri, options);
      if (process.env.NODE_ENV !== 'development') {
        attachDatabasePool(newClient);
      } else {
        const globalWithMongo = global as typeof globalThis & { _mongoClient?: MongoClient };
        globalWithMongo._mongoClient = newClient;
      }
      client = newClient;
      await client.connect();
      return client;
    }
  }
}

// Backwards-compatible helper for routes expecting getDb()
const dbName = process.env.MONGODB_DB || 'gastmeting';
export async function getDb(): Promise<Db> {
  const c = await ensureConnected();
  return c.db(dbName);
}
