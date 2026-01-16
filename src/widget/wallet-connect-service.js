import WalletConnectClient, {SIGN_CLIENT_EVENTS} from '@walletconnect/sign-client'

const PUBNET = 'stellar:pubnet'

const REQUIRED_NAMESPACES = {
    stellar: {
        chains: [PUBNET],
        methods: ['stellar_signXDR'],
        events: []
    }
}

export default class WalletConnectService {
    client = null

    async init(confirmation) {
        this.confirmation = confirmation
        this.client = await WalletConnectClient.init({
            projectId: walletConnectProjectId
        })

        this.listenWalletConnectEvents()

        if (!this.client.session.length) {
            return null
        }

        this.session = await this.client.session.getAll()[0]
    }

    listenWalletConnectEvents() {
        this.client.on(SIGN_CLIENT_EVENTS.session_delete, ({topic}) => this.onSessionDeleted(topic))
    }

    onSessionDeleted(topic) {
        if (this.session && this.session.topic === topic) {
            this.session = null
        }
    }

    async connect(pairing) {
        try {
            const {uri, approval} = await this.client.connect({
                pairingTopic: pairing ? pairing.topic : undefined,
                requiredNamespaces: REQUIRED_NAMESPACES
            })
            if (!pairing && this.confirmation)
                this.confirmation(uri)
            this.session = await approval()
        } catch (e) {
            throw Error(e.message || 'User declined access')
        }

        if (!this.client.session.length) {
            return null
        }

        this.session = await this.client.session.getAll()[0]
        const [chain, reference, address] = this.session.namespaces.stellar.accounts[0].split(':')

        return {address, session: this.session}
    }

    async login() {
        if (this.client) {
            return
        }
        await this.connect()
    }

    async signTx(tx) {
        const xdr = tx.toEnvelope().toXDR('base64')

        return await this.client.request({
            topic: this.session.topic,
            chainId: PUBNET,
            request: {
                method: 'stellar_signXDR',
                params: {
                    xdr
                }
            }
        })
            .then(res => ({signedTxXdr: res.signedXDR}))
            .catch(() => null)
    }
}