export const teams = [
  {
    id: 't1',
    name: 'Solna Hockey',
    type: 'Veteran',
    contact: 'Robban',
    email: 'robban@solnahockey.se',
    location: 'Solna',
    region: 'Stockholm',
    lat: 59.367,
    lng: 18.005,
    calendarUrl: '',
    favoriteGoalies: ['g1'],
    sessions: [
      { id: 's1', date: '2026-03-10', time: '20:00', type: 'Träning', rink: 'Solnahallen', needsGoalie: true },
      { id: 's2', date: '2026-03-12', time: '21:00', type: 'Träning', rink: 'Solnahallen', needsGoalie: false },
      { id: 's3', date: '2026-03-14', time: '19:30', type: 'Match', rink: 'Solnahallen', needsGoalie: true },
    ],
  },
  {
    id: 't2',
    name: 'Hässelby Hockey',
    type: 'Veteran',
    contact: 'TBD',
    email: '',
    location: 'Hässelby',
    region: 'Stockholm',
    lat: 59.363,
    lng: 17.833,
    calendarUrl: '',
    favoriteGoalies: [],
    sessions: [
      { id: 's4', date: '2026-03-11', time: '19:00', type: 'Träning', rink: 'Hässelbyhallen', needsGoalie: true },
      { id: 's5', date: '2026-03-13', time: '20:30', type: 'Träning', rink: 'Hässelbyhallen', needsGoalie: false },
    ],
  },
]

export const goalies = [
  {
    id: 'g1',
    name: 'Rikard',
    email: 'rikard@hobbyhockey.se',
    phone: '070-123 45 67',
    location: 'Solna',
    region: 'Stockholm',
    lat: 59.367,
    lng: 18.005,
    available: true,
  },
]

export const requests = [
  {
    id: 'r1',
    teamId: 't1',
    sessionId: 's1',
    type: 'favorites',
    status: 'open',
    createdAt: '2026-03-07T10:00:00',
    responses: [],
  },
  {
    id: 'r2',
    teamId: 't2',
    sessionId: 's4',
    type: 'open',
    status: 'open',
    createdAt: '2026-03-07T11:00:00',
    responses: [],
  },
]
