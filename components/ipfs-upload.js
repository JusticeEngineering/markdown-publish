/* global HTMLElement */
import { create, choose } from 'auto-js-ipfs'

export class AutoIPFSUpload extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button>Publish to IPFS</button>
      <ul class="filelist"></ul>
    `

    this.uploadButton.addEventListener('click', async (e) => {
      const blob = new Blob([this.wysimark.getMarkdown()], { type: 'text/markdown' })
      blob.name = 'index.md'
      await this.uploadFile(blob)
    })
  }

  get uploadButton() {
    return this.querySelector('button')
  }

  get list() {
    return this.querySelector('ul')
  }

  async getAPI() {
    const selected = this.getAttribute('selected')
    if (selected) {
      const parsed = JSON.parse(selected)
      const api = await choose(parsed)
      return api
    } else {
      const api = await create()
      return api
    }
  }

  listFile(name, url) {
    const li = document.createElement('li')
    li.innerHTML = `<a href="${url}">${name}: ${url}</a>`

    this.list.appendChild(li)
  }

  async uploadFile(file) {
    const api = await this.getAPI()
    const url = await api.uploadFile(file)

    this.listFile(file.name, url)
  }
}