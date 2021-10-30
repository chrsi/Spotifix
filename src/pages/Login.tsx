import React from 'react';
import { useHistory } from 'react-router';
import { isLoggedIn, login } from '../authentication/SpotifyAuthService';

export function Login() {
    const history = useHistory();

    isLoggedIn().then(isLoggedIn => {
        if (isLoggedIn) {
            history.replace('/');
        }
    })

    return (
        <button onClick={login}>Login</button>
    )
}
