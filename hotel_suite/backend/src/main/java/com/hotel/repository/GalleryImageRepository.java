package com.hotel.repository;

import com.hotel.entity.GalleryImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GalleryImageRepository extends JpaRepository<GalleryImage, Long> {
}

