const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = 3001;

// KEEP THESE IN ENV VARS FOR SECURITY!
const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const ACCESS_TOKEN = process.env.TWITCH_OAUTH_TOKEN;

app.use(cors()); // allow requests from your frontend

app.get('/api/stream-status', async (req, res) => {
  const usernames = req.query.usernames;
  if (!usernames) {
    return res.status(400).json({ error: 'Missing usernames param' });
  }
  const loginParams = Array.isArray(usernames)
    ? usernames.map(u => `user_login=${encodeURIComponent(u)}`).join('&')
    : `user_login=${encodeURIComponent(usernames)}`;

  const url = `https://api.twitch.tv/helix/streams?${loginParams}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': 'Bearer ' + ACCESS_TOKEN
      }
    });
    const data = await response.json();
    // Return just the online usernames for frontend
    const online = {};
    if (data.data) {
      data.data.forEach(stream => {
        online[stream.user_login.toLowerCase()] = true;
      });
    }
    res.json(online);
  } catch (error) {
    res.status(500).json({ error: 'Twitch API error' });
  }
});

app.listen(PORT, () => {
  console.log(`Twitch API proxy running on port ${PORT}`);
});