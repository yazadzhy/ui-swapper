const explorerApiOrigin = 'https://api.stellar.expert'
const network = 'public'

export async function fetchExplorerApi(endpointWithQuery) {
    const url = `${explorerApiOrigin}/explorer/${network}/${endpointWithQuery}`
    try {
        const resp = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        if (!resp.ok) {
            let errorExt
            try {
                errorExt = await resp.json()
            } catch (parsingError) {
                errorExt = {}
            }
            const err = new Error(errorExt?.error || resp.statusText || 'Failed to fetch data from the server')
            err.status = resp.status
            err.ext = errorExt
            throw err
        }
        return await resp.json()
    } catch (e) {
        console.error(e)
        if (e instanceof Error) {
            e = {
                error: e.message,
                status: e.status || 500,
                ext: e.ext
            }
        }
        if (e.ext && e.ext.status) {
            e.status = e.ext.status
        }
        return e
    }
}