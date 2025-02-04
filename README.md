# app-store-connect-api

[![Discord](https://img.shields.io/discord/855294214065487932.svg?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/xQgMW9ufN4) [![NPM Version](https://img.shields.io/npm/v/%40rage-against-the-pixel%2Fapp-store-connect-api)](https://www.npmjs.com/package/@rage-against-the-pixel/app-store-connect-api) ![NPM Downloads](https://img.shields.io/npm/dw/%40rage-against-the-pixel%2Fapp-store-connect-api)

A TypeScript package for communicating with Apple [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)

- Automatically generated API client using the latest [OpenAPI specification](https://developer.apple.com/sample-code/app-store-connect/app-store-connect-openapi-specification.zip) from Apple.
- Fully typed models and methods for every endpoint.
- Designed for use in a Node.js server environment.

## Installation

```sh
npm install @rage-against-the-pixel/app-store-connect-api
```

## Authentication

To authenticate with the API you will need to [create a API keys for App Store Connect API](https://appstoreconnect.apple.com/access/api).

Download and save the private key `.p8` file to a save, secure location.
The contents of this file is your `privateKey`.
The `privateKeyId` and `issuerId` are both listed on the same page where you create your private key.

> [!NOTE]
> Individual keys do not require `issuerId`.

## Example

```ts
import { AppStoreConnectClient, AppStoreConnectOptions } from '@rage-against-the-pixel/app-store-connect-api';

async function main() {
    const options: AppStoreConnectOptions = {
        issuerId: '<ISSUER_ID>',
        privateKeyId: '<PRIVATE_KEY_ID>',
        privateKey: '<PRIVATE_KEY>',
    };
    const client = new AppStoreConnectClient(options);
    const { data: response, error } = await client.api.appsGetCollection({
        query: {
            limit: 10
        }
    });
    if (error) {
        console.error('Error fetching apps:', error);
    } else {
        const apps = response.data.map(app => ({
            id: app.id,
            name: app.attributes.name,
            bundleId: app.attributes.bundleId
        }));
        console.log('Apps:', apps);
    }
}

main();
```
