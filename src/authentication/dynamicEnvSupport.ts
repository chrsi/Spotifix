/*
 * This module contains logic to support dynamic deployment environments.
 * They are for example used by netlify to provide previews of pull requests.
 */

/**
 * Creates a target url for the authentication redirect.
 * This redirect should be used to move the token to the proper web page.
 * It should represent the url of the dynamic environment.
 */
export function createRedirectTarget() {
    return `${window.location.protocol}//${window.location.host}/redirect`;
}

/**
 * Redirect to the dynamic environment in case one is targeted.
 * If the target is the current page then nothing will be done.
 * This step is required because dynamic environments can't be targeted by oauth2 redirects.
 * 
 * @param target the actual target of the authentication response
 * @param params the url parameters containing the authentication information
 * @return true when it was in fact a dynamic environment
 */
export function redirectIfDynamicEnvironment(target: string, params: URLSearchParams) {
    const redirectTarget = new URL(target);

    if (window.location.host !== redirectTarget.host) {
        const newLocation = `${redirectTarget}?${params}`
        window.location.replace(newLocation);
        return true;
    }

    return false;
}
