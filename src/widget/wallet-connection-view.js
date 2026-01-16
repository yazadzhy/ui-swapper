import React, {useCallback, useEffect, useState} from 'react'
import {QRCodeSVG} from 'qrcode.react'
import {Button, Dialog} from '../components/ui'
import walletProvider, {WALLET_CONNECT, STELLAR_WALLETS} from './wallet-provider'

export default function WalletConnectionView({widgetStatus, updateStatus}) {
    const [isOpen, setIsOpen] = useState(false)
    const [qrCodeUri, setQrCodeUri] = useState('')

    useEffect(() => {
        setIsOpen(widgetStatus === 'auth')
    }, [widgetStatus])

    const resetConnection = useCallback(() => {
        setQrCodeUri('')
        setIsOpen(false)
        updateStatus('ready')
    }, [updateStatus])

    const toggleDialog = useCallback(() => resetConnection(), [resetConnection])

    const connectWalletProvider = useCallback(async (provider) => {
        await walletProvider.init(provider, setQrCodeUri)
        walletProvider.connectUserWallet()
            .catch((e) => {
                notify({type: 'error', message: e.message})
            })
            .finally(() => resetConnection())
    }, [resetConnection])

    const walletConnect = useCallback(() => {
        connectWalletProvider(WALLET_CONNECT)
    }, [connectWalletProvider])

    const connectStellarWallets = useCallback(() => {
        connectWalletProvider(STELLAR_WALLETS)
    }, [connectWalletProvider])

    return <Dialog dialogOpen={isOpen} className="text-left">
        {!qrCodeUri ? <div className="space">
            <div className="space"><h5>Wallet connection</h5></div>
            <div className="space dimmed">
                Use a wallet that is compatible with WalletConnect or one of the available Stellar wallets.
            </div>
            <div className="row">
                <div className="column column-50">
                    <Button block outline big onClick={walletConnect}>
                        <span className="wallet-icons">
                            <img src="img/widget/wallet-connect.png" alt="WalletConnect"/>
                        </span>
                        WalletConnect
                    </Button>
                </div>
                <div className="column column-50">
                    <Button block outline big onClick={connectStellarWallets}>
                        <span className="wallet-icons">
                            <img src="img/widget/lobstr.png" alt="LOBSTR"/>
                            <img src="img/widget/freighter.png" alt="Freighter"/>
                            <img src="img/widget/albedo.svg" alt="Albedo"/>
                        </span>
                        Stellar wallets</Button>
                </div>
            </div>
        </div> : <QrCodeConfirmation qrCodeUri={qrCodeUri}/>}
        <div className="row">
            <div className="column column-33 column-offset-66 text-right">
                <Button outline onClick={toggleDialog}>Cancel</Button>
            </div>
        </div>
    </Dialog>
}

function QrCodeConfirmation({qrCodeUri}) {
    return <div>
        <div className="space"><h5>Scan QR code with a WalletConnect-compatible wallet</h5></div>
        <div className="space dimmed">
            Open your WalletConnect-compatible app with Stellar support, like LOBSTR wallet, and scan the QR code to connect.
        </div>
        <div className="space text-center">
            <QRCodeSVG value={qrCodeUri} size={206}/>
        </div>
    </div>
}