import * as services from './app_store_connect_api/sdk.gen';
import { client } from './app_store_connect_api/client.gen';
import * as jose from 'jose';
import fs from 'fs';

/**
 * Options for configuring the App Store Connect client.
 * @see https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api
 */
export interface AppStoreConnectOptions {
  /**
   * The issuer ID associated with the private key.
   */
  issuerId?: string;
  /**
   * The ID of the private key.
   */
  privateKeyId?: string;
  /**
   * The private key in PEM format.
   */
  privateKey?: string;
  /**
   * The path to the private key file.
   */
  privateKeyFile?: string;
  /**
   * A bearer token can be provided directly, which will be used instead of generating a new token
   */
  bearerToken?: string;
  /**
   * The time (in seconds) until the token expires (default 10 minutes)
   */
  expirationTime?: number;
}

export class AppStoreConnectClient {
  private appStoreConnectOptions: AppStoreConnectOptions;
  private bearerToken: string | null = null;
  private bearerTokenGeneratedAt = 0;
  api = services;

  constructor(appStoreConnectOptions: AppStoreConnectOptions) {
    if (!appStoreConnectOptions) {
      throw new Error('AppStoreConnectOptions is required');
    }
    this.appStoreConnectOptions = appStoreConnectOptions;
    client.setConfig({ baseUrl: 'https://api.appstoreconnect.apple.com' });
    client.interceptors.request.use(async (request, _options): Promise<Request> => {
      request.headers.set('Authorization', `Bearer ${await this.getToken()}`);
      return request;
    });
  }

  private async getToken() {
    if (this.appStoreConnectOptions.bearerToken) {
      this.bearerToken = this.appStoreConnectOptions.bearerToken;
    } else {
      const { privateKeyId, issuerId, privateKey, privateKeyFile, expirationTime } = this.appStoreConnectOptions;
      if (privateKeyId && (privateKey || privateKeyFile)) {
        const defaultExpirationTime = 600; // 10 minutes
        const tokenExpirationTime = expirationTime ?? defaultExpirationTime;
        if (!this.bearerToken || this.bearerTokenGeneratedAt + tokenExpirationTime * 1000 < Date.now()) {
          if (privateKeyFile) {
            const fileHandle = await fs.promises.open(privateKeyFile, fs.constants.O_RDONLY);
            try {
              this.appStoreConnectOptions.privateKey = await fileHandle.readFile('utf8');
            } finally {
              await fileHandle.close();
            }
          }
          if (issuerId) {
            this.bearerToken = await this.generateAuthToken(
              issuerId,
              privateKeyId,
              this.appStoreConnectOptions.privateKey!,
              tokenExpirationTime);
          } else {
            this.bearerToken = await this.generateUserAuthToken(
              privateKeyId,
              this.appStoreConnectOptions.privateKey!,
              tokenExpirationTime);
          }
          this.bearerTokenGeneratedAt = Date.now();
        }
      } else {
        throw new Error('Bearer token or private key information is required to generate a token');
      }
    }

    return this.bearerToken;
  }

  /**
   * Generates a JWT token for authenticating with the App Store Connect API.
   * @see https://developer.apple.com/documentation/appstoreconnectapi/generating_tokens_for_api_requests
  */
  private async generateAuthToken(issuerId: string, privateKeyId: string, privateKey: string, expirationTime: number): Promise<string> {
    const alg = 'ES256';
    const key = await jose.importPKCS8(privateKey, alg);
    const token = await new jose.SignJWT({})
      .setProtectedHeader({ alg, kid: privateKeyId, typ: 'JWT' })
      .setIssuer(issuerId)
      .setAudience('appstoreconnect-v1')
      .setExpirationTime(new Date(Date.now() + expirationTime * 1000))
      .sign(key);
    return token;
  }

  /**
   * Generates a user auth token for authenticating with the App Store Connect API.
   * @see https://developer.apple.com/documentation/appstoreconnectapi/generating-tokens-for-api-requests#Create-the-JWT-Payload-for-Individual-Keys
   */
  private async generateUserAuthToken(privateKeyId: string, privateKey: string, expirationTime: number): Promise<string> {
    const alg = 'ES256';
    const key = await jose.importPKCS8(privateKey, alg);
    const token = await new jose.SignJWT({})
      .setProtectedHeader({ alg, kid: privateKeyId, typ: 'JWT' })
      .setSubject('user')
      .setAudience('appstoreconnect-v1')
      .setExpirationTime(new Date(Date.now() + expirationTime * 1000))
      .sign(key);
    return token;
  }
}