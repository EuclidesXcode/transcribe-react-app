const express = require('express');
const { GoogleAuth } = require('google-auth-library');
const app = express();
const port = 3002;

app.use(express.json());

const auth = new GoogleAuth({
  keyFile: './credential.json',
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

app.get('/get-token', async (req, res) => {
  try {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();
    res.json({ accessToken: accessToken.token });
  } catch (error) {
    console.error('Error getting access token:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});