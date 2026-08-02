import {apiOrigin} from '../app-config'
import {getJwt} from './auth'

let sessionRefresher = null

/**
 * Register a callback renewing the service access token from an external identity session
 * @param {function|null} refresher
 */
export function registerSessionRefresher(refresher) {
    sessionRefresher = refresher || null
}

async function renewSession() {
    if (!sessionRefresher)
        return false
    try {
        await sessionRefresher()
        return true
    } catch (e) {
        console.error(e)
        return false
    }
}

/**
 *
 * @param {string} endpointWithQuery
 * @param {'GET'|'POST'|'PUT'|'DELETE'} [method]
 * @param {boolean} [auth]
 * @param {{}} [params]
 * @param {boolean} [retry] - Renew an expired session and repeat the call once
 * @return {Promise<*|{error: string}>}
 */
export async function performApiCall(endpointWithQuery, {method = 'GET', auth = true, params, retry = true} = {}) {
    const url = `${apiOrigin}/${endpointWithQuery}`
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
    if (auth)
        headers['Authorization'] = 'Bearer ' + getJwt()
    try {
        const resp = await fetch(url, {
            headers,
            method,
            body: params ? JSON.stringify(params) : undefined
        })
        if (!resp.ok) {
            //the service token lives an hour -- renew it from the identity provider session instead of dropping the user
            if (resp.status === 401 && auth && retry && await renewSession())
                return await performApiCall(endpointWithQuery, {method, auth, params, retry: false})
            let errorExt
            try {
                errorExt = await resp.json()
            } catch (parsingError) {
                errorExt = {}
            }
            const err = new Error(errorExt?.error || resp.statusText || 'Failed to fetch data from the server')
            err.status = resp.status
            err.ext = errorExt
            throw err
        }
        return await resp.json()
    } catch (e) {
        console.error(e)
        if (e instanceof Error) {
            e = {
                error: e.message,
                status: e.status || 500,
                ext: e.ext
            }
        }
        if (e.ext && e.ext.status) {
            e.status = e.ext.status
        }
        return e
    }
}