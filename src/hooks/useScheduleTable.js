import { useMemo } from 'react';
import { getMidnightTimestamp, isSameDay, sorter } from '../utils.js';
import { langs } from '../Schedule/constants.js';

export default function useScheduleTable({
    eventTypeId,
    halls = {},
    events = {},
    slots = {},
}) {
    return useMemo(() => {
        const filteredEvents = events.filter(event => eventTypeId > 0 ? event.event_type_id === eventTypeId : true);
        const filteredEventIds = filteredEvents.map(event => event.id);
        const filteredSlots = slots.sort(sorter('starts_at')).filter(slot => filteredEventIds.includes(slot.event_id));
        const days = Array.from(new Set(filteredSlots.map(slot =>
            getMidnightTimestamp(slot.starts_at)
        ))).map(ts => new Date(ts));
        const microslots = Array.from(new Set(filteredSlots.flatMap(slot => [
            slot.starts_at.getTime(),
            slot.ends_at.getTime(),
        ]))).map(ts => new Date(ts)).sort();
        const filteredHallIds = new Set(filteredSlots.map(slot => slot.hall_id));
        const filteredHalls = halls.filter(hall => filteredHallIds.has(hall.id));
        const hallSlots = Object.fromEntries(filteredHalls.map(hall => [
            hall.id,
            filteredSlots.filter(slot => slot.hall_id === hall.id),
        ]));

        void(days);
        void(hallSlots);

        const header = [{
                id: 0,
                name: Object.fromEntries(Object.keys(langs).map(lang => [lang, ''])),
            },
            ...filteredHalls,
        ];

        const rows = microslots.flatMap((date, index, array) => {
            const isFirst = index === 0;
            const isLast = index === array.length - 1;
            const isFirstForTheDay = index > 0 && !isSameDay(date, array[index - 1]);
            const isLastForTheDay = array?.[index + 1] && !isSameDay(date, array[index + 1]);

            const showHeader = isFirst || isFirstForTheDay;
            const showSlot = !isLast && !isLastForTheDay;

            return [
                ...showHeader ? [{
                    id: 'header-'.concat(date.getTime().toString()),
                    cells: [{
                        id: 1,
                        attributes: {
                            colSpan: header.length,
                        },
                        day: date,
                    }]
                }] : [],
                ...showSlot ? [{
                    id: 'slot-'.concat(date.getTime().toString()),
                    cells: [{
                        id: 1,
                        day: date, // TODO replace with slot time
                    }, {
                        id: 2,
                    }],
                    // attributes: {
                    //     className: 'schedule-'.concat(slot.event.language).concat(' ').concat(slot.event.track?.css_class),
                    //     colSpan: 2,
                    // },
                    // event: slot.event,
                }] : [],
            ];
        });

        return {
            header,
            rows,
        };
    }, [eventTypeId, events, halls, slots]);
}
