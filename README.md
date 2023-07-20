# Markdown Publish

Create a markdown file and publish directly to IPFS (via Local node, Brave's built in Node, Estuary or Web3.storage)

## Project management
Planning is currently done in [this hackmd](), it will soon be moved into gh issues on this repo.

## Running
* `npm run build`
* open `about://extensions` and load unpacked extension

_you will need to have IPFS Desktop/Kubo running to publish to local node_

In order to publish to Kubo/IPFS Desktop, you will need to update your IPFS Config

``` JSON
{
"API": {
		"HTTPHeaders": {
			"Access-Control-Allow-Origin": [
				"chrome-extension://bjgalcncpnagkpfakcbleingnkcaebah"
            ]
        }
}
}
```

Built by Justice Engineering