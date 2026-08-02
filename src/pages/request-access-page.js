import {useCallback} from 'react'
import {useAuth0} from '@auth0/auth0-react'
import {auth0Enabled} from '../app-config'
import {setPageMetadata} from '../utils/meta-tags-generator'
import {Button} from '../components/ui/button'
import Logo from '../layout/logo'
import Footer from '../layout/footer'
import PageLayout from '../layout/page-layout'

export default function RequestAccessPage() {
    setPageMetadata({
        title: 'Create partner account',
        description: 'Sign up to start using the StellarBroker API.'
    })

    return <PageLayout compact>
        <div className="row row-no-padding dual-screen bg-color-white">
            <div className="column column-40">
                <div className="middle-layout">
                    <div className="space">
                        <Logo/>
                    </div>
                    <SignUpBlock/>
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

function SignUpBlock() {
    const {loginWithRedirect} = useAuth0()

    const signUp = useCallback(() => loginWithRedirect({
        authorizationParams: {screen_hint: 'signup'}
    }), [loginWithRedirect])

    return <div className="w-100" style={{maxWidth: '25em'}}>
        <h3>Create partner account</h3>
        <p className="dimmed space">
            Sign up, confirm your email address, and your partner dashboard is ready right away.
            API keys are issued once our team reviews the account.
        </p>
        {auth0Enabled ?
            <Button block onClick={signUp} className="space">Create account</Button> :
            <Button block href="mailto:hello@stellar.broker?subject=Integration%20request">Contact us</Button>}
        <p className="text-center dimmed space">Already have an account?&nbsp;
            <a href="/sign-in">Sign in</a>
        </p>
    </div>
}
