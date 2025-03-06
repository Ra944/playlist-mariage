const express = require('express');
const axios = require('axios');
const cors = require('cors');
app.use(cors()); // Autoriser toutes les requêtes
require('dotenv').config();

const app = express();
app.use(express.json());

// 🔥 Correction CORS : Permettre l'accès depuis n'importe quel site (ex : WordPress)
app.use(cors({
    origin: '*', // Autorise toutes les origines
    methods: ['GET', 'POST'], // Autorise GET et POST
    allowedHeaders: ['Content-Type', 'Authorization'] // Autorise ces headers
}));

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const PLAYLIST_ID = process.env.SPOTIFY_PLAYLIST_ID;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN;

let accessToken = '';

/**
 * 🎵 Récupérer un nouveau token d'accès à partir du Refresh Token
 */
async function getAccessToken() {
    console.log("🔄 Récupération du token utilisateur...");

    try {
        const response = await axios.post(
            'https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: REFRESH_TOKEN,
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );

        accessToken = response.data.access_token;
        console.log("✅ Nouveau token récupéré :", accessToken);
    } catch (error) {
        console.error("❌ Erreur lors de la récupération du token :", error.response?.data || error.message);
    }
}

/**
 * 🎶 Recherche une chanson sur Spotify
 */
app.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: '❌ Requête invalide : aucun titre fourni.' });

    try {
        const response = await axios.get(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        console.log(`🔍 Résultats de recherche pour "${query}" :`, response.data.tracks.items);
        res.json(response.data.tracks.items);
    } catch (error) {
        console.error("❌ Erreur lors de la recherche :", error.response?.data || error.message);
        res.status(500).json({ error: 'Erreur lors de la recherche de chansons.' });
    }
});

/**
 * 🎵 Ajoute une chanson à la playlist
 */
app.post('/add', async (req, res) => {
    console.log("📩 Requête reçue :", req.body);

    const { trackUri } = req.body;
    if (!trackUri) {
        console.log("❌ Erreur : URI manquant.");
        return res.status(400).json({ error: 'URI manquant' });
    }

    try {
        const response = await axios.post(
            `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks`,
            { uris: [trackUri] },
            { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
        );

        console.log("🎵 Chanson ajoutée :", response.data);
        res.json({ message: '✅ Ajouté avec succès !' });
    } catch (error) {
        console.error("❌ Erreur lors de l'ajout :", error.response?.data || error.message);
        res.status(500).json({ error: 'Erreur lors de l’ajout à la playlist.' });
    }
});

// Démarrer le serveur et récupérer un token à l'initialisation
getAccessToken();
setInterval(getAccessToken, 1800000); // Rafraîchir toutes les 30 minutes

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur en écoute sur http://localhost:${PORT}`));
