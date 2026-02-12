//discord import
import { Client, GatewayIntentBits, Events, SlashCommandBuilder, ChannelType, Routes, VoiceChannel } from "discord.js";
//run .bat files from native directory
import { execSync } from "child_process";
//file saving
import { readFileSync, writeFileSync, existsSync } from "fs";
//registering slash commands
import { REST } from "@discordjs/rest";

//dotenv for discord bot token
import { configDotenv } from "dotenv";
import { getVoiceConnection, joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus } from "@discordjs/voice";
const env = configDotenv(".env");

//creates discord bot, named client in code
const client = new Client({
    intents: [
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates
    ],
}); 

//for pushing /commands
const rest = new REST({version: '10'}).setToken(env.parsed.BOT_KEY);

//for playing audio
const player = createAudioPlayer({behaviors: {
    noSubscriber: NoSubscriberBehavior.Stop,
}});
//audio files
const track1 = createAudioResource(env.parsed.TRACK_1_ROUTE);
const track2 = createAudioResource(env.parsed.TRACK_2_ROUTE);
const track3 = createAudioResource(env.parsed.TRACK_3_ROUTE);

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
});

client.on("interactionCreate", async (interaction) => {
    if(interaction.isChatInputCommand()){
        //console.log("is interaction");
        if(interaction.commandName === "join_vc"){
            //console.log("joining VC");
            const vChannel = interaction.options.getChannel("channel");
            const vConnect = joinVoiceChannel({
                channelId: vChannel.id,
                guildId: vChannel.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false
            });
            await entersState(vConnect, VoiceConnectionStatus.Ready, 30_000);
            vConnect.subscribe(player);
            
            
            interaction.reply(client.user.displayName + " has joined " + vChannel.name);
            //console.log(getVoiceConnection());
        }
        else if(interaction.commandName === "leave_vc"){
            //console.log("LEAVE VC", getVoiceConnection(interaction.guildId));
            if(getVoiceConnection(interaction.guildId) !== undefined){
                //console.log("leaving vc");
                interaction.reply(client.user.displayName + " has left the VC");

                //stop audio
                player.stop();
                getVoiceConnection(interaction.guildId).destroy();
                
            }
            else{
                //console.log("no vc to leave");
                interaction.reply(client.user.displayName + " is not in a VC");
            }
        }
        else if(interaction.commandName === "stop"){
            if(getVoiceConnection(interaction.guildId) !== undefined){
                player.stop();
                interaction.reply(client.user.displayName + " has stopped playback");
            }
            else{
                interaction.reply(client.user.displayName + " is not inside of vc");
            }
        }
        else if(interaction.commandName === "play1"){
            if(getVoiceConnection(interaction.guildId) !== undefined){
                interaction.reply(client.user.displayName + " is playing tack 1");
                player.play(track1);
            }
            else{
                interaction.reply(client.user.displayName + " is not inside of vc");
            }
        }
        else if(interaction.commandName === "play2"){
            if(getVoiceConnection(interaction.guildId) !== undefined){
                interaction.reply(client.user.displayName + " is playing tack 2");
                player.play(track2);
            }
            else{
                interaction.reply(client.user.displayName + " is not inside of vc");
            }
        }else if(interaction.commandName === "play3"){
            if(getVoiceConnection(interaction.guildId) !== undefined){
                interaction.reply(client.user.displayName + " is playing tack 3");
                player.play(track3);
            }
            else{
                interaction.reply(client.user.displayName + " is not inside of vc");
            }
        }
    }
})

async function main () {
    try {
        //JSON commands
        const commands = [
            new SlashCommandBuilder()
                .setName('join_vc')
                .setDescription('Joins the specified voice channel')
                .addChannelOption((option) =>
                    option
                        .setName('channel')
                        .setDescription('Channel to join')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildVoice)
            ).toJSON(),
            new SlashCommandBuilder()
                .setName("leave_vc")
                .setDescription("leaves the current voice channel")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("stop")
                .setDescription("stops the current playback")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("play1")
                .setDescription("plays track 1")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("play2")
                .setDescription("plays track 2")
                .toJSON(),
            new SlashCommandBuilder()
                .setName("play3")
                .setDescription("plays track 3")
                .toJSON(),
        ];

        //sends the routes as slash commands to discord
        await rest.put(Routes.applicationGuildCommands(env.parsed.CLIENT_ID, env.parsed.GUILD_ID), {
            body: commands,
        });

        client.login(env.parsed.BOT_KEY);
    } catch (e) {
        console.log(e);
    }
}

main();