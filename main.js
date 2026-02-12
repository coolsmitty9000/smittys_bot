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

//for looping tracks
var currTrack = null;

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
        //this allows the bot to join a VC
        if(interaction.commandName === "join_vc"){
            //this gets the channel that the user selected through the command
            const vChannel = interaction.options.getChannel("channel");
            //this establishes the connection to the channel
            const vConnect = joinVoiceChannel({
                channelId: vChannel.id,
                guildId: vChannel.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                //unmutes the bot
                selfDeaf: false,
                selfMute: false
            });
            //when the bot has fully connected to the VC...
            await entersState(vConnect, VoiceConnectionStatus.Ready, 30_000);
            //subscribe it (link it to) the audio player
            vConnect.subscribe(player);
            
            //inform the user the bot is in the voice channel
            interaction.reply({
                    content: client.user.displayName + " has joined " + vChannel.name,
                    ephemeral: true,
                });
            //console.log(getVoiceConnection());
        }
        else if(interaction.commandName === "leave_vc"){
            //console.log("LEAVE VC", getVoiceConnection(interaction.guildId));
            if(getVoiceConnection(interaction.guildId) !== undefined){
                //console.log("leaving vc");
                interaction.reply({
                    content: client.user.displayName + " has left the VC",
                    ephemeral: true,
                });

                //stop audio
                player.stop();
                currTrack = null;

                //removes the bot from the voice channel it's currently in
                getVoiceConnection(interaction.guildId).destroy();
            }
            else{
                //if there is not VC the bot is currently in it will inform the user
                interaction.reply({ 
                    content: client.user.displayName + " is not in a VC",
                    ephemeral: true,
                });
            }
        }
        //this stops the music that is currently playing
        else if(interaction.commandName === "stop"){
            //if it is inside of a voice channel
            if(getVoiceConnection(interaction.guildId) !== undefined){
                //run the stopper on the audio player (won't hurt if its ran with nothing playing)
                player.stop();
                currTrack = null;

                //tell the user it's stopped playing
                interaction.reply({ 
                    content: client.user.displayName + " has stopped playback",
                    ephemeral: true,
                });
            }
            else{
                interaction.reply({
                    content: client.user.displayName + " is not inside of vc",
                    ephemeral: true,
                });
            }
        }
        //track playback
        else if(interaction.commandName === "play1"){
            play({tracknum: 1, interaction: interaction});
        }
        else if(interaction.commandName === "play2"){
            play({tracknum: 2, interaction: interaction});
        }else if(interaction.commandName === "play3"){
            play({tracknum: 3, interaction: interaction});
        }
    }
});

//this is for looping playback
player.on(AudioPlayerStatus.Idle, () => {
    //null signifies there is no track playing or it has been stopped
    if(currTrack !== null){
        player.play(createAudioResource(env.parsed[currTrack]));
    }
})

//plays music through voice, it takes in a track number and the interaction data to reply to
async function play ({tracknum, interaction}) {
    //this checks if it's actually in a VC
    if(getVoiceConnection(interaction.guildId) !== undefined){

        //this replies to the user who passed the command
        interaction.reply({
            content: `${client.user.displayName} is playing tack ${tracknum}`,
            ephemeral: true,
        });
        //the tracks follow the format of -> TRACK_*number*_ROUTE
        const trackSTR = `TRACK_${tracknum}_ROUTE`;
        //this starts playing the audio
        player.play(createAudioResource(env.parsed[trackSTR]));

        //this allows the track to loop back on itself when it ends
        currTrack = trackSTR;
    }   
    else{
        //otherwise inform the user that the bot is not inside of a voice chat
        interaction.reply({
            content: client.user.displayName + " is not inside of vc",
            ephemeral: true,
        });
    }    
}

async function main () {
    try {
        //JSON commands
        const commands = [
            // -- vc section --
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
            // -- music section --
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