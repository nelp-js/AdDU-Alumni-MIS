/**
 * Shared event data for Events list and EventView detail page.
 * Only events that lead to an event detail page are listed.
 */
export const events = [
    {
        id: 4,
        image: '/ateneo homecoming 2.jpg',
        title: 'Grand Alumni Homecoming 2025',
        date: 'July 30, 2025',
        location: 'Cafe Julieta, Juna Subdivision',
        tagline: 'Join fellow alumni for a weekend of pride, connection, and celebration—right here in Davao City.',
        description: 'Experience a full lineup of activities, including alumni talks on technology and innovation, student showcases, the Alumni Excellence Awards, campus heritage tours, and networking mixers. Relive cherished traditions like batch reunion dinners, the Homecoming Gala, and the All-Alumni Celebration Night.',
        registrationDeadline: 'Monday, June 30, 2025',
        venueAddress: 'Cafe Julieta in\n188 Tulip Drive,\nJuna Subdivision,\nMatina 8000,\nDavao City',
        organizerName: 'Honeydei Nakagawa (MS \'95)',
        cost: 'P3000',
        startTime: '6:00 pm',
        endTime: '8:15 pm',
        detailsDate: 'Wednesday, July 30, 2025',
        registerUrl: '#register',
    },
];

export function getEventById(id) {
    const numId = Number(id);
    return events.find((e) => e.id === numId) || null;
}
