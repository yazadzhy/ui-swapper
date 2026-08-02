import React from 'react'
import {describeIdentityProvider} from '../../utils/identity-provider'

/**
 * Read-only settings row for a credential the account keeps in Auth0 rather than here
 */
export default function ManagedExternallyView({title, provider, children}) {
    //plain block on purpose -- there is no action on the right, and dual-layout would push the only child there
    return <div className="double-space">
        <div className="text-tiny">
            <strong>{title}</strong>
            {!!children && <div className="dimmed">{children}</div>}
            <div className="dimmed-light">Managed by {describeOwner(provider)}</div>
        </div>
    </div>
}

function describeOwner(provider) {
    //a database connection has no external owner to name -- the credential belongs to Auth0 itself
    if (!provider || provider === 'auth0')
        return 'your Auth0 account'
    return describeIdentityProvider(provider)
}
