'use client';

import { openDB } from 'idb';

const DB_NAME = 'ai-pose-db';
const DB_VERSION = 1;

let dbPromise;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Poses store
        if (!db.objectStoreNames.contains('poses')) {
          const poseStore = db.createObjectStore('poses', {
            keyPath: 'id',
            autoIncrement: true,
          });
          poseStore.createIndex('createdAt', 'createdAt');
          poseStore.createIndex('isMine', 'isMine');
        }

        // Photos store
        if (!db.objectStoreNames.contains('photos')) {
          const photoStore = db.createObjectStore('photos', {
            keyPath: 'id',
            autoIncrement: true,
          });
          photoStore.createIndex('createdAt', 'createdAt');
          photoStore.createIndex('poseId', 'poseId');
        }
      },
    });
  }
  return dbPromise;
}

// ========== POSES ==========

export async function addPose({ name, imageBlob, thumbnailBlob, originalImageBlob }) {
  const db = await getDB();
  const id = await db.add('poses', {
    name,
    imageBlob,
    thumbnailBlob,
    originalImageBlob,
    createdAt: new Date().toISOString(),
    isMine: true,
    likes: 0,
  });
  return id;
}

export async function getAllPoses() {
  const db = await getDB();
  const poses = await db.getAll('poses');
  return poses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getPoseById(id) {
  const db = await getDB();
  return db.get('poses', Number(id));
}

export async function deletePose(id) {
  const db = await getDB();
  return db.delete('poses', Number(id));
}

export async function updatePose(id, updates) {
  const db = await getDB();
  const pose = await db.get('poses', Number(id));
  if (!pose) return null;
  const updated = { ...pose, ...updates };
  await db.put('poses', updated);
  return updated;
}

// ========== PHOTOS ==========

export async function addPhoto({ imageBlob, poseId, poseName }) {
  const db = await getDB();
  const id = await db.add('photos', {
    imageBlob,
    poseId,
    poseName,
    createdAt: new Date().toISOString(),
    isFavorite: false,
  });
  return id;
}

export async function getAllPhotos() {
  const db = await getDB();
  const photos = await db.getAll('photos');
  return photos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getPhotoById(id) {
  const db = await getDB();
  return db.get('photos', Number(id));
}

export async function deletePhoto(id) {
  const db = await getDB();
  return db.delete('photos', Number(id));
}

export async function togglePhotoFavorite(id) {
  const db = await getDB();
  const photo = await db.get('photos', Number(id));
  if (!photo) return null;
  photo.isFavorite = !photo.isFavorite;
  await db.put('photos', photo);
  return photo;
}

// ========== UTILITIES ==========

export function blobToUrl(blob) {
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function urlToBlob(url) {
  const res = await fetch(url);
  return res.blob();
}

export function createThumbnail(imageBlob, maxSize = 200) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imageBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        resolve(blob);
      }, 'image/png');
    };
    img.src = url;
  });
}
