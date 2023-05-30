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

const cache = new Cache({ stdTTL: 59 }) /* state => http_ref */

// global.access_token = ''

dotenv.config()

// const spotify_client_id = process.env.SPOTIFY_CLIENT_ID
// const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET
const {
    SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET,
} = process.env
// const SPOTIFY_REDIRECT_URI = 'http://localhost:3000/auth/callback'
// const SPOTIFY_REDIRECT_URI = 'https://spotifyauth-37o5.onrender.com/auth/callback'

if (!(SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET)) process.exit()
const b64 = Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
// const access_token_cached = cache.has(b64) ? cache.get(b64) : ''
console.log(32, { cache_keys: cache.keys() })

const generateRandomString = function (length) {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
}

const app = express()
app.use(cors()) /* enable CORS for all requests */

/* middleware to capture IP address */
let ipAddr
app.use((req, res, next) => {
    // console.log(49, { headers: req.headers })
    const forwarded = req.headers['x-forwarded-for']
    ipAddr = forwarded ? forwarded.split(/, /)[0] : req.connection.remoteAddress
    const r = ipAddr.match(/((\d{1,3}\.){3}\d{1,3})/)
    ipAddr = r ? r[1] : ipAddr
    next()
})

app.get('/auth/login', (req, res) => {

    const scope = 'streaming user-read-email user-read-private'
    const state = generateRandomString(16)
    const SPOTIFY_REDIRECT_URI = `https://${req.headers.host}/auth/callback`

    // /* record http referrer for state */
    // cache.set(state, req.headers.referer)

    const auth_query_parameters = new URLSearchParams({
        response_type: 'code',
        client_id: SPOTIFY_CLIENT_ID,
        scope: scope,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        state: state
    })
    const loginUrl = `https://accounts.spotify.com/authorize/?${auth_query_parameters.toString()}`
    console.log(60, 'loginUrl:', loginUrl)

    res.redirect(loginUrl)
})

app.get('/auth/callback', (req, res) => {

    console.log(71, 'req.query:', { req_query: req.query })
    // const code = req.query.code
    // const state = req.query.state
    const { code, state } = req.query

    if (!code || !state) return res.sendStatus(400)

    const SPOTIFY_REDIRECT_URI = `https://${req.headers.host}/auth/callback`

    let referer = 'https://spotify.soar-corowa.com' /* hard-coded default */
    // try {
        // referer = cache.has(state) ? cache.get(state) : referer /* ?????? */
    // }
    // catch (err) {}

    // /* add code to referrer */
    // referer = `${referer}?code=${code}`

    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
            code: code,
            redirect_uri: SPOTIFY_REDIRECT_URI,
            grant_type: 'authorization_code'
        },
        headers: {
            'Authorization': `Basic ${b64}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        json: true
    }
    request.post(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            // access_token = body.access_token

            console.log(97, { body })
            const {
                access_token,
                refresh_token,
                expires_in,
            } = body
            cache.set(`${b64}_access`, access_token)
            cache.set(`${b64}_refresh`, refresh_token)
            cache.set(`${b64}_expiry`, expires_in)

            // res.redirect('/') /* only works if server and react app running in same instance */
            // res.redirect('https://spotify.soar-corowa.com')
            res.redirect(referer)
        }
    })
})

const supply_tokens = (req, res) => {
    const access_token_cached  = cache.has(`${b64}_access`)  ? cache.get(`${b64}_access`)  : ''
    const refresh_token_cached = cache.has(`${b64}_refresh`) ? cache.get(`${b64}_refresh`) : ''
    const expires_in_cached    = cache.has(`${b64}_expiry`)  ? cache.get(`${b64}_expiry`)  : ''
    console.log(137, { access_token_cached })
    res.json({
        access_token:   access_token_cached,
        refresh_token:  refresh_token_cached,
        expires_in:     expires_in_cached,
        ip_address:     ipAddr,
    })
}

const router = require('express').Router()
router.get('/auth/token', supply_tokens)
router.get('/auth/token/:rest', supply_tokens)

/*
app.get('/auth/token', (req, res) => {
    const access_token_cached  = cache.has(`${b64}_access`)  ? cache.get(`${b64}_access`)  : ''
    const refresh_token_cached = cache.has(`${b64}_refresh`) ? cache.get(`${b64}_refresh`) : ''
    const expires_in_cached    = cache.has(`${b64}_expiry`)  ? cache.get(`${b64}_expiry`)  : ''
    console.log(112, { access_token_cached })
    res.json({
        access_token:   access_token_cached,
        refresh_token:  refresh_token_cached,
        expires_in:     expires_in_cached,
        ip_address:     ipAddr,
    })
})

app.get('/auth/token/:rest', (req, res) => {
    const access_token_cached  = cache.has(`${b64}_access`)  ? cache.get(`${b64}_access`)  : ''
    const refresh_token_cached = cache.has(`${b64}_refresh`) ? cache.get(`${b64}_refresh`) : ''
    const expires_in_cached    = cache.has(`${b64}_expiry`)  ? cache.get(`${b64}_expiry`)  : ''
    console.log(118, { access_token_cached })
    res.json({ access_token: access_token_cached, ip_address: ipAddr })
})
*/

app.get('/auth/refresh', (req, res) => {
    const refresh_token = req.query.refresh_token
    const authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': `Basic ${b64}`,
        },
        form: {
          grant_type: 'refresh_token',
          refresh_token: refresh_token
        },
        json: true
    }
    request.post(authOptions, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            access_token = body.access_token
            cache.set(`${b64}_access`, access_token)
            res.send({
                'access_token': access_token
            })
        }
    })
})

app.get('/me', (req, res) => {
    //res.json({ access_token: access_token })
    const access_token_cached  = cache.has(`${b64}_access`)  ? cache.get(`${b64}_access`)  : ''
    const refresh_token_cached = cache.has(`${b64}_refresh`) ? cache.get(`${b64}_refresh`) : ''
    console.log(125, { access_token_cached, refresh_token_cached })
    if (!access_token_cached) return res.json({boo: 'hoo!'})
    const authOptions = {
        url: 'https://api.spotify.com/v1/me',
        headers: {
            'Authorization': `Basic ${access_token_cached}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        json: true
    }
    // request.fet
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`)
})
