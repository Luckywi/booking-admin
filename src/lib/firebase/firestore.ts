import { db } from './config';
import { doc, getDoc, setDoc, collection } from 'firebase/firestore';
import { UserData } from '@/types/auth';

export async function getUserData(uid: string): Promise<UserData | null> {
  try {
    const usersRef = collection(db, 'users'); // explicitement définir la collection
    const userDoc = await getDoc(doc(usersRef, uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function createUserData(userData: UserData): Promise<boolean> {
  try {
    const usersRef = collection(db, 'users'); // explicitement définir la collection
    const userRef = doc(usersRef, userData.uid);
    
    await setDoc(userRef, {
      uid: userData.uid,
      email: userData.email,
      role: userData.role,
      businessId: userData.businessId,
      businessName: userData.businessName
    });
    
    return true;
  } catch (error) {
    console.error('Error creating user data:', error);
    throw error;
  }
}