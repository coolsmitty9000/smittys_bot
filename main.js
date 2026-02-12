//discord import
import { Client, GatewayIntentBits, Events, SlashCommandBuilder, ChannelType, Routes, VoiceChannel } from "discord.js";
//file reading
import { readdir } from "fs/promises";
import path from "path";
//registering slash commands
import { REST } from "@discordjs/rest";

//youtube streaming 
import { execFile } from "child_process";
import { promisify } from "util";
const execFileAsync = promisify(execFile);


//dotenv for discord bot token
import { configDotenv } from "dotenv";
import { getVoiceConnection, joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, AudioPlayerStatus, entersState, VoiceConnectionStatus, StreamType } from "@discordjs/voice";
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
    optional .env variables
*/
const speachMemberId = env.parsed.SPEACH_MEMBER_ID || undefined;
const reactionSpeach = env.parsed.REACTION_SPEACH || undefined;
const reactionBonk = env.parsed.REACTION_BONK || undefined;

/*
    this reads / responds to messages:

    client.on <- contantly checks stuff
	messageCreate <- any message sent, regardless of who messaged and where
	message <- the actual body of the message
*/
client.on("messageCreate", (message) => {
    //console.log("MSG: ", message.content);

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
    else if(message.content.toLowerCase().includes("chicken") || message.author.id === speachMemberId){
        if(reactionSpeach !== undefined){
            message.reply(reactionSpeach);
        }
        
    }
    else if(message.content.includes(`@${env.parsed.ADMIN_ID}`)){
        if(reactionBonk !== undefined){
            message.reply(reactionBonk);
        }
        else{
            message.reply("(-_-)");
        }
        
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
        else if(interaction.commandName === "play"){
            //console.log(interaction.options.getString("track"));
            play({trackName: interaction.options.getString("track"), interaction: interaction});
        }
        //yt playback
        else if(interaction.commandName === "play_yt"){
            //make sure the bot is in the call (admin ID because this is using cookies for my account, so I am the only one to use it)
            if(getVoiceConnection(interaction.guildId) !== undefined && interaction.user.id === env.parsed.ADMIN_ID){
                //url the user gave
                const userURL = interaction.options.getString("url");
                //console.log(userURL);
                try{
                    interaction.reply({content: `${client.user.displayName} is now playing ${userURL}`, ephemeral: true});

                    //terminal command to get youtube stream using cookies
                    //cookies are netscape format and are in a "cookies.txt" file in the bot directory (not visible)
                    const {stdout} = await execFileAsync("yt-dlp", [
                        "--cookies",
                        "cookies.txt",
                        "-f",
                        "bestaudio",
                        "-g",
                        // calls the provided url with the cookies specified
                        userURL,
                    ]);

                    //trims out the un-needed parts to get stuff the audio resource can use
                    const streamURL = stdout.trim();
                    //creates the audio resource so it can be played
                    const stream = createAudioResource(streamURL, {inputType: StreamType.Arbitrary});

                    //play it through the bot
                    player.play(stream);
                    //inform the user it's running
                    
                }
                catch(err){
                    //any form of error will land it here
                    console.error(err);
                    interaction.reply({content: "bot has errored out", ephemeral: true});
                }
            }
        }
    }
});

//error logging
player.on("error", error => {
    console.error(error);
})

//this is for looping playback
player.on(AudioPlayerStatus.Idle, () => {
    //null signifies there is no track playing or it has been stopped
    if(currTrack !== null){
        player.play(createAudioResource(currTrack));
    }
})

//plays music through voice, it takes in a track number and the interaction data to reply to
async function play ({trackName, interaction}) {
    //this checks if it's actually in a VC
    if(getVoiceConnection(interaction.guildId) !== undefined){

        //this replies to the user who passed the command
        interaction.reply({
            content: `${client.user.displayName} is playing tack ${trackName.split(".")[0]}`,
            ephemeral: true,
        });
        //console.log(path.join(env.parsed.TRACK_ROUTES, `/${trackName}`));

        //this starts playing the audio (using the directory path)
        const audio = createAudioResource(path.join(env.parsed.TRACK_ROUTES, `/${trackName}`), {inlineVolume: true, inputType: StreamType.Opus});
        // inline volume lets me change the volume in the same statement
        // 0.50 volume is 50% normal volume
        audio.volume.setVolume(0.35);

        player.play(audio);

        //this allows the track to loop back on itself when it ends
        currTrack = path.join(env.parsed.TRACK_ROUTES, `/${trackName}`);
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
        const files = readdir(env.parsed.TRACK_ROUTES);
        const tracks = (await files).map(file => ({
            name: file.split(".")[0],
            value: file
        }));
        //console.log(tracks);

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
                .setName("play")
                .setDescription("select a music track")
                .addStringOption(option => 
                    option
                        .setName("track")
                        .setDescription("select the track")
                        .setRequired(true)
                        .addChoices(...tracks)
                )
                .toJSON(),
            new SlashCommandBuilder()
                .setName("play_yt")
                .setDescription("plays a youtube video *restricted*")
                .addStringOption(option => 
                    option
                        .setName("url")
                        .setDescription("-- youtube URL --")
                        .setRequired(true)
                )
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