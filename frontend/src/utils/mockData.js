export const mockData = {
  entities: [
    {
      id: '1',
      name: 'Tech Consultancy Group AB',
      idNumber: '559378-9341',
      type: 'company',
      position: { x: 400, y: 300 }
    },
    {
      id: '2',
      name: 'Edward Montgomery',
      idNumber: '19750720-4578',
      type: 'person',
      position: { x: 200, y: 150 }
    },
    {
      id: '3',
      name: 'Tech Holdings AB',
      idNumber: '559245-4937',
      type: 'company',
      position: { x: 600, y: 150 }
    },
    {
      id: '4',
      name: 'Innovation Chart LLC with Very Long Business Name',
      idNumber: 'C716984',
      type: 'company',
      position: { x: 400, y: 450 }
    }
  ],
  connections: [
    {
      id: 'conn1',
      from: '2',
      to: '1',
      percentage: 60
    },
    {
      id: 'conn2',
      from: '3',
      to: '1',
      percentage: 40
    },
    {
      id: 'conn3',
      from: '1',
      to: '4',
      percentage: 100
    }
  ]
};