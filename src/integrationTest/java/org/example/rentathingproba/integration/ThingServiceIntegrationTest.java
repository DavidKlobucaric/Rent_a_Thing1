package org.example.rentathingproba.integration;

import org.example.rentathingproba.dto.ThingDTO;
import org.example.rentathingproba.entities.Thing;
import org.example.rentathingproba.entities.User;
import org.example.rentathingproba.exceptions.ThingNotFoundException;
import org.example.rentathingproba.exceptions.ThingOwnershipException;
import org.example.rentathingproba.repository.ThingRepository;
import org.example.rentathingproba.repository.UserRepository;
import org.example.rentathingproba.responses.ThingResponseDTO;
import org.example.rentathingproba.service.application.ThingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.*;

import java.util.List;

@SpringBootTest
@ActiveProfiles("integration")
@Transactional
@DisplayName("ThingService Integration Tests")
class ThingServiceIntegrationTest {

    @Autowired
    private ThingService thingService;
    @Autowired
    private ThingRepository thingRepository;
    @Autowired
    private UserRepository userRepository;

    private User owner;
    private User otherUser;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .username("owner_thing_int")
                .email("owner_thing_int@example.com")
                .password("encodedPassword")
                .enabled(true)
                .build();
        otherUser = User.builder()
                .username("other_thing_int")
                .email("other_thing_int@example.com")
                .password("encodedPassword")
                .enabled(true)
                .build();
        owner = userRepository.save(owner);
        otherUser = userRepository.save(otherUser);
    }

    private ThingDTO buildDto(String name) {
        ThingDTO dto = new ThingDTO();
        dto.setName(name);
        dto.setCategory("Tools");
        dto.setDescription("A test thing");
        dto.setImageUrls(List.of("http://img.test/1.jpg"));
        return dto;
    }

    //Create thing
    @Test
    @DisplayName("createThing: persists thing to database and returns response with generated ID")
    void createThing_persistsThingToDatabase() {
        ThingResponseDTO result = thingService.createThing(buildDto("Drill"), owner);

        assertThat(result.getThingId()).isNotNull();
        assertThat(result.getName()).isEqualTo("Drill");
        assertThat(result.getUserId()).isEqualTo(owner.getId());
        assertThat(thingRepository.findById(result.getThingId())).isPresent();
    }

    //Get thing by ID
    @Test
    @DisplayName("getThingById: retrieves existing thing from database")
    void getThingById_retrievesExistingThing() {
        ThingResponseDTO created = thingService.createThing(buildDto("Saw"), owner);

        ThingResponseDTO found = thingService.getThingById(created.getThingId());

        assertThat(found.getName()).isEqualTo("Saw");
    }

    @Test
    @DisplayName("getThingById: throws ThingNotFoundException for non-existent ID")
    void getThingById_throwsForNonExistentId() {
        assertThatThrownBy(() -> thingService.getThingById(999999L))
                .isInstanceOf(ThingNotFoundException.class);
    }

    //Get thing by User
    @Test
    @DisplayName("getThingByUser: returns only things belonging to the requested user")
    void getThingByUser_returnsOnlyOwnerThings() {
        thingService.createThing(buildDto("Hammer"), owner);
        thingService.createThing(buildDto("Wrench"), owner);
        thingService.createThing(buildDto("Pliers"), otherUser);

        List<ThingResponseDTO> ownerThings = thingService.getThingByUser(owner.getId());

        assertThat(ownerThings).hasSize(2);
        assertThat(ownerThings).extracting(ThingResponseDTO::getName)
                .containsExactlyInAnyOrder("Hammer", "Wrench");
    }

    //Update thing
    @Test
    @DisplayName("updateThing: updates and persists changes to database")
    void updateThing_persistsUpdatedValues() {
        ThingResponseDTO created = thingService.createThing(buildDto("OldName"), owner);
        ThingDTO updateDto = buildDto("NewName");
        updateDto.setCategory("Electronics");

        ThingResponseDTO updated = thingService.updateThing(created.getThingId(), updateDto, owner);

        assertThat(updated.getName()).isEqualTo("NewName");
        assertThat(updated.getCategory()).isEqualTo("Electronics");

        Thing inDb = thingRepository.findById(created.getThingId()).orElseThrow();
        assertThat(inDb.getName()).isEqualTo("NewName");
    }

    @Test
    @DisplayName("updateThing: throws ThingOwnershipException when non-owner tries to update")
    void updateThing_throwsOwnershipExceptionForNonOwner() {
        ThingResponseDTO created = thingService.createThing(buildDto("Drill"), owner);

        assertThatThrownBy(() -> thingService.updateThing(created.getThingId(), buildDto("Hacked"), otherUser))
                .isInstanceOf(ThingOwnershipException.class);
    }

    //Delete Thing
    @Test
    @DisplayName("deleteThing: removes thing from database when owner deletes it")
    void deleteThing_removesThingFromDatabase() {
        ThingResponseDTO created = thingService.createThing(buildDto("TempThing"), owner);
        Long id = created.getThingId();

        thingService.deleteThing(id, owner);

        assertThat(thingRepository.findById(id)).isEmpty();
    }

    @Test
    @DisplayName("deleteThing: throws ThingOwnershipException when non-owner tries to delete")
    void deleteThing_throwsOwnershipExceptionForNonOwner() {
        ThingResponseDTO created = thingService.createThing(buildDto("Protected"), owner);

        assertThatThrownBy(() -> thingService.deleteThing(created.getThingId(), otherUser))
                .isInstanceOf(ThingOwnershipException.class);
        assertThat(thingRepository.findById(created.getThingId())).isPresent();
    }
}
