import {Networks, StrKey, TransactionBuilder} from '@stellar/stellar-sdk'
import WalletConnectService from './wallet-connect-service'
import StellarWalletsService from './stellar-wallets-service'
import accountLedgerData from './account-ledger-data'

export const WALLET_CONNECT = 'wallet_connect'
export const STELLAR_WALLETS = 'stellar_wallets'

const walletProviders = {
    [WALLET_CONNECT]: new WalletConnectService(),
    [STELLAR_WALLETS]: new StellarWalletsService()
}

class WalletProvider {
    name = ''

    wallet = null

    async init(providerName, confirmation) {
        this.name = providerName
        this.wallet = walletProviders[providerName]
        await this.wallet.init(confirmation)
    }

    async connectUserWallet() {
        return await this.wallet.connect()
            .then((connect) => {
                if (!connect)
                    throw Error('Failed to connect wallet')
                localStorage.setItem('activeAccount', JSON.stringify({...connect, provider: this.name}))
                accountLedgerData.init(connect.address)
                notify({type: 'info', message: 'Great! Now you can swap with StellarBroker!'})
            })
            .catch((err) => {
                throw Error(err.message)
            })
    }

    async signTx(tx) {
        const {signedTxXdr} = await this.wallet.signTx(tx) || {}
        if (!signedTxXdr) {
            throw Error('Failed to sign transaction using XDR')
        }
        return TransactionBuilder.fromXDR(signedTxXdr, Networks.PUBLIC)
    }

    getActiveAccount() {
        const account = localStorage.getItem('activeAccount')
        try {
            const {provider, address, session} = JSON.parse(account)
            this.init(provider)
                .then(() => {
                    this.wallet.login(session)
                    if (!accountLedgerData.address && StrKey.isValidEd25519PublicKey(address)) {
                        accountLedgerData.init(address)
                    }
                })
        } catch (e) {
            return null
        }
        return accountLedgerData.address
    }
}

export default new WalletProvider()