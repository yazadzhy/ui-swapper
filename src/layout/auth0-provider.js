import {useEffect} from 'react'
import {Auth0Provider, useAuth0} from '@auth0/auth0-react'
import {registerSessionRefresher} from '../api/api-call'
import {auth0, auth0Enabled} from '../app-config'
import {auth0RedirectUri, exchangeAuth0Token, setLinkMode, setReturnTo} from '../api/auth0-session'

/**
 * Auth0 identity provider context. Renders children as is when Auth0 authentication is not configured
 */
export default function AppAuth0Provider({children}) {
    if (!auth0Enabled)
        return children
    return <Auth0Provider domain={auth0.domain} clientId={auth0.clientId} useRefreshTokens
                          cacheLocation="localstorage"
                          authorizationParams={{redirect_uri: auth0RedirectUri, audience: auth0.audience}}
                          onRedirectCallback={onRedirectCallback}>
        <SessionRefreshBridge/>
        {children}
    </Auth0Provider>
}

function onRedirectCallback(appState) {
    setReturnTo(appState?.returnTo)
    setLinkMode(appState?.linkIdentity)
}

/**
 * Expose the Auth0 token accessor to the API client, which lives outside of the React tree
 */
function SessionRefreshBridge() {
    const {isAuthenticated, getAccessTokenSilently} = useAuth0()

    useEffect(() => {
        if (!isAuthenticated) {
            registerSessionRefresher(null)
            return
        }
        registerSessionRefresher(() => exchangeAuth0Token(getAccessTokenSilently))
        return () => registerSessionRefresher(null)
    }, [isAuthenticated, getAccessTokenSilently])

    return null
}
