import React, {useCallback} from 'react'
import {AccountAddress} from '../components/ui'
import WalletConnectionView from './wallet-connection-view'
import accountLedgerData from './account-ledger-data'

export default function ConnectWalletView({widgetStatus, updateStatus}) {
    const reconnect = useCallback(() => updateStatus('auth'), [updateStatus])

    if (!accountLedgerData.address)
        return null

    return <div className="dimmed condensed text-tiny" onClick={reconnect} style={{cursor: 'pointer'}}>
        <AccountAddress address={accountLedgerData.address} chars={8} link={false} className="color-primary"/>&nbsp;
        <WalletConnectionView widgetStatus={widgetStatus} updateStatus={updateStatus}/>
    </div>
}