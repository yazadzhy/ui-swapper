import React, {useCallback, useState} from 'react'
import {performApiCall} from '../../api/api-call'
import {useAutoFocusRef} from '../../utils/hooks/auto-focus-ref'
import {Button} from '../../components/ui/button'
import {Dialog} from '../../components/ui/dialog'
import validateEmail from '../../utils/validate-email'
import ManagedExternallyView from './managed-externally-view'

export default function EmailEditForm({partnerInfo}) {
    const [email, setEmail] = useState(partnerInfo.email)
    const [isOpen, setIsOpen] = useState(false)
    const [isValid, setIsValid] = useState(false)
    const auth0Account = partnerInfo.authProvider === 'auth0'

    const toggleDialog = useCallback(() => setIsOpen(prev => !prev), [])

    const changeEmail = useCallback(e => {
        const val = e.target.value.trim()
        setEmail(val)
        setIsValid(validateEmail(val))
    }, [])

    const updateEmail = useCallback(() => {
        performApiCall('partner/email', {method: 'PUT', params: {email}})
            .then(result => {
                if (result.error)
                    return notify({type: 'error', message: 'Failed to change email. ' + result.error})
                toggleDialog()
                notify({
                    type: 'success',
                    //the service token still carries the previous address until the next sign-in
                    message: auth0Account ?
                        'Email changed. Please confirm the new address using the link we sent you' :
                        'Email changed successfully'
                })
            })
    }, [email, auth0Account, toggleDialog])

    const onKeyDown = useCallback(e => {
        if (e.keyCode === 13 && isValid) {
            updateEmail()
        }
    }, [isValid])

    //an Auth0 account keeps its address in Auth0 -- only a legacy password account owns the one we store
    if (auth0Account)
        return <ManagedExternallyView title="Email" provider={partnerInfo.identity?.provider}>{email}</ManagedExternallyView>

    return <div>
        <div className="dual-layout middle double-space">
            <div className="text-tiny">
                <strong>Email</strong>
                <div className="dimmed">{email}</div>
            </div>
            <div>
                <Button small secondary onClick={toggleDialog} style={{margin: 0}}>Change</Button>
            </div>
        </div>
        <Dialog dialogOpen={isOpen} className="text-left">
            <div className="micro-space"><h5>Change email</h5></div>
            <div className="space">
                <p className="label text-small">Email</p>
                <input value={email || ''} onChange={changeEmail} ref={useAutoFocusRef} onKeyDown={onKeyDown} className="styled-input"/>
                {auth0Account && <div className="nano-space dimmed text-tiny">
                    You will need to confirm the new address before your next sign-in.
                </div>}
            </div>
            <div className="row">
                <div className="column column-33 column-offset-33">
                    <Button outline block onClick={toggleDialog}>Cancel</Button>
                </div>
                <div className="column column-33">
                    <Button block disabled={!isValid} onClick={updateEmail}>Save</Button>
                </div>
            </div>
        </Dialog>
    </div>
}