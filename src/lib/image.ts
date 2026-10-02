'use client';

// Charge une image, la redimensionne (côté max `taille`) et renvoie un data-URI
// compact — utilisable directement comme `logoUrl` (string) ou dans <img src>.
export function fichierVersDataUri(fichier: File, taille = 256, qualite = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fichier.type.startsWith('image/')) {
      reject(new Error('Le fichier doit être une image.'));
      return;
    }
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, taille / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Traitement image indisponible.'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const png = fichier.type === 'image/png';
      resolve(canvas.toDataURL(png ? 'image/png' : 'image/jpeg', png ? undefined : qualite));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image illisible.'));
    };
    img.src = url;
  });
}
