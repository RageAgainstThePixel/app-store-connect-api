import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    client: {
        bundle: true,
        name: '@hey-api/client-fetch'
    },
    input: './app_store_connect_api_openapi.json',
    output: './src/app_store_connect_api',
    exportCore: true,
    services: {
        asClass: true,
    }
});