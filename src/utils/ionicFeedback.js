import { toastController, alertController, actionSheetController } from '@ionic/vue'

export async function showActionSheet({ header, buttons }) {
  const sheet = await actionSheetController.create({ header, buttons })
  await sheet.present()
  const { role } = await sheet.onDidDismiss()
  return role
}

export async function showToast(message) {
  const toast = await toastController.create({
    message,
    duration: 2000,
    position: 'top',
    cssClass: 'toast-center'
  })
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
