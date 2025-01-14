import {useCallback, useEffect, useState} from 'react'
import {Button} from './ui/button'
import {useNavigate} from 'react-router-dom'

const partnerTest = {
    "id": "667eb324cd3ceaa40a1ba14e",
    "email": "test-partner@swapstrider.net",
    "created": "2024-06-28T12:57:08.744Z",
    "settings": {
        "partnerVarFee": 200,
        "striderVarFee": 100
    },
    "keys": [
        "5Z1F...CRdo"
    ]
}

function validation({email, password, confirm, fee}) {
    const emailRegex = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/
    const isConfirm = (!password && !confirm) || (password?.length >= 8 && password === confirm)
    return emailRegex.test(email) && isConfirm && !!fee
}

function PartnerEditForm({id}) {
    const navigate = useNavigate()
    const [isValid, setValid] = useState(false)
    const [settings, setSettings] = useState()

    useEffect(() => {
        if (!id)
            return null
        setSettings({
            email: partnerTest.email,
            fee: partnerTest.settings.partnerVarFee / 100
        })
    }, [id])

    const changeValue = useCallback((key, value) => {
        setSettings(prev => {
            const newSettings = {...prev, [key]: value}
            setValid(validation(newSettings))
            return newSettings
        })
    }, [validation])

    const changeEmail = useCallback(e => changeValue('email', e.target.value.trim()), [])
    const changePassword = useCallback(e => changeValue('password', e.target.value), [])
    const changeConfirm = useCallback(e => changeValue('confirm', e.target.value), [])
    const changeFee = useCallback(e => changeValue('fee', e.target.value.replace(/[^\d.]/g, '')), [])

    const onSave = useCallback(() => {
        console.log('Save partner settings')
        navigate('/admin/partners')
    }, [])

    return <div>
        <div className="row">
            <div className="column column-33">
                <div className="space">
                    <p className="label text-small">Partner email</p>
                    <input value={settings?.email || ''} onChange={changeEmail} className="styled-input"/>
                </div>
            </div>
        </div>
        <div className="row">
            <div className="column column-33">
                <div className="space">
                    <p className="label text-small">Partner password</p>
                    <input type="password" value={settings?.password || ''} onChange={changePassword} className="styled-input"/>
                </div>
            </div>
            <div className="column column-33">
                <div className="space">
                    <p className="label text-small">Confirm</p>
                    <input type="password" value={settings?.confirm || ''} onChange={changeConfirm} className="styled-input"/>
                </div>
            </div>
        </div>
        <div className="row">
            <div className="column column-33">
                <div className="space">
                    <p className="label text-small">Partner fee (%)</p>
                    <input value={settings?.fee || ''} onChange={changeFee} className="styled-input"/>
                </div>
            </div>
        </div>
        <div className="row">
            <div className="column column-33 column-offset-66">
                <div className="label-space"/>
                <Button block disabled={!isValid} onClick={onSave}>Save</Button>
            </div>
        </div>
    </div>
}

function ValueSettingView({title, valueDefault = '', onChange, confirm, onlyNumber}) {
    const [value, setValue] = useState(valueDefault)
    const [confirmValue, setConfirmValue] = useState('')

    useEffect(() => {
        setValue(valueDefault)
    }, [valueDefault])

    const changeValue = useCallback(e => {
        const val = onlyNumber ? e.target.value.replace(/[^\d.]/g, '') : e.target.value.trim()
        setValue(val)
        onChange()
    }, [onChange, valueDefault])

    return <div className="row">
        <div className="column column-33">
        <div className="space">
                <p className="label text-small">{title}</p>
                <input value={value} onChange={changeValue} className="styled-input"/>
            </div>
        </div>
        {confirm && <div className="column column-33">
            <div className="space">
                <p className="label text-small">Confirm</p>
                <input value={confirmValue} onChange={changeValue} className="styled-input"/>
            </div>
        </div>}
    </div>
}

export default PartnerEditForm