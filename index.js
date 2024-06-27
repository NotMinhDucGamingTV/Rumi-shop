require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { Client, GatewayIntentBits } = require('discord.js');
const app = express();
const PORT = 3000;

// Discord Bot Setup
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once('ready', () => {
  client.user.setPresence({ 
    activities: [], 
    status: 'offline' 
});

});
const { ActivityType } = require('discord.js')


client.login(process.env.DISCORD_BOT_TOKEN);

// OAuth2 Authorization URL
const authorizationUrl = `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20guilds%20guilds.members.read`;

// Routes
app.get('/community/verify', (req, res) => {
  res.redirect(authorizationUrl);
});

app.get('/community/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('No code provided');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Fetch user information
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const userId = userResponse.data.id;

    // Fetch guild member information
    const guildMemberResponse = await axios.get(`https://discord.com/api/guilds/${process.env.GUILD_ID}/members/${userId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    });

    const roles = guildMemberResponse.data.roles;
    const hasRole = roles.includes(process.env.ROLE_ID);

    if (hasRole) {
      res.send('User already has the role.');
    } else {
      // Add role to user
      const guild = await client.guilds.fetch(process.env.GUILD_ID);
      const member = await guild.members.fetch(userId);
      await member.roles.add(process.env.ROLE_ID);
      res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Regna</title>
    <style>
        body {
            background-color: #222;
            color: #fff;
            font-family: sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }

        .container {
            text-align: center;
        }

        h1 {
            font-size: 3em;
            margin-bottom: 1em;
        }

        p {
            font-size: 1.2em;
            margin-bottom: 2em;
        }

        button {
            background-color: #4CAF50;
            border: none;
            color: white;
            padding: 15px 32px;
            text-align: center;
            text-decoration: none;
            display: inline-block;
            font-size: 16px;
            margin: 4px 2px;
            cursor: pointer;
            border-radius: 5px;
        }

        button:hover {
            background-color: #3e8e41;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Chào mừng tới dinh thự!</h1>
    </div>
</body>
</html>`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
