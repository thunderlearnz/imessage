

import express from "express";
import { Webhook } from "svix";
import User from "../models/User.model.js";
const router = express.Router();

// ==========================================
// CLERK WEBHOOK ENDPOINT
// ==========================================
// CRITICAL: Webhook signature verification requires the RAW, unparsed request body.
// We must place this route BEFORE `app.use(express.json())` and use `express.raw({ type: "application/json" })`.
// If `express.json()` runs first, it parses the body into an object and drains the stream,
// causing Svix signature verification to fail because the byte-for-byte payload is altered.
router.post(
  "/",
  async (req, res) => {
    // 1. Retrieve the Clerk Webhook Signing Secret from environment variables
    const signingSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!signingSecret) {
      console.error("Missing CLERK_WEBHOOK_SIGNING_SECRET in .env");
      return res.status(500).json({ error: "Missing webhook signing secret" });
    }

    // 2. Extract Svix headers from the request
    // Clerk uses Svix behind the scenes. Svix sends 3 verification headers:
    // - svix-id: Unique message identifier
    // - svix-timestamp: Time the webhook was generated (Svix rejects expired timestamps to prevent replay attacks)
    // - svix-signature: HMAC-SHA256 signature calculated from the secret + payload
    const svix_id = req.headers["svix-id"];
    const svix_timestamp = req.headers["svix-timestamp"];
    const svix_signature = req.headers["svix-signature"];

    // Ensure all 3 headers are present
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return res.status(400).json({
        error: "Missing required Svix headers (svix-id, svix-timestamp, svix-signature)",
      });
    }

    // 3. Instantiate the Svix Webhook verifier
    const wh = new Webhook(signingSecret);

    let evt;

    // 4. Verify the cryptographic signature using the raw payload buffer
    try {
      // wh.verify will throw an error if the payload was modified,
      // if the signature doesn't match, or if the timestamp is expired
      wh.verify(req.body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });

      // Once verified, parse the raw Buffer into a JSON object
      evt = JSON.parse(req.body.toString("utf-8"));
    } catch (err) {
      console.error("Clerk Webhook verification failed:", err.message);
      return res.status(400).json({ error: "Webhook verification failed" });
    }

    // 5. Handle verified Clerk event types (Sync with MongoDB)
    const eventType = evt.type;
    console.log(`Verified Clerk webhook received: ${eventType}`);

    try {
      if (eventType === "user.created") {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const email = email_addresses?.[0]?.email_address || "";
        const fullName = `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous";

        // Using findOneAndUpdate with upsert: true prevents duplicate key errors
        // if Clerk retries the user.created webhook due to network latency
        await User.findOneAndUpdate(
          { clerkId: id },
          { email, fullName, profilePicture: image_url || "" },
          { new: true, upsert: true }
        );
        console.log(`User created or synced successfully: ${id}`);
      } else if (eventType === "user.updated") {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;
        const email = email_addresses?.[0]?.email_address || "";
        const fullName = `${first_name || ""} ${last_name || ""}`.trim() || "Anonymous";

        await User.findOneAndUpdate(
          { clerkId: id },
          { email, fullName, profilePicture: image_url || "" },
          { new: true, upsert: true }
        );
        console.log(`User updated successfully: ${id}`);
      } else if (eventType === "user.deleted") {
        const { id } = evt.data;
        await User.findOneAndDelete({ clerkId: id });
        console.log(`User deleted successfully: ${id}`);
      }

      // Return a 200 OK response to Clerk so it knows the webhook was successfully received
      return res.status(200).json({ success: true, message: "Webhook processed" });
    } catch (dbError) {
      console.error("Error updating database from Clerk webhook:", dbError);
      return res.status(500).json({ error: "Database error while processing webhook" });
    }
  }
  
);

export default router;

 