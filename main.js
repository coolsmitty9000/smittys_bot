//discord import
import { Client, GatewayIntentBits, Events } from "discord.js";
//run .bat files from native directory
import { execSync } from "child_process";
//file saving
import { readFileSync, writeFileSync, existsSync } from "fs";
import { configDotenv } from "dotenv";
const env = configDotenv(".env");

//creates discord bot, named client in code
const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
    ],
}); 

/*
  this enables the bot, and will give a console output that tells you
  client.once <- only runs when bot starts, then stops
*/
client.once(Events.ClientReady, async () => {
    console.log(`bot is active as ${client.user.tag}`);
});

client.login(env.parsed.BOT_KEY);