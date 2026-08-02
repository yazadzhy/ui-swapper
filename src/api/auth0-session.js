import {performApiCall} from './api-call'
import {authenticate} from './auth'

/**
 * Auth0 redirect target, registered in the Auth0 application settings
 * @type {string}
 */
export const auth0RedirectUri = window.location.origin + '/auth/callback'

//auth pages themselves are pointless as a post-login destination
const nonReturnablePaths = ['/sign-in', '/sign-up', '/request-access', '/auth/callback']

let pendingReturnTo = null
let pendingLinkIdentity = false

/**
 * Remember the location a user requested before being redirected to Auth0
 * @param {string} [returnTo]
 */
export function setReturnTo(returnTo) {
    pendingReturnTo = returnTo && !nonReturnablePaths.some(path => returnTo.startsWith(path)) ? returnTo : null
}

/**
 * Read and reset the remembered post-login location
 * @return {string|null}
 */
export function consumeReturnTo() {
    const returnTo = pendingReturnTo
    pendingReturnTo = null
    return returnTo
}

/**
 * Remember that the pending redirect adds a sign-in method instead of starting a new session
 * @param {boolean} [linkIdentity]
 */
export function setLinkMode(linkIdentity) {
    pendingLinkIdentity = !!linkIdentity
}

/**
 * Read and reset the intent of the pending redirect
 * @return {boolean}
 */
export function consumeLinkMode() {
    const linkIdentity = pendingLinkIdentity
    pendingLinkIdentity = false
    return linkIdentity
}

/**
 * Send the user to Auth0 to authenticate with one more identity, to be linked to the current account
 * @param {function} loginWithRedirect - Redirect helper provided by the Auth0 SDK
 * @return {Promise<void>}
 */
export function startIdentityLinking(loginWithRedirect) {
    return loginWithRedirect({
        appState: {returnTo: location.pathname + location.search, linkIdentity: true},
        //force a fresh authentication, otherwise Auth0 reuses the session of the identity already signed in
        authorizationParams: {prompt: 'login'}
    })
}

/**
 * Post an Auth0 access token to an endpoint that accepts it in place of a service token
 * @param {string} endpoint
 * @param {function} getAccessTokenSilently - Token accessor provided by the Auth0 SDK
 * @param {boolean} [auth] - Send the current service token alongside
 * @return {Promise<{}>}
 */
async function postAuth0Token(endpoint, getAccessTokenSilently, auth = false) {
    const accessToken = await getAccessTokenSilently()
    //never retry -- renewing an expired service token here would replace the session with the identity being linked
    const result = await performApiCall(endpoint, {method: 'POST', auth, retry: false, params: {accessToken}})
    if (result.error) {
        const error = new Error(result.error)
        error.code = result.ext?.code //e.g. email_not_verified
        throw error
    }
    return result
}

/**
 * Exchange an Auth0 access token for a service access token and store it
 * @param {function} getAccessTokenSilently - Token accessor provided by the Auth0 SDK
 * @return {Promise<{}>} - Partner account data
 */
export async function exchangeAuth0Token(getAccessTokenSilently) {
    const result = await postAuth0Token('login/auth0', getAccessTokenSilently)
    if (!authenticate(result.accessToken))
        throw new Error('Server returned an invalid access token')
    return result
}

/**
 * Attach the identity the user has just authenticated with to the account of the current service session
 * @param {function} getAccessTokenSilently - Token accessor provided by the Auth0 SDK
 * @return {Promise<{}>} - Updated partner account data
 */
export async function linkAuth0Identity(getAccessTokenSilently) {
    return await postAuth0Token('partner/identity', getAccessTokenSilently, true)
}

/**
 * Re-read the confirmation state of the linked identity from Auth0
 * @param {function} getAccessTokenSilently - Token accessor provided by the Auth0 SDK
 * @return {Promise<{}>} - Updated partner account data
 */
export async function refreshAuth0Identity(getAccessTokenSilently) {
    //bypass the token cache -- the address was confirmed after the cached token had been issued
    return await postAuth0Token('partner/identity/refresh', () => getAccessTokenSilently({cacheMode: 'off'}), true)
}

/**
 * Ask Auth0 to send another email address confirmation message
 * @param {function} getAccessTokenSilently - Token accessor provided by the Auth0 SDK
 * @return {Promise<void>}
 */
export async function resendVerificationEmail(getAccessTokenSilently) {
    await postAuth0Token('login/auth0/resend-verification', getAccessTokenSilently)
}
