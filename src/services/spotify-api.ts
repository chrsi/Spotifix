import { getAccessToken } from "../authentication/SpotifyAuthService";
import { SpotifyUser } from "./dto/spotify-user";

export async function readUser(): Promise<SpotifyUser | null> {
    const bearer = await getAccessToken();

    var response = await fetch('https://api.spotify.com/v1/me', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${bearer}`
        }
    })

    if (response.status === 200) {
        const content = await response.json();
        return {
            id: content.id,
            userName: content.display_name
        }
    } else {
        return null;
    }
}
