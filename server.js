// server.js
// http://spotify.soar-corowa.com:5000/auth/token/
// https://spotifyauth-37o5.onrender.com

const express = require('express')
const request = require('request')
const dotenv = require('dotenv')
const cors = require('cors')
const Cache = require('node-cache')

const port = 5000
const minsTTL = 10

const cache = new Cache({ stdTTL: 60 }) /* state => http_ref */

global.access_token = ''

dotenv.config()

// const spotify_client_id = process.env.SPOTIFY_CLIENT_ID
// const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET
const {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
} = process.env
// const SPOTIFY_REDIRECT_URI = 'http://localhost:3000/auth/callback'
// const SPOTIFY_REDIRECT_URI = 'https://spotifyauth-37o5.onrender.com/auth/callback'

const generateRandomString = function (length) {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

if (!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET)) process.exit()

const app = express()
app.use(cors()) /* enable CORS for all requests */

app.get('/auth/login', (req, res) => {

    const scope = 'streaming user-read-email user-read-private'
    const state = generateRandomString(16)
    const SPOTIFY_REDIRECT_URI = `${request.headers.host}/auth/callback`

    /* record http referrer for state */
    cache.set(state, request.headers.referer)

    const auth_query_parameters = new URLSearchParams({
        response_type: 'code',
        client_id: SPOTIFY_CLIENT_ID,
        scope: scope,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        state: state
    })

    res.redirect(`https://accounts.spotify.com/authorize/?${auth_query_parameters.toString()}`)
})

app.get('/auth/callback', (req, res) => {

    const code = req.query.code
    const state = req.query.state

    let referer = 'https://spotify.soar-corowa.com' /* hard-coded default */
    try {
        referer = cache.has(state) ? cache.get(state) : referer
    }
    catch (err) {
        
    }

    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        json: true
    }
    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            access_token = body.access_token
            // res.redirect('/') /* only works if server and react app running in same instance */
            // res.redirect('https://spotify.soar-corowa.com')
            res.redirect(referer)
        }
    })
})

app.get('/auth/token', (req, res) => {
    res.json({ access_token: access_token })
})

app.get('/auth/token/:rest', (req, res) => {
    res.json({ access_token: access_token })
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})
