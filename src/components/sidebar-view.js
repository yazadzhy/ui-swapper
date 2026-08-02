import {useCallback, useState} from 'react'
import {useAuth0} from '@auth0/auth0-react'
import {navigation} from '../utils/navigation'
import {logout} from '../api/auth'
import Logo from '../layout/logo'

export default function SidebarView({children}) {
    const [menuVisible, setMenuVisible] = useState(false)

    return <div className={`sidebar ${menuVisible && 'active'}`}>
        <div className="sidebar-wrapper">
            <div className="top-menu-block">
                <Logo/>
                <a className="toggle-menu" href="#" onClick={e => setMenuVisible(!menuVisible)}>
                    <i className="icon icon-menu" style={{fontSize: '1.4em'}}/>
                </a>
            </div>
            <div className="space"/>
            <div className="space mobile-only"/>
            {children}
        </div>
    </div>
}

export function LogoutView() {
    const {isAuthenticated, logout: auth0Logout} = useAuth0()

    const onLogout = useCallback(() => {
        logout()
        //without terminating the Auth0 session the next sign-in attempt would silently restore it
        if (isAuthenticated)
            return auth0Logout({logoutParams: {returnTo: window.location.origin}})
        navigation.navigate('/')
    }, [isAuthenticated, auth0Logout])

    return <a href="#" className="text-small" onClick={onLogout}>
        <span><i className="icon-log-out"/>Logout</span>
    </a>
}