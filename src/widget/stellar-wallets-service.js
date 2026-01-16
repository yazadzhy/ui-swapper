import {
    StellarWalletsKit,
    WalletNetwork,
    allowAllModules,
    ALBEDO_ID,
    ModalThemes
} from '@creit.tech/stellar-wallets-kit'


const kitParams = {
    network: WalletNetwork.PUBLIC,
    theme: ModalThemes.LIGHT,
    selectedWalletId: ALBEDO_ID,
    modules: allowAllModules()
}

export default class StellarWalletsService {
    client = null

    init() {
        this.client = new StellarWalletsKit(kitParams)
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.client.openModal({
                onWalletSelected: async (selected) => {
                    try {
                        this.client.setWallet(selected.id)
                        const {address} = await this.client.getAddress()
                        resolve({address})
                    } catch (e) {
                        reject(e)
                    }
                },
                onClosed: () => resolve(null)
            })
        })
    }

    login() {
        try {
            const usedWalletsIds = JSON.parse(localStorage.getItem('@StellarWalletsKit/usedWalletsIds') || '')
            this.client.setWallet(usedWalletsIds[0])
        } catch (e) {
            return null
        }
    }

    async signTx(tx) {
        return await this.client.signTransaction(tx.toXDR())
    }
}