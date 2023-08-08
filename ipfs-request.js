import * as isIPFS from 'is-ipfs'

// http://localhost:5001 ipfs-desktop
const apiURL = new URL('http://localhost:48083')

// pulled from https://github.com/ipfs/ipfs-companion/blob/76a38f3cff1a4929dd9a24ab4465f8bf6a8e1bb1/add-on/src/lib/ipfs-request.js
export function createRequestModifier(browser) {
    const runtimeRoot = browser.runtime.getURL('/')
    const webExtensionOrigin = runtimeRoot ? new URL(runtimeRoot).origin : 'http://companion-origin' // avoid 'null' because it has special meaning
    const isCompanionRequest = (request) => {
        // We inspect webRequest object (WebExtension API) instead of Origin HTTP
        // header because the value of the latter changed over the years ad
        // absurdum. It leaks the unique extension ID and no vendor seem to have
        // coherent  policy around it, Firefox and Chromium flip back and forth:
        // Firefox  Nightly 65 sets moz-extension://{extension-installation-id}
        // Chromium        <72 sets null
        // Chromium Beta    72 sets chrome-extension://{uid}
        // Firefox  Nightly 85 sets null
        const { originUrl, initiator } = request
        // Of course, getting "Origin" is vendor-specific:
        // FF: originUrl (Referer-like Origin URL with path)
        // Chromium: initiator (just Origin, no path)
        // Because of this mess, we normalize Origin by reading it from URL.origin
        const { origin } = new URL(originUrl || initiator || 'http://missing-origin')
        return origin === webExtensionOrigin
    }

    function sameGateway (url, gwUrl) {
        if (typeof url === 'string') {
          url = new URL(url)
        }
        if (typeof gwUrl === 'string') {
          gwUrl = new URL(gwUrl)
        }

        if (url.hostname === '0.0.0.0') {
          // normalize 0.0.0.0 (used by go-ipfs in the console)
          // to 127.0.0.1 to minimize the number of edge cases we need to handle later
          // https://github.com/ipfs-shipyard/ipfs-companion/issues/867
          url = new URL(url.toString())
          url.hostname = '127.0.0.1'
        }
      
        // Additional check to avoid false-positives when user has some unrelated HTTP server running on localhost:8080
        // It is not "sameGateway" if "localhost" URL does not look like Gateway or RPC URL.
        // This removes surface for bugs like https://github.com/ipfs/ipfs-companion/issues/1162
        if (!(isIPFS.url(url.toString()) || isIPFS.subdomain(url.toString()) || url.pathname.startsWith('/api/v0/') || url.pathname.startsWith('/webui'))) return false
      
        const gws = [gwUrl.host]
      
        // localhost gateway has more than one hostname
        if (gwUrl.hostname === 'localhost') {
          gws.push(`127.0.0.1:${gwUrl.port}`)
        }
        if (gwUrl.hostname === '127.0.0.1' || gwUrl.hostname === '[::1]') {
          gws.push(`localhost:${gwUrl.port}`)
        }
      
        for (const gwName of gws) {
          // match against the end to include subdomain gateways
          if (url.host.endsWith(gwName)) return true
        }
        return false
      }


    return {
        // browser.webRequest.onBeforeSendHeaders
        // This event is triggered before sending any HTTP data, but after all HTTP headers are available.
        // This is a good place to listen if you want to modify HTTP request headers.
        onBeforeSendHeaders(request) {
            // Special handling of requests made to API
            if (sameGateway(request.url, apiURL)) {
                const { requestHeaders } = request

                if (isCompanionRequest(request)) {
                    // '403 - Forbidden' fix for Chrome and Firefox
                    // --------------------------------------------
                    // We update "Origin: *-extension://" HTTP headers in requests made to API
                    // by js-kubo-rpc-client running in the background page of browser
                    // extension.  Without this, some users would need to do manual CORS
                    // whitelisting by adding "..extension://<UUID>" to
                    // API.HTTPHeaders.Access-Control-Allow-Origin in go-ipfs config.
                    // With this, API calls made by browser extension look like ones made
                    // by webui loaded from the API port.
                    // More info:
                    // Firefox 65: https://github.com/ipfs-shipyard/ipfs-companion/issues/622
                    // Firefox 85: https://github.com/ipfs-shipyard/ipfs-companion/issues/955
                    // Chromium 71: https://github.com/ipfs-shipyard/ipfs-companion/pull/616
                    // Chromium 72: https://github.com/ipfs-shipyard/ipfs-companion/issues/630
                    const foundAt = requestHeaders.findIndex(h => h.name.toLowerCase() === 'origin')
                    const { origin } = apiURL
                    if (foundAt > -1) {
                        // Replace existing Origin with the origin of the API itself.
                        // This removes the need for CORS setup in go-ipfs config and
                        // ensures there is no HTTP Error 403 Forbidden.
                        requestHeaders[foundAt].value = origin
                    } else { // future-proofing
                        // Origin is missing, and go-ipfs requires it in browsers:
                        // https://github.com/ipfs/go-ipfs-cmds/pull/193
                        requestHeaders.push({ name: 'Origin', value: origin })
                    }
                }

                // Fix "http: invalid Read on closed Body"
                // ----------------------------------
                // There is a bug in go-ipfs related to keep-alive connections
                // that results in partial response for ipfs.add
                // mangled by error "http: invalid Read on closed Body"
                // More info (ipfs-companion): https://github.com/ipfs-shipyard/ipfs-companion/issues/480
                // More info (go-ipfs): https://github.com/ipfs/go-ipfs/issues/5168
                if (request.url.includes('/api/v0/add') && request.url.includes('stream-channels=true')) {
                    let addExpectHeader = true
                    const expectHeader = { name: 'Expect', value: '100-continue' }
                    for (const header of requestHeaders) {
                        // Workaround A: https://github.com/ipfs/go-ipfs/issues/5168#issuecomment-401417420
                        // (works in Firefox, but Chromium does not expose Connection header)
                        /* (disabled so we use the workaround B in all browsers)
                        if (header.name === 'Connection' && header.value !== 'close') {
                          console.warn('[ipfs-companion] Executing "Connection: close" workaround for ipfs.add due to https://github.com/ipfs/go-ipfs/issues/5168')
                          header.value = 'close'
                          addExpectHeader = false
                          break
                        }
                        */
                        // Workaround B: https://github.com/ipfs-shipyard/ipfs-companion/issues/480#issuecomment-417657758
                        // (works in Firefox 63 AND Chromium 67)
                        if (header.name === expectHeader.name) {
                            addExpectHeader = false
                            if (header.value !== expectHeader.value) {
                                header.value = expectHeader.value
                            }
                            break
                        }
                    }
                    if (addExpectHeader) {
                        requestHeaders.push(expectHeader)
                    }
                }
                return { requestHeaders }
            }
        },
    }
}