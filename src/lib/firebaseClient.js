import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

let db = null;
export function initFirebase(config){
  try{
    if(!config) return null;
    if(typeof config === 'string') config = JSON.parse(config);
    if (!getApps().length) initializeApp(config);
    db = getFirestore();
    return db;
  }catch(e){ console.warn('init firebase', e); return null; }
}

export async function logSearch(payload){
  try{
    if(!db){
      const conf = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
      if(conf) initFirebase(conf);
    }
    if(!db) return;
    await addDoc(collection(db,'searches'), {...payload, createdAt: serverTimestamp()});
  }catch(e){ console.warn('logSearch failed', e); }
}
