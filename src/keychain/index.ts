import keytar from 'keytar'

export const SERVICE_NAME = 'harbor'

// ADR 0006: keytar no OS keychain. get/set/delete por service+account.
// Sem credenciais hardcoded; apenas interface estável.

export async function getCredential(account: string): Promise<string | null> {
  return keytar.getPassword(SERVICE_NAME, account)
}

export async function setCredential(account: string, password: string): Promise<void> {
  await keytar.setPassword(SERVICE_NAME, account, password)
}

export async function deleteCredential(account: string): Promise<void> {
  await keytar.deletePassword(SERVICE_NAME, account)
}