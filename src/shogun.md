# Shogun SDK Documentation

## Overview

The Shogun SDK is a decentralized authentication protocol that implements a 3-layer authentication system. It supports various authentication methods including standard username/password, MetaMask, and WebAuthn. The SDK also provides wallet management features and integrates with GunDB for decentralized user authentication.

## Classes

### ShogunSDK

#### Methods

- `constructor(config: ShogunSDKConfig)`
  - Initializes the Shogun SDK with the provided configuration.
  - `config`: Configuration object for the SDK.

- `isLoggedIn(): boolean`
  - Checks if the user is logged in.
  - Returns `true` if the user is logged in, `false` otherwise.

- `logout(): void`
  - Logs out the current user.

- `login(username: string, password: string): Promise<AuthResult>`
  - Logs in a user with the provided username and password.
  - `username`: The username of the user.
  - `password`: The password of the user.
  - Returns an `AuthResult` object containing the result of the login attempt.

- `signUp(username: string, password: string, passwordConfirmation?: string): Promise<SignUpResult>`
  - Registers a new user with the provided username and password.
  - `username`: The username of the new user.
  - `password`: The password of the new user.
  - `passwordConfirmation`: Optional password confirmation.
  - Returns a `SignUpResult` object containing the result of the registration attempt.

- `isWebAuthnSupported(): boolean`
  - Checks if WebAuthn is supported by the browser.
  - Returns `true` if WebAuthn is supported, `false` otherwise.

- `loginWithWebAuthn(username: string): Promise<AuthResult>`
  - Logs in a user with WebAuthn.
  - `username`: The username of the user.
  - Returns an `AuthResult` object containing the result of the login attempt.

- `signUpWithWebAuthn(username: string): Promise<AuthResult>`
  - Registers a new user with WebAuthn.
  - `username`: The username of the new user.
  - Returns an `AuthResult` object containing the result of the registration attempt.

- `loginWithMetaMask(address: string): Promise<AuthResult>`
  - Logs in a user with MetaMask.
  - `address`: The Ethereum address of the user.
  - Returns an `AuthResult` object containing the result of the login attempt.

- `signUpWithMetaMask(address: string): Promise<AuthResult>`
  - Registers a new user with MetaMask.
  - `address`: The Ethereum address of the new user.
  - Returns an `AuthResult` object containing the result of the registration attempt.

- `signMessage(wallet: ethers.Wallet, message: string | Uint8Array): Promise<string>`
  - Signs a message with the provided wallet.
  - `wallet`: The wallet to use for signing.
  - `message`: The message to sign.
  - Returns the signed message as a string.

- `verifySignature(message: string | Uint8Array, signature: string): string`
  - Verifies a signature.
  - `message`: The signed message.
  - `signature`: The signature to verify.
  - Returns the address that signed the message.

- `signTransaction(wallet: ethers.Wallet, toAddress: string, value: string): Promise<string>`
  - Signs a transaction with the provided wallet.
  - `wallet`: The wallet to use for signing.
  - `toAddress`: The recipient address.
  - `value`: The value to send.
  - Returns the signed transaction as a string.

- `exportMnemonic(password?: string): Promise<string>`
  - Exports the user's mnemonic.
  - `password`: Optional password to encrypt the exported data.
  - Returns the exported mnemonic as a string.

- `exportWalletKeys(password?: string): Promise<string>`
  - Exports the private keys of all wallets.
  - `password`: Optional password to encrypt the exported data.
  - Returns the exported wallet keys as a string.

- `exportGunPair(password?: string): Promise<string>`
  - Exports the user's Gun pair.
  - `password`: Optional password to encrypt the exported data.
  - Returns the exported Gun pair as a string.

- `exportAllUserData(password: string): Promise<string>`
  - Exports all user data in a single file.
  - `password`: Password to encrypt the exported data.
  - Returns the exported data as a string.

- `importMnemonic(mnemonicData: string, password?: string): Promise<boolean>`
  - Imports a mnemonic.
  - `mnemonicData`: The mnemonic or encrypted JSON to import.
  - `password`: Optional password to decrypt the mnemonic if encrypted.
  - Returns `true` if the import was successful, `false` otherwise.


