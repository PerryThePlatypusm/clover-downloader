// Lightweight Firestore stub to prevent any gRPC Listen stream connection attempts
export function getFirestore(...args: any[]): any {
  return {};
}

export function doc(...args: any[]): any {
  return {};
}

export function setDoc(...args: any[]): Promise<void> {
  return Promise.resolve();
}

export function getDoc(...args: any[]): Promise<any> {
  return Promise.resolve({ exists: () => false, data: () => ({}) });
}

export function disableNetwork(...args: any[]): Promise<void> {
  return Promise.resolve();
}

export class Firestore {}
