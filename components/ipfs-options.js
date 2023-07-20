/* global HTMLElement, localStorage, FormData, CustomEvent */
import { detect, defaultChoice } from 'auto-js-ipfs'

export const OPTIONS_PERSIST_KEY = 'auto-ipfs-options'

export class AutoIPFSOptions extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <details>
        <summary>Settings</summary>
        <select title="Choose which backend you would like to use">
          <option value="" selected>Autoslect Backend</option>
        </select> 
        <form>
          <label>Kubo Daemon URL: </label>
          <input name="daemonURL"/>
          <label>Web3.Storage Token: </label>
          <input name="web3StorageToken" type="password"/>
          <label>Estuary Token: </label>
          <input name="estuaryToken" type="password"/>
        </form>
      </details>
      `

    this.form.addEventListener('change', () => this.handleChange())
    this.select.addEventListener('change', () => this.emitLatest())
    this.details.addEventListener('toggle', () => {
      this.saveOptions()
    })
    this.loadOptions()
    this.refreshBackends()
  }

  get select() {
    return this.querySelector('select')
  }

  get form() {
    return this.querySelector('form')
  }

  get details() {
    return this.querySelector('details')
  }

  get opts() {
    const data = new FormData(this.form)

    const opts = {
      readonly: false
    }

    for (const [key, value] of data.entries()) {
      if (!value) continue
      opts[key] = value
    }

    return opts
  }

  loadOptions() {
    const saved = localStorage.getItem(OPTIONS_PERSIST_KEY)

    if (!saved) return

    const { opts, detailsOpen } = JSON.parse(saved)

    this.details.toggleAttribute('open', detailsOpen)

    for (const [key, value] of Object.entries(opts)) {
      const element = this.querySelector(`[name=${key}]`)
      if (!element) {
        console.warn(`Couldn't find ${key} input`)
        continue
      }
      element.value = value
    }
  }

  saveOptions() {
    const { opts, details } = this
    const detailsOpen = details.open

    const toSave = JSON.stringify({
      opts,
      detailsOpen
    })

    localStorage.setItem(OPTIONS_PERSIST_KEY, toSave)
  }

  handleChange() {
    this.saveOptions()
    this.refreshBackends()
  }

  emitLatest() {
    const { selected } = this
    this.dispatchEvent(new CustomEvent('selected', { detail: unescape(selected) }))
  }

  async refreshBackends() {
    const { opts, select } = this
    const options = await detect(opts)
    const defaultOption = defaultChoice(options)

    console.log('Detected options', opts, options, defaultOption)

    const optionSelects = options.map((option) => `
        <option value="${escape(JSON.stringify(option))}">
          ${option.type}
        </option>
      `).join('')

    select.innerHTML = `
        ${optionSelects}
        <option value="${escape(JSON.stringify(defaultOption))}" selected>
          default (${defaultOption.type})
        </option>
      `

    this.emitLatest()
  }

  get selected() {
    return this.querySelector('option:checked').value
  }
}