import { toastController, alertController } from '@ionic/vue'

export async function showToast(message) {
  const toast = await toastController.create({ message, duration: 2000 })
  await toast.present()
}

export async function showConfirmDialog({ title, message }) {
  return new Promise((resolve, reject) => {
    alertController
      .create({
        header: title,
        message,
        buttons: [
          { text: 'Cancel', role: 'cancel', handler: () => reject('cancel') },
          { text: 'OK', role: 'confirm', handler: () => resolve() }
        ]
      })
      .then((alert) => alert.present())
  })
}
