import { logError } from "../services/logger";
import { createRedirectTarget, redirectIfDynamicEnvironment } from "./dynamicEnvSupport";
import { getSecret, removeSecret, storeSecret } from "./secretStorage";

const KEY_AUTHENTICATION_CODE = 'authentication_code';
const KEY_CODE_CHALLENGE = 'code_challenge';
const KEY_ACCESS_TOKEN = 'access_token';
const KEY_ACCESS_TOKEN_EXPIRATION = 'access_token_expiration';
const KEY_REFRESH_TOKEN = 'refresh_token'


async function createChallenge(): Promise<[string, string]> {
    const randomValues = new Uint8Array(96);
    crypto.getRandomValues(randomValues);
    const code_verifier = Buffer.from(randomValues).toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    const hashedChallenge = await crypto.subtle.digest('SHA-256', Buffer.from(code_verifier));
    const code_challenge = Buffer.from(hashedChallenge).toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');

    return [code_verifier, code_challenge];
}

export async function login() {
    const [ code_verifier, code_challenge ] = await createChallenge();
    storeSecret(KEY_CODE_CHALLENGE, code_verifier);

    const state = JSON.stringify({
        // To support dynamic environments the proper redirect target will be written to the state.
        // Since the state can carry information between AS and client we can use it to maintain the target.
        target: createRedirectTarget()
    })

    const queryParams = new URLSearchParams({
        client_id: process.env.REACT_APP_SPOTIFY_CLIENT_ID ?? '',
        response_type: 'code',
        scope: 'playlist-modify-public',
        redirect_uri: `${process.env.REACT_APP_BASE_URL}/redirect`,
        code_challenge_method: 'S256',
        code_challenge,
        state
    })

    window.open('https://accounts.spotify.com/authorize?' + queryParams);
}

export async function logout() {
    removeSecret(
        KEY_REFRESH_TOKEN,
        KEY_CODE_CHALLENGE,
        KEY_ACCESS_TOKEN,
        KEY_ACCESS_TOKEN_EXPIRATION,
        KEY_AUTHENTICATION_CODE
        );
}

export function init(url: string): boolean {
    const params = new URLSearchParams(url);

    // When the request originates from an dynamic environment we have to redirect the token back to it.
    // The information about where the request originates from is present in the state param.
    const target = JSON.parse(params.get('state') ?? '').target;
    if (target != null) {
        const isDynamicEnv = redirectIfDynamicEnvironment(target, params);
        if (isDynamicEnv) {
            return false;
        }
    }
    
    const authenticationCode = params.get('code');
    if (authenticationCode != null) {
        storeSecret(KEY_AUTHENTICATION_CODE, authenticationCode);
        return true;
    } else {
        return false;
    }
}

export async function isLoggedIn() {
    const token = await getAccessToken();
    return token != null;
}

export async function getAccessToken(): Promise<string | null> {
    const accessToken = getSecret(KEY_ACCESS_TOKEN);
    const accessTokenExpiration = +(getSecret(KEY_ACCESS_TOKEN_EXPIRATION) ?? '0');
    const refreshToken = getSecret(KEY_REFRESH_TOKEN);

    if (accessToken != null && new Date().getTime() < accessTokenExpiration) {
        return accessToken;
    } else if (refreshToken != null) {
        const token = await refreshAccessToken(refreshToken);
        if (token) {
            storeSecret(KEY_ACCESS_TOKEN, token.accessToken);
            storeSecret(KEY_REFRESH_TOKEN, token.refreshToken);
            storeSecret(KEY_ACCESS_TOKEN_EXPIRATION, token.expiration);
            return token.accessToken;
        } else {
            removeSecret(KEY_REFRESH_TOKEN);
            return null;
        }
    } else {
        const code = getSecret(KEY_AUTHENTICATION_CODE);
        const codeVerifier = getSecret(KEY_CODE_CHALLENGE)

        if (code == null ||codeVerifier == null) {
            logError('No code or code_verifier found.');
            return null;
        }

        var token = await fetchAccessToken(code, codeVerifier);
        if (token) {
            storeSecret(KEY_ACCESS_TOKEN, token.accessToken);
            storeSecret(KEY_REFRESH_TOKEN, token.refreshToken);
            storeSecret(KEY_ACCESS_TOKEN_EXPIRATION, token.expiration);
            return token.accessToken;
        } else {
            window.location.replace('/')
            removeSecret(KEY_AUTHENTICATION_CODE);
            removeSecret(KEY_CODE_CHALLENGE);
            return null;
        }
    }
}

async function refreshAccessToken(refresh_token: string) {
    const authData = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
        client_id: process.env.REACT_APP_SPOTIFY_CLIENT_ID ?? '',
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: authData
    });

    if (response.status === 200) {
        var content = await response.json();
        const expiration = new Date();
        expiration.setSeconds(expiration.getSeconds()+content.expires_in);

        return {
            accessToken: content.access_token,
            refreshToken: content.refresh_token,
            expiration: expiration.getTime().toString()
        }
    } else {
        return null;
    }
}

async function fetchAccessToken(code: string, code_verifier: string) {
    const authData = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.REACT_APP_BASE_URL}/redirect`,
        client_id: process.env.REACT_APP_SPOTIFY_CLIENT_ID ?? '',
        code_verifier
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: authData
    });

    if (response.status === 200) {
        var content = await response.json();
        const expiration = new Date();
        expiration.setSeconds(expiration.getSeconds()+content.expires_in);

        return {
            accessToken: content.access_token,
            refreshToken: content.refresh_token,
            expiration: expiration.getTime().toString()
        }
    } else {
        return null;
    }
}
