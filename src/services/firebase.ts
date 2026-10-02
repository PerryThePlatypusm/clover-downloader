import { safeLocalStorage } from '../utils/storage';

export async function signInAsJacobPerryGoogle(): Promise<any> {
  const uid = 'usr_clover_owner_' + Date.now();
  const userData = {
    id: uid,
    uid,
    username: 'clover',
    email: 'jacobperry27@gmail.com',
    avatarColor: 'from-purple-500 to-indigo-600',
    joinedAt: new Date().toISOString(),
    downloadsCount: 0,
    notesSentCount: 0,
    twoFactorEnabled: true,
    role: 'owner',
  };

  safeLocalStorage.setItem('clover_current_user', JSON.stringify(userData));
  return userData;
}

export async function signInWithGoogleDev() {
  return signInAsJacobPerryGoogle();
}
