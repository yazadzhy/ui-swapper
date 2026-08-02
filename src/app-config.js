import config from './app.config.json'

/**
 * Management API origin
 * @type {string}
 */
export const apiOrigin = config.apiOrigin || 'https://management.stellar.broker'

/**
 * Public Auth0 tenant settings. Only identifiers belong here -- this file is compiled into the browser bundle
 * @type {{domain: string, clientId: string, audience: string}}
 */
export const auth0 = {
    domain: config.auth0?.domain || '',
    clientId: config.auth0?.clientId || '',
    audience: config.auth0?.audience || ''
}

/**
 * Whether Auth0 authentication is available in this build.
 * The audience matters as much as the rest -- without it Auth0 issues an opaque token the API cannot verify
 * @type {boolean}
 */
export const auth0Enabled = !!(auth0.domain && auth0.clientId && auth0.audience)
