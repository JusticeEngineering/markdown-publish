/* global customElements */
/* eslint-env browser, webextensions */

import browser from 'webextension-polyfill'
import { createWysimark } from "@wysimark/standalone"
import { AutoIPFSOptions } from "./components/ipfs-options"
import { AutoIPFSUpload } from "./components/ipfs-upload"
import { initialMarkdown } from "./initial-markdown"
import { createRequestModifier } from "./ipfs-request"

const apiURL = new URL('http://localhost:45004')

customElements.define('auto-ipfs-options', AutoIPFSOptions)
customElements.define('auto-ipfs-upload', AutoIPFSUpload)

const autoIpfsOptionsEl = document.createElement('auto-ipfs-options')
const autoIpfsUploadEl = document.createElement('auto-ipfs-upload')
const settingsContainer = document.getElementById("settings-container")

settingsContainer.appendChild(autoIpfsOptionsEl)
settingsContainer.appendChild(autoIpfsUploadEl)

const container = document.getElementById("editor-container")
autoIpfsUploadEl.wysimark = createWysimark(container, { initialMarkdown })

const modifyRequest = createRequestModifier(browser, apiURL)

const onBeforeSendInfoSpec = ['blocking', 'requestHeaders']
if (browser.webRequest.OnBeforeSendHeadersOptions && 'EXTRA_HEADERS' in browser.webRequest.OnBeforeSendHeadersOptions) {
    // Chrome 72+  requires 'extraHeaders' for accessing all headers
    // Note: we need this for code ensuring kubo-rpc-client can talk to API without setting CORS
    onBeforeSendInfoSpec.push('extraHeaders')
}
browser.webRequest.onBeforeSendHeaders.addListener(modifyRequest.onBeforeSendHeaders, { urls: ['<all_urls>'] }, onBeforeSendInfoSpec)

// Start a long-running conversation:
// var port = chrome.runtime.connect(linkListExtensionId);
// port.postMessage(...);