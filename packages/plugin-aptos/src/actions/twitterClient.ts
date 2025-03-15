import dotenv from "dotenv";
import { Scraper } from "agent-twitter-client";

// Load environment variables from .env file
dotenv.config();

// Initialize Scraper
const scraper = new Scraper();

let accountLoggedIn = false;

// Twitter login function
const login = async () => {
  console.log("🟠 Logging in with account...");
  await scraper.login(
    process.env.TWITTER_USERNAME || "",
    process.env.TWITTER_PASSWORD || ""
  );
  console.log("🟢 Login successful!");
  accountLoggedIn = true;
};

// Get tweet by ID function
export const getTweetById = async (tweetId: string) => {
  if (!accountLoggedIn) await login();

  try {
    const tweet = await scraper.getTweet(tweetId);
    console.log("🔹 Retrieved tweet:", tweet);
    return tweet;
  } catch (error) {
    console.error("❌ Error getting tweet:", error);
    throw error;
  }
};

// Get all tweets from a user
export const getTweetsByUser = async (username: string, count: number = 5) => {
  if (!accountLoggedIn) await login();

  try {
    const tweets = await scraper.getTweets(username, count);
    console.log(`🔹 ${count} recent tweets from ${username}:`, tweets);
    return tweets;
  } catch (error) {
    console.error("❌ Error getting tweets:", error);
    throw error;
  }
};

// Post a new tweet function
export const postTweet = async (content: string) => {
  if (!accountLoggedIn) await login();

  try {
    await scraper.sendTweet(content);
    console.log("✅ Tweet posted:", content);
  } catch (error) {
    console.error("❌ Error posting tweet:", error);
    throw error;
  }
};

// Get latest tweet from an account
export const getLatestTweet = async (username: string) => {
  if (!accountLoggedIn) await login();

  try {
    const latestTweet = await scraper.getLatestTweet(username);
    console.log("🔹 Latest tweet:", latestTweet);
    return latestTweet;
  } catch (error) {
    console.error("❌ Error getting latest tweet:", error);
    throw error;
  }
};
