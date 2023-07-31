


let code = 'AQD2m8Cm2-nh89zxnQR9gsthAqtsX1zIAbgqzcMp19irUiqepR-LlWcGONFVurgyxYAajOKR-Az5JpBJ4TCWSs63AfLSdfvDd36RUWw0KByraWhYu60xcSFnrVd_WIugqOmD9QEhkxdPfdzwRzwR3p0pBZUgCOxdsEnLnArvuM5QPbU0K-BGi7Qb3WAG35qIwc_meNUPkoFd3BM07E9BPg4bBn7jDHr5Wb_nD-WOG2PxGo1KMsm-LtItS4koCEH4mVi9aL185jmkwA'
let authOptions = {
  url: 'https://accounts.spotify.com/api/token',
  form: {
    code,
    redirect_uri: 'https://spotifyauth-37o5.onrender.com/auth/callback/DEV',
    grant_type: 'authorization_code'
  },
  headers: {
    Authorization: 'Basic OWNiMGIwNTE2MTEyNGQ1OGFiMzMxMzk4MDQ4OWUyMTU6NmJmOWM4ODIxMzg4NGEyOGI1NjNkZGE5NGM4ZjA1MGE=',
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  json: true
}
request.post(authOptions, (error, response, body) => {
    console.error({error})
    console.log({body})
})
