package com.hotel.service;

import com.hotel.entity.GalleryImage;
import com.hotel.repository.GalleryImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class GalleryService {

    @Autowired
    private GalleryImageRepository galleryImageRepository;
    
    @Autowired
    private FileUploadService fileUploadService;

    public List<GalleryImage> getAllImages() {
        return galleryImageRepository.findAll();
    }

    public GalleryImage uploadImage(MultipartFile file, String description) throws IOException {
        String imageUrl = fileUploadService.uploadFile(file);
        
        GalleryImage image = new GalleryImage();
        image.setImageUrl(imageUrl);
        image.setDescription(description);
        
        return galleryImageRepository.save(image);
    }

    public void deleteImage(Long id) {
        Optional<GalleryImage> imageOpt = galleryImageRepository.findById(id);
        if (imageOpt.isEmpty()) {
            throw new RuntimeException("Image not found");
        }
        
        GalleryImage image = imageOpt.get();
        try {
            fileUploadService.deleteFile(image.getImageUrl());
        } catch (IOException e) {
            // Log error but continue with database deletion
        }
        
        galleryImageRepository.deleteById(id);
    }

    public Optional<GalleryImage> getImageById(Long id) {
        return galleryImageRepository.findById(id);
    }
    
    public void deleteImages(List<Long> imageIds) {
        for (Long imageId : imageIds) {
            Optional<GalleryImage> imageOpt = galleryImageRepository.findById(imageId);
            if (imageOpt.isPresent()) {
                GalleryImage image = imageOpt.get();
                try {
                    fileUploadService.deleteFile(image.getImageUrl());
                } catch (IOException e) {
                    // Log error but continue
                }
                galleryImageRepository.deleteById(imageId);
            }
        }
    }
}

