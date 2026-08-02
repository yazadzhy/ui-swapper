import React, {useCallback, useState} from 'react'
import {useAuth0} from '@auth0/auth0-react'
import {navigation} from '../../utils/navigation'
import {performApiCall} from '../../api/api-call'
import {logout} from '../../api/auth'
import {Button} from '../../components/ui/button'
import {Dialog} from '../../components/ui/dialog'

export default function AccountDeleteView() {
    const [isOpen, setIsOpen] = useState(false)
    const {isAuthenticated, logout: auth0Logout} = useAuth0()

    const toggleDialog = useCallback(() => setIsOpen(prev => !prev), [])

    const deleteAccount = useCallback(() => {
        performApiCall(`partner`, {method: 'DELETE'})
            .then((result) => {
                if (result.error)
                    return notify({type: 'error', message: 'Failed to delete account. ' + result.error})

                logout()
                notify({type: "success", message: "Account deleted successfully"})
                if (isAuthenticated)
                    return auth0Logout({logoutParams: {returnTo: window.location.origin}})
                navigation.navigate('/')
            })
    }, [isAuthenticated, auth0Logout])

    return <>
        <div>
            <a href="#" onClick={toggleDialog} className="color-red text-tiny">
                <i className="icon-cross-circle"/>&nbsp;&nbsp;
                Delete account
            </a>
        </div>
        <Dialog dialogOpen={isOpen} className="text-left">
            <div className="micro-space">
                <h5>Delete account</h5>
            </div>
            <div className="space">
                Do you wish to delete this account?
            </div>
            <div className="row">
                <div className="column column-33 column-offset-33">
                    <Button outline block onClick={toggleDialog}>Cancel</Button>
                </div>
                <div className="column column-33">
                    <Button block outline className="alert" onClick={deleteAccount}>Confirm</Button>
                </div>
            </div>
        </Dialog>
    </>
}