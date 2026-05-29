package org.example.rentathingproba.integration;

import org.example.rentathingproba.dto.ListingDTO;
import org.example.rentathingproba.dto.ThingDTO;
import org.example.rentathingproba.entities.User;
import org.example.rentathingproba.exceptions.ListingOwnershipException;
import org.example.rentathingproba.exceptions.ThingNotFoundException;
import org.example.rentathingproba.exceptions.ThingOwnershipException;
import org.example.rentathingproba.repository.ListingRepository;
import org.example.rentathingproba.repository.UserRepository;
import org.example.rentathingproba.responses.ListingResponseDTO;
import org.example.rentathingproba.responses.ThingResponseDTO;
import org.example.rentathingproba.service.application.ListingService;
import org.example.rentathingproba.service.application.ThingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.*;

import java.math.BigDecimal;
import java.util.List;

@SpringBootTest
@ActiveProfiles("integration")
@Transactional
@DisplayName("ListingService Integration Tests")
class ListingServiceIntegrationTest {
    @Autowired
    private ListingService listingService;
    @Autowired
    private ThingService thingService;
    @Autowired
    private ListingRepository listingRepository;
    @Autowired
    private UserRepository userRepository;

    private User owner;
    private User otherUser;
    private ThingResponseDTO ownerThing;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .username("list_owner_int")
                .email("list_owner_int@example.com")
                .password("encodedPassword")
                .enabled(true)
                .build();
        otherUser = User.builder()
                .username("list_other_int")
                .email("list_other_int@example.com")
                .password("encodedPassword")
                .enabled(true)
                .build();
        owner = userRepository.save(owner);
        otherUser = userRepository.save(otherUser);

        ThingDTO thingDto = new ThingDTO();
        thingDto.setName("Drill");
        thingDto.setCategory("Tools");
        thingDto.setDescription("A drill");
        thingDto.setImageUrls(List.of("img.jpg"));
        ownerThing = thingService.createThing(thingDto, owner);
    }

    private ListingDTO buildListingDto() {
        ListingDTO dto = new ListingDTO();
        dto.setThingId(ownerThing.getThingId());
        dto.setPrice(BigDecimal.valueOf(15.00));
        dto.setLocation("Zagreb");
        dto.setSecurityDeposit(BigDecimal.valueOf(50.00));
        return dto;
    }

    //Create listing
    @Test
    @DisplayName("createListing: persists listing to database with isAvailable=true")
    void createListing_persistsListingWithAvailableTrue() {
        ListingResponseDTO result = listingService.createListing(buildListingDto(), owner);

        assertThat(result.getListingId()).isNotNull();
        assertThat(result.isAvailable()).isTrue();
        assertThat(result.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(15.00));
        assertThat(listingRepository.findById(result.getListingId())).isPresent();
    }

    @Test
    @DisplayName("createListing: throws ThingNotFoundException for non-existent thing")
    void createListing_throwsThingNotFound() {
        ListingDTO dto = buildListingDto();
        dto.setThingId(999999L);

        assertThatThrownBy(() -> listingService.createListing(dto, owner))
                .isInstanceOf(ThingNotFoundException.class);
    }

    @Test
    @DisplayName("createListing: throws ThingOwnershipException when user doesn't own the thing")
    void createListing_throwsThingOwnershipForNonOwner() {
        assertThatThrownBy(() -> listingService.createListing(buildListingDto(), otherUser))
                .isInstanceOf(ThingOwnershipException.class);
    }

    //Update listing
    @Test
    @DisplayName("updateListing: updates price and location in the database")
    void updateListing_updatesFieldsInDatabase() {
        ListingResponseDTO created = listingService.createListing(buildListingDto(), owner);

        ListingDTO updateDto = buildListingDto();
        updateDto.setPrice(BigDecimal.valueOf(25.00));
        updateDto.setLocation("Split");

        ListingResponseDTO updated = listingService.updateListing(created.getListingId(), updateDto, owner);

        assertThat(updated.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(25.00));
        assertThat(updated.getLocation()).isEqualTo("Split");
    }

    @Test
    @DisplayName("updateListing: throws ListingOwnershipException for non-owner")
    void updateListing_throwsOwnershipForNonOwner() {
        ListingResponseDTO created = listingService.createListing(buildListingDto(), owner);

        assertThatThrownBy(() -> listingService.updateListing(created.getListingId(), buildListingDto(), otherUser))
                .isInstanceOf(ListingOwnershipException.class);
    }

    //Is it available
    @Test
    @DisplayName("isItAvailable: toggles listing availability in database")
    void isItAvailable_togglesPersistsToDatabase() {
        ListingResponseDTO created = listingService.createListing(buildListingDto(), owner);
        assertThat(created.isAvailable()).isTrue();

        listingService.isItAvailable(created.getListingId(), owner);

        var listing = listingRepository.findById(created.getListingId()).orElseThrow();
        assertThat(listing.getIsAvailable()).isFalse();
    }

    @Test
    @DisplayName("isItAvailable: throws ListingOwnershipException for non-owner")
    void isItAvailable_throwsOwnershipForNonOwner() {
        ListingResponseDTO created = listingService.createListing(buildListingDto(), owner);

        assertThatThrownBy(() -> listingService.isItAvailable(created.getListingId(), otherUser))
                .isInstanceOf(ListingOwnershipException.class);
    }

    //Search listing
    @Test
    @DisplayName("searchListing: finds listing by thing name fragment (case-insensitive)")
    void searchListing_findsByThingName() {
        listingService.createListing(buildListingDto(), owner);

        List<ListingResponseDTO> results = listingService.searchListing("dri");

        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getName()).containsIgnoringCase("Drill");
    }

    @Test
    @DisplayName("searchListing: returns empty list when query matches nothing")
    void searchListing_returnsEmptyForNoMatch() {
        listingService.createListing(buildListingDto(), owner);

        List<ListingResponseDTO> results = listingService.searchListing("zzznomatch");

        assertThat(results).isEmpty();
    }

    //Get user listing
    @Test
    @DisplayName("getUserListing: returns only listings for the specified user")
    void getUserListing_returnsOnlyUserListings() {
        listingService.createListing(buildListingDto(), owner);

        List<ListingResponseDTO> results = listingService.getUserListing(owner.getId());

        assertThat(results).isNotEmpty();
        assertThat(results).allMatch(r -> r.getUserId().equals(owner.getId()));
    }
}
