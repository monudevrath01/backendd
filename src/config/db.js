import mongoose from "mongoose";
import dns from "dns";

// Build direct mongodb:// URI from mongodb+srv:// URI using known shard hosts.
// This bypasses SRV DNS lookup which fails on some ISP/network configurations.
function buildDirectUri(srvUri) {
  try {
    const withoutScheme = srvUri.replace("mongodb+srv://", "");
    const atIndex = withoutScheme.lastIndexOf("@");
    const credentials = withoutScheme.substring(0, atIndex);
    const afterAt = withoutScheme.substring(atIndex + 1);
    const dbName = afterAt.split("/")[1]?.split("?")[0] || "admin";

    // Shard hosts resolved earlier via nslookup
    const hosts = [
      "ac-grhpohs-shard-00-00.niworaj.mongodb.net:27017",
      "ac-grhpohs-shard-00-01.niworaj.mongodb.net:27017",
      "ac-grhpohs-shard-00-02.niworaj.mongodb.net:27017",
    ].join(",");

    return `mongodb://${credentials}@${hosts}/${dbName}?ssl=true&replicaSet=atlas-yi40br-shard-0&authSource=admin&retryWrites=true`;
  } catch {
    return null;
  }
}

const connectDB = async () => {
  dns.setDefaultResultOrder("ipv4first");

  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("❌ MONGO_URI is not defined in .env");
    process.exit(1);
  }

  const isSrv = uri.startsWith("mongodb+srv://");
  const directFallback = isSrv ? buildDirectUri(uri) : null;
  const urisToTry = [uri, directFallback].filter(Boolean);

  for (let i = 0; i < urisToTry.length; i++) {
    const connectionUri = urisToTry[i];
    const isFallback = i > 0;

    try {
      if (isFallback) {
        console.log("⚠️  SRV lookup failed — retrying with direct host connection...");
      }
      await mongoose.connect(connectionUri, {
        serverSelectionTimeoutMS: 10000,
        tls: true,
      });
      console.log("✅ MongoDB Connected");
      return;
    } catch (error) {
      const isSrvError =
        error.message.includes("querySrv") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("ENOTFOUND");

      if (isSrvError && directFallback && !isFallback) {
        // Will retry with direct URI in next iteration
        continue;
      }

      console.error("❌ MongoDB Connection Failed");
      console.error("   Reason:", error.message);
      console.error("   Tip: If password has special chars like @, encode them as %40 in .env");
      process.exit(1);
    }
  }
};

export default connectDB;