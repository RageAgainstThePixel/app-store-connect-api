import { AppStoreConnectClient, AppStoreConnectOptions } from 'app-store-connect-api';
import dotenv from 'dotenv';

async function main() {
    dotenv.config();
    const options: AppStoreConnectOptions = {
        issuerId: process.env.ISSUER_ID,
        privateKeyId: process.env.PRIVATE_KEY_ID,
        privateKey: process.env.PRIVATE_KEY,
    };
    const client = new AppStoreConnectClient(options);
    const { data: response, error } = await client.api.AppsService.appsGetCollection({
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