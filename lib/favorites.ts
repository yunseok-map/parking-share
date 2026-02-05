import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { UserFavorite } from './types';

// 즐겨찾기 추가
export async function addFavorite(userId: string, parkingId: string): Promise<void> {
  try {
    // 이미 즐겨찾기 되어있는지 확인
    const existing = await isFavorited(userId, parkingId);
    if (existing) {
      throw new Error('이미 즐겨찾기에 추가되어 있습니다.');
    }

    await addDoc(collection(db, 'favorites'), {
      userId,
      parkingId,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('즐겨찾기 추가 실패:', error);
    throw error;
  }
}

// 즐겨찾기 삭제
export async function removeFavorite(userId: string, parkingId: string): Promise<void> {
  try {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
      where('parkingId', '==', parkingId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('즐겨찾기를 찾을 수 없습니다.');
    }

    // 모든 매칭되는 문서 삭제 (보통 1개지만 혹시 모를 중복 대비)
    const deletePromises = querySnapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, 'favorites', docSnapshot.id))
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('즐겨찾기 삭제 실패:', error);
    throw error;
  }
}

// 즐겨찾기 여부 확인
export async function isFavorited(userId: string, parkingId: string): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId),
      where('parkingId', '==', parkingId)
    );
    
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('즐겨찾기 확인 실패:', error);
    return false;
  }
}

// 사용자의 모든 즐겨찾기 목록 가져오기
export async function getUserFavorites(userId: string): Promise<UserFavorite[]> {
  try {
    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as UserFavorite));
  } catch (error) {
    console.error('즐겨찾기 목록 가져오기 실패:', error);
    return [];
  }
}

// 즐겨찾기 토글 (있으면 삭제, 없으면 추가)
export async function toggleFavorite(userId: string, parkingId: string): Promise<boolean> {
  try {
    const favorited = await isFavorited(userId, parkingId);
    
    if (favorited) {
      await removeFavorite(userId, parkingId);
      return false; // 삭제됨
    } else {
      await addFavorite(userId, parkingId);
      return true; // 추가됨
    }
  } catch (error) {
    console.error('즐겨찾기 토글 실패:', error);
    throw error;
  }
}
