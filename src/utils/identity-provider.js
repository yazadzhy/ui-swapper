const providerNames = {
    auth0: 'Email and password',
    'google-oauth2': 'Google'
}

/**
 * Human-readable name of an Auth0 sign-in method
 * @param {string} provider - Auth0 connection strategy
 * @return {string}
 */
export function describeIdentityProvider(provider) {
    return providerNames[provider] || provider
}
