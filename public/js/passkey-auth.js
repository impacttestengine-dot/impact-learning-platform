import "/js/impact-firebase-store.js?v=firebase-final-001";

export async function validatePasskey(passkeyValue, gate){
  return await window.ImpactFirebaseStore.validatePasskey(passkeyValue, gate);
}
