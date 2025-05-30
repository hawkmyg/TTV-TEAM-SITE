# The Crew Live Streams

A responsive web app to watch and chat with multiple Twitch streamers, featuring a live sidebar, embedded video and chat, and support for donations.

## Features

- **Sidebar:** List of streamers with live/offline status and pagination
- **Embedded Twitch Video & Chat:** Watch and chat with your favorite streamers right on the site
- **Auto-Switch:** Automatically switches to the next live streamer if the current stream becomes un-embeddable (e.g., after a raid)
- **Donate Button:** Integrated PayPal donate button
- **Responsive Design:** Works on desktop and mobile browsers
- **Dark Theme**

## Usage

1. **Clone or download the repo**
2. **Add your own `streamers.json`** in the project root, for example:
    ```json
    [
      { "username": "prostyle79", "displayName": "ProStyle79" },
      { "username": "ragingstray", "displayName": "RagingStray" }
    ]
    ```
3. **Set your Twitch API credentials** in `main.js`:
    ```js
    const clientId = "YOUR_TWITCH_CLIENT_ID";
    const accessToken = "YOUR_TWITCH_OAUTH_TOKEN";
    ```
    > **Important:** For production, move your credentials to a backend for security.

4. **Deploy**  
   - You can serve the files with any static web server (Netlify, Vercel, GitHub Pages, etc.)

## Project Structure

```
/
├── index.html
├── main.js
├── style.css
├── streamers.json
└── README.md
```

## Notes

- **No overlays or filters on `#chat-container`**: For Twitch chat to work, do not apply CSS like `backdrop-filter` or overlays on the chat container.
- **Browser Extensions:** Some extensions may interfere with embed behavior. Test with extensions disabled if you see issues.
- **Permissions Policy Warnings:** Console warnings about `deviceorientation` or `accelerometer` can be ignored.

## License

[MIT](LICENSE)

---

Made with ❤️ by RagingStray & contributors.