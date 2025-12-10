import { apiClient } from './client'

export interface GalleryImage {
  id: number
  imageUrl: string
  description: string
  createdAt: string
}

export const galleryApi = {
  getAll: () =>
    apiClient.get<GalleryImage[]>('/gallery'),
  
  upload: (file: File, description: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('description', description)
    
    return apiClient.post<GalleryImage>('/gallery', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  delete: (id: number) =>
    apiClient.delete(`/gallery/${id}`),
  
  bulkDelete: (ids: number[]) =>
    apiClient.delete('/gallery/bulk', { data: ids })
}