import React, { useState } from 'react';
import { useHistory } from 'react-router';
import { isLoggedIn, logout } from '../authentication/SpotifyAuthService';
import { readUser } from '../services/spotify-api';

export function Spotifix() {
    const [userName, setUserName ] = useState('');
    const history = useHistory();

    isLoggedIn().then(isLoggedIn => {
        if (!isLoggedIn) {
            history.push('/login');
        }
    })

    readUser().then(val => {
        if (val != null) {
            setUserName(val.userName);
        }
    })

    return (
        <div>
            <div>Hello, {userName}</div>
            <button onClick={logout}>Logout</button>
        </div>
    );
}
