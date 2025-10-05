import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: './app_store_connect_api_openapi.json',
    output: './src/app_store_connect_api',
    exportCore: true,
    plugins: [
        {
            name: '@hey-api/client-fetch',
            bundle: true,
        },
        {
            name: '@hey-api/typescript',
            exportFromIndex: true,
            enums: 'typescript',
            case: 'PascalCase',
        },
        {
            name: '@hey-api/sdk',
            exportFromIndex: true,
            asClass: true,
            client: true
        },
        {
            name: '@hey-api/schemas',
            exportFromIndex: true,
        }
    ]
});