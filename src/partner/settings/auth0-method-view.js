import React, {useCallback, useEffect, useState} from 'react'
import {useAuth0} from '@auth0/auth0-react'
import {performApiCall} from '../../api/api-call'
import {refreshAuth0Identity, startIdentityLinking} from '../../api/auth0-session'
import {auth0Enabled} from '../../app-config'
import {describeIdentityProvider} from '../../utils/identity-provider'
import {Button} from '../../components/ui/button'

/**
 * The Auth0 sign-in method of the partner account. An account has at most one, and connecting another
 * replaces it -- that is how the method gets changed
 */
export default function Auth0MethodView({partnerInfo, onChange}) {
    const {isAuthenticated, loginWithRedirect, getAccessTokenSilently} = useAuth0()
    const [busy, setBusy] = useState(false)
    const {identity} = partnerInfo
    //the check below starts before the first paint, so claiming "not confirmed" up front would be a lie
    const [checking, setChecking] = useState(() => !!identity && !identity.emailVerified)

    //the address is confirmed inside Auth0, so the stored state can only be stale -- re-read it on every visit
    useEffect(() => {
        if (!isAuthenticated || !identity || identity.emailVerified) {
            setChecking(false)
            return
        }
        let obsolete = false
        setChecking(true)
        refreshAuth0Identity(getAccessTokenSilently)
            .then(result => {
                if (!obsolete) {
                    onChange(result)
                }
            })
            .catch(console.error) //a stale badge is not worth bothering the user about
            .then(() => {
                if (!obsolete) {
                    setChecking(false)
                }
            })
        return () => {
            obsolete = true
        }
    }, [isAuthenticated, identity?.id, identity?.emailVerified])

    const connect = useCallback(e => {
        e.preventDefault()
        startIdentityLinking(loginWithRedirect)
    }, [loginWithRedirect])

    const resend = useCallback(e => {
        e.preventDefault()
        setBusy(true)
        performApiCall('partner/identity/verification', {method: 'POST'})
            .then(result => notify(result.error ?
                {type: 'error', message: 'Failed to send the confirmation email. ' + result.error} :
                {type: 'success', message: 'Confirmation email sent'}))
            .finally(() => setBusy(false))
    }, [])

    const remove = useCallback(e => {
        e.preventDefault()
        if (!confirm('Remove the Auth0 sign-in method?'))
            return
        setBusy(true)
        performApiCall('partner/identity', {method: 'DELETE'})
            .then(result => {
                if (result.error)
                    return notify({type: 'error', message: 'Failed to remove the sign-in method. ' + result.error})
                onChange(result)
                notify({type: 'success', message: 'Sign-in method removed'})
            })
            .finally(() => setBusy(false))
    }, [onChange])

    if (!auth0Enabled)
        return null

    //without a local password the account would become unreachable, so the method may only be replaced
    const removable = partnerInfo.authProvider === 'password'

    return <div className="double-space">
        <div className="dual-layout middle space">
            <div className="text-tiny">
                <strong>Auth0 sign-in method</strong>
                <div className="dimmed">Ways to access this account</div>
            </div>
            <div>
                {identity ?
                    <VerificationStatus verified={identity.emailVerified} checking={checking}/> :
                    <Button small secondary onClick={connect} style={{margin: 0}}>Add</Button>}
            </div>
        </div>
        {!!identity && <div className="card outline micro-space text-tiny">
            <div className="dual-layout middle">
                <div>{describeIdentityProvider(identity.provider)}</div>
                <div>
                    {/*separators sit outside the anchors so that the gap itself is not clickable*/}
                    {!identity.emailVerified && <>
                        <a href="#" onClick={busy ? undefined : resend} className="dimmed">Resend verification link</a>
                        &emsp;
                    </>}
                    <a href="#" onClick={connect} className="dimmed">Change</a>
                    {removable && <>
                        &emsp;<a href="#" onClick={busy ? undefined : remove} className="dimmed">Remove</a>
                    </>}
                </div>
            </div>
        </div>}
    </div>
}

function VerificationStatus({verified, checking}) {
    if (verified)
        return <span className="badge up badge-pill"><i className="icon-check-circle"/>&nbsp;Verified</span>
    if (checking) //Auth0 is being asked right now whether the address has been confirmed since we last looked
        return <span className="badge badge-pill dimmed">Checking…</span>
    return <span className="badge warning badge-pill"><i className="icon-warning-circle"/>&nbsp;Waiting for verification</span>
}
