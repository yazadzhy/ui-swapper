import {useCallback, useEffect, useRef, useState} from 'react'
import {useAuth0} from '@auth0/auth0-react'
import {getAuth} from '../api/auth'
import {
    consumeLinkMode,
    consumeReturnTo,
    exchangeAuth0Token,
    linkAuth0Identity,
    resendVerificationEmail
} from '../api/auth0-session'
import {navigation} from '../utils/navigation'
import {setPageMetadata} from '../utils/meta-tags-generator'
import {Button} from '../components/ui/button'
import {Loader} from '../components/ui/loader'
import Logo from '../layout/logo'
import Footer from '../layout/footer'
import PageLayout from '../layout/page-layout'

export default function AuthCallbackPage() {
    const {error, linkIdentity} = useTokenExchange()

    setPageMetadata({
        title: linkIdentity ? 'Adding sign-in method' : 'Signing in',
        description: 'Account authorization.'
    })

    return <PageLayout compact>
        <div className="row row-no-padding dual-screen bg-color-white">
            <div className="column column-40">
                <div className="middle-layout">
                    <div className="space">
                        <Logo/>
                    </div>
                    <AuthCallbackStatus error={error} linkIdentity={linkIdentity}/>
                    <div className="space mobile-only"/>
                    <Footer/>
                </div>
            </div>
            <div className="column column-60 bg-color-primary flex-middle desktop-only overflow-hidden">
                <img src="/img/dashboard.png" className="promo" style={{maxHeight: '80vh'}} alt=""/>
            </div>
        </div>
    </PageLayout>
}

function AuthCallbackStatus({error, linkIdentity}) {
    if (!error)
        return <div className="w-100 text-center" style={{maxWidth: '25em'}}>
            <Loader large/>
            <p className="dimmed space">{linkIdentity ? 'Adding the sign-in method…' : 'Signing you in…'}</p>
        </div>

    if (error.code === 'email_not_verified')
        return <EmailConfirmationRequired/>

    return <div className="w-100" style={{maxWidth: '25em'}}>
        <h3>Sign in failed</h3>
        <p className="dimmed space">{error.message || 'Authorization failed. Please try again.'}</p>
        <Button block href="/sign-in">Back to sign in</Button>
    </div>
}

function EmailConfirmationRequired() {
    const {getAccessTokenSilently} = useAuth0()
    const [sending, setSending] = useState(false)

    const resend = useCallback(() => {
        setSending(true)
        resendVerificationEmail(getAccessTokenSilently)
            .then(() => notify({type: 'success', message: 'Confirmation email sent'}))
            .catch(e => notify({type: 'error', message: 'Failed to send the confirmation email. ' + e.message}))
            .finally(() => setSending(false))
    }, [getAccessTokenSilently])

    return <div className="w-100" style={{maxWidth: '25em'}}>
        <h3>Confirm your email</h3>
        <p className="dimmed space">
            We sent a confirmation link to your email address. Please follow it to activate your partner account,
            then sign in again.
        </p>
        <Button block disabled={sending} onClick={resend}>Resend confirmation email</Button>
        <Button block outline href="/sign-in">Back to sign in</Button>
    </div>
}

/**
 * Complete the Auth0 redirect once the SDK finishes processing it, either by starting a service session
 * or by attaching the identity to the account that is already signed in
 * @return {{error: Error|null, linkIdentity: boolean}}
 * @private
 */
function useTokenExchange() {
    const {isLoading, isAuthenticated, error, getAccessTokenSilently} = useAuth0()
    //the SDK reports the redirect intent only once it has processed the callback, which is well after the first
    //render -- reading it any earlier always yields the default and silently turns a link into a new sign-in
    const started = useRef(false)
    const [linkIdentity, setLinkIdentity] = useState(false)
    const [failure, setFailure] = useState(null)

    useEffect(() => {
        if (isLoading || error) //an Auth0-side failure is rendered here instead of being lost in a redirect
            return
        if (!isAuthenticated) //nothing to exchange -- the user landed here without an Auth0 session
            return navigation.navigate('/sign-in')
        if (started.current) //a redirect is completed exactly once, however many times the effect runs
            return
        started.current = true
        const linking = consumeLinkMode()
        setLinkIdentity(linking)
        let obsolete = false
        const goBack = () => {
            if (!obsolete) {
                navigation.navigate(consumeReturnTo() || defaultDestination())
            }
        }
        if (linking) {
            //the service session is left untouched -- only one more way to reach the same account is added
            //the settings page shows whether the address still needs confirming, so this only reports the outcome
            linkAuth0Identity(getAccessTokenSilently)
                .then(() => notify({type: 'success', message: 'Auth0 sign-in method connected'}))
                .catch(e => notify({type: 'error', message: 'Failed to connect the sign-in method. ' + e.message}))
                .then(goBack)
        } else {
            exchangeAuth0Token(getAccessTokenSilently)
                .then(goBack)
                .catch(e => {
                    if (!obsolete) {
                        setFailure(e)
                    }
                })
        }
        return () => {
            obsolete = true
        }
    }, [isLoading, isAuthenticated, error, getAccessTokenSilently])

    return {error: error || failure, linkIdentity}
}

function defaultDestination() {
    return getAuth()?.roles?.includes('admin') ? '/admin/' : '/account/'
}
