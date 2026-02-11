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

/*
    this reads / responds to messages:

    client.on <- contantly checks stuff
	messageCreate <- any message sent, regardless of who messaged and where
	message <- the actual body of the message
*/
client.on("messageCreate", (message) => {
    // if the message was sent by the bot, it won't do anything
	// (it basically acts like a while(true) statement otherwise)
	if (message.author.bot) {
		return;
	}
    //on the message "ping" being sent in the server...
    else if(message.content === "ping"){
        //responds with pong
        message.reply("Pong");
    }
})


client.login(env.parsed.BOT_KEY);