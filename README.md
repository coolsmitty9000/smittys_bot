<h3 align="center">My discord bot for personal server <h4 align="center"><i>This is different than my other pesronal bot which was not general purpose</i></h3></h4>

<hr/>
<h3 align="center">I will be using this for a variety of reasons that I will update this README file for...</h3>
<br/>
<table>
    <thead><h3>As of right now, the bot: </h3></thead>
    <tbody>
        <tr> - Responds to specific messages that anyone says</tr> <br />
        <tr> - Reacton images if a specific user messages, or @s the admin user specified in the .env</tr><br />
        <tr> - Joins voice calls </tr><br />
        <tr> - Plays audio through the discord bot in said calls (I currently only have 3 tracks set up)</tr><br />
        <tr> - Youtube playback now works as part of the audio player, however it uses cookies from a youtube account</tr><br />
    </tbody>
</table>


<table>
    <thead>
        <h3>What I hope to add: </h3>
    </thead>
    <tbody>
        <tr> - message / game statistics (very up in the air) </tr><br />
        <tr> - AI API intigration for answering questions (undecided) </tr><br />
        <tr> - ability to have more than 25 music tracks at a time (limitations on how I did it) </tr><br />
    </tbody>
    
</table>

<br />
<hr />
<h2 align="center">.env contents</h2>
<p><b>BOT_KEY</b> <- this is the token for the discord bot, found in the developer portal</p>
<p><b>CLIENT_ID</b> <- this is the application ID for the bot, also found in the developer portal</p>
<p><b>GUILD_ID</b> <- this is the server ID that the bot is used in</p>
<p><b>TRACK_ROUTES</b> <- this is the directory on the PC that houses the native music, it can hold up to 25 tracks and the names are automatically configured in the slash command</p>
<p><b>ADMIN_ID</b> <- this is the userID of the admin account, it could be optional but I am leaving it in there for reactions when @ messaged</p><br />

<i><p>-- optionals --</p></i>
<p><b>REACTION_ADMIN</b>  <- tenor gif or other online image, this happens when someone @s the admin account </p>
<p><b>REACTION_1</b>  <- a tenor gif or online image, this sends if a user @ messages the specified person, but I also have it going off a keyword</p>
<p><b>MEMBER_ID1</b>  <- this is what REACTION_1 checks for to see what user was @ messaged</p>
<p><b>REACTION_2</b>  <- a tenor gif or online image, this only happens when the specific user is @ messaged </p>
<p><b>MEMBER_ID2</b>  <- this is what REACTION_2 checks for to see what user was @ messaged </p>
