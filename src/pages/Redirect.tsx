import React, { useEffect } from 'react';
import { init } from '../authentication/SpotifyAuthService';

export function Redirect() {
    useEffect(() => {
        init(window.location.search);
        window.location.replace('/');
    })

    return (<div>redirecting ...</div>);
}
