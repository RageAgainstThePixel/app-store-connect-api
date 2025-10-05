import { AppStoreConnectClient } from '../src';
import { client } from '../src/app_store_connect_api/client.gen';
import * as api from '../src/app_store_connect_api/sdk.gen';

jest.mock('../src/app_store_connect_api/sdk.gen');

describe('AppStoreConnectClient', () => {
  const mockTeamKeys = {
    issuerId: 'testIssuerId',
    privateKeyId: 'testTeamPrivateKeyId',
    privateKey: 'testTeamPrivateKey',
    expirationTime: 600,
  };
  const mockUserKeys = {
    privateKeyId: 'testUserPrivateKeyId',
    privateKey: 'testUserPrivateKey',
    expirationTime: 600,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if options are not provided', () => {
    expect(() => new AppStoreConnectClient(undefined as any)).toThrow('AppStoreConnectOptions is required');
  });

  it('should set the config for services client', () => {
    const setConfigSpy = jest
      .spyOn(client, 'setConfig')
      .mockImplementation((cfg) => ({ ...(cfg ?? {}) } as any));
    new AppStoreConnectClient(mockTeamKeys);
    expect(setConfigSpy).toHaveBeenCalledWith({ baseUrl: 'https://api.appstoreconnect.apple.com' });
    setConfigSpy.mockRestore();
  });

  it('should use provided bearer token', async () => {
    const optionsWithBearerToken = { bearerToken: 'testBearerToken' };
    const appStoreConnectClient = new AppStoreConnectClient(optionsWithBearerToken);
    const token = await appStoreConnectClient['getToken']();
    expect(token).toBe('testBearerToken');
  });

  it('should generate a new bearer token if not provided (team)', async () => {
    const appStoreConnectClient = new AppStoreConnectClient(mockTeamKeys);
    const generateAuthToken = appStoreConnectClient['generateAuthToken'] = jest.fn();
    generateAuthToken.mockResolvedValue('generatedBearerToken');
    const token = await appStoreConnectClient['getToken']();
    expect(generateAuthToken).toHaveBeenCalledWith('testIssuerId', 'testTeamPrivateKeyId', 'testTeamPrivateKey', 600);
    expect(token).toBe('generatedBearerToken');
  });

  it('should generate a new bearer token if not provided (user)', async () => {
    const appStoreConnectClient = new AppStoreConnectClient(mockUserKeys);
    const generateAuthToken = appStoreConnectClient['generateUserAuthToken'] = jest.fn();
    generateAuthToken.mockResolvedValue('generatedBearerToken');
    const token = await appStoreConnectClient['getToken']();
    expect(generateAuthToken).toHaveBeenCalledWith('testUserPrivateKeyId', 'testUserPrivateKey', 600);
    expect(token).toBe('generatedBearerToken');
  });

  it('should throw an error if required options for generating a token are missing', async () => {
    const incompleteOptions = { issuerId: 'testIssuerId' };
    const appStoreConnectClient = new AppStoreConnectClient(incompleteOptions as any);
    await expect(appStoreConnectClient['getToken']()).rejects.toThrow('Bearer token or private key information is required to generate a token');
  });

  it('should reuse the existing token if it is not expired', async () => {
    const appStoreConnectClient = new AppStoreConnectClient(mockTeamKeys);
    const generateAuthToken = appStoreConnectClient['generateAuthToken'] = jest.fn();
    generateAuthToken.mockResolvedValue('generatedBearerToken');
    appStoreConnectClient['bearerToken'] = 'existingToken';
    appStoreConnectClient['bearerTokenGeneratedAt'] = Date.now();
    const token = await appStoreConnectClient['getToken']();
    expect(token).toBe('existingToken');
    expect(generateAuthToken).not.toHaveBeenCalled();
  });

  it('should generate a new token if the existing token is expired', async () => {
    const appStoreApiClient = new AppStoreConnectClient(mockTeamKeys);
    const generateAuthToken = appStoreApiClient['generateAuthToken'] = jest.fn();
    generateAuthToken.mockResolvedValue('newGeneratedToken');
    appStoreApiClient['bearerToken'] = 'expiredToken';
    appStoreApiClient['bearerTokenGeneratedAt'] = Date.now() - 700000; // Token expired
    const token = await appStoreApiClient['getToken']();
    expect(generateAuthToken).toHaveBeenCalled();
    expect(token).toBe('newGeneratedToken');
  });

  it('should expose all api methods', () => {
    const appStoreConnectClient = new AppStoreConnectClient(mockTeamKeys);
    expect(appStoreConnectClient.api).toEqual(api);
  });
});