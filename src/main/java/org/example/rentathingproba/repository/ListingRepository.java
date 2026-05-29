package org.example.rentathingproba.repository;

import org.example.rentathingproba.entities.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {

 @Query("SELECT l FROM Listing l JOIN l.things t " +
         "WHERE (LOWER(t.name) LIKE LOWER(CONCAT('%', :query, '%')) " +
         "    OR LOWER(t.category) LIKE LOWER(CONCAT('%', :query, '%'))) " +
         "AND l.isAvailable = true")
 List<Listing> findByTitle(String query);

 List<Listing> findByUserId(Long userId);

 List<Listing> findByUserIdAndIsAvailableTrue(Long userId);

 @Query(value = "SELECT * FROM listings WHERE is_available = true ORDER BY RANDOM() LIMIT 3",
         nativeQuery = true)
 List<Listing> findRecommended();


 @Query("SELECT DISTINCT l FROM Listing l " +
         "JOIN FETCH l.things t " +
         "LEFT JOIN FETCH t.images " +
         "WHERE l.isAvailable = true")
 List<Listing> findAllAvailableWithThings();


 @Query("SELECT DISTINCT l FROM Listing l " +
         "JOIN FETCH l.things t " +
         "LEFT JOIN FETCH t.images " +
         "WHERE l.isAvailable = true " +
         "AND LOWER(t.category) = LOWER(:category)")
 List<Listing> findAvailableByCategory(@Param("category") String category);
}