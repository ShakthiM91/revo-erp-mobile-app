import { db as pendingWritesDb } from '@/db/pendingWrites'
import { db as readCacheDb } from '@/db/readCache'

/**
 * Remove user/session data persisted on the device (not server).
 * Call after logout API while token is still valid, or after resetState on session expiry.
 */
export async function clearAllClientStorage() {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.clear()
  } catch (e) {
    console.warn('sessionStorage.clear failed', e)
  }

  try {
    localStorage.clear()
  } catch (e) {
    console.warn('localStorage.clear failed', e)
  }

  try {
    await pendingWritesDb.delete()
  } catch (e) {
    console.warn('RevoPendingWrites DB delete failed', e)
  }
  try {
    await pendingWritesDb.open()
  } catch (e) {
    console.warn('RevoPendingWrites DB reopen failed', e)
  }

  try {
    await readCacheDb.delete()
  } catch (e) {
    console.warn('RevoReadCache DB delete failed', e)
  }
  try {
    await readCacheDb.open()
  } catch (e) {
    console.warn('RevoReadCache DB reopen failed', e)
  }
}
