package org.example.rentathingproba.unit.email;

import org.example.rentathingproba.email.central.ListingAction;
import org.example.rentathingproba.email.central.ListingEvent;
import org.example.rentathingproba.email.central.ListingEventPublisher;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ListingEventPublisherTest {

    @Mock
    private ApplicationEventPublisher applicationEventPublisher;

    @InjectMocks
    private ListingEventPublisher listingEventPublisher;

    @Test
    void shouldPublishListingEventWithCorrectFields() {
        listingEventPublisher.publish(this, 42L, "owner@test.com", "ownerName", ListingAction.CREATE);

        ArgumentCaptor<ListingEvent> captor = ArgumentCaptor.forClass(ListingEvent.class);
        verify(applicationEventPublisher).publishEvent(captor.capture());

        ListingEvent published = captor.getValue();
        assertThat(published.getListingId()).isEqualTo(42L);
        assertThat(published.getOwnerEmail()).isEqualTo("owner@test.com");
        assertThat(published.getOwnerUsername()).isEqualTo("ownerName");
        assertThat(published.getAction()).isEqualTo(ListingAction.CREATE);
    }
}
