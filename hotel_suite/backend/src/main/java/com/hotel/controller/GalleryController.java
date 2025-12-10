package com.hotel.controller;

import com.hotel.entity.GalleryImage;
import com.hotel.service.GalleryService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/gallery")
public class GalleryController {

    @Autowired
    private GalleryService galleryService;

    @GetMapping
    public ResponseEntity<List<GalleryImage>> getAllImages() {
        List<GalleryImage> images = galleryService.getAllImages();
        return ResponseEntity.ok(images);
    }

    @PostMapping
    public ResponseEntity<?> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam("description") String description) {
        try {
            GalleryImage image = galleryService.uploadImage(file, description);
            return ResponseEntity.status(HttpStatus.CREATED).body(image);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        }
    }

    @DeleteMapping("/{imageId}")
    public ResponseEntity<?> deleteImage(@PathVariable Long imageId) {
        try {
            galleryService.deleteImage(imageId);
            return ResponseEntity.ok(Map.of("message", "Image deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "NOT_FOUND", "message", e.getMessage()));
        }
    }

    @DeleteMapping("/bulk")
    public ResponseEntity<?> deleteImages(@RequestBody List<Long> imageIds) {
        try {
            galleryService.deleteImages(imageIds);
            return ResponseEntity.ok(Map.of("message", "Images deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "BAD_REQUEST", "message", e.getMessage()));
        }
    }
}

