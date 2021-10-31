import React, { useEffect } from 'react';
import { init } from '../authentication/SpotifyAuthService';

export function Redirect() {
    useEffect(() => {
        const successful = init(window.location.search);
        if (successful) {
            window.location.replace('/');
        }
    })

    return (<div>redirecting ...</div>);
}
