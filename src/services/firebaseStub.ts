// Comprehensive Firebase & Firestore Stub to prevent any network or gRPC Listen stream errors
export function initializeApp(...args: any[]): any { return {}; }
export function getApps(...args: any[]): any[] { return []; }
export function getAuth(...args: any[]): any { return {}; }
export function GoogleAuthProvider(...args: any[]): void {}
export function signInWithPopup(...args: any[]): Promise<any> { return Promise.reject(new Error('Auth disabled')); }
export function getFirestore(...args: any[]): any { return {}; }
export function doc(...args: any[]): any { return {}; }
export function setDoc(...args: any[]): Promise<void> { return Promise.resolve(); }
export function getDoc(...args: any[]): Promise<any> { return Promise.resolve({ exists: () => false, data: () => ({}) }); }
export function disableNetwork(...args: any[]): Promise<void> { return Promise.resolve(); }
export class Firestore {}
export default { initializeApp, getApps, getAuth, GoogleAuthProvider, signInWithPopup, getFirestore, doc, setDoc, getDoc, disableNetwork, Firestore };
