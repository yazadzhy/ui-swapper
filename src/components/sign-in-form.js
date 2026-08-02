import {useCallback, useState} from 'react'
import {useAuth0} from '@auth0/auth0-react'
import {authenticate} from '../api/auth'
import {auth0Enabled} from '../app-config'
import {performApiCall} from '../api/api-call'
import {useAutoFocusRef} from '../utils/hooks/auto-focus-ref'
import {Button} from './ui/button'

export default function SignInForm({login}) {
    const {loginWithRedirect} = useAuth0()
    const [credentials, setCredentials] = useState()
    const [isValid, setIsValid] = useState(false)

    const changeInfo = useCallback((key, val) => {
        setCredentials(prev => {
            const newInfo = {...prev, [key]: val.trim()}
            setIsValid(!!newInfo.email && !!newInfo.password)
            return newInfo
        })
    }, [])

    const onAuth = useCallback(() => {
        performApiCall('login', {method: 'POST', auth: false, params: credentials})
            .then((result) => {
                if (result.error)
                    return notify({type: 'error', message: 'Sign in failed. ' + result.error})
                login(authenticate(result.accessToken))
            })
    }, [credentials])

    const changeEmail = useCallback(e => changeInfo('email', e.target.value), [changeInfo])
    const changePassword = useCallback(e => changeInfo('password', e.target.value), [changeInfo])
    const onKeyDown = useCallback(e => {
        if (e.keyCode === 13 && isValid) {
            onAuth()
        }
    }, [onAuth, isValid])

    const redirectToAuth0 = useCallback(screenHint => loginWithRedirect({
        appState: {returnTo: location.pathname + location.search},
        authorizationParams: screenHint ? {screen_hint: screenHint} : undefined
    }), [loginWithRedirect])
    const signInWithAuth0 = useCallback(() => redirectToAuth0(), [redirectToAuth0])
    const signUp = useCallback(e => {
        e.preventDefault()
        redirectToAuth0('signup')
    }, [redirectToAuth0])

    return <div className="w-100" style={{maxWidth: '25em'}}>
        <h3>Sign in</h3>
        <p className="dimmed space">Access your partner account</p>
        <div className="label-space">
            <p className="label">Email</p>
            <input value={credentials?.email || ''} onChange={changeEmail} onKeyDown={onKeyDown} ref={useAutoFocusRef}
                   className="styled-input"/>
        </div>
        <div className="label-space">
            <p className="label">Password</p>
            <input type="password" value={credentials?.password || ''} onChange={changePassword} onKeyDown={onKeyDown}
                   className="styled-input"/>
        </div>
        <Button block disabled={!isValid} className="micro-space" onClick={onAuth}>Sign In</Button>
        {auth0Enabled && <>
            <div className="text-center dimmed text-small micro-space">or</div>
            <Button block outline className="space" onClick={signInWithAuth0}>Login with Auth0</Button>
        </>}
        <p className="text-center dimmed">Don't have an account?&nbsp;
            {auth0Enabled ?
                <a href="#" onClick={signUp}>Create account</a> :
                <a href="/request-access">Request access</a>}
        </p>
    </div>
}
