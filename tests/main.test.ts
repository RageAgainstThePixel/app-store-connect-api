import { AppStoreConnectClient } from '../src';
import * as services from '../src/app_store_connect_api/services.gen';

jest.mock('../src/app_store_connect_api/services.gen');

describe('AppStoreConnectClient', () => {
  const mockOptions = {
    issuerId: 'testIssuerId',
    privateKeyId: 'testPrivateKeyId',
    privateKey: 'testPrivateKey',
    expirationTime: 600,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if options are not provided', () => {
    expect(() => new AppStoreConnectClient(undefined as any)).toThrow('AppStoreConnectOptions is required');
  });

  it('should set the config for services client', () => {
    new AppStoreConnectClient(mockOptions);
    expect(services.client.setConfig).toHaveBeenCalledWith({ baseUrl: 'https://api.appstoreconnect.apple.com' });
  });

  it('should use provided bearer token', async () => {
    const optionsWithBearerToken = { bearerToken: 'testBearerToken' };
    const client = new AppStoreConnectClient(optionsWithBearerToken);
    const token = await client['getToken']();
    expect(token).toBe('testBearerToken');
  });

  it('should generate a new bearer token if not provided', async () => {
    const client = new AppStoreConnectClient(mockOptions);
    const generateAuthToken = client['generateAuthToken'] = jest.fn();
    generateAuthToken.mockResolvedValue('generatedBearerToken');
    const token = await client['getToken']();
    expect(generateAuthToken).toHaveBeenCalledWith('testIssuerId', 'testPrivateKeyId', 'testPrivateKey', 600);
    expect(token).toBe('generatedBearerToken');
  });

  it('should throw an error if required options for generating a token are missing', async () => {
    const incompleteOptions = { issuerId: 'testIssuerId' };
    const client = new AppStoreConnectClient(incompleteOptions as any);
    await expect(client['getToken']()).rejects.toThrow('Bearer token or private key information is required to generate a token');
  });

  it('should reuse the existing token if it is not expired', async () => {
    const client = new AppStoreConnectClient(mockOptions);
    const generateAuthToken = client['generateAuthToken'] = jest.fn();
    generateAuthToken.mockResolvedValue('generatedBearerToken');
    client['bearerToken'] = 'existingToken';
    client['bearerTokenGeneratedAt'] = Date.now();
    const token = await client['getToken']();
    expect(token).toBe('existingToken');
    expect(generateAuthToken).not.toHaveBeenCalled();
  });

  it('should generate a new token if the existing token is expired', async () => {
    const client = new AppStoreConnectClient(mockOptions);
    const generateAuthToken = client['generateAuthToken'] = jest.fn();
    generateAuthToken.mockResolvedValue('newGeneratedToken');
    client['bearerToken'] = 'expiredToken';
    client['bearerTokenGeneratedAt'] = Date.now() - 700000; // Token expired
    const token = await client['getToken']();
    expect(generateAuthToken).toHaveBeenCalled();
    expect(token).toBe('newGeneratedToken');
  });

  it('should expose all api methods', () => {
    const client = new AppStoreConnectClient(mockOptions);
    expect(client.api).toEqual(services);
  });
});